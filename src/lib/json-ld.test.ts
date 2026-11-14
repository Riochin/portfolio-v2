import { describe, expect, it } from "vitest";

import { ABOUT } from "@/data/about";
import { SITE } from "@/data/site";
import { articleExcerpt } from "@/lib/articles/excerpt";
import type { Article } from "@/lib/articles/types";
import {
  PERSON_ID,
  SAME_AS,
  WEBSITE_ID,
  blogPostingJsonLd,
  homeJsonLd,
  serializeJsonLd,
} from "@/lib/json-ld";

const article: Article = {
  slug: "hello",
  title: "ブログをはじめました！",
  publishedAt: "2026-09-03",
  markdown: "## 見出し\n\n<br />\n\n[サイト](https://example.com)を**公開**しました。",
};

type Node = Record<string, unknown>;
const graphOf = (locale: "ja" | "en") =>
  (homeJsonLd(locale) as unknown as { "@graph": Node[] })["@graph"];

describe("homeJsonLd", () => {
  it("Person と WebSite を @graph に並べる", () => {
    const data = homeJsonLd("ja");
    expect(data["@context"]).toBe("https://schema.org");
    expect(graphOf("ja").map((node) => node["@type"])).toEqual([
      "Person",
      "WebSite",
    ]);
  });

  it("Person はロケールの文言を使い、プロフィールを sameAs に並べる", () => {
    const [person] = graphOf("en");
    expect(person).toMatchObject({
      "@id": PERSON_ID,
      name: SITE.name,
      description: ABOUT.summary.en,
      url: "https://riochin.dev/en",
      image: "https://riochin.dev/profile.webp",
      jobTitle: "Software engineer",
    });
    expect(SAME_AS).toContain("https://github.com/riochin");
    expect(SAME_AS).toContain("https://x.com/riochin");
    expect(SAME_AS.every((url) => url.startsWith("https://"))).toBe(true);
  });

  it("WebSite はロケールごとの URL と言語を持ち、Person を指す", () => {
    const [, site] = graphOf("ja");
    expect(site).toMatchObject({
      "@id": WEBSITE_ID,
      name: SITE.brand,
      description: SITE.description.ja,
      url: "https://riochin.dev/ja",
      inLanguage: "ja",
      publisher: { "@id": PERSON_ID },
    });
  });
});

describe("blogPostingJsonLd", () => {
  it("記事の題・日付・URL・著者を入れる", () => {
    expect(blogPostingJsonLd(article, "ja")).toMatchObject({
      "@type": "BlogPosting",
      headline: "ブログをはじめました！",
      description: "サイトを公開しました。",
      datePublished: "2026-09-03",
      dateModified: "2026-09-03",
      url: "https://riochin.dev/ja/blog/hello",
      image: "https://riochin.dev/ja/blog/hello/opengraph-image",
      author: { "@type": "Person", "@id": PERSON_ID, name: SITE.name },
      isPartOf: { "@id": WEBSITE_ID },
    });
  });

  it("/en で開いても記事の言語は ja", () => {
    const data = blogPostingJsonLd(article, "en") as unknown as Node;
    expect(data.inLanguage).toBe("ja");
    expect(data.url).toBe("https://riochin.dev/en/blog/hello");
  });

  it("本文に地の文が無ければ description を出さない", () => {
    const data = blogPostingJsonLd(
      { ...article, markdown: "## 見出しだけ\n\n<br />" },
      "ja",
    ) as unknown as Node;
    expect(data).not.toHaveProperty("description");
  });
});

describe("serializeJsonLd", () => {
  it("< を \\u003c にして script から抜け出せないようにする", () => {
    const json = serializeJsonLd(
      blogPostingJsonLd({ ...article, title: "</script><b>x</b>" }, "ja"),
    );
    expect(json).not.toContain("<");
    expect(json).toContain("\\u003c/script>");
    expect(JSON.parse(json).headline).toBe("</script><b>x</b>");
  });
});

describe("articleExcerpt", () => {
  it("見出し・HTML の行・コードを飛ばし、記法を外す", () => {
    const markdown = [
      "## 長年の夢",
      "<br />",
      "```ts",
      "const x = 1;",
      "```",
      "![画像](/a.png)",
      "[初めてのサイト](https://example.com)を公開した頃から、ずっ&#x3068;**憧れ**がありました。",
    ].join("\n");
    expect(articleExcerpt(markdown)).toBe(
      "初めてのサイトを公開した頃から、ずっと憧れがありました。",
    );
  });

  it("長ければ 120 字で切って … を付ける", () => {
    const excerpt = articleExcerpt("あ".repeat(200));
    expect(Array.from(excerpt)).toHaveLength(121);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});
