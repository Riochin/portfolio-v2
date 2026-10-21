import { describe, expect, it } from "vitest";

import { allowImageUrl } from "@/lib/output/images";
import { sitePath } from "@/lib/site-path";
import { allowArtworkUrl } from "@/lib/spotify/images";

/**
 * 外から来た URL をどこまで信じるかの判定。どれも next/image の remotePatterns や
 * 外部リンクの印に直結するので、通す側と弾く側の両方を固定する。
 */

describe("allowImageUrl (/output のサムネイル)", () => {
  it.each([
    "https://files.speakerdeck.com/presentations/x/preview_slide_0.jpg?1",
    "https://res.cloudinary.com/zenn/image/upload/x.png",
    "https://qiita-user-contents.imgix.net/x.png",
  ])("許可ホストの https は通す: %s", (url) => {
    expect(allowImageUrl(url)).toBe(url);
  });

  it.each([
    ["http は弾く", "http://res.cloudinary.com/x.png"],
    ["許可していないホスト", "https://example.com/x.png"],
    ["サブドメインの詐称", "https://res.cloudinary.com.evil.example/x.png"],
    ["許可ホストのサブドメイン", "https://evil.res.cloudinary.com/x.png"],
    ["URL でない", "not a url"],
    ["javascript:", "javascript:alert(1)"],
    ["空", ""],
    ["undefined", undefined],
  ])("%s", (_, url) => {
    expect(allowImageUrl(url)).toBeUndefined();
  });
});

describe("allowArtworkUrl (Spotify のジャケット)", () => {
  it("i.scdn.co の https だけ通す", () => {
    expect(allowArtworkUrl("https://i.scdn.co/image/abc")).toBe(
      "https://i.scdn.co/image/abc",
    );
    expect(allowArtworkUrl("http://i.scdn.co/image/abc")).toBeUndefined();
    expect(allowArtworkUrl("https://res.cloudinary.com/x.png")).toBeUndefined();
    expect(allowArtworkUrl(undefined)).toBeUndefined();
  });
});

describe("sitePath", () => {
  it.each([
    ["https://riochin.dev", "/"],
    ["https://riochin.dev/ja/works/begit", "/ja/works/begit"],
    ["https://riochin.dev/blog/hello?x=1#a", "/blog/hello?x=1#a"],
    ["/ja/works", "/ja/works"],
    ["/", "/"],
  ])("%s はサイト内 (%s)", (href, expected) => {
    expect(sitePath(href)).toBe(expected);
  });

  it.each([
    ["プロトコル相対", "//example.com/x"],
    ["外部", "https://example.com/"],
    ["ドメインの前方一致", "https://riochin.dev.evil.example/x"],
    ["http の自サイト", "http://riochin.dev/x"],
    ["相対パス", "works/x"],
    ["フラグメントだけ", "#section"],
  ])("%s は外部扱い", (_, href) => {
    expect(sitePath(href)).toBeUndefined();
  });
});
