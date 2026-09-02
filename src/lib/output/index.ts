import { fetchSpeakerDeckItems } from "./speakerdeck";
import { fetchZennItems } from "./zenn";
import { fetchQiitaItems } from "./qiita";
import { fetchOgImage } from "./ogp";
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

export async function getOutputItems(): Promise<OutputData> {
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
    articles: articlesWithThumbnails.sort(byDateDesc),
  };
}
