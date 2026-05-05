# 01 — Modelo de datos

> Especificación conceptual. No es código. Las implementaciones (TypeScript, SQL, etc.) se derivan de aquí.

---

## Entidades del dominio

```
Inmobiliaria (1) ────< (N) Proyecto (1) ────< (N) Unidad (1) ──< (N) Cotizacion (Fase 2)
                                │
                                └──< (N) ProyectoCondicion (N) >──── (1) CondicionComercial

Campos computados (NO persistidos):
  Proyecto.tipo_entrega  ← derivado de etapa + fecha_entrega
```

---

## 1. Inmobiliaria

Representa una empresa desarrolladora con la que se tiene acuerdo comercial.

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string (UUID o slug) | sí | Identificador único interno |
| slug | string | sí | URL-safe, único, ej. `<<INMOBILIARIA_SLUG>>` |
| nombre_publico | string | sí | Nombre que se muestra al cliente final |
| logo_url | string | no | URL pública de logo (CDN propio o local) |
| descripcion | string | no | Texto corto |
| sitio_web | string | no | URL pública oficial |
| activa | boolean | sí | Si está vigente como partner |
| created_at | timestamp | sí | |
| updated_at | timestamp | sí | |

**Datos privados (no exponer al frontend público):**

| Atributo | Tipo | Descripción |
|---|---|---|
| comision_porcentaje | decimal | Comisión negociada con la célula |
| condiciones_acuerdo | text | Condiciones especiales del contrato |
| contacto_comercial | text | Persona, teléfono, email del contacto interno |
| fuente_stock_tipo | enum | Cómo entrega stock: `api` / `csv` / `sheets` / `scraping` / `manual` (ver `02-INGESTA.md`) |
| fuente_stock_config | json | Configuración del adaptador de ingesta |

**Placeholders:**
- `<<INMOBILIARIA_1_NOMBRE>>`, `<<INMOBILIARIA_1_FUENTE>>`
- `<<INMOBILIARIA_2_NOMBRE>>`, `<<INMOBILIARIA_2_FUENTE>>`
- `<<INMOBILIARIA_3_NOMBRE>>`, `<<INMOBILIARIA_3_FUENTE>>`

---

## 2. Proyecto

Representa un edificio o desarrollo inmobiliario con N unidades.

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string | sí | UUID interno de la célula |
| external_id | string | sí | ID del proyecto en la fuente de ingesta. Unique constraint compuesto: `(inmobiliaria_id, external_id)`. NO es un ID de plataforma vetada — es el identificador que usa la inmobiliaria asociada en su propio sistema. |
| inmobiliaria_id | FK Inmobiliaria | sí | |
| slug | string | sí | URL-safe, único globalmente |
| nombre | string | sí | Nombre comercial del proyecto |
| region | string | sí | Región Chile (ver `04-GLOSARIO-Y-CONTEXTO.md`) |
| comuna | string | sí | Comuna |
| direccion | string | sí | Calle + número |
| gps_lat | decimal | no | Latitud |
| gps_lon | decimal | no | Longitud |
| etapa | enum | sí | `en_blanco` / `en_verde` / `entrega_inmediata` |
| fecha_entrega | date | no | Si es futura, fecha estimada |
| anio_entrega | int | sí | Año de entrega para filtros |
| precio_uf_min | decimal | sí | Precio mínimo del proyecto en UF |
| precio_uf_max | decimal | sí | Precio máximo del proyecto en UF |
| pie_porcentaje | decimal | no | Pie estándar exigido (ej. 20) |
| reserva_clp | int | no | Monto de reserva en CLP |
| total_unidades | int | no | |
| total_pisos | int | no | |
| descripcion | text | no | Texto largo público |
| imagen_portada | string | no | URL pública (CDN propio, NO de fuentes externas vetadas) |
| galeria | string[] | no | Array de URLs |
| tipologias_disponibles | string[] | sí | Array de tipologías presentes en el proyecto |
| estado_negocio | enum | sí | `activo` / `agotado` / `pausado`. Ver sección "Estados de Proyecto" más abajo |
| estado_ingesta | enum | sí | `ok` / `timeout` / `error`. Ver sección "Estados de Proyecto" más abajo |
| destacado | boolean | sí | Para featured |
| created_at | timestamp | sí | |
| updated_at | timestamp | sí | |
| ultima_ingesta_ok | timestamp | no | Última vez que la ingesta actualizó este proyecto exitosamente |

