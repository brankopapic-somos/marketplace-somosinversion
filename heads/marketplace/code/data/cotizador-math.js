/**
 * cotizador-math.js
 * ================================================================
 * Lógica Canónica — Cálculo Financiero Inmobiliario Chile
 * ----------------------------------------------------------------
 * Implementa la spec auto-contenida del modelo de cálculo de pie +
 * bono pie + crédito hipotecario para proyectos inmobiliarios
 * chilenos.
 *
 * MODELO (resumen):
 *   1. precioDeptoConDescuento = precioLista × (1 − descuentoPct)
 *   2. precioFinal             = precioDeptoConDescuento + extras
 *   3. pie                     = precioFinal × piePct
 *   4. bonoPie (INFORMATIVO)   = precioFinal × bonoPiePct
 *   5. credito                 = precioFinal − pie
 *   6. dividendo               = PMT francés con tasaMensual geom.
 *
 * INVARIANTES OBLIGATORIOS:
 *   I1. pie + credito == precioFinal
 *   I2. precioFinal  <= precioLista + est + bod  (igualdad si desc=0)
 *   I3. pie, credito, bonoPie  >= 0
 *   I4. bonoPie NO entra al cuadre. Es display puro.
 *
 * REGLAS EXPLÍCITAS:
 *   ✅ Aplica descuento solo al depto, no a extras.
 *   ✅ Calcula un pie único (sin bruto/neto).
 *   ✅ Bono pie es display, no afecta cálculo.
 *   ❌ NO infla precio por bono pie.
 *   ❌ NO descuenta el bono del pie del cliente.
 *   ❌ NO aplica descuento a extras.
 *
 * ESCALA DE PORCENTAJES:
 *   La API principal (`calcularInversion`) trabaja en escala 0-1
 *   conforme a la spec (0.05 = 5%).
 *   Para conveniencia del UI (inputs en 0-100), se expone también
 *   `calcularInversionFromPercent` que convierte y delega.
 *
 * PRECISIÓN:
 *   Cálculos con doubles estándar.
 *   Helpers de redondeo (roundUf/roundClp) solo para presentación.
 *   Función pura: no muta inputs, no toca DOM, no side-effects.
 * ================================================================
 */
