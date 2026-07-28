#!/usr/bin/env node
/**
 * Validador de sincronizacion data/sectores.yaml vs content/grants/*.md
 *
 * Lee todos los frontmatter de content/grants/*.md, extrae los valores
 * unicos de tag_seo, y comprueba que cada uno exista como clave en
 * data/sectores.yaml. Si falta alguno, sale con codigo 1.
 *
 * Uso: node scripts/validate-sectores.js
 */

const fs = require('fs');
const path = require('path');

const GRANTS_DIR = 'content/grants';
const SECTORES_FILE = 'data/sectores.yaml';
const EMPTY_TAG_REGEX = /^\s*$/;

function readFile(file) {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch (e) {
        return null;
    }
}

function listGrantFiles() {
    if (!fs.existsSync(GRANTS_DIR)) return [];
    return fs.readdirSync(GRANTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(GRANTS_DIR, f));
}

function extractTagSeo(frontmatter) {
    const lines = frontmatter.split(/\r?\n/);
    let inTagSeo = false;
    const values = [];
    for (const line of lines) {
        const tagMatch = line.match(/^tag_seo:\s*(.*)$/);
        if (tagMatch) {
            const v = tagMatch[1].trim();
            if (v === '' || v === '|' || v === '>') {
                inTagSeo = true;
                continue;
            }
            values.push(v.replace(/^["']|["']$/g, ''));
            inTagSeo = false;
            continue;
        }
        if (inTagSeo) {
            const listItem = line.match(/^\s*-\s*(.*)$/);
            if (listItem) {
                const v = listItem[1].trim().replace(/^["']|["']$/g, '');
                if (v) values.push(v);
            } else if (line.trim() && !line.match(/^\s*#/)) {
                inTagSeo = false;
            }
        }
    }
    return values;
}

function extractFrontmatter(content) {
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return m ? m[1] : '';
}

function parseSectoresYaml() {
    const content = readFile(SECTORES_FILE);
    if (!content) return null;
    const map = {};
    const lines = content.split('\n');
    for (const line of lines) {
        const m = line.match(/^  ([a-z0-9_]+):\s*"?([^"\n]+)"?\s*$/);
        if (m) {
            map[m[1]] = m[2].trim();
        }
    }
    return map;
}

function main() {
    const files = listGrantFiles();
    if (files.length === 0) {
        console.error(`No se encontraron .md en ${GRANTS_DIR}`);
        process.exit(1);
    }

    const usedTags = new Set();
    let orphanFiles = 0;
    for (const f of files) {
        const content = readFile(f);
        if (!content) continue;
        const fm = extractFrontmatter(content);
        if (fm.includes('_orphan: true')) {
            orphanFiles++;
            continue;
        }
        const tags = extractTagSeo(fm);
        tags.forEach(t => usedTags.add(t));
    }

    const yamlMap = parseSectoresYaml();
    if (!yamlMap) {
        console.error(`No se pudo leer ${SECTORES_FILE}`);
        process.exit(1);
    }

    const yamlKeys = new Set(Object.keys(yamlMap));
    const missing = [...usedTags].filter(t => !yamlKeys.has(t));
    const unused = [...yamlKeys].filter(k => !usedTags.has(k));

    console.log(`Grants procesados: ${files.length - orphanFiles} (${orphanFiles} orphans ignorados)`);
    console.log(`tag_seo unicos en contenido: ${usedTags.size}`);
    console.log(`Entradas en data/sectores.yaml: ${yamlKeys.size}`);
    console.log('');

    if (unused.length > 0) {
        console.log(`Aviso: ${unused.length} entradas del YAML no se usan en contenido:`);
        unused.forEach(k => console.log(`  - ${k}`));
        console.log('');
    }

    if (missing.length > 0) {
        console.error(`ERROR: ${missing.length} tag_seo del contenido faltan en data/sectores.yaml:`);
        missing.forEach(t => console.error(`  - ${t}`));
        console.error('');
        console.error(`Anade las entradas que faltan a ${SECTORES_FILE} con la etiqueta legible correspondiente.`);
        console.error(`Ejemplo:`);
        if (missing.length > 0) {
            const t = missing[0];
            console.error(`  ${t}: "${t.replace(/_/g, ' ')}"`);
        }
        process.exit(1);
    }

    console.log(`OK: data/sectores.yaml esta sincronizado con el contenido.`);
}

main();
