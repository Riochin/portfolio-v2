import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

/**
 * 取得した中身の使い道の宣言 (https://contentsignals.org/)。
 * ポートフォリオなので、検索・AI の回答・AI の学習のどれに使ってもよい。
 */
const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // どちらも dev 専用の道具。本番では 404 になるが、念のため巡回もさせない。
      disallow: ["/hero-capture", "/studio"],
      // Content-Signal は User-Agent グループの中に書く決まり。
      // Next の other はそのグループの末尾に「キー: 値」で出す。
      other: { "Content-Signal": CONTENT_SIGNAL },
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
