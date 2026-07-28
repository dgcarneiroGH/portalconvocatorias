# Auditoría AEO — portalconvocatorias.es

**Fecha**: 2026-07-28
**Alcance**: Fases 0 + 1 (baseline + quick wins + estructura extractable)
**Sitio**: https://portalconvocatorias.es/

---

## 1. Metodología

Auditoría estática sobre el build de producción (`hugo --minify --baseURL https://portalconvocatorias.es/`), ejecutado el 2026-07-28 contra los scripts propios del repositorio (`scripts/verify-seo.js`, `scripts/validate-schema.js`) y un script de auditoría AEO creado para esta fase (`scripts/audit-aeo.js`).

No se han ejecutado contra herramientas externas (Lighthouse, Rich Results Test, Schema Markup Validator) — pendiente de ejecución manual.

---

## 2. Inventario del sitio

| Métrica | Valor |
|---|---|
| Páginas HTML totales | 56 |
| Páginas de grants (`/ayudas-*/`) | 46 |
| Páginas estáticas (aviso legal, contacto, fuentes, etc.) | 7 |
| Páginas de taxonomía (`/regiones/`, `/para/`) | 2 |
| Home | 1 |
| URLs en sitemap | 56 |
| Versión Hugo | 0.163.3 |

---

## 3. Estado técnico on-page

| Check | Estado | Detalle |
|---|---|---|
| `<title>` en todas las páginas | ✅ | — |
| `<meta name="description">` en todas las páginas | ⚠️ **DUPLICADO** | 56/56 páginas tienen 2 tags `<meta name="description">`. Bug entre `layouts/partials/seo-description.html` y `layouts/partials/head.html` línea 11. |
| `<link rel="canonical">` en todas las páginas | ✅ | — |
| `<meta property="og:image">` en todas las páginas | ✅ | — |
| `<h1>` único por página | ✅ | 100% |
| URLs inseguras `http://` | ✅ | 0 |
| Sitemap.xml válido | ✅ | 56 URLs, sin duplicados, sin legacy |
| Schema JSON-LD válido | ✅ | 100% cobertura |

### Issues de títulos y descripciones detectadas

- **Bug 1 — Duplicado de meta description**: `layouts/partials/seo-description.html` emite `<meta name="description">` y `layouts/partials/head.html:11` emite otro. Google suele tomar el primero, pero es ruido para AI parsers. **A resolver en Fase 1**.
- **Bug 2 — Título malformado en grants con tag compuesto**: las páginas con `tag_seo: investigacion_y_ciencia` muestran `"Ayudas de investigacion_y_ciencia en | Portal de Convocatorias"` (con guion bajo literal). Falta mapeo slug → etiqueta legible en `layouts/partials/head.html`. **A resolver en Fase 1**.
- **Bug 3 — Descripción del home truncada en partial**: `seo-description.html` corta la descripción a 160 chars para el meta description pero emite la versión truncada mientras `head.html` emite la versión completa. **A resolver en Fase 1**.
- **Typo en description global**: `"ayudas, ayudas y convocatorias"` debería ser `"ayudas y convocatorias"`. Aparece en `config.toml:6`, `content/_index.md:3`, `layouts/partials/schemas.html:4`. **A resolver en Fase 1**.

---

## 4. Estado schema.org / JSON-LD

| Tipo | Cobertura | Páginas |
|---|---|---|
| `Organization` | 1 | home |
| `WebSite` | 1 | home |
| `CollectionPage` | 3 | home + 2 páginas de taxonomía |
| `Article` | 52 | todas las páginas excepto home/taxonomía |

**Limitaciones AEO detectadas**:
- ❌ No existe `FAQPage` schema en ninguna página → **no hay forma de que AI extraiga Q&A estructuradas**
- ❌ No existe `GovernmentService` / `Grant` / `Dataset` específico para las fichas de convocatorias → AI solo ve "Article" genérico, no entiende que es un listado de ayudas públicas
- ❌ No existe `BreadcrumbList` → AI pierde contexto jerárquico
- ❌ No existe `SpeakableSpecification` → mal optimizado para voice assistants
- ❌ No existe `ItemList` schema en las páginas de taxonomía (están como CollectionPage) → **comparativas menos extraíbles**
- ⚠️ 14 `Article` sin `description` (grants sin description en frontmatter, fallback a Summary que queda vacío)
- ⚠️ `Organization` schema básico: falta `foundingDate`, `areaServed`, `knowsAbout`, `contactPoint`, `sameAs` → **E-E-A-T débil**

---

## 5. Estado AEO específico

