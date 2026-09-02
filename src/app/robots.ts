import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // どちらも dev 専用の道具。本番では 404 になるが、念のため巡回もさせない。
    rules: { userAgent: "*", allow: "/", disallow: ["/hero-capture", "/studio"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
