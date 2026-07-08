// Generate a 640x360 Android TV banner (logo centered on solid branded bg).
// Pure Node, no deps. Source: assets/app-icon.png -> assets/banner.png
const fs = require('fs')
const zlib = require('zlib')

function readPNG(path) {
  const buf = fs.readFileSync(path)
  let off = 8, w, h, ct
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const channels = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 3
  const stride = w * channels
  const out = Buffer.alloc(h * stride)
  let p = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[p++]
    for (let x = 0; x < stride; x++) {
      const val = raw[p++]
      const a = x >= channels ? out[y * stride + x - channels] : 0
      const b = y > 0 ? out[(y - 1) * stride + x] : 0
      const c = (x >= channels && y > 0) ? out[(y - 1) * stride + x - channels] : 0
      let r
      switch (filter) {
        case 0: r = val; break
        case 1: r = val + a; break
        case 2: r = val + b; break
        case 3: r = val + ((a + b) >> 1); break
        case 4: { const pp = a + b - c; const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); r = val + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break }
        default: r = val
      }
      out[y * stride + x] = r & 0xff
    }
  }
  return { w, h, channels, data: out }
}

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function writePNG(path, w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  const stride = w * 3
  const raw = Buffer.alloc(h * (stride + 1))
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride) }
  const idat = zlib.deflateSync(raw)
  fs.writeFileSync(path, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]))
}

const src = readPNG('assets/app-icon.png')
const W = 640, H = 360
const out = Buffer.alloc(W * H * 3)
const bg = [11, 11, 9] // #0b0b09
for (let i = 0; i < W * H; i++) { out[i * 3] = bg[0]; out[i * 3 + 1] = bg[1]; out[i * 3 + 2] = bg[2] }
const scale = Math.min(W / src.w, H / src.h) * 0.82
const dw = Math.round(src.w * scale), dh = Math.round(src.h * scale)
const ox = Math.round((W - dw) / 2), oy = Math.round((H - dh) / 2)
for (let y = 0; y < dh; y++) {
  for (let x = 0; x < dw; x++) {
    const sx = Math.min(src.w - 1, Math.floor(x / scale))
    const sy = Math.min(src.h - 1, Math.floor(y / scale))
    const sp = (sy * src.w + sx) * src.channels
    const dp = ((oy + y) * W + (ox + x)) * 3
    out[dp] = src.data[sp]; out[dp + 1] = src.data[sp + 1]; out[dp + 2] = src.data[sp + 2]
  }
}
writePNG('assets/banner.png', W, H, out)
console.log('wrote assets/banner.png ' + W + 'x' + H)
