import { test, expect } from "./fixtures";

/**
 * sitemap.xml に載っている全ページを開く。作品や記事が増えても、ここに
 * 書き足さずに済むよう sitemap から拾う (sitemap 自身の検査も兼ねる)。
 */

const SITE_URL = "https://riochin.dev";

async function sitemapPaths(
  request: import("@playwright/test").APIRequestContext,
) {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs.map((loc) => loc.replace(SITE_URL, "") || "/");
}

test("sitemap は両ロケールの主要なページを載せている", async ({ request }) => {
  const paths = await sitemapPaths(request);
  for (const locale of ["ja", "en"]) {
    for (const path of ["", "/about", "/works", "/experience", "/output"]) {
      expect(paths).toContain(`/${locale}${path}`);
    }
  }
  expect(paths.some((p) => p.startsWith("/ja/works/"))).toBe(true);
  expect(paths.some((p) => p.startsWith("/ja/blog/"))).toBe(true);
  // 開発用のページは載せない
  expect(paths.some((p) => /\/(studio|hero-capture)/.test(p))).toBe(false);
});

test("sitemap の全ページが開け、h1 があり、エラーが出ない", async ({
  page,
  request,
}) => {
  test.slow();
  const paths = await sitemapPaths(request);
  expect(paths.length).toBeGreaterThan(10);

  for (const path of paths) {
    await test.step(path, async () => {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1").first(), path).toBeAttached();
      await expect(page.locator("html"), path).toHaveAttribute(
        "lang",
        path.split("/")[1],
      );
    });
  }
});

test("記事のコードブロックはすべて shiki で色付けされている", async ({
  page,
  request,
}) => {
  const articles = (await sitemapPaths(request)).filter((p) =>
    p.startsWith("/ja/blog/"),
  );
  let highlighted = 0;

  for (const path of articles) {
    await page.goto(path);
    const blocks = page.locator(".article-body pre");
    const count = await blocks.count();
    for (let i = 0; i < count; i++) {
      await expect(blocks.nth(i), path).toHaveClass(/\bshiki\b/);
      // ライトとダークの色が CSS 変数で両方載っている (globals.css が切り替える)
      const style = (await blocks.nth(i).getAttribute("style")) ?? "";
      expect(style, path).toContain("--shiki-dark-bg");
    }
    highlighted += count;
  }

  // どの記事にもコードが無くなって、何も確かめずに通るのを防ぐ
  expect(highlighted).toBeGreaterThan(0);
});

test("OG 画像が PNG で返る", async ({ page, request }) => {
  const paths = (await sitemapPaths(request)).filter((p) => p.startsWith("/ja"));
  for (const path of paths) {
    await page.goto(path);
    const og = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    expect(og, path).toBeTruthy();

    const res = await request.get(new URL(og!).pathname);
    expect(res.status(), `${path} → ${og}`).toBe(200);
    expect(res.headers()["content-type"], `${path} → ${og}`).toContain("image/png");
  }
});
