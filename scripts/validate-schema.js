#!/usr/bin/env node
/**
 * Validador de JSON-LD usando la especificación de schema.org.
 * Verifica que cada pagina tiene al menos un schema correcto.
 *
 * Uso: node scripts/validate-schema.js
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';
const errors = [];
const warnings = [];
const stats = {
    totalPages: 0,
    pagesWithSchema: 0,
    schemaTypes: {}
};

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (entry.name === 'index.html') files.push(full);
    });
    return files;
}

function extractSchemas(html) {
    const regex = /<script type=application\/ld\+json>([\s\S]*?)<\/script>/g;
    const matches = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
        matches.push(m[1]);
    }
    return matches;
}

function validateSchema(json, page) {
    try {
        const data = JSON.parse(json);

        // Handle @graph
        if (data['@graph']) {
            if (!Array.isArray(data['@graph'])) {
                errors.push(`${page}: @graph no es array`);
                return;
            }
            data['@graph'].forEach(item => validateType(item, page));
        } else {
            validateType(data, page);
        }
    } catch (e) {
        errors.push(`${page}: JSON invalido - ${e.message}`);
    }
}

function validateType(item, page) {
    const type = item['@type'];
    if (!type) {
        errors.push(`${page}: falta @type`);
        return;
    }

    stats.schemaTypes[type] = (stats.schemaTypes[type] || 0) + 1;

    // Reglas basicas segun tipo
    if (type === 'Article' || type === 'WebSite' || type === 'Organization' || type === 'CollectionPage') {
        // OK generico
    }

    if (type === 'Article') {
        if (!item.headline) errors.push(`${page}: Article sin headline`);
        if (!item.description) warnings.push(`${page}: Article sin description`);
        if (!item.mainEntityOfPage) warnings.push(`${page}: Article sin mainEntityOfPage`);
    }

    if (type === 'Organization') {
        if (!item.name) errors.push(`${page}: Organization sin name`);
        if (!item.url) warnings.push(`${page}: Organization sin url`);
    }

    if (type === 'WebSite') {
        if (!item.name) errors.push(`${page}: WebSite sin name`);
        if (!item.url) warnings.push(`${page}: WebSite sin url`);
    }

    if (type === 'BreadcrumbList') {
        if (!Array.isArray(item.itemListElement)) {
            errors.push(`${page}: BreadcrumbList sin itemListElement array`);
        } else {
            item.itemListElement.forEach((bc, i) => {
                if (bc.position !== i + 1) {
                    warnings.push(`${page}: BreadcrumbList item ${i} tiene position ${bc.position} (esperado ${i + 1})`);
                }
                if (!bc.name || !bc.item) {
                    errors.push(`${page}: BreadcrumbList item ${i} incompleto`);
                }
            });
        }
    }

    if (type === 'ItemList') {
        if (typeof item.numberOfItems !== 'number') {
            warnings.push(`${page}: ItemList sin numberOfItems`);
        }
        if (!Array.isArray(item.itemListElement)) {
            errors.push(`${page}: ItemList sin itemListElement array`);
        }
    }

    if (type === 'BreadcrumbList') {
        if (!Array.isArray(item.itemListElement)) {
            errors.push(`${page}: BreadcrumbList sin itemListElement array`);
        } else {
            item.itemListElement.forEach((bc, i) => {
                if (bc.position !== i + 1) {
                    warnings.push(`${page}: BreadcrumbList item ${i} tiene position ${bc.position} (esperado ${i + 1})`);
                }
                if (!bc.name || !bc.item) {
                    errors.push(`${page}: BreadcrumbList item ${i} incompleto`);
                }
            });
        }
    }

    if (type === 'Grant') {
        if (!item.name) errors.push(`${page}: Grant sin name`);
        if (!item.url) errors.push(`${page}: Grant sin url`);
    }

    if (type === 'SpeakableSpecification') {
        if (!Array.isArray(item.xpath)) {
            errors.push(`${page}: SpeakableSpecification sin xpath array`);
        }
    }

    if (type === 'WebSite') {
        if (!item.name) errors.push(`${page}: WebSite sin name`);
        if (!item.url) warnings.push(`${page}: WebSite sin url`);
    }

    if (type === 'WebPage') {
        if (!item.name) errors.push(`${page}: WebPage sin name`);
    }

    if (type === 'Person') {
        if (!item.name) errors.push(`${page}: Person sin name`);
        if (!item.url) warnings.push(`${page}: Person sin url (recomendado para E-E-A-T)`);
        if (!item.description) warnings.push(`${page}: Person sin description (recomendado para E-E-A-T)`);
        if (!item.jobTitle) warnings.push(`${page}: Person sin jobTitle (recomendado para E-E-A-T)`);
        if (!item.knowsAbout) warnings.push(`${page}: Person sin knowsAbout (recomendado para E-E-A-T)`);
    }

    if (type === 'Organization') {
        if (!item.name) errors.push(`${page}: Organization sin name`);
        if (!item.url) warnings.push(`${page}: Organization sin url`);
        if (!item.areaServed) warnings.push(`${page}: Organization sin areaServed (recomendado para AEO)`);
        if (!item.knowsAbout) warnings.push(`${page}: Organization sin knowsAbout (recomendado para AEO)`);
        if (!item.foundingDate) warnings.push(`${page}: Organization sin foundingDate (recomendado para E-E-A-T)`);
    }

    if (type === 'CollectionPage') {
        if (!item.name) warnings.push(`${page}: CollectionPage sin name`);
    }
}

function main() {
    console.log('Validando JSON-LD en', PUBLIC_DIR);
    console.log('');

    const files = walk(PUBLIC_DIR);
    stats.totalPages = files.length;

    files.forEach(file => {
        const html = fs.readFileSync(file, 'utf8');
        const schemas = extractSchemas(html);

        if (schemas.length > 0) {
            stats.pagesWithSchema++;
            schemas.forEach(json => validateSchema(json, file.replace(PUBLIC_DIR + '/', '')));
        }
    });

    console.log(`Paginas totales: ${stats.totalPages}`);
    console.log(`Paginas con schema: ${stats.pagesWithSchema}`);
    console.log(`Cobertura: ${((stats.pagesWithSchema / stats.totalPages) * 100).toFixed(1)}%`);
    console.log('');
    console.log('Tipos de schema encontrados:');
    Object.entries(stats.schemaTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log('');

    if (warnings.length > 0) {
        console.log(`Advertencias (${warnings.length}):`);
        warnings.forEach(w => console.log('  WARN:', w));
    }

    if (errors.length > 0) {
        console.log('');
        console.log(`ERRORES (${errors.length}):`);
        errors.forEach(e => console.log('  ERROR:', e));
        process.exit(1);
    }

    console.log('');
    console.log('OK: schemas validados correctamente');
}

main();