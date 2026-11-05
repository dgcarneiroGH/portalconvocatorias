# Monitorización AEO — portalconvocatorias.es

Sistema de seguimiento continuo para la visibilidad del portal en respuestas de IA (ChatGPT, Perplexity, Gemini, Claude, Copilot, etc.). Todo el tracking se realiza con **herramientas gratuitas**: Google Analytics 4 (referrals automáticos), Brave Search API vía workflow N8N (recuperabilidad SERP de las queries) y Google Sheets/Excel (registros mensuales).

## Componentes

| Archivo | Para qué sirve |
|---|---|
| `docs/aeo_tracking_template.csv` | Plantilla de tracking mensual. 20 filas = 20 queries × 1 búsqueda SERP (Brave, vía workflow N8N). Abrir en Excel/Google Sheets y rellenar. |
| `scripts/aeo-summary.js` | Rollup automático del CSV mensual: % de aparición/citación, ranking de dominios competidores citados, delta vs mes anterior y avisos de calidad de datos. Ejecutar con `npm run aeo-summary`. |
| `static/js/ai-referrals.js` | Snippet que detecta visitas desde plataformas de IA y empuja el evento a `dataLayer`. Lo recoge `gtag.js`. |
| `layouts/partials/ga4.html` | Snippet base de Google Analytics 4 con consent mode (analytics_storage denegado por defecto hasta consentimiento). |
| `layouts/partials/head.html` | Carga `ga4.html`, `cookie-banner.js` y `ai-referrals.js` en cada página. |
| `docs/aeo-ga4-template.csv` | Plantilla para registrar las métricas de GA4 de cada mes (alternativa editable al `aeo-ga4.ods`). |
| `docs/aeo-monitorizacion.md` | Este documento. Plantillas de revisión mensual y trimestral. |

## Cómo funciona el tracking automático

El flujo en cada carga de página es:

1. `ai-referrals.js` lee `document.referrer`.
2. Compara el hostname contra una lista de 13 plataformas de IA conocidas.
3. Si hay match, hace `dataLayer.push({ event: 'ai_referral', source, path, full_referrer })`.
4. gtag.js (cargado por `ga4.html`) recoge el push y lo envía a GA4 como evento `ai_referral` con sus parámetros.

No hay lógica extra en el snippet: la conversión a evento de GA4 ocurre en la capa de `gtag.js`.

### Parámetros enviados

| Parámetro | Tipo | Valores |
|---|---|---|
| `source` | string | `chatgpt`, `perplexity`, `claude`, `gemini`, `copilot`, `you`, `huggingface`, `mistral`, `phind`, `kagi_assistant`, `poe`, `duckassist`, `searchgpt` |
| `path` | string | Ruta de la página visitada (`/ayudas-murcia-familia/`, etc.) |
| `full_referrer` | string | URL completa del referrer |

### Limitaciones del consent mode

GA4 está configurado con `analytics_storage: 'denied'` por defecto hasta que el usuario acepta cookies (banner de `cookie-banner.js`). Hasta entonces los eventos `ai_referral` **no se envían** a GA4. Es la única manera de cumplir RGPD sin cookie wall, pero implica que las cifras de referrals AI **subestiman el tráfico real** en la proporción de usuarios que rechazan cookies. Téngase en cuenta al analizar tendencias.

## Configuración inicial (una sola vez, en GA4 Admin)

Sin este paso los eventos se reciben pero los parámetros solo son visibles vía Explorations, no en informes estándar ni en el reporte de Events.

### 1. Crear custom dimensions

GA4 → **Admin** (icono engranaje abajo izquierda) → **Custom definitions** → **Create custom dimensions**:

| Nombre sugerido | Scope | Event parameter |
|---|---|---|
| `ai_source` | Event | `source` |
| `ai_path` | Event | `path` |
| `ai_full_referrer` | Event | `full_referrer` |

