## Scripts npm

Todos los scripts definidos en `package.json`:

| Script | Comando | Para qué sirve |
|---|---|---|
| `npm run dev` | `hugo server -D` | Arranca el servidor de desarrollo local con drafts incluidos. |
| `npm run build` | `hugo --minify --baseURL https://portalconvocatorias.es/` | Genera el sitio estático minificado en `public/` con la URL de producción. |
| `npm run test` | `npm run build && node scripts/verify-category-rendering.js` | Build + verificación rápida de que las categorías (región, beneficiario) se renderizan con su nombre legible y no con slugs. |
| `npm run verify` | `node scripts/verify-seo.js` | Comprueba SEO básico: sitemap, robots.txt, JSON-LD, meta tags (title, description, canonical), jerarquía de headings, URLs inseguras. |
| `npm run validate-schema` | `node scripts/validate-schema.js` | Valida que cada página tenga JSON-LD correcto y cuente los tipos de schema emitidos. |
| `npm run validate-sectores` | `node scripts/validate-sectores.js` | Comprueba que las claves de `data/sectores.yaml` cubran todos los `tag_seo` presentes en `content/grants/*.md`. Falla con exit 1 si falta alguna (drift detectado). |
| `npm run audit-aeo` | `node scripts/audit-aeo.js` | Auditoría AEO: detecta meta descriptions duplicados, FAQ/definiciones visibles por grant, schema `FAQPage`/`ItemList`, presencia de `llms.txt`. No está en `npm run check` por ser más profunda; ejecútala cuando quieras revisar la cobertura AEO. |
| `npm run check` | `build + verify + validate-schema + validate-sectores` | Pipeline completo de validación. Ejecútalo antes de hacer commit o desplegar para detectar regresiones. |
| `npm run og:build` | `node scripts/embed-logo.js && node scripts/og-render.js` | Regenera `og-image.png` y `og-image.svg` para Open Graph / Twitter Cards. |
| `npm run logo:convert` | `node scripts/convert-logo.js` | Convierte el logo a los formatos web necesarios (AVIF, PNG optimizado). |

### Flujo recomendado

```bash
npm run dev          # desarrollo local con recarga
npm run check        # antes de commit: build + 4 verificadores
npm run og:build     # solo si cambias el logo o la identidad visual
```
