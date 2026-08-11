// Wraps a 32x32 PNG into a minimal ICO file (PNG-in-ICO, supported since
// Windows Vista). Reads docs/screenshots/tmp/favicon-32.png and writes
// src/app/favicon.ico.
//
// Next.js requires the embedded PNG to be RGBA8 (it rejects palette/indexed
// and opaque RGB variants), so the source is decoded and re-encoded as RGBA
// with pngjs before embedding.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';

const src = resolve('docs/screenshots/tmp/favicon-32.png');
const dest = resolve('src/app/favicon.ico');

const source = readFileSync(src);
if (source.length === 0) {
  console.error(`Missing PNG source: ${src} — run the screenshot suite first.`);
  process.exit(1);
}

const decoded = PNG.sync.read(source);
const rgba = new PNG({ width: decoded.width, height: decoded.height });
decoded.data.copy(rgba.data);
const png = PNG.sync.write(rgba);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // width  (0 = 256, but 32 is explicit)
entry.writeUInt8(32, 1); // height
entry.writeUInt8(0, 2);  // palette colors
entry.writeUInt8(0, 3);  // reserved
entry.writeUInt16LE(1, 4);  // color planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8);  // image size
entry.writeUInt32LE(22, 12); // offset to image data

const ico = Buffer.concat([header, entry, png]);
writeFileSync(dest, ico);
console.log(`Wrote ${dest} (${ico.length} bytes)`);
