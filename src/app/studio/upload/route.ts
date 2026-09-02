import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { isValidSlug } from "@/lib/articles/frontmatter";

/**
 * /studio のエディタに落とした画像を public/articles/<slug>/ に保存する、
 * 開発専用のアップロード口。save と同じく本番では素の 404。
 *
 * 記事本文には `![](/articles/<slug>/<name>)` として入る。寸法は Markdown に
 * 書かない ── ビルド時に rehypeImageSize が public/ の実ファイルから読むので、
 * 後から画像を差し替えても数字が古くならない。
 */

const PUBLIC_ARTICLES_DIR = join(process.cwd(), "public", "articles");

/** 8MB。記事に貼るスクリーンショットや写真には十分で、事故は止まる大きさ。 */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * 受け入れる画像形式。判定は client が名乗る MIME ではなく image-size が
 * 中身から見抜いた型で行う (名乗りは当てにならないし、ここで絞ることが
 * image-size の ICNS / JXL / HEIF パーサの既知の無限ループを踏まない緩和にもなる)。
 */
const EXTENSION: Record<string, string> = {
  png: "png",
  jpg: "jpg",
  webp: "webp",
  gif: "gif",
  avif: "avif",
};

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
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const form = await request.formData();
  const slug = form.get("slug");
  const file = form.get("file");

  if (!isValidSlug(slug)) {
    // studio 側は slug 欄を本文より上に置いてあるが、空のまま貼られることはある。
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

  const bytes = Buffer.from(await file.arrayBuffer());

  let width: number | undefined;
  let height: number | undefined;
  let type: string | undefined;
  try {
    ({ width, height, type } = imageSize(bytes));
  } catch {
    return NextResponse.json(
      { error: "画像として読めませんでした" },
      { status: 400 },
    );
  }

  const extension = type && EXTENSION[type];
  if (!extension || !width || !height) {
    return NextResponse.json(
      { error: `対応していない画像形式です (${type ?? "不明"})` },
      { status: 400 },
    );
  }

  // 中身のハッシュを名前に混ぜる。同じ画像をもう一度貼っても同じファイルに落ち、
  // public/ が同一画像で膨らまない。
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  const name = `${sanitizeBase(file.name)}-${digest}.${extension}`;

  const dir = normalize(join(PUBLIC_ARTICLES_DIR, slug));
  if (!dir.startsWith(PUBLIC_ARTICLES_DIR + sep)) {
    return NextResponse.json({ error: "不正な保存先です" }, { status: 400 });
  }

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), bytes);

  return NextResponse.json({
    url: `/articles/${slug}/${name}`,
    width,
    height,
  });
}
