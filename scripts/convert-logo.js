const sharp = require('sharp');
const path = require('path');

(async () => {
    const input = path.join(__dirname, '..', 'static', 'logo_192x192.avif');
    const output = path.join(__dirname, '..', 'static', 'logo.png');

    await sharp(input)
        .png()
        .toFile(output);

    const meta = await sharp(output).metadata();
    console.log(`Converted logo: ${meta.width}x${meta.height} ${meta.format}`);
})();
