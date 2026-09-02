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

/**
 * 打ち切りページ数。
 *
 * Atom は 1 ページ 17 件で、`?page=N` で続きが取れる。最後のページの次は
 * entry が 0 件で返るのでそこで止まるが、フィードの仕様が変わって
 * 常に埋まったページを返すようになったときのために上限も持たせておく。
 */
const MAX_PAGES = 10;

/**
 * デッキページに埋まっている JSON-LD。
 *
 * Atom の <published> は「SpeakerDeck にアップロードした時刻」で、
 * SpeakerDeck 上に表示される発表日とは別物 (過去の発表を後からまとめて上げると
 * 全部その日になる)。実際 25 件中 11 件がずれていて、『ジョジョ』と私 は
 * 2024-06-07 の発表なのに <published> は 2026-07-11 になっている。
 * 発表日は JSON-LD の datePublished にだけ入っているのでそこから拾う。
 */
const LD_JSON =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;

/** datePublished は日付だけ ("2025-06-05")。時刻は持っていない。 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * デッキページから発表日を拾う。
 * 取れなくても一覧は出したいので、失敗は undefined に潰して
 * 呼び出し側で <published> にフォールバックさせる。
 */
async function fetchDeckDate(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      // 素の fetch だと bot 扱いされることがあるので UA を名乗る (ogp.ts と同じ)
      headers: { "user-agent": "Mozilla/5.0 (compatible; riochin.dev)" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return undefined;
    const match = (await res.text()).match(LD_JSON);
    if (!match) return undefined;
    const { datePublished } = JSON.parse(match[1]) as { datePublished?: string };
    return datePublished && DATE_ONLY.test(datePublished)
      ? datePublished
      : undefined;
  } catch (error) {
    console.error(`[output] SpeakerDeck date fetch failed for ${url}:`, error);
    return undefined;
  }
}

/** `?page=N` の 1 ページぶん。末尾に到達していれば空配列。 */
async function fetchPage(page: number): Promise<AtomEntry[]> {
  const url = new URL(`https://speakerdeck.com/${SPEAKERDECK_USER}.atom`);
  // page=1 でもクエリを付ける。付けても結果は同じで、URL の形が
  // 全ページで揃うぶんキャッシュのキーが読みやすい。
  url.searchParams.set("page", String(page));

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new Error(`SpeakerDeck fetch failed (page ${page}): ${res.status}`);
  }
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(await res.text());
  const entry = feed?.feed?.entry;
  if (!entry) return [];
  return Array.isArray(entry) ? entry : [entry];
}

export async function fetchSpeakerDeckItems(): Promise<OutputItem[]> {
  const entries: AtomEntry[] = [];
  // 総ページ数がフィードに書かれていないので、空ページに当たるまで順に辿る。
  // 直列だが実際は数ページで、しかも fetch は revalidate 付きでキャッシュされる。
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const pageEntries = await fetchPage(page);
    if (pageEntries.length === 0) break;
    entries.push(...pageEntries);
  }

  const items = entries
    .filter((entry) => !String(entry.title).includes(PRODUCT_TITLE_SEPARATOR))
    .map((entry): OutputItem => {
      const link = Array.isArray(entry.link) ? entry.link[0] : entry.link;
      return {
        source: "speakerdeck" as const,
        title: String(entry.title),
        url: link["@_href"],
        publishedAt: entry.published,
        thumbnail: allowImageUrl(entry["media:thumbnail"]?.["@_url"]),
      };
    });

  // ページを跨いで取るあいだに新しいスライドが増えると 1 件ぶん後ろにずれ、
  // 同じスライドが 2 ページに現れることがある。URL で畳んでおく
  // (一覧の key が URL なので、重複したまま渡すと React が警告を出す)。
  const unique = [...new Map(items.map((item) => [item.url, item])).values()];

  // 発表日はフィードに無いので 1 件 1 リクエストで拾いにいく。
  // fetch は revalidate 付きでキャッシュされるので、実際に叩くのは失効時だけ。
  return Promise.all(
    unique.map(async (item) => ({
      ...item,
      publishedAt: (await fetchDeckDate(item.url)) ?? item.publishedAt,
    })),
  );
}
