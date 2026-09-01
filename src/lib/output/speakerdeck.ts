import { XMLParser } from "fast-xml-parser";
import { SPEAKERDECK_USER, REVALIDATE_SECONDS } from "./config";
import type { OutputItem } from "./types";

type AtomEntry = {
  title: string;
  link: { "@_href": string } | { "@_href": string }[];
  published: string;
};

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

  return entries.map((entry) => {
    const link = Array.isArray(entry.link) ? entry.link[0] : entry.link;
    return {
      source: "speakerdeck" as const,
      title: String(entry.title),
      url: link["@_href"],
      publishedAt: entry.published,
    };
  });
}
