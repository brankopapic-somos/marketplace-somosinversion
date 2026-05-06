# HEAD — Marketplace

> Memoria operativa de la célula. Redactada desde cero. NO hereda nada del ecosistema origen.

**Última actualización:** 2026-05-06
**Owner:** Head Marketplace (`<<OWNER_NOMBRE>>`)
**Estado:** MVP navegable + admin UI + ingesta scaffolding funcionando

---

## Cómo cargar datos al marketplace

Tres caminos disponibles según el caso de uso:

### 1A. Edición directa de `seeds.js` (manual, vía git)

Para agregar un proyecto editando código:

1. Abrir `heads/marketplace/code/data/seeds.js`
2. Agregar un objeto al array `proyectos: [...]` con la siguiente estructura mínima:

   ```js
   {
     id: "p-007",
     external_id: "DEMO-2027-001",
     inmobiliaria_id: "im-001",                    // de DATA.inmobiliarias
     slug: "edificio-demo",                         // URL-safe, único
     nombre: "Edificio Demo",
     region: "Metropolitana",
     comuna: "Las Condes",
     direccion: "Av. Demo 100",
     etapa: "en_verde",                             // en_blanco | en_verde | entrega_inmediata
     fecha_entrega: "2027-06-30",
     anio_entrega: 2027,
     precio_uf_min: 3500,
     precio_uf_max: 5500,
     pie_porcentaje: 20,
     tipologias_disponibles: ["1d1b", "2d2b"],
     estado_negocio: "activo",                      // activo | agotado | pausado
     estado_ingesta: "ok",                          // ok | timeout | error
     ultima_ingesta_ok: "2026-05-06T10:00:00Z",
     destacado: false,
     imagen_portada: "https://placehold.co/800x500/?text=Demo",
     created_at: "2026-05-06T10:00:00Z",
     updated_at: "2026-05-06T10:00:00Z"
   }
   ```

3. Agregar las unidades del proyecto al array `unidades: [...]`:

   ```js
   {
     id: "u-031",
     external_id: "DEMO-2027-001-U1",
     proyecto_id: "p-007",
     numero: "0501",
     tipo: "departamento",
     tipologia: "1d1b",
     piso: 5,
     superficie_total: 45,
     precio_uf: 3500,
     estado: "disponible"
   }
   ```

4. (Opcional) Agregar relaciones de condiciones comerciales en `proyectoCondiciones: [...]`:

   ```js
   { id: "pc-014", proyecto_id: "p-007", condicion_id: "cc-01", valor: "5%" }
   ```

5. Commit + push:
   ```bash
   git add heads/marketplace/code/data/seeds.js
   git commit -m "feat: agregar proyecto Edificio Demo"
   git push
   ```

6. Refrescar GitHub Pages (se reflejan los cambios en ~30 segundos).

> **Cuándo usar:** seed inicial, casos de prueba, datos curados manualmente.
> **NO usar para:** stock real recibido de inmobiliarias (usar 1B o 1C).

### 1B. Admin UI con formularios (interactivo, vía localStorage)

Abrir `admin.html` (link "Admin" en topbar del catálogo). Tabs disponibles:

| Tab | Función |
|---|---|
| **Dashboard** | Métricas globales: counts por estado, errores, ingestas |
| **Proyectos** | CRUD completo — crear, editar, eliminar proyectos |
| **Unidades** | CRUD de unidades, con validación de transiciones de estado |
| **Condiciones** | Asignar tags comerciales por proyecto (tabla relacional `ProyectoCondicion`) con valor opcional |
| **Ingesta** | Correr adaptadores (mock generator, JSON paste) — ver 1C |
| **Auditoría** | Historial completo de ingestas con métricas de duración y errores |
| **Datos** | Exportar JSON, importar JSON, reset a seeds |

**Persistencia:** todas las modificaciones se guardan en `localStorage` del navegador. El catálogo (`index.html`) las refleja automáticamente. Para distribuirlas a otros usuarios o dispositivos: usar la pestaña Datos → Exportar JSON, y luego importarlo donde sea necesario, o (mejor) editar `seeds.js` con los datos validados y commitearlos.

