import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { rehypeImageSize } from "@/lib/articles/rehype-image-size";
import { CODE_THEMES, getHighlighter } from "@/lib/articles/highlighter";
import { MarkdownImage } from "./MarkdownImage";
import { MarkdownLink } from "./MarkdownLink";

/**
 * 記事本文。Server Component なので Markdown の変換もコードの色付けもビルド時に
 * 済み、パーサもハイライタもクライアントには送られない。
 *
 * 生 HTML は通さない (rehype-raw を入れていない)。studio が書くのは
 * ブロックエディタが吐いた Markdown だけなので、必要になったことがない。
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
          rehypeImageSize,
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
