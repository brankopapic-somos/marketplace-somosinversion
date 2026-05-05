# 05 — Estructura de carpetas (espejo del repo origen)

> Cómo armar la base estructural del computador B para que la integración futura al repo oficial sea limpia.

---

## Principio

La célula vive en un repo independiente, pero la **estructura interna replica exactamente** la del ecosistema origen en lo relativo al Marketplace. Cuando se integre, basta merge directo de carpetas — sin renombrar, sin reorganizar, sin reescribir paths.

**Estructura ≠ contenido.** Replicar nombres de carpetas vacías + archivos de configuración nuevos NO viola la doctrina de aislamiento. Lo prohibido es copiar código, credenciales, datos o configs del origen (ver `03-DOCTRINA-AISLAMIENTO.md`).

---

## Estructura objetivo del computador B

```
<<NOMBRE_REPO_CELULA>>/
│
├── docs/                                    ← biblia maestra propia de la célula (7 archivos fundacionales)
│   ├── README.md                            (índice del briefing, lista maestra de placeholders)
│   ├── 00-MISION.md                         (briefing fundacional)
│   ├── 01-MODELO-DATOS.md
│   ├── 02-INGESTA.md
│   ├── 03-DOCTRINA-AISLAMIENTO.md
│   ├── 04-GLOSARIO-Y-CONTEXTO.md
│   └── 05-ESTRUCTURA-CARPETAS.md            (este archivo)
│
├── heads/
│   └── marketplace/
│       ├── HEAD-MARKETPLACE.md              ← memoria operativa propia, redactada desde cero
│       ├── code/
│       │   ├── app/                         ← Next.js App Router (o stack equivalente)
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── proyecto/
│       │   │       └── [slug]/
│       │   │           └── page.tsx
│       │   ├── api/                         ← API routes
│       │   │   ├── projects/
│       │   │   │   ├── route.ts
│       │   │   │   └── [id]/
│       │   │   │       └── route.ts
│       │   │   ├── units/
│       │   │   │   └── route.ts
│       │   │   ├── uf/
│       │   │   │   └── route.ts
│       │   │   └── admin/                   ← endpoints internos protegidos
│       │   │       ├── sync/
│       │   │       └── crud/
│       │   ├── components/                  ← React components UI
│       │   ├── lib/                         ← types, utils, db client, validators
│       │   │   ├── types.ts
│       │   │   ├── utils.ts
│       │   │   ├── db.ts
│       │   │   └── seed.ts                  ← datos seed ficticios
│       │   ├── ingesta/                     ← adaptadores y normalizador
│       │   │   ├── normalizador.ts
│       │   │   └── adaptadores/
│       │   │       ├── inmobiliaria-1.ts
│       │   │       ├── inmobiliaria-2.ts
│       │   │       └── inmobiliaria-3.ts
│       │   └── data/                        ← seeds, fixtures, sin datos reales
│       │       └── seeds.json
│       └── docs/                            ← docs internos del Head Marketplace
│           ├── ARQUITECTURA.md              (a crear durante desarrollo)
│           ├── ENDPOINTS.md
│           └── DECISIONES.md
│
├── shared/                                  ← reservado, vacío durante célula
│   └── .gitkeep                             (solo para preservar la carpeta en git)
│
├── package.json                             ← deps propias de la célula
├── tsconfig.json                            ← config propia
├── next.config.ts                           ← config propia
├── tailwind.config.ts                       ← si se usa Tailwind
├── postcss.config.mjs                       ← idem
├── .gitignore
├── .env.example                             ← variables de entorno necesarias (sin valores reales)
└── README.md                                ← cómo levantar el proyecto
```

---

## Diferencias con el repo origen (intencionales)

