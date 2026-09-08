// ホーム画面に置かれたときのアイコンを作り直すための開発用スクリプト。
// 素材は scripts/icon.jpg (favicon.ico と同じ木のロゴ)。
//
//   node scripts/generate-app-icons.mjs
//
// 出力は 3 枚。
//   public/icons/icon-192.png  マニフェストの最小要件。Android のランチャー。
//   public/icons/icon-512.png  インストールダイアログとスプラッシュ。maskable も兼ねる。
//   src/app/apple-icon.png     iOS。マニフェストの icons を読まないので別に要る。
//
// 512 は素材 (400px) の 1.28 倍。点描の線なので少し眠くなるが、
// 実際に出る大きさ (192px 前後) では差が出ない。もっと大きい原画が
// 手に入ったら scripts/icon.jpg を差し替えてここを流し直す。
import sharp from "sharp";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "icon.jpg");
const ICONS = join(here, "../public/icons");

const targets = [
  [join(ICONS, "icon-192.png"), 192],
  [join(ICONS, "icon-512.png"), 512],
  [join(here, "../src/app/apple-icon.png"), 180],
];

mkdirSync(ICONS, { recursive: true });

for (const [out, size] of targets) {
  // 素材は塗り足しのない正方形なので、切らずにそのまま縮める。
  await sharp(SRC)
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
  console.log(`${out} (${size}x${size})`);
}
