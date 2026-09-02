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

// ポインタ追従で視点を振る量(ラジアン)と追従の減衰係数。
// pitch は水平線が画面から出ない範囲に収める。
// drag は指でなぞるときの倍率で、画面の幅いっぱいをなぞると振り切る 2 にする
// (マウスは端から端で振り切るので、指も同じ道のりで端まで行く)。
export const POINTER_LOOK = {
  yaw: 0.45,
  pitch: 0.12,
  damping: 3,
  drag: 2,
} as const;

// 太陽の向き。海面の映り込みに使う
export const SUN = [0.3, 0.78, -0.5] as [number, number, number];

// mid は視線の高さ(=水平線)の色。ここを白っぽくすると水平線の霞になる。
// curve が小さいほど、低い仰角でも一気に top の青へ寄る。
// NOTE: GradientSky はリニア値をそのまま画面へ書いている(色空間変換をして
// いない)。つまり画面に出る色は THREE.Color(ここの hex) のリニア値であって、
// hex そのものではない。彩度を上げたいときに hex を濃くしても効きが鈍いのは
// このため。GradientSky.tsx のコメントに直し方を書いた。
export const DAY_SKY = {
  top: "#6fa9e2",
  mid: "#b1d6ef",
  bottom: "#a8d4ea",
  // 16:9 の画面上端でも仰角は 30 度ほど(h≒0.5)しかない。curve を下げるぶんだけ
  // 低い高度から top の青へ寄るので、画面に入る範囲でも上が濃く見える
  curve: 0.4,
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
  water: "#030b17",
  sunColor: "#9fb4e8",
  distortion: 2.0,
  waveSize: 5,
  speed: 0.22,
  ambient: 0.005,
  reflectStrength: 0.6,
  diffuse: 0.15,
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
// 粒(ビルボード)の配置と、粒ごとの明るさを決める。
export type CloudMass = {
  /** 塊の中心(ワールド座標) */
  position: readonly [number, number, number];
  /** 粒を撒く範囲の半径。x=幅, y=厚み, z=奥行き。形は正規化空間で作り、これで潰す */
  bounds: readonly [number, number, number];
  /** 粒の数 */
  segments: number;
  /** 粒 1 つの基本サイズ(ワールド単位)。粒ごとの倍率がこれに掛かる */
  volume: number;

  // --- 形 ---------------------------------------------------------------
  /** 立ち上げる塔の数。積雲の頭がいくつあるか */
  towers: number;
  /** 塔を並べる横幅 0..1。1 で bounds いっぱいに広がる */
  spread: number;
  /** 一番高い塔の位置 0..1(0=左端, 1=右端) */
  peak: number;
  /** 主峰から離れた塔をどれだけ低くするか。0 で全部同じ高さ */
  slope: number;
  /** 塔を組む球の半径 0..1。太さそのもの */
  girth: number;
  /** 塔が上へ向かって細る度合い 0..1。小さいほど柱のまま立ち上がる */
  taper: number;
  /** 一番高い塔の頂き -1..1。bounds の y で実寸になる */
  height: number;
  /** 塔の頭の膨らみ。上げると入道雲のように上が湧き上がって太る */
  crown: number;
  /** 骨格の球に生やすこぶの量。輪郭の細かさ */
  roughness: number;
  /** 雲底の平らさ。0 で真っ平ら、上げるほど下へ毛羽立つ */
  flatBase: number;
  /** 高さに応じた横ずれ。風で傾いた雲になる */
  lean: number;

  // --- 陰影 -------------------------------------------------------------
  /** 直射のあたる面の色。gain で 1 を超えさせてハイライトを飛ばす */
  sunlit: string;
  gain: number;
  /** 光も影も中間の、雲の地の色 */
  body: string;
  /** 影の色。空の照り返しで受けるので青く寄せる */
  shadow: string;
  /** 明暗の曲がり具合。1 未満で明るい側に寄る */
  contrast: number;
  /** 太陽の反対側に溜める影の濃さ。奥行きの手がかりになる */
  selfShadow: number;
  /** 空の霞へ溶かす割合。遠い塊ほど上げる */
  haze: number;
  /** 明るさを何段に量子化するか。色は <Cloud> 単位でしか変えられないので */
  shades: number;

  opacity: number;
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
  segments: 58,
  volume: 17,
  towers: 6,
  spread: 0.86,
  peak: 0.5,
  slope: 0.2,
  girth: 0.55,
  taper: 0.62,
  height: 0.6,
  crown: 0,
  roughness: 0.7,
  flatBase: 0.2,
  lean: 0,
  sunlit: "#fffdf5",
  gain: 1.45,
  body: "#dceaf7",
  shadow: "#9cb6d0",
  contrast: 0.72,
  selfShadow: 0.1,
  haze: 0.12,
  shades: 8,
  opacity: 0.92,
  seed,
  speed: 0.05,
  growth: 0.9,
  // 近すぎる粒だけを薄くする drei の仕様。雲は常に遠いので効かせない
  fade: 25,
  ...overrides,
});