> **Cuándo usar:** prototipado, testing de UX, demos.
> **NO usar para:** datos productivos (localStorage es local al navegador, no se sincroniza).

### 1C. Ingesta vía adaptadores (escalable, conforme a `02-INGESTA.md`)

El sistema implementa el patrón adaptador + normalizador. Adaptadores disponibles en el MVP:

| Adaptador | Tipo | Uso |
|---|---|---|
| `mock` | Generador sintético | Crea N proyectos con datos aleatorios. Validar el pipeline end-to-end. |
| `json-paste` | Pegado manual | Recibe un JSON con array de proyectos crudos. Útil para testing con datos reales. |

**Adaptadores planeados (Fase 2, requieren backend Next.js):**

- `api-rest` — fetch de endpoint REST con auth
- `google-sheets` — lectura vía Google Sheets API
- `csv-upload` — upload de archivo CSV/Excel parseado en cliente
- `webhook` — endpoint receptor de cambios

**Flujo de ingesta:**

1. Admin → Tab "Ingesta"
2. Seleccionar adaptador
3. Seleccionar inmobiliaria destino
4. Configurar (cantidad para mock, JSON para json-paste)
5. Click "Correr ingesta"
6. El normalizador valida cada proyecto/unidad y hace upsert por `(inmobiliaria_id, external_id)`
7. Resultado se loguea en Auditoría con métricas: recibidos / creados / actualizados / inválidos / duración
8. Errores de validación se exhiben sin abortar el resto del batch

**Schema de proyecto crudo para `json-paste`:**

```json
[
  {
    "external_id": "AURO-2027-DEMO-01",
    "nombre": "Edificio Demo Norte",
    "comuna": "Las Condes",
    "region": "Metropolitana",
    "direccion": "Av. Demo 200",
    "etapa": "en_verde",
    "fecha_entrega": "2027-09-01",
    "anio_entrega": 2027,
    "precio_uf_min": 4000,
    "precio_uf_max": 6500,
    "pie_porcentaje": 20,
    "tipologias_disponibles": ["1d1b", "2d2b"],
    "descripcion": "...",
    "imagen_portada": "https://...",
    "unidades_crudas": [
      {
        "external_id": "AURO-2027-DEMO-01-U1",
        "numero": "0501",
        "tipologia": "1d1b",
        "piso": 5,
        "superficie_total": 45,
        "precio_uf": 4000,
        "estado": "disponible"
      }
    ]
  }
]
```

> **Cuándo usar:** simular cómo entran datos productivos. Plantilla para construir adaptadores reales en Fase 2.

### Decisión de canal por inmobiliaria

| Inmobiliaria | Adaptador en MVP | Adaptador productivo (Fase 2) |
|---|---|---|
| `<<INMOBILIARIA_1_NOMBRE>>` | `<<INMOBILIARIA_1_FUENTE>>` (placeholder) | A definir según fuente real |
| `<<INMOBILIARIA_2_NOMBRE>>` | `<<INMOBILIARIA_2_FUENTE>>` | idem |
| `<<INMOBILIARIA_3_NOMBRE>>` | `<<INMOBILIARIA_3_FUENTE>>` | idem |

Bloqueado por `<<INMOBILIARIA_X_*>>` sin resolver.

---

## Estado actual

Versión navegable del catálogo marketplace funcionando en HTML+CSS+JS vanilla, sin dependencias externas. Sirve como prototipo de validación de modelo de datos y flujo UX antes de migrar a Next.js.

### Qué funciona

