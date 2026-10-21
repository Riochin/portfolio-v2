import { test, expect } from "./fixtures";

/**
 * proxy のロケール振り分けと、検索エンジン向けのファイル、
 * 本番では閉じている開発用のページ。
 */

test.describe("ロケールの振り分け", () => {
  test("Accept-Language の言語へリダイレクトする", async ({ request }) => {
    const res = await request.get("/works", {
      headers: { "accept-language": "en-US,en;q=0.9" },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(307);
    expect(new URL(res.headers().location, res.url()).pathname).toBe("/en/works");
  });

  test("cookie で選んだ言語を優先する", async ({ request }) => {
    const res = await request.get("/", {
      headers: { "accept-language": "en", cookie: "NEXT_LOCALE=ja" },
      maxRedirects: 0,
    });
    expect(new URL(res.headers().location, res.url()).pathname).toBe("/ja");
  });

  test("言語を切り替えると同じページの別ロケールへ移る", async ({ page }) => {
    await page.goto("/ja/works");
    await page
      .getByRole("navigation", { name: "言語を切り替え" })
      .first()
      .getByRole("link", { name: "EN" })
      .click();
    await expect(page).toHaveURL(/\/en\/works$/);
  });
});

test.describe("検索エンジン向け", () => {
  test("robots.txt は開発用のページを閉じ、sitemap を指す", async ({ request }) => {
    const text = await (await request.get("/robots.txt")).text();
    expect(text).toMatch(/Disallow: \/studio/);
    expect(text).toMatch(/Disallow: \/hero-capture/);
    expect(text).toContain("Sitemap: https://riochin.dev/sitemap.xml");
  });

  test("manifest が読める", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("ページは canonical と hreflang を持つ", async ({ page }) => {
    await page.goto("/en/about");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://riochin.dev/en/about",
    );
    await expect(page.locator('link[hreflang="ja"]')).toHaveAttribute(
      "href",
      "https://riochin.dev/ja/about",
    );
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://riochin.dev/ja/about",
    );
  });
});

test.describe("本番では閉じている", () => {
  for (const path of ["/ja/studio", "/ja/hero-capture"]) {
    test(`${path} は 404`, async ({ page, allowStatus }) => {
      allowStatus(path);
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
    });
  }

  for (const path of ["/studio/save", "/studio/upload", "/hero-capture/save"]) {
    test(`POST ${path} は 404`, async ({ request }) => {
      const res = await request.post(path, { data: {} });
      expect(res.status()).toBe(404);
    });
  }

  test("無いページは 404 のページを出す", async ({ page, allowStatus }) => {
    allowStatus("/ja/no-such-page");
    const res = await page.goto("/ja/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toBeVisible();
  });
});