// 背の高い積雲。flat と違い塔を高く立て、こぶも濃くする
const cumulus = (
  seed: number,
  position: readonly [number, number, number],
  bounds: readonly [number, number, number],
  overrides: Partial<CloudMass> = {},
): CloudMass =>
  flat(seed, position, bounds, {
    towers: 3,
    spread: 0.72,
    slope: 0.5,
    girth: 0.5,
    height: 0.95,
    roughness: 1,
    flatBase: 0.15,
    selfShadow: 0.13,
    haze: 0.04,
    shades: 12,
    opacity: 1,
    ...overrides,
  });

export const CLOUD_LAYER: readonly CloudMass[] = [
  // 写真のように、水平線に腰を据えた大きな積雲を主役に置く。
  // 右にそびえる一番大きいものを軸に、左へ連なりながら低くしていく。
  // peak をずらすと稜線の主峰が動くので、塊ごとに変えて同じ形を並べない。
  // 主役は入道雲。雲底(position.y - bounds.y)は 15 のまま頭だけ伸ばす。
  // 頂きは仰角 26 度あたりで、16:9 の画角にぎりぎり収まる高さ。
  cumulus(11, [170, 74, -300], [52, 51, 26], {
    segments: 374,
    volume: 24.1,
    towers: 4,
    peak: 0.62,
    height: 1,
    crown: 0.75,
    taper: 0.34,
    slope: 0.5,
    spread: 0.6,
  }),
  cumulus(29, [86, 47, -268], [28, 26, 17], {
    segments: 173,
    volume: 17,
    peak: 0.35,
  }),
  cumulus(47, [8, 33, -232], [23, 18, 15], {
    segments: 138,
    volume: 13.5,
    peak: 0.6,
    height: 0.7,
  }),
  cumulus(67, [-72, 39, -242], [25, 21, 16], {
    segments: 151,
    volume: 14.9,
    peak: 0.28,
  }),
  cumulus(83, [-158, 36, -220], [21, 15, 14], {
    segments: 119,
    volume: 12.1,
    peak: 0.7,
    height: 0.65,
  }),
  cumulus(101, [-248, 33, -265], [23, 14, 15], {
    segments: 119,
    volume: 13.5,
    peak: 0.45,
    height: 0.6,
    haze: 0.1,
  }),
  cumulus(127, [268, 45, -322], [27, 23, 17], {
    segments: 144,
    volume: 16.3,
    peak: 0.4,
    haze: 0.08,
  }),

  // 視界の外まで続ける袖。fov 55 度に POINTER_LOOK.yaw ぶんを足すと、
  // 視線を振り切ったとき z=-300 の面で x=±800 あたりまで見える。そこまで
  // 雲を置かないと、振った先で band がぷつりと切れる。
  // 端は基本ほとんど見えないので、粒は中央より減らして負荷を抑える。
  cumulus(211, [-360, 42, -300], [26, 20, 16], {
    segments: 101,
    volume: 14.2,
    peak: 0.55,
  }),
  cumulus(233, [-470, 35, -258], [22, 16, 14], {
    segments: 86,
    volume: 12.8,
    peak: 0.3,
    height: 0.7,
  }),
  cumulus(257, [-620, 49, -330], [30, 26, 18], {
    segments: 115,
    volume: 16.3,
    peak: 0.66,
  }),
  cumulus(281, [-800, 38, -300], [26, 18, 15], {
    segments: 86,
    volume: 13.5,
    peak: 0.4,
    height: 0.75,
    haze: 0.1,
  }),
  // 端は遠いぶん小さく写るので、bounds を大きめに取って存在を残す
  cumulus(307, [-1290, 40, -370], [38, 22, 18], {
    segments: 86,
    volume: 17,
    peak: 0.6,
    height: 0.7,
    haze: 0.16,
  }),
  cumulus(331, [380, 38, -280], [24, 18, 15], {
    segments: 97,
    volume: 13.5,
    peak: 0.32,
    height: 0.8,
  }),
  // 視線を右へ振り切った先にも見せ場を 1 つ。ここも入道雲にする
  cumulus(353, [510, 75, -345], [32, 52, 20], {
    segments: 188,
    volume: 15.6,
    peak: 0.58,
    height: 1,
    crown: 0.65,
    taper: 0.38,
    slope: 0.5,
    spread: 0.6,
  }),
  cumulus(379, [670, 36, -292], [24, 16, 14], {
    segments: 86,
    volume: 12.8,
    peak: 0.7,
    height: 0.7,
    haze: 0.1,
  }),
  cumulus(401, [870, 45, -345], [28, 22, 17], {
    segments: 94,
    volume: 14.9,
    peak: 0.42,
    haze: 0.12,
  }),
  cumulus(421, [1330, 41, -395], [38, 22, 18], {
    segments: 86,
    volume: 17,
    peak: 0.35,
    height: 0.7,
    haze: 0.18,
  }),

  // 視線を振ったときに空く角度を埋める繋ぎ。塊どうしの隙間そのものは
  // 空らしさなので残し、「帯がそこで終わって見える」幅の穴だけを塞ぐ。
  cumulus(541, [-136, 37, -280], [24, 19, 15], {
    segments: 101,
    volume: 13.5,
    peak: 0.38,
    height: 0.8,
  }),
  cumulus(563, [-734, 42, -330], [27, 21, 16], {
    segments: 94,
    volume: 14.2,
    peak: 0.62,
    height: 0.75,
    haze: 0.1,
  }),
  cumulus(587, [322, 39, -310], [26, 20, 16], {
    segments: 101,
    volume: 14.2,
    peak: 0.66,
    height: 0.78,
  }),
  cumulus(613, [592, 41, -330], [27, 21, 16], {
    segments: 94,
    volume: 14.2,
    peak: 0.3,
    height: 0.72,
    haze: 0.1,
  }),

  // 奥の雲列。低く薄くして帯の底を作り、空の霞へ溶かす。
  // 奥ほど視界に入る幅が広がるので、こちらも左右へ長く伸ばす
  flat(149, [-40, 33, -400], [40, 5, 16], {
    volume: 16.3,
    segments: 72,
    opacity: 0.7,
    haze: 0.2,
  }),
  flat(173, [180, 33, -460], [42, 4, 16], {
    volume: 17.8,
    segments: 68,
    opacity: 0.6,
    haze: 0.26,
  }),
  flat(197, [0, 34, -560], [70, 2.5, 18], {
    volume: 24.1,
    segments: 58,
    opacity: 0.45,
    towers: 8,
    height: 0.4,
    haze: 0.34,
  }),
  flat(443, [-540, 33, -430], [46, 4.5, 16], {
    volume: 17,
    segments: 61,
    opacity: 0.6,
    haze: 0.26,
  }),
  flat(467, [580, 34, -455], [48, 5, 16], {
    volume: 17.8,
    segments: 61,
    opacity: 0.6,
    haze: 0.26,
  }),
  flat(491, [-1500, 35, -560], [80, 3.5, 18], {
    volume: 21.3,
    segments: 50,
    opacity: 0.48,
    towers: 8,
    height: 0.45,
    haze: 0.34,
  }),
  flat(509, [1540, 35, -545], [80, 3.5, 18], {
    volume: 21.3,
    segments: 50,
    opacity: 0.48,
    towers: 8,
    height: 0.45,
    haze: 0.34,
  }),
];

