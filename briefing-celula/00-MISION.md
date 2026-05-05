# 00 — Misión de la célula

> Documento fundacional. Lectura obligatoria antes de operar en la célula.

---

## Identidad

Esta célula es un experimento aislado, autorizado por `<<CEO_NOMBRE>>` el `<<FECHA_AUTORIZACION>>`, para construir desde cero un catálogo marketplace inmobiliario.

La célula NO es parte del ecosistema productivo `<<NOMBRE_ECOSISTEMA_ORIGEN>>`. No lo toca, no lo consume, no lo influye.

Cuando el experimento madure, se evaluará una integración futura al repositorio oficial. Hasta ese momento, la célula vive completamente independiente.

---

## Misión

Construir un catálogo marketplace inmobiliario que permita:

1. **Explorar proyectos** disponibles de manera pública, libre, sin login.
2. **Filtrar** por criterios reales de inversión inmobiliaria.
3. **Cotizar personalizado** sobre una unidad seleccionada.
4. **Mantener stock actualizado** mediante ingesta de información desde fuentes externas (`<<N_INMOBILIARIAS>>` inmobiliarias asociadas).

---

## Alcance MVP 1

### Display de proyectos disponibles
Vista grilla + filtros activos sobre los siguientes ejes:

- Disponibilidad (proyecto activo / pausado)
- Comuna
- Región
- Rango de precios (UF mínimo / máximo)
- Tipo de entrega (inmediata / futura)
- Año de entrega
- Condiciones comerciales (ver `01-MODELO-DATOS.md` sección 4, tabla relacional `ProyectoCondicion`)
- Tipología (estudio, 1D1B, 2D1B, 2D2B, 3D2B, etc.)

### Cotizador personalizado por unidad
Alcance: `<<COTIZADOR_NIVEL_A_O_B_O_C>>`

- **Nivel A** — calculadora interactiva en pantalla. Inputs: pie %, plazo crédito, tasa. Outputs: UF total, CLP equivalente, dividendo mensual estimado, cuotón inicial/final si aplica.
- **Nivel B** — generación de reporte detallado descargable (PDF/HTML).
- **Nivel C** — Nivel A en pantalla + botón "generar reporte detallado" que produce Nivel B.

### Ingesta de stock
Sistema de actualización periódica del catálogo desde las fuentes externas de cada inmobiliaria. Detalle en `02-INGESTA.md`.

---

## Fuera de alcance MVP 1

- Login de usuario (cliente final navega anónimo).
- Reservas online con pago.
- Pipeline de venta (reserva → promesa → escritura).
- Chat en vivo, notificaciones push.
- Multi-idioma.
- App móvil nativa.
- Firma electrónica.

Estos puntos quedan para Fases 2-5, no se implementan en MVP 1.

---

## Visión a 6 meses

| Mes | Hito |
|---|---|
| 1 | MVP 1 funcional local con datos seed: catálogo + filtros + cotizador A. |
| 2 | Ingesta operativa con `<<N_INMOBILIARIAS>>` inmobiliarias. Stock se refresca automáticamente. |
| 3 | Cotizador `<<NIVEL_FINAL>>` completo. Persistencia de cotizaciones generadas. |
| 4 | Pipeline de leads: cliente solicita unidad → llega contacto al broker. |
| 5 | Auth admin + CRUD interno para gestionar inmobiliarias y proyectos manualmente. |
| 6 | Evaluación de integración al repositorio oficial. Decisión de migración o continuidad aislada. |

---

## Reglas vitales

1. La célula **nunca** consume credenciales, tokens, dominios, infraestructura ni datos del ecosistema origen. Ver `03-DOCTRINA-AISLAMIENTO.md`.
2. Toda decisión arquitectónica queda registrada en `heads/marketplace/docs/DECISIONES.md` (a crear).
3. Toda dependencia externa nueva (paquete npm, API externa, servicio cloud) se justifica explícitamente.
4. Ningún dato comercial real de inmobiliarias entra al repo de la célula sin autorización explícita de `<<CEO_NOMBRE>>`.
5. La célula tiene su propia memoria operativa en `heads/marketplace/HEAD-MARKETPLACE.md` (a crear), redactada desde cero, sin referencias al ecosistema origen.

---

## Placeholders a completar antes del primer commit

| Placeholder | Qué completa |
|---|---|
| `<<CEO_NOMBRE>>` | Nombre de quien autoriza la célula |
| `<<FECHA_AUTORIZACION>>` | Fecha de la decisión |
| `<<NOMBRE_ECOSISTEMA_ORIGEN>>` | Nombre genérico del ecosistema productivo del que la célula es independiente |
| `<<N_INMOBILIARIAS>>` | Cantidad de inmobiliarias asociadas (3 al inicio) |
| `<<COTIZADOR_NIVEL_A_O_B_O_C>>` | Alcance elegido del cotizador |
| `<<NIVEL_FINAL>>` | Idem para hito mes 3 |

---

## Quien firma

- Owner del experimento: `<<OWNER_NOMBRE>>`
- Computador donde vive: `<<COMPUTADOR_B_IDENTIFICADOR>>`
- Repo: `<<NOMBRE_REPO_CELULA>>` (`<<URL_REPO_O_LOCAL>>`)
- Autorización CEO: `<<FECHA_AUTORIZACION>>`
