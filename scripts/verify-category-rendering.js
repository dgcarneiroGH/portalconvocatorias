const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('public/index.html', 'utf8');
const grant = fs.readFileSync('public/ayudas-alava-asociaciones-nominativas/index.html', 'utf8');
const content = fs.readFileSync('public/sobre-nosotros/index.html', 'utf8');

const stylesheetNames = html => [...html.matchAll(/href=(?:"|)[^\s>]*\/([^/.\s]+)(?:\.min)?\.[a-f0-9]+\.css/g)].map(match => match[1]);

assert.deepEqual(stylesheetNames(home), ['base', 'home']);
assert.deepEqual(stylesheetNames(grant), ['base', 'grant']);
assert.deepEqual(stylesheetNames(content), ['base', 'content']);

assert.match(home, /data-region=(?:"|)%C3%A1lava(?:"|)/);
assert.match(home, /data-beneficiario=(?:"|)asociaciones-y-ong(?:"|)/);
assert.match(home, /<span>Álava<\/span>/);
assert.match(home, /<span>Asociaciones y ong<\/span>/);
assert.doesNotMatch(home, /data-region="\d+"/);
assert.doesNotMatch(home, /data-beneficiario="\d+"/);
assert.match(grant, /<strong>Álava<\/strong>/);
assert.match(grant, /<strong>Asociaciones y ong<\/strong>/);

console.log('OK: categorías renderizadas como nombres');
