import type { MetadataRoute } from "next";
import { SITE, NAV_ITEMS } from "@/data/site";
import { getWorkSlugs } from "@/data";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/paths";

/** ロケール接頭辞なしの全パス。 */
function allPaths(): string[] {
  return [
    "/",
    ...NAV_ITEMS.map((item) => item.path),
    ...getWorkSlugs().map((slug) => `/works/${slug}`),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return allPaths().flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE.url}${localePath(locale, path)}`,
      alternates: {
        languages: {
          ...Object.fromEntries(
            LOCALES.map((l) => [l, `${SITE.url}${localePath(l, path)}`]),
          ),
          "x-default": `${SITE.url}${localePath(DEFAULT_LOCALE, path)}`,
        },
      },
    })),
  );
}