// 遠い雲が溶けていく先の色。水平線の霞(DAY_SKY.mid)に合わせる
export const CLOUD_HAZE = DAY_SKY.mid;

// 粒に貼るテクスチャ。drei の既定は外部 CDN(rawcdn.githack.com)を見に行くので、
// 同じ画像を public に置いて自分のオリジンから配る。ヒーローは初期表示で描き
// 始めるため、ここが外部依存だと毎回の初回描画がその CDN の速さに引きずられる。
export const CLOUD_TEXTURE = "/cloud.png";

// instancedMesh の上限。全塊の segments 合計を超えないと粒が欠ける
export const CLOUD_LIMIT = 4800;

// 星も天の川も、この半径の球面に置く。空の球より内側であれば奥行きの
// 前後関係は変わらないので、あとは水面の反射がどこまで映すかだけの問題。
export const STAR_RADIUS = 8000;
export const GALAXY_RADIUS = 10000;

export const STARS = {
  count: 42000,
  /** 粒の基本サイズ(CSS ピクセル)。等級ぶんの倍率がこれに掛かる */
  size: 1.6,
  /** 等級分布の偏り。大きいほど暗い星が増え、明るい星が希少になる。
      count と一緒に上げると、明るい星の数はそのままに暗い星だけが増える。
      count を据え置いてここだけ上げれば、明るい星が減って全体の数は変わらない */
  falloff: 26,
  /** 一番暗い星の明るさ。0 にすると見えない粒を撒くだけになる。
      数を増やすときはここも下げる。下げないと、増えたぶんが
      「そこそこ見える星」として効いてしまい、空が粗く見える */
  dimmest: 0.022,
  /** 天の川の帯へどれだけ星を寄せるか。0 で一様、1 で帯の中の密度が倍。
      天の川は「星が濃い場所」なので、霞の側より星の側で見せたい */
  bandBias: 2.2,
  /** 大気の減光。向きの y 成分 (= 仰角の sin) がこの間で 0 まで落ちる。
      0.17 で仰角 9.8 度。ここを上げすぎると天の川の中心まで霞に沈む */
  extinctionTop: 0.17,
  extinctionFloor: 0.004,
  /** 色の濃さ。0 で全部白。暗い星ほどここからさらに白へ寄る */
  saturation: 0.55,
  /** またたきの速さと最大振幅。暗い星ほど、低い星ほど強く振れる */
  twinkleSpeed: 1.6,
  twinkle: 0.35,
} as const;

