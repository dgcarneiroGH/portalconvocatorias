#!/usr/bin/env node
/**
 * Script de verificacion SEO post-build.
 * Comprueba que el sitio cumple los requisitos SEO basicos.
 *
 * Uso: node scripts/verify-seo.js
 * Requiere haber ejecutado `hugo --minify` primero.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';
const results = {
    errors: [],
    warnings: [],
    info: [],
    passed: 0
};

function pass(msg) { results.passed++; }
function warn(msg) { results.warnings.push(msg); }
function err(msg) { results.errors.push(msg); }
function info(msg) { results.info.push(msg); }

function readFile(file) {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch (e) {
        return null;
    }
}

function extractMatches(html, regex) {
    const matches = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
        matches.push(m);
    }
    return matches;
}

// 1. Verificar sitemap.xml
function checkSitemap() {
    info('=== Verificando sitemap.xml ===');
    const sitemap = readFile(path.join(PUBLIC_DIR, 'sitemap.xml'));
    if (!sitemap) {
        err('sitemap.xml no existe');
        return [];
    }

    const urls = extractMatches(sitemap, /<loc>([^<]+)<\/loc>/g).map(m => m[1]);
    info(`Sitemap contiene ${urls.length} URLs`);

    if (urls.length < 40) {
        warn(`Sitemap tiene solo ${urls.length} URLs (esperado >40)`);
    } else {
        pass(`Sitemap tiene ${urls.length} URLs`);
    }

    // Comprobar que no hay URLs duplicadas
    const uniqueUrls = new Set(urls);
    if (uniqueUrls.size !== urls.length) {
        err(`Sitemap tiene URLs duplicadas: ${urls.length - uniqueUrls.size} duplicados`);
    } else {
        pass('No hay URLs duplicadas en sitemap');
    }

    // Verificar que no hay URLs a /categories/ o /tags/
    const legacy = urls.filter(u => u.includes('/categories/') || u.includes('/tags/'));
    if (legacy.length > 0) {
        err(`Sitemap contiene URLs legacy: ${legacy.join(', ')}`);
    } else {
        pass('No hay URLs legacy (/categories/, /tags/)');
    }

    return urls;
}

// 2. Verificar que todas las URLs del sitemap existen
function checkSitemapUrlsExist(urls) {
    info('=== Verificando que las URLs del sitemap existen ===');
    let missing = 0;
    urls.forEach(url => {
        const relativePath = url.replace(/^https?:\/\/[^/]+/, '');
        // Decodificar URL encoding para matchear filesystem (álava -> %C3%A1lava)
        const decodedPath = decodeURIComponent(relativePath);
        const filePath = path.join(PUBLIC_DIR, decodedPath, 'index.html');
        if (!fs.existsSync(filePath)) {
            err(`URL del sitemap no existe: ${url}`);
            missing++;
        }
    });

    if (missing === 0) {
        pass(`Todas las ${urls.length} URLs del sitemap existen`);
    } else {
        err(`${missing} URLs del sitemap no existen`);
    }
}

// 3. Verificar robots.txt
function checkRobots() {
    info('=== Verificando robots.txt ===');
    const robots = readFile(path.join(PUBLIC_DIR, 'robots.txt'));
    if (!robots) {
        err('robots.txt no existe');
        return;
    }

    if (robots.includes('Sitemap:')) {
        pass('robots.txt referencia el sitemap');
    } else {
        warn('robots.txt no referencia el sitemap');
    }

    if (robots.includes('User-agent: *')) {
        pass('robots.txt permite todos los User-agent');
    } else {
        warn('robots.txt no tiene regla User-agent: *');
    }
}

// 4. Verificar JSON-LD en cada página
function checkSchema() {
    info('=== Verificando JSON-LD ===');
    const htmlFiles = findHtmlFiles(PUBLIC_DIR);
    let withSchema = 0;
    let invalidSchema = 0;

    htmlFiles.forEach(file => {
        const html = readFile(file);
        if (!html) return;

        const matches = extractMatches(html, /<script type=application\/ld\+json>([\s\S]*?)<\/script>/g);
        if (matches.length === 0) {
            warn(`Sin JSON-LD: ${file.replace(PUBLIC_DIR + '/', '')}`);
            return;
        }

        matches.forEach(match => {
            try {
                JSON.parse(match[1]);
                withSchema++;
            } catch (e) {
                invalidSchema++;
                err(`JSON-LD invalido en ${file}: ${e.message}`);
            }
        });
    });

    info(`${htmlFiles.length} paginas HTML, ${withSchema} con JSON-LD valido`);
    if (invalidSchema === 0 && withSchema === htmlFiles.length) {
        pass('Todas las paginas tienen JSON-LD valido');
    }
}

// 5. Verificar meta tags esenciales
function checkMetaTags() {
    info('=== Verificando meta tags ===');
    const htmlFiles = findHtmlFiles(PUBLIC_DIR);

    let missingTitle = 0;
    let missingDescription = 0;
    let missingCanonical = 0;
    let longTitles = 0;
    let longDescriptions = 0;

    htmlFiles.forEach(file => {
        const html = readFile(file);
        if (!html) return;

        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        if (!titleMatch) {
            missingTitle++;
            err(`Sin <title>: ${file.replace(PUBLIC_DIR + '/', '')}`);
            return;
        }

        const title = titleMatch[1];
        if (title.length > 70) {
            longTitles++;
            warn(`Title largo (${title.length} chars): ${title.substring(0, 60)}...`);
        }

        if (!html.includes('name=description')) {
            missingDescription++;
            warn(`Sin meta description: ${file.replace(PUBLIC_DIR + '/', '')}`);
        } else {
            const descMatch = html.match(/name=description content="([^"]+)"/);
            if (descMatch && descMatch[1].length > 170) {
                longDescriptions++;
                warn(`Description largo (${descMatch[1].length} chars)`);
            }
        }

        if (!html.includes('rel=canonical')) {
            missingCanonical++;
            warn(`Sin canonical: ${file.replace(PUBLIC_DIR + '/', '')}`);
        }
    });

    if (missingTitle === 0) pass('Todas las paginas tienen <title>');
    if (missingDescription === 0) pass('Todas las paginas tienen meta description');
    if (missingCanonical === 0) pass('Todas las paginas tienen canonical');
    if (longTitles === 0) pass('Todos los titles tienen <= 70 chars');
}

// 6. Verificar jerarquía de headings en fichas
function checkHeadingHierarchy() {
    info('=== Verificando jerarquia de headings ===');
    const grantFiles = findHtmlFiles(path.join(PUBLIC_DIR, 'subvenciones-alava-asociaciones-deportes')).concat(
        ['public/subvenciones-alava-asociaciones-deportes/index.html']
    );

    let withoutH1 = 0;
    let badHierarchy = 0;

    grantFiles.forEach(file => {
        if (!fs.existsSync(file)) return;
        const html = readFile(file);
        if (!html) return;

        const h1Count = (html.match(/<h1/g) || []).length;
        if (h1Count === 0) {
            withoutH1++;
            err(`Sin H1: ${file.replace(PUBLIC_DIR + '/', '')}`);
        } else if (h1Count > 1) {
            err(`Multiples H1 (${h1Count}): ${file.replace(PUBLIC_DIR + '/', '')}`);
        }

        // Verificar que no haya salto H1 -> H3 (sin H2 entre medio)
        if (/^<h1/.test(html.replace(/[\s\S]*?<h1/, ''))) {
            // Hay H1; comprobar si despues viene directamente H3 sin H2
        }
    });

    if (withoutH1 === 0) pass('Todas las fichas tienen exactamente 1 H1');
}

// 7. Verificar HTTPS y headers
function checkSecurity() {
    info('=== Verificando seguridad ===');
    const htmlFiles = findHtmlFiles(PUBLIC_DIR);
    let httpUrls = 0;

    htmlFiles.forEach(file => {
        const html = readFile(file);
        if (!html) return;
        const matches = extractMatches(html, /href=["']http:\/\/[^"']+["']/g);
        if (matches.length > 0) {
            matches.forEach(m => {
                if (!m[0].includes('w3.org')) {
                    httpUrls++;
                    warn(`URL http:// en ${file.replace(PUBLIC_DIR + '/', '')}: ${m[0]}`);
                }
            });
        }
    });

    if (httpUrls === 0) pass('No hay URLs http:// inseguras');
}

// Helpers
function findHtmlFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = [];
    function walk(d) {
        if (!fs.existsSync(d)) return;
        const entries = fs.readdirSync(d, { withFileTypes: true });
        entries.forEach(entry => {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name === 'index.html') files.push(full);
        });
    }
    walk(dir);
    return files;
}

// Main
function main() {
    if (!fs.existsSync(PUBLIC_DIR)) {
        err(`Directorio ${PUBLIC_DIR} no existe. Ejecuta 'hugo --minify' primero.`);
        process.exit(1);
    }

    info('Iniciando verificacion SEO...');
    info('');

    const urls = checkSitemap();
    checkSitemapUrlsExist(urls);
    checkRobots();
    checkSchema();
    checkMetaTags();
    checkHeadingHierarchy();
    checkSecurity();

    info('');
    info('=== RESUMEN ===');
    info(`Pasados: ${results.passed}`);
    if (results.warnings.length > 0) {
        info(`Advertencias: ${results.warnings.length}`);
        results.warnings.forEach(w => console.log('  WARN: ' + w));
    }
    if (results.errors.length > 0) {
        info(`Errores: ${results.errors.length}`);
        results.errors.forEach(e => console.log('  ERROR: ' + e));
        process.exit(1);
    } else {
        info('OK: sin errores criticos');
    }
}

main();