import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * ヒーローの WebGL。three / @react-three/fiber / drei / three-stdlib の更新はここで拾う。
 *
 * CI にも手元の headless にも GPU は無く、WebGL はソフトウェア (SwiftShader) で
 * 描かれる。ほかのテストと並べて回すと 1 枚目が出るまでが 20 秒を越え、
 * HeroLiveCanvas が静止画へ倒してしまう。そのため playwright.config.ts で
 * 別の project に分け、ほかが全部終わってから 1 worker で 1 本ずつ回している。
 */

const EXPAND = "空の演出を全画面で表示";

/**
 * 描けたことを待つ。描けないと HeroLiveCanvas が 20 秒で静止画へ倒し、
 * そこでもボタンは押せるようになるので、倒れる手前で切る。
 */
async function waitForSky(page: Page) {
  const hero = page.getByRole("button", { name: EXPAND });
  await expect(hero).toBeEnabled({ timeout: 19_000 });
  // 描けた側の道なら canvas が残っていて、静止画 (img) は無い
  await expect(hero.locator("canvas")).toBeAttached();
  await expect(hero.locator("img")).toHaveCount(0);
  return hero;
}

test("空が描けて、静止画に倒れない", async ({ page }) => {
  await page.goto("/ja");
  await waitForSky(page);
});

test("押すと全画面に開き、Esc で閉じる", async ({ page }) => {
  await page.goto("/ja");
  const hero = await waitForSky(page);

  await hero.click();
  const close = page.getByRole("button", { name: "全画面表示を閉じる" });
  await expect(close).toBeAttached();
  // 全画面の Canvas は、拡大のモーフが収まってから作られる
  await expect(page.locator("canvas")).toBeAttached({ timeout: 15_000 });

  await page.keyboard.press("Escape");
  await expect(close).not.toBeAttached({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: EXPAND })).toBeVisible();
});

test.describe("狭い画面", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("軽い設定でも空が描ける", async ({ page }) => {
    await page.goto("/ja");
    await waitForSky(page);
  });
});

test("動きを減らす設定では静止画を出す", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/ja");
  const hero = page.getByRole("button", { name: EXPAND });
  // 昼と夜の 2 枚を重ねて、テーマで片方を透かしている
  await expect(hero.locator('img[src="/hero-light.webp"]')).toBeVisible();
  await expect(hero.locator("canvas")).toHaveCount(0);
  await context.close();
});
