// public/water-normals.png を作り直すための開発用スクリプト。
// 継ぎ目なくタイルする水面法線マップを生成する。
// 格子の添字を周期 L で折り返した値ノイズを重ねるので、端が必ずつながる。
import sharp from "sharp";

const N = 512;
// [格子の周期, 振幅, シード]
const octaves = [
  [8, 0.5, 0],
  [16, 0.27, 17],
  [32, 0.15, 41],
  [64, 0.09, 73],
  [128, 0.05, 97],
];
// 法線の立ち上がり。小さいほど波が急になる。
// N のような大きな値にすると傾きがほぼ 0 になり、鏡のような水面になる
const flatness = 40;

const hash = (i, j, L, seed) => {
  const x = Math.sin(((i % L) + L) % L * 127.1 + (((j % L) + L) % L) * 311.7 + seed) * 43758.5453;
  return x - Math.floor(x);
};

const vnoise = (x, y, L, seed) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, L, seed);
  const b = hash(xi + 1, yi, L, seed);
  const c = hash(xi, yi + 1, L, seed);
  const d = hash(xi + 1, yi + 1, L, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// uv(0..1) の高さ場
const height = (u, v) => {
  let h = 0;
  for (const [L, amp, seed] of octaves) h += amp * vnoise(u * L, v * L, L, seed);
  return h;
};

const buf = Buffer.alloc(N * N * 3);
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    const u = i / N;
    const v = j / N;
    const e = 1 / N;
    const dx = (height(u + e, v) - height(u - e, v)) / (2 * e);
    const dy = (height(u, v + e) - height(u, v - e)) / (2 * e);
    let nx = -dx;
    let ny = -dy;
    let nz = flatness;
    const len = Math.hypot(nx, ny, nz);
    nx /= len;
    ny /= len;
    nz /= len;
    const o = (j * N + i) * 3;
    buf[o] = Math.round((nx * 0.5 + 0.5) * 255);
    buf[o + 1] = Math.round((ny * 0.5 + 0.5) * 255);
    buf[o + 2] = Math.round((nz * 0.5 + 0.5) * 255);
  }
}

await sharp(buf, { raw: { width: N, height: N, channels: 3 } })
  .png({ compressionLevel: 9 })
  .toFile("public/water-normals.png");
console.log("wrote public/water-normals.png");
