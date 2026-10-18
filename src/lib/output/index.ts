import { fetchSpeakerDeckItems } from "./speakerdeck";
import { fetchZennItems } from "./zenn";
import { fetchQiitaItems } from "./qiita";
import { fetchOgImage } from "./ogp";
import { getSelfOutputItems } from "./self";
import type { Locale } from "@/lib/i18n/config";
import type { OutputItem } from "./types";

const byDateDesc = (a: OutputItem, b: OutputItem) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

/**
 * フィードがサムネイルを持たなかったぶんだけ、記事ページの og:image で埋める。
 * (Qiita の API は画像を返さないのでここが効く)
 * 1 件 1 リクエストになるが、fetch は revalidate 付きでキャッシュされる。
 */
async function withThumbnails(items: OutputItem[]): Promise<OutputItem[]> {
  return Promise.all(
    items.map(async (item) =>
      item.thumbnail
        ? item
        : { ...item, thumbnail: await fetchOgImage(item.url) },
    ),
  );
}

export type OutputData = {
  talks: OutputItem[];
  articles: OutputItem[];
};

/**
 * locale を取るのは自前記事のリンク先を組み立てるためだけ。
 * 呼び出し元は /[lang]/output/page.tsx とトップ (getRecentOutputs) だけなので、
 * src/data/ のアクセサ層に課している「同期・ロケール非依存」の制約はここには及ばない。
 */
export async function getOutputItems(locale: Locale): Promise<OutputData> {
  const [speakerdeck, zenn, qiita] = await Promise.allSettled([
    fetchSpeakerDeckItems(),
    fetchZennItems(),
    fetchQiitaItems(),
  ]);

  for (const result of [speakerdeck, zenn, qiita]) {
    if (result.status === "rejected") {
      console.error("[output] source fetch failed:", result.reason);
    }
  }

  const talks =
    speakerdeck.status === "fulfilled" ? [...speakerdeck.value] : [];
  const articles = [
    ...(zenn.status === "fulfilled" ? zenn.value : []),
    ...(qiita.status === "fulfilled" ? qiita.value : []),
  ];

  const [talksWithThumbnails, articlesWithThumbnails] = await Promise.all([
    withThumbnails(talks),
    withThumbnails(articles),
  ]);

  return {
    talks: talksWithThumbnails.sort(byDateDesc),
    // 自前記事は withThumbnails の「後」に合流させる。前に入れると、
    // サムネイルを持っている扱いにならず fetchOgImage() がビルド中に
    // 自分のサイトを取りに行ってしまう (まだ起動していない)。
    articles: [...articlesWithThumbnails, ...getSelfOutputItems(locale)].sort(
      byDateDesc,
    ),
  };
}

/**
 * トップの Recent talks / Recent articles 用。どちらも新しい順に、counts の件数だけ。
 *
 * サムネイルを出すのは talks だけ (articles は文字だけのリスト)。
 * getOutputItems() を通すと全件ぶん og:image を取りに行くので、ここでは
 * 切り出した talks だけを withThumbnails() に通す。Speaker Deck はフィードが
 * 画像を持っているので、ふだんは追加のリクエストは起きない。
 */
export async function getRecentOutputs(
  locale: Locale,
  counts: { talks: number; articles: number },
): Promise<OutputData> {
  const [speakerdeck, zenn, qiita] = await Promise.allSettled([
    fetchSpeakerDeckItems(),
    fetchZennItems(),
    fetchQiitaItems(),
  ]);

  for (const result of [speakerdeck, zenn, qiita]) {
    if (result.status === "rejected") {
      console.error("[output] source fetch failed:", result.reason);
    }
  }

  return {
    talks: await withThumbnails(
      (speakerdeck.status === "fulfilled" ? [...speakerdeck.value] : [])
        .sort(byDateDesc)
        .slice(0, counts.talks),
    ),
    articles: [
      ...(zenn.status === "fulfilled" ? zenn.value : []),
      ...(qiita.status === "fulfilled" ? qiita.value : []),
      ...getSelfOutputItems(locale),
    ]
      .sort(byDateDesc)
      .slice(0, counts.articles),
  };
}
