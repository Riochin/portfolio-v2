import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * ホーム画面に追加されたときの見え方。
 *
 * app 直下に置くのは Next の決まり (docs: manifest.json)。[lang] の中には
 * 入れられないので、名前も説明も既定ロケールのものを 1 つだけ持つ。
 * start_url を "/" にしておけば、proxy.ts が Accept-Language と cookie で
 * 振り分けてくれるので、開き直したときの言語は本人の設定に従う。
 * proxy の matcher は拡張子付きのパスを素通しするため、
 * /manifest.webmanifest 自体はリダイレクトに巻き込まれない。
 *
 * Service Worker は置いていないので、これはオフライン対応ではなく
 * 「アイコンとスタンドアロン表示」まで。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE.brand,
    short_name: SITE.brand,
    description: SITE.description[DEFAULT_LOCALE],
    lang: DEFAULT_LOCALE,
    start_url: "/",
    scope: "/",
    display: "standalone",
    // スプラッシュと標準の色。マニフェストは 1 色しか持てないので、
    // 明るいほうの --background に合わせる (globals.css)。
    // 端末のテーマに追随する theme-color は layout.tsx の viewport が出す。
    background_color: "#fbf3f5",
    theme_color: "#fbf3f5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // 同じ絵を maskable としても出す。Android が最も攻めた円マスク
        // (直径 80%) で切っても顔は内側に収まりきるので、余白を足した
        // 別の絵を用意しなくていい。落ちるのは幹の地肌だけ。
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
