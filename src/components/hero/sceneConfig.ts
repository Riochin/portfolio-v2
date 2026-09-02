// 海面を y=0 に置き、カメラはその少し上から水平よりやや上を向く。
// rotation[0] を大きくすると水平線が下がり、空が広く見える。
export const CAMERA = {
  position: [0, 3, 12] as [number, number, number],
  rotation: [0.055, 0, 0] as [number, number, number],
  fov: 55,
  // 水面の反射は遠方まで空を映すので、far を伸ばして空の球を収める
  near: 1,
  far: 40000,
} as const;

/** 空の球の半径。水面の反射が届く範囲を覆う大きさが要る */
export const SKY_RADIUS = 12000;

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
  top: "#1f8fcf",
  mid: "#cbeaf3",
  bottom: "#a8ddee",
  curve: 0.5,
} as const;

export type OceanPalette = {
  /** 水そのものの色。反射とフレネルで混ざる */
  water: string;
  /** 水面で反射する光の色 */
  sunColor: string;
  /** 波の歪みの強さ。大きいほど反射が乱れる */
  distortion: number;
  /** 法線マップの繰り返し。小さいほど波ひとつが大きい */
  waveSize: number;
  /** 波が進む速さ */
  speed: number;
  /** 反射側に足される下駄。上げると水面が明るく浮く */
  ambient: number;
  /** 鏡像の強さ */
  reflectStrength: number;
  /** 拡散光の強さ。上げるほど水面が白っぽくなる */
  diffuse: number;
  /** 視線が浅いときに残す水の色の割合 */
  scatterFloor: number;
};

export const DAY_OCEAN: OceanPalette = {
  water: "#1187b8",
  sunColor: "#fff6e0",
  distortion: 2.4,
  waveSize: 5,
  speed: 0.32,
  ambient: 0.04,
  reflectStrength: 0.55,
  diffuse: 0.06,
  scatterFloor: 0.75,
} as const;

export const NIGHT_OCEAN: OceanPalette = {
  water: "#04101f",
  sunColor: "#9fb4e8",
  distortion: 2.0,
  waveSize: 5,
  speed: 0.22,
  ambient: 0.005,
  reflectStrength: 0.35,
  diffuse: 0.3,
  scatterFloor: 0.2,
} as const;

export const OCEAN = {
  /** 水面の板の一辺。水平線の手前で切れないよう大きく取る */
  size: 20000,
  /** 継ぎ目なくタイルする法線マップ。scripts/generate-water-normals.mjs で生成 */
  normalMap: "/water-normals.png",
  /** 反射を焼き込むテクスチャの解像度。上げるほど鏡像が精細で重い */
  reflectionSize: 512,
  /** 垂直入射での反射率。下げるほど水そのものの色が出る */
  reflectance: 0.045,
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
  colorBottom: "#b4cbe0",
  seed,
  speed: 0.05,
  growth: 0.8,
  // 近すぎる粒だけを薄くする drei の仕様。雲は常に遠いので効かせない
  fade: 25,
  ...overrides,
});

// 背の高い積雲。flat と違い上を丸く盛り上げる
const cumulus = (
  seed: number,
  position: readonly [number, number, number],
  bounds: readonly [number, number, number],
  overrides: Partial<CloudMass> = {},
): CloudMass =>
  flat(seed, position, bounds, {
    shoulder: 0.6,
    shoulderRadius: 0.42,
    taper: 1.15,
    stack: 1.15,
    bump: 0.07,
    bumpFreq: 8,
    lump: 0.2,
    lumpFreq: 6,
    lumpTwist: 8,
    jitter: 0.05,
    depth: 0.9,
    opacity: 1,
    bands: 5,
    ...overrides,
  });

export const CLOUD_LAYER: readonly CloudMass[] = [
  // 写真のように、水平線に腰を据えた大きな積雲を主役に置く。
  // 右にそびえる一番大きいものを軸に、左へ連なりながら低くしていく。
  cumulus(11, [170, 70, -300], [50, 55, 24], { segments: 320, volume: 5.5 }),
  cumulus(29, [86, 40, -268], [28, 26, 17], { segments: 190, volume: 4.4 }),
  cumulus(47, [8, 27, -232], [23, 18, 15], { segments: 150, volume: 4 }),
  cumulus(67, [-72, 32, -242], [25, 21, 16], { segments: 165, volume: 4.2 }),
  cumulus(83, [-158, 30, -220], [21, 15, 14], { segments: 130, volume: 3.8 }),
  cumulus(101, [-248, 26, -265], [23, 14, 15], { segments: 130, volume: 4 }),
  cumulus(127, [268, 36, -322], [27, 23, 17], { segments: 160, volume: 4.4 }),

  // 奥の雲列。低く薄くして帯の底を作り、空の霞へ溶かす
  flat(149, [-40, 22, -400], [40, 5, 16], {
    volume: 4.4,
    segments: 90,
    opacity: 0.7,
  }),
  flat(173, [180, 21, -460], [42, 4, 16], {
    volume: 4.6,
    segments: 85,
    opacity: 0.6,
  }),
  flat(197, [0, 19, -560], [70, 2.5, 18], {
    volume: 5.4,
    segments: 70,
    opacity: 0.45,
    shoulderRadius: 0.8,
  }),
];

// 粒に貼るテクスチャ。drei の既定は外部 CDN(rawcdn.githack.com)を見に行くので、
// 同じ画像を public に置いて自分のオリジンから配る。
export const CLOUD_TEXTURE = "/cloud.png";

// instancedMesh の上限。全塊の segments 合計を超えないと粒が欠ける
export const CLOUD_LIMIT = 2000;

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
