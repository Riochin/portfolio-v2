import { MARKDOWN_CONTENT_TYPE } from "@/lib/markdown/negotiate";
import { renderMarkdown } from "@/lib/markdown/pages";

/**
 * ページの Markdown 版を返す口。直接は叩かない。
 *
 * proxy.ts が `Accept: text/markdown` のリクエストだけをここへ rewrite する
 * (/ja/works → /markdown/ja/works)。ブラウザのアドレスは変わらないので、
 * エージェントからは同じ URL が Markdown で返ってくるように見える。
 * /markdown/... を直に叩くと proxy がロケールを前に足してリダイレクトし、
 * [lang] の catch-all で 404 になる。
 *
 * [lang] の外に置くのは Route Handler で next/root-params が使えないのと、
 * [lang] の下は page.tsx と同じ階層に route.ts を置けないため。
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/markdown/[...path]">,
) {
  const { path } = await params;
  const { status, body } = await renderMarkdown(`/${path.join("/")}`);

  return new Response(body, {
    status,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      // 同じ URL が Accept で HTML と Markdown に分かれるので、キャッシュに伝える。
      Vary: "Accept",
    },
  });
}