---

## 3. Unidad

Representa una unidad individual dentro de un proyecto.

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string | sí | UUID interno de la célula |
| external_id | string | sí | ID de la unidad en la fuente de ingesta. Unique constraint compuesto: `(proyecto_id, external_id)`. |
| proyecto_id | FK Proyecto | sí | |
| numero | string | sí | Identificador interno de la unidad (ej. `1205`) |
| tipo | enum | sí | `departamento` / `local` / `oficina` / `bodega` / `estacionamiento` |
| tipologia | string | sí | `studio` / `1d1b` / `2d1b` / `2d2b` / `3d2b` / `3d3b` / `4d3b` |
| modelo | string | no | Nombre interno del modelo arquitectónico |
| orientacion | string | no | Norte/Sur/Oriente/Poniente |
| piso | int | no | |
| superficie_total | decimal | no | m² |
| superficie_interior | decimal | no | m² |
| superficie_terraza | decimal | no | m² |
| precio_uf | decimal | sí | Precio actual en UF |
| descuento_porcentaje | decimal | no | Descuento al cliente sobre precio lista |
| bono_pie_porcentaje | decimal | no | Bono al pie del cliente |
| estacionamiento_incluido | int | no | Cantidad incluida (0/1/2) |
| bodega_incluida | int | no | |
| estado | enum | sí | `disponible` / `reservada` / `vendida` / `bloqueada` |
| created_at | timestamp | sí | |
| updated_at | timestamp | sí | |

---

## 4. CondicionComercial — tabla relacional

Relación many-to-many entre Proyecto y condiciones comerciales, modelada como tabla relacional para extensibilidad.

### 4.1 Tabla `CondicionComercial` (catálogo)

Define las condiciones válidas del sistema (lista cerrada).

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string | sí | UUID |
| tag | string | sí | Slug único, ej. `descuento_directo`. Unique constraint. |
| nombre_publico | string | sí | Label para el frontend, ej. "Descuento directo" |
| descripcion | string | no | Texto explicativo corto |
| publica | boolean | sí | Si puede mostrarse al frontend público. Default: `true` |
| orden | int | no | Orden de display en filtros |

### 4.2 Tabla `ProyectoCondicion` (relación N:M)

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string | sí | UUID |
| proyecto_id | FK Proyecto | sí | |
| condicion_id | FK CondicionComercial | sí | |
| valor | string | no | Valor opcional (ej. "10%" para descuento_directo, "12 cuotas" para pie_diferido) |
| created_at | timestamp | sí | |

Unique constraint: `(proyecto_id, condicion_id)` — una condición no se repite por proyecto.

### 4.3 Condiciones seed (lista cerrada inicial)

| Tag | Nombre público | Pública |
|---|---|---|
| `descuento_directo` | Descuento directo al cliente | ✅ |
| `bono_pie` | Bono al pie | ✅ |
| `pie_diferido` | Pie diferido en cuotas | ✅ |
| `cuoton_inicial` | Cuotón inicial | ✅ |
| `cuoton_final` | Cuotón final | ✅ |
| `escrituracion_financiada` | Escrituración financiada | ✅ |
| `entrega_inmediata` | Entrega inmediata | ✅ |
| `arriendo_garantizado` | Arriendo garantizado | ✅ |

### 4.4 NO exponer NUNCA al frontend público

Las siguientes condiciones, si se modelan, llevan `publica = false`:

- Comisión a broker
- Bonos a broker
- Premios a broker
- Acuerdos comerciales privados con la célula
- Condiciones especiales de canal

Estos atributos también pueden vivir en la entidad `Inmobiliaria` (campos privados) o en una tabla auxiliar `AcuerdoComercial` que NO se expone via API pública.

---

## 5. tipo_entrega — campo computado (NO persistido)

`tipo_entrega` NO es un campo almacenado en la tabla Proyecto. Se calcula dinámicamente en la capa de aplicación o como computed column en la query.

### Regla de derivación

```
función tipo_entrega(proyecto):
  si proyecto.etapa == 'entrega_inmediata':
    retornar 'inmediata'
  si proyecto.fecha_entrega != null Y proyecto.fecha_entrega <= hoy:
    retornar 'inmediata'
  retornar 'futura'
```

### Dónde se computa

