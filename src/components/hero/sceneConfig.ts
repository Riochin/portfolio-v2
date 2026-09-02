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

export const NIGHT_OCEAN: OceanPalette = {
  near: "#0d2036",
  far: "#050c18",
  sky: "#16203c",
  haze: "#0a1020",
  sunColor: "#c8d6ff",
  sunDir: SUN,
  sunPower: 300,
  sunStrength: 0.9,
  clarity: 0.25,
  shimmer: "#2a4a80",
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
  shoulder: 0.58,
  shoulderRadius: 0.48,
  bump: 0.05,
  bumpFreq: 5,
  lump: 0.26,
  lumpFreq: 6,
  lumpTwist: 4,
  lean: 0,
  stack: 1,
  jitter: 0.18,
  depth: 1,
  opacity: 0.92,
  bands: 3,
  colorTop: "#ffffff",
  colorBottom: "#c3d6e8",
  seed,
  speed: 0.05,
  growth: 0.8,
  // 近すぎる粒だけを薄くする drei の仕様。雲は常に遠いので効かせない
  fade: 25,
  ...overrides,
});

export const CLOUD_LAYER: readonly CloudMass[] = [
  // 写真のように水平線沿いへ帯として集める。高度をそろえて z を散らすと
  // 遠いものほど自然に水平線へ近づく。
  // shoulderRadius を下げて上を丸め、平たい筋ではなく積雲の頭にする。
  flat(11, [-120, 24, -150], [20, 6, 12], { volume: 3, segments: 120 }),
  flat(29, [-36, 22, -170], [16, 5, 11], { volume: 2.8, segments: 105 }),
  flat(47, [48, 25, -185], [19, 6, 12], { volume: 3, segments: 115 }),
  flat(67, [150, 23, -205], [21, 5.5, 12], { volume: 3.2, segments: 110 }),
  flat(83, [-215, 23, -240], [23, 5, 13], { volume: 3.4, segments: 105 }),
  flat(101, [-70, 21, -270], [22, 4.5, 13], { volume: 3.4, segments: 95 }),
  flat(127, [70, 22, -300], [24, 4.5, 14], { volume: 3.6, segments: 95 }),
  flat(149, [235, 21, -330], [26, 4, 14], { volume: 3.8, segments: 90 }),
  flat(173, [-290, 20, -370], [28, 3.5, 14], { volume: 4, segments: 85 }),
  flat(197, [-30, 20, -410], [30, 3, 15], { volume: 4.2, segments: 80 }),
  flat(223, [140, 19, -450], [32, 2.8, 15], { volume: 4.4, segments: 75 }),
  flat(251, [320, 19, -500], [34, 2.5, 16], { volume: 4.6, segments: 70 }),
  // 水平線に張りつく雲列。空の霞と同化させて奥行きの底にする
  flat(281, [-60, 18, -580], [60, 2, 18], {
    volume: 5.4,
    segments: 60,
    opacity: 0.55,
    shoulderRadius: 0.8,
  }),
];

// instancedMesh の上限。全塊の segments 合計を超えないと粒が欠ける
export const CLOUD_LIMIT = 1300;

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