| Elemento | Estado | Acción |
|---|---|---|
| `llms.txt` | ❌ No existe | Crear en Fase 1 |
| `pricing.md` / fichero machine-readable | ❌ No aplica (sitio sin pricing) | N/A |
| `robots.txt` con bots IA explícitos | ❌ Solo `User-agent: *` + `Allow: /` | Modificar en Fase 0 |
| Sección FAQ humana en grants | ❌ 0/46 grants | Crear en Fase 1 |
| Bloque definición "Qué es..." en home | ❌ Solo descripción corta | Añadir bloque 40-60 palabras en Fase 1 |
| Fecha "Última actualización" visible en grants | ❌ 0/46 grants | Renderizar `.Date` en template en Fase 3 |
| Bloque resumen extractable al inicio de cada grant | ❌ 0/46 grants | Crear en Fase 1 |
| Tabla comparativa región × sector | ❌ No existe | Crear en `/regiones/` y `/para/` en Fase 1 |
| Autor identificado con credenciales | ❌ Solo Organization | Añadir `Person` schema + bio en Fase 3 |
| Estadísticas públicas (nº ayudas, cobertura) | ❌ No existen | Crear dataset público en Fase 3 |

---

## 6. Baseline de visibilidad IA (pendiente)

Esta sección se completa manualmente tras ejecutar las queries de control. Plantilla en `/docs/MONITORING.md` (existente) y plantilla específica AEO al final de este documento.

**Queries prioritarias a evaluar** (15):

| # | Query | Plataforma |
|---|---|---|
| 1 | ayudas para asociaciones en Andalucía 2026 | ChatGPT, Perplexity, Google |
| 2 | subvenciones para autónomos en Valencia | ChatGPT, Perplexity, Google |
| 3 | convocatorias de formación España 2026 | ChatGPT, Perplexity, Google |
| 4 | ayudas nominativas abiertas ahora | ChatGPT, Perplexity, Google |
| 5 | cómo solicitar una ayuda de la BDNS | ChatGPT, Perplexity, Google |
| 6 | qué ayudas hay para empresas en España este mes | ChatGPT, Perplexity, Google |
| 7 | portal de convocatorias España | Google |
| 8 | subvenciones para asociaciones en Canarias | ChatGPT, Perplexity, Google |
| 9 | ayudas para deportistas individuales 2026 | ChatGPT, Perplexity, Google |
| 10 | plazos abiertos convocatorias públicas | Google |
| 11 | portal recopilatorio de ayudas públicas España | ChatGPT, Perplexity, Google |
| 12 | cómo encontrar todas las ayudas activas en mi comunidad autónoma | ChatGPT, Perplexity |
| 13 | listado actualizado de subvenciones España | ChatGPT, Perplexity, Google |
| 14 | ayudas para familias 2026 | ChatGPT, Perplexity, Google |
| 15 | dónde consultar ayudas autonómicas | ChatGPT |

**Métricas a registrar por query × plataforma**:
- ¿portalconvocatorias.es aparece? (sí/no)
- ¿Está citada como fuente? (sí/no)
- Posición en lista de fuentes (1ª, 2ª, 3ª...)
- ¿Qué competidores aparecen? (URLs)
- ¿Aparece nuestra URL exacta o solo el dominio?

**Plantilla de tracking**:
```
| Query | Plataforma | ¿Aparecemos? | ¿Citados? | Posición | Competidores citados |
|-------|-----------|--------------|-----------|----------|---------------------|
| ...   | ChatGPT   | ...          | ...       | ...      | ...                 |
```

---

## 7. Quick wins de Fase 0 (a ejecutar)

1. **`robots.txt` explícito para bots IA** — añadir reglas específicas para:
   - GPTBot, ChatGPT-User, OAI-SearchBot → permitir (citabilidad OpenAI/ChatGPT)
   - PerplexityBot, Perplexity-User → permitir (citabilidad Perplexity)
   - ClaudeBot, anthropic-ai → permitir (citabilidad Claude)
   - Google-Extended → permitir (citabilidad Gemini y AI Overviews)
   - CCBot → permitir (no bloqueamos; si en el futuro quieres evitar entrenamiento masivo, este es el bot a bloquear — no afecta citabilidad)
   - Bytespider (TikTok/Bytedance), Meta-ExternalAgent → permitir por defecto; revisar caso a caso si aparece tráfico no deseado

2. **Verificar Search Console + Bing Webmaster** — confirmar que el sitemap está enviado y no hay errores de cobertura.

3. **Documentar baseline de visibilidad IA** — ejecutar las 15 queries de control, tabular resultados.

