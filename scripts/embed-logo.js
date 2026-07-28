const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'static', 'logo.png');
const svgPath = path.join(__dirname, '..', 'static', 'og-image.svg');

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const dataUri = `data:image/png;base64,${logoBase64}`;

let svg = fs.readFileSync(svgPath, 'utf8');
if (!svg.includes('__LOGO_DATA_URI__')) {
    console.log('Placeholder not found, logo already embedded. Skipping.');
    process.exit(0);
}

svg = svg.replace(/__LOGO_DATA_URI__/g, dataUri);
fs.writeFileSync(svgPath, svg, 'utf8');

console.log(`Embedded logo (${(logoBase64.length / 1024).toFixed(1)} KB base64) into og-image.svg`);
