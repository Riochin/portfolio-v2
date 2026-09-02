/* eslint-disable @next/next/no-img-element --
   このファイルの JSX を描くのは satori であってブラウザではないので、
   next/image は使えない (JSX の子要素の位置には行単位のディレクティブを書けない
   ため、ファイル単位で外している)。 */
import { ImageResponse } from "next/og";
import { SITE } from "@/data/site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** OG 画像の alt。画像ルートの `alt` export に使う。 */
export const ogAlt = SITE.brand;

/** globals.css のライトモードのトークンと同じ値。OG は常にライトで焼く。 */
const COLOR = {
  background: "#fbf3f5",
  surface: "#ffffff",
  foreground: "#171717",
  mutedForeground: "#6b6560",
  accent: "#3d8fd9",
} as const;

/** ダークモードのアクセント (天の川の紫)。記事の OG のワードマークに使う。 */
const ACCENT_DARK = "#8b7ef0";

/** ダークモードの地色 (夜空の紺)。記事の OG の枠に使う。 */
const BACKGROUND_DARK = "#070d1e";

const FONT_CURSIVE = "Alex Brush";
const FONT_SANS = "Zen Maru Gothic";

/**
 * Google Fonts の css2 は User-Agent を見て woff2 / ttf を出し分ける。satori が
 * 読めるのは ttf / otf / woff だけなので、woff2 を知らない古い UA を名乗って
 * ttf を受け取る。
 */
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Version/5.1 Safari/534.30";

/** 同じ (書体, 文字) の取得はビルド中に何度も走るので、プロセス内で使い回す。 */
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/**
 * 書体を「その画像で実際に描く文字」だけに絞って取ってくる。和文書体を丸ごと
 * 積むと数 MB になるが、css2 の `text=` でサブセットを作らせれば数 KB で済む。
 *
 * 取得に失敗しても画像は返す。OG 画像 1 枚のためにビルドを落とすほうが損なので、
 * その書体だけ諦めて satori の既定フォントに任せる (和文は豆腐になる)。
 */
function loadGoogleFont(family: string, text: string, weight?: number) {
  const key = `${family}:${weight ?? ""}:${text}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    try {
      // 太さを指定しないと既定 (400) が返る。satori は宣言した weight で
      // 字体を選ぶので、太字で描きたいならその実体を取ってこないといけない。
      const axis = weight === undefined ? "" : `:wght@${weight}`;
      const url =
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${axis}` +
        `&text=${encodeURIComponent(text)}`;
      const css = await fetch(url, {
        headers: { "User-Agent": LEGACY_UA },
      }).then((res) => res.text());
      const src = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
      if (!src) throw new Error(`no font url in css2 response for ${family}`);
      return await fetch(src[1]).then((res) => res.arrayBuffer());
    } catch (error) {
      console.warn(`[og] ${family} を取得できませんでした`, error);
      return null;
    }
  })();

  fontCache.set(key, pending);
  return pending;
}

/**
 * 全ページ共通の OG 画像。ライト背景に筆記体のワードマークを 1 つ置くだけで、
 * 下層ページはアクセントの罫線の下にページ名 / 作品名が入る。
 */
export async function renderOgImage({ title }: { title?: string } = {}) {
  // サブセットに要る文字を書体ごとに集める。ワードマークは筆記体、それ以外は和文書体。
  const sansText = `${SITE.name}${title ?? ""}`;
  const [cursive, sans] = await Promise.all([
    loadGoogleFont(FONT_CURSIVE, SITE.wordmark),
    loadGoogleFont(FONT_SANS, sansText),
  ]);

  const fonts = [
    cursive && {
      name: FONT_CURSIVE,
      data: cursive,
      weight: 400 as const,
      style: "normal" as const,
    },
    sans && {
      name: FONT_SANS,
      data: sans,
      weight: 500 as const,
      style: "normal" as const,
    },
  ].filter((font) => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: COLOR.background,
          color: COLOR.foreground,
          fontFamily: FONT_SANS,
        }}
      >
        <div
          style={{
            fontFamily: FONT_CURSIVE,
            // 筆記体は字面が小さいので、この寸法でようやく他と釣り合う。
            fontSize: 176,
            // ディセンダ (Riochin の並びには無いが .dev の余白) が切れないぶんの逃げ。
            lineHeight: 1.2,
            color: COLOR.foreground,
          }}
        >
          {SITE.wordmark}
        </div>

        <div
          style={{
            width: 120,
            height: 3,
            marginTop: 24,
            borderRadius: 999,
            background: COLOR.accent,
          }}
        />

        {title && (
          <div
            style={{
              marginTop: 40,
              // 長い作品名でも端に付かないよう、折り返して中央に積む。
              maxWidth: 920,
              textAlign: "center",
              lineHeight: 1.35,
              fontSize: 52,
              color: COLOR.foreground,
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            marginTop: title ? 20 : 40,
            fontSize: 28,
            letterSpacing: "0.18em",
            color: COLOR.mutedForeground,
          }}
        >
          {SITE.name}
        </div>
      </div>
    ),
    { ...ogSize, ...(fonts.length > 0 && { fonts }) },
  );
}

