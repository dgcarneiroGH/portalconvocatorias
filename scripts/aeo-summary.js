#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DOCS_DIR = 'docs';

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field);
            field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            field = '';
            if (row.some(v => v.trim() !== '')) rows.push(row);
            row = [];
        } else {
            field += c;
        }
    }
    row.push(field);
    if (row.some(v => v.trim() !== '')) rows.push(row);
    return rows;
}

function isYes(v) {
    const s = String(v || '').trim().toLowerCase();
    return s === 'si' || s === 'sí' || s === 'yes' || s === 'y' || s === 'true' || s === '1';
}

function isEmpty(v) {
    return String(v || '').trim() === '';
}

function rootDomain(v) {
    const s = String(v || '').trim();
    if (!s) return null;
    const m = s.match(/^https?:\/\/([^/?#;,\s]+)/i);
    let host = m ? m[1] : s.split(/[;,\s]+/)[0];
    host = host.toLowerCase();
    host = host.replace(/^www\./, '');
    if (!host.includes('.')) return null;
    return host;
}

function ourUrlPath(v) {
    const s = String(v || '').trim();
    if (!s) return null;
    const low = s.toLowerCase();
    if (low === 'no' || low === 'ninguno') return null;
    const m = s.match(/^https?:\/\/[^/]+(\/.*)?$/i);
    let p;
    if (m) {
        p = m[1] || '/';
    } else if (s.includes('/')) {
        p = s.slice(s.indexOf('/'));
    } else {
        p = '/';
    }
    p = p.split(/[?#]/)[0];
    return p.startsWith('/') ? p : '/' + p;
}

function loadSitemapPaths() {
    const p = path.join('public', 'sitemap.xml');
    if (!fs.existsSync(p)) return null;
    const xml = fs.readFileSync(p, 'utf8');
    const set = new Set();
    const re = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        const loc = m[1].trim();
        const pm = loc.match(/^https?:\/\/[^/]+(\/.*)$/i);
        set.add(pm ? pm[1] : '/');
    }
    return set;
}

function validateRows(data, sitemapPaths, prevAgg, hasWhere) {
    const warns = {
        ourUrlOutsideSitemap: [],
        selfCompetitor: [],
        badAppearsWhere: [],
        appearsWithoutUrl: [],
        badDomainFormat: [],
        newDomains: []
    };
    const validWhere = ['fuentes', 'respuesta', 'ambos'];
    const newDomains = new Set();
    data.forEach((r, i) => {
        const ref = `fila ${i + 2} (${r.query || '(sin query)'} / ${r.platform || '?'})`;
        const appears = isYes(r.appears);
        const where = hasWhere ? String(r.appears_where || '').trim().toLowerCase() : '';
        const comps = String(r.competitors_cited || '').toLowerCase();
        if (comps.includes('portalconvocatorias.es')) warns.selfCompetitor.push(ref);
        String(r.competitors_cited || '')
            .split(/[;\n]+/)
            .map(s => s.trim())
            .filter(s => s && s.toLowerCase() !== 'ninguno')
            .forEach(raw => {
                const d = rootDomain(raw);
                if (!d) {
                    warns.badDomainFormat.push(`${ref} (${raw})`);
                } else if (prevAgg && !prevAgg.domains[d]) {
                    newDomains.add(d);
                }
            });
        if (appears) {
            if (hasWhere && !validWhere.includes(where)) {
                warns.badAppearsWhere.push(`${ref} (valor: "${r.appears_where}")`);
            }
            const up = ourUrlPath(r.our_url);
            if (!up) {
                warns.appearsWithoutUrl.push(ref);
            } else if (sitemapPaths && !sitemapPaths.has(up)) {
                warns.ourUrlOutsideSitemap.push(`${ref} (${r.our_url})`);
            }
        } else if (hasWhere && where && where !== 'no') {
            warns.badAppearsWhere.push(`${ref} (valor: "${r.appears_where}")`);
        }
    });
    if (prevAgg) warns.newDomains = Array.from(newDomains).sort();
    return warns;
}

function latestFile() {
    const files = fs.readdirSync(DOCS_DIR)
        .filter(f => /^\d{4}_aeo_tracking\.csv$/.test(f))
        .sort();
    return files.length ? path.join(DOCS_DIR, files[files.length - 1]) : null;
}

function prevFile(file) {
    const m = file.match(/(\d{2})(\d{2})_aeo_tracking\.csv$/);
    if (!m) return null;
    let yy = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10) - 1;
    if (mo === 0) {
        mo = 12;
        yy--;
    }
    const p = path.join(DOCS_DIR, `${String(yy).padStart(2, '0')}${String(mo).padStart(2, '0')}_aeo_tracking.csv`);
    return fs.existsSync(p) ? p : null;
}

function load(file) {
    const text = fs.readFileSync(file, 'utf8');
    const rows = parseCSV(text);
    if (rows.length === 0) return { header: [], data: [] };
    const header = rows[0].map(h => h.trim().toLowerCase().replace(/^\uFEFF/, ''));
    const data = rows.slice(1).map(r => {
        const obj = {};
        header.forEach((h, i) => {
            obj[h] = r[i] !== undefined ? r[i].trim() : '';
        });
        return obj;
    });
    return { header, data };
}

function aggregate(data, hasPlatform) {
    const agg = {
        total: data.length,
        appears: 0,
        cited: 0,
        platforms: {},
        types: {},
        queries: {},
        domains: {},
        quality: {
            emptyAppears: 0,
            emptyCompetitors: 0,
            emptyCited: 0
        },
        longtail: { total: 0, appears: 0, cited: 0 },
        head: { total: 0, appears: 0, cited: 0 },
        ourUrls: []
    };
    data.forEach(r => {
        const platform = r.platform || 'desconocida';
        const type = r.type || 'sin-tipo';
        const query = r.query || '(sin query)';
        const appears = isYes(r.appears);
        const cited = isYes(r.is_cited);
        if (appears) agg.appears++;
        if (cited) agg.cited++;
        if (hasPlatform) {
            if (!agg.platforms[platform]) agg.platforms[platform] = { total: 0, appears: 0, cited: 0 };
            agg.platforms[platform].total++;
            if (appears) agg.platforms[platform].appears++;
            if (cited) agg.platforms[platform].cited++;
        }
        if (!agg.types[type]) agg.types[type] = { total: 0, appears: 0, cited: 0 };
        agg.types[type].total++;
        if (appears) agg.types[type].appears++;
        if (cited) agg.types[type].cited++;
        if (!agg.queries[query]) agg.queries[query] = { total: 0, appears: 0, cited: 0, platform: hasPlatform ? platform : '', type: r.type || '' };
        agg.queries[query].total++;
        if (appears) agg.queries[query].appears++;
        if (cited) agg.queries[query].cited++;
        const bucket = type === 'longtail' ? agg.longtail : agg.head;
        bucket.total++;
        if (appears) bucket.appears++;
        if (cited) bucket.cited++;
        String(r.competitors_cited || '')
            .split(/[;\n]+/)
            .map(rootDomain)
            .filter(Boolean)
            .forEach(d => {
                if (d === 'portalconvocatorias.es') return;
                agg.domains[d] = (agg.domains[d] || 0) + 1;
            });
        if (isEmpty(r.appears)) agg.quality.emptyAppears++;
        if (isEmpty(r.is_cited)) agg.quality.emptyCited++;
        if (isEmpty(r.competitors_cited)) agg.quality.emptyCompetitors++;
        const up = ourUrlPath(r.our_url);
        if (up) agg.ourUrls.push(up);
    });
    return agg;
}

function pct(n, total) {
    return total ? ((n / total) * 100).toFixed(1) + '%' : '—';
}

function printReport(file, agg, prevAgg, prevFile, warns, sitemapPaths) {
    const lines = [];
    lines.push(`=== Resumen AEO — ${file} ===`);
    lines.push(`Checks: ${agg.total}`);
    lines.push('');
    lines.push(`Aparición: ${agg.appears}/${agg.total} (${pct(agg.appears, agg.total)})`);
    lines.push(`Citación:  ${agg.cited}/${agg.total} (${pct(agg.cited, agg.total)})`);
    if (Object.keys(agg.platforms).length) {
        lines.push('');
        lines.push('Por plataforma:');
        Object.keys(agg.platforms).sort().forEach(p => {
            const a = agg.platforms[p];
            lines.push(`  ${p.padEnd(12)} aparece ${a.appears}/${a.total} | citado ${a.cited}/${a.total}`);
        });
    }
    lines.push('');
    lines.push('Por tipo de query:');
    Object.keys(agg.types).sort().forEach(t => {
        const a = agg.types[t];
        lines.push(`  ${t.padEnd(14)} aparece ${a.appears}/${a.total} | citado ${a.cited}/${a.total}`);
    });
    lines.push('');
    lines.push(`KPI head (type != longtail):        aparece ${agg.head.appears}/${agg.head.total} (${pct(agg.head.appears, agg.head.total)}) | citado ${agg.head.cited}`);
    lines.push(`KPI long-tail (type = longtail):    aparece ${agg.longtail.appears}/${agg.longtail.total} (${pct(agg.longtail.appears, agg.longtail.total)}) | citado ${agg.longtail.cited}`);
    lines.push('');
    const sortedQueries = Object.keys(agg.queries)
        .map(q => Object.assign({ query: q }, agg.queries[q]))
        .sort((a, b) => b.appears - a.appears || b.cited - a.cited || a.query.localeCompare(b.query));
    lines.push('Por query (mejor señal primero):');
    sortedQueries.forEach(q => {
        const signal = q.cited > 0 ? 'CITADO' : q.appears > 0 ? 'aparece' : '—';
        lines.push(`  [${signal.padEnd(7)}] ${q.query} (${q.total} checks, ${q.type})`);
    });
    lines.push('');
    const domains = Object.keys(agg.domains)
        .map(d => ({ d, n: agg.domains[d] }))
        .sort((a, b) => b.n - a.n);
    if (domains.length) {
        lines.push(`Top dominios competidores citados (${domains.length} dominios):`);
        domains.slice(0, 15).forEach((x, i) => {
            lines.push(`  ${(i + 1).toString().padStart(2)}. ${x.d} (${x.n})`);
        });
    } else {
        lines.push('Top dominios competidores citados: ninguno registrado');
    }
    lines.push('');
    lines.push('Calidad de datos:');
    lines.push(`  appears vacío: ${agg.quality.emptyAppears}`);
    lines.push(`  is_cited vacío: ${agg.quality.emptyCited}`);
    lines.push(`  competitors_cited vacío: ${agg.quality.emptyCompetitors}`);
    if (agg.ourUrls.length) {
        lines.push(`  our_url registrada en ${agg.ourUrls.length} filas: ${[...new Set(agg.ourUrls)].join(' ; ')}`);
    }
    lines.push('Validación cruzada:');
    if (!sitemapPaths) {
        lines.push('  sitemap no encontrado (public/sitemap.xml): check de our_url omitido');
    }
    lines.push(`  our_url fuera del sitemap: ${warns.ourUrlOutsideSitemap.length}${warns.ourUrlOutsideSitemap.length ? ' → ' + warns.ourUrlOutsideSitemap.slice(0, 10).join(' | ') : ''}`);
    lines.push(`  dominio propio en competitors_cited: ${warns.selfCompetitor.length}${warns.selfCompetitor.length ? ' → ' + warns.selfCompetitor.slice(0, 10).join(' | ') : ''}`);
    lines.push(`  appears_where fuera de vocabulario: ${warns.badAppearsWhere.length}${warns.badAppearsWhere.length ? ' → ' + warns.badAppearsWhere.slice(0, 10).join(' | ') : ''}`);
    lines.push(`  competitors_cited sin dominio válido: ${warns.badDomainFormat.length}${warns.badDomainFormat.length ? ' → ' + warns.badDomainFormat.slice(0, 10).join(' | ') : ''}`);
    if (warns.newDomains.length) {
        lines.push(`  dominios nuevos vs mes anterior: ${warns.newDomains.length} → ${warns.newDomains.slice(0, 10).join(' ; ')}${warns.newDomains.length > 10 ? ' …' : ''}`);
    }
    lines.push(`  appears=sí sin our_url: ${warns.appearsWithoutUrl.length}${warns.appearsWithoutUrl.length ? ' → ' + warns.appearsWithoutUrl.slice(0, 10).join(' | ') : ''}`);
    if (warns.ourUrlOutsideSitemap.length || warns.selfCompetitor.length || warns.badAppearsWhere.length || warns.appearsWithoutUrl.length || warns.badDomainFormat.length) {
        lines.push('  ⚠ Revisa estas filas antes de aceptar los totales como válidos.');
    }
    if (prevAgg && prevFile) {
        lines.push('');
        lines.push(`Comparativa mes anterior (${path.basename(prevFile)}):`);
        lines.push(`  apariciones: ${prevAgg.appears} → ${agg.appears} (${agg.appears - prevAgg.appears >= 0 ? '+' : ''}${agg.appears - prevAgg.appears})`);
        lines.push(`  citaciones:  ${prevAgg.cited} → ${agg.cited} (${agg.cited - prevAgg.cited >= 0 ? '+' : ''}${agg.cited - prevAgg.cited})`);
        lines.push(`  checks:      ${prevAgg.total} → ${agg.total}`);
        const prevQueries = prevAgg.queries;
        const gained = sortedQueries.filter(q => q.appears > 0 && (!prevQueries[q.query] || prevQueries[q.query].appears === 0));
        const lost = sortedQueries.filter(q => q.appears === 0 && prevQueries[q.query] && prevQueries[q.query].appears > 0);
        if (gained.length) lines.push(`  queries ganadas: ${gained.map(q => q.query).join(' ; ')}`);
        if (lost.length) lines.push(`  queries perdidas: ${lost.map(q => q.query).join(' ; ')}`);
        if (!gained.length && !lost.length) lines.push('  sin cambios por query');
    }
    console.log(lines.join('\n'));
}

function toJson(file, agg, prevAgg, prevFile, warns, sitemapPaths) {
    const out = {
        file,
        checks: agg.total,
        appears: agg.appears,
        cited: agg.cited,
        platforms: agg.platforms,
        types: agg.types,
        queries: agg.queries,
        longtail: agg.longtail,
        head: agg.head,
        topDomains: Object.keys(agg.domains)
            .map(d => ({ domain: d, mentions: agg.domains[d] }))
            .sort((a, b) => b.mentions - a.mentions)
            .slice(0, 15),
        quality: agg.quality,
        warnings: warns,
        sitemapChecked: !!sitemapPaths,
        previous: prevFile ? {
            file: path.basename(prevFile),
            appears: prevAgg.appears,
            cited: prevAgg.cited,
            checks: prevAgg.total
        } : null
    };
    console.log(JSON.stringify(out, null, 2));
}

function main() {
    const args = process.argv.slice(2);
    const json = args.includes('--json');
    let file = null;
    const fileIdx = args.indexOf('--file');
    if (fileIdx !== -1 && args[fileIdx + 1]) file = args[fileIdx + 1];
    if (!file) file = latestFile();
    if (!file || !fs.existsSync(file)) {
        console.error('No se encontró ningún docs/26MM_aeo_tracking.csv. Usa: node scripts/aeo-summary.js --file <ruta>');
        process.exit(1);
    }
    const { header, data } = load(file);
    const hasPlatform = header.includes('platform');
    const hasWhere = header.includes('appears_where');
    const agg = aggregate(data, hasPlatform);
    const pFile = prevFile(file);
    let prevAgg = null;
    if (pFile) {
        const prev = load(pFile);
        prevAgg = aggregate(prev.data, prev.header.includes('platform'));
    }
    const sitemapPaths = loadSitemapPaths();
    const warns = validateRows(data, sitemapPaths, prevAgg, hasWhere);
    if (json) toJson(file, agg, prevAgg, pFile, warns, sitemapPaths);
    else printReport(file, agg, prevAgg, pFile, warns, sitemapPaths);
}

main();
