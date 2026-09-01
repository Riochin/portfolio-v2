import { XMLParser } from "fast-xml-parser";
import { ZENN_USER, REVALIDATE_SECONDS } from "./config";
import type { OutputItem } from "./types";

type RssItem = {
  title: string;
  link: string;
  pubDate: string;
};

export async function fetchZennItems(): Promise<OutputItem[]> {
  const res = await fetch(`https://zenn.dev/${ZENN_USER}/feed`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Zenn fetch failed: ${res.status}`);
  }
  const xml = await res.text();
  const parser = new XMLParser();
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
  }));
}
