const fs = require('fs');
const path = require('path');

function walk(d, files = []) {
    if (!fs.existsSync(d)) return files;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) walk(f, files);
        else if (e.name === 'index.html') files.push(f);
    }
    return files;
}

const files = walk('public');
const titles = new Set();
files.forEach(f => {
    const h = fs.readFileSync(f, 'utf8');
    const m = h.match(/<title>([^<]+)/);
    if (m) titles.add(m[1]);
});
[...titles].sort().forEach(t => console.log(t));
