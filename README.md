# Catálogo Marketplace — Célula Experimental

Marketplace inmobiliario chileno construido en una célula aislada, autorizada por `<<CEO_NOMBRE>>`.

## Estado actual

**MVP estático navegable** en HTML+CSS+JS vanilla. Sin dependencias, sin build step.

## Cómo levantar el MVP

Abrir directamente:

```
heads/marketplace/code/index.html
```

en cualquier navegador moderno (Chrome, Firefox, Edge). Funciona con protocolo `file://`.

## Estructura

```
.
├── briefing-celula/                  ← 7 docs fundacionales (briefing v1.0 + 7 correcciones aplicadas)
│   ├── README.md
│   ├── 00-MISION.md
│   ├── 01-MODELO-DATOS.md
│   ├── 02-INGESTA.md
│   ├── 03-DOCTRINA-AISLAMIENTO.md
│   ├── 04-GLOSARIO-Y-CONTEXTO.md
│   └── 05-ESTRUCTURA-CARPETAS.md
│
└── heads/marketplace/
    ├── HEAD-MARKETPLACE.md           ← Memoria operativa de la célula
    └── code/
        ├── index.html                ← SPA: catálogo + detalle + cotizador A
        └── data/
            └── seeds.js              ← Datos ficticios sanitizados
```

## Funcionalidades MVP

- Catálogo con grilla y filtros (comuna, tipo entrega, tipología, año, rango UF, condiciones)
- Detalle de proyecto con unidades y condiciones comerciales
- Cotizador Nivel A: cálculo dividendo amortización francesa, conversión UF↔CLP
- Distinción visual `agotado` (estado negocio) vs `timeout` (error técnico)
- Estado `bloqueada` con badges y botones deshabilitados

## Próximos hitos

Ver `heads/marketplace/HEAD-MARKETPLACE.md` sección "Próximos pasos sugeridos".

## Doctrina

Esta célula opera 100% aislada del ecosistema origen. Ver `briefing-celula/03-DOCTRINA-AISLAMIENTO.md`.
