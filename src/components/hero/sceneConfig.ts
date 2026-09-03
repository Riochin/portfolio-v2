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

// ヒーローの画枠。three の fov は垂直基準なので、比を変えても縦の見え方は
// 一切動かず、横だけが切られる (= 横方向にズームインする)。fov 55 での
// 水平半画角は atan(ratio * tan(27.5°))。
//
//   16:9  ±42.8°
//   4:3   ±34.8°
//   1:1   ±27.5°
//
// 主役は CLOUD_LAYER の先頭の入道雲。カメラ (z=12) から見て峰が方位 +29.6°、
// 右の裾は近い側で +37.8° にある。16:9 はその裾がぎりぎり収まる画角で、
// 比だけ 4:3 に詰めると裾が切れ、峰も右端に貼り付く。yaw を右へ振って戻す。
//
// fov は上げない。上げれば横は戻るが、垂直基準なので縦まで一緒に広がって
// 主役が小さくなり、水平線 tan(pitch)/(2*tan(fov/2)) も 55.3% から動く
// (55→62 で 54.6%)。yaw なら主役の大きさも水平線の位置もそのままで、
// 画角の中の居場所だけが変わる。HeroSection の挨拶文の位置もそのまま生きる。
export const HERO_FRAMING = {
  /** 既定。md 以上と、縦に余裕の無い画面 (globals.css の upright を参照) */
  wide: { ratio: [16, 9], yaw: 0, poster: "" },
  /** 狭い縦長の画面。yaw -0.12 (6.9°) で峰が NDC 0.60、右の裾が 0.86 に入る */
  narrow: { ratio: [4, 3], yaw: -0.12, poster: "-narrow" },
} as const satisfies Record<string, HeroFraming>;

export type HeroFramingName = keyof typeof HERO_FRAMING;

export type HeroFraming = {
  /** 画枠の比。CSS の aspect と Canvas の実寸の両方がここから決まる */
  ratio: readonly [number, number];
  /** カメラの基準 yaw (rad)。負で右を向く */
  yaw: number;
  /** /public/hero-{mode}{poster}.webp の接尾辞 */
  poster: string;
};

/** ヒーローを narrow で組む画面。globals.css の @custom-variant upright と対 */
export const UPRIGHT_QUERY = "(width < 48rem) and (height >= 31rem)";

/** 空の球の半径。水面の反射が届く範囲を覆う大きさが要る */
export const SKY_RADIUS = 12000;

