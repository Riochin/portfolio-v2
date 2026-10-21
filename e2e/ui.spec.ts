import { test, expect } from "./fixtures";

/**
 * 動くところ。next-themes (テーマ) と framer-motion (メニュー) の更新はここで拾う。
 * ヒーローは描くのが重いので hero.spec.ts に分けてある。
 */

test("テーマを切り替えると html の class が変わり、選んだものが残る", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/ja/about");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);

  await page.getByRole("button", { name: "テーマを切り替え" }).first().click();
  await expect(html).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
});

test.describe("モバイル", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("メニューを開いてページへ移り、移ったら閉じる", async ({ page }) => {
    await page.goto("/ja/about");
    const toggle = page.getByRole("button", { name: "メニューを開く" });
    await toggle.click();
    await expect(
      page.getByRole("button", { name: "メニューを閉じる" }),
    ).toHaveAttribute("aria-expanded", "true");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Works" })
      .click();
    await expect(page).toHaveURL(/\/ja\/works$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
