import { describe, expect, it } from "vitest";

import { neighborsAt } from "@/lib/neighbors";

describe("neighborsAt", () => {
  const list = ["a", "b", "c"] as const;

  it("中ほどなら上下両方", () => {
    expect(neighborsAt(list, 1)).toEqual({ prev: "a", next: "c" });
  });

  it("先頭に prev は無い (at(-1) のように末尾へ巻き戻らない)", () => {
    expect(neighborsAt(list, 0)).toEqual({ prev: undefined, next: "b" });
  });

  it("末尾に next は無い", () => {
    expect(neighborsAt(list, 2)).toEqual({ prev: "b", next: undefined });
  });

  it("一覧に居なければ (-1) 両方無し", () => {
    expect(neighborsAt(list, -1)).toEqual({});
  });

  it("1 件だけなら両方無し", () => {
    expect(neighborsAt(["a"], 0)).toEqual({ prev: undefined, next: undefined });
  });
});
