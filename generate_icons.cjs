const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgCode = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb" rx="100"/>
  <path d="M128 256 l85 85 l171 -171" stroke="#ffffff" stroke-width="40" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, 'public');
  const buffer = Buffer.from(svgCode);

  await sharp(buffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(buffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(buffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  await sharp(buffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));

  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
