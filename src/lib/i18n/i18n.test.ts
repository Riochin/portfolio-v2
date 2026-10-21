import { describe, expect, it } from "vitest";

import { isLocale } from "@/lib/i18n/config";
import {
  alternates,
  localeFromPathname,
  localePath,
  stripLocale,
} from "@/lib/i18n/paths";
import { pick, translator } from "@/lib/i18n/types";

describe("isLocale", () => {
  it.each([
    ["ja", true],
    ["en", true],
    ["fr", false],
    ["JA", false],
    ["", false],
    [undefined, false],
  ])("%s → %s", (value, expected) => {
    expect(isLocale(value)).toBe(expected);
  });
});

describe("localePath", () => {
  it.each([
    ["/works", "/ja/works"],
    ["/blog/hello", "/ja/blog/hello"],
    ["/", "/ja"],
    ["", "/ja"],
  ])("%s → %s", (path, expected) => {
    expect(localePath("ja", path)).toBe(expected);
  });
});

describe("stripLocale", () => {
  it.each([
    ["/ja/works/gitris", "/works/gitris"],
    ["/en/blog/hello", "/blog/hello"],
    ["/ja", "/"],
    ["/ja/", "/"],
    // ロケールで始まらないものはそのまま
    ["/works", "/works"],
    ["/japan/x", "/japan/x"],
    ["/", "/"],
  ])("%s → %s", (pathname, expected) => {
    expect(stripLocale(pathname)).toBe(expected);
  });

  it("localePath の逆になる", () => {
    for (const path of ["/", "/works", "/works/gitris"]) {
      expect(stripLocale(localePath("en", path))).toBe(path);
    }
  });
});

describe("localeFromPathname", () => {
  it.each([
    ["/en/works", "en"],
    ["/ja", "ja"],
    // 分からなければ既定 (ja)
    ["/fr/works", "ja"],
    ["/", "ja"],
  ])("%s → %s", (pathname, expected) => {
    expect(localeFromPathname(pathname)).toBe(expected);
  });
});

describe("alternates", () => {
  it("canonical は自分のロケール、hreflang は全ロケールと x-default (ja)", () => {
    expect(alternates("en", "/works")).toEqual({
      canonical: "/en/works",
      languages: { ja: "/ja/works", en: "/en/works", "x-default": "/ja/works" },
    });
  });

  it("トップは接頭辞だけ", () => {
    expect(alternates("ja", "/").languages).toEqual({
      ja: "/ja",
      en: "/en",
      "x-default": "/ja",
    });
  });
});

describe("translator / pick", () => {
  const value = { ja: "こんにちは", en: "Hello" };

  it("ロケールの値を返す", () => {
    expect(translator("en")(value)).toBe("Hello");
    expect(pick("ja", value)).toBe("こんにちは");
  });
});
