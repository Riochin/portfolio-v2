import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "@/proxy";

/**
 * ロケールの振り分け。negotiate を直に呼ばず proxy() ごと通すのは、
 * NextRequest / NextResponse.redirect / cookies の API も一緒に見たいため
 * (next の更新で崩れるのはむしろそちら)。
 */

function request(
  path: string,
  {
    lang,
    cookie,
    accept,
    method,
  }: { lang?: string; cookie?: string; accept?: string; method?: string } = {},
) {
  const headers = new Headers();
  if (lang) headers.set("accept-language", lang);
  if (cookie) headers.set("cookie", `NEXT_LOCALE=${cookie}`);
  if (accept) headers.set("accept", accept);
  return new NextRequest(`https://riochin.dev${path}`, { headers, method });
}

/** リダイレクト先のパス。リダイレクトしなければ undefined。 */
function redirectedTo(req: NextRequest): string | undefined {
  const res = proxy(req);
  if (!res?.headers.has("location")) return undefined;
  expect(res.status).toBe(307);
  return new URL(res.headers.get("location")!).pathname;
}

describe("proxy", () => {
  it("ロケール付きのパスは素通し", () => {
    expect(redirectedTo(request("/en/works"))).toBeUndefined();
    expect(redirectedTo(request("/ja"))).toBeUndefined();
  });

  it("ロケールが無ければ付けてリダイレクトする (クエリは保つ)", () => {
    const res = proxy(request("/works?x=1"));
    expect(res?.headers.get("location")).toBe("https://riochin.dev/ja/works?x=1");
  });

  it("トップは /<locale> へ", () => {
    expect(redirectedTo(request("/", { lang: "en" }))).toBe("/en");
  });

  it.each([
    ["en-US,en;q=0.9", "/en/works"],
    ["ja,en;q=0.8", "/ja/works"],
    // q の高い順に見る
    ["ja;q=0.5,en;q=0.9", "/en/works"],
    // 地域付きの大文字でも拾う
    ["EN-GB", "/en/works"],
    // 対応していない言語しか無ければ既定 (ja)
    ["fr-FR,de;q=0.8", "/ja/works"],
    // 対応していない言語の後ろに en があれば en
    ["fr,en;q=0.5", "/en/works"],
  ])("Accept-Language: %s → %s", (lang, expected) => {
    expect(redirectedTo(request("/works", { lang }))).toBe(expected);
  });

  it("ヘッダーが無ければ既定 (ja)", () => {
    expect(redirectedTo(request("/works"))).toBe("/ja/works");
  });

  it("cookie で選んだ言語を Accept-Language より優先する", () => {
    expect(redirectedTo(request("/works", { lang: "ja", cookie: "en" }))).toBe(
      "/en/works",
    );
  });

  it("cookie が知らない値なら Accept-Language に戻る", () => {
    expect(redirectedTo(request("/works", { lang: "en", cookie: "fr" }))).toBe(
      "/en/works",
    );
  });
});

/** Markdown の口へ rewrite したならその先のパス。しなければ undefined。 */
function rewrittenTo(req: NextRequest): string | undefined {
  const target = proxy(req)?.headers.get("x-middleware-rewrite");
  return target ? new URL(target).pathname : undefined;
}

const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

describe("Accept で Markdown に振り分ける", () => {
  it.each(["/ja", "/en/works", "/ja/blog/hello", "/ja/no-such-page"])(
    "%s を text/markdown で求めたら /markdown 配下へ rewrite",
    (path) => {
      expect(rewrittenTo(request(path, { accept: "text/markdown" }))).toBe(
        `/markdown${path}`,
      );
    },
  );

  it("ブラウザの Accept はページへ素通し", () => {
    expect(proxy(request("/ja/works", { accept: BROWSER_ACCEPT }))).toBeUndefined();
  });

  it("Accept が無ければ HTML", () => {
    expect(rewrittenTo(request("/ja"))).toBeUndefined();
  });

  it("GET / HEAD 以外は振り分けない (Server Action の POST など)", () => {
    expect(
      rewrittenTo(request("/ja", { accept: "text/markdown", method: "POST" })),
    ).toBeUndefined();
    expect(
      rewrittenTo(request("/ja", { accept: "text/markdown", method: "HEAD" })),
    ).toBe("/markdown/ja");
  });

  it("ロケールの無いパスは Markdown でも先にリダイレクトする", () => {
    expect(redirectedTo(request("/", { accept: "text/markdown" }))).toBe("/ja");
    expect(rewrittenTo(request("/", { accept: "text/markdown" }))).toBeUndefined();
  });
});

describe("matcher", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);

  it.each(["/", "/works", "/blog/hello", "/studio"])("%s は通す", (path) => {
    expect(matcher.test(path)).toBe(true);
  });

  // studio/ の POST をリダイレクトすると 307 で POST し直されて 404 になる
  it.each([
    "/_next/static/x.js",
    "/studio/save",
    "/studio/upload",
    "/hero-capture/save",
    "/favicon.ico",
    "/water-normals.png",
  ])("%s は素通し", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
