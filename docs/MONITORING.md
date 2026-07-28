# Monitoring y verificación SEO

Documento de referencia para el mantenimiento SEO continuo de portalconvocatorias.es.

## Scripts de verificación automatizada

Tras cada `hugo --minify`, ejecuta los siguientes scripts para validar el estado SEO del sitio:

```bash
# Validacion general (sitemaps, meta tags, jerarquia headings)
node scripts/verify-seo.js

# Validacion especifica de JSON-LD / schema
node scripts/validate-schema.js
```

Estos scripts comprueban:

- Sitemap.xml: URLs validas, sin duplicados, sin URLs rotas
- Robots.txt: presencia y referencias correctas
- JSON-LD: cobertura y validez en todas las paginas
- Meta tags: title, description, canonical en cada pagina
- Heading hierarchy: H1 unico, sin saltos H1 -> H3
- URLs inseguras: ninguna referencia a http://

## Google Search Console

Configuracion recomendada:

1. **Propiedad verificada** (prefijo URL o dominio).
2. **Sitemap enviado**: `https://portalconvocatorias.es/sitemap.xml`
3. **Alertas activas** (Configuracion > Notificaciones):
   - Problemas de cobertura nuevos
   - Acciones manuales
   - Bajada de CTR superior al 20%
4. **Revisiones periodicas**:
   - Semanal: consultas top, CTR, posicion media
   - Mensual: paginas excluidas, core web vitals

### URLs a monitorizar especialmente

- `/` (home) — trafico de marca
- `/grants/` — trafico de descubrimiento
- `/regiones/[region]/` — trafico SEO long-tail
- `/para/[beneficiario]/` — trafico SEO long-tail
- `/ayudas-[region]-[beneficiario]-[sector]/` — fichas de detalle

## Analitica web

### Opcion recomendada: Plausible Analytics (RGPD-friendly)

1. Crear cuenta en https://plausible.io
2. Anadir el dominio `portalconvocatorias.es`
3. En `config.toml`:
   ```toml
   [params]
     plausibleEnabled = true
     plausibleDomain = "portalconvocatorias.es"
   ```
4. Rebuild y redeploy.

### Alternativa: Google Analytics 4

Si prefieres GA4:
1. Crear propiedad GA4
2. Obtener ID de medicion (formato `G-XXXXXXXX`)
3. Anadir script en `layouts/partials/head.html` (no incluido por defecto)

## Performance / Core Web Vitals

Herramientas gratuitas para monitorizar:

- **PageSpeed Insights**: https://pagespeed.web.dev/
- **Chrome DevTools > Lighthouse** (auditoria local)
- **Search Console > Experiencia** (datos reales de usuarios)
- **WebPageTest**: https://www.webpagetest.org/

**Metas recomendadas**:

| Metrica | Valor |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Performance score (Lighthouse) | > 85 |
| Accessibility score | > 90 |
| SEO score | > 95 |

## Lighthouse CI (automatizado en GitHub)

Si usas GitHub, cada push ejecuta:

1. Build del sitio con Hugo
2. Auditoria Lighthouse contra 6 paginas representativas
3. Validacion SEO automatizada con nuestros scripts

Configuracion en `.github/workflows/lighthouse.yml`.

## Backups y rollback

- **Codigo**: Git, commits frecuentes, ramas por feature.
- **Build output**: Netlify mantiene historial de deploys (rollback en 1 click).
- **Contenido**: Los archivos `.md` de `content/grants/` son la fuente de verdad. Mantenerlos en Git.

## Checklist periodico

### Semanal
- [ ] Revisar Search Console: consultas top, CTR, posicion media
- [ ] Revisar logs de error en Netlify

### Mensual
- [ ] Ejecutar `node scripts/verify-seo.js` y `node scripts/validate-schema.js`
- [ ] Lighthouse audit en home y 3 fichas representativas
- [ ] Revisar paginas excluidas en Search Console
- [ ] Comprobar que las landings (`/regiones/`, `/para/`) tienen trafico
- [ ] Revisar backlink profile (ahrefs / Search Console)

### Trimestral
- [ ] Auditoria completa de contenidos: fichas con poco texto, fichas obsoletas
- [ ] Revisar keywords: ¿estan captando las landings el trafico esperado?
- [ ] Actualizar paginas legales (fechas, correos)
- [ ] Comprobar fuentes oficiales (enlaces rotos en `/fuentes/`)
- [ ] Analisis de competencia: ¿que publican otros portales?

### Anual
- [ ] Renovacion del certificado HTTPS (Cloudflare lo gestiona automaticamente)
- [ ] Auditoria de seguridad completa
- [ ] Revision de arquitectura: ¿se necesitan nuevas landings?
- [ ] Benchmark de posicion vs competencia

## Alertas recomendadas

Configurar alertas automaticas para:

1. **Search Console** (ya cubierto por notificaciones de Google)
2. **Netlify**: emails en cada deploy fallido
3. **Uptime**: usar servicio externo (UptimeRobot, Better Uptime) para alertas 24/7
4. **Certificado SSL**: renovacion automatica via Cloudflare

## Contactos y soporte

- Documentacion Hugo: https://gohugo.io/documentation/
- Documentacion Netlify: https://docs.netlify.com/
- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org/