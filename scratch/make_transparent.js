const fs = require('fs');
const zlib = require('zlib');

function makeTransparent(inputPath, outputPath) {
  const buf = fs.readFileSync(inputPath);
  let pos = 8;
  let IHDR_data = null;
  let beforeChunks = buf.slice(0, 8);
  let idatBuffers = [];
  let afterChunks = [];
  let width = 0;
  let height = 0;
  let colorType = 0;

  // We read the PNG chunks
  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + length);
    const crc = buf.slice(pos + 8 + length, pos + 12 + length);
    
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      afterChunks.push({ type, data, crc });
      break;
    } else {
      // Keep other chunks if needed, or ignore
    }
    pos += 12 + length;
  }

  if (colorType !== 6) {
    throw new Error('Only RGBA (colorType 6) is supported for this script');
  }

  const idatBuf = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(idatBuf);

  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  
  // Reconstruct (unfilter) scanlines
  const reconstructed = Buffer.alloc(height * width * bytesPerPixel);
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * scanlineLength;
    const filterType = decompressed[rowStart];
    
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * bytesPerPixel;
      const filePixelStart = rowStart + 1 + x * bytesPerPixel;
      
      for (let c = 0; c < bytesPerPixel; c++) {
        const val = decompressed[filePixelStart + c];
        let reconVal = 0;
        
        if (filterType === 0) { // None
          reconVal = val;
        } else if (filterType === 1) { // Sub
          const prevReconVal = x > 0 ? reconstructed[pixelIndex - bytesPerPixel + c] : 0;
          reconVal = (val + prevReconVal) % 256;
        } else if (filterType === 2) { // Up
          const upReconVal = y > 0 ? reconstructed[pixelIndex - width * bytesPerPixel + c] : 0;
          reconVal = (val + upReconVal) % 256;
        } else if (filterType === 3) { // Average
          const prevReconVal = x > 0 ? reconstructed[pixelIndex - bytesPerPixel + c] : 0;
          const upReconVal = y > 0 ? reconstructed[pixelIndex - width * bytesPerPixel + c] : 0;
          reconVal = (val + Math.floor((prevReconVal + upReconVal) / 2)) % 256;
        } else if (filterType === 4) { // Paeth
          const left = x > 0 ? reconstructed[pixelIndex - bytesPerPixel + c] : 0;
          const up = y > 0 ? reconstructed[pixelIndex - width * bytesPerPixel + c] : 0;
          const upLeft = (x > 0 && y > 0) ? reconstructed[pixelIndex - (width + 1) * bytesPerPixel + c] : 0;
          
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          
          let paeth = 0;
          if (pa <= pb && pa <= pc) paeth = left;
          else if (pb <= pc) paeth = up;
          else paeth = upLeft;
          
          reconVal = (val + paeth) % 256;
        }
        
        reconstructed[pixelIndex + c] = reconVal;
      }
    }
  }

  // Modify pixels: convert white background to transparent
  // We want to handle anti-aliasing. If a pixel is close to white, we make it transparent.
  // Let's compute the distance to white (255, 255, 255).
  for (let i = 0; i < reconstructed.length; i += bytesPerPixel) {
    const r = reconstructed[i];
    const g = reconstructed[i + 1];
    const b = reconstructed[i + 2];
    const a = reconstructed[i + 3];

    // If it's pure white, make it transparent
    if (r === 255 && g === 255 && b === 255) {
      reconstructed[i + 3] = 0;
    } else {
      // Calculate how close it is to white.
      // If R, G, B are all very high (e.g. > 230), it is a background pixel or edge pixel.
      const threshold = 230;
      if (r > threshold && g > threshold && b > threshold) {
        // Linear fade: the closer to white, the more transparent.
        // Find the maximum component value
        const maxVal = Math.max(r, g, b);
        // Map [threshold, 255] to [255, 0] alpha
        const alphaFactor = (255 - maxVal) / (255 - threshold);
        reconstructed[i + 3] = Math.min(a, Math.round(255 * alphaFactor));
      }
    }
  }

  // Now, re-encode using Filter Type 0 (None) for simplicity
  const outputScanlineLength = 1 + width * bytesPerPixel;
  const outputData = Buffer.alloc(height * outputScanlineLength);
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * outputScanlineLength;
    outputData[rowStart] = 0; // Filter type 0: None
    
    const inputRowStart = y * width * bytesPerPixel;
    reconstructed.copy(outputData, rowStart + 1, inputRowStart, inputRowStart + width * bytesPerPixel);
  }

  const compressedIDAT = zlib.deflateSync(outputData);

  // Write the PNG file
  const outStream = fs.createWriteStream(outputPath);
  
  // Write signature
  outStream.write(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  
  // Write IHDR
  const ihdrBuf = Buffer.alloc(13);
  ihdrBuf.writeUInt32BE(width, 0);
  ihdrBuf.writeUInt32BE(height, 4);
  ihdrBuf[8] = 8; // bit depth
  ihdrBuf[9] = 6; // color type RGBA
  ihdrBuf[10] = 0; // compression
  ihdrBuf[11] = 0; // filter
  ihdrBuf[12] = 0; // interlace
  writeChunk(outStream, 'IHDR', ihdrBuf);

  // Write IDAT
  writeChunk(outStream, 'IDAT', compressedIDAT);

  // Write IEND
  writeChunk(outStream, 'IEND', Buffer.alloc(0));

  outStream.end();
  console.log(`Successfully wrote transparent PNG to ${outputPath}`);
}

function writeChunk(stream, type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  stream.write(lenBuf);
  
  const typeBuf = Buffer.from(type, 'ascii');
  stream.write(typeBuf);
  
  stream.write(data);
  
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  stream.write(crcBuf);
}

// Simple CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

makeTransparent('public/logo.png', 'public/logo_transparent.png');
