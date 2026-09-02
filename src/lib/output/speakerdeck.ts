import { XMLParser } from "fast-xml-parser";
import { SPEAKERDECK_USER, REVALIDATE_SECONDS } from "./config";
import { allowImageUrl } from "./images";
import type { OutputItem } from "./types";

type AtomEntry = {
  title: string;
  link: { "@_href": string } | { "@_href": string }[];
  published: string;
  /** スライド 1 枚目のプレビュー画像。名前空間付きなのでキーもそのまま。 */
  "media:thumbnail"?: { "@_url"?: string };
};

/**
 * プロダクト紹介のスライドは Works 側で扱うので Output には出さない。
 * 判定はタイトルの命名規則: 紹介スライドだけが
 * `Nemmy - THE HACK 2026` のように「作品名 - 出展先」を半角ハイフンで繋ぐ。
 * (登壇スライドのタイトルにこの区切りは出てこない)
 */
const PRODUCT_TITLE_SEPARATOR = " - ";

export async function fetchSpeakerDeckItems(): Promise<OutputItem[]> {
  const res = await fetch(`https://speakerdeck.com/${SPEAKERDECK_USER}.atom`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`SpeakerDeck fetch failed: ${res.status}`);
  }
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(xml);
  const entries: AtomEntry[] = feed?.feed?.entry
    ? Array.isArray(feed.feed.entry)
      ? feed.feed.entry
      : [feed.feed.entry]
    : [];

  return entries
    .filter((entry) => !String(entry.title).includes(PRODUCT_TITLE_SEPARATOR))
    .map((entry) => {
      const link = Array.isArray(entry.link) ? entry.link[0] : entry.link;
      return {
        source: "speakerdeck" as const,
        title: String(entry.title),
        url: link["@_href"],
        publishedAt: entry.published,
        thumbnail: allowImageUrl(entry["media:thumbnail"]?.["@_url"]),
      };
    });
}
