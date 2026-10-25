const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const partsDir = path.join(root, 'assets', 'spritesheets', 'goku_action_grid_v1.base64');
const output = path.join(root, 'assets', 'spritesheets', 'goku_action_grid_v1.png');
const expectedSha = '753d0c19b8fd4eeca6fccff5c3422823e571ab2bf812c9f7a73c642943093a3f';

const parts = fs.readdirSync(partsDir)
  .filter(name => /^part\d+\.txt$/.test(name))
  .sort();
if (parts.length !== 10) throw new Error(`Spritesheet base64 incompleta: ${parts.length}/10 partes`);

const base64 = parts.map(name => fs.readFileSync(path.join(partsDir, name), 'utf8').trim()).join('');
const png = Buffer.from(base64, 'base64');
const signature = png.subarray(0, 8).toString('hex');
if (signature !== '89504e470d0a1a0a') throw new Error(`Assinatura PNG inválida: ${signature}`);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== 2048 || height !== 1024) throw new Error(`Dimensão inesperada: ${width}x${height}`);
const sha = crypto.createHash('sha256').update(png).digest('hex');
if (sha !== expectedSha) throw new Error(`SHA-256 inválido: ${sha}`);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, png);
console.log(`Goku grid materializado: ${width}x${height} (${png.length} bytes) sha256=${sha}`);