// ポインタ追従で視点を振る量(ラジアン)と追従の減衰係数。
// pitch は水平線が画面から出ない範囲に収める。
// drag は指でなぞるときの倍率で、画面の幅いっぱいをなぞると振り切る 2 にする
// (マウスは端から端で振り切るので、指も同じ道のりで端まで行く)。
export const POINTER_LOOK = {
  yaw: 0.45,
  pitch: 0.12,
  // damp は 1-exp(-λt) なので、λ=3 は時定数 1/3 秒——9 割追いつくのに 0.77 秒
  // かかる。マウスは手を動かし続けるぶんこの遅れが慣性の重みになるが、指は
  // フリックで一気に置いていくので、同じ遅れがそのまま鈍さになる。
  // 指のときだけ λ=7 (時定数 0.14 秒、9 割まで 0.33 秒) へ詰める。詰めすぎると
  // 指に貼り付いて素っ気なくなるので、マウスの半分より少し遅いあたりで止める。
  damping: 3,
  touchDamping: 7,
  drag: 2,
  // 縦は pitch ぶん (±6.9 度) しか振れないのに横と同じ倍率でなぞらせると、
  // 画面の半分で振り切ってその先が死ぬ。同じだけ擦っているのに縦だけ
  // 動かない=壊れて見えるので、倍率を半分にして高さいっぱいでちょうど
  // 端に着く道のりにする。可動域は変えず、狭さを手応えのほうで伝える。
  dragY: 0.5,
  // 振り切った先のラバーバンド。over はそこからさらに押し込めるなぞりの量、
  // give は実際に覗ける角度 (可動域に対する割合)。押すほど戻りが重くなり、
  // 指を離せば端へ帰る。端に着いたことが分かればいいので give は控えめに。
  over: 0.5,
  give: 0.12,
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
  /** 波を寝かせ始める距離(ワールド単位)。1-exp(-距離/これ) の割合だけ法線を
      真上へ寄せる。水平線際は 1 画素が海面の広い面積を覆うので、そこへ高周波
      の法線を残すと、反射のサンプル位置が毎フレーム数テクセルぶん跳ねて
      ちらつく。300 なら手前(距離 6〜50)はほぼ素のまま、水平線から 16px 上
      までの帯(距離 130〜1000)が 35〜95% 寝る */
  flatten: 300,
  /** 法線マップの異方性フィルタ。浅い角度でのサンプルが素直になる。
      1 枚を 4 回引くので、上限(多くは 16)まで上げずに 8 で止める */
  anisotropy: 8,
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
  // narrow の画枠は水平半画角が狭く (±34.8°)、yaw を右へ 0.12 振っても
  // 届くのは +750 / -430 まで。ここより外へは出ないので足す必要はない。
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

// 雲を横へ流す。<Cloud speed> が回しているのは粒(ビルボード)の自転と
// growth の脈動だけで、塊そのものはその場に留まる。輪郭がじわっと変わるだけで
// 移動には見えないので、塊を包む group ごと動かして流す。
//
// 層ごとに速さを変える必要はない。同じワールド速度でも z が遠い塊ほど見かけの
// 角速度は小さくなるので、奥の雲列は勝手に遅れて流れる。
export const CLOUD_DRIFT = {
  /** 流れる速さ(ワールド単位/秒)。正で右へ、負で左へ。
      主役の入道雲(x=170, z=-300, bounds.x=52)は見かけの幅が 19.6 度あるので、
      0.3 なら自分の幅ぶん動くのに 6 分ほどかかる。見ているあいだは気づかず、
      戻ってくると変わっている、くらいの速さ */
  speed: 0.3,
  /** ここを越えたら反対の端へ回す。視線を振り切っても(POINTER_LOOK.yaw 0.45 rad
      + 16:9 の水平半画角 42.8 度 = 68.6 度)z=-300 の面で見えるのは x=±770 まで。
      CLOUD_LAYER は x=-1500〜1540 に広がっているので、その外で回せば
      瞬間移動は目に入らない。
      帯の端ちょうどに置いてあるのは、雲列を継ぎ目なく繋げるため。ここを広げると
      折り返しの周期だけが伸び、雲の無い隙間が帯を横切っていく。逆に狭めると
      奥の雲列(z=-560 は x=±1458 まで見える)で折り返しが視界に入る */
  wrap: 1540,
} as const;

// 遠い雲が溶けていく先の色。水平線の霞(DAY_SKY.mid)に合わせる
export const CLOUD_HAZE = DAY_SKY.mid;

// 粒に貼るテクスチャ。drei の既定は外部 CDN(rawcdn.githack.com)を見に行くので、
// 同じ画像を public に置いて自分のオリジンから配る。ヒーローは初期表示で描き
// 始めるため、ここが外部依存だと毎回の初回描画がその CDN の速さに引きずられる。
export const CLOUD_TEXTURE = "/cloud.png";

// たまに空を横切る鳥。ずっと飛んでいると「動くもの」が増えて空の静けさが
// 壊れるので、一群れ通したら長めに間を空ける。
// 距離が遠いぶん 1 羽は数ピクセルにしかならない。輪郭はシェーダの距離関数を
// smoothstep で締めて出すので、その大きさでも縁は滑らかに出る。
export const BIRDS = {
  /** instancedMesh の確保数。flock の上限を下回らないこと */
  limit: 14,
  /** 一群れの羽数 */
  flock: [4, 11] as [number, number],
  /** 群れと群れの間隔(秒)と、最初の 1 群が出るまで */
  gap: [10, 40] as [number, number],
  firstGap: 8,
  /** 飛ぶ高さ。雲の頭(最大 160 あたり)より上を通す */
  altitude: [140, 205] as [number, number],
  /** 奥行き。雲の帯より手前に置く。奥だと雲に紛れて見えない */
  depth: [-430, -300] as [number, number],
  /** 横切る速さ(ワールド単位/秒) */
  speed: [34, 52] as [number, number],
  /** 翼の差し渡し(ワールド単位) */
  size: [3.6, 5.4] as [number, number],
  /** 群れの粒どうしの間隔 */
  spacing: 7,
  /** 後続がどれだけ下がるか。列を水平に寝かせるほど横切って見える */
  trail: 0.18,
  /** 上下のゆれ幅 */
  bob: 1.4,
  /** ここを外れたら群れは終わり。画角の外まで送り切る */
  span: 1000,
  /** 羽ばたきの速さ(rad/s) */
  flapSpeed: [7, 11] as [number, number],
  /** 翼の角度。下限が打ち下ろし、上限が打ち上げ */
  flapAngle: [-0.14, 0.62] as [number, number],
  color: "#ffffff",
  opacity: 0.9,
  /** 翼の線の太さ(クアッド内の比) */
  thickness: 0.2,
  seed: 7,
} as const;

// 水平線を渡っていく船。鳥や流れ星と同じ「たまに起きる出来事」だが、速さが
// まるで違う。画角を渡り切るのに数分かかるので、目で追うものではなく、一度
// 目をやって、しばらくして戻ってきたら位置が変わっている類のものになる。
//
// この距離では船は影でしかない。板 1 枚にシルエットと航跡をまとめてフラグ
// メントで描く (Ship.tsx)。航跡を別の板にして水面へ寝かせても、水平線の
// 近くでは極端に前縮みして数 px にしかならないので分ける意味がない。
export const SHIP = {
  /** 奥行き。遠いほど小さく、水平線に貼り付く */
  depth: [-4600, -3600] as [number, number],
  /** 全長(ワールド単位)。z=-4200 で見かけの幅は画面の 1.2〜1.7%
      (1280px なら 15〜22px) にあたる。船橋と煙突の段差が読める大きさで、
      これ以上に寄せると「遠くにいる」感じのほうが減っていく */
  length: [90, 135] as [number, number],
  /** 全長に対する板の高さ。マストの先まで収まる余白を含む */
  aspect: 0.34,
  /** 板の下からどこを水線にするか(uv の v)。ここがワールドの y=0 に乗る */
  waterline: 0.25,
  /** 渡る速さ(ワールド単位/秒)。z=-4200 なら 0.0024〜0.0043 rad/s で、
      16:9 の画角(±42.8°)を渡り切るのに 6〜10 分かかる。見ているあいだは
      止まって見え、戻ってくると場所が変わっている */
  speed: [10, 18] as [number, number],
  /** 画角の外まで送り切る方位(rad)。wide は ±42.8°、narrow は中心 -6.9° の
      ±34.8° なので、±50° まで送ればどちらの画枠でも枠の外で折り返せる。
      実際の折り返し位置は奥行きに応じて |z| * tan(この角) + 全長 で取る */
  span: 0.87,
  /** 出現の間隔(秒)と、最初の 1 隻まで */
  gap: [90, 240] as [number, number],
  firstGap: [20, 60] as [number, number],
  /** 船体の色。ここから haze ぶん DAY_SKY.mid へ寄せる */
  color: "#2c3a44",
  /** 霞への溶け具合。上げるほど空に紛れる */
  haze: [0.55, 0.7] as [number, number],
  /** 航跡の長さ。全長に対する倍率 */
  wake: [1.5, 3] as [number, number],
  /** 航跡の明るさ。霞の色から白へ寄せる量 */
  wakeGain: 0.6,
  /** 輪郭のぼかし幅(全長に対する比)。全長 120・z=-4200 で 1 px 前後になる。
      fwidth は GLSL ES 1.00 では拡張が要るので、Birds と同じく定数で持つ */
  soft: 0.03,
} as const;

// 飛行機雲。引かれてから消えるまでが数分あり、この空でいちばん寿命の長い
// 出来事になる。見どころは機体ではなく「線が残ること」で、引き終わったあとも
// 滲みながら空に留まる。少し目を離して戻ってきた人にだけ、さっきと違う空が
// 見える——雲の流れ(CLOUD_DRIFT)と同じ狙いを、もっと短い時間で出す。
//
// 板 1 枚を経路全体を覆う矩形として置き、筋はフラグメントで描く (Contrail.tsx)。
export const CONTRAIL = {
  /** 奥行き */
  depth: [-3000, -2300] as [number, number],
  /** 高度。雲の頭(160 あたり)や鳥(140〜205)よりはるかに上を通す */
  altitude: [720, 900] as [number, number],
  /** 経路の傾き(rad)。板ごと z 軸まわりに倒して斜めの線にする */
  tilt: [-0.04, 0.04] as [number, number],
  /** 経路の半分の長さ。x は -span から +span まで(向きは 1 本ごとに引く)。
      z=-2600 で片側 54° ぶんあり、どちらの画枠でも枠の外から入って外へ抜ける */
  span: 3600,
  /** 引き終わるまでの秒数 */
  draw: [70, 110] as [number, number],
  /** 引き終わってから消えきるまでの秒数 */
  linger: [30, 60] as [number, number],
  /** 出現の間隔(秒)と、最初の 1 本まで。消えきってからここだけ空ける。
      1 本の寿命(draw + linger)が 1.7〜2.8 分なので、空に何も無い時間は
      全体の 4〜5 割になる */
  gap: [60, 180] as [number, number],
  firstGap: [25, 70] as [number, number],
  /** 筋の幅(ワールド単位)。引きたてが下限、広がりきって上限。
      z=-2600 だと 0.6 px から 5 px ほどに広がる */
  width: [2.2, 24] as [number, number],
  /** 板の高さ。幅の上限の 3 倍取って、広がりきった裾まで収める */
  height: 90,
  /** 幅が広がる時定数(秒) */
  spread: 40,
  /** 濃さが落ちる時定数(秒)。広がりきる前に薄れきるくらいでちょうど、
      端から溶けるように消えていく */
  decay: 70,
  /** 引きたての、まだ濃い部分の長さ(秒) */
  fresh: 3,
  /** 筋の濃さ。空との差がわずかに分かる程度に留める */
  opacity: 0.5,
  color: "#f4f8ff",
  /** 中心線と幅のうねり。0 だと定規で引いた線になる */
  waver: 0.4,
  /** 先端の機影の明るさ。線が「何かに引かれている」ことの説明になる。
      気づかせるためのものなので、目を引くほどには光らせない */
  head: 0.75,
  /** 機影の長さ(経路全体に対する比)。z=-2600 で 4 px ほど */
  headLength: 0.0015,
} as const;

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
      ここを上げると暗い星が持ち上がり、空全体の明暗差が詰まる */
  dimmest: 0.09,
  /** 天の川の帯へどれだけ星を寄せるか。0 で一様、1 で帯の中の密度が倍。
      天の川は「星が濃い場所」なので、霞の側より星の側で見せたい */
  bandBias: 2.2,
  /** 大気の減光。向きの y 成分 (= 仰角の sin) がこの間で 0 まで落ちる。
      0.17 で仰角 9.8 度。ここを上げすぎると天の川の中心まで霞に沈む */
  extinctionTop: 0.17,
  extinctionFloor: 0.004,
  /** 色の濃さ。0 で全部白。暗い星ほどここからさらに白へ寄る */
  saturation: 0.55,
  /** またたきの速さと最大振幅。低い星ほど強く振れる。
      速さは星ごとに 0.6〜1.5 倍へ散るので、実際は 2.3〜5.7 rad/s
      (周期 1.1〜2.8 秒)。上へ振ると呼吸ではなく明滅になるが、
      行きすぎると今度は点滅に見える。目で見て決めた値。
      なお実際の見た目の速さは、シェーダで足す 1.618 倍の第 2 波の側で
      決まる (最速で 9.2 rad/s = 60fps で 41 フレーム/周期) */
  twinkleSpeed: 3.8,
  twinkle: 0.45,
  /** 強く瞬く星の割合と、残りの星に残す振幅。空じゅうを一様に振ると
      砂嵐になるので、目に付く瞬きは一部の星にだけ預ける */
  twinkleShare: 0.25,
  twinkleCalm: 0.35,
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

// 流れ星。板 1 枚を加算で描くだけなので、出ていない間は visible を false に
// しておけばドローコールも消える。
//
// 出現の間隔は useFrame の delta で数える。setTimeout で持つと、画面外や
// タブ非表示で frameloop が止まっている間に出現を消化してしまう。
//
// 見飽きるかどうかは、出る場所より「毎回同じ顔で出るか」で決まる。出る場所も
// 落ちる向きも明るさも長さも 1 本ごとに引き直して、同じ 1 本を二度見せない。
export const SHOOTING_STAR = {
  /** 横切るのにかける時間(秒) */
  duration: 1.1,
  /** 尾の長さ。道のり全体に対する割合。これが画面に見える筋の長さになる */
  tail: 0.45,
  /** 筋の太さ(ラジアン)。頭の側の幅で、尾へ向かって細くなる */
  width: 0.004,
  /** 同時に待たせておく本数。1 本が飛んでいる間ももう 1 本は自分の間隔を
      数えているので、間隔はそのままに出会う回数だけが増える。たまに 2 本が
      重なって降るが、そういう夜もあるのでそのまま流す */
  count: 2,
  /** 1 枚が次の 1 本を出すまで、最低でも空ける秒数。間隔そのものは用途
      ごとに SHOOTING_STAR_CADENCE で決めるが、同じ場所から続けざまに出ると
      「たまたま見えた」感じが消えるので、下限だけはここで押さえる */
  minInterval: 3,

  /** カメラ正面からの左右のひらき(ラジアン)。正が画面の右。
      16:9 の水平半画角は 42.8 度あるが、端から出すと落ちるそばから枠の外へ
      抜けてしまうので、-17 度〜+26 度に収める。左右で幅が違うのは、
      天の川が左下の水平線から右上の隅へ抜けていくため */
  azimuth: [-0.3, 0.45] as [number, number],
  /** 出発点の仰角(ラジアン)。方位の左端と右端それぞれで [下限, 上限] を
      決め、間は線形に繋ぐ。天の川と同じ右上がりの斜めに乗せると、左右へ
      ばらしても「あの帯のあたりから出てくる」まとまりは残る。
      画面の上端は仰角 30.6 度(方位の端では 28 度ほど)なので、右は枠の外
      から流れ込み、左は 6 割ほどが枠の中で火が点く(全体では 4 割ほど)。
      低いところから出た 1 本は落ちきる前に水平線の下へ入るが、海へ吸い
      込まれるように見えるのでそのまま流す */
  elevationAtLeft: [0.32, 0.62] as [number, number],
  elevationAtRight: [0.46, 0.8] as [number, number],
  /** 落ちる向き。真下を 0 として、方位と同じ側へ何ラジアン倒すか。
      右から出たら右下、左から出たら左下へ落ちる。こうすると画面の上のほうに
      放射点があるように見えて、左右へばらしても散らからない。
      0 だと真下に落ちて硬く、倒しすぎると横へ流れて枠の外へ出てしまう */
  tilt: [0.35, 0.85] as [number, number],

  /** 大物を引く確率。10 本に 2 本ほど、明るくて長いものを混ぜる */
  rareChance: 0.2,
  /** 並と大物それぞれの [下限, 上限]。length は空を横切る角度(ラジアン)で、
      画面に見える筋はその tail 倍。並は 8〜16 度ほどの短い筋、大物は画面を
      大きく横切る 19〜27 度の筋になる */
  common: {
    length: [0.3, 0.6] as [number, number],
    intensity: [0.9, 1.5] as [number, number],
  },
  rare: {
    length: [0.75, 1.05] as [number, number],
    intensity: [2.2, 3.0] as [number, number],
  },
  color: "#f6f9ff",
} as const;

/**
 * 流れ星の間隔(秒)。飛び終わってから次の 1 本までの待ちを、毎回この範囲から
 * 引く。これは板 1 枚ぶんの待ちなので、実際に空へ出る頻度は count 倍になる。
 * QUALITY と同じく用途で分ける。ブロックはページを読んでいる横で回り続ける
 * ので、目の端で何度も光られると気が散る。全画面はこの空を見に来ている画
 * なので、待たせるほうがもったいない。
 */
export type ShootingStarCadence = {
  /** 待ちの [下限, 上限]。SHOOTING_STAR.minInterval より短くはならない */
  interval: readonly [number, number];
};

export const SHOOTING_STAR_CADENCE = {
  /** 全画面表示 */
  full: { interval: [14, 34] },
  /** ブロック常設 */
  block: { interval: [50, 110] },
} as const satisfies Record<string, ShootingStarCadence>;

// 漁火。水平線のすぐ上に灯る船団で、昼の SHIP と対になる。星と同じ加算の
// グローだが、色は暖色で、ゆらぎは星よりずっと遅い(大気ではなく波と距離の
// ゆらぎなので)。灯りは点ではなく板で描く——gl_PointSize はピクセル単位で
// 効くため、水面の鏡像を焼く小さなバッファで倍率が狂う (starPass.ts 参照)。
//
// 「ずっとある景色」にはせず、通りかかったときだけ灯る出来事にしてある。
// 常設にすると静止画ポスターにも焼く必要が出て、夜の空に動かないものが
// 増える。
export const FISHING_LIGHTS = {
  /** instancedMesh の確保数。count の上限を下回らないこと */
  limit: 9,
  /** 一船団の灯りの数 */
  count: [5, 9] as [number, number],
  /** 奥行き。船(z=-4200 あたり)よりさらに遠くへ置いて水平線に貼り付かせる */
  depth: [-8500, -6000] as [number, number],
  /** 船団の中心の方位(rad)。正が画面の右。narrow の画枠は中心が -6.9° で
      右は +27.9° までしかないので、そちらに合わせて右を抑える */
  azimuth: [-0.5, 0.4] as [number, number],
  /** 中心からの散らばり(ワールド単位) */
  spread: [300, 900] as [number, number],
  /** 水線からの高さ。マストの灯りぶんだけ水平線の上に出る */
  altitude: [6, 25] as [number, number],
  /** 灯り 1 つの板の一辺(ワールド単位)。z=-7000 で 4〜7 px */
  size: [25, 45] as [number, number],
  /** 灯りの色。この 2 色の間から 1 つずつ引く */
  warm: ["#ffc98a", "#ffe9c0"] as [string, string],
  /** 明るさ */
  intensity: [0.6, 1.1] as [number, number],
  /** ゆらぎの振れ幅と速さ。星の瞬き(STARS.twinkleSpeed)より遅く、浅く */
  sway: 0.25,
  swaySpeed: [0.25, 0.6] as [number, number],
  /** 流れる速さ(ワールド単位/秒)。z=-7000 では止まって見える */
  drift: [2, 5] as [number, number],
  /** 灯っている時間(秒) */
  stay: [120, 300] as [number, number],
  /** 点いて消えるのにかける時間(秒)。ふっと現れないよう長めに取る */
  fade: 45,
  /** 出現の間隔(秒)と、最初の 1 団まで */
  gap: [180, 420] as [number, number],
  firstGap: [30, 80] as [number, number],
} as const;

// 航行灯。赤(左舷)・緑(右舷)と白のストロボが、ゆっくり空を渡っていく。
// 流れ星が一瞬の出来事なのに対して、こちらは 1 分以上かけて渡る持続で、
// 昼の CONTRAIL と対になる。鳥の 1/5 ほどの角速度なので、空の静けさは
// 壊さない。
//
// 経路は奥行きを変えながら斜めに取る。真横に渡らせると機体を翼端の方向から
// 見ることになり、左右の灯が画面上で重なって赤と緑が分離しない。
export const NAV_LIGHTS = {
  /** 経路の両端の方位(rad)。50〜62° なので、wide (±42.8°) でも narrow
      (中心 -6.9° の ±34.8°) でも、必ず枠の外から入って外へ抜ける。
      両端それぞれ引き直すので、出てくる場所も消える場所も毎回変わる */
  azimuth: [0.87, 1.08] as [number, number],
  /** 経路の両端の奥行き。中心をこの範囲から引く */
  depth: [-3400, -1800] as [number, number],
  /** 両端の奥行きの差。ここが小さいと機体を真横から見ることになり、左右の
      翼端が画面上で重なって赤と緑が分離しない。手前から奥へ抜けるか、奥から
      手前へ来るかは 1 機ごとに引く */
  depthSpread: [900, 1700] as [number, number],
  /** 高度と、渡るあいだの高度差 */
  altitude: [560, 700] as [number, number],
  climb: [-40, 40] as [number, number],
  /** 渡り切るまでの秒数。画角(±42.8°)を渡り切るのにこれだけかかる。
      鳥の 1/10 ほどの角速度で、見ている間はほとんど動かないように見える */
  duration: [150, 230] as [number, number],
  /** 翼端から翼端まで(ワールド単位)。画面に出る赤と緑の間隔は、この長さの
      うち視線に直交する成分だけになる。経路が斜めなぶん実際に効くのは 1/4
      ほどで、10 px 前後に見せるにはこれくらい要る */
  wing: 55,
  /** 灯り 1 つの板の一辺 */
  size: 10,
  /** 航行灯の色。左舷が赤、右舷が緑 */
  port: "#ff4436",
  starboard: "#35ff86",
  strobe: "#ffffff",
  intensity: 0.9,
  /** ストロボ。cycle 秒ごとに flash 秒の閃光を、gap 秒あけて 2 発。
      この二連が「飛行機だ」と一目で分かる正体なので、ここは削らない */
  strobeCycle: 1.4,
  strobeFlash: 0.06,
  strobeGap: 0.15,
  /** 閃光の明るさ。航行灯に対する倍率 */
  strobeGain: 4,
  /** 出現の間隔(秒)と、最初の 1 機まで。CONTRAIL と同じにして、昼と夜で
      飛行機の出方が揃うようにする */
  gap: [60, 180] as [number, number],
  firstGap: [25, 70] as [number, number],
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
