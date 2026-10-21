import { MarkdownAsync } from "react-markdown";
import { articleMarkdownOptions } from "@/lib/articles/markdown";
import type { Locale } from "@/lib/i18n/config";
import { MarkdownImage } from "./MarkdownImage";
import { MarkdownLink } from "./MarkdownLink";

/**
 * 記事本文。Server Component なので Markdown の変換もコードの色付けもビルド時に
 * 済み、パーサもハイライタもクライアントには送られない。
 *
 * 生 HTML は rehype-raw で通す。studio (Crepe) は本文中の空行を `<br />` として
 * 書き出し、読み込み時もそれを空行に戻す ── エディタ側では往復しているので、
 * ここで通さないと「編集画面では空いているのに公開ページには <br /> の文字が
 * 出る」ことになる。書き手は自分ひとりで、中身は commit を経てリポジトリに
 * 入るものだけなので、任意の HTML を許して困る相手が居ない。
 *
 * 同期版の <Markdown> ではなく MarkdownAsync を使うのは、shiki の rehype
 * プラグインが非同期だから ── 同期版は内部で runSync() を呼ぶので例外になる。
 * リンクカードが他所のページを取りに行けるのも、この形になっているおかげ。
 *
 * 変換の並びは lib/articles/markdown.ts にある。
 *
 * locale を受け取るのはリンクカードのため。lib/articles/ は OG 画像から呼べるよう
 * ロケール非依存を守る必要があるので、サイト内リンクの行き先を
 * `/ja/blog/...` に直す変換はここから下でだけ行う (lib/output/self.ts と同じ)。
 */
export async function ArticleBody({
  markdown,
  locale,
}: {
  markdown: string;
  locale: Locale;
}) {
  const options = await articleMarkdownOptions(locale);

  return (
    <div className="article-body">
      <MarkdownAsync
        {...options}
        components={{ img: MarkdownImage, a: MarkdownLink }}
      >
        {markdown}
      </MarkdownAsync>
    </div>
  );
}
