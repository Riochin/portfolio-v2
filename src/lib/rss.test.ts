import { describe, expect, it } from "vitest";
import { XMLParser } from "fast-xml-parser";

import { buildRss, toRfc822 } from "./rss";

const parse = (xml: string) => new XMLParser({ ignoreAttributes: false }).parse(xml);

describe("buildRss", () => {
  it("記事を新しい順のまま item にし、リンクは ja の記事ページを指す", () => {
    const xml = buildRss([
      { slug: "second", title: "2 本目", publishedAt: "2026-10-19" },
      { slug: "hello", title: "はじめまして", publishedAt: "2026-09-03" },
    ]);
    const { channel } = parse(xml).rss;

    expect(channel.item.map((i: { link: string }) => i.link)).toEqual([
      "https://riochin.dev/ja/blog/second",
      "https://riochin.dev/ja/blog/hello",
    ]);
    expect(channel.lastBuildDate).toBe(toRfc822("2026-10-19"));
  });

  it("タイトルの記号をエスケープし、XML として壊れない", () => {
    const xml = buildRss([
      { slug: "amp", title: `A & B <C> "D"`, publishedAt: "2026-09-03" },
    ]);

    expect(xml).toContain("<title>A &amp; B &lt;C&gt; &quot;D&quot;</title>");
    // パーサーが読み戻すと元の文字列に戻る。
    expect(parse(xml).rss.channel.item.title).toBe(`A & B <C> "D"`);
  });

  it("記事が無くても channel だけの正しいフィードになる", () => {
    const { channel } = parse(buildRss([])).rss;

    expect(channel.title).toBe("Riochin");
    expect(channel.item).toBeUndefined();
    expect(channel.lastBuildDate).toBeUndefined();
  });
});

describe("toRfc822", () => {
  it("公開日を日本時間の 0 時として扱う", () => {
    expect(toRfc822("2026-09-03")).toBe("Wed, 02 Sep 2026 15:00:00 GMT");
  });
});
