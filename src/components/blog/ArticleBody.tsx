import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { rehypeDemoteH1 } from "@/lib/articles/rehype-demote-h1";
import { rehypeLowercaseLang } from "@/lib/articles/rehype-lowercase-lang";
import { rehypeUnwrapImage } from "@/lib/articles/rehype-unwrap-image";
import { rehypeImageSize } from "@/lib/articles/rehype-image-size";
import { CODE_THEMES, getHighlighter } from "@/lib/articles/highlighter";
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
 */
export async function ArticleBody({ markdown }: { markdown: string }) {
  const highlighter = await getHighlighter();

  return (
    <div className="article-body">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          // raw を本物の要素に開くのが先。後ろの 2 つは要素を見て回るので、
          // ここが後回しだと HTML の中の img やコードに手が届かない。
          rehypeRaw,
          // raw を開いた後に落とす。生の <h1> で書かれていても拾えるように。
          rehypeDemoteH1,
          // figure で包めるように、画像だけの段落から p を外しておく。
          rehypeUnwrapImage,
          rehypeImageSize,
          // 言語名の大小を均してから shiki に渡す。
          rehypeLowercaseLang,
          [
            rehypeShikiFromHighlighter,
            highlighter,
            {
              themes: CODE_THEMES,
              // 片方を既定色に焼かず、両方を CSS 変数として出す。
              // globals.css の .dark が切り替える。
              defaultColor: false,
              // 言語を書き忘れたブロックと、積んでいない言語のブロック。
              // どちらも色は付かないが、地の色は他と揃えたいので text として通す
              // (揃えないと、そこだけ明るい面になって記事の中で目立ってしまう)。
              defaultLanguage: "text",
              fallbackLanguage: "text",
            },
          ],
        ]}
        components={{ img: MarkdownImage, a: MarkdownLink }}
      >
        {markdown}
      </MarkdownAsync>
    </div>
  );
}
