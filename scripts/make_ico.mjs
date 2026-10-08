import fs from 'fs';
import pngToIco from 'png-to-ico';

async function makeIcons() {
  console.log('Generating multi-resolution Windows .ico from public/logo.png...');
  const icoBuffer = await pngToIco('public/logo.png');
  fs.writeFileSync('build/icon.ico', icoBuffer);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  console.log('Successfully generated build/icon.ico and public/favicon.ico! Size:', icoBuffer.length, 'bytes');
}

makeIcons().catch((err) => {
  console.error('Error generating ICO:', err);
  process.exit(1);
});