- **Catálogo** (`#/`): grilla de proyectos con filtros activos por comuna, tipo de entrega (computado en runtime), tipología, año de entrega, rango de precio UF y condiciones comerciales.
- **Detalle de proyecto** (`#/proyecto/<slug>`): hero, stats, condiciones, tabla de unidades con badges de estado (`disponible`, `reservada`, `vendida`, `bloqueada`).
- **Cotizador A** (`#/unidad/<id>`): inputs de pie/plazo/tasa, outputs de dividendo mensual con amortización francesa, conversión UF↔CLP en runtime.
- **Distinción visual de estados**:
  - Proyecto `agotado` (estado de negocio) → alerta roja en detalle, badge "Agotado" en card.
  - Proyecto con `estado_ingesta = timeout` (error técnico) → alerta amarilla en detalle, badge "Datos en revisión" en card, oculto del catálogo público por default.
- **Filtro "Solo disponibles"**: aplica regla de visibilidad pública (`estado_negocio = activo AND estado_ingesta = ok`).

### Casos borde demostrados con seed data

| Proyecto | Caso | Validación |
|---|---|---|
| Edificio Mirador Las Condes (p-001) | Activo + entrega inmediata + descuento | Visible, badge destacado |
| Parque Vitacura 2027 (p-002) | En blanco, fecha futura → `tipo_entrega = futura` computado | Filtro "futura" lo incluye |
| Providencia Norte (p-003) | En verde, fecha futura | Idem |
| Ñuñoa Park (p-004) | `estado_negocio = agotado` | Oculto en "solo disponibles", visible si se desmarca, alerta roja |
| San Miguel Verde (p-005) | Arriendo garantizado | Filtro de condición lo aísla |
| Torre La Florida (p-006) | `estado_ingesta = timeout` | Oculto del catálogo público, alerta amarilla en detalle |
| Unidad u-006 | `estado = bloqueada` | Badge rojo, botón cotizar deshabilitado |

---

## Arquitectura del MVP estático

```
heads/marketplace/code/
├── index.html              ← App SPA con hash routing
└── data/
    └── seeds.js            ← DATA en memoria, conforme docs/01-MODELO-DATOS.md
```

### Capas conceptuales (todas en index.html)

- `Repo` → simula queries (inmobiliariaById, proyectoBySlug, condicionesByProyecto, etc.)
- `tipoEntrega(p)` → función computada, NO persistida (regla docs/01-MODELO-DATOS.md sección 5)
- `isPublicVisible(p)` → regla docs/01-MODELO-DATOS.md sección 6.3
- `calcularDividendo(...)` → fórmula amortización francesa, docs/04-GLOSARIO-Y-CONTEXTO.md
- Router por hash (sin librerías), 3 rutas: `/`, `/proyecto/<slug>`, `/unidad/<id>`

### Lo que NO hace (deferred)

- Sin backend, sin DB real, sin API.
- Sin ingesta real (los seeds simulan el resultado de una ingesta).
- Sin auth ni admin UI.
- Sin Cotizador B/C (solo Nivel A interactivo).
- Sin persistencia de cotizaciones.
- Sin generación de PDF.

---

## Cómo ejecutarlo

Abrir directamente `heads/marketplace/code/index.html` en el navegador (Chrome, Firefox, Edge). Usa protocolo `file://`. No requiere servidor ni instalación.

> **Nota:** los seeds están embebidos vía `<script src="data/seeds.js">` que asigna a `window.DATA`. Compatible con `file://` (no usa `fetch`).

---

## Próximos pasos sugeridos

1. **Validación con CEO**: revisar diseño, navegación, copys, casos borde.
2. **Iteración UX**: ajustar layout / tipografía según feedback.
3. **Migración a Next.js** (cuando el CEO resuelva `<<RUTA_BASE_PC_B>>` y `<<NOMBRE_REPO_CELULA>>`):
   - Mantener el modelo de datos tal cual está documentado en `docs/01-MODELO-DATOS.md`.
   - Convertir `seeds.js` → `lib/seed.ts` con tipos TS.
   - Convertir HTML inline → componentes React + Tailwind.
   - Implementar API routes `GET /api/projects`, `GET /api/projects/[slug]`, `GET /api/units/[id]`, `GET /api/uf` (proxy a mindicador.cl).
4. **Implementar adaptadores de ingesta** (3 inmobiliarias placeholder, datos reales pendientes de CEO).
5. **Endpoint de admin para sync manual y CRUD.**

