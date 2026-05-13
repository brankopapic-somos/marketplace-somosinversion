// =============================================================================
// REPO — Capa de datos compartida (catálogo + admin)
//
// Persistencia: localStorage. Si no hay datos en localStorage, hidrata desde
// window.DATA (seeds.js). Toda mutación se escribe a localStorage.
//
// Conforme al modelo en docs/01-MODELO-DATOS.md (con 7 correcciones aplicadas).
// =============================================================================

(function () {
  const STORAGE_KEY = "marketplace.data.v1";
  const AUDIT_KEY = "marketplace.audit.v1";
  const SESSION_KEY = "marketplace.session.v1";

  // ---------------------------------------------------------------------------
  // Hidratación inicial
  // ---------------------------------------------------------------------------
  function hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        // Validación mínima de schema
        if (stored && stored.proyectos && stored.unidades) {
          window.DATA = stored;
          return "localStorage";
        }
      }
    } catch (e) {
      console.warn("Error leyendo localStorage, usando seeds:", e);
    }
    // Fallback: seeds.js ya seteó window.DATA
    return "seeds";
  }

  function persist() {
    try {
      const json = JSON.stringify(window.DATA);
      localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      console.error("Error persistiendo en localStorage:", e);
      const isQuota = e && (e.name === 'QuotaExceededError' || e.code === 22 || /quota/i.test(String(e.message)));
      if (isQuota) {
        // Calcular tamaños para diagnóstico
        const sizes = {};
        let total = 0;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const v = localStorage.getItem(k) || '';
            const bytes = v.length * 2; // UTF-16
            sizes[k] = bytes;
            total += bytes;
          }
        } catch (_) {}
        const totalMb = (total / 1024 / 1024).toFixed(2);
        let breakdown = '';
        Object.entries(sizes).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([k, b]) => {
          breakdown += '\n  · ' + k + ': ' + (b / 1024 / 1024).toFixed(2) + ' MB';
        });
        alert(
          'Storage del navegador lleno (~' + totalMb + ' MB usado, máx 5-10 MB).\n\n' +
          'Top items que ocupan espacio:' + breakdown + '\n\n' +
          'Opciones:\n' +
          ' · Eliminar imágenes pesadas y usar URLs externas (Imgur, Drive)\n' +
          ' · Eliminar comprobantes de transferencia antiguos\n' +
          ' · Exportar datos (Admin → Datos), borrar localStorage, re-importar lo esencial\n' +
          ' · Reducir tamaño de imágenes antes de subirlas (recomendado < 500 KB)\n'
        );
      } else {
        alert("Error guardando en localStorage: " + (e.message || e));
      }
      throw e; // re-lanzar para que el caller sepa que falló
    }
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOG (ingestas)
  // ---------------------------------------------------------------------------
  function getAuditLog() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function addAuditEntry(entry) {
    const log = getAuditLog();
    log.unshift({ ...entry, id: uid("audit"), timestamp: nowIso() });
    if (log.length > 100) log.pop(); // limit history
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log));
  }

  function clearAuditLog() {
    localStorage.removeItem(AUDIT_KEY);
  }

  // ---------------------------------------------------------------------------
  // AUTH + USUARIOS — MOCK para MVP
  // ⚠ NO ES SEGURIDAD PRODUCTIVA. Hash débil, sin verificación, sin backend.
  // Se reemplaza por auth del ecosistema origen al integrar.
  // ---------------------------------------------------------------------------
  const ROLES = ["broker", "admin"];

  /** Hash débil — solo para MVP. NO usar en producción. */
  function hashPassword(pw) {
    const salt = "mvp-celula-marketplace-v1";
    const s = pw + salt;
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    // Double-pass para distribuir mejor
    let h2 = h;
    for (let i = 0; i < s.length; i++) {
      h2 = ((h2 << 7) - h2) + s.charCodeAt(s.length - 1 - i);
      h2 |= 0;
    }
    return "h:" + Math.abs(h).toString(36) + "." + Math.abs(h2).toString(36);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setSession(s) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  function currentUser() {
    const sess = getSession();
    if (!sess) return null;
    const u = (window.DATA.usuarios || []).find(x => x.id === sess.userId);
    return u && u.activo ? u : null;
  }

  function isAuthenticated() { return currentUser() !== null; }

  function hasRole(role) {
    const u = currentUser();
    return u && u.role === role;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function register({ email, password, role, nombre, telefono }) {
    if (!validateEmail(email)) throw new Error("Email inválido");
    if (!password || password.length < 6) throw new Error("Clave: mínimo 6 caracteres");
    if (!ROLES.includes(role)) throw new Error("Rol inválido (broker | admin)");
    if (!nombre || nombre.trim().length < 2) throw new Error("Nombre requerido");

    if (!window.DATA.usuarios) window.DATA.usuarios = [];
    const normalizedEmail = email.toLowerCase().trim();
    if (window.DATA.usuarios.some(u => u.email === normalizedEmail))
      throw new Error("Ya existe una cuenta con ese email");

    const user = {
      id: uid("us"),
      email: normalizedEmail,
      password_hash: hashPassword(password),
      role,
      nombre: nombre.trim(),
      telefono: telefono || null,
      activo: true,
      created_at: nowIso(),
      last_login_at: null
    };
    window.DATA.usuarios.push(user);
    persist();
    // Auto-login después del registro
    setSession({ userId: user.id, email: user.email, role: user.role, loginAt: nowIso() });
    return user;
  }

  function login(email, password) {
    const normalizedEmail = (email || "").toLowerCase().trim();
    const u = (window.DATA.usuarios || []).find(x => x.email === normalizedEmail);
    if (!u) throw new Error("Email no registrado");
    if (!u.activo) throw new Error("Cuenta desactivada");
    if (u.password_hash !== hashPassword(password)) throw new Error("Clave incorrecta");
    u.last_login_at = nowIso();
    persist();
    setSession({ userId: u.id, email: u.email, role: u.role, loginAt: nowIso() });
    return u;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function listUsuarios() { return [...(window.DATA.usuarios || [])]; }

  /**
   * Por defecto desactiva (soft delete). Si force=true, valida que no haya dependencias
   * y elimina físicamente. Si hay clientes/cotizaciones/reservas, se rechaza.
   */
  function deleteUsuario(id, options = {}) {
    const i = (window.DATA.usuarios || []).findIndex(u => u.id === id);
    if (i < 0) return false;
    if (options.force) {
      const clientes = (window.DATA.clientes || []).filter(c => c.broker_id === id).length;
      const cots = (window.DATA.cotizaciones || []).filter(c => c.broker_id === id).length;
      const reservas = (window.DATA.reservas || []).filter(r => r.broker_id === id).length;
      if (clientes + cots + reservas > 0) {
        throw new Error(`No se puede borrar: el usuario tiene ${clientes} cliente(s), ${cots} cotización(es) y ${reservas} reserva(s). Reasignalos primero o usá desactivación.`);
      }
      window.DATA.usuarios.splice(i, 1);
    } else {
      // Soft delete: desactivar
      window.DATA.usuarios[i] = { ...window.DATA.usuarios[i], activo: false, updated_at: nowIso() };
    }
    persist();
    return true;
  }

  function updateUsuario(id, patch) {
    const i = (window.DATA.usuarios || []).findIndex(u => u.id === id);
    if (i < 0) throw new Error("Usuario no encontrado");
    const updated = { ...window.DATA.usuarios[i], ...patch };
    // Si cambian password, hashear
    if (patch.password) {
      if (patch.password.length < 6) throw new Error("Clave: mínimo 6 caracteres");
      updated.password_hash = hashPassword(patch.password);
      delete updated.password;
    }
    if (patch.role && !ROLES.includes(patch.role)) throw new Error("Rol inválido");
    window.DATA.usuarios[i] = updated;
    persist();
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Constantes de dominio para Cliente
  // ---------------------------------------------------------------------------
  const CHILE_REGIONES = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana", "Libertador Bernardo O'Higgins", "Maule",
    "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos",
    "Aysén", "Magallanes y Antártica Chilena"
  ];
  const CLIENTE_SEXOS = ["masculino", "femenino", "otro", "no_responde"];
  const CLIENTE_ESTADO_CIVIL = ["soltero", "casado", "divorciado", "viudo"];
  const CLIENTE_REGIMEN_MATRIMONIAL = ["sociedad_conyugal", "separacion_bienes", "participacion_gananciales"];
  const CLIENTE_TIPO_COMPRA = ["persona_natural", "empresa"];
  const CLIENTE_CONDICION_LABORAL = ["dependiente", "independiente"];
  const CLIENTE_PROPOSITO_COMPRA = ["invertir", "vivir"];

  // ---------------------------------------------------------------------------
  // CRUD: Clientes — pertenecen a un broker (broker_id)
  // ---------------------------------------------------------------------------
  function ensureArr(key) {
    if (!window.DATA[key]) window.DATA[key] = [];
  }

  function validateRut(rut) {
    // Sintaxis aceptada: '12.345.678-9' o '12345678-9' o '12345678-K'
    return /^[\d.]{1,12}-[\dkK]$/.test((rut || "").trim());
  }

  function validateCliente(c) {
    const errs = [];
    if (!c.nombre || c.nombre.trim().length < 2) errs.push("nombre requerido");
    if (c.email && !validateEmail(c.email)) errs.push("email inválido");
    if (!c.email && !c.telefono) errs.push("requerido al menos email o teléfono");
    if (c.rut && !validateRut(c.rut)) errs.push("RUT con formato inválido (ej. 12.345.678-9)");
    if (c.sexo && !CLIENTE_SEXOS.includes(c.sexo)) errs.push("sexo inválido");
    if (c.estado_civil && !CLIENTE_ESTADO_CIVIL.includes(c.estado_civil)) errs.push("estado civil inválido");
    if (c.estado_civil === 'casado' && c.regimen_matrimonial && !CLIENTE_REGIMEN_MATRIMONIAL.includes(c.regimen_matrimonial))
      errs.push("régimen matrimonial inválido");
    if (c.tipo_compra && !CLIENTE_TIPO_COMPRA.includes(c.tipo_compra)) errs.push("tipo de compra inválido");
    if (c.condicion_laboral && !CLIENTE_CONDICION_LABORAL.includes(c.condicion_laboral)) errs.push("condición laboral inválida");
    if (c.proposito_compra && !CLIENTE_PROPOSITO_COMPRA.includes(c.proposito_compra)) errs.push("propósito de compra inválido");
    if (c.region && !CHILE_REGIONES.includes(c.region)) errs.push("región chilena inválida");
    if (c.renta !== undefined && c.renta !== null && c.renta !== '' && isNaN(Number(c.renta)))
      errs.push("renta debe ser numérica");
    if (c.fecha_nacimiento) {
      const d = new Date(c.fecha_nacimiento);
      if (isNaN(d.getTime())) errs.push("fecha de nacimiento inválida");
      else if (d > new Date()) errs.push("fecha de nacimiento no puede ser futura");
    }
    return errs;
  }

  function addCliente(data) {
    ensureArr("clientes");
    const u = currentUser();
    if (!u) throw new Error("Requiere sesión");
    const errors = validateCliente(data);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    const cliente = {
      id: uid("cl"),
      broker_id: u.id,
      // Identificación
      nombre: data.nombre.trim(),
      rut: data.rut ? data.rut.trim() : null,
      sexo: data.sexo || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      nacionalidad: data.nacionalidad || null,
      profesion: data.profesion || null,
      // Contacto
      email: (data.email || "").toLowerCase().trim() || null,
      telefono: data.telefono || null,
      // Domicilio
      direccion_particular: data.direccion_particular || null,
      comuna: data.comuna || null,
      region: data.region || null,
      // Situación civil
      estado_civil: data.estado_civil || null,
      regimen_matrimonial: data.estado_civil === 'casado' ? (data.regimen_matrimonial || null) : null,
      // Situación laboral / financiera
      condicion_laboral: data.condicion_laboral || null,
      renta: (data.renta !== undefined && data.renta !== '' && data.renta !== null) ? Number(data.renta) : null,
      tiene_dicom: parseBoolean(data.tiene_dicom),
      // Compra
      tipo_compra: data.tipo_compra || null,
      proposito_compra: data.proposito_compra || null,
      // Original
      origen: data.origen || "manual",
      notas: data.notas || "",
      created_at: nowIso(),
      updated_at: nowIso()
    };
    window.DATA.clientes.push(cliente);
    persist();
    return cliente;
  }

  function parseBoolean(v) {
    if (v === true || v === 'true' || v === 'si' || v === 'sí' || v === 'yes' || v === 'on') return true;
    if (v === false || v === 'false' || v === 'no') return false;
    return null; // tri-state: null = no respondido
  }

  function updateCliente(id, patch) {
    ensureArr("clientes");
    const u = currentUser();
    const i = window.DATA.clientes.findIndex(c => c.id === id);
    if (i < 0) throw new Error("Cliente no encontrado");
    const cli = window.DATA.clientes[i];
    if (u.role !== 'admin' && cli.broker_id !== u.id)
      throw new Error("No tenés permiso para editar este cliente");

    // Normalizar campos especiales del patch antes del merge
    const normalized = { ...patch };
    if ('tiene_dicom' in normalized) normalized.tiene_dicom = parseBoolean(normalized.tiene_dicom);
    if ('renta' in normalized) normalized.renta = (normalized.renta !== '' && normalized.renta !== null) ? Number(normalized.renta) : null;
    // Si estado_civil cambia y deja de ser casado, limpiar regimen
    if ('estado_civil' in normalized && normalized.estado_civil !== 'casado') {
      normalized.regimen_matrimonial = null;
    }

    const updated = { ...cli, ...normalized, updated_at: nowIso() };
    const errors = validateCliente(updated);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    window.DATA.clientes[i] = updated;
    persist();
    return updated;
  }

  function deleteCliente(id) {
    ensureArr("clientes");
    const u = currentUser();
    const i = window.DATA.clientes.findIndex(c => c.id === id);
    if (i < 0) return false;
    const cli = window.DATA.clientes[i];
    if (u.role !== 'admin' && cli.broker_id !== u.id)
      throw new Error("No tenés permiso para eliminar este cliente");
    // Verificar dependencias: reservas activas bloquean el delete
    const reservasActivas = (window.DATA.reservas || []).filter(
      r => r.cliente_id === id && !['cancelada','escriturada'].includes(r.estado)
    );
    if (reservasActivas.length > 0)
      throw new Error(`No se puede eliminar: el cliente tiene ${reservasActivas.length} reserva(s) activa(s). Cancelalas primero.`);
    window.DATA.clientes.splice(i, 1);
    // Las cotizaciones se conservan (snapshot histórico) pero quedan sin cliente válido
    persist();
    return true;
  }

  function clientesByBroker(brokerId) {
    ensureArr("clientes");
    return window.DATA.clientes.filter(c => c.broker_id === brokerId);
  }

  function clienteById(id) {
    ensureArr("clientes");
    return window.DATA.clientes.find(c => c.id === id);
  }

  function listAllClientes() {
    ensureArr("clientes");
    return [...window.DATA.clientes];
  }

  function listBrokers() {
    ensureArr("usuarios");
    return window.DATA.usuarios.filter(u => u.activo);
  }

  /**
   * Reasigna un cliente de un broker a otro. Solo admin.
   * @param {string} clienteId
   * @param {string} newBrokerId
   * @param {object} options - { reassignHistory: boolean }
   *   reassignHistory: si true, mueve también cotizaciones y reservas a nuevo broker
   *                    si false, solo el cliente cambia, historial queda con broker original (audit)
   */
  function reassignCliente(clienteId, newBrokerId, options = {}) {
    ensureArr("clientes");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin puede reasignar clientes");

    const cli = clienteById(clienteId);
    if (!cli) throw new Error("Cliente no existe");

    const newBroker = (window.DATA.usuarios || []).find(x => x.id === newBrokerId);
    if (!newBroker) throw new Error("Broker destino no existe");
    if (!newBroker.activo) throw new Error("Broker destino está inactivo");

    if (cli.broker_id === newBrokerId)
      throw new Error("El cliente ya está asignado a ese broker");

    const oldBrokerId = cli.broker_id;

    // Update cliente
    const idx = window.DATA.clientes.findIndex(c => c.id === clienteId);
    window.DATA.clientes[idx] = { ...cli, broker_id: newBrokerId, updated_at: nowIso() };

    const movidas = { cotizaciones: 0, reservas: 0 };

    if (options.reassignHistory) {
      ensureArr("cotizaciones");
      window.DATA.cotizaciones.forEach((c, i) => {
        if (c.cliente_id === clienteId) {
          window.DATA.cotizaciones[i] = { ...c, broker_id: newBrokerId };
          movidas.cotizaciones++;
        }
      });
      ensureArr("reservas");
      window.DATA.reservas.forEach((r, i) => {
        if (r.cliente_id === clienteId) {
          window.DATA.reservas[i] = { ...r, broker_id: newBrokerId, updated_at: nowIso() };
          movidas.reservas++;
        }
      });
    }

    persist();
    return { cliente: window.DATA.clientes[idx], oldBrokerId, newBrokerId, movidas };
  }

  /** Para admin: mueve una cotización específica a otro broker. */
  function reassignCotizacion(cotId, newBrokerId) {
    ensureArr("cotizaciones");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin puede reasignar cotizaciones");
    const idx = window.DATA.cotizaciones.findIndex(c => c.id === cotId);
    if (idx < 0) throw new Error("Cotización no existe");
    const broker = (window.DATA.usuarios || []).find(x => x.id === newBrokerId && x.activo);
    if (!broker) throw new Error("Broker destino inválido");
    window.DATA.cotizaciones[idx] = { ...window.DATA.cotizaciones[idx], broker_id: newBrokerId };
    persist();
    return window.DATA.cotizaciones[idx];
  }

  /** Para admin: mueve una reserva específica a otro broker. */
  function reassignReserva(reservaId, newBrokerId) {
    ensureArr("reservas");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin puede reasignar reservas");
    const idx = window.DATA.reservas.findIndex(r => r.id === reservaId);
    if (idx < 0) throw new Error("Reserva no existe");
    const broker = (window.DATA.usuarios || []).find(x => x.id === newBrokerId && x.activo);
    if (!broker) throw new Error("Broker destino inválido");
    window.DATA.reservas[idx] = { ...window.DATA.reservas[idx], broker_id: newBrokerId, updated_at: nowIso() };
    persist();
    return window.DATA.reservas[idx];
  }

  // ---------------------------------------------------------------------------
  // CRUD: Cotizaciones — siempre vinculadas a (broker_id, cliente_id, unidad_id)
  // ---------------------------------------------------------------------------
  function nextReferenciaCotizacion() {
    ensureArr("cotizaciones");
    // Robusto contra deletes: usa max(refs existentes) + 1
    const max = window.DATA.cotizaciones.reduce((m, c) => {
      const n = parseInt((c.referencia || '').replace(/^Q-/, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return "Q-" + String(max + 1).padStart(6, "0");
  }

  function addCotizacion(data) {
    ensureArr("cotizaciones");
    const u = currentUser();
    if (!u) throw new Error("Requiere sesión");
    if (!data.cliente_id) throw new Error("cliente_id requerido");
    if (!data.unidad_id) throw new Error("unidad_id requerido");
    const cli = clienteById(data.cliente_id);
    if (!cli) throw new Error("Cliente no existe");
    if (u.role !== 'admin' && cli.broker_id !== u.id)
      throw new Error("El cliente no pertenece a tu cartera");
    const unidad = window.DATA.unidades.find(x => x.id === data.unidad_id);
    if (!unidad) throw new Error("Unidad no existe");

    // Vigencia default: 30 días
    const validaHasta = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const cot = {
      id: uid("q"),
      referencia: nextReferenciaCotizacion(),
      broker_id: u.id,
      cliente_id: data.cliente_id,
      unidad_id: data.unidad_id,
      proyecto_id: unidad.proyecto_id,

      // Snapshot precio unidad
      precio_uf: Number(unidad.precio_uf),

      // Adicionales (UF cada uno)
      estacionamiento_cant: Number(data.estacionamiento_cant || 0),
      estacionamiento_precio_uf: Number(data.estacionamiento_precio_uf || 0),
      bodega_cant: Number(data.bodega_cant || 0),
      bodega_precio_uf: Number(data.bodega_precio_uf || 0),
      precio_unidad_base_uf: Number(data.precio_unidad_base_uf || unidad.precio_uf),
      precio_unidad_con_bono_uf: Number(data.precio_unidad_con_bono_uf || unidad.precio_uf),
      precio_total_uf: Number(data.precio_total_uf || unidad.precio_uf),

      // Pie
      pie_porcentaje: Number(data.pie_porcentaje),
      bono_pie_porcentaje: Number(data.bono_pie_porcentaje || 0),
      bono_pie_uf: Number(data.bono_pie_uf || 0),
      bono_pie_implicito_porcentaje: Number(data.bono_pie_implicito_porcentaje || 0),
      delta_vs_implicito_uf: Number(data.delta_vs_implicito_uf || 0),
      pie_upfront_porcentaje: Number(data.pie_upfront_porcentaje || 0),
      pie_upfront_uf: Number(data.pie_upfront_uf || 0),
      pie_cuotas_n: Number(data.pie_cuotas_n || 0),
      pie_cuota_mensual_uf: Number(data.pie_cuota_mensual_uf || 0),
      pie_cuota_final_porcentaje: Number(data.pie_cuota_final_porcentaje || 0),
      pie_cuota_final_uf: Number(data.pie_cuota_final_uf || 0),

      // Crédito
      plazo_anios: Number(data.plazo_anios || (Number(data.plazo_meses) / 12)),
      plazo_meses: Number(data.plazo_meses),
      tasa_anual: Number(data.tasa_anual),

      // Referencia
      uf_referencia: Number(data.uf_referencia),

      // Outputs
      dividendo_estimado_clp: Math.round(Number(data.dividendo_estimado_clp)),
      total_clp: Math.round(Number(data.total_clp)),
      valida_hasta: validaHasta,
      created_at: nowIso()
    };
    window.DATA.cotizaciones.push(cot);
    persist();
    return cot;
  }

  function cotizacionesByBroker(brokerId) {
    ensureArr("cotizaciones");
    return window.DATA.cotizaciones.filter(c => c.broker_id === brokerId);
  }

  function cotizacionesByCliente(clienteId) {
    ensureArr("cotizaciones");
    return window.DATA.cotizaciones.filter(c => c.cliente_id === clienteId);
  }

  function deleteCotizacion(id) {
    ensureArr("cotizaciones");
    const u = currentUser();
    const i = window.DATA.cotizaciones.findIndex(c => c.id === id);
    if (i < 0) return false;
    const cot = window.DATA.cotizaciones[i];
    if (u.role !== 'admin' && cot.broker_id !== u.id)
      throw new Error("No tenés permiso para eliminar esta cotización");
    window.DATA.cotizaciones.splice(i, 1);
    persist();
    return true;
  }

  // ---------------------------------------------------------------------------
  // CRUD: Reservas — SIEMPRE vinculadas a un cliente
  // Estados: pendiente → confirmada → escriturada
  //          cualquiera → cancelada
  // ---------------------------------------------------------------------------
  const RESERVA_ESTADOS = ["pendiente", "confirmada", "escriturada", "cancelada"];
  const RESERVA_METODOS = ["transferencia", "reserva_cero"];
  const COMPROBANTE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB hard cap
  const COMPROBANTE_MIMETYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

  function nextReferenciaReserva() {
    ensureArr("reservas");
    const max = window.DATA.reservas.reduce((m, r) => {
      const n = parseInt((r.referencia || '').replace(/^R-/, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return "R-" + String(max + 1).padStart(6, "0");
  }

  function addReserva(data) {
    ensureArr("reservas");
    const u = currentUser();
    if (!u) throw new Error("Requiere sesión");
    if (!data.cliente_id) throw new Error("Toda reserva debe estar asociada a un cliente");
    if (!data.unidad_id) throw new Error("unidad_id requerido");

    // Validar método de pago
    const metodoPago = data.metodo_pago || "transferencia";
    if (!RESERVA_METODOS.includes(metodoPago))
      throw new Error("Método de pago inválido (transferencia | reserva_cero)");

    const cli = clienteById(data.cliente_id);
    if (!cli) throw new Error("Cliente no existe");
    if (u.role !== 'admin' && cli.broker_id !== u.id)
      throw new Error("El cliente no pertenece a tu cartera");
    const unidad = window.DATA.unidades.find(x => x.id === data.unidad_id);
    if (!unidad) throw new Error("Unidad no existe");
    if (unidad.estado !== 'disponible')
      throw new Error(`Unidad no está disponible (estado actual: ${unidad.estado})`);

    // Verificar que no haya otra reserva activa sobre esta unidad
    const reservaActiva = window.DATA.reservas.find(
      r => r.unidad_id === unidad.id && !['cancelada','escriturada'].includes(r.estado)
    );
    if (reservaActiva)
      throw new Error("La unidad ya tiene una reserva activa (referencia " + reservaActiva.referencia + ")");

    // Validaciones específicas por método
    let monto, comprobante = null;
    if (metodoPago === "transferencia") {
      monto = Number(data.monto_reserva_clp);
      if (!monto || monto <= 0)
        throw new Error("Transferencia requiere monto de reserva > 0");
      if (!data.comprobante_dataurl)
        throw new Error("Transferencia requiere adjuntar comprobante");
      if (!data.comprobante_dataurl.startsWith("data:"))
        throw new Error("Comprobante: formato inválido (debe ser data URL)");
      // Validar mime y tamaño
      const mimeMatch = data.comprobante_dataurl.match(/^data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : null;
      if (!mime || !COMPROBANTE_MIMETYPES.includes(mime))
        throw new Error("Comprobante: tipo no permitido (PDF, JPG o PNG)");
      // Tamaño aproximado del dataURL en bytes (base64 → bytes reales)
      const base64Part = data.comprobante_dataurl.split(",")[1] || "";
      const approxBytes = Math.floor((base64Part.length * 3) / 4);
      if (approxBytes > COMPROBANTE_MAX_BYTES)
        throw new Error(`Comprobante: tamaño excede el máximo (${Math.round(approxBytes/1024/1024 * 10)/10} MB > 2 MB)`);
      comprobante = {
        dataurl: data.comprobante_dataurl,
        filename: data.comprobante_filename || "comprobante",
        mimetype: mime,
        size_bytes: approxBytes,
        uploaded_at: nowIso()
      };
    } else if (metodoPago === "reserva_cero") {
      // Reserva 0 → monto siempre 0, sin comprobante
      monto = 0;
    }

    const vencimiento = new Date(Date.now() + (data.dias_vigencia || 5) * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);

    const reserva = {
      id: uid("rs"),
      referencia: nextReferenciaReserva(),
      broker_id: u.id,
      cliente_id: data.cliente_id,
      unidad_id: data.unidad_id,
      proyecto_id: unidad.proyecto_id,
      precio_uf_snapshot: Number(unidad.precio_uf),
      pie_porcentaje: data.pie_porcentaje ? Number(data.pie_porcentaje) : null,
      monto_reserva_clp: monto,
      metodo_pago: metodoPago,
      comprobante: comprobante,
      estado: "pendiente",
      fecha_reserva: nowIso(),
      fecha_vencimiento: vencimiento,
      notas: data.notas || "",
      created_at: nowIso(),
      updated_at: nowIso()
    };

    // Transición de la unidad: disponible → reservada
    if (!isValidTransition('disponible', 'reservada')) {
      throw new Error("Transición disponible→reservada no permitida (error interno)");
    }
    const uIdx = window.DATA.unidades.findIndex(x => x.id === unidad.id);
    window.DATA.unidades[uIdx] = { ...unidad, estado: 'reservada', updated_at: nowIso() };

    window.DATA.reservas.push(reserva);
    recomputeProyectoEstado(unidad.proyecto_id); // Regla 8 modelo
    persist();
    return reserva;
  }

  function cancelReserva(id, motivo = "") {
    ensureArr("reservas");
    const u = currentUser();
    const i = window.DATA.reservas.findIndex(r => r.id === id);
    if (i < 0) throw new Error("Reserva no encontrada");
    const reserva = window.DATA.reservas[i];
    if (u.role !== 'admin' && reserva.broker_id !== u.id)
      throw new Error("No tenés permiso sobre esta reserva");
    if (['cancelada','escriturada'].includes(reserva.estado))
      throw new Error("La reserva ya está en estado " + reserva.estado);

    // Devolver la unidad a disponible
    const uIdx = window.DATA.unidades.findIndex(x => x.id === reserva.unidad_id);
    if (uIdx >= 0 && window.DATA.unidades[uIdx].estado === 'reservada') {
      window.DATA.unidades[uIdx] = {
        ...window.DATA.unidades[uIdx],
        estado: 'disponible',
        updated_at: nowIso()
      };
    }
    window.DATA.reservas[i] = {
      ...reserva,
      estado: 'cancelada',
      notas: (reserva.notas ? reserva.notas + "\n" : "") + "Cancelada: " + (motivo || "sin motivo"),
      updated_at: nowIso()
    };
    recomputeProyectoEstado(reserva.proyecto_id);
    persist();
    return window.DATA.reservas[i];
  }

  function confirmarReserva(id) {
    ensureArr("reservas");
    const u = currentUser();
    const i = window.DATA.reservas.findIndex(r => r.id === id);
    if (i < 0) throw new Error("Reserva no encontrada");
    const reserva = window.DATA.reservas[i];
    if (u.role !== 'admin' && reserva.broker_id !== u.id)
      throw new Error("No tenés permiso sobre esta reserva");
    if (reserva.estado !== 'pendiente')
      throw new Error("Solo se puede confirmar una reserva pendiente");
    window.DATA.reservas[i] = { ...reserva, estado: 'confirmada', updated_at: nowIso() };
    persist();
    return window.DATA.reservas[i];
  }

  function escriturarReserva(id) {
    ensureArr("reservas");
    const u = currentUser();
    const i = window.DATA.reservas.findIndex(r => r.id === id);
    if (i < 0) throw new Error("Reserva no encontrada");
    const reserva = window.DATA.reservas[i];
    if (u.role !== 'admin' && reserva.broker_id !== u.id)
      throw new Error("No tenés permiso sobre esta reserva");
    if (!['pendiente','confirmada'].includes(reserva.estado))
      throw new Error("Estado inválido para escriturar: " + reserva.estado);

    // Transición unidad: reservada → vendida
    const uIdx = window.DATA.unidades.findIndex(x => x.id === reserva.unidad_id);
    if (uIdx >= 0 && window.DATA.unidades[uIdx].estado === 'reservada') {
      window.DATA.unidades[uIdx] = {
        ...window.DATA.unidades[uIdx],
        estado: 'vendida',
        updated_at: nowIso()
      };
    }
    window.DATA.reservas[i] = { ...reserva, estado: 'escriturada', updated_at: nowIso() };
    recomputeProyectoEstado(reserva.proyecto_id);
    persist();
    return window.DATA.reservas[i];
  }

  function reservasByBroker(brokerId) {
    ensureArr("reservas");
    return window.DATA.reservas.filter(r => r.broker_id === brokerId);
  }

  function reservasByCliente(clienteId) {
    ensureArr("reservas");
    return window.DATA.reservas.filter(r => r.cliente_id === clienteId);
  }

  function reservaActivaByUnidad(unidadId) {
    ensureArr("reservas");
    return window.DATA.reservas.find(
      r => r.unidad_id === unidadId && !['cancelada','escriturada'].includes(r.estado)
    );
  }

  // ---------------------------------------------------------------------------
  // CRUD: Inmobiliarias
  // ---------------------------------------------------------------------------
  function validateInmobiliaria(i) {
    const errs = [];
    if (!i.nombre_publico || i.nombre_publico.trim().length < 3)
      errs.push("nombre_publico requerido (≥3 chars)");
    const slug = i.slug || slugify(i.nombre_publico);
    if (!slug || !/^[a-z0-9-]+$/.test(slug))
      errs.push("slug inválido (solo a-z, 0-9, -)");
    const tiposFuente = ["api", "csv", "sheets", "scraping", "manual"];
    if (i.fuente_stock_tipo && !tiposFuente.includes(i.fuente_stock_tipo))
      errs.push("fuente_stock_tipo inválido");
    return errs;
  }

  function addInmobiliaria(i) {
    const errors = validateInmobiliaria(i);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    const slug = i.slug || slugify(i.nombre_publico);
    // Slug único
    if (window.DATA.inmobiliarias.some(x => x.slug === slug)) {
      throw new Error("Slug ya existe: " + slug);
    }
    const inm = {
      id: i.id || uid("im"),
      slug,
      nombre_publico: i.nombre_publico.trim(),
      logo_url: i.logo_url || null,
      descripcion: i.descripcion || "",
      sitio_web: i.sitio_web || null,
      activa: i.activa !== false,
      // Privados (no exponer via API pública en producción)
      comision_porcentaje: i.comision_porcentaje ? Number(i.comision_porcentaje) : null,
      condiciones_acuerdo: i.condiciones_acuerdo || "",
      contacto_comercial: i.contacto_comercial || "",
      fuente_stock_tipo: i.fuente_stock_tipo || "manual",
      fuente_stock_config: i.fuente_stock_config || {},
      created_at: nowIso(),
      updated_at: nowIso()
    };
    window.DATA.inmobiliarias.push(inm);
    persist();
    return inm;
  }

  function updateInmobiliaria(id, patch) {
    const idx = window.DATA.inmobiliarias.findIndex(i => i.id === id);
    if (idx < 0) throw new Error("Inmobiliaria no encontrada: " + id);
    const updated = { ...window.DATA.inmobiliarias[idx], ...patch, updated_at: nowIso() };
    const errors = validateInmobiliaria(updated);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    // Verificar slug único si cambió
    if (patch.slug && patch.slug !== window.DATA.inmobiliarias[idx].slug) {
      if (window.DATA.inmobiliarias.some(x => x.id !== id && x.slug === patch.slug)) {
        throw new Error("Slug ya existe: " + patch.slug);
      }
    }
    window.DATA.inmobiliarias[idx] = updated;
    persist();
    return updated;
  }

  function deleteInmobiliaria(id) {
    const idx = window.DATA.inmobiliarias.findIndex(i => i.id === id);
    if (idx < 0) return false;
    // Cascade: eliminar proyectos + unidades + condiciones de esa inmobiliaria
    const proyectosAfectados = window.DATA.proyectos.filter(p => p.inmobiliaria_id === id);
    proyectosAfectados.forEach(p => deleteProyecto(p.id));
    window.DATA.inmobiliarias.splice(idx, 1);
    persist();
    return true;
  }

  function countProyectosByInmobiliaria(id) {
    return window.DATA.proyectos.filter(p => p.inmobiliaria_id === id).length;
  }

  // ---------------------------------------------------------------------------
  // CRUD: Archivos de Proyecto
  // brochure, imagen, video, plano, recepcion_final, permiso_edificacion,
  // reglamento, otro_legal, otro
  // Cada archivo puede ser: upload (dataurl) o URL externa
  // ---------------------------------------------------------------------------
  const TIPOS_ARCHIVO_PROYECTO = [
    "brochure", "imagen", "video", "plano",
    "recepcion_final", "permiso_edificacion", "reglamento",
    "otro_legal", "otro"
  ];
  const TIPOS_ARCHIVO_LABELS = {
    brochure: "Brochure",
    imagen: "Imagen",
    video: "Video",
    plano: "Plano",
    recepcion_final: "Recepción final",
    permiso_edificacion: "Permiso de edificación",
    reglamento: "Reglamento",
    otro_legal: "Otro documento legal",
    otro: "Otro"
  };
  const ARCHIVO_PROYECTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  function addArchivoProyecto(data) {
    ensureArr("archivos_proyecto");
    const u = currentUser();
    if (!u || u.role !== 'admin')
      throw new Error("Solo admin puede subir archivos de proyecto");
    if (!data.proyecto_id) throw new Error("proyecto_id requerido");
    if (!data.tipo || !TIPOS_ARCHIVO_PROYECTO.includes(data.tipo))
      throw new Error("Tipo de archivo inválido");
    if (!data.nombre || data.nombre.trim().length < 1)
      throw new Error("Nombre requerido");

    const proyecto = window.DATA.proyectos.find(p => p.id === data.proyecto_id);
    if (!proyecto) throw new Error("Proyecto no existe");

    // Validar fuente: upload (dataurl) o url externa
    let fuente = data.fuente;
    let dataurl = null;
    let urlExterna = null;
    let mimetype = null;
    let sizeBytes = 0;

    if (data.dataurl && data.dataurl.startsWith("data:")) {
      fuente = "upload";
      dataurl = data.dataurl;
      // Validar mime + tamaño
      const mimeMatch = dataurl.match(/^data:([^;]+);/);
      mimetype = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      const base64Part = dataurl.split(",")[1] || "";
      sizeBytes = Math.floor((base64Part.length * 3) / 4);
      if (sizeBytes > ARCHIVO_PROYECTO_MAX_BYTES) {
        throw new Error(`Archivo demasiado grande (${(sizeBytes/1024/1024).toFixed(1)} MB). Máximo: 5 MB. Para archivos pesados (videos), usá URL externa.`);
      }
    } else if (data.url) {
      fuente = "url";
      urlExterna = data.url.trim();
      // Validación básica de URL
      try {
        const parsed = new URL(urlExterna);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("URL debe usar http o https");
        }
      } catch (e) {
        throw new Error("URL inválida: " + e.message);
      }
      mimetype = data.mimetype || null;
    } else {
      throw new Error("Debe proveer un archivo (upload) o una URL externa");
    }

    const archivo = {
      id: uid("arch"),
      proyecto_id: data.proyecto_id,
      tipo: data.tipo,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion || "",
      fuente,
      dataurl,
      url: urlExterna,
      mimetype,
      size_bytes: sizeBytes,
      uploaded_at: nowIso(),
      uploaded_by: u.id
    };
    window.DATA.archivos_proyecto.push(archivo);
    persist();
    return archivo;
  }

  function updateArchivoProyecto(id, patch) {
    ensureArr("archivos_proyecto");
    const u = currentUser();
    if (!u || u.role !== 'admin')
      throw new Error("Solo admin puede editar archivos");
    const i = window.DATA.archivos_proyecto.findIndex(a => a.id === id);
    if (i < 0) throw new Error("Archivo no encontrado");
    // Solo permitir editar campos meta (nombre, descripcion, tipo) — no la fuente
    const allowed = ["nombre", "descripcion", "tipo"];
    const sanitized = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) sanitized[key] = patch[key];
    }
    if (sanitized.tipo && !TIPOS_ARCHIVO_PROYECTO.includes(sanitized.tipo))
      throw new Error("Tipo inválido");
    window.DATA.archivos_proyecto[i] = {
      ...window.DATA.archivos_proyecto[i],
      ...sanitized,
      updated_at: nowIso()
    };
    persist();
    return window.DATA.archivos_proyecto[i];
  }

  function deleteArchivoProyecto(id) {
    ensureArr("archivos_proyecto");
    const u = currentUser();
    if (!u || u.role !== 'admin')
      throw new Error("Solo admin puede eliminar archivos");
    const i = window.DATA.archivos_proyecto.findIndex(a => a.id === id);
    if (i < 0) return false;
    window.DATA.archivos_proyecto.splice(i, 1);
    persist();
    return true;
  }

  function archivosByProyecto(proyectoId) {
    ensureArr("archivos_proyecto");
    return window.DATA.archivos_proyecto
      .filter(a => a.proyecto_id === proyectoId)
      .sort((a, b) => (a.tipo || '').localeCompare(b.tipo || ''));
  }

  function archivoById(id) {
    ensureArr("archivos_proyecto");
    return window.DATA.archivos_proyecto.find(a => a.id === id);
  }

  // ---------------------------------------------------------------------------
  // EXCEL IMPORT — Mapping + ingestion engine
  // ---------------------------------------------------------------------------

  /**
   * Campos de PROYECTO mapeables desde Excel (1 Excel por inmobiliaria, multi-proyecto).
   * El campo `proyecto_nombre` es REQUERIDO para identificar a qué proyecto pertenece cada fila.
   */
  const EXCEL_FIELDS_PROYECTO = [
    { key: "proyecto_nombre",            label: "PROYECTO · Nombre",                            type: "string", required: true,  scope: "proyecto" },
    { key: "proyecto_comuna",            label: "PROYECTO · Comuna",                            type: "string", required: false, scope: "proyecto" },
    { key: "proyecto_region",            label: "PROYECTO · Región",                            type: "string", required: false, scope: "proyecto" },
    { key: "proyecto_etapa",             label: "PROYECTO · Etapa (en_blanco/en_verde/...)",   type: "enum",   required: false, scope: "proyecto", enum: ["en_blanco","en_verde","entrega_inmediata"] },
    { key: "proyecto_entrega_inmediata", label: "PROYECTO · Entrega inmediata? (SI/NO)",        type: "bool",   required: false, scope: "proyecto" }
  ];

  /**
   * Campos del modelo Unidad mapeables desde Excel.
   */
  const EXCEL_FIELDS_UNIDAD = [
    { key: "external_id",              label: "Unidad · ID externo (opcional)",            type: "string", required: false, scope: "unidad", note: "Si vacío, se usa 'numero'" },
    { key: "numero",                   label: "Unidad · Número / Depto",                   type: "string", required: true,  scope: "unidad" },
    { key: "tipo",                     label: "Unidad · Tipo (depto/local/bodega/...)",    type: "enum",   required: false, scope: "unidad", enum: ["departamento","local","oficina","bodega","estacionamiento"], default: "departamento" },
    { key: "tipologia",                label: "Unidad · Tipología (1d1b, 2d2b...)",        type: "enum",   required: true,  scope: "unidad", enum: ["studio","1d1b","2d1b","2d2b","3d2b","3d3b","4d3b","local","oficina","bodega","estacionamiento"] },
    { key: "modelo",                   label: "Unidad · Modelo arquitectónico",            type: "string", required: false, scope: "unidad" },
    { key: "orientacion",              label: "Unidad · Orientación (N/S/O/P)",            type: "string", required: false, scope: "unidad" },
    { key: "piso",                     label: "Unidad · Piso",                             type: "int",    required: false, scope: "unidad" },
    { key: "superficie_total",         label: "Unidad · Superficie total (m²)",            type: "decimal", required: false, scope: "unidad" },
    { key: "superficie_interior",      label: "Unidad · Superficie interior (m²)",         type: "decimal", required: false, scope: "unidad" },
    { key: "superficie_terraza",       label: "Unidad · Superficie terraza (m²)",          type: "decimal", required: false, scope: "unidad" },
    { key: "precio_uf",                label: "Unidad · Precio UF",                        type: "decimal", required: true,  scope: "unidad" },
    { key: "descuento_porcentaje",     label: "Unidad · Descuento %",                      type: "decimal", required: false, scope: "unidad" },
    { key: "bono_pie_porcentaje",      label: "Unidad · Bono pie %",                       type: "decimal", required: false, scope: "unidad" },
    { key: "estacionamiento_incluido", label: "Unidad · Estacionamientos incluidos",       type: "int",    required: false, scope: "unidad", default: 0 },
    { key: "bodega_incluida",          label: "Unidad · Bodegas incluidas",                type: "int",    required: false, scope: "unidad", default: 0 },
    { key: "estado",                   label: "Unidad · Estado (disponible/...)",          type: "enum",   required: false, scope: "unidad", enum: ["disponible","reservada","vendida","bloqueada"], default: "disponible" }
  ];

  const EXCEL_FIELDS_ALL = [...EXCEL_FIELDS_PROYECTO, ...EXCEL_FIELDS_UNIDAD];

  function getExcelFieldsUnidad() { return EXCEL_FIELDS_UNIDAD; }
  function getExcelFieldsProyecto() { return EXCEL_FIELDS_PROYECTO; }
  function getExcelFieldsAll() { return EXCEL_FIELDS_ALL; }
  function getExcelFieldByKey(key) { return EXCEL_FIELDS_ALL.find(f => f.key === key); }

  // ---- Mapeos guardados por inmobiliaria ----

  /** Busca mapeo por (inmobiliaria, sheet). Si sheet=null, retorna el primero de la inmobiliaria. */
  function getMapeoForInmobiliariaSheet(inmobiliariaId, sheetName) {
    ensureArr("mapeos_excel");
    if (sheetName) {
      const match = window.DATA.mapeos_excel.find(
        m => m.inmobiliaria_id === inmobiliariaId && m.sheet_name === sheetName
      );
      if (match) return match;
    }
    return window.DATA.mapeos_excel.find(m => m.inmobiliaria_id === inmobiliariaId) || null;
  }

  /** Backwards-compat: alias del anterior sin sheet. */
  function getMapeoForInmobiliaria(inmobiliariaId) {
    return getMapeoForInmobiliariaSheet(inmobiliariaId, null);
  }

  function saveMapeoForInmobiliaria(inmobiliariaId, { nombre, sheet_name, header_row, columnas }) {
    ensureArr("mapeos_excel");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin puede guardar mapeos");
    if (!inmobiliariaId) throw new Error("inmobiliaria_id requerido");
    if (!columnas || typeof columnas !== 'object') throw new Error("columnas requerido");

    const sheet = sheet_name || null;
    const idx = window.DATA.mapeos_excel.findIndex(
      m => m.inmobiliaria_id === inmobiliariaId && (m.sheet_name || null) === sheet
    );
    const entry = {
      id: idx >= 0 ? window.DATA.mapeos_excel[idx].id : uid("map"),
      inmobiliaria_id: inmobiliariaId,
      sheet_name: sheet,
      nombre: nombre || ("Mapeo " + (sheet || "default")),
      header_row: Number(header_row || 1),
      columnas,
      created_at: idx >= 0 ? window.DATA.mapeos_excel[idx].created_at : nowIso(),
      updated_at: nowIso()
    };
    if (idx >= 0) {
      window.DATA.mapeos_excel[idx] = entry;
    } else {
      window.DATA.mapeos_excel.push(entry);
    }
    persist();
    return entry;
  }

  function deleteMapeoForInmobiliaria(inmobiliariaId, sheetName) {
    ensureArr("mapeos_excel");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin");
    const filter = sheetName
      ? (m => m.inmobiliaria_id === inmobiliariaId && m.sheet_name === sheetName)
      : (m => m.inmobiliaria_id === inmobiliariaId);
    const idx = window.DATA.mapeos_excel.findIndex(filter);
    if (idx < 0) return false;
    window.DATA.mapeos_excel.splice(idx, 1);
    persist();
    return true;
  }

  /**
   * Detecta proyectos únicos en el Excel parseado.
   * @returns {Array} [{ nombreExcel, count, comunaSugerida, etapaSugerida }]
   */
  function detectarProyectosExcel(rows, mapping) {
    const proyectoCol = Object.entries(mapping).find(([_, k]) => k === 'proyecto_nombre');
    if (!proyectoCol) throw new Error("El mapeo no incluye 'PROYECTO · Nombre' — es requerido");
    const proyectoHeader = proyectoCol[0];

    const comunaCol = Object.entries(mapping).find(([_, k]) => k === 'proyecto_comuna');
    const comunaHeader = comunaCol ? comunaCol[0] : null;
    const etapaCol = Object.entries(mapping).find(([_, k]) => k === 'proyecto_etapa');
    const etapaHeader = etapaCol ? etapaCol[0] : null;
    const entregaInmediataCol = Object.entries(mapping).find(([_, k]) => k === 'proyecto_entrega_inmediata');
    const entregaInmediataHeader = entregaInmediataCol ? entregaInmediataCol[0] : null;

    const grupos = new Map();
    for (const row of rows) {
      const nombre = String(row[proyectoHeader] || '').trim();
      if (!nombre) continue;
      if (!grupos.has(nombre)) {
        grupos.set(nombre, {
          nombreExcel: nombre,
          count: 0,
          comunaSugerida: null,
          etapaSugerida: null
        });
      }
      const g = grupos.get(nombre);
      g.count++;

      if (comunaHeader && !g.comunaSugerida) {
        const c = String(row[comunaHeader] || '').trim();
        if (c) g.comunaSugerida = c;
      }
      if (etapaHeader && !g.etapaSugerida) {
        const fieldDef = getExcelFieldByKey('proyecto_etapa');
        const e = normalizeCellValue(row[etapaHeader], fieldDef);
        if (e) g.etapaSugerida = e;
      }
      // Si no hay etapa pero hay EntregaInmediata=SI → asumir entrega_inmediata
      if (!g.etapaSugerida && entregaInmediataHeader) {
        const ei = normalizeCellValue(row[entregaInmediataHeader], { type: 'bool' });
        if (ei === true) g.etapaSugerida = 'entrega_inmediata';
      }
    }
    return Array.from(grupos.values());
  }

  /** Sugiere matchings entre nombres de Excel y proyectos existentes de una inmobiliaria. */
  function sugerirMatchesProyectos(inmobiliariaId, nombresExcel) {
    const existentes = window.DATA.proyectos.filter(p => p.inmobiliaria_id === inmobiliariaId);
    const normalize = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u');
    return nombresExcel.map(n => {
      const norm = normalize(n);
      const match = existentes.find(p => normalize(p.nombre) === norm);
      return {
        nombreExcel: n,
        existenteId: match ? match.id : null,
        existenteNombre: match ? match.nombre : null
      };
    });
  }

  // ---- Normalización de valores crudos del Excel ----

  /** Normaliza un valor crudo de celda según el tipo del target field. */
  function normalizeCellValue(raw, fieldDef) {
    if (raw === null || raw === undefined || raw === '') {
      return fieldDef.default !== undefined ? fieldDef.default : null;
    }

    const s = String(raw).trim();
    if (s === '') return fieldDef.default !== undefined ? fieldDef.default : null;

    if (fieldDef.type === 'int') {
      // Acepta "5", "5.0", "5,00", "  5 "
      const cleaned = s.replace(/[^\d-]/g, '').replace(/\.0+$/, '');
      const n = parseInt(cleaned, 10);
      return isNaN(n) ? null : n;
    }
    if (fieldDef.type === 'decimal') {
      // Acepta "1234.56", "1234,56", "1.234,56", "1,234.56", "UF 1234"
      let cleaned = s.replace(/[^\d.,\-]/g, '');
      // Si tiene ambos . y , → asumir . separador miles, , decimal (formato chileno)
      if (cleaned.includes(',') && cleaned.includes('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (cleaned.includes(',') && !cleaned.includes('.')) {
        // Solo , → es decimal
        cleaned = cleaned.replace(',', '.');
      }
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    }
    if (fieldDef.type === 'bool') {
      const norm = s.toLowerCase().trim();
      if (['si','sí','yes','true','1','x','✓'].includes(norm)) return true;
      if (['no','false','0','-','—'].includes(norm)) return false;
      return null;
    }
    if (fieldDef.type === 'enum') {
      // Normalizar a lowercase + remove accents + remove non-alphanumeric chars
      // (acepta '2D+2B', '2D-2B', '2 D 2 B', '2D2B', '2d+2b', etc.)
      const norm = s.toLowerCase()
        .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
        .replace(/[^a-z0-9]/g, ''); // strip todo lo que no sea letra o numero
      // Strip variant suffixes for tipologías (1d1be → 1d1b, 2d2bx → 2d2b)
      const tipNorm = norm.replace(/^(\d+d\d+b)[a-z]*$/, '$1');
      // Sinónimos comunes
      const synonyms = {
        // tipologías
        'studio': 'studio', 'estudio': 'studio',
        '1d1b': '1d1b', '1d': '1d1b', '1-1': '1d1b',
        '2d1b': '2d1b', '2-1': '2d1b',
        '2d2b': '2d2b', '2-2': '2d2b',
        '3d2b': '3d2b', '3-2': '3d2b',
        '3d3b': '3d3b', '3-3': '3d3b',
        '4d3b': '4d3b', '4-3': '4d3b',
        // estados (incluye typos comunes)
        'disponible': 'disponible', 'disp': 'disponible', 'available': 'disponible', 'libre': 'disponible',
        'reservada': 'reservada', 'reserva': 'reservada', 'reservado': 'reservada',
        'rservada': 'reservada', 'rservado': 'reservada',          // typos Stitchkin
        'reseravado': 'reservada', 'reservaado': 'reservada',
        'vendida': 'vendida', 'vendido': 'vendida', 'sold': 'vendida',
        'bloqueada': 'bloqueada', 'bloqueado': 'bloqueada', 'blocked': 'bloqueada', 'pausada': 'bloqueada',
        // 'PILOTO' (depto modelo) → marker especial para SKIP
        'piloto': '__skip__',
        'modelo': '__skip__',
        // tipos
        'depto': 'departamento', 'departamento': 'departamento', 'dpto': 'departamento',
        'local': 'local', 'localcomercial': 'local',
        'oficina': 'oficina', 'office': 'oficina',
        'bodega': 'bodega', 'bod': 'bodega',
        'estacionamiento': 'estacionamiento', 'est': 'estacionamiento', 'parking': 'estacionamiento',
        // etapas
        'enblanco': 'en_blanco', 'blanco': 'en_blanco',
        'enverde': 'en_verde', 'verde': 'en_verde',
        'entregainmediata': 'entrega_inmediata', 'inmediata': 'entrega_inmediata', 'inmediato': 'entrega_inmediata'
      };
      if (synonyms[tipNorm]) return synonyms[tipNorm];
      if (synonyms[norm]) return synonyms[norm];
      if (fieldDef.enum.includes(norm)) return norm;
      if (fieldDef.enum.includes(tipNorm)) return tipNorm;
      return null; // valor inválido
    }
    return s; // string default
  }

  /**
   * Motor multi-proyecto: 1 Excel por inmobiliaria con N proyectos.
   * @param {string} inmobiliariaId
   * @param {Array<object>} rows
   * @param {object} mapping
   * @param {object} proyectoActions - {[nombreExcel]: {action, existenteId, newData}}
   *   action: 'link' | 'create' | 'skip'
   *   existenteId: id de proyecto a vincular (action=link)
   *   newData: {nombre, comuna, region, etapa, anio_entrega, precio_uf_min, precio_uf_max} (action=create)
   * @param {object} options - { dryRun }
   * @returns {object} resultado consolidado
   */
  function importExcelMultiProyecto(inmobiliariaId, rows, mapping, proyectoActions, options = {}) {
    ensureArr("unidades"); ensureArr("proyectos");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin puede importar Excel");
    const inm = window.DATA.inmobiliarias.find(i => i.id === inmobiliariaId);
    if (!inm) throw new Error("Inmobiliaria no existe");

    const dryRun = !!options.dryRun;
    const start = Date.now();
    const result = {
      total_filas: rows.length,
      filas_validas: 0,
      filas_invalidas: 0,
      filas_skipped_piloto: 0,
      filas_proyecto_skip: 0,
      proyectos_creados: 0,
      proyectos_vinculados: 0,
      proyectos_skipped: 0,
      unidades_creadas: 0,
      unidades_actualizadas: 0,
      unidades_ignoradas: 0,
      errores: [],
      preview: [],
      proyectos_resumen: {} // {nombreExcel: {action, proyectoId, unidades}}
    };

    const proyectoCol = Object.entries(mapping).find(([_, k]) => k === 'proyecto_nombre');
    if (!proyectoCol) throw new Error("El mapeo no incluye 'PROYECTO · Nombre' — es requerido");
    const proyectoHeader = proyectoCol[0];

    // Auto-detección de columnas % en formato decimal (Excel guarda 0.19 = 19%)
    // Para cada columna mapeada a un field _porcentaje, chequear si los valores son ≤ 1
    // Si sí, multiplicaremos por 100 al normalizar (típico Excel chileno)
    const decimalAsPercentColumns = new Set();
    for (const [excelHeader, targetKey] of Object.entries(mapping)) {
      if (!targetKey || !targetKey.includes('porcentaje')) continue;
      const sampleValues = rows.slice(0, 50).map(r => Number(r[excelHeader])).filter(v => !isNaN(v) && v > 0);
      if (sampleValues.length > 0 && sampleValues.every(v => v <= 1)) {
        decimalAsPercentColumns.add(excelHeader);
      }
    }
    result.decimal_as_percent_detected = Array.from(decimalAsPercentColumns);

    // Validar required fields del unit-scope
    const requiredUnit = EXCEL_FIELDS_UNIDAD.filter(f => f.required).map(f => f.key);
    const usedTargets = Object.values(mapping);
    const missingRequired = requiredUnit.filter(k =>
      !usedTargets.includes(k) && !(k === 'external_id' && usedTargets.includes('numero'))
    );
    if (missingRequired.length > 0) {
      throw new Error("Faltan campos requeridos en el mapeo: " + missingRequired.join(", "));
    }

    // Cache de IDs de proyecto resueltos por nombre Excel
    const proyectosResueltos = {};   // nombreExcel → proyectoId (null si skip)

    for (const [nombreExcel, action] of Object.entries(proyectoActions)) {
      if (!action || action.action === 'skip') {
        proyectosResueltos[nombreExcel] = null;
        result.proyectos_skipped++;
        result.proyectos_resumen[nombreExcel] = { action: 'skip', proyectoId: null, unidades: 0 };
      } else if (action.action === 'link') {
        if (!action.existenteId) throw new Error(`Acción 'link' requiere existenteId para "${nombreExcel}"`);
        proyectosResueltos[nombreExcel] = action.existenteId;
        result.proyectos_vinculados++;
        result.proyectos_resumen[nombreExcel] = { action: 'link', proyectoId: action.existenteId, unidades: 0 };
      } else if (action.action === 'create') {
        if (dryRun) {
          // En dryRun no creamos pero simulamos un ID temporal
          proyectosResueltos[nombreExcel] = '__pending__';
          result.proyectos_resumen[nombreExcel] = { action: 'create-pending', proyectoId: null, unidades: 0, newData: action.newData };
        } else {
          const nd = action.newData || {};
          if (!nd.nombre || !nd.comuna) throw new Error(`Faltan datos para crear "${nombreExcel}": nombre y comuna requeridos`);
          const created = addProyecto({
            inmobiliaria_id: inmobiliariaId,
            nombre: nd.nombre,
            slug: nd.slug || slugify(nd.nombre + "-" + uid("p").slice(2)),
            region: nd.region || "Metropolitana",
            comuna: nd.comuna,
            direccion: nd.direccion || "",
            etapa: nd.etapa || "en_verde",
            anio_entrega: nd.anio_entrega || new Date().getFullYear() + 1,
            precio_uf_min: nd.precio_uf_min || 100,
            precio_uf_max: nd.precio_uf_max || 999,
            bono_pie_implicito_porcentaje: Number(nd.bono_pie_implicito_porcentaje) || 0,
            tipologias_disponibles: [],
            estado_negocio: "activo",
            estado_ingesta: "ok"
          });
          proyectosResueltos[nombreExcel] = created.id;
          result.proyectos_creados++;
          result.proyectos_resumen[nombreExcel] = { action: 'create', proyectoId: created.id, unidades: 0 };
        }
      }
    }

    // Procesar filas
    rows.forEach((row, idx) => {
      try {
        const nombreProyecto = String(row[proyectoHeader] || '').trim();
        if (!nombreProyecto) {
          result.unidades_ignoradas++;
          return;
        }
        const proyectoId = proyectosResueltos[nombreProyecto];
        if (proyectoId === undefined) {
          // Proyecto no en proyectoActions — saltar
          result.filas_proyecto_skip++;
          return;
        }
        if (proyectoId === null) {
          // Proyecto explícitamente skipped
          result.filas_proyecto_skip++;
          return;
        }

        // Aplicar mapping de campos de unidad
        const unidadData = {};
        let skipRow = false;
        for (const [excelHeader, targetKey] of Object.entries(mapping)) {
          if (!targetKey || targetKey === '_ignore') continue;
          const fieldDef = getExcelFieldByKey(targetKey);
          if (!fieldDef) continue;
          // Solo procesar campos unit-scope aquí
          if (fieldDef.scope === 'proyecto') continue;

          let raw = row[excelHeader];
          // Auto-conversion decimal → porcentaje si la columna fue detectada
          if (decimalAsPercentColumns.has(excelHeader) && raw !== null && raw !== undefined && raw !== '') {
            const n = Number(raw);
            if (!isNaN(n) && n <= 1) raw = n * 100;
          }
          const normalized = normalizeCellValue(raw, fieldDef);

          // PILOTO marker: skip silently
          if (normalized === '__skip__') {
            skipRow = true;
            break;
          }

          if (normalized !== null && normalized !== undefined) {
            unidadData[targetKey] = normalized;
          } else if (fieldDef.default !== undefined) {
            unidadData[targetKey] = fieldDef.default;
          }
        }

        if (skipRow) {
          result.filas_skipped_piloto++;
          return;
        }

        // Saltar filas sin numero
        if (!unidadData.numero || String(unidadData.numero).trim() === '') {
          result.unidades_ignoradas++;
          return;
        }

        if (!unidadData.external_id) unidadData.external_id = String(unidadData.numero).trim();
        unidadData.proyecto_id = proyectoId;

        // Auto-derivar tipologia para unidades no-departamento
        // Caso típico: estacionamientos/bodegas no tienen columna de tipología real
        // Si tipo es estacionamiento/bodega/local/oficina y tipologia falta o es inválida,
        // setear tipologia = tipo (válido por estar en el enum)
        const tipologiasValidas = ["studio","1d1b","2d1b","2d2b","3d2b","3d3b","4d3b","local","oficina","bodega","estacionamiento"];
        const tiposNoDepto = ["estacionamiento","bodega","local","oficina"];
        if (tiposNoDepto.includes(unidadData.tipo) && !tipologiasValidas.includes(unidadData.tipologia)) {
          unidadData.tipologia = unidadData.tipo;
        }

        // Validar
        const errors = validateUnidad(unidadData);
        if (errors.length > 0) {
          result.filas_invalidas++;
          result.errores.push({
            fila: idx + 2, // +1 row 1-indexed, +1 por header
            proyecto: nombreProyecto,
            numero: unidadData.numero || '?',
            errores: errors
          });
          if (result.preview.length < 8) result.preview.push({ ...unidadData, __proyecto: nombreProyecto, __error: errors.join('; ') });
          return;
        }

        result.filas_validas++;
        if (result.proyectos_resumen[nombreProyecto]) result.proyectos_resumen[nombreProyecto].unidades++;
        if (result.preview.length < 8) result.preview.push({ ...unidadData, __proyecto: nombreProyecto });

        if (dryRun) return;
        if (proyectoId === '__pending__') return; // En dry-run no debería pasar pero por seguridad

        // Upsert por (proyecto_id, external_id)
        const existing = window.DATA.unidades.find(
          un => un.proyecto_id === proyectoId && un.external_id === unidadData.external_id
        );
        if (existing) {
          updateUnidad(existing.id, unidadData);
          result.unidades_actualizadas++;
        } else {
          addUnidad(unidadData);
          result.unidades_creadas++;
        }
      } catch (e) {
        result.filas_invalidas++;
        result.errores.push({
          fila: idx + 2,
          numero: row.numero || '?',
          errores: [e.message]
        });
      }
    });

    result.duracion_ms = Date.now() - start;

    if (!dryRun) {
      // Recompute estado_negocio de cada proyecto afectado
      const affectedProyectos = new Set(Object.values(proyectosResueltos).filter(id => id && id !== '__pending__'));
      affectedProyectos.forEach(pid => recomputeProyectoEstado(pid));

      addAuditEntry({
        adapter: 'excel-upload-multi',
        modo: 'manual',
        inmobiliaria_id: inmobiliariaId,
        proyectos_recibidos: Object.keys(proyectoActions).length,
        proyectos_creados: result.proyectos_creados,
        proyectos_actualizados: result.proyectos_vinculados,
        proyectos_invalidados: result.proyectos_skipped,
        unidades_recibidas: rows.length,
        unidades_creadas: result.unidades_creadas,
        unidades_actualizadas: result.unidades_actualizadas,
        unidades_ignoradas: result.unidades_ignoradas + result.filas_skipped_piloto + result.filas_proyecto_skip,
        errores: result.errores.map(e => ({ external_id: e.numero, msg: `[${e.proyecto || '?'}] ` + e.errores.join('; ') })),
        status: result.filas_invalidas > 0 ? 'partial' : 'success',
        duracion_ms: result.duracion_ms
      });
      persist();
    }
    return result;
  }

  /**
   * Motor de importación legacy (single-proyecto). Mantengo por backwards-compat
   * pero el flujo principal ahora es importExcelMultiProyecto.
   */
  function importExcelUnidades(proyectoId, rows, mapping, options = {}) {
    ensureArr("unidades");
    const u = currentUser();
    if (!u || u.role !== 'admin') throw new Error("Solo admin puede importar Excel");

    const proyecto = window.DATA.proyectos.find(p => p.id === proyectoId);
    if (!proyecto) throw new Error("Proyecto no existe");

    const dryRun = !!options.dryRun;
    const start = Date.now();
    const result = {
      total_filas: rows.length,
      filas_validas: 0,
      filas_invalidas: 0,
      unidades_creadas: 0,
      unidades_actualizadas: 0,
      unidades_ignoradas: 0,
      errores: [],
      preview: [] // primeras 5 filas mapeadas (para dryRun)
    };

    // Construir reverse-mapping: target field → excel header
    const targetFieldsUsed = {};
    for (const [excelHeader, targetKey] of Object.entries(mapping)) {
      if (targetKey && targetKey !== '_ignore') {
        targetFieldsUsed[targetKey] = excelHeader;
      }
    }

    // Validar que campos requeridos estén mapeados
    const required = EXCEL_FIELDS_UNIDAD.filter(f => f.required);
    const missingRequired = required.filter(f => !targetFieldsUsed[f.key] && !(f.key === 'external_id' && targetFieldsUsed['numero']));
    if (missingRequired.length > 0) {
      throw new Error("Faltan campos requeridos en el mapeo: " + missingRequired.map(f => f.label).join(", "));
    }

    rows.forEach((row, idx) => {
      try {
        // Aplicar mapping → objeto unidad cruda
        const unidadData = {};
        for (const [excelHeader, targetKey] of Object.entries(mapping)) {
          if (!targetKey || targetKey === '_ignore') continue;
          const fieldDef = getExcelFieldByKey(targetKey);
          if (!fieldDef) continue;
          const raw = row[excelHeader];
          const normalized = normalizeCellValue(raw, fieldDef);
          if (normalized !== null && normalized !== undefined) {
            unidadData[targetKey] = normalized;
          } else if (fieldDef.default !== undefined) {
            unidadData[targetKey] = fieldDef.default;
          }
        }

        // Saltar filas totalmente vacías
        if (!unidadData.numero || String(unidadData.numero).trim() === '') {
          result.unidades_ignoradas++;
          return;
        }

        // external_id default = numero si no se mapeó
        if (!unidadData.external_id) unidadData.external_id = String(unidadData.numero).trim();

        unidadData.proyecto_id = proyectoId;

        // Validar con el modelo
        const errors = validateUnidad(unidadData);
        if (errors.length > 0) {
          result.filas_invalidas++;
          result.errores.push({
            fila: idx + 1,
            numero: unidadData.numero || '?',
            errores: errors
          });
          if (result.preview.length < 5) result.preview.push({ ...unidadData, __error: errors.join('; ') });
          return;
        }

        result.filas_validas++;
        if (result.preview.length < 5) result.preview.push({ ...unidadData });

        if (dryRun) return;

        // Upsert real: existe por (proyecto_id, external_id)?
        const existing = window.DATA.unidades.find(
          un => un.proyecto_id === proyectoId && un.external_id === unidadData.external_id
        );
        if (existing) {
          updateUnidad(existing.id, unidadData);
          result.unidades_actualizadas++;
        } else {
          addUnidad(unidadData);
          result.unidades_creadas++;
        }
      } catch (e) {
        result.filas_invalidas++;
        result.errores.push({
          fila: idx + 1,
          numero: row.numero || '?',
          errores: [e.message]
        });
      }
    });

    result.duracion_ms = Date.now() - start;

    if (!dryRun) {
      // Recompute estado del proyecto (regla 8)
      recomputeProyectoEstado(proyectoId);
      // Audit log entry
      addAuditEntry({
        adapter: 'excel-upload',
        modo: 'manual',
        proyecto_id: proyectoId,
        proyectos_recibidos: 1,
        proyectos_creados: 0,
        proyectos_actualizados: 1,
        proyectos_invalidados: 0,
        unidades_recibidas: rows.length,
        unidades_creadas: result.unidades_creadas,
        unidades_actualizadas: result.unidades_actualizadas,
        unidades_ignoradas: result.unidades_ignoradas,
        errores: result.errores.map(e => ({ external_id: e.numero, msg: e.errores.join('; ') })),
        status: result.filas_invalidas > 0 ? 'partial' : 'success',
        duracion_ms: result.duracion_ms
      });
      persist();
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // CRUD: Proyectos
  // ---------------------------------------------------------------------------
  function addProyecto(p) {
    const errors = validateProyecto(p);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    const proyecto = {
      id: p.id || uid("p"),
      external_id: p.external_id || uid("ext"),
      inmobiliaria_id: p.inmobiliaria_id,
      slug: p.slug || slugify(p.nombre),
      nombre: p.nombre,
      region: p.region || "Metropolitana",
      comuna: p.comuna,
      direccion: p.direccion || "",
      gps_lat: p.gps_lat || null,
      gps_lon: p.gps_lon || null,
      etapa: p.etapa,
      fecha_entrega: p.fecha_entrega || null,
      anio_entrega: p.anio_entrega,
      precio_uf_min: Number(p.precio_uf_min),
      precio_uf_max: Number(p.precio_uf_max),
      pie_porcentaje: p.pie_porcentaje ? Number(p.pie_porcentaje) : null,
      bono_pie_implicito_porcentaje: p.bono_pie_implicito_porcentaje
        ? Number(p.bono_pie_implicito_porcentaje) : 0,
      reserva_clp: p.reserva_clp ? Number(p.reserva_clp) : null,
      total_unidades: p.total_unidades || null,
      total_pisos: p.total_pisos || null,
      descripcion: p.descripcion || "",
      imagen_portada: p.imagen_portada || `https://placehold.co/800x500/64748b/ffffff?text=${encodeURIComponent(p.nombre)}`,
      tipologias_disponibles: p.tipologias_disponibles || [],
      estado_negocio: p.estado_negocio || "activo",
      estado_ingesta: p.estado_ingesta || "ok",
      ultima_ingesta_ok: p.ultima_ingesta_ok || nowIso(),
      destacado: !!p.destacado,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    window.DATA.proyectos.push(proyecto);
    persist();
    return proyecto;
  }

  function updateProyecto(id, patch) {
    const i = window.DATA.proyectos.findIndex(p => p.id === id);
    if (i < 0) throw new Error("Proyecto no encontrado: " + id);
    const updated = { ...window.DATA.proyectos[i], ...patch, updated_at: nowIso() };
    const errors = validateProyecto(updated);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    window.DATA.proyectos[i] = updated;
    persist();
    return updated;
  }

  function deleteProyecto(id) {
    const i = window.DATA.proyectos.findIndex(p => p.id === id);
    if (i < 0) return false;
    window.DATA.proyectos.splice(i, 1);
    // Eliminar unidades asociadas
    window.DATA.unidades = window.DATA.unidades.filter(u => u.proyecto_id !== id);
    // Eliminar relaciones de condiciones
    window.DATA.proyectoCondiciones = window.DATA.proyectoCondiciones.filter(pc => pc.proyecto_id !== id);
    // Eliminar archivos del proyecto (cascade)
    if (window.DATA.archivos_proyecto) {
      window.DATA.archivos_proyecto = window.DATA.archivos_proyecto.filter(a => a.proyecto_id !== id);
    }
    persist();
    return true;
  }

  // ---------------------------------------------------------------------------
  // CRUD: Unidades
  // ---------------------------------------------------------------------------
  function addUnidad(u) {
    const errors = validateUnidad(u);
    if (errors.length > 0) throw new Error("Validación: " + errors.join("; "));
    const unidad = {
      id: u.id || uid("u"),
      external_id: u.external_id || uid("ext"),
      proyecto_id: u.proyecto_id,
      numero: u.numero,
      tipo: u.tipo || "departamento",
      tipologia: u.tipologia,
      modelo: u.modelo || null,
      orientacion: u.orientacion || null,
      piso: u.piso ? Number(u.piso) : null,
      superficie_total: u.superficie_total ? Number(u.superficie_total) : null,
      superficie_interior: u.superficie_interior ? Number(u.superficie_interior) : null,
      superficie_terraza: u.superficie_terraza ? Number(u.superficie_terraza) : null,
      precio_uf: Number(u.precio_uf),
      descuento_porcentaje: u.descuento_porcentaje ? Number(u.descuento_porcentaje) : null,
      bono_pie_porcentaje: u.bono_pie_porcentaje ? Number(u.bono_pie_porcentaje) : null,
      estacionamiento_incluido: u.estacionamiento_incluido ? Number(u.estacionamiento_incluido) : 0,
      bodega_incluida: u.bodega_incluida ? Number(u.bodega_incluida) : 0,
      estado: u.estado || "disponible",
      created_at: nowIso(),
      updated_at: nowIso()
    };
    window.DATA.unidades.push(unidad);
    persist();
    return unidad;
  }

  function updateUnidad(id, patch) {
    const i = window.DATA.unidades.findIndex(u => u.id === id);
    if (i < 0) throw new Error("Unidad no encontrada: " + id);
    const oldEstado = window.DATA.unidades[i].estado;
    const newEstado = patch.estado || oldEstado;
    if (oldEstado !== newEstado && !isValidTransition(oldEstado, newEstado)) {
      throw new Error(`Transición prohibida: ${oldEstado} → ${newEstado}. Ver docs/01-MODELO-DATOS.md sección 7.`);
    }
    window.DATA.unidades[i] = { ...window.DATA.unidades[i], ...patch, updated_at: nowIso() };
    recomputeProyectoEstado(window.DATA.unidades[i].proyecto_id);
    persist();
    return window.DATA.unidades[i];
  }

  function deleteUnidad(id) {
    const i = window.DATA.unidades.findIndex(u => u.id === id);
    if (i < 0) return false;
    window.DATA.unidades.splice(i, 1);
    persist();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Condiciones (relación N:M)
  // ---------------------------------------------------------------------------
  function setCondicionesProyecto(proyectoId, condicionesIds, valoresMap = {}) {
    // Reemplaza todas las condiciones del proyecto
    window.DATA.proyectoCondiciones = window.DATA.proyectoCondiciones.filter(pc => pc.proyecto_id !== proyectoId);
    condicionesIds.forEach(cid => {
      window.DATA.proyectoCondiciones.push({
        id: uid("pc"),
        proyecto_id: proyectoId,
        condicion_id: cid,
        valor: valoresMap[cid] || null,
        created_at: nowIso()
      });
    });
    persist();
  }

  // ---------------------------------------------------------------------------
  // Validaciones (parte del normalizador)
  // ---------------------------------------------------------------------------
  function validateProyecto(p) {
    const errs = [];
    if (!p.nombre || p.nombre.trim().length < 3) errs.push("nombre requerido (≥3 chars)");
    if (!p.inmobiliaria_id) errs.push("inmobiliaria_id requerido");
    if (!p.comuna) errs.push("comuna requerida");
    if (!p.etapa || !["en_blanco", "en_verde", "entrega_inmediata"].includes(p.etapa))
      errs.push("etapa inválida");
    if (!p.anio_entrega || p.anio_entrega < 2020 || p.anio_entrega > 2050)
      errs.push("anio_entrega fuera de rango");
    const min = Number(p.precio_uf_min), max = Number(p.precio_uf_max);
    if (!min || min <= 0 || min > 100000) errs.push("precio_uf_min fuera de rango (0-100.000)");
    if (!max || max <= 0 || max > 100000) errs.push("precio_uf_max fuera de rango");
    if (min > max) errs.push("precio_uf_min > precio_uf_max");
    if (p.gps_lat && (p.gps_lat < -56 || p.gps_lat > -17))
      errs.push("gps_lat fuera de territorio chileno");
    if (p.gps_lon && (p.gps_lon < -76 || p.gps_lon > -66))
      errs.push("gps_lon fuera de territorio chileno");
    // Bono pie implícito: límite duro 20% según política comercial
    if (p.bono_pie_implicito_porcentaje !== undefined && p.bono_pie_implicito_porcentaje !== null) {
      const bip = Number(p.bono_pie_implicito_porcentaje);
      if (isNaN(bip) || bip < 0 || bip > 20)
        errs.push("bono_pie_implicito_porcentaje fuera de rango (0-20)");
    }
    return errs;
  }

  function validateUnidad(u) {
    const errs = [];
    if (!u.proyecto_id) errs.push("proyecto_id requerido");
    if (!u.numero) errs.push("numero requerido");
    const tipologiasValidas = ["studio", "1d1b", "2d1b", "2d2b", "3d2b", "3d3b", "4d3b", "local", "oficina", "bodega", "estacionamiento"];
    if (!u.tipologia || !tipologiasValidas.includes(u.tipologia))
      errs.push("tipologia inválida");
    const tiposValidos = ["departamento", "local", "oficina", "bodega", "estacionamiento"];
    if (u.tipo && !tiposValidos.includes(u.tipo)) errs.push("tipo inválido");
    const estadosValidos = ["disponible", "reservada", "vendida", "bloqueada"];
    if (u.estado && !estadosValidos.includes(u.estado)) errs.push("estado inválido");
    const precio = Number(u.precio_uf);
    if (!precio || precio <= 0 || precio > 100000) errs.push("precio_uf fuera de rango");
    return errs;
  }

  // ---------------------------------------------------------------------------
  // Transiciones de estado de Unidad — docs/01-MODELO-DATOS.md sección 7.2
  // Versión simplificada por instrucción CEO 2026-05-05:
  //   disponible ↔ bloqueada
  //   disponible → reservada → vendida
  //   bloqueada → vendida ⛔ (debe pasar por disponible)
  // ---------------------------------------------------------------------------
  const TRANSITIONS = {
    disponible: ["reservada", "bloqueada"],
    reservada:  ["vendida", "disponible"],
    bloqueada:  ["disponible"],
    vendida:    [] // estado terminal
  };

  function isValidTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
  }

  /**
   * Recalcula estado_negocio del proyecto según count de unidades disponibles.
   * Regla 8 del modelo (01-MODELO-DATOS.md): si 0 disponibles → agotado.
   * Si vuelve a tener disponibles y estaba agotado → activo.
   * No toca proyectos en estado "pausado" (decisión manual del admin).
   */
  function recomputeProyectoEstado(proyectoId) {
    const idx = window.DATA.proyectos.findIndex(p => p.id === proyectoId);
    if (idx < 0) return;
    const p = window.DATA.proyectos[idx];
    if (p.estado_negocio === 'pausado') return; // respetar decisión manual

    const disponibles = window.DATA.unidades.filter(
      u => u.proyecto_id === proyectoId && u.estado === 'disponible'
    ).length;

    let nuevo = p.estado_negocio;
    if (disponibles === 0 && p.estado_negocio === 'activo') nuevo = 'agotado';
    else if (disponibles > 0 && p.estado_negocio === 'agotado') nuevo = 'activo';

    if (nuevo !== p.estado_negocio) {
      window.DATA.proyectos[idx] = { ...p, estado_negocio: nuevo, updated_at: nowIso() };
    }
  }

  // ---------------------------------------------------------------------------
  // INGESTA — Patrón Adaptador + Normalizador
  // docs/02-INGESTA.md
  // ---------------------------------------------------------------------------

  // Adaptador base: contrato común
  // - fetch_raw_stock() → ProyectoCrudo[]
  // - health_check() → boolean
  const Adapters = {
    /**
     * Adaptador "mock": genera datos sintéticos. Para validación end-to-end del pattern.
     */
    mock: {
      name: "mock-generator",
      health_check: () => true,
      fetch_raw_stock: (config = {}) => {
        const cantidad = config.cantidad || 1;
        const inmobiliariaId = config.inmobiliaria_id;
        const inm = window.DATA.inmobiliarias.find(i => i.id === inmobiliariaId);
        if (!inm) throw new Error("Inmobiliaria no existe: " + inmobiliariaId);

        const comunas = ["Las Condes", "Vitacura", "Providencia", "Ñuñoa", "Macul", "La Florida"];
        const tipologias = ["1d1b", "2d1b", "2d2b", "3d2b"];
        const out = [];
        for (let i = 0; i < cantidad; i++) {
          const comuna = comunas[Math.floor(Math.random() * comunas.length)];
          const minUf = 2500 + Math.floor(Math.random() * 5000);
          const projExtId = "MOCK-" + Date.now() + "-" + i;
          out.push({
            // Estructura cruda — el normalizador la convierte
            __raw: true,
            external_id: projExtId,
            inmobiliaria_id: inmobiliariaId,
            nombre: `Proyecto Mock ${inm.nombre_publico} ${i + 1}`,
            comuna: comuna,
            region: "Metropolitana",
            direccion: `Calle Ejemplo ${100 + i * 10}`,
            etapa: Math.random() > 0.5 ? "en_verde" : "entrega_inmediata",
            anio_entrega: 2026 + Math.floor(Math.random() * 3),
            precio_uf_min: minUf,
            precio_uf_max: minUf + 1500,
            pie_porcentaje: 20,
            tipologias_disponibles: tipologias.slice(0, 2 + Math.floor(Math.random() * 2)),
            descripcion: "Proyecto generado por adaptador mock. Solo para validar el flujo.",
            unidades_crudas: Array.from({ length: 3 }, (_, j) => ({
              external_id: projExtId + "-U" + (j + 1),
              numero: String(101 + j * 100),
              tipologia: tipologias[j % tipologias.length],
              piso: 1 + j,
              superficie_total: 45 + j * 10,
              precio_uf: minUf + j * 200,
              estado: "disponible"
            }))
          });
        }
        return out;
      }
    },

    /**
     * Adaptador "json-paste": el usuario pega un JSON con el array de proyectos crudos.
     */
    "json-paste": {
      name: "json-paste",
      health_check: () => true,
      fetch_raw_stock: (config = {}) => {
        if (!config.json) throw new Error("Falta config.json (string)");
        let parsed;
        try { parsed = JSON.parse(config.json); }
        catch (e) { throw new Error("JSON inválido: " + e.message); }
        if (!Array.isArray(parsed)) throw new Error("Esperaba un array de proyectos crudos");
        return parsed.map(p => ({ ...p, __raw: true, inmobiliaria_id: p.inmobiliaria_id || config.inmobiliaria_id }));
      }
    }
  };

  /**
   * Normalizador: traduce ProyectoCrudo → Proyecto + Unidades, validando.
   * Hace upsert por (inmobiliaria_id, external_id) para Proyecto
   *           y por (proyecto_id, external_id) para Unidad.
   */
  function normalizar(crudo) {
    if (!crudo.inmobiliaria_id) throw new Error("inmobiliaria_id requerido en crudo");
    if (!crudo.external_id) throw new Error("external_id requerido en crudo");

    const proyectoData = {
      external_id: crudo.external_id,
      inmobiliaria_id: crudo.inmobiliaria_id,
      slug: crudo.slug || slugify(crudo.nombre + "-" + crudo.external_id),
      nombre: crudo.nombre,
      region: crudo.region || "Metropolitana",
      comuna: crudo.comuna,
      direccion: crudo.direccion || "",
      etapa: crudo.etapa,
      fecha_entrega: crudo.fecha_entrega,
      anio_entrega: Number(crudo.anio_entrega),
      precio_uf_min: Number(crudo.precio_uf_min),
      precio_uf_max: Number(crudo.precio_uf_max),
      pie_porcentaje: crudo.pie_porcentaje,
      tipologias_disponibles: crudo.tipologias_disponibles || [],
      descripcion: crudo.descripcion || "",
      imagen_portada: crudo.imagen_portada,
      estado_negocio: "activo",
      estado_ingesta: "ok",
      ultima_ingesta_ok: nowIso(),
      destacado: false
    };

    const errors = validateProyecto(proyectoData);
    if (errors.length > 0) throw new Error("Validación proyecto: " + errors.join("; "));

    return {
      proyecto: proyectoData,
      unidades: (crudo.unidades_crudas || []).map(uc => ({
        external_id: uc.external_id,
        numero: uc.numero,
        tipo: uc.tipo || "departamento",
        tipologia: uc.tipologia,
        piso: uc.piso,
        orientacion: uc.orientacion,
        superficie_total: uc.superficie_total,
        superficie_interior: uc.superficie_interior,
        superficie_terraza: uc.superficie_terraza,
        precio_uf: Number(uc.precio_uf),
        estado: uc.estado || "disponible"
      }))
    };
  }

  /**
   * Sync: corre un adaptador y aplica los resultados al catálogo.
   * Hace upsert (no duplica si external_id ya existe).
   */
  function runIngesta(adapterName, config = {}) {
    const adapter = Adapters[adapterName];
    if (!adapter) throw new Error("Adaptador no existe: " + adapterName);

    const start = Date.now();
    const result = {
      adapter: adapterName,
      modo: config.modo || "manual",
      proyectos_recibidos: 0,
      proyectos_creados: 0,
      proyectos_actualizados: 0,
      proyectos_invalidados: 0,
      unidades_recibidas: 0,
      unidades_creadas: 0,
      unidades_actualizadas: 0,
      errores: [],
      status: "success"
    };

    try {
      if (!adapter.health_check()) {
        result.status = "failed";
        result.errores.push({ tipo: "health_check", msg: "Health check failed" });
        addAuditEntry({ ...result, duracion_ms: Date.now() - start });
        return result;
      }

      const crudos = adapter.fetch_raw_stock(config);
      result.proyectos_recibidos = crudos.length;

      for (const crudo of crudos) {
        try {
          const { proyecto, unidades } = normalizar(crudo);
          result.unidades_recibidas += unidades.length;

          // Upsert proyecto por (inmobiliaria_id, external_id)
          const existing = window.DATA.proyectos.find(
            p => p.inmobiliaria_id === proyecto.inmobiliaria_id && p.external_id === proyecto.external_id
          );

          let proyectoId;
          if (existing) {
            updateProyecto(existing.id, proyecto);
            proyectoId = existing.id;
            result.proyectos_actualizados++;
          } else {
            const created = addProyecto(proyecto);
            proyectoId = created.id;
            result.proyectos_creados++;
          }

          // Upsert unidades por (proyecto_id, external_id)
          for (const uData of unidades) {
            const existingU = window.DATA.unidades.find(
              u => u.proyecto_id === proyectoId && u.external_id === uData.external_id
            );
            if (existingU) {
              updateUnidad(existingU.id, uData);
              result.unidades_actualizadas++;
            } else {
              addUnidad({ ...uData, proyecto_id: proyectoId });
              result.unidades_creadas++;
            }
          }
        } catch (e) {
          result.proyectos_invalidados++;
          result.errores.push({
            external_id: crudo.external_id || "?",
            msg: e.message
          });
        }
      }

      if (result.proyectos_invalidados > 0 && result.proyectos_creados + result.proyectos_actualizados === 0) {
        result.status = "failed";
      } else if (result.proyectos_invalidados > 0) {
        result.status = "partial";
      }
    } catch (e) {
      result.status = "failed";
      result.errores.push({ tipo: "fatal", msg: e.message });
    }

    result.duracion_ms = Date.now() - start;
    addAuditEntry(result);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 80);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUDIT_KEY);
    location.reload();
  }

  function exportData() {
    return JSON.stringify(window.DATA, null, 2);
  }

  function importData(json) {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    if (!parsed.proyectos || !parsed.unidades) throw new Error("Estructura inválida");
    window.DATA = parsed;
    persist();
  }

  // ---------------------------------------------------------------------------
  // Inicialización + API pública
  // ---------------------------------------------------------------------------
  const source = hydrate();
  window.Marketplace = {
    source, // 'localStorage' o 'seeds'
    ROLES, register, login, logout, currentUser, isAuthenticated, hasRole,
    listUsuarios, deleteUsuario, updateUsuario, validateEmail,
    addCliente, updateCliente, deleteCliente, clientesByBroker, clienteById, validateCliente, validateRut,
    CHILE_REGIONES, CLIENTE_SEXOS, CLIENTE_ESTADO_CIVIL, CLIENTE_REGIMEN_MATRIMONIAL,
    CLIENTE_TIPO_COMPRA, CLIENTE_CONDICION_LABORAL, CLIENTE_PROPOSITO_COMPRA,
    listAllClientes, listBrokers, reassignCliente, reassignCotizacion, reassignReserva,
    addCotizacion, cotizacionesByBroker, cotizacionesByCliente, deleteCotizacion,
    addReserva, cancelReserva, confirmarReserva, escriturarReserva,
    reservasByBroker, reservasByCliente, reservaActivaByUnidad,
    RESERVA_ESTADOS, RESERVA_METODOS, COMPROBANTE_MAX_BYTES, COMPROBANTE_MIMETYPES,
    addInmobiliaria, updateInmobiliaria, deleteInmobiliaria, countProyectosByInmobiliaria,
    addArchivoProyecto, updateArchivoProyecto, deleteArchivoProyecto,
    archivosByProyecto, archivoById,
    TIPOS_ARCHIVO_PROYECTO, TIPOS_ARCHIVO_LABELS, ARCHIVO_PROYECTO_MAX_BYTES,
    // Excel import
    EXCEL_FIELDS_PROYECTO, EXCEL_FIELDS_UNIDAD, EXCEL_FIELDS_ALL,
    getExcelFieldsProyecto, getExcelFieldsUnidad, getExcelFieldsAll, getExcelFieldByKey,
    getMapeoForInmobiliaria, getMapeoForInmobiliariaSheet, saveMapeoForInmobiliaria, deleteMapeoForInmobiliaria,
    detectarProyectosExcel, sugerirMatchesProyectos,
    normalizeCellValue, importExcelUnidades, importExcelMultiProyecto,
    addProyecto, updateProyecto, deleteProyecto,
    addUnidad, updateUnidad, deleteUnidad, recomputeProyectoEstado,
    setCondicionesProyecto,
    isValidTransition, TRANSITIONS,
    validateInmobiliaria, validateProyecto, validateUnidad,
    runIngesta, normalizar, Adapters,
    getAuditLog, clearAuditLog,
    reset, exportData, importData,
    persist, slugify
  };
})();
