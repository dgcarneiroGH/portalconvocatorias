const fs = require('fs');
const path = require('path');
const PUBLIC = 'public';

function walk(d, files = []) {
    if (!fs.existsSync(d)) return files;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) walk(f, files);
        else if (e.name === 'index.html') files.push(f);
    }
    return files;
}

const files = walk(PUBLIC);
console.log('Total HTML pages:', files.length);

const titles = [];
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    const t = h.match(/<title>([^<]+)<\/title>/);
    if (t) titles.push({ len: t[1].length, t: t[1], p: f.replace(PUBLIC + '/', '') });
});
titles.sort((a, b) => b.len - a.len);
console.log('\nTop 5 longest titles:');
titles.slice(0, 5).forEach(x => console.log(' ', x.len, '|', x.t, '|', x.p));

let dupDesc = 0;
const dupFiles = [];
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    const matches = h.match(/<meta name=description/g) || [];
    if (matches.length > 1) {
        dupDesc++;
        dupFiles.push(f.replace(PUBLIC + '/', ''));
    }
});
console.log('\nPages with duplicate <meta name=description>:', dupDesc);
dupFiles.slice(0, 5).forEach(p => console.log(' ', p));

let noH1 = 0, multiH1 = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    const c = (h.match(/<h1/g) || []).length;
    if (c === 0) noH1++;
    else if (c > 1) multiH1++;
});
console.log('\nPages without H1:', noH1, '| Pages with multiple H1:', multiH1);

let noCanonical = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (!h.includes('rel=canonical')) noCanonical++;
});
console.log('Pages without canonical:', noCanonical);

const grantsPages = files.filter(f => /subvenciones-[^/]+\/index\.html$/.test(f.replace(/\\/g, '/')));
console.log('\nGrant pages count:', grantsPages.length);

let grantsWithVisibleDate = 0;
grantsPages.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/ltima\s+actualizaci[oó]n/i.test(h) && /<time\s+datetime=/.test(h)) grantsWithVisibleDate++;
});
console.log('Grant pages with visible date:', grantsWithVisibleDate);

let hasFAQSection = 0;
grantsPages.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/preguntas\s+frecuentes|FAQ|frequently asked/i.test(h)) hasFAQSection++;
});
console.log('Grant pages with FAQ section:', hasFAQSection);

let hasDefinitionBlock = 0;
grantsPages.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/qu[eé]\s+es\s+portal\s+de\s+convocatorias|qu[eé]\s+son\s+las\s+ayudas|grant-page-summary/i.test(h)) hasDefinitionBlock++;
});
console.log('Grant pages with definition/summary block:', hasDefinitionBlock);

let hasFAQSchema = 0;
grantsPages.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/"@type"\s*:\s*"FAQPage"/.test(h)) hasFAQSchema++;
});
console.log('Grant pages with FAQPage JSON-LD:', hasFAQSchema);

let hasItemList = 0;
const termPages = files.filter(f => /\/regiones\/|\/para\//.test(f.replace(/\\/g, '/')));
termPages.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/"@type"\s*:\s*"ItemList"/.test(h)) hasItemList++;
});
console.log('Taxonomy pages with ItemList schema:', hasItemList);

let hasBreadcrumb = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/"@type"\s*:\s*"BreadcrumbList"/.test(h)) hasBreadcrumb++;
});
console.log('Pages with BreadcrumbList schema:', hasBreadcrumb);

let hasSpeakable = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/"@type"\s*:\s*"SpeakableSpecification"/.test(h)) hasSpeakable++;
});
console.log('Pages with SpeakableSpecification:', hasSpeakable);

let grantPagesWithGrantItems = 0;
const grantFiles = files.filter(f => /subvenciones-[^/]+\/index\.html$/.test(f.replace(/\\/g, '/')));
grantFiles.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    const scripts = [...h.matchAll(/<script type=application\/ld\+json>([\s\S]*?)<\/script>/g)];
    let found = false;
    for (const m of scripts) {
        try {
            const data = JSON.parse(m[1]);
            const graph = data['@graph'] || [data];
            const itemList = graph.find(item => item['@type'] === 'ItemList');
            if (itemList && Array.isArray(itemList.itemListElement) &&
                itemList.itemListElement.some(el => el['@type'] === 'Grant')) {
                found = true;
                break;
            }
        } catch (e) {}
    }
    if (found) grantPagesWithGrantItems++;
});
console.log('Grant pages with Grant items in ItemList:', grantPagesWithGrantItems);

let orgEnriched = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (/"foundingDate"\s*:/.test(h) && /"areaServed"\s*:/.test(h) && /"knowsAbout"\s*:/.test(h)) orgEnriched++;
});
console.log('Pages with enriched Organization (foundingDate + areaServed + knowsAbout):', orgEnriched);

const fs2 = require('fs');
const llmsExists = fs2.existsSync('public/llms.txt');
console.log('llms.txt present:', llmsExists);

let faqPageExists = false;
try {
    const h = fs2.readFileSync('public/preguntas-frecuentes/index.html', 'utf8');
    faqPageExists = /"@type"\s*:\s*"FAQPage"/.test(h);
} catch (e) {}
console.log('/preguntas-frecuentes/ with FAQPage:', faqPageExists);

let httpUrls = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    const matches = [...h.matchAll(/href=["']http:\/\/[^"']+["']/g)];
    matches.forEach(m => {
        if (!m[0].includes('w3.org')) httpUrls++;
    });
});
console.log('\nInsecure http:// URLs:', httpUrls);

let noOgImage = 0;
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    if (!h.includes('property="og:image"')) noOgImage++;
});
console.log('Pages without og:image:', noOgImage);