Notas:
- El **Event parameter** debe coincidir exactamente con la clave que envía el JS (`source`, `path`, `full_referrer`).
- El nombre de la dimensión puede ser cualquiera; se recomienda prefijar con `ai_` para distinguirlas en los informes de las dimensiones estándar (GA4 tiene un `source` propio a nivel de sesión que se confundiría).
- Las dimensiones tardan **24-48h** en empezar a mostrar datos históricos.

### 2. Verificación rápida tras desplegar

1. Abre el sitio en producción con `?debug_mode` en la URL (lo activa `ga4.html`).
2. En GA4 ve a **Admin → DebugView**.
3. En DevTools simula un referrer cambiando `document.referrer` o navegando desde un enlace artificial con hostname `chatgpt.com`.
4. Confirma que aparece el evento `ai_referral` con los tres parámetros poblados.

## Flujo mensual (1h aprox.)

### Paso 1 — Tracking mensual de queries (15 min)

1. Copia `docs/aeo_tracking_template.csv` a un archivo por mes: `2611_aeo_tracking.csv`, etc. (naming YYMM). El template tiene **20 filas = 20 queries** (15 head + 5 long-tail, ver tabla de mapeo más abajo); cada query se mide con **1 búsqueda SERP**, no 3 filas por plataforma.
2. Ejecuta el workflow de N8N (sección "Método actual" más abajo) y vuelca sus filas al CSV del mes. El método mide **recuperabilidad en la SERP**: qué devuelve un buscador, como proxy de lo que las plataformas de IA recuperarían.
3. `(Opcional)` Para medir `is_cited` real (citación dentro de una respuesta de IA), haz checks manuales en **ChatGPT**, **Perplexity** y **Google AI** — prioritario para las 5 long-tail. Usa siempre la misma cuenta, en incógnito y sin historial que personalice las respuestas, y entrénalos con este:
   `Instrucción estricta para esta conversación: Antes de responder a cualquier consulta, debes escribir una lista con los dominios web raíz que has consultado en formato texto plano, separados únicamente por punto y coma (;). Si no consultas fuentes externas, escribe 'Ninguno'. Deja una línea en blanco después de la lista y, a continuación, proporciona tu respuesta. No repitas dominios web si has consultado el mismo varias veces. Indica todos los dominios consultados.`
4. Rellena las columnas. **Nunca dejes celdas vacías**: si no hay datos escribe `no` (para appears/is_cited) o `Ninguno` (para competitors_cited).
   - `date_checked`: fecha del chequeo
   - `appears`: ¿portalconvocatorias.es aparece en algún resultado de la SERP? (sí/no)
   - `is_cited`: ¿se cita como fuente explícita dentro de una respuesta de IA? (sí/no — siempre `no` con el método SERP)
   - `position`: posición si aparece (1ª, 2ª, 3ª...)
   - `competitors_cited`: dominios raíz de otros sitios citados (separados por `;`). Si no hay, escribe `Ninguno`
   - `our_url`: URL exacta de portalconvocatorias.es que aparece (si aplica)
   - `notes`: observaciones (ej. "solo aparece si pregunto explícitamente por España")

#### Mapeo de queries long-tail (type = longtail)

Estas 5 queries corresponden a páginas reales del portal donde la granularidad región × beneficiario × sector es difícil de igualar. Son el **KPI ganable** del mes (las 15 head son el KPI aspiracional a medio plazo):

| Query | Página objetivo |
|---|---|
| ayudas para deportes en Álava para asociaciones 2026 | `/subvenciones-alava-asociaciones-deportes/` |
| subvenciones para autónomos en Valencia de comercio 2026 | `/subvenciones-autonomos-valencia-comercio/` |
| ayudas para asociaciones en Córdoba de deportes 2026 | `/subvenciones-asociaciones-cordoba-deportes/` |
| subvenciones para empresas en Galicia de formación 2026 | `/subvenciones-empresa-galicia-formacion/` |
| ayudas para autónomos en Murcia de empleo 2026 | `/subvenciones-autonomos-murcia-empleo/` |

