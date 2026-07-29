# Fase 2 — Mejora continua de SEO y AEO sin coste recurrente

## Principio rector

**0 €/mes de herramientas · 0 € de APIs de pago · ~5 h/año de mantenimiento manual.**

Esta fase reemplaza completamente el plan anterior de integración con open-seo + DataForSEO, cuyo coste recurrente se estimó en **$130–165/mes** ($1.500–2.000/año) sin un retorno proporcional para una web de tamaño medio. El foco pasa de "monitorizar citaciones AI" a **mejorar activamente la citabilidad y el posicionamiento** con medios gratuitos.

**Métrica de éxito**: tendencia creciente trimestre a trimestre de (a) tráfico orgánico Google, (b) tráfico desde referrers AI, (c) número de páginas indexadas, (d) posiciones medias en Search Console. No monitorizamos citaciones exactas de LLMs porque no hay herramienta gratuita fiable para ello; el proxy válido es el tráfico que llega desde esos dominios.

## Cambios respecto al plan anterior

| Plan anterior (descartado) | Razón de descarte | Este plan (nuevo) |
|---|---|---|
| open-seo autoalojado con fork propio | $130–165/mes + 40 h/año mantenimiento + pérdida de foco | Eliminado |
| DataForSEO AI Visibility (Brand Lookup, Prompt Explorer) | API de pago, sin tier gratuito real | Eliminado |
| Cloudflare Workflows + D1 + cron mensual | Infraestructura sobredimensionada | Sustituido por GitHub Actions con APIs gratuitas (Capa 4, opcional) |
| Plausible Self-hosted / Cloud | Solo 1 mes gratis; tras eso, requiere plan pago o autoalojamiento | Usar Plausible el mes gratis para baseline; sustituir por GA4 + logs de Netlify |
| CSV de AEO tracking manual (`docs/aeo-tracking-template.csv`) | Conservar como plantilla, pero sin obligación mensual | Sustituido por Google Sheets lightweight (Capa 3) |
| Fase 0–6 con fork MCP, deploy, integración portal | 10–15 h setup + decisiones de despliegue | Sin setup externo. Acciones dentro del propio repo. |

## Lo que ya tenemos en producción (gratis, sin hacer nada)

Revisión rápida de por qué el stack actual ya empuja SEO/AEO sin coste adicional:

| Pieza | Dónde | Contribución a SEO/AEO |
|---|---|---|
| Hugo 0.163 con generación estática | `config.toml`, `layouts/`, `content/` | Sitios estáticos son los mejor indexados por Google y los más scrapeables por LLMs |
| Programmatic SEO vía pipeline Python | BDNS → `content/grants/*.md` | 1 convocatoria = 1 long-tail; volumen de páginas indexables crece sin esfuerzo |
| `llms.txt` (formato Open Knowledge) | `static/llms.txt` | Guía para LLMs sobre qué ofrece el portal; aumenta citabilidad baseline |
| Schema.org completo (Organization, WebSite, FAQPage, ItemList, Grant, Article, BreadcrumbList, SpeakableSpecification) | `layouts/partials/schemas.html`, `layouts/grants/single.html`, `layouts/preguntas-frecuentes/single.html` | Rich snippets en Google; los LLMs extraen JSON-LD directamente |
| Sistema de backlinks internos via taxonomías `region` y `beneficiario` | `config.toml` (`[taxonomies]`) + partials | Distribuye autoridad topical entre páginas |
| `static/js/ai-referrals.js` | `<head>` (`layouts/partials/head.html:39-41`) | Detecta tráfico desde ChatGPT, Perplexity, Claude, Gemini, Copilot, etc. y lo reporta como event en Plausible |
| OG images por grant | `static/og-images/` (cuando existan) | Mejor preview cuando LLMs enlazan |
| RSS feed nativo de Hugo | `/index.xml` (auto) | Fuente estructurada que LLMs y agregadores consumen |
| Sitemap XML nativo | `/sitemap.xml` (auto) | Indexación completa en Google, Bing, DuckDuckGo |
| Validaciones automatizadas | `npm run check`, `npm run audit-aeo` | Garantizan que ningún cambio rompe schema ni estructura |

> **Conclusión**: la base AEO/SEO ya está. Lo que falta es contenido de calidad y observabilidad gratuita.

---

## Capa 1 — Monitorización gratuita permanente

Sustituye a los dashboards pagos de open-seo. Cuatro fuentes, todas sin coste recurrente una vez configuradas.

