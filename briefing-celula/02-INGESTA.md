# 02 — Ingesta de stock

> Especificación del sistema de actualización del catálogo desde fuentes externas.

---

## Principio

Cada inmobiliaria entrega su stock en un formato distinto. La célula NO se acopla a ningún formato específico; usa un patrón **adaptador + normalizador**:

```
[Fuente externa A] ──▶ [Adaptador A] ──┐
[Fuente externa B] ──▶ [Adaptador B] ──┼──▶ [Normalizador] ──▶ [Catálogo célula]
[Fuente externa C] ──▶ [Adaptador C] ──┘
```

- **Adaptador**: traduce el formato propio de la inmobiliaria a un objeto bruto JSON con estructura común.
- **Normalizador**: valida, limpia, mapea al modelo interno (ver `01-MODELO-DATOS.md`) y persiste.

Agregar una nueva inmobiliaria = escribir un adaptador nuevo. Nada más.

---

## Formatos de fuente posibles

| Tipo | Cuándo | Esfuerzo adaptador | Riesgo |
|---|---|---|---|
| **API REST** | La inmobiliaria expone endpoints | Bajo | Cambios de contrato sin aviso |
| **CSV/Excel en cloud** | Drive / Dropbox compartido, refresco manual | Bajo | Cambios de columnas sin aviso |
| **Google Sheets** | Hoja viva mantenida por equipo comercial | Bajo-Medio | Permisos, formato libre |
| **Scraping HTML** | Solo portal web público | Alto | Cambios de DOM, anti-bot, riesgo legal |
| **FTP / SFTP** | Subida programada del partner | Medio | Conectividad, autenticación |
| **Email parseado** | Mensajes con planilla adjunta | Alto | Parsing frágil, latencia |
| **Manual (admin UI)** | Sin sistema, carga humana | Cero adaptador | No escala |

**Reglas:**
- Preferir el formato de menor esfuerzo y menor riesgo posible.
- NUNCA scraping de sitios sin autorización formal escrita del owner.
- NUNCA reusar credenciales de plataformas externas a las que la célula no tenga acceso autorizado propio.

---

## Contrato del Adaptador

Cada adaptador implementa una interfaz común conceptual:

```
Adaptador<inmobiliaria_X>:
  fetch_raw_stock() → ProyectoCrudo[]
  fetch_raw_units(proyecto_externo_id) → UnidadCruda[]
  health_check() → boolean
```

Donde `ProyectoCrudo` y `UnidadCruda` son objetos con la estructura nativa de la fuente — sin tocar.

---

## Contrato del Normalizador

Recibe lo crudo del adaptador y devuelve entidades del modelo interno:

```
Normalizador:
  normalizar_proyecto(crudo, inmobiliaria_id) → Proyecto | InvalidProjectError
  normalizar_unidad(crudo, proyecto_id) → Unidad | InvalidUnitError
  validar(entidad) → ValidationResult
  persistir(entidad) → void
```

**Validaciones mínimas obligatorias:**
1. Slug único — generar a partir de nombre + comuna si no viene.
2. Precio UF dentro de rango razonable (>0 y <100.000).
3. Comuna existe en lista oficial Chile (ver `04-GLOSARIO-Y-CONTEXTO.md`).
4. Tipología en lista cerrada.
5. Estado de unidad en enum válido.
6. Condiciones comerciales: solo tags que existan en la tabla `CondicionComercial` (ver `01-MODELO-DATOS.md` sección 4). Se crean como registros en `ProyectoCondicion`.
7. Coordenadas GPS dentro del territorio chileno si vienen.

Si una entidad falla validación, **no se persiste** y se loguea con detalle.

---

## Estrategia de sync

| Modo | Cuándo | Comando |
|---|---|---|
| **Manual** | Inicial / debugging | `<<COMANDO_SYNC_MANUAL>>` |
| **Programado** | Producción estable | Cron `<<CRON_SYNC>>` (sugerencia: cada 6h) |
| **On-demand** | Trigger desde admin UI | Endpoint protegido `POST /admin/sync/:inmobiliaria_id` |
| **Webhook entrante** | Si la fuente lo soporta | Endpoint `POST /webhooks/stock-changed/:inmobiliaria_id` |

