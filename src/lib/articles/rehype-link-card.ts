import { visit } from "unist-util-visit";
import { SITE } from "@/data/site";
import {
  fetchExternalCard,
  resolveInternalCard,
  type LinkCard,
} from "./link-card";
import type { Root, Element, ElementContent, Parent } from "hast";
import type { Locale } from "@/lib/i18n/config";

/**
 * 単独行に置かれた URL をリンクカードに置き換える rehype プラグイン。
 *
 * 拾うのは「段落の中身がリンク 1 つだけで、そのリンクテキストが href と同じ」もの。
 * remark-gfm が入っているので、裸の URL・`<https://…>`・`[https://…](https://…)` は
 * どれも hast では同じ `<p><a href="X">X</a></p>` になる。hast の側で見ておけば、
 * studio (Crepe) がどの形で書き出しても同じように拾える。
 *
 * リンクテキストを自分で書いたもの (`[Zenn の記事](url)`) は href と一致しないので
 * カードにならない ── 新しい記法を足さずに「ここはカードにしない」を表現できる、
 * という逃げ道をこの条件が兼ねている。
 *
 * サイト内のパス (`/blog/hello`) だけは「リンクですらない段落」も拾う。
 * gfm のオートリンクはプロトコル付きの URL しか見ないので、パスを 1 行書いても
 * hast では素のテキストのまま届く ── 一番自然に書く形が一番効かない、
 * ということになってしまう。行がまるごとサイト内のパスなら地の文ではありえない。
 *
 * 段落ごと差し替えるのは rehypeUnwrapImage と同じ理由。カードはブロックなので
 * `<p>` の中には置けない (ブラウザが段落を勝手に閉じて DOM がねじれる)。
 *
 * 非同期なのは他所のページを取りに行くため。ArticleBody が同期版の <Markdown> では
 * なく MarkdownAsync を使っているので、そのまま積める。
 */

type Options = { readonly locale: Locale };

type Target = {
  readonly parent: Parent;
  readonly index: number;
  readonly href: string;
};

/** 要素の中の文字を全部つなげる。オートリンクなら子はテキスト 1 つだけ。 */
function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

/** プロトコル相対 (`//example.com/x`) は外部 URL なので、サイト内とは見なさない。 */
const isSitePath = (href: string) =>
  (href.startsWith("/") && !href.startsWith("//")) || href.startsWith(SITE.url);

function cardElement(card: LinkCard): Element {
  return {
    type: "element",
    tagName: "a",
    properties: {
      href: card.href,
      "data-card-title": card.title,
      "data-card-site": card.siteName,
      ...(card.description ? { "data-card-description": card.description } : {}),
      ...(card.image ? { "data-card-image": card.image } : {}),
      ...(card.internal ? { "data-card-internal": "true" } : {}),
    },
    // MarkdownLink は data 属性から組み直すので、この中身は使われない。
    // それでも入れておくのは、万一この口を通らずに描かれたときに
    // 「リンクとしては読める」状態で落ちるため。
    children: [{ type: "text", value: card.title }],
  };
}

export function rehypeLinkCard({ locale }: Options) {
  return async (tree: Root) => {
    // 1. 候補を集める。visit の最中に木を書き換えると走査が乱れるので、
    //    ここでは触らない。
    const targets: Target[] = [];
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;

      // 空白だけのテキストは無視して、中身がリンク 1 つだけかを見る。
      const meaningful = node.children.filter(
        (child) =>
          !(child.type === "text" && child.value.trim() === "") &&
          child.type !== "comment",
      );
      if (meaningful.length !== 1) return;

      const only = meaningful[0];

      // 行がサイト内のパスだけでできている場合。解決できなければ
      // 素のテキストのまま残るので、間違って拾っても壊れない。
      if (only.type === "text") {
        const path = only.value.trim();
        if (path.startsWith("/") && !path.startsWith("//")) {
          targets.push({ parent, index, href: path });
        }
        return;
      }

      if (only.type !== "element" || only.tagName !== "a") return;

      const href = only.properties?.href;
      if (typeof href !== "string" || href === "") return;
      if (textOf(only).trim() !== href.trim()) return;

      targets.push({ parent, index, href });
    });

    if (targets.length === 0) return;

    // 2. サイト内は同期で解決し、外部だけまとめて取りに行く。
    //    同じ URL を 2 度貼っても取得は 1 回。
    const resolved = new Map<string, LinkCard>();
    const external: string[] = [];
    const seen = new Set<string>();

    for (const { href } of targets) {
      if (seen.has(href)) continue;
      seen.add(href);

      const internal = resolveInternalCard(href, locale);
      if (internal) {
        resolved.set(href, internal);
        continue;
      }
      // 記事でないサイト内リンクを外に取りに行っても意味がない
      // (自分のページを自分で fetch することになる)。素のリンクのまま残す。
      if (isSitePath(href)) continue;

      external.push(href);
    }

    await Promise.all(
      external.map(async (url) => {
        const card = await fetchExternalCard(url);
        if (card) resolved.set(url, card);
      }),
    );

    // 3. 差し替える。段落 1 つをリンク 1 つに置くだけなので、
    //    先に控えた index はずれない。
    for (const { parent, index, href } of targets) {
      const card = resolved.get(href);
      // 取れなかったものは何もしない = 今までどおりの素のリンクで残る。
      if (card) parent.children[index] = cardElement(card);
    }
  };
}
