const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('public/index.html', 'utf8');
const grant = fs.readFileSync('public/subvenciones-alava-asociaciones-nominativas/index.html', 'utf8');

assert.match(home, /data-region=(?:"|)%C3%A1lava(?:"|)/);
assert.match(home, /data-beneficiario=(?:"|)asociaciones-y-ong(?:"|)/);
assert.match(home, /<span>Álava<\/span>/);
assert.match(home, /<span>Asociaciones y ong<\/span>/);
assert.doesNotMatch(home, /data-region="\d+"/);
assert.doesNotMatch(home, /data-beneficiario="\d+"/);
assert.match(grant, /<strong>Álava<\/strong>/);
assert.match(grant, /<strong>Asociaciones y ong<\/strong>/);

console.log('OK: categorías renderizadas como nombres');
