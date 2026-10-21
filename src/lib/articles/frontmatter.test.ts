import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  isValidSlug,
  isYearMonthDay,
  parseArticleFile,
  serializeArticleFile,
} from "@/lib/articles/frontmatter";

describe("serializeArticleFile", () => {
  it("書き出しの形を固定する (コミット済みの .md の diff に効く)", () => {
    expect(
      serializeArticleFile(
        { title: "タイトル: 記号 # と \"引用\" 入り", publishedAt: "2026-09-03" },
        "\n本文\n\n",
      ),
    ).toBe(
      [
        "---",
        'title: "タイトル: 記号 # と \\"引用\\" 入り"',
        'publishedAt: "2026-09-03"',
        "draft: false",
        "---",
        "",
        "本文",
        "",
      ].join("\n"),
    );
  });

  it("長いタイトルを折り返さない", () => {
    const title = "あ".repeat(200);
    const file = serializeArticleFile({ title, publishedAt: "2026-09-03" }, "");
    expect(file).toContain(`title: "${title}"\n`);
  });
});

describe("parseArticleFile", () => {
  it("書き出したものを読み戻すと同じになる", () => {
    const frontmatter = {
      title: "タイトル: 記号 # と \"引用\" 入り",
      publishedAt: "2026-09-03",
      draft: true,
    } as const;
    const file = serializeArticleFile(frontmatter, "# 本文\n\n段落");

    expect(parseArticleFile(file, "sample")).toEqual({
      slug: "sample",
      ...frontmatter,
      markdown: "# 本文\n\n段落",
    });
  });

  it("引用符の無い日付も Date ではなく文字列のまま読む (yaml の core スキーマ)", () => {
    const article = parseArticleFile(
      "---\ntitle: t\npublishedAt: 2026-09-03\n---\n本文",
      "sample",
    );
    expect(article.publishedAt).toBe("2026-09-03");
  });

  it("draft を書かなければ持たない", () => {
    const article = parseArticleFile(
      '---\ntitle: t\npublishedAt: "2026-09-03"\n---\n',
      "sample",
    );
    expect(article).not.toHaveProperty("draft");
  });

  it("CRLF でも読める", () => {
    const article = parseArticleFile(
      '---\r\ntitle: t\r\npublishedAt: "2026-09-03"\r\n---\r\n本文',
      "sample",
    );
    expect(article.markdown).toBe("本文");
  });

  it.each([
    ["frontmatter が無い", "本文だけ"],
    ["title が空", '---\ntitle: ""\npublishedAt: "2026-09-03"\n---\n'],
    ["実在しない日付", '---\ntitle: t\npublishedAt: "2026-02-31"\n---\n'],
    ["draft が文字列", '---\ntitle: t\npublishedAt: "2026-09-03"\ndraft: "yes"\n---\n'],
    ["object でない", "---\n- a\n---\n"],
  ])("%s なら投げる", (_, raw) => {
    expect(() => parseArticleFile(raw, "sample")).toThrow(/sample\.md/);
  });

  it("content/articles の記事がすべて読める", () => {
    const dir = join(process.cwd(), "content/articles");
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const slug = file.replace(/\.md$/, "");
      expect(isValidSlug(slug), slug).toBe(true);
      expect(() =>
        parseArticleFile(readFileSync(join(dir, file), "utf8"), slug),
      ).not.toThrow();
    }
  });
});

describe("isValidSlug", () => {
  it.each(["hello", "pnpm-npm", "a1-b2", "a".repeat(64)])("%s は通す", (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each([
    "new",
    "a".repeat(65),
    "Hello",
    "-a",
    "a-",
    "a--b",
    "a_b",
    "a.b",
    "../a",
    "",
    1,
    undefined,
  ])("%s は弾く", (slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });
});

describe("isYearMonthDay", () => {
  it.each(["2026-09-03", "2024-02-29"])("%s は通す", (value) => {
    expect(isYearMonthDay(value)).toBe(true);
  });

  it.each(["2026-02-31", "2025-02-29", "2026-13-01", "2026-9-3", "2026/09/03", 20260903])(
    "%s は弾く",
    (value) => {
      expect(isYearMonthDay(value)).toBe(false);
    },
  );
});
