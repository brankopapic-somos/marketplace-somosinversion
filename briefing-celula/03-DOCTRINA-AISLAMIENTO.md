# 03 — Doctrina de aislamiento

> Frontera absoluta. Lectura obligatoria. Lo que aquí está prohibido NO se discute, NO se excepciona, NO se negocia.

---

## Principio

La célula es un experimento independiente. Su valor depende de NO contaminar ni ser contaminada por el ecosistema origen. Cualquier acoplamiento — accidental o intencional — invalida el experimento y obliga a reiniciar desde cero.

---

## Qué está prohibido sin excepción

### 1. Dominios y URLs del ecosistema origen

La célula NO realiza requests, NO publica metadata, NO referencia, NO redirige hacia:

- `<<DOMINIO_PRINCIPAL_ORIGEN>>` y todos sus subdominios
- `<<WORKER_URL_ORIGEN>>` y cualquier `*.workers.dev` del ecosistema origen
- `<<PLATAFORMA_VETADA_1>>` (ej. fuentes de catálogo previas con relación expirada)
- Cualquier URL listada en `<<LISTA_NEGRA_DOMINIOS>>` (ver `heads/marketplace/HEAD-MARKETPLACE.md` cuando se redacte)

### 2. Credenciales y tokens

La célula NO usa, NO referencia, NO almacena:

- Tokens de plataformas externas del ecosistema origen (Meta, GHL, Anthropic, etc. del origen)
- API keys de servicios cloud del ecosistema origen
- Cuenta de despliegue, cuenta cloud, cuenta de pagos del ecosistema origen
- Credenciales de bases de datos, KV, queues, storage del ecosistema origen

Si la célula necesita servicios equivalentes, contrata cuentas propias bajo `<<CUENTA_PROPIA_CELULA>>`.

### 3. Infraestructura

La célula NO escribe, NO lee, NO se conecta a:

- Bases de datos del ecosistema origen
- Object storage del ecosistema origen
- Queues, eventos, webhooks del ecosistema origen
- CDNs propios del ecosistema origen
- Workers, funciones serverless del ecosistema origen

Toda infraestructura de la célula es nueva, propia, en cuenta separada.

### 4. Repositorios git

- La célula vive en repo independiente, NO en `<<REPO_OFICIAL_ORIGEN>>`.
- Los commits de la célula NUNCA se pushean al repo oficial origen.
- La cuenta GitHub que hostea la célula es `<<CUENTA_GITHUB_CELULA>>`, NO `<<CUENTA_GITHUB_ORIGEN>>`.
- La célula no consume submodules, subtrees, ni paquetes privados del ecosistema origen.

### 5. Código y assets

La célula NO copia ni adapta:

- Archivos de código fuente del ecosistema origen
- Configuraciones (tsconfig, package.json, next.config, wrangler.toml, etc.) del origen
- Assets propietarios (imágenes de proyectos, logos, fonts) del origen
- Datos extraídos de plataformas vetadas (catálogos, listados)
- Documentación operativa interna del origen

Toda creación es nueva. Si una solución conceptual ya existe en el origen, se reescribe desde cero en la célula con su propia decisión arquitectónica.

### 6. Datos sensibles

La célula NUNCA contiene:

- Nombres reales de empleados del ecosistema origen
- Teléfonos, emails personales, direcciones físicas reales del equipo
- Datos comerciales reales de clientes finales (leads, contratos, conversaciones)
- Datos financieros internos del origen (revenue, márgenes, costos)
- Conversaciones, mensajes, registros internos del origen

Datos seed para desarrollo deben ser **ficticios o anonimizados**.

### 7. Memoria operativa

- La célula tiene su propia memoria (`heads/marketplace/HEAD-MARKETPLACE.md` interno) redactada desde cero.
- NO se importan los `.md` del ecosistema origen.
- NO se referencian rutas, decisiones, protocolos, ownership maps del origen.
- Si la célula necesita una doctrina, la redacta propia.

---

## Qué SÍ está permitido

| Acción | Permitido |
|---|---|
| Conocimiento conceptual genérico (UF, pie, dividendo, fórmulas hipotecarias) | ✅ |
| Listas públicas (regiones+comunas Chile, código postal, nomenclatura inmobiliaria estándar) | ✅ |
| Stack tecnológico equivalente (mismo framework, misma versión) si conviene | ✅ |
| Patrones arquitectónicos genéricos (adaptador, repository, hexagonal) | ✅ |
| Librerías de código abierto públicas (npm, pip, etc.) | ✅ |
| APIs públicas no vetadas (ej. mindicador.cl para UF) | ✅ con autorización |
| Replicar estructura de carpetas con propósito de integración futura | ✅ (ver `05-ESTRUCTURA-CARPETAS.md`) |

---

## Lo que NO es excepcionable

Esta doctrina **no admite excepciones operativas mientras la célula vive aislada**. Si surge una necesidad que parece requerir excepción:

1. Se documenta la necesidad en `heads/marketplace/docs/EXCEPCIONES-PROPUESTAS.md` (a crear si aplica).
2. Se escala a `<<CEO_NOMBRE>>` por canal directo.
3. La célula sigue operando bajo la doctrina actual hasta que `<<CEO_NOMBRE>>` autorice cambio.
4. Si se autoriza, la nueva regla se documenta acá con fecha y motivo.

**Saltarse esta doctrina invalida el experimento.**

---

## Condición de salida (integración futura)

La célula puede ser integrada al `<<REPO_OFICIAL_ORIGEN>>` solo cuando:

1. `<<CEO_NOMBRE>>` autoriza explícitamente la integración.
2. El experimento alcanzó los hitos del MVP 1 (ver `00-MISION.md`).
3. Se ejecuta una auditoría de no-contaminación: confirmar que la célula no tiene rastros prohibidos según esta doctrina.
4. Se planifica el merge: estructura espejo (ver `05-ESTRUCTURA-CARPETAS.md`) facilita el directorio destino.
5. Se actualizan los docs maestros del ecosistema origen vía flujo formal de coordinación.

Hasta que las 5 condiciones se cumplan, la célula sigue independiente.

---

## Placeholders a completar

| Placeholder | Qué completa |
|---|---|
| `<<DOMINIO_PRINCIPAL_ORIGEN>>` | Dominio web del ecosistema origen |
| `<<WORKER_URL_ORIGEN>>` | URL del Worker / backend del origen |
| `<<PLATAFORMA_VETADA_1>>` | Plataformas externas con relación expirada o no vigente |
| `<<LISTA_NEGRA_DOMINIOS>>` | Path al archivo donde vive la lista negra completa |
| `<<CUENTA_PROPIA_CELULA>>` | Cuenta cloud / paga propia para servicios de la célula |
| `<<REPO_OFICIAL_ORIGEN>>` | Repo del ecosistema origen |
| `<<CUENTA_GITHUB_CELULA>>` | Cuenta GitHub donde vive el experimento |
| `<<CUENTA_GITHUB_ORIGEN>>` | Cuenta GitHub oficial del origen (vetada) |
| `<<CEO_NOMBRE>>` | Quien autoriza excepciones e integración futura |
