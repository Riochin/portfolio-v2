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
};

export default nextConfig;
