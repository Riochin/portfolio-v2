import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownAsync } from "react-markdown";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentPropsWithoutRef } from "react";

import { articleMarkdownOptions } from "@/lib/articles/markdown";

/**
 * 記事本文の変換を、本番と同じ並び (articleMarkdownOptions) のまま通す。
 *
 * react-markdown / remark-gfm / rehype-raw / shiki / unist-util-visit のどれかが
 * 出力の形を変えると、自前の rehype プラグインが黙って効かなくなる
 * (段落がほどけない、カードにならない、色が付かない)。ビルドは通ってしまうので、
 * ここで形を固定しておく。
 */

// サイト内リンクのカードは記事を引きに行く。中身の記事に依存しないよう差し替える。
vi.mock("@/lib/articles", () => ({
  getArticleBySlug: (slug: string) =>
    slug === "sample"
      ? { slug, title: "サンプル記事", publishedAt: "2026-01-02", markdown: "" }
      : undefined,
}));

/**
 * img / a に届いた props を控えておく。
 * MarkdownImage / MarkdownLink は data-* をハイフンのままの prop 名で読むので、
 * それが崩れていないかはここで見る。
 */
const received: { tag: string; props: Record<string, unknown> }[] = [];

/** react-markdown が足す node (hast の要素) は DOM に出さない。 */
function withoutNode<T extends object>(props: T): T {
  const rest = { ...props } as T & { node?: unknown };
  delete rest.node;
  return rest;
}

const components = {
  img: (props: ComponentPropsWithoutRef<"img">) => {
    received.push({ tag: "img", props: { ...props } });
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props をそのまま映すだけ
    return <img {...withoutNode(props)} />;
  },
  a: (props: ComponentPropsWithoutRef<"a">) => {
    received.push({ tag: "a", props: { ...props } });
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- children も props に入っている
    return <a {...withoutNode(props)} />;
  },
};

async function render(markdown: string): Promise<string> {
  const options = await articleMarkdownOptions("ja");
  const element = await MarkdownAsync({
    ...options,
    components,
    children: markdown,
  });
  return renderToStaticMarkup(element);
}

const EXTERNAL_HEAD = `<!doctype html><html><head>
<title>Fallback title</title>
<meta property="og:title" content="外部のページ &amp; タイトル">
<meta property="og:description" content="説明文">
<meta property="og:image" content="http://example.com/og.png">
<meta property="og:site_name" content="Example">
</head><body>本文</body></html>`;