| Contexto | Implementación |
|---|---|
| API responses | Getter / computed property en el tipo TS |
| Filtros de catálogo | Cláusula WHERE derivada en la query |
| Ingesta / normalización | NO se persiste, se ignora si viene de la fuente |

### Justificación

Persistir `tipo_entrega` crea riesgo de desincronización: un proyecto en verde con `fecha_entrega = 2026-03-01` debería cambiar automáticamente a `inmediata` cuando pasa la fecha, sin requerir una ingesta. Computarlo en runtime elimina ese riesgo.

---

## 6. Estados de Proyecto — separación negocio vs ingesta

### 6.1 `estado_negocio` (condición comercial real)

| Valor | Significado | Cuándo |
|---|---|---|
| `activo` | Proyecto con unidades disponibles para venta | Estado default al ingestar un proyecto nuevo |
| `agotado` | Todas las unidades vendidas/reservadas | Automático cuando 0 unidades en estado `disponible` |
| `pausado` | Suspendido temporalmente por la inmobiliaria o la célula | Manual vía admin o flag de ingesta |

### 6.2 `estado_ingesta` (salud técnica de la fuente)

| Valor | Significado | Cuándo |
|---|---|---|
| `ok` | Última ingesta exitosa dentro del plazo | Default. Se resetea en cada sync exitoso |
| `timeout` | Sin update exitoso en `<<DIAS_TIMEOUT_INGESTA>>` días | Automático vía cron o check post-sync |
| `error` | Última ingesta falló (error de adaptador, validación, conectividad) | Se setea cuando el adaptador falla |

### 6.3 Visibilidad en catálogo público

Un proyecto se muestra en el catálogo público **solo si**:

```
estado_negocio == 'activo' AND estado_ingesta == 'ok'
```

Un proyecto `agotado` NO se muestra (no hay stock). Un proyecto con `estado_ingesta = timeout` NO se muestra (datos potencialmente stale), pero NO se pierde — sigue en la base para cuando la fuente se recupere.

### 6.4 Migración conceptual

El campo `disponible: boolean` del modelo original se reemplaza por la combinación:
- `disponible = true` → `estado_negocio = 'activo' AND estado_ingesta = 'ok'`
- `disponible = false (agotado)` → `estado_negocio = 'agotado'`
- `disponible = false (timeout)` → `estado_ingesta = 'timeout'`

---

## 7. Estados de Unidad — transiciones explícitas

### 7.1 Diagrama de estados

```
                    ┌──────────────┐
          ┌────────►│  bloqueada   │◄────────┐
          │         └──────┬───────┘         │
          │                │                 │
          │           desbloquear            │
          │                │                 │
          │                ▼                 │
     bloquear       ┌──────────────┐    bloquear
          │         │  disponible  │         │
          │         └──────┬───────┘         │
          │                │                 │
          │            reservar              │
          │                │                 │
          │                ▼                 │
          │         ┌──────────────┐         │
          └─────────│  reservada   │─────────┘
                    └──────┬───────┘
                           │
                       vender
                           │
                           ▼
                    ┌──────────────┐
                    │   vendida    │  (estado terminal)
                    └──────────────┘
```

### 7.2 Reglas de transición

| Desde | Hacia | Acción | Quién puede |
|---|---|---|---|
| `disponible` | `reservada` | Cliente reserva la unidad | Ingesta / admin |
| `reservada` | `vendida` | Se concreta la venta (escrituración) | Ingesta / admin |
| `disponible` | `bloqueada` | Inmobiliaria retira temporalmente del mercado | Ingesta / admin |
| `reservada` | `bloqueada` | Reserva cancelada + bloqueo preventivo | Admin únicamente |
| `bloqueada` | `disponible` | Se libera la unidad al mercado | Ingesta / admin |
| `reservada` | `disponible` | Reserva caducada o cancelada | Ingesta / admin |

### 7.3 Transiciones prohibidas

| Desde | Hacia | Por qué |
|---|---|---|
| `vendida` | cualquier otro | Estado terminal. Una venta no se revierte en el catálogo. |
| `disponible` | `vendida` | No se salta la reserva. Flujo: disponible → reservada → vendida. |
| `bloqueada` | `reservada` | Debe pasar por `disponible` primero. |
| `bloqueada` | `vendida` | Debe pasar por `disponible` → `reservada` primero. |

### 7.4 Definición de `bloqueada`

