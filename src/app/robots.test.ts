import { resolveRobots } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots.txt", () => {
  // Next が robots.ts を文字列にするのと同じ関数で組み、出力の形を固定する。
  const text = resolveRobots(robots());

  it("User-Agent グループに Content-Signal を含め、既存の行も残す", () => {
    expect(text).toBe(
      [
        "User-Agent: *",
        "Allow: /",
        "Disallow: /hero-capture",
        "Disallow: /studio",
        "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
        "",
        "Sitemap: https://riochin.dev/sitemap.xml",
        "",
      ].join("\n"),
    );
  });
});