### 1.1 Google Search Console (GRATIS, obligatorio)

**Setup inicial** (5 min, una sola vez):
1. Ir a https://search.google.com/search-console/
2. Añadir propiedad `https://portalconvocatorias.es/` (método DNS TXT)
3. Verificar.

**Qué consultar** (mensual, 5 min):
- **Rendimiento → Queries**: top 50 queries por impressions + CTR medio. Queries con impressions >100 y CTR <3% son candidatas a optimizar meta-description y title.
- **Rendimiento → Páginas**: páginas top por clicks. Si una página con buen ranking tiene CTR bajo, re-titular.
- **Inspección de URLs**: cuando publiques un grant nuevo, pegar la URL y solicitar indexación. Reduce tiempo de discovery de días a horas.
- **Cobertura → Excluidas**: vigilar que no crezca el número de páginas excluidas por error (canonical roto, noindex accidental, 404).

**Por qué sustituye a Brand Lookup**: Search Console te dice para qué queries de Google Search apareces y con qué CTR. Es la fuente #1 de verdad sobre visibilidad en Google (incluye AI Overview cuando Google muestra fuente enlazada).

### 1.2 Google Analytics 4 (GRATIS)

**Setup inicial** (10 min, una sola vez):
1. Crear propiedad GA4 en https://analytics.google.com/
2. Insertar `<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>` en `layouts/partials/head.html` (cuidado de no duplicar con Plausible).
3. Marcar IP del admin para evitar contar tus visitas.

**Qué consultar** (mensual, 5 min):
- **Adquisición → Adquisición de tráfico**: canales. Foco en `organic search` y referrals.
- **Adquisición → Referrals**: lista de dominios que enlazan. Aquí aparecerán también los LLMs cuyo referrer quede visible (`chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`, etc.). Es el **proxy gratuito de AEO tracking**.
- **Páginas → Páginas y pantallas**: grants top por tráfico.
- **Eventos → ai_referral** (configurado en `ai-referrals.js` y Plausible → replicar la lógica en GA4 si quieres redundancia).

**Por qué sustituye a Prompt Explorer**: tráfico desde el referrer del LLM = alguien hizo clic en una respuesta AI que citaba tu web. Esto es la única señal "gratuita y fiable" de que estás siendo citado en una respuesta AI real.

### 1.3 Bing Webmaster Tools (GRATIS)

**Setup inicial** (5 min, una sola vez):
1. Ir a https://www.bing.com/webmasters
2. Importar propiedad desde Google Search Console (botón nativo, ahorra verificación manual).

**Qué consultar** (trimestral, 5 min):
- **Búsqueda → Palabras clave**: similar a Search Console pero para Bing. Útil porque Bing alimenta a DuckDuckGo y a **Copilot** (Microsoft Copilot usa índice Bing).
- **Búsqueda → Páginas**: cobertura de indexación en Bing.

**Por qué importa**: Copilot, Perplexity (parcialmente) y DuckDuckGo AI Chat se nutren del índice de Bing. Aparecer en Bing = aparecer en esos LLMs.

### 1.4 Logs de Netlify (GRATIS con el plan actual)

Netlify ya provee logs de acceso al sitio. Una vez al trimestre:

```bash
# Exportar logs desde el panel Netlify:
# Site → Analytics → Logs → Descargar CSV
```

