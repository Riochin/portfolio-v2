import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/hero-capture" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
