import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, normalize, sep } from "node:path";
import { NextResponse } from "next/server";
import { ARTICLES_DIR } from "@/lib/articles";
import {
  isValidSlug,
  isYearMonthDay,
  serializeArticleFile,
} from "@/lib/articles/frontmatter";

/**
 * /studio から呼ばれる開発専用の保存口。content/articles/<slug>.md を書く。
 *
 * hero-capture/save と同じ流儀 ── 本番では素の 404 を返し、認証は持たない。
 * 書き込み先はリポジトリの作業ツリーなので、著者が git diff で確かめて commit する。
 * (Vercel の実行時ファイルシステムは読み取り専用なので、この作りは本番に持ち上がらない)
 *
 * [lang] の外に置いてあるのは Route Handler で next/root-params が使えないため。
 * proxy.ts の matcher でも studio/ を素通しにしてある ── リダイレクトされると
 * 307 がメソッドを保って /ja/studio/save へ POST し直され、404 になる。
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const body = (await request.json()) as {
    slug?: unknown;
    title?: unknown;
    publishedAt?: unknown;
    draft?: unknown;
    markdown?: unknown;
    overwrite?: unknown;
  };
  const { slug, title, publishedAt, draft, markdown, overwrite } = body;

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "slug は小文字英数とハイフンだけで、64 文字までです" },
      { status: 400 },
    );
  }
  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "title が空です" }, { status: 400 });
  }
  if (!isYearMonthDay(publishedAt)) {
    return NextResponse.json(
      { error: "publishedAt は実在する YYYY-MM-DD にしてください" },
      { status: 400 },
    );
  }
  if (draft !== undefined && typeof draft !== "boolean") {
    return NextResponse.json(
      { error: "draft が boolean ではありません" },
      { status: 400 },
    );
  }
  if (typeof markdown !== "string") {
    return NextResponse.json(
      { error: "markdown が文字列ではありません" },
      { status: 400 },
    );
  }

  // isValidSlug が `.` も `/` も弾いているのでここは通るはずだが、
  // パスを組む前に必ず確かめる (検証と結合が離れると、片方だけ緩んだときに気付けない)。
  const path = normalize(join(ARTICLES_DIR, `${slug}.md`));
  if (!path.startsWith(ARTICLES_DIR + sep)) {
    return NextResponse.json({ error: "不正な保存先です" }, { status: 400 });
  }

  // 既存を黙って踏まない。studio 側は「上書きしますか」を聞いてから再送する。
  if (overwrite !== true && existsSync(path)) {
    return NextResponse.json(
      { error: `${slug}.md は既にあります` },
      { status: 409 },
    );
  }

  await writeFile(
    path,
    serializeArticleFile({ title, publishedAt, draft }, markdown),
    "utf8",
  );

  return NextResponse.json({ slug, path: `content/articles/${slug}.md` });
}
