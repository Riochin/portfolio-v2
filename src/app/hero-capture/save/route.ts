import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { HERO_FRAMING } from "@/components/hero/sceneConfig";

// /hero-capture から呼ばれる開発専用の保存口。
// Canvas を焼いた dataURL を /public/hero-{mode}{接尾辞}.webp に書き出す。
// 接尾辞は画枠ごと (wide は無印、narrow は -narrow)。
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const { mode, framing, dataUrl } = (await request.json()) as {
    mode?: string;
    framing?: string;
    dataUrl?: string;
  };

  if (mode !== "light" && mode !== "dark") {
    return NextResponse.json({ error: "mode が不正です" }, { status: 400 });
  }
  if (!framing || !(framing in HERO_FRAMING)) {
    return NextResponse.json({ error: "framing が不正です" }, { status: 400 });
  }
  const base64 = dataUrl?.replace(/^data:image\/webp;base64,/, "");
  if (!base64 || base64 === dataUrl) {
    return NextResponse.json({ error: "webp ではありません" }, { status: 400 });
  }

  const suffix = HERO_FRAMING[framing as keyof typeof HERO_FRAMING].poster;
  const name = `hero-${mode}${suffix}.webp`;
  await writeFile(
    join(process.cwd(), "public", name),
    Buffer.from(base64, "base64"),
  );

  return NextResponse.json({ path: `/${name}` });
}
