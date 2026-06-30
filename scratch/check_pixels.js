const fs = require('fs');
const zlib = require('zlib');

function parsePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('Not a PNG file');
  }

  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let idatBuffers = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + length);
    pos += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
      console.log(`Dimensions: ${width}x${height}, ColorType: ${colorType}`);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const idatBuf = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(idatBuf);

  // Each scanline is 1 byte filter type + width * bytesPerPixel
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const scanlineLength = 1 + width * bytesPerPixel;

  console.log(`Decompressed length: ${decompressed.length}, expected: ${height * scanlineLength}`);

  let transparentPixels = 0;
  let whitePixels = 0;
  let otherPixels = 0;

  for (let y = 0; y < height; y++) {
    const rowStart = y * scanlineLength;
    const filterType = decompressed[rowStart];
    // For simplicity, we don't fully unfilter to just check rough transparency, 
    // but we can unfilter or just count raw values if filter is 0.
    // Let's see what filter types are used.
  }
  
  // Let's print filter types
  const filters = {};
  for (let y = 0; y < height; y++) {
    const f = decompressed[y * scanlineLength];
    filters[f] = (filters[f] || 0) + 1;
  }
  console.log('Filter types used:', filters);
}

parsePNG('public/logo.png');
