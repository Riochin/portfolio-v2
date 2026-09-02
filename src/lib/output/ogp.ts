import { REVALIDATE_SECONDS } from "./config";
import { allowImageUrl } from "./images";

/** <head> だけ見れば足りるので、本文まで正規表現を走らせない。 */
const HEAD_END = "</head>";

const META_TAG = /<meta\s[^>]*>/gi;
const ATTR = (name: string) =>
  new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");

const PROPERTY = ATTR("(?:property|name)");
const CONTENT = ATTR("content");

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

const decode = (value: string) =>
  value.replace(/&(?:amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m] ?? m);

const attrValue = (tag: string, pattern: RegExp) => {
  const m = tag.match(pattern);
  if (!m) return undefined;
  return decode(m[2] ?? m[3] ?? "");
};

/**
 * ページの HTML から og:image を拾う。
 * フィードがサムネイルを持たないソース (Qiita) 用のフォールバック。
 * 取れなくても一覧は出したいので、失敗は undefined に潰す。
 */
export async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      // 素の fetch だと bot 扱いで OGP を返さないサイトがあるため UA を名乗る
      headers: { "user-agent": "Mozilla/5.0 (compatible; riochin.dev)" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const headEnd = html.indexOf(HEAD_END);
    const head = headEnd === -1 ? html : html.slice(0, headEnd);

    let fallback: string | undefined;
    for (const tag of head.match(META_TAG) ?? []) {
      const property = attrValue(tag, PROPERTY)?.toLowerCase();
      if (property !== "og:image" && property !== "twitter:image") continue;
      const content = allowImageUrl(attrValue(tag, CONTENT));
      if (!content) continue;
      if (property === "og:image") return content;
      fallback ??= content;
    }
    return fallback;
  } catch (error) {
    console.error(`[output] og:image fetch failed for ${url}:`, error);
    return undefined;
  }
}