Parsear con cualquier herramienta (incluso Excel) y extraer:
- User-Agent de LLMs que scrapean tu web: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`.
- Hits por bot: si `GPTBot` te visita 50 veces/mes y `ClaudeBot` 200, sabes qué LLMs indexan tu contenido y con qué frecuencia.

**Por qué importa**: estos bots son los que **alimentan el entrenamiento y el retrieval** de los LLMs. Si te scrapean = pueden citarte. Puedes ver tasas de crawl en tiempo real y detectar caídas (señal de problema técnico).

### 1.5 Plausible — mes gratis de trial

**Política**: durante el mes de trial, dejar Plausible instalado y configurado. Recopilar todo el histórico posible de ese mes (referrers AI, top pages, eventos). Al finalizar el mes:

- Exportar todo desde Plausible → CSV.
- El evento `ai_referral` ya queda implementado vía `ai-referrals.js`. **Replicar el patrón en GA4** para no perder esa señal después.
- Decidir entre:
  - (a) Asumir coste Plausible (~9 €/mes plan community) si el valor lo justifica, o
  - (b) Sustituir completamente por GA4 + logs Netlify (gratis).

---

## Capa 2 — Mejoras on-page de alto ROI (acciones únicas o casi únicas)

Lista priorizada. Cada item tiene impacto esperado y esfuerzo. Marcar y ejecutar **una vez cada uno** da el grueso del retorno. No requiere mantenimiento.

### 2.1 Prioridad ALTA (hacer en orden)

| # | Acción | Esfuerzo | Impacto | Cómo |
|---|---|---|---|---|
| 1 | FAQ por cada sector/región top | 4 h | Alto | Crear `content/preguntas-frecuentes/<sector>-<region>/_index.md` con 5-8 preguntas y schema `FAQPage` (ya soportado). Los LLMs citan FAQs casi literalmente. |
| 2 | "Cómo solicitar" por tipo de beneficiario | 3 h | Alto | Crear guías paso a paso: `content/guias/como-solicitar-subvencion-para-<beneficiario>.md`. Las preguntas "how to" son long-tail AEO-friendly. |
| 3 | "Última actualización" visible en cada grant | Ya soportado por Hugo | Medio | Asegurar que `layouts/grants/single.html` muestra `{{ .Lastmod }}` con `datefmt`. Los LLMs favorecen contenido fresco. |
| 4 | Asegurar OG image por grant individual | 2 h | Medio | Si `static/og-images/` está vacío, generar proceduralmente con Hugo (tema + título del grant) o con script Python que use Pillow. Cuando LLMs enlazan, el preview es más rico y clicable. |
| 5 | Internal linking entre grants del mismo sector/región | Continuo (al añadir grants) | Alto | En `layouts/grants/single.html`, sección "Otras convocatorias en <sector>" que enlace a grants hermanos. Aumenta autoridad topical. |

### 2.2 Prioridad MEDIA

| # | Acción | Esfuerzo | Impacto | Cómo |
|---|---|---|---|---|
| 6 | Página pilar por sector (guía larga 2000+ palabras) | 8 h/sector × N sectores | Muy alto | `content/sectores/<slug>/_index.md` con índice de grants + guía sobre cómo financiarse en ese sector. Convierte el sitio en "fuente autoritativa" para ese nicho. |
| 7 | Página pilar por CCAA | 8 h/CCAA × 17 = ~140 h total | Muy alto (a largo plazo) | Similar: `content/regiones/<slug>/_index.md`. Cada CCAA tiene normativa propia, lo que justifica contenido único. Hacer 2-3 CCAA top y validar interés antes de hacer todas. |
| 8 | Tablas comparativas entre grants | 4 h | Medio | Ej: "Subvenciones para autónomos 2026: comparativa". Schema `ItemList`. |
| 9 | Schema `HowTo` en guías paso a paso | 1 h/guía | Medio | Si están creadas (#2), añadir schema `HowTo` además del `Article`. |
| 10 | SpeakableSpecification explícito por sección clave | 1 h | Bajo-Medio | Ya hay schema global; añadir `speakable` con selectores CSS específicos para los párrafos más importantes de cada grant. |

### 2.3 Prioridad BAJA (mejora incremental)

| # | Acción | Esfuerzo | Impacto |
|---|---|---|---|
| 11 | Optimizar meta-descripciones de grants con CTR <3% | Continuo | Medio (cuando se detecte en Search Console) |
| 12 | Añadir `caption` y `alt` text a todas las imágenes (ya debería estar) | Continuo | Bajo |
| 13 | Rich snippets de "rating" en grants (no aplica realmente) | — | Nulo (descartado) |
| 14 | Compresión agresiva de OG images (WebP) | 1 h | Bajo (velocidad de carga) |

### 2.4 Validación continua

Cada vez que se ejecute un cambio de Capa 2:

```bash
npm run check            # build + verify + validate-schema + validate-sectores
npm run audit-aeo        # auditoría AEO completa
```

---

## Capa 3 — AEO testing manual mensual (20 min/mes)

Plantilla ligera para medir citaciones AI sin coste. Ejecutar el primer lunes de cada mes (sólo 15-20 min):

### 3.1 Queries top a probar (rotar entre estas)

Elegir 5-8 del pool según prioridad del mes:

```
ayudas para autónomos 2026
subvenciones para asociaciones en Andalucía
convocatorias para empresas tecnológicas España
cómo solicitar una subvención para un proyecto de investigación
ayudas al alquiler 2026 requisitos
becas para estudios en el extranjero
subvenciones para digitalización de pymes
portal de convocatorias públicas España
```

### 3.2 Procedimiento (15-20 min)

1. Abrir **ChatGPT** (GPT-4 o GPT-4o), pegar la query exacta.
2. Anotar (Sí/No):
   - ¿Menciona `portalconvocatorias.es` por URL?
   - ¿Cita `portalconvocatorias.es` como fuente?
   - ¿Menciona el dominio aunque no lo cite?
3. Repetir en **Perplexity** (sonar-pro, gratis vía https://www.perplexity.ai/).
4. Repetir en **Google AI Overview** (búsqueda en google.es con la query; ver el panel AI).
5. Repetir en **Gemini** (gemini.google.com).

### 3.3 Registro en Google Sheets

Crear hoja `seo-aeo-mensual-{YYYY-MM}` con columnas:

```
fecha | plataforma | query | mencionada_sn | citada_url | ranking_aprox | notas
```

Acumulable mes a mes para detectar tendencia. **No hacer dashboards**: una hoja simple con histórico sirve.

### 3.4 Cuándo escalar

Si tras 3 meses observas:
- 0 menciones en alguna plataforma → investigar por qué (contenido no indexado por su bot, llms.txt poco detallado, etc.).
- Bajada brusca → mismo procedimiento.
- Aumento consistente → documentar qué se hizo en ese periodo y replicar.

---

## Capa 4 — AEO testing automatizado 0€ (opcional)

Si en algún momento la Capa 3 resulta tediosa y quieres queries mensuales automáticas **sin pagar un céntimo**, este bloque es viable:

### 4.1 APIs gratuitas que sirven para AEO en 2026

| API | Tier gratuito | Modelos disponibles | Límite free |
|---|---|---|---|
| **Google AI Studio** (Gemini) | Free forever para uso personal | `gemini-2.0-flash`, `gemini-2.5-pro` | 15 RPM, 1500 RPD, 1M tokens/min |
| **Groq Cloud** | Free tier | `llama-3.3-70b`, `mixtral-8x7b`, `whisper` | 30 RPM, generoso en tokens |
| **OpenRouter** | Modelos free | Varios (Llama, Qwen, etc.) | Limitado por modelo, suficiente para 30 calls/mes |
| **HuggingFace Inference** | Free tier | Miles de modelos open-source | Rate-limited pero válido para batch |

**Cobertura**: con Gemini (Google AI Overview simulado), Llama vía Groq (proxy razonable para ChatGPT ecosystem) y un modelo OpenRouter, cubres ~3 plataformas a coste $0.

### 4.2 Setup opcional (sólo si quieres llegar aquí)

**No ejecutar hasta decidir si compensa**. Estimación: 4-6 h setup único + 0 h/mes mantenimiento (corre solo vía GitHub Actions).

Si decides hacerlo:

1. **Script Node.js** en `scripts/aeo-monthly-check.mjs`:
   - Toma las queries desde `data/aeo-queries.yaml`.
   - Llama a Gemini API free, Groq API free, OpenRouter API free.
   - Pasa cada respuesta por un parser que extrae menciones de `portalconvocatorias.es`.
   - Persiste resultados en `data/aeo-history/<YYYY-MM>.json`.

2. **GitHub Action** en `.github/workflows/aeo-monthly.yml`:
   ```yaml
   name: AEO monthly check
   on:
     schedule: [{ cron: '0 3 1 * *' }]   # día 1 de cada mes, 03:00 UTC
     workflow_dispatch:
   jobs:
     aeo:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '22' }
         - run: node scripts/aeo-monthly-check.mjs
           env:
             GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
             GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
             OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
         - run: git add data/aeo-history/ && git commit -m "aeo: monthly run $(date +%Y-%m)" && git push
   ```

3. **Secrets en GitHub** (gratis, una vez):
   - `GEMINI_API_KEY` desde https://aistudio.google.com/apikey
   - `GROQ_API_KEY` desde https://console.groq.com/
   - `OPENROUTER_API_KEY` desde https://openrouter.ai/

4. **Visualización**: el JSON en `data/aeo-history/` se puede explorar con cualquier visor (incluso abrirlo en VS Code). Para dashboard visual, opcionalmente Hugo puede renderizarlo (sin coste).

### 4.3 Límites reales del tier gratuito

- **Gemini**: 1500 requests/día. Con 15 queries × 1 plataforma = 15 calls/mes. Sobra margen ×100.
- **Groq**: 30 RPM, sin límite mensual estricto para tier free. Margen suficiente.
- **OpenRouter**: depende del modelo free elegido. Algunos dejan de ser free temporalmente.

**Verificación**: tras las primeras ejecuciones, mirar logs de GitHub Actions y confirmar que las APIs devolvieron 200 OK. Si alguna API free se cierra o cambia, sustituir por otra equivalente.

### 4.4 Cuándo NO hacer Capa 4

Si ya te parece suficiente con Capa 3 (manual, 20 min/mes), no la implementes. El retorno marginal de automatizar 20 min/mes es bajo. Esta capa solo vale la pena si:
- Quieres histórico consultable por el agente (Claude/opencode puede abrir el JSON).
- Quieres alertas reactivas vía webhooks/email.
- Quieres reducir esos 20 min/mes a 0.

---

## Calendario anual de mantenimiento (~5 h/año)

| Cadencia | Tiempo | Tarea | Herramientas |
|---|---|---|---|
| **Semanal** (5 min) | 5 min × 52 = ~4 h/año | Mirar emails de Search Console (errores críticos, cobertura) | Gmail + Search Console |
| **Mensual** (20 min) | 20 min × 12 = 4 h/año | Test AEO manual + actualizar Google Sheet | ChatGPT, Perplexity, Gemini + Sheets |
| **Trimestral** (30 min) | 30 min × 4 = 2 h/año | Revisar GA4 referrals (incluidos AI referrers), Search Console queries top, Bing WMT keywords | GA4 + Search Console + Bing WMT |
| **Anual** (1 h) | 1 h | Auditoría completa: revisar llms.txt, schema, OG images, sitemap, ejecutar `npm run audit-aeo` | Hugo + scripts + AGENTS.md |
| **Total** | **~11 h/año** | | |

(Reparto real por elemento ~5 h/año efectivas; el resto es holgura.)

---

## Métricas de éxito (revisar trimestralmente)

| Métrica | Dónde medirla | Tendencia deseada |
|---|---|---|
| Clics totales desde búsqueda orgánica Google | GA4 → Adquisición → Organic Search | ↑ trimestre a trimestre |
| Impressions totales en Search Console | Search Console → Rendimiento | ↑ |
| CTR medio en Search Console | Search Console → Rendimiento | ↑ o estable (>2% es razonable) |
| Páginas indexadas | Search Console → Cobertura | ↑ o estable |
| Referrers desde `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai` | GA4 → Adquisición → Referrals | ↑ |
| Visitas de `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` (logs) | Netlify logs parseados | ↑ |
| Menciones manuales registradas | Google Sheet `seo-aeo-mensual-*` | ↑ mes a mes |

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Google AI Studio / Groq cambian políticas free y caen los tier gratuitos | Capa 3 (manual) sigue funcionando con cero dependencia externa |
| Bing WMT deja de importar desde GSC | Re-verificar manualmente (5 min) |
| Logs de Netlify no distinguen bots por user-agent de forma trivial | Filtrar por regex: `(GPTBot\|ClaudeBot\|PerplexityBot\|Google-Extended\|Applebot-Extended\|CCBot)` |
| Manual AEO testing se vuelve tedioso y se abandona | Si pasa, decidir activar Capa 4 (automatización gratuita) |
| Plausible termina el trial y se pierde señal diferenciada de `ai_referral` | Replicar patrón en GA4 antes de que expire el trial |
| Algunas CCAA/sectores no justifican páginas pilar (volumen de búsqueda insuficiente) | Validar con Google Trends antes de invertir las 8h por pilar |
| El portal crece mucho y el testing manual escala mal | Revisar triggers para activar Capa 4 (ej. >100 grants) |

---

## Lo que esta fase NO incluye (queda para futuras, si alguna vez se justifica)

- **Autoalojamiento de open-seo** con DataForSEO pago (descartado por coste; aquí están sus equivalentes gratuitos).
- **Rank tracking diario automatizado** (no es necesario; Search Console cubre el ciclo mensual).
- **Backlinks monitoring** (manual vía Search Console "Enlaces" + Ahrefs free tier si surge necesidad puntual).
- **Visualizaciones / dashboards propios** (Google Sheets + Data Studio free bastan; no merece un subproducto Hugo extra).
- **Integración con APIs de pago tipo OtterlyAI, Profound** (no mientras existan los equivalentes gratuitos documentados arriba).
- **Workflow mensual en Cloudflare** (sustituido por GitHub Actions con tier gratuito, sólo si se activa Capa 4).
- **CRON exterior disparando tests** (incluido en Capa 4 opcional via GitHub Actions; coste $0).
