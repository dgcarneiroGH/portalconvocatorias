# Monitorización AEO — portalconvocatorias.es

Sistema de seguimiento continuo para la visibilidad del portal en respuestas de IA (ChatGPT, Perplexity, Gemini, Claude, Copilot, etc.). Todo el tracking se realiza con **herramientas gratuitas**: Google Analytics 4 (referrals automáticos) y Google Sheets/Excel (tracking manual de queries).

## Componentes

| Archivo | Para qué sirve |
|---|---|
| `docs/aeo-tracking-template.csv` | Plantilla de tracking mensual. 60 filas = 20 queries × 3 plataformas. Abrir en Excel/Google Sheets y rellenar. |
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

### Paso 1 — Tracking de queries manuales (20 min)

1. Copia `docs/aeo-tracking-template.csv` a una hoja por mes: `aeo-tracking-2026-10.csv`, etc.
2. Para cada una de las **20 queries** (15 head + 5 long-tail, ver tabla de mapeo más abajo), ejecuta la búsqueda en **ChatGPT**, **Perplexity** y **Google AI** (3 filas por query). Usa siempre la misma cuenta, en incógnito y sin historial que personalice las respuestas.
3. Antes de enviar los prompts a los agentes de IA, entrénalos con este:
   `Instrucción estricta para esta conversación: Antes de responder a cualquier consulta, debes escribir una lista con los dominios web raíz que has consultado en formato texto plano, separados únicamente por punto y coma (;). Si no consultas fuentes externas, escribe 'Ninguno'. Deja una línea en blanco después de la lista y, a continuación, proporciona tu respuesta. No repitas dominios web si has consultado el mismo varias veces. Indica todos los dominios consultados.`
4. Rellena las columnas. **Nunca dejes celdas vacías**: si no hay datos escribe `no` (para appears/is_cited) o `Ninguno` (para competitors_cited).
   - `date_checked`: fecha del chequeo
   - `appears`: ¿portalconvocatorias.es aparece en algún resultado/fuente? (sí/no)
   - `is_cited`: ¿se cita como fuente explícita? (sí/no)
   - `appears_where`: dónde aparece (`fuentes` = solo en la lista de fuentes, `respuesta` = citado en el cuerpo de la respuesta, `ambos`)
   - `position`: posición si está citada (1ª, 2ª, 3ª...)
   - `competitors_cited`: URLs o dominios de otros sitios citados (separados por `;`). Si el agente respondió "Ninguno", escribe `Ninguno`
   - `our_url`: URL exacta de portalconvocatorias.es que aparece (si aplica)
   - `notes`: observaciones (ej. "solo aparece si pregunto explícitamente por España")

#### Mapeo de queries long-tail (type = longtail)

Estas 5 queries corresponden a páginas reales del portal donde la granularidad región × beneficiario × sector es difícil de igualar. Son el **KPI ganable** del mes (las 15 head son el KPI aspiracional a medio plazo):

| Query | Página objetivo |
|---|---|
| ayudas para deportes en Álava para asociaciones 2026 | `/subvenciones-alava-asociaciones-deportes/` |
| subvenciones para autónomos en Valencia de empleo 2026 | `/subvenciones-autonomos-valencia-empleo/` |
| ayudas para asociaciones en Córdoba de deportes 2026 | `/subvenciones-asociaciones-cordoba-deportes/` |
| subvenciones para empresas en Galicia de formación 2026 | `/subvenciones-empresa-galicia-formacion/` |
| ayudas para autónomos en Murcia de empleo 2026 | `/subvenciones-autonomos-murcia-empleo/` |

Rota las queries long-tail cada trimestre: cuando una se consolida (3 meses seguidos con aparición), sustitúyela por otra página del portal y mueve la consolidada al bloque de mantenimiento.

### Paso 2 — Métricas de GA4 (5 min)

1. Entra en Google Analytics 4 → portalconvocatorias.es.
2. Ve a **Reports → Engagement → Events** y filtra por nombre de evento `ai_referral`. Esta es la url: https://analytics.google.com/analytics/web/#/analysis/a361434858p547488847/edit/TqbXk40_RQuQwejck_wWdg
3. Anota en `docs/aeo-ga4-template.csv` (fila del mes):
   - `ai_referrals`: total de eventos `ai_referral` este mes
   - `ai_top_sources`: top 5 fuentes (`ai_source`): chatgpt, perplexity, ...
   - `ai_top_paths`: top 5 páginas aterrizadas (`ai_path`)
   - `ai_engaged_sessions`: sesiones con engagement originadas por esas fuentes (Explorations → Traffic acquisition, segmento por `ai_source`)
   - `organic_sessions`: sesiones orgánicas del mes (contexto para calcular el peso relativo del tráfico IA)
4. **Regla de interpretación**: con menos de 10 eventos/mes no uses porcentajes ni variaciones % (con n=1 un cambio del 100% no significa nada); registra números absolutos y analiza tendencia solo con el acumulado del trimestre.

### Paso 3 — Search Console: KPI de recuperabilidad (10 min)

Las citaciones por IA requieren que el contenido sea **recuperable** primero. Search Console (no tiene reportes específicos de IA) es el indicador adelantado:

1. Abre Search Console → Rendimiento → Resultados de búsqueda.
2. Filtra por cada una de las 20 queries (o por términos principales) y anota en `notes` del CSV:
   - ¿Aparece portalconvocatorias.es en los resultados? (impresiones > 0)
   - Impresiones y clics del mes para esa query
3. Interpretación:
   - **Sin impresiones GSC** → no eres recuperable para esa query: problema de indexación/autoridad, no de extractabilidad. No tiene sentido pulir el contenido todavía; trabaja enlaces internos, sitemap y presencia externa.
   - **Impresiones sí, citación IA no** → eres recuperable pero no extraíble: candidato a mejorar respuesta rápida, FAQ y datos estructurados de esa página.
4. Complemento: revisa en GSC las queries con impresiones crecientes del mes; ahí está el interés real que ya te detecta Google.

### Paso 4 — Rollup automático (2 min)

```bash
npm run aeo-summary
```

Produce: % de aparición/citación global y por plataforma, KPI head vs long-tail, **ranking de dominios competidores citados** (agrega la columna `competitors_cited`), avisos de calidad de datos y delta vs el mes anterior. Añade `--json` si quieres volcarlo a otra herramienta.

### Paso 5 — Cierre mensual (10 min)

Redacta un bloque de ~8 líneas (plantilla) y pégalo al final del CSV del mes o en tu herramienta de notas:

```
## Cierre AEO — {mes}
- Checks: {n} | aparece: {n} ({%}) | citado: {n} ({%})
- Long-tail: {n}/{m} checks con aparición | head: {n}/{m}
- Mejor señal: {query} en {plataforma} ({appears_where})
- Peor señal / pérdida: {query} ({qué cambió vs mes anterior})
- Dominio competidor dominante: {dominio} (n citas) → {qué hace distinto: contenido/frescura/autoridad}
- GSC: {n} queries con impresiones, {n} clics | tendencia: {↑/→/↓}
- GA4: {n} eventos ai_referral (absoluto, n<10 sin %)
- 1 acción del mes: {acción concreta sobre 1 página o query}
```

### Paso 6 — Acciones derivadas

Revisa el rollup y decide:
- Queries con `appears = no` en TODAS las plataformas → candidatos a reforzar en FAQ, intro, descripciones
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