---

## Reglas de actualización

1. **Upsert por `(inmobiliaria_id, external_id)`** para Proyecto y `(proyecto_id, external_id)` para Unidad. `external_id` es el ID que usa la fuente de ingesta (inmobiliaria). Ver `01-MODELO-DATOS.md` sección 2 y 3.
2. **Nunca borrar registros históricos** — se marcan `estado_negocio = 'agotado'` o `estado_negocio = 'pausado'`. Se conserva trazabilidad de precios y stock para análisis.
3. **Snapshot diario** del estado del catálogo en una tabla auxiliar (opcional, Fase 2).
4. **Timeout de actualización**: si una fuente lleva más de `<<DIAS_TIMEOUT_INGESTA>>` días sin update exitoso, los proyectos de esa inmobiliaria se marcan `estado_ingesta = 'timeout'` automáticamente. Esto NO cambia `estado_negocio` — el dato comercial se preserva separado del estado técnico. Ver `01-MODELO-DATOS.md` sección 6.
5. **Conciliación**: cada sync compara stock recibido vs stock local. Diferencias se loguean en una tabla de auditoría.
6. **`ultima_ingesta_ok`**: cada sync exitoso actualiza este timestamp en los proyectos afectados y resetea `estado_ingesta = 'ok'`.

---

## Esquema de tabla de auditoría sugerido

| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | UUID |
| inmobiliaria_id | FK | |
| ejecutado_at | timestamp | |
| modo | enum | `manual` / `cron` / `on-demand` / `webhook` |
| proyectos_recibidos | int | Total en el payload |
| proyectos_creados | int | |
| proyectos_actualizados | int | |
| proyectos_invalidados | int | Validación falló |
| unidades_recibidas | int | |
| unidades_creadas | int | |
| unidades_actualizadas | int | |
| duracion_ms | int | |
| errores | json | Array de errores con detalle |
| status | enum | `success` / `partial` / `failed` |

---

## Adaptadores específicos

### Adaptador `<<INMOBILIARIA_1_NOMBRE>>`
- **Tipo de fuente:** `<<INMOBILIARIA_1_FUENTE>>`
- **Endpoint / ubicación:** `<<INMOBILIARIA_1_URL_O_PATH>>`
- **Autenticación:** `<<INMOBILIARIA_1_AUTH>>`
- **Frecuencia esperada:** `<<INMOBILIARIA_1_FRECUENCIA>>`
- **Notas:** `<<INMOBILIARIA_1_NOTAS>>`

### Adaptador `<<INMOBILIARIA_2_NOMBRE>>`
- **Tipo de fuente:** `<<INMOBILIARIA_2_FUENTE>>`
- **Endpoint / ubicación:** `<<INMOBILIARIA_2_URL_O_PATH>>`
- **Autenticación:** `<<INMOBILIARIA_2_AUTH>>`
- **Frecuencia esperada:** `<<INMOBILIARIA_2_FRECUENCIA>>`
- **Notas:** `<<INMOBILIARIA_2_NOTAS>>`

### Adaptador `<<INMOBILIARIA_3_NOMBRE>>`
- **Tipo de fuente:** `<<INMOBILIARIA_3_FUENTE>>`
- **Endpoint / ubicación:** `<<INMOBILIARIA_3_URL_O_PATH>>`
- **Autenticación:** `<<INMOBILIARIA_3_AUTH>>`
- **Frecuencia esperada:** `<<INMOBILIARIA_3_FRECUENCIA>>`
- **Notas:** `<<INMOBILIARIA_3_NOTAS>>`

---

## Lo que NO va en la ingesta

- Conexión a APIs de plataformas vetadas (ver `03-DOCTRINA-AISLAMIENTO.md`).
- Reuso de tokens / credenciales del ecosistema origen.
- Endpoints de imagen externos sin autorización vigente.
- Datos comerciales privados (comisiones, márgenes) en payloads expuestos.
