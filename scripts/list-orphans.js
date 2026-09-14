#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GRANTS_DIR = 'content/grants';
const SITEMAP_FILE = 'public/sitemap.xml';

function listGrantFiles() {
    if (!fs.existsSync(GRANTS_DIR)) return [];
    return fs.readdirSync(GRANTS_DIR)
        .filter(f => f.endsWith('.md') && f !== '_index.md')
        .map(f => path.join(GRANTS_DIR, f));
}

function extractSlug(file, content) {
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) {
        const slugMatch = m[1].match(/^slug:\s*(.+)$/m);
        if (slugMatch) return slugMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    return path.basename(file, '.md');
}

function extractSitemapSlugs(sitemap) {
    const slugs = new Set();
    const locs = sitemap.match(/<loc>(.*?)<\/loc>/g) || [];
    for (const loc of locs) {
        const url = loc.replace(/<\/?loc>/g, '').trim();
        const m = url.replace(/\/$/, '').split('/').pop();
        if (m) slugs.add(m);
    }
    return { slugs, count: locs.length };
}

function main() {
    if (!fs.existsSync(SITEMAP_FILE)) {
        console.error(`ERROR: No existe ${SITEMAP_FILE}. Ejecuta npm run build primero.`);
        process.exit(1);
    }

    const sitemap = fs.readFileSync(SITEMAP_FILE, 'utf8');
    const { slugs: sitemapSlugs, count: sitemapCount } = extractSitemapSlugs(sitemap);

    const grants = [];
    for (const f of listGrantFiles()) {
        const content = fs.readFileSync(f, 'utf8');
        grants.push({ file: f, slug: extractSlug(f, content) });
    }

    const orphanGrants = grants.filter(g => !sitemapSlugs.has(g.slug));

    const grantSlugs = new Set(grants.map(g => g.slug));
    const staleUrls = [];
    for (const slug of sitemapSlugs) {
        if (slug.startsWith('subvenciones-') && !grantSlugs.has(slug)) {
            staleUrls.push(slug);
        }
    }

    console.log(`Grants en content: ${grants.length}`);
    console.log(`URLs en sitemap: ${sitemapCount}`);
    console.log('');

    if (orphanGrants.length > 0) {
        console.error(`ERROR: ${orphanGrants.length} grants sin pagina en el sitemap (huerfanos):`);
        orphanGrants.forEach(g => console.error(`  - ${g.file} (slug: ${g.slug})`));
        console.error('');
    }

    if (staleUrls.length > 0) {
        console.error(`ERROR: ${staleUrls.length} URLs de grants en el sitemap sin fichero de origen (residuos):`);
        staleUrls.forEach(s => console.error(`  - ${s}`));
        console.error('');
    }

    if (orphanGrants.length === 0 && staleUrls.length === 0) {
        console.log('OK: sin huerfanos. Todos los grants estan en el sitemap y viceversa.');
        process.exit(0);
    }

    process.exit(1);
}

main();
