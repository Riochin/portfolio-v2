import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getOutputItems } from "@/lib/output";
import { fetchQiitaItems } from "@/lib/output/qiita";
import { fetchSpeakerDeckItems } from "@/lib/output/speakerdeck";
import { fetchZennItems } from "@/lib/output/zenn";

/**
 * 外部フィードの読み取り。fast-xml-parser の結果の形 (属性の `@_` 接頭辞、
 * 1 件だけのときに配列にならないこと、名前空間付きのキー) に頼っているので、
 * 実際のフィードを切り詰めた fixture で固定する。ネットワークには出ない。
 *
 * fixture は 2026-10 に本物のフィードから取って件数だけ減らしたもの。
 */

// 自前の記事は content/articles に依存するので外す。
vi.mock("@/lib/output/self", () => ({ getSelfOutputItems: () => [] }));

const fixture = (name: string) =>
  readFileSync(join(__dirname, "__fixtures__", name), "utf8");

const DECK_WITH_DATE =
  "https://speakerdeck.com/riochin/ta-tai-ni-raseru-tenpo-jouhou-saito-o-todokeru-tame-ni-yata-tsu-no-koto";

/** URL ごとの応答。無いものは 404。 */
let routes: Record<string, () => Response>;

beforeEach(() => {
  routes = {
    "https://zenn.dev/riochin/feed": () => new Response(fixture("zenn.rss")),
    "https://speakerdeck.com/riochin.atom?page=1": () =>
      new Response(fixture("speakerdeck-page1.atom")),
    "https://speakerdeck.com/riochin.atom?page=2": () =>
      new Response(fixture("speakerdeck-page2.atom")),
    "https://speakerdeck.com/riochin.atom?page=3": () =>
      new Response(fixture("speakerdeck-page3.atom")),
    [DECK_WITH_DATE]: () =>
      new Response(
        `<html><head><script type="application/ld+json">{"@type":"PresentationDigitalDocument","datePublished":"2026-09-25"}</script></head></html>`,
      ),
    "https://qiita.com/api/v2/items?query=user:riochin&per_page=100": () =>
      Response.json([
        {
          title: "Qiita の記事",
          url: "https://qiita.com/riochin/items/abc",
          created_at: "2026-05-01T10:00:00+09:00",
        },
      ]),
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const route = routes[String(input)];
      return route ? route() : new Response("", { status: 404 });
    }),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Zenn", () => {
  it("RSS の item を OutputItem に直す (enclosure の属性も読む)", async () => {
    const items = await fetchZennItems();
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      source: "zenn",
      title: "レポ：mixi2のインターンに参加しました！",
      url: "https://zenn.dev/riochin/articles/mixi2-intern-2026",
      publishedAt: "2026-10-15T02:09:26.000Z",
      thumbnail: expect.stringMatching(/^https:\/\/res\.cloudinary\.com\/zenn\//),
    });
  });

  it("item が 1 件だけでも配列として扱う", async () => {
    const one = fixture("zenn.rss").replace(/<item>[\s\S]*?<\/item>/, "");
    routes["https://zenn.dev/riochin/feed"] = () => new Response(one);
    expect(await fetchZennItems()).toHaveLength(1);
  });

  it("数字だけのタイトルも文字列で返す", async () => {
    const numeric = fixture("zenn.rss").replace(
      /<title><!\[CDATA\[レポ：mixi2[^\]]*\]\]><\/title>/,
      "<title>2026</title>",
    );
    routes["https://zenn.dev/riochin/feed"] = () => new Response(numeric);
    const [first] = await fetchZennItems();
    expect(first.title).toBe("2026");
  });
});

describe("SpeakerDeck", () => {
  it("空のページまで辿り、紹介スライドを除き、発表日を JSON-LD から取る", async () => {
    const items = await fetchSpeakerDeckItems();
    expect(items.map((i) => [i.title, i.publishedAt])).toEqual([
      // JSON-LD の datePublished が取れたもの
      [
        "絶っっっ対にバズらせる!!!! 〜アケゲー店舗情報サイトを届けるためにやった、３つのこと 〜",
        "2026-09-25",
      ],
      // 取れなければ <published> のまま
      ["乗り越えるゲーム、Getting Over It with Bennet Foddyについて。", "2026-09-10T07:17:34-04:00"],
      // 2 ページ目は entry が 1 件だけ (配列にならない)
      ["初対面からでも、心理的安全性の高いチームを作ろう", "2026-08-26T07:39:14-04:00"],
    ]);
    expect(items[0]).toMatchObject({
      source: "speakerdeck",
      url: DECK_WITH_DATE,
      thumbnail: expect.stringMatching(/^https:\/\/files\.speakerdeck\.com\//),
    });
  });

  it("ページを跨いで同じスライドが出ても 1 件に畳む", async () => {
    routes["https://speakerdeck.com/riochin.atom?page=2"] = () =>
      new Response(fixture("speakerdeck-page1.atom"));
    const items = await fetchSpeakerDeckItems();
    expect(new Set(items.map((i) => i.url)).size).toBe(items.length);
  });
});

describe("Qiita", () => {
  it("API の JSON を OutputItem に直す", async () => {
    expect(await fetchQiitaItems()).toEqual([
      {
        source: "qiita",
        title: "Qiita の記事",
        url: "https://qiita.com/riochin/items/abc",
        publishedAt: "2026-05-01T10:00:00+09:00",
      },
    ]);
  });
});

describe("getOutputItems", () => {
  it("1 つのフィードが落ちても残りは出る", async () => {
    routes["https://zenn.dev/riochin/feed"] = () =>
      new Response("", { status: 500 });

    const { talks, articles } = await getOutputItems("ja");
    expect(talks).toHaveLength(3);
    expect(articles.map((a) => a.source)).toEqual(["qiita"]);
  });

  it("新しい順に並ぶ", async () => {
    const { talks, articles } = await getOutputItems("ja");
    const isDesc = (dates: string[]) =>
      dates.every((d, i) => i === 0 || new Date(dates[i - 1]) >= new Date(d));
    expect(isDesc(talks.map((t) => t.publishedAt))).toBe(true);
    expect(isDesc(articles.map((a) => a.publishedAt))).toBe(true);
    expect(articles.map((a) => a.source)).toEqual(["zenn", "qiita", "zenn"]);
  });
});