Rota las queries long-tail cada trimestre: cuando una se consolida (3 meses seguidos con aparición), sustitúyela por otra página del portal y mueve la consolidada al bloque de mantenimiento.

### Método actual: agente IA en N8N + Brave SERP

Ejecuta el Paso 1: un agente en N8N mide **recuperabilidad en resultados de búsqueda web** — qué devuelve Brave para cada query, como proxy de lo que las plataformas de IA recuperarían (1 fila por query; el CSV ya no tiene columna `platform`). Límites honestos del método:

- `is_cited` es **siempre `no`**: la citación dentro del texto de una respuesta de IA solo es medible con checks manuales en las plataformas (recomendados para el KPI long-tail).
- `temperature: 0` y **sin `frequency_penalty`**: la penalización de repetición empuja a variar tokens (`.es` → `.org`/`.cat`) y fue causa probable del TLD-drift detectado en octubre-noviembre.

Arquitectura (el LLM no produce ningún campo de datos: los dominios salen de la SERP devuelta por la API y no pueden inventarse):

```
[Code: queries] → [HTTP Request: SERP] → [Code: extract] → [If serp_ok]
   ├─ false → fila trazable como fallida (notes: "Búsqueda fallida o sin resultados suficientes")
   └─ true  → [LLM: solo notes] → [Code: merge+validate] → fila CSV
```

1. **HTTP Request — SERP**: API gratuita de búsqueda. Brave Search API (plan Free: 2.000 queries/mes): `GET https://api.search.brave.com/res/v1/web/search?q={{query}}&count=10&country=es&search_lang=es` con header `X-Subscription-Token`. Alternativa: Google Programmable Search Engine (100 queries/día).
2. **Code — extract** (deriva por código `appears`, `position`, `our_url`, `competitors_cited`, `appears_where`; `is_cited` fijo):

```js
const r = $json;
const portal = 'portalconvocatorias.es';
const host = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return null; } };
const urls = (r.web?.results ?? r.items ?? []).map(x => x.url || x.link).filter(Boolean).slice(0, 10);
const seen = [...new Set(urls.map(host).filter(Boolean))];
const idx = urls.findIndex(u => host(u) === portal);
return [{ json: {
  query: r.query, priority: r.priority ?? 'media', type: r.type,
  serp_ok: urls.length >= 3,
  urls_vistas: urls,
  domains_seen: seen,
  appears: idx >= 0 ? 'si' : 'no',
  position: idx >= 0 ? (idx + 1) + 'ª' : 'no',
  our_url: idx >= 0 ? urls[idx] : 'no',
  is_cited: 'no',
  appears_where: idx >= 0 ? 'fuentes' : 'no',
  competitors_cited: seen.filter(d => d !== portal).slice(0, 10).join('; ') || 'Ninguno'
}}];
```

3. **LLM — solo `notes`**: recibe los títulos + dominios literales de `extract` y devuelve `{ "notes": "..." }`. Instrucción del sistema: *"Recibes títulos y dominios literales de resultados de búsqueda web. Escribe 1-2 frases (máx. 35 palabras) sobre qué tipos de sitios dominan, mencionando SOLO dominios de la lista recibida. Prohibido inventar o corregir dominios. Si appears es 'si', transcribe el título del resultado de portalconvocatorias.es. Nunca escribas solo 'no'."*. Si el LLM falla, notes de plantilla con los 3 dominios principales de `domains_seen`.
4. **Code — merge+validate** (todo dominio debe trazar a `domains_seen`; sin trazabilidad → `[REVIEW: ...]`; SERP con <3 resultados → fila fallida, nunca `no` silencioso):

