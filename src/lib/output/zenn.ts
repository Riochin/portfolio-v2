import { XMLParser } from "fast-xml-parser";
import { ZENN_USER, REVALIDATE_SECONDS } from "./config";
import { allowImageUrl } from "./images";
import type { OutputItem } from "./types";

type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  /** Zenn は OGP 画像を enclosure に入れてくる。 */
  enclosure?: { "@_url"?: string };
};

export async function fetchZennItems(): Promise<OutputItem[]> {
  const res = await fetch(`https://zenn.dev/${ZENN_USER}/feed`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Zenn fetch failed: ${res.status}`);
  }
  const xml = await res.text();
  // enclosure の url は属性なので、属性を捨てない設定で読む
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(xml);
  const items: RssItem[] = feed?.rss?.channel?.item
    ? Array.isArray(feed.rss.channel.item)
      ? feed.rss.channel.item
      : [feed.rss.channel.item]
    : [];

  return items.map((item) => ({
    source: "zenn" as const,
    title: String(item.title),
    url: item.link,
    publishedAt: new Date(item.pubDate).toISOString(),
    thumbnail: allowImageUrl(item.enclosure?.["@_url"]),
  }));
}
