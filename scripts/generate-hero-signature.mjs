// src/components/hero/signature.ts を作り直すための開発用スクリプト。
// ヒーローの読み込み中に 1 筆ずつ書かれる署名の、線そのものを吐き出す。
//
// 素材は単線フォント EMS Allure (scripts/fonts/EMSAllure.svg)。塗りの書体と違い
// 字形が「1 本の線」で定義されているので、stroke-dashoffset を動かすとペンの
// 運びがそのまま出る。輪郭を持つ書体(サイトの Alex Brush)ではこれができない。
//
//   node scripts/generate-hero-signature.mjs "You Only Live Once"
//
// EMS Allure: Sheldon B. Michaels 作 / SIL Open Font License。
// Allura (Rob Leuschke, TypeSETit) の派生で、SVG フォント化は Windell H. Oskay。
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FONT = join(here, "fonts/EMSAllure.svg");
const OUT = join(here, "../src/components/hero/signature.ts");
const TEXT = process.argv[2] ?? "You Only Live Once";
// em を 100 単位に正規化する。座標が短くなり、書き出したデータも軽くなる
const EM = 100;

function loadFont() {
  const src = readFileSync(FONT, "utf8");
  const upem = Number(src.match(/units-per-em="(\d+)"/)[1]);
  const glyphs = new Map();
  for (const [, attrs] of src.matchAll(/<glyph([^>]*)\/>/g)) {
    const unicode = attrs.match(/unicode="(.|&[a-z]+;)"/);
    if (!unicode) continue;
    const advance = attrs.match(/horiz-adv-x="([\d.]+)"/);
    const d = attrs.match(/ d="([^"]*)"/);
    const char =
      unicode[1] === "&amp;" ? "&" : unicode[1] === "&quot;" ? '"' : unicode[1];
    glyphs.set(char, {
      advance: advance ? Number(advance[1]) : 0,
      d: d ? d[1] : "",
    });
  }
  const missing = src.match(/<missing-glyph[^>]*horiz-adv-x="([\d.]+)"/);
  return {
    upem,
    glyphs,
    space: missing ? Number(missing[1]) : upem * 0.3,
  };
}

// このフォントのグリフは M/L だけのポリライン。折れ線の頂点として読み出す。
function toPolylines(d) {
  const lines = [];
  let current = null;
  for (const [, command, x, y] of d.matchAll(
    /([ML])\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g,
  )) {
    const point = [Number(x), Number(y)];
    if (command === "M") {
      current = [point];
      lines.push(current);
    } else {
      current.push(point);
    }
  }
  return lines;
}

const font = loadFont();
const scale = EM / font.upem;

// 文字を並べて、全部の折れ線をひとつの座標系へ流し込む
const strokes = [];
let pen = 0;
for (const char of TEXT) {
  const glyph = font.glyphs.get(char);
  if (!glyph) {
    pen += font.space;
    continue;
  }
  for (const line of toPolylines(glyph.d)) {
    strokes.push(line.map(([x, y]) => [(x + pen) * scale, y * scale]));
  }
  pen += glyph.advance;
}

// インクの実寸で囲む。フォントの em ボックスではなく、この一文の外接矩形にする
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const line of strokes) {
  for (const [x, y] of line) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

// SVG は y が下向き。ベースライン(フォント座標の y=0)の位置も控えておく
const round = (n) => Number(n.toFixed(1));
const width = round(maxX - minX);
const height = round(maxY - minY);
const baseline = round(maxY);

const out = strokes.map((line) => {
  const points = line.map(([x, y]) => [round(x - minX), round(maxY - y)]);
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  }
  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
    .join("");
  return { d, length: round(length) };
});

const total = round(out.reduce((sum, s) => sum + s.length, 0));

const file = `// 自動生成。手で書き換えず scripts/generate-hero-signature.mjs を実行すること。
//   node scripts/generate-hero-signature.mjs ${JSON.stringify(TEXT)}
//
// 字形は単線フォント EMS Allure から起こした折れ線。1 本ずつ順に引くと運筆になる。
// EMS Allure: Sheldon B. Michaels 作 / SIL Open Font License。
// Allura (Rob Leuschke, TypeSETit) の派生で、SVG フォント化は Windell H. Oskay。

/** 一筆分の線。length は d の道のり(SVG のユーザー単位) */
export type SignatureStroke = {
  readonly d: string;
  readonly length: number;
};

export const SIGNATURE = {
  text: ${JSON.stringify(TEXT)},
  /** インクの外接矩形。そのまま viewBox="0 0 width height" に使う */
  width: ${width},
  height: ${height},
  /** ベースラインの y。罫線に字を乗せる位置合わせに使う */
  baseline: ${baseline},
  /** 筆順どおりに並んだ線。ペンを上げるたびに次の要素へ移る */
  strokes: ${JSON.stringify(out)} as readonly SignatureStroke[],
  /** 全部の線の道のりの合計 */
  totalLength: ${total},
} as const;
`;

writeFileSync(OUT, file);
console.log(
  `${OUT} を更新: ${out.length} 筆 / 長さ ${total} / ${width}x${height}`,
);
