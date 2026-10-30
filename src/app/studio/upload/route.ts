import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { isValidSlug } from "@/lib/articles/frontmatter";
import { denyStudioRoute } from "@/lib/studio/guard";
import { getStore } from "@/lib/studio/store";

/**
 * /studio のエディタに落とした画像を public/articles/<slug>/ に保存する口。
 *
 * 形式は必ず webp に揃える。スマホの写真 (HEIC / 数 MB の JPEG) をそのまま
 * リポジトリに入れると重いので、長辺 2000px に収めて再圧縮する。
 * 名前には中身のハッシュを混ぜる ── 同じ画像をもう一度貼っても同じ名前に落ち、
 * 保存層が「既にある」と判断して commit を増やさない。
 *
 * 記事本文には `![](/articles/<slug>/<name>)` として入る。寸法は Markdown に
 * 書かない ── ビルド時に rehypeImageSize が public/ の実ファイルから読むので、
 * 後から画像を差し替えても数字が古くならない。
 *
 * Vercel の関数は本文 4.5MB までしか受けないので、エディタ側 (shrinkImage.ts) が
 * 送る前に縮める。ここの上限はその保険。
 */

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 2000;
const WEBP_QUALITY = 82;

/** ファイル名に残す元の名前。日本語やスペースが URL に出ないよう均す。 */
function sanitizeBase(name: string): string {
  const base = name.replace(/\.[^.]*$/, "");
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return cleaned === "" ? "image" : cleaned;
}

export async function POST(request: Request) {
  const denied = await denyStudioRoute(request);
  if (denied) return denied;

  const form = await request.formData();
  const slug = form.get("slug");
  const file = form.get("file");

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "先に slug を決めてください" },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file がありません" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `画像は ${MAX_BYTES / 1024 / 1024}MB までです` },
      { status: 400 },
    );
  }

  let webp: Buffer;
  let width: number | undefined;
  let height: number | undefined;
  try {
    const source = Buffer.from(await file.arrayBuffer());
    // animated: GIF を貼ったときに 1 コマ目だけにしない。
    // rotate(): EXIF の向きを画素に焼き込む (webp には EXIF を残さないため)。
    const image = sharp(source, { animated: true }).rotate();
    webp = await image
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    ({ width, height } = await sharp(webp).metadata());
  } catch {
    return NextResponse.json(
      { error: "画像として読めませんでした" },
      { status: 400 },
    );
  }
  if (!width || !height) {
    return NextResponse.json(
      { error: "画像の寸法が取れませんでした" },
      { status: 400 },
    );
  }

  const digest = createHash("sha256").update(webp).digest("hex").slice(0, 8);
  const name = `${sanitizeBase(file.name)}-${digest}.webp`;

  try {
    const store = await getStore();
    await store.writeImage(slug, name, webp, `画像を足す: ${slug}/${name}`);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "画像を保存できませんでした",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: `/articles/${slug}/${name}`, width, height });
}