```js
const ex = $('extract').first().json;
const notes = $json.notes ?? '';
const bad = (ex.competitors_cited === 'Ninguno' ? [] : ex.competitors_cited.split(/;\s*/))
  .filter(d => !ex.domains_seen.includes(d));
const finalNotes = !ex.serp_ok ? 'Búsqueda fallida o sin resultados suficientes'
  : bad.length ? notes + ` [REVIEW: dominios no trazables a la SERP: ${bad.join(', ')}]` : notes;
const d = new Date();
const pad = n => String(n).padStart(2, '0');
return [{ json: {
  date_checked: pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(-2),
  query: ex.query, priority: ex.priority, type: ex.type,
  appears: ex.appears, is_cited: ex.is_cited, position: ex.position,
  competitors_cited: ex.competitors_cited, our_url: ex.our_url,
  notes: finalNotes, appears_where: ex.appears_where
}}];
```

Las filas con `[REVIEW:` no cuentan para el KPI hasta revisarse manualmente. Red de seguridad en el repo: `npm run aeo-summary` marca en "Validación cruzada" los tokens de `competitors_cited` sin dominio válido (espacios, sin TLD) y lista los dominios nuevos vs el mes anterior.

### Paso 2 — Métricas de GA4 (5 min)

1. Entra en Google Analytics 4 → portalconvocatorias.es.
2. Ve a **Reports → Engagement → Events** y filtra por nombre de evento `ai_referral`. Esta es la url: https://analytics.google.com/analytics/web/#/analysis/a361434858p547488847/edit/TqbXk40_RQuQwejck_wWdg
3. Anota en `docs/aeo-ga4.ods` (fila del mes):
   - `ai_referrals`: total de eventos `ai_referral` este mes
   - `ai_top_sources`: top 5 fuentes (`ai_source`): chatgpt, perplexity, ...
   - `ai_top_paths`: top 5 páginas aterrizadas (`ai_path`)
   - `ai_engaged_sessions`: sesiones con engagement originadas por esas fuentes (hoja 1 del informe, segunda columna)
   - `organic_sessions`: sesiones orgánicas del mes (contexto para calcular el peso relativo del tráfico IA, página 3 del informe)
4. **Regla de interpretación**: con menos de 10 eventos/mes no uses porcentajes ni variaciones % (con n=1 un cambio del 100% no significa nada); registra números absolutos y analiza tendencia solo con el acumulado del trimestre.

### Paso 3 — Search Console: KPI de recuperabilidad (10 min)

Las citaciones por IA requieren que el contenido sea **recuperable** primero. Search Console (no tiene reportes específicos de IA) es el indicador adelantado:

1. Abre Search Console → Rendimiento → Resultados de búsqueda.
2. Exporta los datos: botón **Exportar** (arriba derecha) → **Descargar CSV**. El zip trae la hoja "Consultas" con cada query, impresiones y clics del rango seleccionado (usa **Últimos 28 días**).
3. Filtra la hoja "Consultas" por las 20 queries del tracking (Ctrl+F o filtro de columna) y anota en `notes` del CSV del mes:
   - ¿Aparece portalconvocatorias.es en los resultados? (impresiones > 0)
   - Impresiones y clics del mes para esa query
4. Interpretación:
   - **Sin impresiones GSC** → no eres recuperable para esa query: problema de indexación/autoridad, no de extractabilidad. No tiene sentido pulir el contenido todavía; trabaja enlaces internos, sitemap y presencia externa.
   - **Impresiones sí, citación IA no** → eres recuperable pero no extraíble: candidato a mejorar respuesta rápida, FAQ y datos estructurados de esa página.
5. Complemento: revisa en GSC las queries con impresiones crecientes del mes; ahí está el interés real que ya te detecta Google. Ese mismo export de Consultas es el que sustituyes en el Drive (carpeta 99_Temp) para el workflow `Review Tags` (Paso 4).

### Paso 4 — Workflow revisión de TAGs SEO (2 min)
1. Corre el workflow `Review Tags` en N8N. Descarga primero el csv de Consultas desde GSC y sustituyelo en el Drive por el actual (carpeta 99_Temp).

### Paso 5 — Rollup automático (IA)