(function (global) {
  'use strict';

  // ============================================================
  // PRIMITIVAS DE REDONDEO
  // ============================================================

  function roundUf(n)  { return Math.round((Number(n) || 0) * 100) / 100; }
  function roundClp(n) { return Math.round(Number(n) || 0); }

  // ============================================================
  // VALIDACIÓN DE INPUTS (sección 3 de la spec)
  // ============================================================

  /**
   * Valida que los inputs estén en rango. Lanza Error con mensaje
   * CRITICAL si alguno falla — el cálculo debe abortar.
   */
  function validarInputs(i) {
    const errs = [];
    const isNum = (v) => typeof v === 'number' && isFinite(v);

    if (!isNum(i.precioListaUF) || i.precioListaUF <= 0)
      errs.push('precioListaUF debe ser número > 0');

    if (i.descuentoPct != null) {
      if (!isNum(i.descuentoPct) || i.descuentoPct < 0 || i.descuentoPct >= 1)
        errs.push('descuentoPct debe estar en [0, 1)');
    }
    if (i.estacionamientoUF != null) {
      if (!isNum(i.estacionamientoUF) || i.estacionamientoUF < 0)
        errs.push('estacionamientoUF debe ser >= 0');
    }
    if (i.bodegaUF != null) {
      if (!isNum(i.bodegaUF) || i.bodegaUF < 0)
        errs.push('bodegaUF debe ser >= 0');
    }
    if (!isNum(i.piePct) || i.piePct <= 0 || i.piePct >= 1)
      errs.push('piePct debe estar en (0, 1)');

    if (i.bonoPiePct != null) {
      if (!isNum(i.bonoPiePct) || i.bonoPiePct < 0 || i.bonoPiePct >= 1)
        errs.push('bonoPiePct debe estar en [0, 1)');
    }
    if (!isNum(i.caePct) || i.caePct <= 0 || i.caePct > 0.15)
      errs.push('caePct debe estar en (0, 0.15]');

    if (!Number.isInteger(i.plazoAnios) || i.plazoAnios < 1 || i.plazoAnios > 40)
      errs.push('plazoAnios debe ser entero entre 1 y 40');

    if (i.ufHoy != null) {
      if (!isNum(i.ufHoy) || i.ufHoy <= 0)
        errs.push('ufHoy debe ser número > 0');
    }

    if (errs.length) {
      throw new Error('CRITICAL: inputs inválidos — ' + errs.join('; '));
    }
  }

  // ============================================================
  // INVARIANTES (sección 5)
  // ============================================================

  /**
   * Verifica los 4 invariantes obligatorios. Lanza Error si falla.
   * Toleramos 0.01 UF de error de coma flotante para la comparación
   * exacta del cuadre (I1, I2).
   */
  function verificarInvariantes(r, i) {
    const TOL = 0.01;
    // I1 — cuadre del dinero
    if (Math.abs((r.pieUF + r.creditoUF) - r.precioFinalUF) > TOL) {
      throw new Error(`CRITICAL: I1 falló — pie(${r.pieUF}) + credito(${r.creditoUF}) != precioFinal(${r.precioFinalUF})`);
    }
    // I2 — precio final no excede la suma sin descuento
    const techo = i.precioListaUF + (i.estacionamientoUF || 0) + (i.bodegaUF || 0);
    if (r.precioFinalUF > techo + TOL) {
      throw new Error(`CRITICAL: I2 falló — precioFinal(${r.precioFinalUF}) > techo(${techo})`);
    }
    // I3 — no negatividad
    if (r.pieUF < 0 || r.creditoUF < 0 || r.bonoPieUF < 0) {
      throw new Error(`CRITICAL: I3 falló — algún valor es negativo (pie=${r.pieUF}, credito=${r.creditoUF}, bono=${r.bonoPieUF})`);
    }
    // I4 — bono es informativo (verificación estructural: el bono NO está sumado al cuadre)
    // Equivale a chequear que I1 ya pasó: pie + credito = precioFinal (sin restarle el bono).
    // Ya verificado arriba; este check es redundante pero documenta la intención.
  }

  // ============================================================
  // FÓRMULAS NÚCLEO (secciones 4 y 6 de la spec)
  // ============================================================

  /**
   * PASO 1 — Aplica descuento al precio lista del depto.
   * (NO se aplica a los extras.)
   */
  function aplicarDescuentoDepto(precioListaUF, descuentoPct) {
    return precioListaUF * (1 - (descuentoPct || 0));
  }

  /**
   * PASO 2 — Suma los extras (estacionamiento + bodega) al depto
   * ya con descuento aplicado.
   */
  function calcularPrecioFinal(precioDeptoConDescuentoUF, estUF, bodUF) {
    return precioDeptoConDescuentoUF + (estUF || 0) + (bodUF || 0);
  }

  /**
   * PASO 3 — Pie único sobre el precio final.
   * No hay "pie bruto" ni "pie neto". Pie es uno solo.
   */
  function calcularPie(precioFinalUF, piePct) {
    return precioFinalUF * piePct;
  }

  /**
   * PASO 4 — Bono pie INFORMATIVO.
   * Es display puro del catálogo. NO afecta pie ni crédito.
   */
  function calcularBonoPieInformativo(precioFinalUF, bonoPiePct) {
    return precioFinalUF * (bonoPiePct || 0);
  }

  /**
   * PASO 5 — Crédito hipotecario = lo que financia el banco.
   * El bono pie NO se resta acá. El cliente paga pie completo.
   */
  function calcularCredito(precioFinalUF, pieUF) {
    return precioFinalUF - pieUF;
  }

  /**
   * PASO 6 — Dividendo mensual con amortización francesa (PMT).
   * Tasa mensual derivada geométricamente de la CAE:
   *   tasaMensual = (1 + caePct)^(1/12) − 1
   * Esto convierte una tasa anual efectiva en su equivalente mensual
   * efectivo (financieramente correcto para CAE).
   */
  function calcularDividendo(creditoUF, caePct, plazoAnios) {
    if (creditoUF <= 0 || plazoAnios <= 0) return 0;
    const tasaMensual = Math.pow(1 + caePct, 1 / 12) - 1;
    if (tasaMensual === 0) return creditoUF / (plazoAnios * 12);
    const n = plazoAnios * 12;
    const factor = Math.pow(1 + tasaMensual, n);
    return creditoUF * tasaMensual * factor / (factor - 1);
  }

  // ============================================================
  // API PRINCIPAL — calcularInversion (escala 0-1, spec textual)
  // ============================================================

  /**
   * Función pura que implementa el modelo canónico completo.
   * Inputs y outputs según secciones 3, 4 y 11 de la spec.
   *
   * @param {Object} input
   * @param {number} input.precioListaUF       Precio lista del depto (> 0)
   * @param {number} [input.descuentoPct=0]    Descuento sobre depto [0, 1)
   * @param {number} [input.estacionamientoUF=0]
   * @param {number} [input.bodegaUF=0]
   * @param {number} input.piePct              % pie (0, 1)
   * @param {number} [input.bonoPiePct=0]      % bono pie informativo [0, 1)
   * @param {number} input.caePct              CAE anual (0, 0.15]
   * @param {number} input.plazoAnios          1-40
   * @param {number} [input.ufHoy=0]           Valor UF en CLP (para outputs CLP)
   * @returns {Object} Resultado del modelo (immutable)
   */
  function calcularInversion(input) {
    validarInputs(input);

    const precioListaUF       = input.precioListaUF;
    const descuentoPct        = input.descuentoPct || 0;
    const estacionamientoUF   = input.estacionamientoUF || 0;
    const bodegaUF            = input.bodegaUF || 0;
    const piePct              = input.piePct;
    const bonoPiePct          = input.bonoPiePct || 0;
    const caePct              = input.caePct;
    const plazoAnios          = input.plazoAnios;
    const ufHoy               = input.ufHoy || 0;

    // Pipeline canónico
    const precioDeptoConDescuentoUF = aplicarDescuentoDepto(precioListaUF, descuentoPct);
    const precioFinalUF             = calcularPrecioFinal(precioDeptoConDescuentoUF, estacionamientoUF, bodegaUF);
    const pieUF                     = calcularPie(precioFinalUF, piePct);
    const bonoPieUF                 = calcularBonoPieInformativo(precioFinalUF, bonoPiePct);
    const creditoUF                 = calcularCredito(precioFinalUF, pieUF);
    const dividendoUF               = calcularDividendo(creditoUF, caePct, plazoAnios);

    // Equivalentes CLP
    const precioFinalCLP = precioFinalUF * ufHoy;
    const pieCLP         = pieUF         * ufHoy;
    const creditoCLP     = creditoUF     * ufHoy;
    const dividendoCLP   = dividendoUF   * ufHoy;
    const bonoPieCLP     = bonoPieUF     * ufHoy;
    const precioDeptoConDescuentoCLP = precioDeptoConDescuentoUF * ufHoy;

    const result = {
      // === Modelo canónico ===
      precioListaUF,
      descuentoPct,
      precioDeptoConDescuentoUF,
      estacionamientoUF,
      bodegaUF,
      precioFinalUF,
      piePct,
      pieUF,
      bonoPiePct,
      bonoPieUF,        // INFORMATIVO (sección 6 — NO entra al cuadre)
      creditoUF,
      caePct,
      plazoAnios,
      dividendoUF,
      // === Conversiones CLP ===
      ufHoy,
      precioFinalCLP,
      precioDeptoConDescuentoCLP,
      pieCLP,
      creditoCLP,
      dividendoCLP,
      bonoPieCLP,
      // === Aliases backward-compat (sección 6) ===
      pieBruto: pieUF,                  // mismo valor — no hay bruto/neto
      pieNeto: pieUF,
      pieNetoCLP: pieCLP,
      precioEscrituraUF: precioFinalUF, // no existe "precio escritura" distinto
      bonoCubrePie: false,              // siempre false en este modelo
      bonoSobre: 'total'                // toggle eliminado
    };

    verificarInvariantes(result, input);
    return Object.freeze(result);
  }

  /**
   * Conveniencia para UI: acepta porcentajes en escala 0-100 y delega
   * a `calcularInversion` (escala 0-1).
   *
   * Útil cuando los `<input type="number">` están en escala humana.
   */
  function calcularInversionFromPercent(input) {
    return calcularInversion({
      precioListaUF:     input.precioListaUF,
      descuentoPct:      (input.descuentoPorc || 0) / 100,
      estacionamientoUF: input.estacionamientoUF || 0,
      bodegaUF:          input.bodegaUF || 0,
      piePct:            (input.piePorc || 0) / 100,
      bonoPiePct:        (input.bonoPiePorc || 0) / 100,
      caePct:            (input.caePorc || 0) / 100,
      plazoAnios:        input.plazoAnios,
      ufHoy:             input.ufHoy || 0
    });
  }

  // ============================================================
  // CRONOGRAMA DEL PIE (sección 8 — opcional)
  // ============================================================

  /**
   * Distribuye el pie en upfront + cuotas iguales + cuotón.
   * Mantiene el cuadre:
   *   reservaUF + upfrontUF + cuotonUF + (cuotaIgualUF × n) = pieUF
   *
   * @param {Object} opts
   * @param {number} opts.precioFinalUF
   * @param {number} opts.pieUF
   * @param {number} opts.ufHoy
   * @param {number} [opts.cuotasPie=0]    Total de actos (upfront + cuotas iguales + cuotón)
   * @param {number} [opts.upfrontPct=0]   % del precio final como upfront [0, 1)
   * @param {number} [opts.cuotonPct=0]    % del precio final como cuotón [0, 1)
   * @param {number} [opts.reservaCLP=0]   Reserva en CLP (>= 0)
   */
  function calcularCronogramaPie(opts) {
    const precioFinalUF = Number(opts.precioFinalUF) || 0;
    const pieUF         = Number(opts.pieUF) || 0;
    const ufHoy         = Number(opts.ufHoy) || 0;
    const cuotasPie     = Math.max(0, Number(opts.cuotasPie) || 0);
    const upfrontPct    = Math.max(0, Number(opts.upfrontPct) || 0);
    const cuotonPct     = Math.max(0, Number(opts.cuotonPct) || 0);
    const reservaCLP    = Math.max(0, Number(opts.reservaCLP) || 0);

    if (upfrontPct + cuotonPct >= 1) {
      throw new Error('CRITICAL: upfrontPct + cuotonPct debe ser < 1');
    }

    const upfrontUF = precioFinalUF * upfrontPct;
    const cuotonUF  = precioFinalUF * cuotonPct;
    const reservaUF = ufHoy > 0 ? reservaCLP / ufHoy : 0;

    const restaUpfront = upfrontUF > 0 ? 1 : 0;
    const restaCuoton  = cuotonUF  > 0 ? 1 : 0;
    const nCuotasIguales = Math.max(0, cuotasPie - restaUpfront - restaCuoton);

    const pieRestante = Math.max(0, pieUF - reservaUF - upfrontUF - cuotonUF);
    const cuotaIgualUF = nCuotasIguales > 0 ? pieRestante / nCuotasIguales : 0;

    return {
      reservaUF,
      upfrontUF,
      cuotaIgualUF,
      nCuotasIguales,
      cuotonUF,
      pieRestante,
      // Verificación del cuadre del cronograma
      cuadra: Math.abs(
        (reservaUF + upfrontUF + cuotonUF + cuotaIgualUF * nCuotasIguales) - pieUF
      ) < 0.01
    };
  }

  // ============================================================
  // COSTOS DE CIERRE (sección 9 — línea informativa)
  // ============================================================

  /**
   * Costos de cierre típicos en Chile. Se pagan al firmar escritura.
   * NO se suman al crédito ni al pie — son línea aparte.
   */
  function calcularCostosCierre(precioFinalUF, creditoUF) {
    const tasacionUF       = 3.0;
    const estudioTitulosUF = 2.5;
    const borradorUF       = 1.5;
    const gestoriaUF       = 6.0;
    const notariaUF        = (precioFinalUF || 0) * 0.003;
    const cbrUF            = (precioFinalUF || 0) * 0.002;
    const timbreUF         = (creditoUF || 0)     * 0.008;
    const totalUF =
      tasacionUF + estudioTitulosUF + borradorUF + gestoriaUF +
      notariaUF + cbrUF + timbreUF;
    return {
      tasacionUF, estudioTitulosUF, borradorUF, gestoriaUF,
      notariaUF, cbrUF, timbreUF,
      totalUF
    };
  }

  // ============================================================
  // EXPORT
  // ============================================================

  global.CotizadorMath = {
    // API principal (spec textual, escala 0-1)
    calcularInversion,
    calcularInversionFromPercent,
    // Bloques individuales (sección 4)
    aplicarDescuentoDepto,
    calcularPrecioFinal,
    calcularPie,
    calcularBonoPieInformativo,
    calcularCredito,
    calcularDividendo,
    // Validación
    validarInputs,
    verificarInvariantes,
    // Extras
    calcularCronogramaPie,
    calcularCostosCierre,
    // Redondeo
    roundUf,
    roundClp
  };
})(typeof window !== 'undefined' ? window : globalThis);
