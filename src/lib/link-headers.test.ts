import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { linkHeaders, linkValue } from "@/lib/link-headers";

/**
 * Link レスポンスヘッダー (RFC 8288)。isitagentready.com はトップの
 * レスポンスに機械向けの資源を指す Link があるかを見る。
 */

/** link-value を 1 本ずつに割る。URI 参照の中にカンマは無い前提。 */
function split(value: string): string[] {
  return value.split(/,\s*/);
}

/** RFC 8288 §3 の link-value: `<URI-Reference>` に `; name="value"` が続く。 */
const LINK_VALUE = /^<[^<>\s]+>(?:; [a-z]+="[^"]*")+$/;

describe("linkValue", () => {
  it("記事に sitemap・describedby・Markdown 版・別ロケール版を並べる", () => {
    expect(split(linkValue("ja", "/blog/:slug"))).toEqual([
      `</sitemap.xml>; rel="sitemap"`,
      `</llms.txt>; rel="describedby"; type="text/plain"`,
      `</ja/blog/:slug>; rel="alternate"; type="text/markdown"`,
      `</en/blog/:slug>; rel="alternate"; hreflang="en"`,
    ]);
  });

  it("トップは接頭辞だけの URL を指す", () => {
    const links = split(linkValue("en", "/"));
    expect(links).toContain(`</en>; rel="alternate"; type="text/markdown"`);
    expect(links).toContain(`</ja>; rel="alternate"; hreflang="ja"`);
  });
});

describe("linkHeaders", () => {
  const rules = linkHeaders();

  it("トップ・ブログ一覧・記事を両ロケールで覆う", () => {
    expect(rules.map((r) => r.source)).toEqual([
      "/",
      "/ja",
      "/ja/output",
      "/ja/blog/:slug",
      "/en",
      "/en/output",
      "/en/blog/:slug",
    ]);
  });

  it("どの値も RFC 8288 の書式で、rel は登録済みのものだけ", () => {
    const registered = new Set(["sitemap", "describedby", "alternate"]);
    for (const { headers } of rules) {
      for (const { key, value } of headers) {
        expect(key).toBe("Link");
        for (const link of split(value)) {
          expect(link).toMatch(LINK_VALUE);
          const rel = /; rel="([^"]+)"/.exec(link)?.[1];
          expect(registered.has(rel ?? "")).toBe(true);
        }
      }
    }
  });

  it("リダイレクト前の / にもサイト全体の分は付ける", () => {
    expect(split(rules[0].headers[0].value)).toEqual([
      `</sitemap.xml>; rel="sitemap"`,
      `</llms.txt>; rel="describedby"; type="text/plain"`,
    ]);
  });

  it("next.config の headers() がこれを返す", async () => {
    expect(await nextConfig.headers?.()).toEqual(rules);
  });
});
