# Fase 1 — SEO básico (head, title, description, canonical, OG, Twitter)

## Objetivo
Unificar el `<head>` de las 3 páginas del sitio (home, lista de grants, detalle de grant) en un único partial, y dotarlo de las meta etiquetas SEO/sociales mínimas para que el sitio sea compartible y rastreable correctamente.

## Estado actual (problema)
- `layouts/index.html`, `layouts/grants/list.html` y `layouts/grants/single.html` repiten el `<head>` con copy-paste.
- Ningún `.md` de `content/grants/` tiene `description:` en front matter.
- No existe `content/_index.md` (home) ni `content/grants/_index.md` (sección) → la home cae al fallback de `.Site.Title` para el title y al `.Summary` para la description (que en la home incluiría "Bienvenido a…", "Últimas Actualizaciones" y la lista de grants → mala description SEO).
- No hay canonical, ni Open Graph, ni Twitter Card → al compartir el sitio en redes no sale preview.

## Resultado esperado tras esta fase
- 2 archivos de contenido nuevos: `content/_index.md` (home) y `content/grants/_index.md` (sección) — definen `title` y `description` para que la home y la lista tengan datos SEO propios en vez de caer a `.Site.Title` y `.Summary`.
- 1 partial nuevo: `layouts/partials/head.html` con toda la lógica del `<head>`.
- 1 base nuevo: `layouts/_default/baseof.html` que lo invoca y define el bloque `main`.
- 3 templates refactorizados: `index.html`, `grants/list.html`, `grants/single.html` quedan con solo el contenido del `<main>` dentro de `{{ define "main" }}…{{ end }}`.
- `hugo server` muestra en las 3 URLs:
  - `<title>` correcto en cada caso.
  - `<link rel="canonical">` apuntando a su URL.
  - `<meta name="description">` poblada (con fallback a `.Summary` mientras no haya `description:` en front matter).
  - Bloque Open Graph y Twitter Card correcto.

## Paso a paso

### Paso 0 — Crear `content/_index.md` (home) y `content/grants/_index.md` (sección)
Sin estos archivos, Hugo no tiene datos SEO propios para la home ni para la sección `/grants/`: el `<title>` caería al nombre de la carpeta y la `<meta description>` al `.Summary` (resumen del primer párrafo del contenido renderizado, que en tu caso es ruido SEO).

**`content/_index.md`** — contenido:

    ---
    title: Portal de Subvenciones
    description: Recopilatorio actualizado diariamente de subvenciones, ayudas y convocatorias activas en España para asociaciones, autónomos, empresas y particulares, filtrado por territorio, tipo de beneficiario y sector.
    ---

(El `title` se puede dejar igual a `Site.Title` si no quieres diferenciarlo; el `description` es lo que de verdad aporta valor SEO en la home.)

**`content/grants/_index.md`** — contenido:

    ---
    title: Archivo de Subvenciones
    description: Listado completo de todas las categorías de subvenciones y ayudas activas, organizado por territorio, tipo de beneficiario y sector.
    ---

(Si no creas este segundo, el `<title>` de `/grants/` cambiaría de `Archivo de Subvenciones | Portal de Subvenciones` a `Grants | Portal de Subvenciones` tras el refactor → regresión SEO.)

### Paso 1 — Crear `layouts/_default/baseof.html`
Archivo nuevo con este contenido:

    <!DOCTYPE html>
    <html lang="es">
    <head>
      {{- partial "head.html" . }}
    </head>
    <body>
      <main>
        {{- block "main" . }}{{ end }}
      </main>
    </body>
    </html>

### Paso 2 — Crear `layouts/partials/head.html`
Archivo nuevo con este contenido:

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="{{ .Permalink }}">
    <title>{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} | {{ .Site.Title }}{{ end }}</title>
    <meta name="description" content="{{ .Description | default .Summary | plainify | htmlEscape | chomp | truncate 160 }}">

    <meta property="og:title" content="{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} | {{ .Site.Title }}{{ end }}">
    <meta property="og:description" content="{{ .Description | default .Summary | plainify | htmlEscape | chomp | truncate 160 }}">
    <meta property="og:url" content="{{ .Permalink }}">
    <meta property="og:type" content="{{ if .IsHome }}website{{ else }}article{{ end }}">
    <meta property="og:site_name" content="{{ .Site.Title }}">
    <meta property="og:locale" content="es_ES">

    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} | {{ .Site.Title }}{{ end }}">
    <meta name="twitter:description" content="{{ .Description | default .Summary | plainify | htmlEscape | chomp | truncate 160 }}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/main.css">

    {{- if not .IsHome }}
    <script defer src='https://static.cloudflareinsights.com/beacon.min.js'
      data-cf-beacon='{"token": "12b64ab13abd498fa9f06fc8f1cde0c7"}'></script>
    {{- end }}

### Paso 3 — Refactorizar `layouts/index.html`
- Borrar las líneas 1-18 (`<!DOCTYPE>` hasta `</head><body><main>`).
- Como primera línea del archivo escribir `{{ define "main" }}`.
- Después del cierre `</article>` escribir `{{ end }}`.
- El contenido del `<main>` se queda intacto.

Estructura final esperada:

    {{ define "main" }}
    <article class="grant-page">
      <header>…</header>
      … (lista de grants)
    </article>
    {{ end }}

### Paso 4 — Refactorizar `layouts/grants/list.html`
Mismo patrón que el paso 3: borrar todo el preámbulo hasta `<main>`, abrir con `{{ define "main" }}`, cerrar con `{{ end }}` antes de `</body></html>`.

### Paso 5 — Refactorizar `layouts/grants/single.html`
Mismo patrón que el paso 3 y 4.

### Paso 6 — Verificar en local
Ejecutar `hugo server` y abrir las 3 URLs en el navegador (Ctrl+U para ver el código fuente). Comprobar en cada `<head>`:

| URL | `<title>` esperado | `og:type` esperado |
|---|---|---|
| `/` | `Portal de Subvenciones` | `website` |
| `/grants/` | `Archivo de Subvenciones \| Portal de Subvenciones` | `article` |
| `/grants/subvenciones-alava-asociaciones-deportes/` | `Subvenciones para deportes en Álava… \| Portal de Subvenciones` | `article` |

Comprobar también que `<link rel="canonical">` y el bloque OG/Twitter aparecen correctamente. El contenido visible (cards de grants) debe verse **idéntico** al actual.

### Paso 7 — Commit
`git add layouts/ content/_index.md content/grants/_index.md` + `git commit -m "refactor: extract head into partial, add SEO meta + OG/Twitter cards"`.

## Lo que esta fase NO incluye (queda para fase 2)
- `og:image` → sin imagen personalizada los previews en redes saldrán sin foto. Se decidirá en una fase 2.
- `description:` en el front matter de los 14 `.md` → al no existir, Hugo usa `.Summary` (H1 + "Subvenciones activas (N):" + inicio de la lista), que NO es ideal para SEO pero NO rompe nada. Rellenar manualmente cada `.md` con un `description: "…"` único corresponde a la fase 2.