Una unidad `bloqueada` es una unidad **temporalmente retirada del mercado** por decisión de la inmobiliaria o de la célula. Razones típicas:
- Unidad reservada para evento comercial
- Error de datos pendiente de corrección
- Revisión legal o técnica
- La inmobiliaria la retiró sin venderla

`bloqueada` NO es un estado terminal. Siempre puede volver a `disponible`.

---

## 8. Cotizacion (Fase 2)

Solo si el alcance del cotizador es Nivel B o C. Si Nivel A, esta entidad no existe.

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string | sí | UUID |
| referencia | string | sí | Código humano-legible, ej. `Q-000123` |
| unidad_id | FK Unidad | sí | |
| cliente_email | string | no | Si el cotizador requiere identificar |
| cliente_nombre | string | no | |
| pie_porcentaje | decimal | sí | Input del cliente |
| plazo_meses | int | sí | Input del cliente |
| tasa_anual | decimal | sí | |
| uf_referencia | decimal | sí | UF al momento de cotizar |
| precio_uf | decimal | sí | Snapshot del precio al momento |
| dividendo_estimado_clp | int | sí | Output calculado |
| total_clp | int | sí | Output calculado |
| pdf_url | string | no | Si se generó documento |
| valida_hasta | date | no | Vigencia de la cotización |
| created_at | timestamp | sí | |

---

## 6. Cliente (Fase 2, opcional)

Solo si se decide capturar leads en el cotizador.

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| id | string | sí | UUID |
| email | string | sí | |
| nombre | string | no | |
| telefono | string | no | |
| origen | string | no | Trazabilidad de la fuente del lead |
| created_at | timestamp | sí | |

---

## Reglas de integridad

1. Toda Unidad debe pertenecer a un Proyecto con `estado_negocio != 'agotado'` al momento de creación.
2. Todo Proyecto debe pertenecer a una Inmobiliaria activa.
3. `tipo_entrega` se computa en runtime: `inmediata` si `etapa = entrega_inmediata` o `fecha_entrega <= hoy`; `futura` en caso contrario. Ver sección 5.
4. `precio_uf_min` ≤ `precio_uf_max` siempre.
5. Slug de Proyecto es único globalmente, no por inmobiliaria.
6. `(inmobiliaria_id, external_id)` es unique en Proyecto. `(proyecto_id, external_id)` es unique en Unidad.
7. Transiciones de estado de Unidad siguen las reglas de la sección 7.2. Transiciones prohibidas (sección 7.3) se validan en la capa de aplicación.
8. `estado_negocio` se actualiza a `agotado` automáticamente cuando el count de unidades con `estado = 'disponible'` llega a 0.
9. `estado_ingesta` se actualiza a `timeout` automáticamente cuando `NOW() - ultima_ingesta_ok > <<DIAS_TIMEOUT_INGESTA>> días`.
10. `(proyecto_id, condicion_id)` es unique en ProyectoCondicion. Solo se permiten tags de la tabla CondicionComercial.

---

## Placeholders globales del modelo

| Placeholder | Completar con |
|---|---|
| `<<INMOBILIARIA_1_NOMBRE>>`, `<<INMOBILIARIA_2_NOMBRE>>`, `<<INMOBILIARIA_3_NOMBRE>>` | Nombres comerciales de las inmobiliarias asociadas |
| `<<INMOBILIARIA_X_FUENTE>>` | Tipo de fuente de stock (api/csv/sheets/scraping/manual) |
| `<<DIAS_TIMEOUT_INGESTA>>` | Días sin update antes de marcar proyecto inactivo (sugerencia: 14) |

---

## Lo que NO va en este modelo

- IDs de plataformas **vetadas** (sin campos tipo `plataforma_vetada_id`, etc.). Nota: `external_id` SÍ existe y es el ID de la fuente de ingesta legítima (inmobiliaria asociada), NO de plataformas vetadas.
- URLs apuntando a CDNs vetados
- Schemas heredados del ecosistema origen
- Nomenclatura interna de otras plataformas
- `tipo_entrega` como campo persistido (es computado, ver sección 5)
- `disponible: boolean` como campo único (reemplazado por `estado_negocio` + `estado_ingesta`, ver sección 6)
- `tags_comerciales: string[]` inline (reemplazado por tabla relacional `ProyectoCondicion`, ver sección 4)
