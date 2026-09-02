import type { Metadata } from "next";
import { getT } from "./server";
import { alternates } from "./paths";
import { OG_LOCALE } from "./config";
import type { Localized } from "./types";

/**
 * ページ単位の metadata を組み立てる。
 * タイトルは DICT から渡すので、opengraph-image.tsx と同じ値を読むことになり
 * 文字列の二重管理が起きない。
 */
export async function buildPageMetadata(opts: {
  /** ロケール接頭辞なしのパス。例: "/works" */
  path: string;
  title: Localized<string>;
  description?: Localized<string>;
}): Promise<Metadata> {
  const { locale, t } = await getT();
  const alts = alternates(locale, opts.path);

  return {
    title: t(opts.title),
    description: opts.description ? t(opts.description) : undefined,
    alternates: alts,
    openGraph: {
      title: t(opts.title),
      description: opts.description ? t(opts.description) : undefined,
      locale: OG_LOCALE[locale],
      url: alts.canonical,
    },
  };
}
