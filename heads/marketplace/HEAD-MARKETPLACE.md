# HEAD — Marketplace

> Memoria operativa de la célula. Redactada desde cero. NO hereda nada del ecosistema origen.

**Última actualización:** 2026-05-05
**Owner:** Head Marketplace (`<<OWNER_NOMBRE>>`)
**Estado:** MVP estático navegable funcionando

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
