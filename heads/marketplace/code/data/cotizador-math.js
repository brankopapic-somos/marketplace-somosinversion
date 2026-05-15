/**
 * cotizador-math.js
 * ------------------------------------------------------------------
 * Funciones puras para el cotizador inmobiliario.
 *
 * Convenciones:
 *   - Todos los porcentajes se reciben en escala 0-100 (no 0-1).
 *   - Todos los precios se manejan en UF (Unidad de Fomento).
 *   - Las funciones son puras: no leen DOM, no acceden a window.DATA,
 *     no producen efectos secundarios. Son seguras de unit-testear.
 *   - El redondeo se aplica solo en la capa de presentación.
 *     Acá trabajamos siempre con doubles, y el último paso usa
 *     `roundUf()` para estabilizar la salida a 2 decimales.
 *
 * Fórmula del BONO PIE (corregida):
 *   El bono pie no es un porcentaje aditivo sobre el precio, sino una
 *   rebaja al pie del cliente. Para que `precioInflado - bono == precioBase`
 *   se cumpla exactamente con el mismo % en ambos lados, debemos usar:
 *
 *       precioInflado = precioBase / (1 - bonoPorc/100)
 *       bonoUf        = precioInflado × bonoPorc/100
 *
 *   Verificación con bono 10%, base 1000 UF:
 *       precioInflado = 1000 / 0.90 = 1111.11
 *       bonoUf        = 1111.11 × 0.10 = 111.11
 *       precioInflado - bonoUf = 1000  ✓
 *
 * Fórmula del DESCUENTO (estándar):
 *   El descuento es una rebaja sobre el precio:
 *
 *       precioConDesc = precio × (1 - descPorc/100)
 *
 *   El % de descuento implícito es la operación inversa:
 *       precioBase = precioPublicado / (1 - descImplPorc/100)
 *
 * Pipeline completo del precio en una cotización:
 *   precioPublicado  (lo que sale del Excel / ingesta)
 *     ↓ quitar bono implícito y/o descuento implícito
 *   precioBase       (precio "limpio")
 *     ↓ inflar por bono cotizador
 *   precioConBono
 *     ↓ aplicar descuento cotizador
 *   precioFinal
 * ------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  // ============================================================
  // PRIMITIVAS DE REDONDEO
  // ============================================================

  /** Redondea a 2 decimales (UF) sin errores de coma flotante. */
  function roundUf(n) {
    if (n == null || isNaN(n)) return 0;
    return Math.round(Number(n) * 100) / 100;
  }

  /** Redondea a entero (CLP). */
  function roundClp(n) {
    if (n == null || isNaN(n)) return 0;
    return Math.round(Number(n));
  }

  /** Garantiza que un porcentaje esté en rango sano antes de aplicar fórmulas. */
  function clampPorc(porc, min, max) {
    const p = Number(porc) || 0;
    if (p < min) return min;
    if (p > max) return max;
    return p;
  }

  // ============================================================
  // BONO PIE — fórmula corregida (precio / (1 - bono%))
  // ============================================================

  /**
   * Infla un precio base aplicando bono pie del % indicado.
   * El bono real ES exactamente bonoPorc% del precio inflado,
   * de modo que (precioInflado - bonoReal) == precioBase.
   *
   * @param {number} precioBase    Precio "limpio" sin bono
   * @param {number} bonoPorc      % de bono pie (0-100, típicamente 0-20)
   * @returns {{ precioInflado:number, bonoUf:number }}
   */
  function inflarPorBono(precioBase, bonoPorc) {
    const base = Number(precioBase) || 0;
    const b = clampPorc(bonoPorc, 0, 99.99); // 100% rompería la división
    if (b === 0) return { precioInflado: base, bonoUf: 0 };
    const precioInflado = base / (1 - b / 100);
    const bonoUf = precioInflado - base; // == precioInflado * b/100
    return { precioInflado, bonoUf };
  }

  /**
   * Operación inversa: quita un bono implícito del precio publicado
   * para recuperar el precio base "limpio".
   *
   * Si el precio publicado YA fue inflado con bono implícito B%,
   * entonces: precioBase = precioPublicado × (1 - B/100)
   *
   * @param {number} precioPublicado
   * @param {number} bonoImplPorc
   * @returns {number} precioBase
   */
  function quitarBonoImplicito(precioPublicado, bonoImplPorc) {
    const pub = Number(precioPublicado) || 0;
    const b = clampPorc(bonoImplPorc, 0, 99.99);
    return pub * (1 - b / 100);
  }

  // ============================================================
  // DESCUENTO — fórmula estándar (precio × (1 - desc%))
  // ============================================================

  /**
   * Aplica un descuento sobre un precio.
   *
   * @param {number} precio
   * @param {number} descPorc      % de descuento (0-100, típicamente 0-50)
   * @returns {{ precioConDesc:number, descuentoUf:number }}
   */
  function aplicarDescuento(precio, descPorc) {
    const p = Number(precio) || 0;
    const d = clampPorc(descPorc, 0, 99.99);
    if (d === 0) return { precioConDesc: p, descuentoUf: 0 };
    const descuentoUf = p * (d / 100);
    return { precioConDesc: p - descuentoUf, descuentoUf };
  }

  /**
   * Operación inversa: quita un descuento implícito del precio publicado
   * para recuperar el precio base sin descuento.
   *
   * Si publicado = base × (1 - D/100), entonces:
   *   base = publicado / (1 - D/100)
   *
   * @param {number} precioPublicado
   * @param {number} descImplPorc
   * @returns {number} precioBase
   */
  function quitarDescuentoImplicito(precioPublicado, descImplPorc) {
    const pub = Number(precioPublicado) || 0;
    const d = clampPorc(descImplPorc, 0, 99.99);
    if (d === 0) return pub;
    return pub / (1 - d / 100);
  }

  // ============================================================
  // CADENA COMPLETA — publicado → base → con bono → final
  // ============================================================

  /**
   * Calcula el precio base "limpio" a partir del precio publicado
   * removiendo bono implícito y descuento implícito en el orden correcto.
   *
   * El precio publicado se construye así:
   *   precioPublicado = (base inflado por bonoImpl) × (1 - descImpl/100)
   *                   = base / (1 - bonoImpl/100) × (1 - descImpl/100)
   *
   * Por tanto el inverso es:
   *   base = precioPublicado / (1 - descImpl/100) × (1 - bonoImpl/100)
   *        = quitarBonoImplicito( quitarDescuentoImplicito(publicado, descImpl), bonoImpl )
   *
   * @param {number} precioPublicado
   * @param {number} bonoImplPorc
   * @param {number} descImplPorc
   * @returns {number} precioBase
   */
  function calcularPrecioBase(precioPublicado, bonoImplPorc, descImplPorc) {
    const sinDesc = quitarDescuentoImplicito(precioPublicado, descImplPorc);
    return quitarBonoImplicito(sinDesc, bonoImplPorc);
  }

  /**
   * Aplica bono y descuento del cotizador sobre el precio base.
   *
   * @param {number} precioBase
   * @param {number} bonoPorc
   * @param {number} descPorc
   * @returns {{ precioBase:number, precioConBono:number, bonoUf:number, precioFinal:number, descuentoUf:number }}
   */
  function aplicarAjustesCotizador(precioBase, bonoPorc, descPorc) {
    const { precioInflado: precioConBono, bonoUf } = inflarPorBono(precioBase, bonoPorc);
    const { precioConDesc: precioFinal, descuentoUf } = aplicarDescuento(precioConBono, descPorc);
    return { precioBase, precioConBono, bonoUf, precioFinal, descuentoUf };
  }

  // ============================================================
  // DIVIDENDO HIPOTECARIO — amortización francesa
  // ============================================================

  /**
   * Calcula el dividendo mensual con amortización francesa.
   *
   *   dividendo = saldo × ( i × (1+i)^n / ((1+i)^n - 1) )
   *
   * @param {number} saldoUf       Capital a financiar (UF)
   * @param {number} tasaAnualPorc CAE anual en %
   * @param {number} plazoMeses    Cantidad de cuotas
   * @returns {number} dividendo mensual en UF
   */
  function calcularDividendoMensual(saldoUf, tasaAnualPorc, plazoMeses) {
    const saldo = Number(saldoUf) || 0;
    const n = Number(plazoMeses) || 0;
    const tasaAnual = Number(tasaAnualPorc) || 0;
    if (saldo <= 0 || n <= 0 || tasaAnual <= 0) return 0;
    const i = tasaAnual / 100 / 12;
    const factor = Math.pow(1 + i, n);
    return saldo * (i * factor) / (factor - 1);
  }

  // ============================================================
  // COTIZACIÓN COMPLETA — función agregadora
  // ============================================================

  /**
   * Calcula una cotización completa: precio inflado, bono, descuento,
   * pie real, saldo a financiar, dividendo mensual y total con intereses.
   *
   * No produce efectos secundarios: solo retorna un objeto inmutable
   * con todos los valores derivados, listo para renderizar.
   *
   * @param {Object} input
   * @param {number} input.precioPublicadoUf    Precio que sale de DATA (ya con implícitos)
   * @param {number} input.bonoImplicitoPorc    Bono implícito en el precio publicado (default 0)
   * @param {number} input.descImplicitoPorc    Descuento implícito en el precio publicado (default 0)
   * @param {number} input.bonoPorc             Bono pie del cotizador (input usuario)
   * @param {number} input.descuentoPorc        Descuento del cotizador (input usuario)
   * @param {number} input.estCant              Cantidad de estacionamientos
   * @param {number} input.estPrecioUf          Precio unitario estacionamiento UF
   * @param {number} input.bodCant              Cantidad de bodegas
   * @param {number} input.bodPrecioUf          Precio unitario bodega UF
   * @param {number} input.piePorc              % de pie sobre precio total
   * @param {number} input.upfrontPorc          % pago inicial al firmar (sobre total)
   * @param {number} input.cuotasN              Cuotas de pie sin interés
   * @param {number} input.cuotaFinalPorc       % cuota final al escriturar
   * @param {number} input.plazoMeses           Plazo crédito en meses
   * @param {number} input.tasaAnualPorc        CAE %
   * @param {number} input.ufClp                Valor UF en CLP (para conversiones)
   * @returns {Object} desglose completo
   */
  function calcularCotizacion(input) {
    const i = input || {};
    // === 1. Inputs normalizados ===
    const precioPublicado = Number(i.precioPublicadoUf) || 0;
    const bonoImpl = Number(i.bonoImplicitoPorc) || 0;
    const descImpl = Number(i.descImplicitoPorc) || 0;
    const bonoPorc = Number(i.bonoPorc) || 0;
    const descuentoPorc = Number(i.descuentoPorc) || 0;

    const estCant = Number(i.estCant) || 0;
    const estPrecio = Number(i.estPrecioUf) || 0;
    const bodCant = Number(i.bodCant) || 0;
    const bodPrecio = Number(i.bodPrecioUf) || 0;

    const piePorc = Number(i.piePorc) || 0;
    const upfrontPorc = Number(i.upfrontPorc) || 0;
    const cuotasN = Number(i.cuotasN) || 0;
    // cuotasPorc: % del precio total distribuido en N cuotas.
    // Si se especifica > 0, se usa directamente (modo explícito).
    // Si es 0, se DERIVA del pie restante (modo legacy/auto).
    const cuotasPorc = Number(i.cuotasPorc) || 0;
    const cuotaFinalPorc = Number(i.cuotaFinalPorc) || 0;

    const plazoMeses = Number(i.plazoMeses) || 0;
    const tasa = Number(i.tasaAnualPorc) || 0;
    const ufClp = Number(i.ufClp) || 0;

    // === 2. Pipeline del precio de la UNIDAD ===
    // publicado → base → con bono → final
    const precioBase = calcularPrecioBase(precioPublicado, bonoImpl, descImpl);
    const { precioConBono, bonoUf, precioFinal, descuentoUf } =
      aplicarAjustesCotizador(precioBase, bonoPorc, descuentoPorc);

    // Delta vs lo cargado en sistema (negativo = más barato que la lista)
    const deltaVsPublicado = precioFinal - precioPublicado;

    // === 3. Adicionales (NO se afectan por bono/descuento) ===
    const estTotalUf = estCant * estPrecio;
    const bodTotalUf = bodCant * bodPrecio;
    const precioTotalUf = precioFinal + estTotalUf + bodTotalUf;

    // === 4. Pie ===
    const pieTotalUf = precioTotalUf * (piePorc / 100);
    // El bono pie se "devuelve" al cliente como rebaja sobre el pie
    const pieRealUf = Math.max(0, pieTotalUf - bonoUf);
    const pieRealPorc = precioTotalUf > 0 ? (pieRealUf / precioTotalUf) * 100 : 0;

    // === 5. Desglose del pie (upfront / cuotas / final) ===
    const upfrontUf = precioTotalUf * (upfrontPorc / 100);
    const cuotaFinalUf = precioTotalUf * (cuotaFinalPorc / 100);
    // cuotasUf: si cuotasPorc viene explícito (>0), se usa.
    //           Si no, se deriva de lo que sobra del pie real.
    const cuotasUfExplicito = precioTotalUf * (cuotasPorc / 100);
    const cuotasUf = cuotasPorc > 0
      ? cuotasUfExplicito
      : Math.max(0, pieRealUf - upfrontUf - cuotaFinalUf);
    const pieCuotaMensualUf = cuotasN > 0 ? cuotasUf / cuotasN : 0;
    const cuotasPorcEfectivo = precioTotalUf > 0 ? (cuotasUf / precioTotalUf) * 100 : 0;

    // === 6. Crédito hipotecario ===
    // Saldo a financiar = precio total - pie total (el bono NO afecta lo que financia el banco)
    const saldoUf = precioTotalUf - pieTotalUf;
    const divUf = calcularDividendoMensual(saldoUf, tasa, plazoMeses);
    const pagoTotalCreditoUf = divUf * plazoMeses;
    const pagoTotalUf = pieRealUf + pagoTotalCreditoUf;

    // === 7. Conversiones a CLP ===
    const precioFinalClp = precioFinal * ufClp;
    const precioTotalClp = precioTotalUf * ufClp;
    const pieRealClp = pieRealUf * ufClp;
    const saldoClp = saldoUf * ufClp;
    const divClp = divUf * ufClp;
    const pagoTotalClp = pagoTotalUf * ufClp;

    // === 8. Validaciones (no lanzan, retornan flags) ===
    const errores = [];
    const advertencias = [];
    // Si las condiciones de pie están desglosadas, su suma debería igualar pieReal%
    const cuotasPorcParaSuma = cuotasPorc > 0 ? cuotasPorc : cuotasPorcEfectivo;
    const desglosePorc = upfrontPorc + cuotasPorcParaSuma + cuotaFinalPorc;
    if (cuotasN > 0 && pieCuotaMensualUf < 0) {
      errores.push(
        `Cuota inicial (${upfrontPorc}%) + cuotas (${cuotasPorcParaSuma.toFixed(1)}%) + final (${cuotaFinalPorc}%) ` +
        `= ${desglosePorc.toFixed(1)}% excede el pie real (${pieRealPorc.toFixed(1)}%).`
      );
    }
    // En modo explícito (cuotasPorc>0): verificar coherencia con pieReal%
    if (cuotasPorc > 0 || (upfrontPorc + cuotaFinalPorc > 0 && cuotasN > 0)) {
      const diff = desglosePorc - pieRealPorc;
      if (Math.abs(diff) > 0.5) {
        advertencias.push(
          `Inicial (${upfrontPorc}%) + cuotas (${cuotasPorcParaSuma.toFixed(1)}%) + final (${cuotaFinalPorc}%) ` +
          `= ${desglosePorc.toFixed(1)}% ${diff > 0 ? 'excede' : 'no llega'} al pie real (${pieRealPorc.toFixed(1)}%). ` +
          `Diferencia: ${Math.abs(diff).toFixed(1)}%`
        );
      }
    }
    if (cuotasN === 0 && (upfrontPorc + cuotaFinalPorc) > 0) {
      const sumUpFinal = upfrontPorc + cuotaFinalPorc;
      const diff = pieRealPorc - sumUpFinal;
      if (Math.abs(diff) > 0.01) {
        errores.push(
          `Con 0 cuotas, cuota inicial + final (${sumUpFinal.toFixed(1)}%) ` +
          `debe igualar el pie real (${pieRealPorc.toFixed(1)}%). Diferencia: ${diff.toFixed(1)}%`
        );
      }
    }
    if (bonoUf > pieTotalUf) {
      errores.push(
        `Bono pie (UF ${roundUf(bonoUf)}) excede el pie total (UF ${roundUf(pieTotalUf)}). ` +
        `Bajá el bono o subí el % de pie.`
      );
    }

    return {
      // Inputs (eco)
      input: {
        precioPublicadoUf: precioPublicado,
        bonoImplicitoPorc: bonoImpl, descImplicitoPorc: descImpl,
        bonoPorc, descuentoPorc,
        estCant, estPrecioUf: estPrecio, bodCant, bodPrecioUf: bodPrecio,
        piePorc, upfrontPorc, cuotasN, cuotasPorc, cuotaFinalPorc,
        plazoMeses, tasaAnualPorc: tasa, ufClp
      },
      // Precio de la unidad
      precioBaseUf: precioBase,
      precioConBonoUf: precioConBono,
      precioFinalUf: precioFinal,
      bonoUf,
      descuentoUf,
      deltaVsPublicadoUf: deltaVsPublicado,
      // Adicionales
      estTotalUf, bodTotalUf,
      // Precio total (unidad + adicionales)
      precioTotalUf,
      // Pie
      pieTotalUf, pieRealUf, pieRealPorc,
      upfrontUf, cuotasUf, cuotasPorcEfectivo, cuotaFinalUf, pieCuotaMensualUf,
      // Crédito
      saldoUf, divUf, pagoTotalUf, pagoTotalCreditoUf,
      // CLP (conveniencias)
      precioFinalClp, precioTotalClp, pieRealClp, saldoClp, divClp, pagoTotalClp,
      // Validación
      esValido: errores.length === 0,
      errores,
      advertencias
    };
  }

  // ============================================================
  // EXPORT (window.CotizadorMath)
  // ============================================================

  global.CotizadorMath = {
    // Primitivas
    roundUf,
    roundClp,
    clampPorc,
    // Bono pie
    inflarPorBono,
    quitarBonoImplicito,
    // Descuento
    aplicarDescuento,
    quitarDescuentoImplicito,
    // Cadena combinada
    calcularPrecioBase,
    aplicarAjustesCotizador,
    // Crédito
    calcularDividendoMensual,
    // API alta
    calcularCotizacion
  };
})(typeof window !== 'undefined' ? window : globalThis);