```bash
npm run aeo-summary
```

Produce: % de aparición/citación global y por plataforma, KPI head vs long-tail, **ranking de dominios competidores citados** (agrega la columna `competitors_cited`), avisos de calidad de datos y delta vs el mes anterior. Añade `--json` si quieres volcarlo a otra herramienta.

### Paso 6 — Cierre mensual (IA)

Redacta un bloque de ~8 líneas (plantilla) y pégalo al final del CSV del mes o en tu herramienta de notas:

```
## Cierre AEO — {mes}
- Checks: {n} | aparece: {n} ({%}) | citado: {n} ({%})
- Long-tail: {n}/{m} checks con aparición | head: {n}/{m}
- Mejor señal: {query} (posición {n})
- Peor señal / pérdida: {query} ({qué cambió vs mes anterior})
- Dominio competidor dominante: {dominio} (n citas) → {qué hace distinto: contenido/frescura/autoridad}
- GSC: {n} queries con impresiones, {n} clics | tendencia: {↑/→/↓}
- GA4: {n} eventos ai_referral (absoluto, n<10 sin %)
- 1 acción del mes: {acción concreta sobre 1 página o query}
```

### Paso 7 — Acciones derivadas

Revisa el rollup y decide:
- Queries con `appears = no` en la SERP → candidatos a reforzar en FAQ, intro, descripciones
- Queries con `appears = sí` pero `is_cited = no` → falta extractabilidad
- Queries con `competitors_cited` consistente → ver qué hacen ellos que tú no (usa el ranking de dominios del rollup)
- Queries long-tail con señal → replicar el patrón en más páginas del portal

## Expectativas realistas y palancas de visibilidad

Contexto tras 3 meses de tracking (ago-oct 2026): 0 apariciones en 135 checks head y 1-2 referrals GA4/mes. Es el resultado esperable para un sitio nuevo frente a la competencia actual de esas queries, y condiciona dónde invertir:

| Palanca | Horizonte | Qué es |
|---|---|---|
| **Long-tail programático** | 1-3 meses | Queries tipo región × beneficiario × sector (`/subvenciones-alava-asociaciones-deportes/`). Nadie más cubre esa granularidad con datos frescos; es donde el portal puede ser la mejor respuesta. Medir con el KPI long-tail + GSC. |
| **Extractabilidad** | 1-3 meses | Respuesta rápida con cifras reales, FAQ data-driven, tablas y datos agregados (ver `/estadisticas/`). Convierte "recuperable" en "citable", pero solo actúa si GSC ya muestra impresiones. |
| **Autoridad de dominio** | 6-18 meses | Las queries head están dominadas por organismos oficiales (BOE, hacienda, juntadeandalucia, gva) y agregadores veteranos (buscoayudas, mapasubvenciones, plazoabierto, fondai, avido). No se gana ahí con on-page: requiere backlinks, menciones y tiempo. |
| **Terceras partes** | 3-6 meses | Las marcas se citan ~6,5× más vía fuentes externas que vía su propio dominio (estudio GEO). Menciones en prensa local/specializada, foros del sector, directorios de recursos públicos. Es la palanca con mejor ratio esfuerzo/impacto para el KPI head. |

Regla de decisión mensual: si el rollup no muestra avance en long-tail ni en GSC tras 2 meses de mejoras de extractabilidad, el cuello de botella es de autoridad/recuperabilidad, no de contenido → pasa presupuesto a la palanca de terceras partes.

## Flujo trimestral (≈ 1 hora)

Cada 3 meses (al final de cada trimestre natural) ejecuta:

### A. Auditoría técnica
```bash
npm run check
npm run audit-aeo
node scripts/list-orphans.js 2>/dev/null || true
```

Comprobar que:
- [ ] Cobertura schema sigue al 100%
- [ ] Sin grants huérfanos nuevos
- [ ] `data/sectores.yaml` sigue sincronizado (`npm run validate-sectores`)
- [ ] Sitemap actualizado y sin URLs rotas (verificar en Search Console)
- [ ] GA4 sigue recibiendo eventos `ai_referral` (Reports → Realtime)

