import { isValidSlug } from "@/lib/articles/frontmatter";
import { denyStudioRoute } from "@/lib/studio/guard";
import { getStore } from "@/lib/studio/store";

/**
 * まだデプロイに乗っていない画像をエディタに見せるための口。
 *
 * 本番で画像を貼ると GitHub には入るが、サイトの public/ に現れるのは次の
 * デプロイが終わってから。その数分間、エディタの `<img src="/articles/…">` は
 * 404 になる。next.config.ts の fallback rewrite が、public/ に無い
 * /articles/<slug>/<name> をここへ回すので、保存層から直接読んで返す。
 *
 * 認証は他の studio の口と同じ (Access を通っていなければ 404)。
 * デプロイが済めば静的ファイルが先に当たり、ここには来なくなる。
 */

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(webp|png|jpe?g|gif|avif)$/;

const CONTENT_TYPE: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
};

export async function GET(
  request: Request,
  { params }: RouteContext<"/studio/image/[slug]/[name]">,
) {
  const denied = await denyStudioRoute(request);
  if (denied) return denied;

  const { slug, name } = await params;
  const matched = name.match(NAME);
  if (!isValidSlug(slug) || !matched) {
    return new Response(null, { status: 404 });
  }

  const store = await getStore();
  const bytes = await store.readImage(slug, name);
  if (bytes === null) return new Response(null, { status: 404 });

  // Uint8Array は ArrayBufferLike を抱えていて BodyInit に当たらないので、
  // 実体の範囲だけを ArrayBuffer に切り出して渡す。
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": CONTENT_TYPE[matched[1]] ?? "application/octet-stream",
      // 本人のブラウザだけが覚えてよい。名前に中身のハッシュが入っているので
      // 長めに覚えても古い画像を掴まない。
      "Cache-Control": "private, max-age=86400",
    },
  });
}
