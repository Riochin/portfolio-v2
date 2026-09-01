import { fetchSpeakerDeckItems } from "./speakerdeck";
import { fetchZennItems } from "./zenn";
import { fetchQiitaItems } from "./qiita";
import type { OutputItem } from "./types";

const byDateDesc = (a: OutputItem, b: OutputItem) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

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

  return {
    talks: talks.sort(byDateDesc),
    articles: articles.sort(byDateDesc),
  };
}
