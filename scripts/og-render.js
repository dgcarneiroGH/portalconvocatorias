const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const root = path.join(__dirname, '..');
    const svgPath = path.join(root, 'static', 'og-image.svg');
    const outPath = path.join(root, 'static', 'og-image.png');

    const svg = fs.readFileSync(svgPath, 'utf8');

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; background: #1e1b4b; }
  body { width: 1200px; height: 630px; overflow: hidden; }
  svg { display: block; width: 1200px; height: 630px; }
</style>
</head>
<body>
${svg}
</body>
</html>`;

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);

    await page.screenshot({
        path: outPath,
        clip: { x: 0, y: 0, width: 1200, height: 630 },
        omitBackground: false,
    });

    await browser.close();

    const stat = fs.statSync(outPath);
    console.log(`og-image.png rendered: ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
})();