/**
 * 名乗りの前に置く顔写真を data URI で読む。
 *
 * fetch ではなくディスクから読むのは、この画像がビルド中に描かれるから ──
 * 自分のサイトはまだ起動していないので URL では取りに行けない。
 * 読めなければアイコン無しで描く。OG 画像 1 枚のためにビルドを落とさない。
 *
 * profile.webp ではなく PNG の複製を読む。satori は webp を解せず、
 * 渡すと "not iterable" で落ちる。表示は 64px なので 128px あれば足りる。
 */
async function loadAvatar(): Promise<string | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const bytes = await readFile(join(process.cwd(), "public", AVATAR_FILE));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.warn("[og] アイコンを読めませんでした", error);
    return null;
  }
}

const AVATAR_FILE = "profile-og.png";
const AVATAR_SIZE = 80;

/** 枠 (星空が見える帯) の太さ。 */
const FRAME = 40;
/** カードの内側の余白。 */
const CARD_PADDING = 48;
/** 見出しの最終行と名乗りの間に残す隙間。 */
const FOOTER_GAP = 16;

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
};

/**
 * 枠に撒く星。
 *
 * ダークモードのヒーローが星空なので、記事の OG でも同じ題材を出す。
 * 乱数は決定的 (mulberry32 を固定の種で回す) にしてある ── ビルドのたびに
 * 星の配置が変わると、記事ごとに違う空になって「同じサイトのカード」に
 * 見えなくなるため。
 *
 * カードに隠れる内側の座標は捨てて、帯の中にだけ置く。角が丸いぶん四隅は
 * カードが覆わないので、そこだけ自然に星が濃くなる。
 */
function generateStars(count: number): Star[] {
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const stars: Star[] = [];
  // 帯の外に落ちるまで引き直すので、試行回数に上限を置いて止まらないようにする。
  for (let i = 0; stars.length < count && i < count * 20; i += 1) {
    const x = random() * ogSize.width;
    const y = random() * ogSize.height;
    const hidden =
      x > FRAME &&
      x < ogSize.width - FRAME &&
      y > FRAME &&
      y < ogSize.height - FRAME;
    if (hidden) continue;

    stars.push({
      x,
      y,
      // 大半は小さな点。たまに大きいものが混ざると空に奥行きが出る。
      size: random() < 0.15 ? 3 : random() < 0.5 ? 2 : 1.5,
      opacity: 0.35 + random() * 0.55,
    });
  }
  return stars;
}

/** 星は毎回同じでよいので、モジュールを読んだときに 1 度だけ作る。 */
const STARS = generateStars(160);

const TITLE_FONT_SIZE = 68;
const TITLE_LINE_HEIGHT = 1.3;
const TITLE_LINES = 4;

/**
 * この寸法で 1 行に収まる全角の文字数 (実測)。半角はおよそ半分の幅なので
 * 0.5 として数える。satori には文字送りを測る術が無いため、字幅を仮定して
 * こちら側で切る。
 */
const CHARS_PER_LINE = 14;

/** 半角を 0.5 として数えた「見た目の長さ」。 */
const displayWidth = (text: string) =>
  [...text].reduce((sum, char) => sum + (/^[\x00-\x7F]$/.test(char) ? 0.5 : 1), 0);

/**
 * 4 行に収まらない見出しを省略する。
 *
 * maxHeight だけでも溢れは隠れるが、それだと末尾が黙って消えて
 * 「途中で切れている」ことが読み手に伝わらない。"…" を足して切ったと示す。
 */
function clampTitle(title: string): string {
  const budget = CHARS_PER_LINE * TITLE_LINES;
  if (displayWidth(title) <= budget) return title;

  let width = 0;
  let cut = "";
  for (const char of title) {
    // 末尾に足す "…" のぶんを先に空けておく。
    width += /^[\x00-\x7F]$/.test(char) ? 0.5 : 1;
    if (width > budget - 1) break;
    cut += char;
  }
  return `${cut.trimEnd()}…`;
}

