import { readFileSync } from "node:fs";
import { join } from "node:path";
import { imageSize } from "image-size";
import { describe, expect, it } from "vitest";

import { findSimpleIcon } from "@/components/skills/SkillIcon";
import {
  getExperiencesByYear,
  getHomeWorks,
  getWorkNeighbors,
  getWorks,
} from "@/data";
import { SKILLS } from "@/data/skills";
import type { ImageRef } from "@/data/types";

/**
 * 手書きの静的データが、依存と public/ の実ファイルに対して正しいか。
 * どれも間違っていてもビルドは通り、画面の上で黙って崩れるだけのもの。
 */

describe("スキルのアイコン (simple-icons)", () => {
  const withIcon = Object.entries(SKILLS).filter(
    (entry): entry is [string, (typeof entry)[1] & { icon: string }] =>
      "icon" in entry[1] && typeof entry[1].icon === "string",
  );

  it.each(withIcon)("%s のスラッグが引ける", (_, skill) => {
    const icon = findSimpleIcon(skill.icon);
    expect(icon, `simple-icons に ${skill.icon} が無い`).toBeDefined();
    expect(icon!.path).toMatch(/^[Mm]/);
  });
});

describe("画像の寸法", () => {
  const images: [string, ImageRef][] = [
    ...getWorks().flatMap((w) => (w.image ? [[`works/${w.slug}`, w.image] as [string, ImageRef]] : [])),
    ...getExperiencesByYear()
      .flatMap((g) => g.experiences)
      .flatMap((e) => (e.image ? [[`experience/${e.slug}`, e.image] as [string, ImageRef]] : [])),
  ];

  it("1 枚以上ある", () => {
    expect(images.length).toBeGreaterThan(0);
  });

  // 寸法は next/image に渡して CLS を防ぐためのもの。ずれると縦横比が崩れる。
  it.each(images)("%s の width/height が public/ の実ファイルと合う", (_, image) => {
    const bytes = readFileSync(join(process.cwd(), "public", image.src));
    const actual = imageSize(bytes);
    expect({ width: image.width, height: image.height }).toEqual({
      width: actual.width,
      height: actual.height,
    });
  });
});

describe("作品", () => {
  it("トップに並べる作品がすべて実在する", () => {
    expect(getHomeWorks().every(Boolean)).toBe(true);
  });

  it("ページャは一覧を端から端までたどれる", () => {
    const works = getWorks();
    const first = works.find((w) => !getWorkNeighbors(w.slug).prev);
    expect(first).toBeDefined();

    const visited: string[] = [];
    for (let w = first; w; w = getWorkNeighbors(w.slug).next) {
      visited.push(w.slug);
    }
    expect(visited.sort()).toEqual(works.map((w) => w.slug).sort());
  });
});
