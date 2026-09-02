import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

// /hero-capture から呼ばれる開発専用の保存口。
// Canvas を焼いた dataURL を /public/hero-{mode}.webp に書き出す。
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const { mode, dataUrl } = (await request.json()) as {
    mode?: string;
    dataUrl?: string;
  };

  if (mode !== "light" && mode !== "dark") {
    return NextResponse.json({ error: "mode が不正です" }, { status: 400 });
  }
  const base64 = dataUrl?.replace(/^data:image\/webp;base64,/, "");
  if (!base64 || base64 === dataUrl) {
    return NextResponse.json({ error: "webp ではありません" }, { status: 400 });
  }

  const path = join(process.cwd(), "public", `hero-${mode}.webp`);
  await writeFile(path, Buffer.from(base64, "base64"));

  return NextResponse.json({ path: `/hero-${mode}.webp` });
}
