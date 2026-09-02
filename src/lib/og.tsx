import { ImageResponse } from "next/og";
import { SITE } from "@/data/site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** OG 画像の alt。画像ルートの `alt` export に使う。 */
export const ogAlt = SITE.brand;

/** globals.css のライトモードのトークンと同じ値。OG は常にライトで焼く。 */
const COLOR = {
  background: "#fbf3f5",
  foreground: "#171717",
  mutedForeground: "#6b6560",
  accent: "#3d8fd9",
} as const;

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
function loadGoogleFont(family: string, text: string) {
  const key = `${family}:${text}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    try {
      const url =
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}` +
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
