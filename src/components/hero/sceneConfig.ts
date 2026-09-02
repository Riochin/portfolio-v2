// 海面を y=0 に置き、カメラはその少し上から水平よりやや上を向く。
// rotation[0] を大きくすると水平線が下がり、空が広く見える。
export const CAMERA = {
  position: [0, 3, 12] as [number, number, number],
  rotation: [0.12, 0, 0] as [number, number, number],
  fov: 55,
} as const;

// マウス追従で視点を振る量(ラジアン)と追従の減衰係数。
// pitch は水平線が画面から出ない範囲に収める
export const POINTER_LOOK = {
  yaw: 0.45,
  pitch: 0.12,
  damping: 3,
} as const;

// 太陽の向き。海面の映り込みに使う
export const SUN = [0.3, 0.78, -0.5] as [number, number, number];

// mid は視線の高さ(=水平線)の色。ここを白っぽくすると水平線の霞になる。
// curve が小さいほど、低い仰角でも一気に top の青へ寄る。
export const DAY_SKY = {
  top: "#0247d6",
  mid: "#a9dcf6",
  bottom: "#8fd0f2",
  curve: 0.34,
} as const;

export type OceanPalette = {
  /** 手前の水の色 */
  near: string;
  /** 遠くの水の色 */
  far: string;
  /** 見込み角が浅いところに映る空の色 */
  sky: string;
  /** 水平線で溶け込む霞の色 */
  haze: string;
  sunColor: string;
  sunDir: readonly [number, number, number];
  /** 大きいほど太陽の映り込みが鋭くなる */
  sunPower: number;
  sunStrength: number;
  /** 波の起伏でつく明暗の強さ。大きいほど透明感が出る */
  clarity: number;
  /** 明るい部分に乗せる色 */
  shimmer: string;
};

export const DAY_OCEAN: OceanPalette = {
  near: "#2ad6e6",
  far: "#0a5cc6",
  sky: "#7fccf2",
  haze: "#a9dcf6",
  sunColor: "#fffdf0",
  sunDir: SUN,
  sunPower: 340,
  sunStrength: 0.5,
  clarity: 0.65,
  shimmer: "#5ff0e8",
} as const;

export const OCEAN = {
  /** 板の一辺。fadeFar より十分大きくして end を見せない */
  size: 2400,
  /** さざ波の細かさ。大きいほど波が細かい */
  ripple: 0.55,
  /** この距離から波を平らにし、霞へ溶かし始める */
  fadeNear: 60,
  fadeFar: 320,
  /** 静止画キャプチャ時に使う固定の位相 */
  stillTime: 12,
} as const;

// 雲の塊ひとつ分のパラメータ。CloudMass.tsx がこの値から
// 粒(ビルボード)の配置を決める。
export type CloudMass = {
  /** 塊の中心(ワールド座標) */
  position: readonly [number, number, number];
  /** 粒を撒く範囲の半径。x=幅, y=厚み, z=奥行き */
  bounds: readonly [number, number, number];
  /** 粒の数 */
  segments: number;
  /** 粒 1 つの基本サイズ */
  volume: number;
  /** 裾から肩へ絞る曲線。1 未満で根元がすぼまり、1 超で上のほうまで太い */
  taper: number;
  /** 肩(丸い頭が始まる高さ)の位置 0..1 */
  shoulder: number;
  /** 肩の太さ。裾を 1 とした比 */
  shoulderRadius: number;
  /** 高さ方向のもこもこした段の振幅と周期 */
  bump: number;
  bumpFreq: number;
  /** 円周方向のこぶの振幅・数・高さによるねじれ */
  lump: number;
  lumpFreq: number;
  lumpTwist: number;
  /** 高さに応じた横ずれ */
  lean: number;
  /** 1 より大きいと下部に粒が密集する */
  stack: number;
  /** 粒の高さ方向のばらつき */
  jitter: number;
  /** 奥行き方向の潰し */
  depth: number;
  opacity: number;
  /** 高さ方向に何段の色帯へ分割するか。これで陰影をつける */
  bands: number;
  /** 上側(日の当たる側)の色 */
  colorTop: string;
  /** 下側(影)の色 */
  colorBottom: string;
  seed: number;
  speed: number;
  growth: number;
  fade: number;
};

