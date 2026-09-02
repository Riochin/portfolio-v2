import { getPublishedArticles } from "@/lib/articles";
import { localePath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/config";
import type { OutputItem } from "./types";

/**
 * このサイト自身に書いた記事を、外部フィードと同じ形に均す。
 *
 * ここだけロケールを引数に取る。src/lib/articles/ は OG 画像から呼べるよう
 * ロケール非依存を守る必要があるが、リンク先はロケール接頭辞付きでなければ
 * ならないので、その変換をこの層で閉じる。
 *
 * サムネイルは記事自身の OG 画像ルート。1200x630 なので、既に Zenn / Qiita に
 * 使っている aspect-[1200/630] とそのまま揃い、Articles の行が崩れない。
 */
export function getSelfOutputItems(locale: Locale): OutputItem[] {
  return getPublishedArticles().map((article) => ({
    source: "self",
    title: article.title,
    url: localePath(locale, `/blog/${article.slug}`),
    publishedAt: article.publishedAt,
    thumbnail: localePath(locale, `/blog/${article.slug}/opengraph-image`),
  }));
}
