# 04 — Glosario y contexto

> Conocimiento público genérico del mercado inmobiliario chileno. NO es información propietaria del ecosistema origen.

---

## Glosario financiero

### UF — Unidad de Fomento
Unidad de cuenta reajustable según inflación, definida diariamente por el Banco Central de Chile. La mayoría de los precios inmobiliarios se publican en UF, no en pesos.

- Valor referencial al `<<FECHA_REFERENCIA>>`: 1 UF ≈ `<<UF_REFERENCIA_CLP>>` CLP.
- API pública para valor diario: `https://mindicador.cl/api/uf` (no requiere auth).

### CLP — Peso chileno
Moneda de curso legal. Los pagos al contado y dividendos hipotecarios se ejecutan en CLP.

### Pie
Porcentaje del precio total que el comprador paga por adelantado, antes del crédito hipotecario. En Chile el pie estándar va de 10% a 30%, dependiendo del proyecto y la etapa.

### Dividendo
Cuota mensual del crédito hipotecario. Se calcula con la fórmula de amortización francesa:

```
dividendo = saldo_financiado × (i × (1+i)^n) / ((1+i)^n − 1)
```

Donde:
- `saldo_financiado` = precio_total × (1 − pie/100)
- `i` = tasa_anual / 12
- `n` = plazo en meses (típico: 240 = 20 años; 300 = 25 años; 360 = 30 años)

### Cuotón
Pago extraordinario en momentos específicos:
- **Cuotón inicial**: al firmar promesa de compraventa.
- **Cuotón final**: al momento de escriturar.
- Algunos proyectos en blanco/verde permiten dividir el pie en pie + cuotones.

### Escrituración
Acto notarial donde se transfiere la propiedad. Implica gastos:
- Honorarios notariales
- Conservador de Bienes Raíces
- Impuesto al mutuo
- Tasación bancaria
Algunos proyectos ofrecen "escrituración financiada" como condición comercial.

### CAE — Carga Anual Equivalente
Tasa que incluye el costo total del crédito (interés + seguros + comisiones). Es lo que regula la Superintendencia chilena que se publique en cualquier oferta de crédito.

### Tasa anual referencial
Tasas hipotecarias chilenas tipo en `<<FECHA_REFERENCIA>>`: 4,0% — 5,5% UF anual. Para fines de cotización referencial usar `<<TASA_REFERENCIAL>>`.

---

## Tipologías estándar (departamentos)

| Código | Significado | Superficie típica |
|---|---|---|
| `studio` | Estudio (un solo ambiente) | 25–35 m² |
| `1d1b` | 1 dormitorio, 1 baño | 30–45 m² |
| `2d1b` | 2 dormitorios, 1 baño | 45–55 m² |
| `2d2b` | 2 dormitorios, 2 baños | 55–75 m² |
| `3d2b` | 3 dormitorios, 2 baños | 70–95 m² |
| `3d3b` | 3 dormitorios, 3 baños | 90–120 m² |
| `4d3b` | 4 dormitorios, 3 baños | 110–150 m² |

Otras tipologías: `local`, `oficina`, `bodega`, `estacionamiento`.

---

## Etapas de un proyecto inmobiliario

| Etapa | Descripción | Precios |
|---|---|---|
| `en_blanco` | Proyecto en plano, sin obra iniciada o muy temprana | Más barato, mayor riesgo, mayor plusvalía esperada |
| `en_verde` | Obra avanzada pero no terminada | Precio intermedio |
| `entrega_inmediata` | Obra terminada, recepción municipal lista | Precio alto, sin riesgo de obra, escrituración rápida |

**Mapa al filtro `tipo_entrega` (campo computado, NO persistido — ver `01-MODELO-DATOS.md` sección 5):**
- `inmediata` ← etapa `entrega_inmediata` o `fecha_entrega <= hoy`
- `futura` ← etapas `en_blanco` / `en_verde` con `fecha_entrega > hoy`

---

## Regiones de Chile

Lista oficial completa para validación + filtros. Slugs URL-safe sugeridos:

| Código | Región | Slug |
|---|---|---|
| 15 | Arica y Parinacota | `arica-y-parinacota` |
| 1 | Tarapacá | `tarapaca` |
| 2 | Antofagasta | `antofagasta` |
| 3 | Atacama | `atacama` |
| 4 | Coquimbo | `coquimbo` |
| 5 | Valparaíso | `valparaiso` |
| 13 | Metropolitana de Santiago | `metropolitana` |
| 6 | Libertador Bernardo O'Higgins | `ohiggins` |
| 7 | Maule | `maule` |
| 16 | Ñuble | `nuble` |
| 8 | Biobío | `biobio` |
| 9 | La Araucanía | `araucania` |
| 14 | Los Ríos | `los-rios` |
| 10 | Los Lagos | `los-lagos` |
| 11 | Aysén | `aysen` |
| 12 | Magallanes y Antártica Chilena | `magallanes` |

---

## Comunas de la Región Metropolitana (52)

Concentración principal del catálogo. Lista completa para validación.

```
Cerrillos · Cerro Navia · Conchalí · El Bosque · Estación Central ·
Huechuraba · Independencia · La Cisterna · La Florida · La Granja ·
La Pintana · La Reina · Las Condes · Lo Barnechea · Lo Espejo ·
Lo Prado · Macul · Maipú · Ñuñoa · Pedro Aguirre Cerda ·
Peñalolén · Providencia · Pudahuel · Quilicura · Quinta Normal ·
Recoleta · Renca · San Joaquín · San Miguel · San Ramón ·
Santiago · Vitacura · Puente Alto · San Bernardo · Buin ·
Calera de Tango · Colina · Curacaví · El Monte · Isla de Maipo ·
Lampa · María Pinto · Melipilla · Padre Hurtado · Paine · Peñaflor ·
Pirque · San José de Maipo · San Pedro · Talagante · Tiltil · Alhué
```

(Para regiones distintas a RM: lista a completar según expansión geográfica del catálogo.)

---

## Orientación de unidad

Estándar del mercado:
- `N` Norte
- `S` Sur
- `O` Oriente (sale el sol)
- `P` Poniente (se pone el sol)

Combinaciones: `NO`, `NP`, `SO`, `SP`. Algunos proyectos publican variantes (`NE`, `SE`, etc.).

---

## Documentos típicos del proceso de venta

| Documento | Cuándo |
|---|---|
| Reserva | Cliente paga monto inicial (típico 5%–10% del pie) para reservar la unidad |
| Promesa de compraventa | Cliente firma compromiso, paga pie completo |
| Escritura | Acto notarial, cliente toma posesión |
| Recepción de obra | Cliente entra al inmueble |

En el MVP 1 solo se modela hasta "Cotización" (paso previo a Reserva). Reserva → Promesa → Escritura es Fase 3.

---

## Criterios típicos de un inversionista (para diseñar filtros)

- **Rentabilidad**: precio por m² vs precio promedio comuna
- **Ubicación**: cercanía a metro, plusvalía esperada
- **Liquidez**: tipo de unidad demandada para arriendo (estudios y 1D1B son los más líquidos)
- **Plazo**: entrega inmediata para arrendar ya, o en blanco para plusvalía
- **Pie disponible**: filtro implícito por rango de precios
- **Tipo de inversión**: capitalización (vivir ahí) vs renta (arrendar) vs flip (vender al subir)

Estos criterios informan el diseño de filtros pero NO se traducen 1:1 a campos del modelo. El cliente final filtra por atributos concretos (precio, comuna, tipología, etc.).

---

## APIs públicas útiles (autorizadas)

| Servicio | URL | Uso |
|---|---|---|
| Valor UF diario | `https://mindicador.cl/api/uf` | Cotizador, conversión UF→CLP |
| Geocoding | OpenStreetMap Nominatim | Convertir dirección → GPS |
| Códigos postales Chile | API CorreosChile (si vigente) | Validación de direcciones |

**Vetadas explícitamente**: cualquier API mencionada en `03-DOCTRINA-AISLAMIENTO.md`.

---

## Placeholders

| Placeholder | Completar con |
|---|---|
| `<<FECHA_REFERENCIA>>` | Fecha de la última actualización de los valores referenciales |
| `<<UF_REFERENCIA_CLP>>` | Valor UF vigente al momento de redactar |
| `<<TASA_REFERENCIAL>>` | Tasa anual a usar como default en cotizador (sugerencia: 4,5%) |
