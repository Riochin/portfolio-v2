import { readFileSync } from "node:fs";
import { join } from "node:path";
import { imageSize } from "image-size";
import { describe, expect, it } from "vitest";

/**
 * アップロード口 (route.ts) は形式の判定を image-size の `type` に任せ、
 * その文字列で EXTENSION を引いている。名前が変わると全部「対応していない形式」で
 * 弾かれるようになるので、受け入れる 5 形式で固定する。
 *
 * fixture は sharp で作った 3x2 の単色画像。
 */
const fixture = (name: string) =>
  readFileSync(join(__dirname, "__fixtures__", name));

describe("image-size", () => {
  it.each([
    ["pixel.png", "png"],
    ["pixel.jpg", "jpg"],
    ["pixel.webp", "webp"],
    ["pixel.gif", "gif"],
    ["pixel.avif", "avif"],
  ])("%s を %s として 3x2 で読む", (file, type) => {
    expect(imageSize(fixture(file))).toMatchObject({ width: 3, height: 2, type });
  });

  it("画像でないものは投げる", () => {
    expect(() => imageSize(new TextEncoder().encode("not an image"))).toThrow();
  });
});
