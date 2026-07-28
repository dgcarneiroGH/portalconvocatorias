# Monitorización AEO — portalconvocatorias.es

Sistema de seguimiento continuo para la visibilidad del portal en respuestas de IA (ChatGPT, Perplexity, Gemini, Claude, Copilot, etc.).

## Componentes

| Archivo | Para qué sirve |
|---|---|
| `docs/aeo-tracking-template.csv` | Plantilla de tracking mensual. 45 filas = 15 queries × 3 plataformas. Abrir en Excel/Google Sheets y rellenar. |
| `static/js/ai-referrals.js` | Snippet que detecta visitas desde plataformas de IA y las registra como evento custom en Plausible. Carga automático en producción. |
| `docs/aeo-monitorizacion.md` | Este documento. Plantillas de revisión mensual y trimestral. |

## Métricas tracked automáticamente

El snippet `ai-referrals.js` clasifica el `document.referrer` y emite un evento custom a Plausible:

- **Evento**: `AI Referral`
- **Props**:
  - `source`: `chatgpt` | `perplexity` | `claude` | `gemini` | `copilot` | `you` | `huggingface` | `mistral` | `phind` | `kagi_assistant` | `poe` | `duckassist` | `searchgpt`
  - `path`: ruta de la página visitada (`/ayudas-murcia-familia/`, etc.)
  - `fullReferrer`: URL completa del referrer

En Plausible, ve a **Custom Events → AI Referral** para ver el desglose por fuente y página aterrizada.

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

### Paso 2 — Métricas de Plausible (5 min)

1. Entra en Plausible → portalconvocatorias.es
2. Filtra por **Custom Event = AI Referral**
3. Anota:
   - Total de referrals AI este mes
   - Top 5 fuentes AI (chatgpt, perplexity, ...)
   - Top 5 páginas aterrizadas
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

### B. Refresh de contenido
- [ ] Actualizar estadísticas en home (nº total, cobertura, fecha) — se recalcula automáticamente, solo verificar que se ven
- [ ] Revisar `/metodologia/` y reflejar cualquier cambio en el pipeline
- [ ] Revisar `/preguntas-frecuentes/` y añadir nuevas preguntas si han surgido
- [ ] Confirmar que `data/author.yaml` refleja al responsable real

### C. Análisis de tendencias
- [ ] Comparar 3 meses de CSV: ¿suben/bajan las apariciones?
- [ ] Comparar referrals AI en Plausible: tendencia
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

| Plataforma | Bot | Notas |
|---|---|---|
| ChatGPT | `chatgpt`, `chat.openai.com` | Mayor audiencia generalista. Cita dominios concretos en sus respuestas. |
| Perplexity | `perplexity.ai` | Fuerte citación de fuentes. Visitas atribuibles altas. |
| Google AI Overviews / AI Mode | (sin referrer claro) | Difícil de atribuir; usar Search Console para queries con AI Overview |
| Gemini | `gemini.google.com` | Citas menos frecuentes que Perplexity pero crecientes. |
| Claude | `claude.ai` | Audiencia técnica/profesional. Pocas citaciones web, pero valiosas. |
| Microsoft Copilot | `copilot.microsoft.com`, `bing.com/chat` | Apoyado en Bing. Atribuible vía referrer. |
| You.com | `you.com` | Nicho técnico. Bajo tráfico pero especializado. |
| DuckAssist | `duckduckgo.com` | Citaciones puntuales, búsquedas privadas. |

## Cuándo escalar

Si después de 2 trimestres consecutivos:
- Las apariciones en AI **no suben** o **bajan** → considerar:
  1. Auditoría técnica profunda de nuevo
  2. Inversión en backlinks y menciones externas (fuera del alcance del sitio)
  3. Contenido editorial原创 que AI cite de forma natural (estudios, guías originales)

## Cuándo no invertir más

- Si el tráfico AI es < 1% del tráfico total y estable → priorizar SEO tradicional y tráfico orgánico
- Si los referrals AI convierten peor que Google orgánico → mantener AEO como segunda prioridad

---

## Historial

| Fecha | Acción |
|---|---|
| 2026-07-28 | Versión inicial del sistema de monitorización (Fase 4) |