/**
 * 記事 (content/articles/*.md) 専用の OG 画像。
 *
 * 他のページの OG (renderOgImage) がワードマークを中央に据えた「表紙」なのに対し、
 * こちらは Zenn / Qiita のカードに構造を寄せてある ── 外枠 → 白いカード →
 * 左上に見出し → 下辺に名乗り。/output の一覧ではこの画像が Zenn / Qiita の
 * サムネイルと同じグリッドに並ぶので、作りが揃っていないとそこだけ浮く。
 *
 * 枠は夜空の紺 (#070d1e) から天の川の紫 (#8b7ef0) への縦グラデーションで、
 * 帯には星を撒く ── ダークモードのヒーローが星空なので、同じ題材をここでも出す。
 * 青から紫へ渡すグラデーションは採らない。Zenn のカードそのものになるため。
 * 紺を厚めに取ってから紫へ落とすのも同じ判断で、紫が支配的だと夜空に見えない。
 *
 * 中のカードはサイトの面の色 (--surface)。記事本文のコードブロックも同じ白なので、
 * 共有された画像から記事に入ったときに面の色が変わらない。
 */
export async function renderArticleOgImage({ title }: { title: string }) {
  const [cursive, sans, avatar] = await Promise.all([
    loadGoogleFont(FONT_CURSIVE, SITE.wordmark),
    // 省略記号は clampTitle が後から足すので、サブセットの要求にも明示して混ぜる。
    loadGoogleFont(FONT_SANS, `${title}${SITE.name}…`, 700),
    loadAvatar(),
  ]);

  const fonts = [
    cursive && {
      name: FONT_CURSIVE,
      data: cursive,
      weight: 400 as const,
      style: "normal" as const,
    },
    sans && {
      name: FONT_SANS,
      data: sans,
      weight: 700 as const,
      style: "normal" as const,
    },
  ].filter((font) => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          // 外周に見える帯がそのまま枠になり、そこに星が出る。
          padding: FRAME,
          // 上が夜空の紺、下が天の川の紫。ダークモードの地色とアクセントそのもの。
          // 紺を厚めに取ってから紫へ渡す。中点を下げないと紫が支配的になり、
          // 夜空というより紫のカードに見えてしまう。
          background: `linear-gradient(180deg, ${BACKGROUND_DARK} 0%, ${BACKGROUND_DARK} 48%, ${ACCENT_DARK} 100%)`,
          fontFamily: FONT_SANS,
        }}
      >
        {STARS.map((star) => (
          <div
            key={`${star.x}-${star.y}`}
            style={{
              position: "absolute",
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size,
              background: "#ffffff",
              opacity: star.opacity,
            }}
          />
        ))}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            // 4 行まで埋まったときに、見出しの最終行と名乗りが接しないぶんの逃げ。
            gap: FOOTER_GAP,
            borderRadius: 24,
            background: COLOR.surface,
            padding: CARD_PADDING,
          }}
        >
          <div
            style={{
              display: "flex",
              // ちょうど 4 行ぶんで頭打ちにする。単に overflow: hidden だけだと
              // 5 行目が半分だけ覗いて「欠けている」ように見えるので、
              // 行の高さの整数倍で切る (satori は -webkit-line-clamp を解さない)。
              maxHeight: TITLE_LINES * TITLE_FONT_SIZE * TITLE_LINE_HEIGHT,
              overflow: "hidden",
              fontSize: TITLE_FONT_SIZE,
              fontWeight: 700,
              lineHeight: TITLE_LINE_HEIGHT,
              color: COLOR.foreground,
            }}
          >
            {clampTitle(title)}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: COLOR.mutedForeground,
              }}
            >
              {avatar && (
                // Zenn / Qiita が名前の前に顔を置くのと同じ並び。
                // img に直接 borderRadius を掛けても satori は角を落とすだけで
                // 円にしないので、丸く切り抜いた入れ物に入れる。
                <div
                  style={{
                    display: "flex",
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: AVATAR_SIZE / 2,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={avatar}
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                    alt=""
                  />
                </div>
              )}
              {SITE.name}
            </div>

            {/* Zenn / Qiita が右下にサービス名を置くのと同じ位置に、
                こちらはサイトのワードマークを置く。 */}
            <div
              style={{
                fontFamily: FONT_CURSIVE,
                fontSize: 62,
                lineHeight: 1.2,
                color: ACCENT_DARK,
                // 筆記体は字面が本文より高い位置に乗るので、名乗りの行と
                // 目線を揃えるぶんだけ下げる。transform にしてあるのは、
                // margin だと行の高さが伸びて見出しに使える高さが減るため。
                transform: "translateY(10px)",
              }}
            >
              {SITE.wordmark}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...ogSize, ...(fonts.length > 0 && { fonts }) },
  );
}