---

## Decisiones técnicas tomadas (registrar también en `docs/DECISIONES.md` cuando se cree)

| ID | Decisión | Motivo |
|---|---|---|
| D-001 | MVP en HTML/JS vanilla en lugar de Next.js | Sandbox sin Node/Python. Prioridad CEO: navegable rápido antes de optimizar. |
| D-002 | `tipo_entrega` 100% computado en cliente | Evita desincronización; alineado con docs/01-MODELO-DATOS.md sección 5. |
| D-003 | `estado_negocio` y `estado_ingesta` como enums separados | Decisión CEO sesión 2026-04-30; permite distinguir "agotado" (negocio) vs "timeout" (técnico). |
| D-004 | `CondicionComercial` modelado como tablas relacionales (`CondicionComercial` + `ProyectoCondicion`) | Decisión CEO sesión 2026-04-30; extensibilidad y soporte de campo `valor`. |
| D-005 | Transición `bloqueada` simplificada para MVP: `disponible ↔ bloqueada` y `bloqueada → vendida` no permitida sin pasar por `disponible` | Especificación CEO sesión 2026-05-05. |
| D-006 | UF referencial hardcoded en seeds.js como fallback | Sin red en MVP estático; al migrar a Next se proxea `mindicador.cl/api/uf`. |
| D-007 | Persistencia de cambios admin en `localStorage` (no en `seeds.js`) | Permite probar el flujo sin tocar código fuente. Datos validados pasan a seeds.js vía import/export manual. |
| D-008 | Patrón adaptador implementado en JS vanilla, no diferido a Next | Validar arquitectura conforme `docs/02-INGESTA.md` ya en MVP. Migración a TS conserva la interfaz `fetch_raw_stock` + `health_check`. |
| D-009 | Audit log de ingestas en `localStorage` (key `marketplace.audit.v1`) | Tabla en código real; localStorage es suficiente para validación. Límite: últimas 100 entradas. |
| D-010 | `<<NOMBRE_REPO_CELULA>>` resuelto a `marketplace-somosinversion` por decisión CEO 2026-05-06 | Repo público en `https://github.com/brankopapic-somos/marketplace-somosinversion` |

---

## Bloqueos vigentes

| ID | Bloqueo | Acción requerida del CEO |
|---|---|---|
| B-001 | `<<RUTA_BASE_PC_B>>` y `<<NOMBRE_REPO_CELULA>>` sin definir | Resolver antes de migrar a Next.js |
| B-002 | Datos de las 3 inmobiliarias (URL, auth, frecuencia) | Resolver para implementar adaptadores reales |
| B-003 | `<<DOMINIO_PRINCIPAL_ORIGEN>>`, `<<WORKER_URL_ORIGEN>>`, `<<PLATAFORMA_VETADA_1>>` sin definir | Resolver para configurar lista negra |
| B-004 | `<<CUENTA_GITHUB_CELULA>>` sin definir | Resolver para configurar remote y push |

---

## Riesgos abiertos

| Riesgo | Mitigación |
|---|---|
| MVP estático puede crear hábito; equipo posterga migración a Next.js | Documentado como D-001 con motivo y plan de migración explícito |
| Datos seed no representan complejidades reales (tipologías exóticas, comunas fuera de RM) | OK para validar UX; el normalizador real cubrirá esos casos |
| Imágenes vía placehold.co dependen de servicio externo | Solo MVP. En producción: CDN propio bajo `<<CUENTA_PROPIA_CELULA>>` |

---

## Lista negra de dominios (`<<LISTA_NEGRA_DOMINIOS>>`)

> A completar cuando el CEO resuelva los placeholders. Hasta entonces, el sistema NO realiza requests salientes — el MVP estático es offline-first.

Contendrá:
- `<<DOMINIO_PRINCIPAL_ORIGEN>>` y subdominios
- `<<WORKER_URL_ORIGEN>>` y `*.workers.dev` del origen
- `<<PLATAFORMA_VETADA_1>>` y dominios asociados
