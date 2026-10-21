import { defineConfig, devices } from "@playwright/test";

/**
 * ビルドしたサイトを一周する e2e。Vitest (src/**\/*.test.ts) では見えない、
 * react / next / three / framer-motion の更新で崩れるところを拾う。
 *
 * 手元の dev サーバー (3000) と .next を取り合わないよう、別のポートで
 * `next start` する。CI は直前のステップでビルドを済ませているので start だけ、
 * 手元は build から通す。
 */
const PORT = 3210;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "pages",
      testIgnore: /hero\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // ヒーローは WebGL をソフトウェアで描くので重い。ほかと並べると 20 秒の
    // 待ちを越えて静止画に倒れるので、全部終わってから単独で回す。
    {
      name: "hero",
      testMatch: /hero\.spec\.ts/,
      dependencies: ["pages"],
      workers: 1,
      // 全画面の Canvas は拡大のモーフが収まってから作るので、1 本が 20 秒を越える
      timeout: 60_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI
      ? `pnpm start -p ${PORT}`
      : `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/ja`,
    // 手元で別のものが同じポートを使っていたら、それを相手にせず失敗させる
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
