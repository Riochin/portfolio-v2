// テストは node 環境で回す。依存の「出力の形」を固定する契約テストが中心で、
// DOM が要るものは Playwright (e2e/) に任せる。
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // @/* を tsconfig.json の paths から引く。Vite 8 から本体で解決できる。
    tsconfigPaths: true,
    alias: {
      // server-only は import しただけで投げる。テストではサーバー側の
      // モジュールを直に読むので、空のモジュールに差し替える。
      "server-only": fileURLToPath(
        new URL("./src/test/empty.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
