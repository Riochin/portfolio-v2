export const CAMERA = {
  position: [0, 0, 12] as [number, number, number],
  rotation: [0.6, 0, 0] as [number, number, number],
  fov: 55,
} as const;

export const DAY_SKY = {
  top: "#0d6cc4",
  mid: "#3f9be0",
  bottom: "#8ec6ea",
} as const;

// 積乱雲を構成する塊ひとつ分のパラメータ。
// Cumulonimbus.tsx がこの値から粒(ビルボード)の配置を決める。
export type CloudMass = {
  /** 塊の中心(ワールド座標) */
  position: readonly [number, number, number];
  /** 粒を撒く範囲の半径。x=太さ, y=高さ, z=奥行き */
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
  /** もこもこした段の振幅と周期 */
  bump: number;
  bumpFreq: number;
  /** 高さに応じた横ずれ(雲の傾き) */
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
  /** 雲頂側(日の当たる側)の色 */
  colorTop: string;
  /** 雲底側(影)の色 */
  colorBottom: string;
  seed: number;
  speed: number;
  growth: number;
  fade: number;
};

export const CUMULONIMBUS: readonly CloudMass[] = [
  // 本体。裾が広く上へ絞れる塔。これ 1 つで入道雲のシルエットを作る
  {
    position: [-1, 22, -34],
    bounds: [16, 20, 7],
    segments: 300,
    volume: 4.5,
    taper: 1.15,
    shoulder: 0.68,
    shoulderRadius: 0.46,
    bump: 0.06,
    bumpFreq: 7,
    lean: 0.05,
    stack: 1.1,
    jitter: 0.03,
    depth: 0.85,
    opacity: 1,
    bands: 5,
    colorTop: "#ffffff",
    colorBottom: "#cfe0f0",
    seed: 11,
    speed: 0.07,
    growth: 1.2,
    fade: 80,
  },
  // 左裾。本体の根元から張り出す塊
  {
    position: [-10, 8, -33],
    bounds: [9, 5, 6],
    segments: 40,
    volume: 4.2,
    taper: 1.2,
    shoulder: 0.45,
    shoulderRadius: 0.7,
    bump: 0.05,
    bumpFreq: 5,
    lean: -0.4,
    stack: 1,
    jitter: 0.1,
    depth: 0.8,
    opacity: 1,
    bands: 4,
    colorTop: "#fbfdff",
    colorBottom: "#cadcee",
    seed: 29,
    speed: 0.06,
    growth: 1,
    fade: 80,
  },
  // 右裾
  {
    position: [10, 7, -33],
    bounds: [9, 5, 6],
    segments: 42,
    volume: 4.3,
    taper: 1.2,
    shoulder: 0.45,
    shoulderRadius: 0.72,
    bump: 0.05,
    bumpFreq: 6,
    lean: 0.4,
    stack: 1,
    jitter: 0.1,
    depth: 0.8,
    opacity: 1,
    bands: 4,
    colorTop: "#fbfdff",
    colorBottom: "#c8daed",
    seed: 47,
    speed: 0.06,
    growth: 1,
    fade: 80,
  },
  // 遠景の雲列。青みを混ぜて奥行きを出す
  {
    position: [0, 6, -60],
    bounds: [34, 3, 6],
    segments: 40,
    volume: 5,
    taper: 1.6,
    shoulder: 0.4,
    shoulderRadius: 0.85,
    bump: 0.03,
    bumpFreq: 3,
    lean: 0,
    stack: 0.8,
    jitter: 0.15,
    depth: 0.5,
    opacity: 0.8,
    bands: 3,
    colorTop: "#e6f1fa",
    colorBottom: "#c9dcee",
    seed: 83,
    speed: 0.04,
    growth: 0.8,
    fade: 120,
  },
] as const;

// instancedMesh の上限。全塊の segments 合計を超えないと粒が欠ける
export const CLOUD_LIMIT = 500;

export const STARS = {
  radius: 60,
  depth: 50,
  count: 14000,
  factor: 5,
  saturation: 0.7,
  fade: true,
  speed: 0.6,
} as const;

export const NIGHT_SKY = {
  top: "#101024",
  mid: "#0b0b1a",
  bottom: "#07070f",
} as const;

export const NIGHT_BG = "#07070f";

// マウス追従で視点を振る量(ラジアン)と追従の減衰係数
export const POINTER_LOOK = {
  yaw: 0.45,
  pitch: 0.2,
  damping: 3,
} as const;