// 空の地色。mid が視線の高さ(=水平線)なので、そこを一段明るくすると
// 写真のように「水平線側が明るい」空になる。黒に落とすと星が黒地の白点に
// 見えてしまうので、天頂もあくまで深い青紫までに留める。
export const NIGHT_SKY = {
  top: "#04050b",
  mid: "#373f61",
  bottom: "#070a12",
  curve: 0.75,
} as const;

export const NIGHT_BG = "#05070f";

/**
 * 天の川。板ではなく空の球そのものに、銀河面からの角度で帯を描く。
 * 板だと矩形の縁が見えるうえ、星の分布と揃えられない。
 *
 * pole は銀河面の法線で、帯はこれに垂直な大円として空を一周する。
 * どこをどんな傾きで通るかは pole ひとつで決まってしまうので、画面の
 * どこに出したいかから逆算する。
 *
 *   画面中央の向きは、カメラが -z を向いて CAMERA.rotation[0] だけ
 *   見上げているので (0, sin p, -cos p)。画面の横方向は r = (1,0,0)、
 *   縦方向は u = (0, cos p, sin p)。
 *
 *   通したい点 P (ここでは横は中央、仰角 12 度ほど) と、そこでの画面上の
 *   傾き t (水平から 50 度で右上がり = cos50 * r + sin50 * u) を決めれば、
 *   pole = normalize(cross(P, t))。
 *
 *   ここを触るときは P と t から取り直すこと。pole の 3 つの数字を直接
 *   いじっても、帯は位置と傾きが同時に動いてしまい合わせられない。
 *
 * core は中心部の膨らみを置く向き。帯から外れると膨らみだけが浮くので、
 * pole と直交する点、つまり上の P をそのまま使う。
 */
export const MILKY_WAY = {
  pole: [0.763, -0.634, -0.129] as [number, number, number],
  core: [0, 0.2, -0.98] as [number, number, number],
  /** 帯の太さ(銀河緯度の sin)。中心から片側 5.5 度で 1/e まで落ち、
      裾を入れて 17 度ほどの帯になる */
  width: 0.095,
  /** 帯の反り。大円のままだと画面ではほぼ直線に見えるので、core から
      離れるほど銀河面から浮かせて弓なりにする。符号で反る向きが変わる */
  curve: 0.13,
  /** 中心部の膨らみの広がり(ラジアン)と、そこでの増光。
      広げすぎると帯ぜんぶが暖色になり、写真の「中心だけ暖かい」が消える */
  coreSpread: 0.35,
  coreGain: 1.3,
  /** 暗黒帯の深さと太さ。帯を縦に裂く塵の筋なので、帯より細くないと
      全体が一様に暗くなるだけで筋に見えない */
  dust: 0.8,
  dustWidth: 0.04,
  /** 全体の濃さ */
  intensity: 0.3,
  /** 帯の地の色と、中心部の暖かい色 */
  band: "#8f9dc8",
  coreColor: "#e5c9b4",
} as const;

/**
 * 描画品質。ヒーローブロックの Canvas はページを開いている間ずっと回るので、
 * 常時ぶんは削りたい。ただし削るのは解像度だけで、粒の数や配置には触らない。
 * ブロックには静止画ポスターを重ねてクロスフェードで差し替えるので、
 * シルエットが変わると入れ替わった瞬間に絵が飛ぶ。
 */
export type Quality = {
  /** R3F の dpr。[下限, 上限] を渡すと画面に合わせてこの範囲に収まる */
  dpr: readonly [number, number];
  /** 海面の反射を焼くテクスチャの一辺。Ocean はここへシーンをもう一度描く */
  reflectionSize: number;
};

export const QUALITY = {
  /** 全画面表示と静止画キャプチャ。見せ場なので上げる */
  full: { dpr: [1, 2], reflectionSize: OCEAN.reflectionSize },
  /** ブロック常設。小さい箱なので反射の精細さは効いてこない */
  block: { dpr: [1, 1.5], reflectionSize: 256 },
  /** 狭い幅。電池を使いすぎないようもう一段落とす */
  blockCompact: { dpr: [1, 1.25], reflectionSize: 128 },
} as const satisfies Record<string, Quality>;
