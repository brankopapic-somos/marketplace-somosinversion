# Briefing — Célula aislada catálogo marketplace

Set de documentos fundacionales para la célula experimental autorizada por `<<CEO_NOMBRE>>` el `<<FECHA_AUTORIZACION>>`.

Estos archivos viajan con la célula al computador B y constituyen su único contexto. NO contienen código, credenciales, ni datos del ecosistema origen.

---

## Contenido del briefing

| Archivo | Propósito |
|---|---|
| `00-MISION.md` | Identidad de la célula, alcance MVP 1, fuera de alcance, visión 6 meses |
| `01-MODELO-DATOS.md` | Entidades, atributos, relaciones, lista cerrada de condiciones comerciales |
| `02-INGESTA.md` | Patrón adaptador + normalizador, formatos posibles, contratos, auditoría |
| `03-DOCTRINA-AISLAMIENTO.md` | Frontera absoluta. Qué está prohibido. Condición de salida |
| `04-GLOSARIO-Y-CONTEXTO.md` | Glosario financiero CL, tipologías, etapas, regiones, comunas RM |
| `05-ESTRUCTURA-CARPETAS.md` | Cómo armar la estructura espejo en computador B + script PowerShell + script bash |

---

## Cómo usar este briefing

### En el computador A (origen)

1. Completar todos los placeholders `<<XXX>>` en los 7 archivos (este README + `00` a `05`).
   - Buscar pendientes:
     ```bash
     grep -rn "<<" .
     ```
2. Verificar que ninguna mención sensible quedó suelta.
3. Comprimir la carpeta `briefing-celula/` y transferir al computador B.

### En el computador B (destino)

1. Descomprimir la carpeta en una ubicación clara.
2. Ejecutar el script de creación de estructura del archivo `05-ESTRUCTURA-CARPETAS.md` (PowerShell o bash según OS).
3. Copiar los 7 `.md` (este README + `00` a `05`) a `<<NOMBRE_REPO_CELULA>>/docs/`.
4. Seguir el checklist de integridad estructural de `05-ESTRUCTURA-CARPETAS.md`.
5. Activar al agente de la célula con prompt inicial que apunte a leer los 6 archivos en orden 00 → 05.

---

## Reglas vitales (recordatorio)

1. La célula es **independiente**. No toca el ecosistema origen.
2. Todos los placeholders `<<XXX>>` deben quedar resueltos antes del primer commit con código.
3. La estructura de carpetas es **espejo** del origen para facilitar la integración futura.
4. El primer agente que opere en la célula debe leer los 7 archivos antes de actuar.
5. La doctrina de aislamiento (`03-DOCTRINA-AISLAMIENTO.md`) NO admite excepciones operativas sin autorización explícita de `<<CEO_NOMBRE>>`.

---

## Ubicación en el repo

Este archivo se copia a `<<NOMBRE_REPO_CELULA>>/docs/README.md` junto con los 6 archivos del briefing (`00` a `05`), totalizando 7 documentos fundacionales en `docs/`.

> **Nota de aislamiento:** La columna "Ejemplo" de la tabla de placeholders usa valores genéricos ficticios. Ningún identificador real del ecosistema origen debe aparecer en este archivo. Esto asegura que la verificación de no-contaminación (`grep`) pase limpia sobre `docs/`.

---

## Lista única de placeholders globales

Resumen consolidado para completar antes del traspaso:

| Placeholder | Qué completa | Ejemplo (genérico) |
|---|---|---|
| `<<CEO_NOMBRE>>` | Nombre de quien autoriza | "nombre-del-ceo" |
| `<<FECHA_AUTORIZACION>>` | Fecha de la decisión | "YYYY-MM-DD" |
| `<<NOMBRE_ECOSISTEMA_ORIGEN>>` | Nombre genérico del origen | "nombre-ecosistema" |
| `<<DOMINIO_PRINCIPAL_ORIGEN>>` | Dominio web origen | "dominio-origen.ejemplo" |
| `<<WORKER_URL_ORIGEN>>` | URL Worker / backend origen | "worker-origen.ejemplo.dev" |
| `<<PLATAFORMA_VETADA_1>>` | Plataforma con relación expirada | "plataforma-vetada (url-vetada.ejemplo)" |
| `<<LISTA_NEGRA_DOMINIOS>>` | Path al archivo con la lista | "heads/marketplace/HEAD-MARKETPLACE.md sección Aislamiento" |
| `<<REPO_OFICIAL_ORIGEN>>` | Repo origen | "repo-origen (privado)" |
| `<<CUENTA_GITHUB_ORIGEN>>` | Cuenta GitHub vetada | "usuario-github-origen" |
| `<<CUENTA_GITHUB_CELULA>>` | Cuenta donde vive la célula | "usuario-github-celula" |
| `<<CUENTA_PROPIA_CELULA>>` | Cuenta cloud / paga propia de la célula | "proveedor-cloud-celula" |
| `<<COMPUTADOR_B_IDENTIFICADOR>>` | Identificador del PC destino | "equipo-destino-descripcion" |
| `<<NOMBRE_REPO_CELULA>>` | Nombre del repo célula | "nombre-repo-celula" |
| `<<RUTA_BASE_PC_B>>` | Ruta absoluta en PC B | "/ruta/absoluta/en/pc-b" |
| `<<OWNER_NOMBRE>>` | Owner del experimento | "Head Marketplace" |
| `<<N_INMOBILIARIAS>>` | Cantidad de inmobiliarias | "3" |
| `<<INMOBILIARIA_X_NOMBRE>>` | Nombres de las inmobiliarias | (a definir por CEO) |
| `<<INMOBILIARIA_X_FUENTE>>` | Tipo de fuente de stock | "API REST", "Google Sheets", etc. |
| `<<INMOBILIARIA_X_URL_O_PATH>>` | Endpoint o ruta del adaptador | (a definir por CEO) |
| `<<INMOBILIARIA_X_AUTH>>` | Tipo de autenticación | "Bearer token", "API key", etc. |
| `<<INMOBILIARIA_X_FRECUENCIA>>` | Frecuencia esperada de update | "diaria", "semanal", etc. |
| `<<INMOBILIARIA_X_NOTAS>>` | Notas operativas del adaptador | libre |
| `<<COTIZADOR_NIVEL_A_O_B_O_C>>` | Alcance del cotizador | "A" |
| `<<NIVEL_FINAL>>` | Nivel objetivo del cotizador a 6 meses | "C" |
| `<<DIAS_TIMEOUT_INGESTA>>` | Días sin update antes de marcar inactivo | "14" |
| `<<COMANDO_SYNC_MANUAL>>` | Comando para gatillar sync manual | "npm run sync" |
| `<<CRON_SYNC>>` | Expresión cron del sync periódico | "0 */6 * * *" |
| `<<FECHA_REFERENCIA>>` | Fecha de los valores referenciales | "YYYY-MM-DD" |
| `<<UF_REFERENCIA_CLP>>` | Valor UF al momento de redactar | "valor-numerico" |
| `<<TASA_REFERENCIAL>>` | Tasa anual default cotizador | "4.5%" |
| `<<INMOBILIARIA_SLUG>>` | Slug de ejemplo | "ejemplo-inmobiliaria" |
| `<<URL_REPO_O_LOCAL>>` | URL del repo o path local | "https://github.com/usuario/repo" o path local |

---

## Versión

- **Briefing v1.0** — `<<FECHA_REDACCION>>`
- Redactado por: Head Marketplace (computador A)
- Destino: Computador B, célula aislada
