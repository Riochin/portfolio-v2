import { test as base, expect, type Page } from "@playwright/test";

/**
 * 各テストの間に起きたエラーを集め、終わったら 0 件であることを確かめる。
 *
 * 拾うのは、ページの未処理の例外、console.error、それと自分のサイトから返った
 * 4xx / 5xx。外部のホスト (Spotify のジャケット、OGP の画像など) から来たものは
 * 数えない ── 他所のサイトの都合で落ちるテストにしないため。
 */
type Fixtures = {
  errors: string[];
  /** わざと 404 を踏むテストが、そのパスを数えないよう申告する。 */
  allowStatus: (path: string) => void;
};

const isLocal = (url: string) => {
  try {
    return new URL(url).hostname === "localhost";
  } catch {
    return false;
  }
};

// fixture の第 2 引数は Playwright の慣例では use と書くが、React の use フックと
// 取り違えた lint (rules-of-hooks) に引っかかるので provide と呼ぶ。
export const test = base.extend<Fixtures>({
  errors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      watch(page, errors);
      await provide(errors);
    },
    { auto: true },
  ],
  allowStatus: async ({ errors }, provide) => {
    await provide((path) => {
      allowed.set(errors, [...(allowed.get(errors) ?? []), path]);
    });
  },
});

const allowed = new WeakMap<string[], string[]>();

function watch(page: Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const source = message.location().url;
    if (source && !isLocal(source)) return;
    // わざと踏んだ 404 は、ブラウザも「読み込めなかった」と console に出す
    if (source && allowed.get(errors)?.includes(new URL(source).pathname)) return;
    errors.push(`console.error: ${message.text()}`);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname !== "localhost" || response.status() < 400) return;
    if (allowed.get(errors)?.includes(url.pathname)) return;
    errors.push(`${response.status()} ${url.pathname}${url.search}`);
  });
}

test.afterEach(async ({ errors }) => {
  expect(errors, "ページでエラーが起きていない").toEqual([]);
});

export { expect };
