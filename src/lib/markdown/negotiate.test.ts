import { describe, expect, it } from "vitest";

import { prefersMarkdown, VARY_ACCEPT_HEADERS } from "./negotiate";

describe("prefersMarkdown", () => {
  it.each([
    "text/markdown",
    "text/markdown; charset=utf-8",
    "TEXT/MARKDOWN",
    "text/markdown, text/html;q=0.9",
    // 同じ q なら名指しした Markdown を選ぶ
    "text/html, text/markdown",
    "text/plain, text/markdown;q=0.5",
  ])("%s → Markdown", (accept) => {
    expect(prefersMarkdown(accept)).toBe(true);
  });

  it.each([
    null,
    "",
    "*/*",
    "text/*",
    // ブラウザ (Chrome) の既定
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "text/html, text/markdown;q=0.5",
    "text/markdown;q=0",
    "text/markdown;q=abc",
    "application/json",
  ])("%s → HTML", (accept) => {
    expect(prefersMarkdown(accept)).toBe(false);
  });
});

describe("VARY_ACCEPT_HEADERS", () => {
  it("next.config の headers() に並ぶ", async () => {
    const { default: nextConfig } = await import("../../../next.config");
    expect(await nextConfig.headers?.()).toEqual(
      expect.arrayContaining(VARY_ACCEPT_HEADERS),
    );
  });
});
