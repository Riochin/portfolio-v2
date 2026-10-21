import { describe, expect, it } from "vitest";

import {
  academicYear,
  comparePeriodDesc,
  compareStartDesc,
  formatPeriod,
  formatYearMonth,
  formatYearMonthDay,
  periodEndKey,
  yearOf,
  type Period,
} from "@/lib/date";

const p = (start: Period["start"], end: Period["end"]): Period => ({ start, end });

describe("並べ替え", () => {
  it("継続中は遠い未来として扱う", () => {
    expect(periodEndKey(p("2025-04", null))).toBe("9999-99");
    expect(periodEndKey(p("2025-04", "2025-08"))).toBe("2025-08");
  });

  it("comparePeriodDesc は終了の新しい順、同じなら開始の新しい順", () => {
    const list = [
      p("2024-04", "2025-03"),
      p("2025-01", "2025-03"),
      p("2023-04", null),
      p("2025-06", "2025-08"),
    ];
    expect([...list].sort(comparePeriodDesc)).toEqual([
      p("2023-04", null),
      p("2025-06", "2025-08"),
      p("2025-01", "2025-03"),
      p("2024-04", "2025-03"),
    ]);
  });

  it("compareStartDesc は開始の新しい順、同じなら終了の新しい順", () => {
    const list = [
      p("2023-04", null),
      p("2025-06", "2025-08"),
      p("2025-06", null),
      p("2024-04", "2025-03"),
    ];
    expect([...list].sort(compareStartDesc)).toEqual([
      p("2025-06", null),
      p("2025-06", "2025-08"),
      p("2024-04", "2025-03"),
      p("2023-04", null),
    ]);
  });
});

describe("表示", () => {
  it("年月と年月日はドット区切り", () => {
    expect(yearOf("2025-06")).toBe("2025");
    expect(formatYearMonth("2025-06")).toBe("2025.06");
    expect(formatYearMonthDay("2026-09-03")).toBe("2026.09.03");
  });

  it("期間は en ダッシュでつなぎ、継続中はロケールの語にする", () => {
    expect(formatPeriod(p("2024-11", "2025-12"), "ja")).toBe("2024.11 – 2025.12");
    expect(formatPeriod(p("2024-11", null), "ja")).toBe("2024.11 – 現在");
    expect(formatPeriod(p("2024-11", null), "en")).toBe("2024.11 – Present");
  });

  it("開始と終了が同じ月なら 1 つだけ出す", () => {
    expect(formatPeriod(p("2025-08", "2025-08"), "en")).toBe("2025.08");
  });
});

describe("academicYear", () => {
  // now はローカル時刻で読むので、ローカルのコンストラクタで作る (月は 0 始まり)。
  it.each([
    ["入学した月", new Date(2024, 3, 1), 1],
    ["1 年目の 3 月末", new Date(2025, 2, 31), 1],
    ["2 年目の 4 月", new Date(2025, 3, 1), 2],
    ["3 年目の秋", new Date(2026, 9, 22), 3],
  ])("2024-04 入学で %s は %i 年", (_, now, expected) => {
    expect(academicYear("2024-04", now)).toBe(expected);
  });

  it("1〜3 月入学は前の年度から数える", () => {
    expect(academicYear("2025-01", new Date(2025, 3, 1))).toBe(2);
  });
});