| En origen | En célula | Por qué |
|---|---|---|
| Múltiples Heads (`heads/lora/`, `heads/web/`, etc.) | Solo `heads/marketplace/` | Célula = un solo dominio |
| `ceo/` con `SOMOS-CEO.md` | No existe | No hay gobernanza CEO dentro de la célula |
| `wrangler.toml` (Cloudflare Worker) | No existe (a menos que la célula adopte CF) | Stack propio, infra propia |
| `shared/infra/` con código transversal | `shared/` vacío con `.gitkeep` | Reserva la carpeta para integración futura |
| `docs/ARQUITECTURA-MASTER.md`, `OWNERSHIP-MAP.md`, `DEPENDENCIAS.md`, `COORDINACION-Y-PROTOCOLOS.md` | NO se replican | Son específicos del ecosistema multi-Head, no aplican a célula con un solo Head |

---

## Comandos de creación de la estructura

### Opción A — Windows (PowerShell)

Reemplazá `<<RUTA_BASE_PC_B>>` y `<<NOMBRE_REPO_CELULA>>`:

```powershell
$root = "<<RUTA_BASE_PC_B>>\<<NOMBRE_REPO_CELULA>>"

# Estructura de carpetas
New-Item -ItemType Directory -Force -Path "$root\docs"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\app\proyecto\[slug]"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\api\projects\[id]"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\api\units"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\api\uf"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\api\admin\sync"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\api\admin\crud"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\components"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\lib"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\ingesta\adaptadores"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\code\data"
New-Item -ItemType Directory -Force -Path "$root\heads\marketplace\docs"
New-Item -ItemType Directory -Force -Path "$root\shared"

# Archivos placeholder
New-Item -ItemType File -Force -Path "$root\shared\.gitkeep"
New-Item -ItemType File -Force -Path "$root\.gitignore"
New-Item -ItemType File -Force -Path "$root\.env.example"
New-Item -ItemType File -Force -Path "$root\README.md"
New-Item -ItemType File -Force -Path "$root\heads\marketplace\HEAD-MARKETPLACE.md"

cd $root
git init
git add .
git commit -m "init: estructura célula aislada catálogo marketplace (espejo repo origen)"
```

### Opción B — macOS / Linux / WSL (bash)

Reemplazá `<<RUTA_BASE_PC_B>>` y `<<NOMBRE_REPO_CELULA>>`:

```bash
ROOT="<<RUTA_BASE_PC_B>>/<<NOMBRE_REPO_CELULA>>"

# Estructura de carpetas
mkdir -p "$ROOT/docs"
mkdir -p "$ROOT/heads/marketplace/code/app/proyecto/[slug]"
mkdir -p "$ROOT/heads/marketplace/code/api/projects/[id]"
mkdir -p "$ROOT/heads/marketplace/code/api/units"
mkdir -p "$ROOT/heads/marketplace/code/api/uf"
mkdir -p "$ROOT/heads/marketplace/code/api/admin/sync"
mkdir -p "$ROOT/heads/marketplace/code/api/admin/crud"
mkdir -p "$ROOT/heads/marketplace/code/components"
mkdir -p "$ROOT/heads/marketplace/code/lib"
mkdir -p "$ROOT/heads/marketplace/code/ingesta/adaptadores"
mkdir -p "$ROOT/heads/marketplace/code/data"
mkdir -p "$ROOT/heads/marketplace/docs"
mkdir -p "$ROOT/shared"

# Archivos placeholder
touch "$ROOT/shared/.gitkeep"
touch "$ROOT/.gitignore"
touch "$ROOT/.env.example"
touch "$ROOT/README.md"
touch "$ROOT/heads/marketplace/HEAD-MARKETPLACE.md"

cd "$ROOT"
git init
git add .
git commit -m "init: estructura célula aislada catálogo marketplace (espejo repo origen)"
```

---

## Pasos en orden, después de ejecutar el script

1. **Copiar los 7 `.md` del briefing** (`README.md` + `00` a `05`) a `<<RUTA_BASE_PC_B>>/<<NOMBRE_REPO_CELULA>>/docs/`.
2. **Reemplazar todos los placeholders** `<<XXX>>` en los 6 archivos con valores reales — usar grep recursivo:
   ```bash
   grep -rn "<<" "$ROOT/docs/"
   ```
   y completar uno por uno.