// 平たい雲を高度をそろえて奥へ並べる。遠いものほど水平線に近づき、
// 幅広く薄く見えるので、それだけで奥へ流れていく遠近感が出る。
const flat = (
  seed: number,
  position: readonly [number, number, number],
  bounds: readonly [number, number, number],
  overrides: Partial<CloudMass> = {},
): CloudMass => ({
  position,
  bounds,
  segments: 70,
  volume: 4,
  taper: 1.4,
  shoulder: 0.5,
  shoulderRadius: 0.92,
  bump: 0.05,
  bumpFreq: 5,
  lump: 0.3,
  lumpFreq: 5,
  lumpTwist: 4,
  lean: 0,
  stack: 1,
  jitter: 0.18,
  depth: 1,
  opacity: 0.44,
  bands: 2,
  colorTop: "#ffffff",
  colorBottom: "#dcebf7",
  seed,
  speed: 0.05,
  growth: 0.8,
  // 近すぎる粒だけを薄くする drei の仕様。雲は常に遠いので効かせない
  fade: 25,
  ...overrides,
});

export const CLOUD_LAYER: readonly CloudMass[] = [
  // 手前(z が小さい)ほど大きく厚く、奥ほど小さく薄くして遠近感を作る。
  // 形が揃うと並んだ判子に見えるので、taper / shoulderRadius / lump を
  // 塊ごとに散らして輪郭を変えている。
  flat(11, [-48, 30, -58], [20, 3.6, 12], {
    volume: 2.4,
    segments: 110,
    opacity: 0.6,
    taper: 1.1,
    shoulderRadius: 0.78,
    lump: 0.36,
    lumpFreq: 4,
    jitter: 0.3,
  }),
  flat(29, [58, 27, -78], [18, 2.8, 11], {
    volume: 2.4,
    segments: 95,
    opacity: 0.55,
    taper: 1.7,
    shoulderRadius: 0.9,
    lump: 0.24,
    lumpFreq: 7,
    depth: 0.8,
  }),
  flat(47, [-18, 26, -112], [22, 2.4, 12], {
    volume: 2.6,
    segments: 90,
    opacity: 0.52,
    taper: 1.3,
    shoulderRadius: 0.84,
    lump: 0.42,
    lumpFreq: 3,
    jitter: 0.24,
  }),
  flat(67, [-98, 24, -150], [19, 2, 12], {
    volume: 2.8,
    segments: 75,
    opacity: 0.5,
    taper: 2,
    shoulderRadius: 0.95,
    lump: 0.2,
    lumpFreq: 6,
  }),
  flat(83, [46, 23, -188], [23, 1.8, 12], {
    volume: 3,
    segments: 75,
    opacity: 0.48,
    taper: 1.2,
    shoulderRadius: 0.8,
    lump: 0.34,
    lumpFreq: 5,
    depth: 1.2,
  }),
  flat(101, [142, 22, -238], [25, 1.5, 14], {
    volume: 3.2,
    segments: 70,
    opacity: 0.46,
    taper: 1.6,
    shoulderRadius: 0.92,
    lump: 0.26,
    lumpFreq: 8,
  }),
  flat(127, [-162, 21, -290], [27, 1.3, 14], {
    volume: 3.4,
    segments: 65,
    opacity: 0.44,
    taper: 1,
    shoulderRadius: 0.76,
    lump: 0.4,
    lumpFreq: 4,
    jitter: 0.28,
  }),
  flat(149, [-42, 20, -350], [29, 1.2, 14], {
    volume: 3.6,
    segments: 60,
    opacity: 0.42,
    taper: 1.8,
    shoulderRadius: 0.94,
    lump: 0.22,
    lumpFreq: 6,
  }),
  flat(173, [112, 19, -420], [31, 1, 16], {
    volume: 3.8,
    segments: 55,
    opacity: 0.4,
    taper: 1.3,
    shoulderRadius: 0.86,
    lump: 0.3,
    lumpFreq: 5,
  }),
  flat(197, [-258, 19, -500], [33, 0.9, 16], {
    volume: 4,
    segments: 50,
    opacity: 0.38,
    taper: 1.5,
    shoulderRadius: 0.9,
    lump: 0.28,
    lumpFreq: 7,
  }),
  flat(223, [204, 18, -580], [35, 0.8, 16], {
    volume: 4.4,
    segments: 45,
    opacity: 0.34,
    taper: 1.2,
    shoulderRadius: 0.82,
    lump: 0.32,
    lumpFreq: 4,
  }),
  // 水平線に張りつく雲列。空の霞と同化させて奥行きの底にする
  flat(251, [-60, 18, -680], [64, 0.7, 20], {
    volume: 5.4,
    segments: 45,
    opacity: 0.28,
    taper: 1.8,
    shoulderRadius: 0.96,
    lump: 0.18,
  }),
];

