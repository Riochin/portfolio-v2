import "server-only";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { rehypeDemoteH1 } from "./rehype-demote-h1";
import { rehypeLowercaseLang } from "./rehype-lowercase-lang";
import { rehypeUnwrapImage } from "./rehype-unwrap-image";
import { rehypeImageSize } from "./rehype-image-size";
import { rehypeLinkCard } from "./rehype-link-card";
import { CODE_THEMES, getHighlighter } from "./highlighter";
import type { Options } from "react-markdown";
import type { Locale } from "@/lib/i18n/config";

/**
 * 記事本文を Markdown から HTML にする変換の並び。ArticleBody が MarkdownAsync に渡す。
 *
 * コンポーネントから切り出してあるのはテストのため。依存の更新で出力の形が
 * 変わっていないかを、本番と同じ並びのまま確かめられるようにしている
 * (articles/markdown.test.tsx)。
 */
export async function articleMarkdownOptions(
  locale: Locale,
): Promise<Pick<Options, "remarkPlugins" | "rehypePlugins">> {
  const highlighter = await getHighlighter();

  return {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      // raw を本物の要素に開くのが先。後ろの 2 つは要素を見て回るので、
      // ここが後回しだと HTML の中の img やコードに手が届かない。
      rehypeRaw,
      // raw を開いた後に落とす。生の <h1> で書かれていても拾えるように。
      rehypeDemoteH1,
      // figure で包めるように、画像だけの段落から p を外しておく。
      rehypeUnwrapImage,
      // 同じく「子が 1 つだけの段落」をほどく側なので隣に置く。
      // こちらはリンクだけの段落をカードに差し替える。
      [rehypeLinkCard, { locale }],
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
    ],
  };
}