beforeEach(() => {
  received.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url === "https://example.com/page"
        ? new Response(EXTERNAL_HEAD, {
            headers: { "content-type": "text/html; charset=utf-8" },
          })
        : new Response("", { status: 404 }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("見出し", () => {
  it("h1 は h2 に落ちる (ページの h1 はタイトルが持つ)", async () => {
    const html = await render("# 見出し\n\n<h1>生の見出し</h1>");
    expect(html).not.toContain("<h1");
    expect(html).toBe("<h2>見出し</h2>\n<h2>生の見出し</h2>");
  });
});

describe("画像", () => {
  it("画像だけの段落は p が外れ、public/ の実寸が載る", async () => {
    const html = await render("![水面](/water-normals.png)");
    // React 19 が img の手前に preload の link を足すので、img だけを見る
    expect(html).not.toContain("<p>");
    expect(html).toContain('<img src="/water-normals.png" alt="水面" width="512" height="512"/>');
  });

  it("studio が書く生の img も data-scale と title を持ったまま届く", async () => {
    await render('<img src="/water-normals.png" alt="" title="キャプション" data-scale="0.5" />');
    const img = received.find((r) => r.tag === "img");
    expect(img?.props).toMatchObject({
      src: "/water-normals.png",
      title: "キャプション",
      "data-scale": "0.5",
      width: 512,
      height: 512,
    });
  });

  it("public/ の外を指すパスは寸法を読まない", async () => {
    await render("![](/../package.json.png)");
    const img = received.find((r) => r.tag === "img");
    expect(img?.props).not.toHaveProperty("width");
  });
});

describe("リンクカード", () => {
  it("裸の外部 URL だけの行はカードになり、data-card-* がハイフンのまま届く", async () => {
    await render("https://example.com/page");
    const link = received.find((r) => r.tag === "a");
    expect(link?.props).toEqual({
      href: "https://example.com/page",
      "data-card-title": "外部のページ & タイトル",
      "data-card-description": "説明文",
      // http の og:image は https に上がる
      "data-card-image": "https://example.com/og.png",
      "data-card-site": "Example",
      children: "外部のページ & タイトル",
      node: expect.anything(),
    });
  });

  it("<url> と [url](url) も同じくカードになる", async () => {
    await render("<https://example.com/page>\n\n[https://example.com/page](https://example.com/page)");
    const cards = received.filter((r) => r.props["data-card-title"]);
    expect(cards).toHaveLength(2);
    // 同じ URL は 1 回しか取りに行かない
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("サイト内の記事のパスだけの行は、fetch せずにカードになる", async () => {
    await render("/blog/sample");
    const link = received.find((r) => r.tag === "a");
    expect(link?.props).toMatchObject({
      href: "/ja/blog/sample",
      "data-card-title": "サンプル記事",
      "data-card-image": "/ja/blog/sample/opengraph-image",
      "data-card-internal": "true",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("文中のリンクやテキストを書いたリンクはカードにしない", async () => {
    const html = await render(
      "これは https://example.com/page です\n\n[外部のページ](https://example.com/page)",
    );
    expect(received.some((r) => r.props["data-card-title"])).toBe(false);
    expect(html).toContain("<p>これは ");
  });

  it("取れなかった URL は素のリンクのまま残る", async () => {
    const html = await render("https://example.com/missing");
    expect(html).toBe(
      '<p><a href="https://example.com/missing">https://example.com/missing</a></p>',
    );
  });
});

describe("コードブロック (shiki)", () => {
  it("ライトとダークの色が CSS 変数で両方載る (globals.css が読む)", async () => {
    const html = await render("```ts\nconst a = 1;\n```");
    expect(html).toMatch(/^<pre class="shiki shiki-themes rose-pine-dawn dracula"/);
    expect(html).toContain("--shiki-light:");
    expect(html).toContain("--shiki-dark:");
    expect(html).toContain("--shiki-light-bg:");
    expect(html).toContain("--shiki-dark-bg:");
    // defaultColor: false なので、素の color は焼かれない
    expect(html).not.toMatch(/style="color:/);
  });

  it("言語名の大小は区別しない", async () => {
    const lower = await render("```ts\nconst a = 1;\n```");
    const upper = await render("```TS\nconst a = 1;\n```");
    expect(upper).toBe(lower);
  });

  it("積んでいない言語と言語無しは text で通る (地の色は付く)", async () => {
    for (const md of ["```brainfuck\n+++\n```", "```\n+++\n```"]) {
      const html = await render(md);
      expect(html).toContain("--shiki-dark-bg:");
      expect(html).toContain("+++");
    }
  });

  it("出力の形をまるごと固定する", async () => {
    const html = await render("```tsx\nexport const A = () => <div>{1}</div>;\n```");
    await expect(html).toMatchFileSnapshot("__snapshots__/code-block.html");
  });
});

describe("GFM", () => {
  it("表・取り消し線・タスクリスト", async () => {
    const html = await render(
      "| a | b |\n| - | - |\n| 1 | 2 |\n\n~~消す~~\n\n- [x] 済み\n- [ ] まだ",
    );
    await expect(html).toMatchFileSnapshot("__snapshots__/gfm.html");
  });
});

describe("生の HTML", () => {
  it("studio が書く <br /> は改行として通る", async () => {
    const html = await render("一行目\n\n<br />\n\n二行目");
    expect(html).toBe("<p>一行目</p>\n<br/>\n<p>二行目</p>");
  });
});