### B. Refresh de contenido
- [ ] Actualizar estadísticas en home (nº total, cobertura, fecha) — se recalcula automáticamente, solo verificar que se ven
- [ ] Revisar `/metodologia/` y reflejar cualquier cambio en el pipeline
- [ ] Revisar `/preguntas-frecuentes/` y añadir nuevas preguntas si han surgido
- [ ] Confirmar que `data/author.yaml` refleja al responsable real

### C. Análisis de tendencias
- [ ] Comparar 3 meses de CSV: ¿suben/bajan las apariciones?
- [ ] Comparar referrals AI en GA4 (evento `ai_referral`): tendencia
- [ ] Identificar 2-3 consultas donde el portal ha perdido presencia → planificar corrección
- [ ] Identificar 2-3 consultas donde ha ganado → replicar patrón

### D. Search Console + Bing Webmaster
- [ ] Revisar indexación en Google: ¿páginas nuevas indexadas? ¿errores 404?
- [ ] Revisar Bing: ¿problemas de cobertura?
- [ ] Confirmar que `llms.txt` está accesible y actualizado
- [ ] Confirmar que `sitemap.xml` está enviado y procesado

### E. Mejoras planificadas
- [ ] Priorizar 1-2 mejoras técnicas AEO (nuevo schema, refactor contenido, ...)
- [ ] Actualizar `docs/aeo-auditoria.md` con resultados del trimestre
- [ ] Si el pipeline de contenido cambia, actualizar `AGENTS.md` con las nuevas reglas

## Glosario de plataformas monitorizadas

| Plataforma | Match en JS | Notas |
|---|---|---|
| ChatGPT | `chat.openai.com`, `chatgpt.com` | Mayor audiencia generalista. Cita dominios concretos en sus respuestas. |
| Perplexity | `perplexity.ai`, `perplexity.tech` | Fuerte citación de fuentes. Visitas atribuibles altas. |
| Google AI Overviews / AI Mode | (sin referrer claro) | Difícil de atribuir; usar Search Console para queries con AI Overview |
| Gemini | `gemini.google.com`, `bard.google.com` | Citas menos frecuentes que Perplexity pero crecientes. |
| Claude | `claude.ai`, `anthropic.com` | Audiencia técnica/profesional. Pocas citaciones web, pero valiosas. |
| Microsoft Copilot | `copilot.microsoft.com`, `bing.com/chat`, `edgeservices.bing.com` | Apoyado en Bing. Atribuible vía referrer. |
| You.com | `you.com` | Nicho técnico. Bajo tráfico pero especializado. |
| DuckAssist | `duckduckgo.com` | Citaciones puntuales, búsquedas privadas. |
| HuggingFace Chat | `huggingface.co` | Nicho developer. |
| Mistral / Le Chat | `chat.mistral.ai`, `lechat.mistral.ai` | Nicho técnico. |
| Phind | `phind.com` | Nicho developer. |
| Kagi Assistant | `kagi.com` | Audiencia de pago, bajo volumen pero alta calidad. |
| Poe | `poe.com` | Agregador multi-modelo. |
| SearchGPT | `search.openai.com` | Buscador de OpenAI (cuando esté disponible). |

## Cuándo escalar

Si después de 2 trimestres consecutivos:
- Las apariciones en AI **no suben** o **bajan** → considerar:
  1. Auditoría técnica profunda de nuevo
  2. Inversión en backlinks y menciones externas (fuera del alcance del sitio)
  3. Contenido editorial original que AI cite de forma natural (estudios, guías originales)

## Cuándo no invertir más

- Si el tráfico AI es < 1% del tráfico total y estable → priorizar SEO tradicional y tráfico orgánico
- Si los referrals AI convierten peor que Google orgánico → mantener AEO como segunda prioridad

---

## Historial

