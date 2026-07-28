# Instrucciones para agentes AI

Reglas operativas que cualquier agente (Claude Code, opencode, Gemini CLI, etc.) debe seguir al trabajar en este repositorio. Estas instrucciones tienen prioridad sobre el comportamiento por defecto del agente.

## Estructura del proyecto

- **Generador de contenido estático**: Hugo 0.163
- **Pipeline de datos**: scripts Python externos generan `content/grants/*.md` desde la BDNS
- **Frontend/layouts**: HTML templates en `layouts/` con partials reutilizables en `layouts/partials/`
- **Datos auxiliares**: `data/sectores.yaml` (mapeo slug→etiqueta para `tag_seo`)
- **Configuración**: `config.toml` define taxonomías (`region` → "regiones", `beneficiario` → "para")
- **Assets estáticos**: `static/` (incluye `robots.txt`, `llms.txt`, favicon, OG images)
- **Verificación**: scripts en `scripts/` ejecutables vía `npm run <script>`

## Reglas innegociables

### 1. Nunca modificar `content/grants/*.md` sin aprobación explícita

Los archivos `.md` de grants son **output del pipeline Python** que extrae datos de la Base de Datos Nacional de Ayudas (BDNS). Editarlos a mano:

- Se sobrescribirán en la siguiente ejecución del pipeline.
- Rompe la trazabilidad entre fuente oficial y contenido publicado.
- Introduce inconsistencias con los datos reales.

**Procedimiento correcto**:
- Si detectas un error en un grant → corregir el pipeline Python, no el `.md`.
- Si necesitas modificar frontmatter para un test puntual → crear un archivo de prueba separado (p. ej. `content/test/_index.md`), nunca tocar uno existente.
- Si el usuario pide explícitamente modificar un `.md` → pedir confirmación verbal antes de hacerlo y dejar nota en el commit.

### 2. Estructura del frontmatter de grants

Los campos `region` y `beneficiario` del frontmatter **se mantienen como están** en los `.md`:

```yaml
region: Álava              # string único, NO lista
beneficiario: Asociaciones y ong   # string único, NO lista
```

La conversión a plurales para URLs se hace en `config.toml`:

```toml
[taxonomies]
  region = "regiones"
  beneficiario = "para"
```

Resultado: una página de grant con `region: Álava` se publica en `/ayudas-alava-...` y un enlace "Todas las ayudas en Álava" apunta a `/regiones/alava/` (URL basada en el plural).

No cambiar la forma de los campos en el frontmatter ni romper esta convención.

### 3. Mapeo `tag_seo` → etiqueta legible

El slug `tag_seo` (en frontmatter) NO es legible por humanos. La etiqueta legible se busca en `data/sectores.yaml`:

```yaml
sectores:
  investigacion_y_ciencia: "investigación y ciencia"
  formacion: "formación"
  ...
```

**Validación obligatoria**: tras cualquier cambio en `data/sectores.yaml` o en el contenido, ejecutar `npm run validate-sectores`. Si falta una clave, exit 1. NO desplegar builds que fallen este check.

### 4. Convenciones de schema

- `Organization`, `WebSite`, `WebPage`, `CollectionPage`, `BreadcrumbList`, `SpeakableSpecification`: definidos en `layouts/partials/schemas.html`.
- `FAQPage`, `ItemList` con `Grant` items, `Article`: emitidos por `layouts/grants/single.html` y `layouts/preguntas-frecuentes/single.html`.
- Validar con `npm run validate-schema` y `npm run audit-aeo` antes de commit.

### 5. Build y verificación antes de commit

```bash
npm run check   # build + verify + validate-schema + validate-sectores
npm run audit-aeo   # auditoría AEO completa
```

Si cualquiera falla con exit != 0, NO hacer commit. Si falla por una causa esperada (pipeline regenerará datos faltantes), documentar en el mensaje del commit.

## Reglas operativas generales

- **No añadir comentarios en código** salvo que el usuario lo pida explícitamente.
- **No crear documentación** (`.md`, `README`) salvo que el usuario lo pida.
- **No hacer commit** salvo que el usuario lo pida explícitamente.
- **No instalar dependencias** nuevas sin preguntar.
- **No tocar configuración de CI/CD** (`.github/`, `netlify.toml`, `.lighthouserc.json`) sin confirmar.

## Prioridad de instrucciones

1. Instrucciones explícitas del usuario (este archivo, mensajes directos)
2. Skills y workflows cargados dinámicamente
3. Comportamiento por defecto del agente
