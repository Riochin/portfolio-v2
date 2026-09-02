import { QIITA_USER, REVALIDATE_SECONDS } from "./config";
import type { OutputItem } from "./types";

type QiitaItem = {
  title: string;
  url: string;
  created_at: string;
};

export async function fetchQiitaItems(): Promise<OutputItem[]> {
  const res = await fetch(
    `https://qiita.com/api/v2/items?query=user:${QIITA_USER}&per_page=100`,
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
  if (!res.ok) {
    throw new Error(`Qiita fetch failed: ${res.status}`);
  }
  const items: QiitaItem[] = await res.json();

  return items.map((item) => ({
    source: "qiita" as const,
    title: item.title,
    url: item.url,
    publishedAt: item.created_at,
  }));
}
