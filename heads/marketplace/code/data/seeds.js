// =============================================================================
// SEEDS — Datos ficticios sanitizados para MVP
// Cero datos reales del ecosistema origen. Cero plataformas vetadas.
// Modelo conforme a docs/01-MODELO-DATOS.md
// =============================================================================

window.DATA = {
  // ---------------------------------------------------------------------------
  // Inmobiliarias (3)
  // ---------------------------------------------------------------------------
  inmobiliarias: [
    {
      id: "im-001",
      slug: "constructora-aurora",
      nombre_publico: "Constructora Aurora",
      logo_url: "https://placehold.co/120x60/1e3a5f/ffffff?text=AURORA",
      descripcion: "Desarrollos urbanos de alta gama en zona oriente.",
      sitio_web: "https://aurora.ejemplo.cl",
      activa: true,
      fuente_stock_tipo: "api",
      created_at: "2026-01-15T10:00:00Z",
      updated_at: "2026-04-30T08:00:00Z"
    },
    {
      id: "im-002",
      slug: "inmobiliaria-boreal",
      nombre_publico: "Inmobiliaria Boreal",
      logo_url: "https://placehold.co/120x60/2d5f3f/ffffff?text=BOREAL",
      descripcion: "Proyectos sustentables en comunas céntricas.",
      sitio_web: "https://boreal.ejemplo.cl",
      activa: true,
      fuente_stock_tipo: "sheets",
      created_at: "2026-01-20T10:00:00Z",
      updated_at: "2026-04-29T15:00:00Z"
    },
    {
      id: "im-003",
      slug: "desarrollos-cumbre",
      nombre_publico: "Desarrollos Cumbre",
      logo_url: "https://placehold.co/120x60/5f3a1e/ffffff?text=CUMBRE",
      descripcion: "Inversión inmobiliaria con foco en renta.",
      sitio_web: "https://cumbre.ejemplo.cl",
      activa: true,
      fuente_stock_tipo: "csv",
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-04-15T10:00:00Z"
    }
  ],

  // ---------------------------------------------------------------------------
  // Condiciones comerciales (catálogo cerrado)
  // ---------------------------------------------------------------------------
  condicionesComerciales: [
    { id: "cc-01", tag: "descuento_directo", nombre_publico: "Descuento directo", publica: true, orden: 1 },
    { id: "cc-02", tag: "bono_pie", nombre_publico: "Bono al pie", publica: true, orden: 2 },
    { id: "cc-03", tag: "pie_diferido", nombre_publico: "Pie diferido", publica: true, orden: 3 },
    { id: "cc-04", tag: "cuoton_inicial", nombre_publico: "Cuotón inicial", publica: true, orden: 4 },
    { id: "cc-05", tag: "cuoton_final", nombre_publico: "Cuotón final", publica: true, orden: 5 },
    { id: "cc-06", tag: "escrituracion_financiada", nombre_publico: "Escrituración financiada", publica: true, orden: 6 },
    { id: "cc-07", tag: "entrega_inmediata", nombre_publico: "Entrega inmediata", publica: true, orden: 7 },
    { id: "cc-08", tag: "arriendo_garantizado", nombre_publico: "Arriendo garantizado", publica: true, orden: 8 }
  ],

  // ---------------------------------------------------------------------------
  // Proyectos (6) — incluye casos de borde para demostrar el modelo
  // ---------------------------------------------------------------------------
  proyectos: [
    {
      id: "p-001",
      external_id: "AUR-2025-LC-MIR",
      inmobiliaria_id: "im-001",
      slug: "edificio-mirador-las-condes",
      nombre: "Edificio Mirador Las Condes",
      region: "Metropolitana",
      comuna: "Las Condes",
      direccion: "Av. Apoquindo 4500",
      gps_lat: -33.4172, gps_lon: -70.5476,
      etapa: "entrega_inmediata",
      fecha_entrega: "2025-08-15",
      anio_entrega: 2025,
      precio_uf_min: 4200, precio_uf_max: 7800,
      pie_porcentaje: 20, reserva_clp: 500000,
      total_unidades: 80, total_pisos: 18,
      descripcion: "Edificio premium con vista panorámica a la cordillera. Áreas comunes de primer nivel.",
      imagen_portada: "https://placehold.co/800x500/1e3a5f/ffffff?text=Mirador+Las+Condes",
      tipologias_disponibles: ["1d1b", "2d2b", "3d2b"],
      estado_negocio: "activo",
      estado_ingesta: "ok",
      ultima_ingesta_ok: "2026-04-30T08:00:00Z",
      destacado: true,
      created_at: "2026-01-15T10:00:00Z",
      updated_at: "2026-04-30T08:00:00Z"
    },
    {
      id: "p-002",
      external_id: "AUR-2027-VIT-PARQ",
      inmobiliaria_id: "im-001",
      slug: "parque-vitacura-2027",
      nombre: "Parque Vitacura 2027",
      region: "Metropolitana",
      comuna: "Vitacura",
      direccion: "Av. Kennedy 7800",
      gps_lat: -33.3850, gps_lon: -70.5900,
      etapa: "en_blanco",
      fecha_entrega: "2027-12-01",
      anio_entrega: 2027,
      precio_uf_min: 6500, precio_uf_max: 12000,
      pie_porcentaje: 15, reserva_clp: 1000000,
      total_unidades: 120, total_pisos: 22,
      descripcion: "Proyecto en blanco con descuento de preventa. Cercano a parques y comercio.",
      imagen_portada: "https://placehold.co/800x500/2a4f7f/ffffff?text=Parque+Vitacura",
      tipologias_disponibles: ["2d2b", "3d2b", "3d3b", "4d3b"],
      estado_negocio: "activo",
      estado_ingesta: "ok",
      ultima_ingesta_ok: "2026-04-30T08:00:00Z",
      destacado: true,
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-04-30T08:00:00Z"
    },
    {
      id: "p-003",
      external_id: "BOR-2026-PRO-NORTE",
      inmobiliaria_id: "im-002",
      slug: "providencia-norte",
      nombre: "Providencia Norte",
      region: "Metropolitana",
      comuna: "Providencia",
      direccion: "Av. Pedro de Valdivia 2100",
      gps_lat: -33.4280, gps_lon: -70.6090,
      etapa: "en_verde",
      fecha_entrega: "2026-09-30",
      anio_entrega: 2026,
      precio_uf_min: 3800, precio_uf_max: 5400,
      pie_porcentaje: 20, reserva_clp: 500000,
      total_unidades: 60, total_pisos: 14,
      descripcion: "Edificio sustentable en zona consolidada. Cercano a Metro Pedro de Valdivia.",
      imagen_portada: "https://placehold.co/800x500/2d5f3f/ffffff?text=Providencia+Norte",
      tipologias_disponibles: ["studio", "1d1b", "2d1b", "2d2b"],
      estado_negocio: "activo",
      estado_ingesta: "ok",
      ultima_ingesta_ok: "2026-04-29T15:00:00Z",
      destacado: false,
      created_at: "2026-02-15T10:00:00Z",
      updated_at: "2026-04-29T15:00:00Z"
    },
    {
      id: "p-004",
      external_id: "BOR-2025-NUN-PARK",
      inmobiliaria_id: "im-002",
      slug: "nunoa-park",
      nombre: "Ñuñoa Park",
      region: "Metropolitana",
      comuna: "Ñuñoa",
      direccion: "Av. Irarrázaval 4500",
      gps_lat: -33.4570, gps_lon: -70.5800,
      etapa: "entrega_inmediata",
      fecha_entrega: "2025-12-01",
      anio_entrega: 2025,
      precio_uf_min: 3200, precio_uf_max: 4800,
      pie_porcentaje: 20, reserva_clp: 400000,
      total_unidades: 45, total_pisos: 10,
      descripcion: "Edificio en barrio residencial consolidado. Listo para escriturar.",
      imagen_portada: "https://placehold.co/800x500/3f5f2d/ffffff?text=Nunoa+Park",
      tipologias_disponibles: ["1d1b", "2d1b", "2d2b"],
      estado_negocio: "agotado", // CASO BORDE: todas las unidades vendidas
      estado_ingesta: "ok",
      ultima_ingesta_ok: "2026-04-29T15:00:00Z",
      destacado: false,
      created_at: "2026-02-15T10:00:00Z",
      updated_at: "2026-04-29T15:00:00Z"
    },
    {
      id: "p-005",
      external_id: "CUM-2027-SM-VERDE",
      inmobiliaria_id: "im-003",
      slug: "san-miguel-verde",
      nombre: "San Miguel Verde",
      region: "Metropolitana",
      comuna: "San Miguel",
      direccion: "Gran Avenida 5400",
      gps_lat: -33.4960, gps_lon: -70.6480,
      etapa: "en_verde",
      fecha_entrega: "2027-03-15",
      anio_entrega: 2027,
      precio_uf_min: 2400, precio_uf_max: 3600,
      pie_porcentaje: 15, reserva_clp: 300000,
      total_unidades: 90, total_pisos: 16,
      descripcion: "Inversión accesible con foco en arriendo. Programa de arriendo garantizado.",
      imagen_portada: "https://placehold.co/800x500/5f3a1e/ffffff?text=San+Miguel+Verde",
      tipologias_disponibles: ["studio", "1d1b", "2d1b"],
      estado_negocio: "activo",
      estado_ingesta: "ok",
      ultima_ingesta_ok: "2026-04-15T10:00:00Z",
      destacado: true,
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-04-15T10:00:00Z"
    },
    {
      id: "p-006",
      external_id: "CUM-2026-LF-TORRE",
      inmobiliaria_id: "im-003",
      slug: "torre-la-florida",
      nombre: "Torre La Florida",
      region: "Metropolitana",
      comuna: "La Florida",
      direccion: "Av. Vicuña Mackenna 7200",
      gps_lat: -33.5230, gps_lon: -70.5980,
      etapa: "en_verde",
      fecha_entrega: "2026-11-30",
      anio_entrega: 2026,
      precio_uf_min: 2800, precio_uf_max: 4200,
      pie_porcentaje: 20, reserva_clp: 350000,
      total_unidades: 70, total_pisos: 18,
      descripcion: "Cercano a Metro Bellavista de La Florida. Buena conectividad.",
      imagen_portada: "https://placehold.co/800x500/7f5f2a/ffffff?text=Torre+La+Florida",
      tipologias_disponibles: ["1d1b", "2d1b", "2d2b"],
      estado_negocio: "activo",
      estado_ingesta: "timeout", // CASO BORDE: fuente sin updates
      ultima_ingesta_ok: "2026-03-10T10:00:00Z", // hace ~55 días
      destacado: false,
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-03-10T10:00:00Z"
    }
  ],

  // ---------------------------------------------------------------------------
  // ProyectoCondicion — relación N:M (tabla relacional)
  // ---------------------------------------------------------------------------
  proyectoCondiciones: [
    // Mirador Las Condes
    { id: "pc-001", proyecto_id: "p-001", condicion_id: "cc-07", valor: null },          // entrega_inmediata
    { id: "pc-002", proyecto_id: "p-001", condicion_id: "cc-06", valor: null },          // escrituracion_financiada
    { id: "pc-003", proyecto_id: "p-001", condicion_id: "cc-01", valor: "5%" },          // descuento_directo
    // Parque Vitacura 2027 (preventa con descuento agresivo)
    { id: "pc-004", proyecto_id: "p-002", condicion_id: "cc-01", valor: "12%" },
    { id: "pc-005", proyecto_id: "p-002", condicion_id: "cc-03", valor: "24 cuotas" },   // pie_diferido
    { id: "pc-006", proyecto_id: "p-002", condicion_id: "cc-04", valor: "5%" },          // cuoton_inicial
    // Providencia Norte
    { id: "pc-007", proyecto_id: "p-003", condicion_id: "cc-02", valor: "3%" },          // bono_pie
    { id: "pc-008", proyecto_id: "p-003", condicion_id: "cc-03", valor: "12 cuotas" },
    // Ñuñoa Park (agotado, mantiene historial)
    { id: "pc-009", proyecto_id: "p-004", condicion_id: "cc-07", valor: null },
    // San Miguel Verde
    { id: "pc-010", proyecto_id: "p-005", condicion_id: "cc-08", valor: null },          // arriendo_garantizado
    { id: "pc-011", proyecto_id: "p-005", condicion_id: "cc-03", valor: "18 cuotas" },
    // Torre La Florida
    { id: "pc-012", proyecto_id: "p-006", condicion_id: "cc-02", valor: "2%" },
    { id: "pc-013", proyecto_id: "p-006", condicion_id: "cc-05", valor: "10%" }          // cuoton_final
  ],

  // ---------------------------------------------------------------------------
  // Unidades (~30) — incluye estado bloqueada para demo
  // ---------------------------------------------------------------------------
  unidades: [
    // Mirador Las Condes (p-001) — 6 unidades
    { id: "u-001", external_id: "AUR-LC-1205", proyecto_id: "p-001", numero: "1205", tipo: "departamento", tipologia: "1d1b", piso: 12, orientacion: "NO", superficie_total: 48, superficie_interior: 42, superficie_terraza: 6, precio_uf: 4250, descuento_porcentaje: 5, estacionamiento_incluido: 1, bodega_incluida: 1, estado: "disponible" },
    { id: "u-002", external_id: "AUR-LC-1206", proyecto_id: "p-001", numero: "1206", tipo: "departamento", tipologia: "2d2b", piso: 12, orientacion: "NO", superficie_total: 72, superficie_interior: 65, superficie_terraza: 7, precio_uf: 5800, descuento_porcentaje: 5, estacionamiento_incluido: 1, bodega_incluida: 1, estado: "disponible" },
    { id: "u-003", external_id: "AUR-LC-1505", proyecto_id: "p-001", numero: "1505", tipo: "departamento", tipologia: "2d2b", piso: 15, orientacion: "NO", superficie_total: 75, superficie_interior: 68, superficie_terraza: 7, precio_uf: 6100, estacionamiento_incluido: 1, bodega_incluida: 1, estado: "reservada" },
    { id: "u-004", external_id: "AUR-LC-1801", proyecto_id: "p-001", numero: "1801", tipo: "departamento", tipologia: "3d2b", piso: 18, orientacion: "NO", superficie_total: 110, superficie_interior: 95, superficie_terraza: 15, precio_uf: 7800, estacionamiento_incluido: 2, bodega_incluida: 1, estado: "disponible" },
    { id: "u-005", external_id: "AUR-LC-EST-12", proyecto_id: "p-001", numero: "EST-12", tipo: "estacionamiento", tipologia: "estacionamiento", piso: -1, superficie_total: 14, precio_uf: 220, estado: "disponible" },
    { id: "u-006", external_id: "AUR-LC-0801", proyecto_id: "p-001", numero: "0801", tipo: "departamento", tipologia: "1d1b", piso: 8, orientacion: "SP", superficie_total: 48, superficie_interior: 42, superficie_terraza: 6, precio_uf: 4200, estado: "bloqueada" }, // BLOQUEADA: en revisión legal

    // Parque Vitacura 2027 (p-002) — 5 unidades
    { id: "u-007", external_id: "AUR-VIT-0301", proyecto_id: "p-002", numero: "0301", tipo: "departamento", tipologia: "2d2b", piso: 3, orientacion: "NO", superficie_total: 78, superficie_interior: 70, superficie_terraza: 8, precio_uf: 6500, descuento_porcentaje: 12, bono_pie_porcentaje: 0, estacionamiento_incluido: 1, bodega_incluida: 1, estado: "disponible" },
    { id: "u-008", external_id: "AUR-VIT-0801", proyecto_id: "p-002", numero: "0801", tipo: "departamento", tipologia: "3d2b", piso: 8, orientacion: "NO", superficie_total: 110, superficie_interior: 95, superficie_terraza: 15, precio_uf: 8400, descuento_porcentaje: 12, estacionamiento_incluido: 2, bodega_incluida: 1, estado: "disponible" },
    { id: "u-009", external_id: "AUR-VIT-1501", proyecto_id: "p-002", numero: "1501", tipo: "departamento", tipologia: "3d3b", piso: 15, orientacion: "NO", superficie_total: 130, superficie_interior: 110, superficie_terraza: 20, precio_uf: 9800, descuento_porcentaje: 12, estacionamiento_incluido: 2, bodega_incluida: 1, estado: "disponible" },
    { id: "u-010", external_id: "AUR-VIT-2201", proyecto_id: "p-002", numero: "2201", tipo: "departamento", tipologia: "4d3b", piso: 22, orientacion: "NO", superficie_total: 165, superficie_interior: 140, superficie_terraza: 25, precio_uf: 12000, descuento_porcentaje: 8, estacionamiento_incluido: 2, bodega_incluida: 2, estado: "disponible" },
    { id: "u-011", external_id: "AUR-VIT-1505", proyecto_id: "p-002", numero: "1505", tipo: "departamento", tipologia: "2d2b", piso: 15, orientacion: "SP", superficie_total: 75, superficie_interior: 68, superficie_terraza: 7, precio_uf: 7200, descuento_porcentaje: 12, estacionamiento_incluido: 1, bodega_incluida: 1, estado: "reservada" },

    // Providencia Norte (p-003) — 5 unidades
    { id: "u-012", external_id: "BOR-PRO-0205", proyecto_id: "p-003", numero: "0205", tipo: "departamento", tipologia: "studio", piso: 2, orientacion: "N", superficie_total: 32, superficie_interior: 30, precio_uf: 2400, bono_pie_porcentaje: 3, estado: "disponible" },
    { id: "u-013", external_id: "BOR-PRO-0501", proyecto_id: "p-003", numero: "0501", tipo: "departamento", tipologia: "1d1b", piso: 5, orientacion: "N", superficie_total: 45, superficie_interior: 42, precio_uf: 3200, bono_pie_porcentaje: 3, estado: "disponible" },
    { id: "u-014", external_id: "BOR-PRO-0801", proyecto_id: "p-003", numero: "0801", tipo: "departamento", tipologia: "2d1b", piso: 8, orientacion: "NO", superficie_total: 58, superficie_interior: 54, precio_uf: 4100, bono_pie_porcentaje: 3, estacionamiento_incluido: 1, estado: "disponible" },
    { id: "u-015", external_id: "BOR-PRO-1201", proyecto_id: "p-003", numero: "1201", tipo: "departamento", tipologia: "2d2b", piso: 12, orientacion: "NO", superficie_total: 72, superficie_interior: 66, precio_uf: 5400, bono_pie_porcentaje: 3, estacionamiento_incluido: 1, bodega_incluida: 1, estado: "disponible" },
    { id: "u-016", external_id: "BOR-PRO-0610", proyecto_id: "p-003", numero: "0610", tipo: "departamento", tipologia: "1d1b", piso: 6, orientacion: "S", superficie_total: 45, superficie_interior: 42, precio_uf: 3100, estado: "vendida" },

    // Ñuñoa Park (p-004) — 4 unidades, todas vendidas (estado_negocio = agotado)
    { id: "u-017", external_id: "BOR-NUN-0301", proyecto_id: "p-004", numero: "0301", tipo: "departamento", tipologia: "1d1b", piso: 3, superficie_total: 45, precio_uf: 3200, estado: "vendida" },
    { id: "u-018", external_id: "BOR-NUN-0501", proyecto_id: "p-004", numero: "0501", tipo: "departamento", tipologia: "2d1b", piso: 5, superficie_total: 60, precio_uf: 3800, estado: "vendida" },
    { id: "u-019", external_id: "BOR-NUN-0801", proyecto_id: "p-004", numero: "0801", tipo: "departamento", tipologia: "2d2b", piso: 8, superficie_total: 75, precio_uf: 4500, estado: "vendida" },
    { id: "u-020", external_id: "BOR-NUN-1001", proyecto_id: "p-004", numero: "1001", tipo: "departamento", tipologia: "2d2b", piso: 10, superficie_total: 78, precio_uf: 4800, estado: "vendida" },

    // San Miguel Verde (p-005) — 6 unidades
    { id: "u-021", external_id: "CUM-SM-0205", proyecto_id: "p-005", numero: "0205", tipo: "departamento", tipologia: "studio", piso: 2, orientacion: "N", superficie_total: 28, superficie_interior: 26, precio_uf: 2400, estado: "disponible" },
    { id: "u-022", external_id: "CUM-SM-0501", proyecto_id: "p-005", numero: "0501", tipo: "departamento", tipologia: "1d1b", piso: 5, orientacion: "NO", superficie_total: 38, superficie_interior: 35, precio_uf: 2800, estado: "disponible" },
    { id: "u-023", external_id: "CUM-SM-0801", proyecto_id: "p-005", numero: "0801", tipo: "departamento", tipologia: "1d1b", piso: 8, orientacion: "NO", superficie_total: 40, superficie_interior: 37, precio_uf: 3000, estado: "disponible" },
    { id: "u-024", external_id: "CUM-SM-1101", proyecto_id: "p-005", numero: "1101", tipo: "departamento", tipologia: "2d1b", piso: 11, orientacion: "NO", superficie_total: 55, superficie_interior: 50, precio_uf: 3400, estado: "disponible" },
    { id: "u-025", external_id: "CUM-SM-1601", proyecto_id: "p-005", numero: "1601", tipo: "departamento", tipologia: "2d1b", piso: 16, orientacion: "NO", superficie_total: 58, superficie_interior: 53, precio_uf: 3600, estado: "disponible" },
    { id: "u-026", external_id: "CUM-SM-0410", proyecto_id: "p-005", numero: "0410", tipo: "departamento", tipologia: "studio", piso: 4, orientacion: "S", superficie_total: 28, superficie_interior: 26, precio_uf: 2400, estado: "reservada" },

    // Torre La Florida (p-006) — 4 unidades, proyecto con timeout de ingesta
    { id: "u-027", external_id: "CUM-LF-0501", proyecto_id: "p-006", numero: "0501", tipo: "departamento", tipologia: "1d1b", piso: 5, superficie_total: 42, precio_uf: 2800, bono_pie_porcentaje: 2, estado: "disponible" },
    { id: "u-028", external_id: "CUM-LF-0801", proyecto_id: "p-006", numero: "0801", tipo: "departamento", tipologia: "2d1b", piso: 8, superficie_total: 56, precio_uf: 3400, bono_pie_porcentaje: 2, estado: "disponible" },
    { id: "u-029", external_id: "CUM-LF-1201", proyecto_id: "p-006", numero: "1201", tipo: "departamento", tipologia: "2d2b", piso: 12, superficie_total: 70, precio_uf: 4000, bono_pie_porcentaje: 2, estado: "disponible" },
    { id: "u-030", external_id: "CUM-LF-1801", proyecto_id: "p-006", numero: "1801", tipo: "departamento", tipologia: "2d2b", piso: 18, superficie_total: 72, precio_uf: 4200, bono_pie_porcentaje: 2, estado: "disponible" }
  ],

  // ---------------------------------------------------------------------------
  // Valor UF referencial (fallback si no hay API; sería reemplazable en runtime)
  // ---------------------------------------------------------------------------
  ufReferencia: {
    fecha: "2026-04-30",
    valor_clp: 39854
  },

  // ---------------------------------------------------------------------------
  // Usuarios — vacío en seeds. Se crean vía register() en la landing.
  // ---------------------------------------------------------------------------
  usuarios: [],

  // ---------------------------------------------------------------------------
  // Clientes — cada uno pertenece a un broker (broker_id = usuarios.id)
  // ---------------------------------------------------------------------------
  clientes: [],

  // ---------------------------------------------------------------------------
  // Cotizaciones — siempre vinculadas a (broker_id, cliente_id, unidad_id)
  // ---------------------------------------------------------------------------
  cotizaciones: [],

  // ---------------------------------------------------------------------------
  // Reservas — siempre vinculadas a (broker_id, cliente_id, unidad_id)
  // Cambian el estado de la unidad según el flujo definido en el repo.
  // ---------------------------------------------------------------------------
  reservas: [],

  // ---------------------------------------------------------------------------
  // Archivos por proyecto — brochures, imágenes, videos, planos, legales
  // Se gestionan desde admin · accesibles en read-only desde broker
  // ---------------------------------------------------------------------------
  archivos_proyecto: [],

  // ---------------------------------------------------------------------------
  // Mapeos de Excel guardados por inmobiliaria — para auto-aplicar en uploads
  // futuros del mismo formato. Estructura por entry:
  // { id, inmobiliaria_id, nombre, header_row, columnas: {ExcelHeader: targetField}, created_at }
  // ---------------------------------------------------------------------------
  mapeos_excel: [],

  // ---------------------------------------------------------------------------
  // Notificaciones para admin — eventos importantes del sistema
  // (cambios en stock por ingesta, reservas creadas/canceladas, etc.)
  // ---------------------------------------------------------------------------
  notificaciones: []
};