// instancedMesh の上限。全塊の segments 合計を超えないと粒が欠ける
export const CLOUD_LIMIT = 900;

export const STARS = {
  // 山や天の川より外側に置く。近いと星が山の手前に描かれてしまう
  radius: 400,
  depth: 200,
  // 遠くへ置いたぶん、数と粒の大きさで見た目の密度を戻す
  count: 22000,
  factor: 18,
  saturation: 0.7,
  fade: true,
  speed: 0.6,
} as const;

export const NIGHT_SKY = {
  top: "#0a0a1e",
  mid: "#141a33",
  bottom: "#05060d",
} as const;

export const NIGHT_BG = "#05060d";

// 水平線の上に横たわるように寝かせる
export const MILKY_WAY = {
  position: [44, 136, -500] as [number, number, number],
  rotation: [0.15, -0.1, 0.85] as [number, number, number],
  size: [1060, 300] as [number, number],
} as const;

// 夜の下辺に置く山の稜線。板 1 枚で 1 つの尾根を描き、
// 近い尾根ほど画面で高く・暗くなるよう並べると奥行きが出る。
export type MountainRidge = {
  z: number;
  /** 谷の高さ(ワールド y) */
  base: number;
  /** 谷から峰までの高さ */
  height: number;
  /** 稜線の細かさ。小さいほど尾根が長い */
  scale: number;
  color: string;
  seed: number;
};

export const MOUNTAINS = {
  /** 視点を振っても端が見えない幅・高さ */
  width: 1800,
  tall: 600,
  centerY: -260,
  ridges: [
    { z: -320, base: -14, height: 22, scale: 0.017, color: "#131c3a", seed: 3 },
    { z: -230, base: -18, height: 20, scale: 0.024, color: "#0b1024", seed: 17 },
    { z: -160, base: -22, height: 17, scale: 0.034, color: "#03040c", seed: 29 },
  ] as readonly MountainRidge[],
} as const;

// レイマーチングで描く雲の層。ポリゴンではなく密度関数として定義する。
// VolumeClouds.tsx がピクセルごとに視線を進めながら積分する。
export const VOLUME_CLOUDS = {
  /** 雲の層の下端と上端(ワールド y) */
  bottom: 420,
  top: 600,
  /** 大きいほど空が雲で埋まる 0..1 */
  coverage: 0.3,
  /** 雲の濃さ */
  density: 1.1,
  /** 視線方向の積分ステップ数。増やすほど綺麗だが重い */
  steps: 44,
  /** 太陽方向へのステップ数。陰影の精度 */
  lightSteps: 4,
  /** 1 ステップの上限。水平に近いレイのちらつきを抑える */
  maxStep: 30,
  /** 大きな塊のスケール。小さいほど雲が大きい */
  scale: 0.0024,
  /** 縁を削る細かいノイズのスケール */
  detailScale: 0.009,
  /** 縁を削る強さ。上げすぎると雲がちぎれて粒々になる */
  erode: 0.22,
  /** 積分を打ち切る距離。水平に近いレイが無限に伸びるのを防ぐ */
  maxDistance: 9000,
  /** この距離に向けて空の霞へ溶かす */
  fadeDistance: 5000,
  /** 雲が流れる向きと速さ */
  wind: [1.6, 0, 0.6] as [number, number, number],
  sunColor: "#fffaf0",
  shadowColor: "#93b0cd",
  haze: "#bcdcf2",
  /** 視線方向を得るためだけの球の半径 */
  domeRadius: 600,
  /** 静止画キャプチャ時に使う固定の位相 */
  stillTime: 40,
} as const;