3. **Redactar `heads/marketplace/HEAD-MARKETPLACE.md`** desde cero, con la memoria operativa propia de la célula. NO copiar nada del HEAD del origen.
4. **Inicializar el stack tecnológico**:
   ```bash
   cd "$ROOT"
   npm init -y
   # instalar deps según stack elegido
   ```
5. **Configurar tsconfig con baseUrl propio** (`"baseUrl": "."` o `"./heads/marketplace/code"`, según convenga). NO heredar tsconfig del origen.
6. **Configurar `.gitignore`** con: `node_modules`, `.next`, `.env`, `.env.local`, `dist`, `*.log`, `.DS_Store`.
7. **Configurar `.env.example`** con las variables que la célula necesita, sin valores reales.
8. **Primer commit con código**: estructura mínima viva (Next.js + tipos + página vacía con título "Catálogo Marketplace — Célula Experimental").
9. **Verificar aislamiento**: ejecutar grep recursivo sobre archivos de **código** para asegurar que no quedan referencias a dominios/credenciales/paths del origen:
   ```bash
   grep -rE "(<<DOMINIO_PRINCIPAL_ORIGEN>>)" "$ROOT" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json"
   ```
   Resultado esperado: **0 matches**.

   > **Nota:** El grep de verificación se ejecuta solo sobre archivos de código (`.ts`, `.tsx`, `.js`, `.json`), NO sobre `.md`. Los archivos `.md` en `docs/` contienen menciones intencionales de dominios vetados (como prohibiciones en `03-DOCTRINA-AISLAMIENTO.md`) y el propio patrón grep en `05-ESTRUCTURA-CARPETAS.md`. Esas menciones son informativas, no operativas, y no constituyen contaminación.

---

## Convenciones de naming

| Tipo | Convención | Ejemplo |
|---|---|---|
| Carpetas | kebab-case | `code/`, `ingesta/`, `adaptadores/` |
| Archivos `.md` | UPPER-CASE / numerado | `HEAD-MARKETPLACE.md`, `00-MISION.md` |
| Archivos código TS/TSX | kebab-case | `inmobiliaria-1.ts`, `project-card.tsx` |
| Componentes React | PascalCase (export) | `ProjectCard`, `FilterBar` |
| Slugs de proyecto | kebab-case sin acentos | `edificio-las-condes-2027` |
| Variables de entorno | UPPER_SNAKE_CASE | `DATABASE_URL`, `UF_API_URL` |

---

## Checklist de integridad estructural

Antes de cerrar el primer día de trabajo en computador B:

- [ ] Estructura de carpetas creada según el script.
- [ ] Los 7 `.md` del briefing (`README.md` + `00` a `05`) copiados a `docs/`.
- [ ] Todos los placeholders `<<XXX>>` reemplazados.
- [ ] `HEAD-MARKETPLACE.md` redactado desde cero.
- [ ] `package.json` propio inicializado.
- [ ] `tsconfig.json` propio (baseUrl propio, sin paths heredados del origen).
- [ ] `.env.example` propio.
- [ ] `.gitignore` propio.
- [ ] `README.md` con instrucciones para levantar localmente.
- [ ] git inicializado con commit inicial.
- [ ] Verificación de no-contaminación pasa con 0 matches.
- [ ] (Opcional) Remote GitHub configurado en cuenta propia de la célula.

---

## Placeholders globales

| Placeholder | Qué completa |
|---|---|
| `<<RUTA_BASE_PC_B>>` | Ruta absoluta donde vive el proyecto en el computador B (ej. `/home/user/dev` o `C:\Users\xxx\Projects`) |
| `<<NOMBRE_REPO_CELULA>>` | Nombre de la carpeta + nombre del repo (ej. `catalogo-marketplace`) |
| `<<DOMINIO_PRINCIPAL_ORIGEN>>` | Dominio del ecosistema origen, para verificación grep |
