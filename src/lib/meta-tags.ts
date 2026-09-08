/**
 * 他所のページの `<head>` から meta を拾う層。
 *
 * /output のサムネイル取得 (lib/output/ogp.ts) と本文のリンクカード
 * (lib/articles/link-card.ts) の両方が読む。前者は og:image だけ、後者は
 * title / description / site_name も要る ── 欲しい値は違うが「head を取って
 * meta を舐める」ところは同じなので、正規表現とエンティティの復号をここに一本化する。
 *
 * 取れなかったときに undefined へ潰すのは呼ぶ側ではなくここの仕事。
 * 一覧も記事も、他所のサイトが落ちているせいで出なくなってはいけない。
 */

/** `<head>` だけ見れば足りるので、本文まで正規表現を走らせない。 */
const HEAD_END = "</head>";

/**
 * 1 ページに費やす上限。
 *
 * ビルド時に直列ではなく並列で叩くとはいえ、記事の中のリンクの数だけ他所の
 * サイトに依存する。応答しないサイトが 1 つあるだけでビルドが止まらないよう、
 * 待つ時間と読むバイト数の両方に蓋をする。
 * `</head>` はたいてい数十 KB 以内に現れるので、256KB あれば足りる。
 */
const TIMEOUT_MS = 5_000;
const MAX_BYTES = 256 * 1024;

/** 素の fetch だと bot 扱いで OGP を返さないサイトがあるため名乗る。 */
const USER_AGENT = "Mozilla/5.0 (compatible; riochin.dev)";

const META_TAG = /<meta\s[^>]*>/gi;
const TITLE_TAG = /<title[^>]*>([\s\S]*?)<\/title>/i;
const CHARSET = /charset\s*=\s*"?([\w-]+)"?/i;

const ATTR = (name: string) =>
  new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");

const PROPERTY = ATTR("(?:property|name)");
const CONTENT = ATTR("content");

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

/**
 * HTML のエンティティを戻す。
 *
 * og:image は URL なので &amp; さえ戻れば足りたが、リンクカードが読むのは
 * タイトルと説明文 ── 地の文なので数値参照 (&#8212; など) も普通に来る。
 */
export function decodeEntities(value: string): string {
  return value.replace(
    /&(?:#x([0-9a-f]+)|#(\d+)|[a-z]+|#\d+);/gi,
    (match, hex?: string, dec?: string) => {
      if (hex ?? dec) {
        const code = Number.parseInt(hex ?? dec!, hex ? 16 : 10);
        // 不正な符号位置は素通しする。壊れた 1 文字のために全体を捨てない。
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      return NAMED_ENTITIES[match.toLowerCase()] ?? match;
    },
  );
}

const attrValue = (tag: string, pattern: RegExp) => {
  const m = tag.match(pattern);
  if (!m) return undefined;
  return decodeEntities(m[2] ?? m[3] ?? "");
};

/**
 * Content-Type の charset で本文を解く。
 *
 * res.text() は自前でこれをやってくれるが、`</head>` で読むのを止めるために
 * ストリームを自分で回すので、ここでも同じ判断が要る。未知の名前を
 * TextDecoder に渡すと例外になるため utf-8 に落とす。
 */
function decoderFor(contentType: string | null): TextDecoder {
  const label = contentType?.match(CHARSET)?.[1];
  if (!label) return new TextDecoder();
  try {
    return new TextDecoder(label);
  } catch {
    return new TextDecoder();
  }
}

/** `</head>` まで、または上限バイトまで読む。 */
async function readHead(res: Response): Promise<string> {
  const decoder = decoderFor(res.headers.get("content-type"));
  const body = res.body;

  if (!body) {
    const html = await res.text();
    const end = html.indexOf(HEAD_END);
    return end === -1 ? html : html.slice(0, end);
  }

  const reader = body.getReader();
  let html = "";
  let bytes = 0;
  try {
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      const end = html.indexOf(HEAD_END);
      if (end !== -1) return html.slice(0, end);
    }
    return html;
  } finally {
    // 途中で切り上げたぶんの接続を明示的に閉じる。
    await reader.cancel().catch(() => {});
  }
}

export type HeadMeta = {
  /** property / name を小文字にしたものがキー、content が値。 */
  readonly meta: ReadonlyMap<string, string>;
  /** `<title>` の中身。og:title を持たないサイトのフォールバック。 */
  readonly title?: string;
};

/**
 * キャッシュの方針は呼ぶ側で決める。
 * /output は ISR に合わせて revalidate、記事はビルド時に焼き切るので force-cache。
 */
export type FetchPolicy = {
  readonly cache?: RequestCache;
  readonly revalidate?: number;
};

/** ページの `<head>` の meta と title。取れなければ undefined。 */
export async function fetchHeadMeta(
  url: string,
  policy: FetchPolicy = {},
  /** 失敗をログに出すときの名乗り。どの機能の取得がこけたか分かるように。 */
  label = "meta",
): Promise<HeadMeta | undefined> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(policy.cache ? { cache: policy.cache } : {}),
      ...(policy.revalidate === undefined
        ? {}
        : { next: { revalidate: policy.revalidate } }),
    });
    if (!res.ok) return undefined;

    const head = await readHead(res);

    const meta = new Map<string, string>();
    for (const tag of head.match(META_TAG) ?? []) {
      const property = attrValue(tag, PROPERTY)?.toLowerCase();
      const content = attrValue(tag, CONTENT);
      if (!property || !content) continue;
      // 同じ property が並ぶことがある (og:image が複数など)。先頭を採る。
      if (!meta.has(property)) meta.set(property, content);
    }

    const title = decodeEntities(head.match(TITLE_TAG)?.[1] ?? "").trim();

    return { meta, title: title || undefined };
  } catch (error) {
    console.error(`[${label}] head fetch failed for ${url}:`, error);
    return undefined;
  }
}
