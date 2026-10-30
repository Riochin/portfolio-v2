import { NextResponse } from "next/server";
import {
  isValidSlug,
  isYearMonthDay,
  serializeArticleFile,
} from "@/lib/articles/frontmatter";
import { denyStudioRoute } from "@/lib/studio/guard";
import { getStore, StoreConflictError, type Expect } from "@/lib/studio/store";

/**
 * /studio から呼ばれる保存口。content/articles/<slug>.md を書く。
 *
 * 書き先は保存層 (lib/studio/store) が決める ── dev は作業ツリー、本番は
 * GitHub への commit。認証も同じく lib/studio/guard に寄せてあり、
 * 本番で Access を通っていなければ素の 404 を返す。
 *
 * 競合は `sha` で見る。エディタは開いたときの sha を持っていて、ここに送り返す。
 * その間にファイルが変わっていれば 409 と `code` を返し、エディタが
 * 「上書きしますか」を聞いてから `overwrite: true` で送り直す。
 *
 * [lang] の外に置いてあるのは Route Handler で next/root-params が使えないため。
 * proxy.ts の matcher でも studio/ を素通しにしてある ── リダイレクトされると
 * 307 がメソッドを保って /ja/studio/save へ POST し直され、404 になる。
 */
export async function POST(request: Request) {
  const denied = await denyStudioRoute(request);
  if (denied) return denied;

  const body = (await request.json()) as {
    slug?: unknown;
    title?: unknown;
    publishedAt?: unknown;
    draft?: unknown;
    markdown?: unknown;
    sha?: unknown;
    overwrite?: unknown;
  };
  const { slug, title, publishedAt, draft, markdown, sha, overwrite } = body;

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
  if (sha !== null && typeof sha !== "string") {
    return NextResponse.json(
      { error: "sha は文字列か null にしてください" },
      { status: 400 },
    );
  }

  const expect: Expect = overwrite === true ? "force" : { sha };
  const store = await getStore();

  try {
    const written = await store.write(
      slug,
      serializeArticleFile({ title: title.trim(), publishedAt, draft }, markdown),
      expect,
      `${sha === null ? "記事を書く" : "記事を直す"}: ${title.trim()}`,
    );
    return NextResponse.json({
      slug,
      path: `content/articles/${slug}.md`,
      sha: written.sha,
    });
  } catch (error) {
    if (error instanceof StoreConflictError) {
      return NextResponse.json(
        { error: error.message, code: error.code, current: error.current },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存できませんでした" },
      { status: 500 },
    );
  }
}
