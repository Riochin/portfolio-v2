import type { NextConfig } from "next";
import { OG_IMAGE_HOSTS } from "./src/lib/output/images";

const nextConfig: NextConfig = {
  images: {
    // Output の一覧に敷く外部サムネイル。許可ホストは lib 側と共有する。
    remotePatterns: OG_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