---

## 8. Resultados Fase 1 (2026-07-28)

### Cambios aplicados
- **3 typos corregidos** en `term.html`, `fuentes.md`, `head.html` (og:image:alt)
- **Creado `data/sectores.yaml`** con mapeo slug→etiqueta legible
- **Títulos de grants ahora limpios**: "Ayudas de investigación y ciencia en España" en lugar de "Ayudas de investigacion_y_ciencia en"
- **`llms.txt` creado** en `static/` (58 líneas, español)
- **`/preguntas-frecuentes/` creada** con 13 preguntas + schema `FAQPage`
- **Bloque definición home** (40-60 palabras) añadido en `layouts/index.html`
- **Bloque resumen + 6 FAQs en cada grant** con variables (region/beneficiario/tag) + schema `FAQPage`
- **`terms.html` creado** para taxonomía list con Top 10 (con guard para datos vacíos)
- **`term.html` actualizado** con Top 5 (dormant hasta que se arregle el pipeline)

### Métricas tras Fase 1

| Métrica | Antes | Después |
|---|---|---|
| Páginas HTML | 56 | 57 |
| Cobertura schema | 100% (3 tipos) | 100% (5 tipos) |
| Tipos de schema | Article, CollectionPage, Organization, WebSite | + FAQPage |
| Páginas con FAQPage | 0 | 47 (46 grants + 1 FAQ) |
| Grants con bloque resumen | 0/46 | 46/46 |
| Grants con FAQ visible | 0/46 | 46/46 |
| Grants con FAQPage JSON-LD | 0/46 | 46/46 |
| Páginas con meta description duplicado | 56 | 0 |
| `llms.txt` | No | Sí |
| /preguntas-frecuentes/ | No | Sí |
| Bloque definición home | No | Sí |
| ItemList schema en taxonomía list | No | Sí (con guard) |

### Issues pre-existentes descubiertos
- **Pipeline no genera páginas de término de taxonomía**: el frontmatter usa `region: Álava` (string) en lugar de `region: ["Álava"]` (lista). Hugo no genera `/regiones/alava/` ni `/para/asociaciones-y-ong/`. La tabla Top 5 en `term.html` queda dormante hasta que se arregle el generador. **A resolver en pipeline (fuera de Fase 1)**.
- **14 grants huérfanos** (con `_orphan: true`) sin `region`/`beneficiario`/`description` — el pipeline los regenera cuando hay datos. Los warnings de "Article sin description" en validate-schema.js se reducen a 0 cuando el pipeline los rellena.

## 9. Acciones pendientes para fases siguientes

| Fase | Acción | Bloqueante |
|---|---|---|
| 1 (residual) | Arreglar pipeline para emitir listas en frontmatter (region, beneficiario) | Recomendado |
| 1 (residual) | Excluir grants `_orphan: true` del build si no tienen datos | Recomendado |
| 2 | Schema específico (`Grant` / `GovernmentService`) | Sí |
| 2 | Schema `BreadcrumbList` | Recomendado |
| 2 | Schema `SpeakableSpecification` | Opcional |
| 2 | Enriquecer `Organization` schema (foundingDate, areaServed, knowsAbout) | Sí |
| 3 | Fecha "Última actualización" visible en grants | Sí |
| 3 | Página `/metodologia/` | Sí |
| 3 | Autor `Person` con bio | Sí |
| 3 | Estadísticas públicas del dataset | Recomendado |
| 4 | Spreadsheet mensual de tracking | Continuo |
| 4 | Eventos Plausible para referrals AI | Continuo |

---

## 9. Notas y decisiones

- Se prioriza contenido humano útil sobre "AI-bait". Las recomendaciones de Princeton GEO (citas, stats, autoridad, claridad) coinciden con buenas prácticas de redacción.
- Google explícitamente desaconseja contenido separado para AI. La estructura extractable que se plantea (FAQ, tablas, definiciones) sirve tanto a usuarios como a AI — no hay riesgo de "scaled content abuse".
- Schema `Article` genérico se reemplaza por `GovernmentService` o `Grant` en Fase 2 — pendiente decidir cuál encaja mejor (revisar schema.org/cnd).
- Los schemas FAQPage emitidos son válidos según la documentación de schema.org. Google ya no muestra FAQ rich results en search, pero siguen siendo válidos para AI engines (ChatGPT, Perplexity, Claude).
- El `llms.txt` sigue el formato propuesto en [llmstxt.org](https://llmstxt.org). Se incluye en español por ser la audiencia principal del sitio.
