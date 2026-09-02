import type { NextConfig } from "next";
import { OG_IMAGE_HOSTS } from "./src/lib/output/images";
import { SPOTIFY_IMAGE_HOSTS } from "./src/lib/spotify/images";

const nextConfig: NextConfig = {
  images: {
    // Output の一覧に敷く外部サムネイルと、About のジャケット画像。
    // 許可ホストは lib 側と共有する。
    remotePatterns: [...OG_IMAGE_HOSTS, ...SPOTIFY_IMAGE_HOSTS].map(
      (hostname) => ({
        protocol: "https" as const,
        hostname,
      }),
    ),
  },

  /**
   * 記事の実体 (content/articles/*.md) と本文中の画像を、サーバー側の
   * バンドルに同梱させる。
   *
   * .md はどこからも import されないのでバンドラのグラフに載らず、
   * @vercel/nft は join(process.cwd(), "content", "articles") を追えない。
   * そして /output は完全な静的ページではなく ISR (lib/output/* の
   * per-fetch revalidate: 3600 がページに伝播している) なので、
   * **デプロイの 1 時間後にサーバー上で再レンダリングされ、そこで .md を読む**。
   * これが無いと next build もデプロイ直後も正常なのに、1 時間後に
   * /output だけが 500 になる。
   *
   * キーはルートの一部として照合される (picomatch の contains) ので、
   * [lang] を含めて書かないこと ── [lang] は文字クラスとして解釈される。
   */
  outputFileTracingIncludes: {
    "/output": ["./content/articles/**/*"],
    "/blog": [
      "./content/articles/**/*",
      "./public/articles/**/*",
      // 記事の OG 画像が名乗りの前に置く顔写真。
      "./public/profile-og.png",
    ],
  },
};

export default nextConfig;