| Fecha | Acción |
|---|---|
| 2026-07-28 | Versión inicial del sistema de monitorización (Fase 4) |
| 2026-07-30 | Reescrito. Confirmado que el stack gratuito de tracking es GA4 (nunca se integró Plausible). Documentada la arquitectura real (dataLayer push → gtag.js → GA4) y el procedimiento de configuración de custom dimensions. Limpiados caracteres no deseados. |
| 2026-09-14 | Primera revisión trimestral ejecutada (sección 10 de `aeo-auditoria.md`). Fix `--cleanDestinationDir`, nuevo `scripts/list-orphans.js`, refresh de contenido. |
| 2026-10-05 | Rediseño del análisis mensual tras 3 meses con 0/135 apariciones: +5 queries long-tail con KPI ganable separado, columna `appears_where`, paso de Search Console (KPI de recuperabilidad), `npm run aeo-summary` (rollup + ranking de dominios competidores), plantilla de cierre mensual, plantilla `aeo-ga4-template.csv`, regla de números absolutos con n<10 y sección de expectativas (head vs long-tail vs terceras partes). |
| 2026-11-02 | Análisis mensual de noviembre: CSV 2026-11 invalidado (checks no verificables: URLs citadas inexistentes fuera del sitemap, autocitación en `competitors_cited`, vocabulario `appears_where` roto). 27 filas de las 9 queries afectadas marcadas PENDIENTE RE-CHECK y añadidas las 15 filas long-tail que faltaban (2 meses sin medir el KPI ganable). `aeo-summary.js` valida ahora `our_url` contra `public/sitemap.xml`, vocabulario `appears_where` y autocitación (sección "Validación cruzada"). |
| 2026-11-04 | Análisis mensual de noviembre (2ª pasada): filas head del 04/11 aceptadas como válidas (decisión del responsable; se documentan dominios citados no verificables — `generalitat.cat`, `ayuntamientodebarcelona.es`, `federaciondeatletismo.es`, `ayto.laspalmasgrcanarias.es`, `fundacionluisvives.es` no resuelven DNS — y atribuciones falsas de `bnc.es`/`bne.es` respecto a la BDNS). Añadidas las 15 filas long-tail al CSV de noviembre (KPI sin medir desde su introducción el 2026-10-05). Query "subvenciones para autónomos en Valencia de empleo 2026" reasignada a "…de comercio 2026" → `/subvenciones-autonomos-valencia-comercio/`: la página objetivo de empleo ya no existe (los slugs rotan con el pipeline) y era donde cayó el único referral AI registrado (Perplexity, octubre). |
| 2026-11-04 | Anti-alucinación del método de auditoría: workflow N8N rediseñado como proxy SERP estructural (API de búsqueda + dominios extraídos por código + LLM solo para `notes` + validador de trazabilidad). `is_cited` pasa a ser siempre `no` en el método agente (la citación real solo se mide con checks manuales) y se elimina `frequency_penalty` (causa probable del TLD-drift). `aeo-summary.js` detecta ahora tokens sin dominio válido en `competitors_cited` (12 en el CSV del 04/11) y lista dominios nuevos vs mes anterior (26). |
| 2026-11-05 | Rediseño del formato: CSV mensuales renombrados a `26MM_aeo_tracking.csv` y nuevo esquema de 1 fila por query (sin `platform` ni `appears_where`) — la métrica es recuperabilidad en la SERP vía Brave (workflow N8N), no respuestas por plataforma. Template a 20 filas (15 head + 5 long-tail). `aeo-summary.js` adaptado al nuevo naming con columnas condicionales (retrocompatible con 2608-2610). Análisis de noviembre: primera aparición del tracking — "portal de convocatorias España", 2ª posición. Long-tail 0/5 (checks completados el 05/11; SERPs dominadas por instituciones regionales y medios locales). Hallazgo técnico: los `<title>` de las fichas omiten el beneficiario (H1 y meta description sí lo incluyen). |