import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import { $remark } from "@milkdown/kit/utils";
import { visit } from "unist-util-visit";
import type { Ctx } from "@milkdown/kit/ctx";
import type { Root, Paragraph, Parent } from "mdast";

/**
 * 画像ブロックの Markdown への書き出し方を差し替える。
 *
 * Milkdown の既定は `![<ratio>](<src> "<caption>")` ── 拡大率を **alt 欄に**
 * 書き込む。Markdown の画像は url / alt / title の 3 枠しか無く、そこに
 * src / ratio / caption を詰めた結果、alt (読み上げ用の説明) の居場所が
 * 無くなっている。開いて保存するだけで `![雲の写真]` が `![1.00]` になり、
 * 書いた説明が毎回消えていた。
 *
 * ここでは alt を alt のまま残し、4 つ目の値である ratio が要るときだけ
 * HTML の img に切り替える:
 *
 * - 等倍 (既定): `![説明](/articles/x/y.png "キャプション")`
 *   標準の Markdown のままなので Zenn / Qiita にそのまま貼れる
 * - 拡大縮小あり: `<img src="..." alt="..." title="..." data-scale="0.65" />`
 *   rehype-raw を通してあるので公開側でもそのまま描ける
 *
 * ratio は「本文幅いっぱいに置いたときの高さ」に対する倍率。エディタの img は
 * width を指定していない (auto) ので、高さを変えると幅も比例して動く ──
 * 実測: 400x200 の画像に height:100px を与えると 200x100 になる。
 * したがってこれは比率を保った縮小で、倍率はそのまま「本文幅に対する幅の割合」
 * として読める。CSS の object-fit: cover は、箱の縦横比が実物と一致している限り
 * 何も切らない (config.maxWidth / maxHeight で潰れたときの保険)。
 *
 * Markdown 上は data-scale と呼ぶ。ProseMirror 側の属性名 (ratio) は Crepe の
 * ものなので変えられないが、ファイルを読む人には「倍率」と分かるほうがよい。
 */

/** 等倍とみなす幅。ドラッグの丸め誤差で 1.00 が 0.99 になることがある。 */
const FULL_SIZE_EPSILON = 0.005;

const isFullSize = (ratio: number) => Math.abs(ratio - 1) < FULL_SIZE_EPSILON;

function toRatio(value: unknown): number {
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const unescapeHtml = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");

function buildImgTag(attrs: {
  src: string;
  alt: string;
  caption: string;
  ratio: number;
}): string {
  const parts = [`src="${escapeHtml(attrs.src)}"`, `alt="${escapeHtml(attrs.alt)}"`];
  if (attrs.caption) parts.push(`title="${escapeHtml(attrs.caption)}"`);
  parts.push(`data-scale="${attrs.ratio.toFixed(2)}"`);
  return `<img ${parts.join(" ")} />`;
}

/** 単独の img タグだけでできた HTML かを見る。段落の中に紛れた img は拾わない。 */
const IMG_ONLY = /^<img\b[^>]*>$/i;

function readAttr(tag: string, name: string): string | undefined {
  const matched = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return matched ? unescapeHtml(matched[1]) : undefined;
}

/**
 * Milkdown が Markdown との間で受け渡す image-block ノード。
 * mdast の標準にある型ではないので、ここで形だけ書いておく。
 */
type ImageBlockNode = {
  type: "image-block";
  url: string;
  alt: string;
  title: string;
  ratio: number;
};

/**
 * `<img ... />` だけの段落を image-block に開く。
 *
 * Milkdown 本体の remark プラグインは Markdown 記法の画像だけを見るので、
 * HTML で書かれたものはここで拾わないとエディタ上でただの HTML の塊になる。
 */
export const remarkImageBlockHtml = $remark("remark-image-block-html", () => {
  return () => (tree: Root) => {
    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.children.length !== 1) return;

      const child = node.children[0];
      if (child.type !== "html") return;

      const tag = child.value.trim();
      if (!IMG_ONLY.test(tag)) return;

      const src = readAttr(tag, "src");
      if (!src) return;

      const block: ImageBlockNode = {
        type: "image-block",
        url: src,
        alt: readAttr(tag, "alt") ?? "",
        title: readAttr(tag, "title") ?? "",
        ratio: toRatio(readAttr(tag, "data-scale")),
      };
      // image-block は mdast の標準ノードではないので、型の上では入らない。
      (parent as Parent).children.splice(index, 1, block as never);
    });
  };
});

/**
 * スキーマの ctx を上書きする。
 *
 * extendSchema は同じ id で新しいプラグインを作るので、Crepe が既に積んでいる
 * ものと併用すると衝突する。スキーマを持っているスライスを差し替えるほうが安全。
 */
export function configureAltPreservingImageBlock(ctx: Ctx) {
  ctx.update(imageBlockSchema.key, (previous) => (innerCtx) => {
    const base = previous(innerCtx);

    // base と同じ型で組み立てる。こうすると runner の引数の型が
    // Milkdown 側の定義から降ってきて、自前で書き写さずに済む。
    const patched: typeof base = {
      ...base,
      attrs: {
        ...base.attrs,
        alt: { default: "", validate: "string" },
      },

      parseDOM: [
        {
          tag: 'img[data-type="image-block"]',
          getAttrs: (dom) => {
            if (!(dom instanceof HTMLElement)) return {};
            return {
              src: dom.getAttribute("src") ?? "",
              alt: dom.getAttribute("alt") ?? "",
              caption: dom.getAttribute("caption") ?? "",
              ratio: toRatio(dom.getAttribute("ratio")),
            };
          },
        },
      ],

      parseMarkdown: {
        match: ({ type }) => type === "image-block",
        runner: (state, node, type) => {
          const block = node as unknown as Partial<ImageBlockNode>;
          state.addNode(type, {
            src: block.url ?? "",
            alt: block.alt ?? "",
            caption: block.title ?? "",
            ratio: toRatio(block.ratio),
          });
        },
      },

      toMarkdown: {
        match: (node) => node.type.name === "image-block",
        runner: (state, node) => {
          const src = String(node.attrs.src ?? "");
          const alt = String(node.attrs.alt ?? "");
          const caption = String(node.attrs.caption ?? "");
          const ratio = toRatio(node.attrs.ratio);

          state.openNode("paragraph");
          if (isFullSize(ratio)) {
            // 触っていない画像は標準の Markdown のまま残す。
            state.addNode("image", undefined, undefined, {
              url: src,
              alt,
              // 空文字だと `![alt](src "")` と余計な引用符が残るので、
              // キャプションが無いときは title ごと落とす。
              ...(caption ? { title: caption } : {}),
            });
          } else {
            state.addNode(
              "html",
              undefined,
              buildImgTag({ src, alt, caption, ratio }),
            );
          }
          state.closeNode();
        },
      },
    };

    return patched;
  });
}
