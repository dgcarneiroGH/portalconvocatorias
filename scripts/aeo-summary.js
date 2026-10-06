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

function latestFile() {
    const files = fs.readdirSync(DOCS_DIR)
        .filter(f => /^aeo-tracking-\d{4}-\d{2}\.csv$/.test(f))
        .sort();
    return files.length ? path.join(DOCS_DIR, files[files.length - 1]) : null;
}

function prevFile(file) {
    const m = file.match(/(\d{4})-(\d{2})\.csv$/);
    if (!m) return null;
    let y = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10) - 1;
    if (mo === 0) {
        mo = 12;
        y--;
    }
    const p = path.join(DOCS_DIR, `aeo-tracking-${y}-${String(mo).padStart(2, '0')}.csv`);
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

function aggregate(data) {
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
        if (!agg.platforms[platform]) agg.platforms[platform] = { total: 0, appears: 0, cited: 0 };
        agg.platforms[platform].total++;
        if (appears) agg.platforms[platform].appears++;
        if (cited) agg.platforms[platform].cited++;
        if (!agg.types[type]) agg.types[type] = { total: 0, appears: 0, cited: 0 };
        agg.types[type].total++;
        if (appears) agg.types[type].appears++;
        if (cited) agg.types[type].cited++;
        if (!agg.queries[query]) agg.queries[query] = { total: 0, appears: 0, cited: 0, platform, type: r.type || '' };
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
        if (r.our_url && !isEmpty(r.our_url)) agg.ourUrls.push(r.our_url);
    });
    return agg;
}

function pct(n, total) {
    return total ? ((n / total) * 100).toFixed(1) + '%' : '—';
}

function printReport(file, agg, prevAgg, prevFile) {
    const lines = [];
    lines.push(`=== Resumen AEO — ${file} ===`);
    lines.push(`Checks: ${agg.total}`);
    lines.push('');
    lines.push(`Aparición: ${agg.appears}/${agg.total} (${pct(agg.appears, agg.total)})`);
    lines.push(`Citación:  ${agg.cited}/${agg.total} (${pct(agg.cited, agg.total)})`);
    lines.push('');
    lines.push('Por plataforma:');
    Object.keys(agg.platforms).sort().forEach(p => {
        const a = agg.platforms[p];
        lines.push(`  ${p.padEnd(12)} aparece ${a.appears}/${a.total} | citado ${a.cited}/${a.total}`);
    });
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

function toJson(file, agg, prevAgg, prevFile) {
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
        console.error('No se encontró ningún docs/aeo-tracking-YYYY-MM.csv. Usa: node scripts/aeo-summary.js --file <ruta>');
        process.exit(1);
    }
    const { data } = load(file);
    const agg = aggregate(data);
    const pFile = prevFile(file);
    const prevAgg = pFile ? aggregate(load(pFile).data) : null;
    if (json) toJson(file, agg, prevAgg, pFile);
    else printReport(file, agg, prevAgg, pFile);
}

main();
