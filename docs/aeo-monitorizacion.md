# Monitorización AEO — portalconvocatorias.es

Sistema de seguimiento continuo para la visibilidad del portal en respuestas de IA (ChatGPT, Perplexity, Gemini, Claude, Copilot, etc.). Todo el tracking se realiza con **herramientas gratuitas**: Google Analytics 4 (referrals automáticos) y Google Sheets/Excel (tracking manual de queries).

## Componentes

| Archivo | Para qué sirve |
|---|---|
| `docs/aeo-tracking-template.csv` | Plantilla de tracking mensual. 45 filas = 15 queries × 3 plataformas. Abrir en Excel/Google Sheets y rellenar. |
| `static/js/ai-referrals.js` | Snippet que detecta visitas desde plataformas de IA y empuja el evento a `dataLayer`. Lo recoge `gtag.js`. |
| `layouts/partials/ga4.html` | Snippet base de Google Analytics 4 con consent mode (analytics_storage denegado por defecto hasta consentimiento). |
| `layouts/partials/head.html` | Carga `ga4.html`, `cookie-banner.js` y `ai-referrals.js` en cada página. |
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

## Flujo mensual (≈ 30-45 minutos)

### Paso 1 — Tracking de queries manuales (20 min)

1. Copia `docs/aeo-tracking-template.csv` a una hoja por mes: `aeo-tracking-2026-08.csv`, etc.
2. Para cada una de las **15 queries prioritarias**, ejecuta la búsqueda en **ChatGPT**, **Perplexity** y **Google AI** (3 filas por query).
3. Rellena las columnas:
   - `date_checked`: fecha del chequeo
   - `appears`: ¿portalconvocatorias.es aparece en algún resultado/fuente? (sí/no)
   - `is_cited`: ¿se cita como fuente explícita? (sí/no)
   - `position`: posición si está citada (1ª, 2ª, 3ª...)
   - `competitors_cited`: URLs de otros sitios citados (separados por `;`)
   - `our_url`: URL exacta de portalconvocatorias.es que aparece (si aplica)
   - `notes`: observaciones (ej. "solo aparece si pregunto explícitamente por España")

### Paso 2 — Métricas de GA4 (5 min)

1. Entra en Google Analytics 4 → portalconvocatorias.es.
2. Ve a **Reports → Engagement → Events** y filtra por nombre de evento `ai_referral`.
3. Para desglose por fuente y página usa **Explorations** con las dimensiones personalizadas `ai_source` y `ai_path`.
4. Anota:
   - Total de eventos `ai_referral` este mes
   - Top 5 fuentes (`ai_source`): chatgpt, perplexity, ...
   - Top 5 páginas aterrizadas (`ai_path`)
   - Comparativa con mes anterior (% cambio)

### Paso 3 — Acciones derivadas (10 min)

Revisa la tabla mensual y decide:
- Queries con `appears = no` en TODAS las plataformas → candidatos a reforzar en FAQ, intro, descripciones
- Queries con `appears = sí` pero `is_cited = no` → falta extractabilidad
- Queries con `competitors_cited` consistente → ver qué hacen ellos que tú no

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