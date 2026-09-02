"use client";

import { Crepe } from "@milkdown/crepe";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { languages } from "@codemirror/language-data";
import { rosePineDawn } from "./rosePineDawnCodeMirror";
import { remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import {
  remarkImageBlockHtml,
  configureAltPreservingImageBlock,
} from "./imageBlockMarkdown";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
// Crepe の既定テーマをサイトのトークンに繋ぎ替える。必ずテーマの後に読む。
import "./milkdown-theme.css";

/**
 * ブロックエディタ本体。dev 専用の /studio でしか読み込まれない。
 *
 * Milkdown (Crepe) を選んだのは、内部表現が remark ── つまり Markdown そのもの
 * だから。content/articles/*.md を情報源にする以上、開いて保存するだけで本文が
 * 変質しないことが要件になる。Tiptap + tiptap-markdown は橋渡しが古く
 * (0.9.0 / 本体は 3.x)、BlockNote は Markdown 変換が公式に lossy なので採らない。
 *
 * 素の @milkdown/kit ではなく Crepe を使うのは、kit の plugin-block /
 * plugin-slash が `content: HTMLElement` を要求するヘッドレスな配置機構でしか
 * なく、ドラッグハンドルもスラッシュメニューの中身も自前になるため。
 * (Vue が依存に入るのは kit でも同じで、Crepe を避けても減らない)
 */

export type EditorApi = {
  /** 現在の本文を Markdown で取り出す。保存ボタンから呼ぶ。 */
  getMarkdown: () => string;
};

type Props = {
  defaultValue: string;
  /**
   * 画像の保存先を決めるための slug。関数で受け取るのは、
   * エディタの生成が初回マウント 1 回きりで、その時点の slug を閉じ込めてしまうから
   * (新規作成では slug を後から打つ)。
   */
  getSlug: () => string;
  onReady: (api: EditorApi) => void;
  onError: (message: string) => void;
};

function CrepeEditor({ defaultValue, getSlug, onReady, onError }: Props) {
  useEditor((root) => {
    /** 落とした画像を dev 専用の口に送り、本文に入れる URL を返す。 */
    const upload = async (file: File): Promise<string> => {
      const slug = getSlug();
      if (slug === "") {
        const message = "先に slug を決めてから画像を貼ってください";
        onError(message);
        throw new Error(message);
      }

      const form = new FormData();
      form.append("slug", slug);
      form.append("file", file);

      const response = await fetch("/studio/upload", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        const message = payload.error ?? "画像を保存できませんでした";
        onError(message);
        throw new Error(message);
      }
      return payload.url;
    };

    const crepe = new Crepe({
      root,
      defaultValue,
      featureConfigs: {
        // 本文から h1 を出せなくする。記事ページの h1 はタイトルの 1 つだけで、
        // 本文にもあると見出しが 2 つある形になるため。
        // これはスラッシュメニューから消すだけなので、`# ` と打つ入力ルールは
        // 残る ── そちらは milkdown-theme.css が h1 を h2 と同じ見た目にして、
        // 公開側は rehypeDemoteH1 が h2 に落とすことで辻褄を合わせている。
        [Crepe.Feature.BlockEdit]: { textGroup: { h1: null } },
        // 公開後と同じ配色にする ── ダークは Dracula、ライトは rose-pine-dawn
        // (lib/articles/highlighter.ts)。別のテーマだと仕上がりを想像しながら
        // 書けない。
        //
        // 判定はマウント時の 1 回きり。CodeMirror のテーマを後から差し替えるには
        // Compartment が要るが、書いている途中にテーマを切り替えるのは稀なので
        // 持ち込まない (切り替えたらページを開き直せば追随する)。
        [Crepe.Feature.CodeMirror]: {
          // 言語定義は自分で渡す。Crepe の既定は空リスト
          // (`const { languages = [] } = config`) なので、渡さないと
          // どの言語も色が付かない ── テーマを差し替えても塗る対象が無い。
          // @codemirror/language-data は各言語を必要になってから読むので、
          // 全部渡してもエディタの初期表示は重くならない。
          languages,
          theme: document.documentElement.classList.contains("dark")
            ? dracula
            : rosePineDawn,
        },
        [Crepe.Feature.ImageBlock]: {
          onUpload: upload,
          inlineOnUpload: upload,
          blockOnUpload: upload,
        },
      },
    });

    // 吐き出す Markdown を手書きの慣習に揃える。remark-stringify の既定は
    // 箇条書きも水平線も `*` だが、手で書くときは `-` を使うので、開いて保存する
    // だけで全部の行が書き換わり diff が汚れる。
    crepe.editor.config((ctx) => {
      ctx.set(remarkStringifyOptionsCtx, { bullet: "-", rule: "-" });
      // 画像の alt を潰さない書き出しに差し替える。
      configureAltPreservingImageBlock(ctx);
    });

    // HTML で書かれた画像を読み戻すための remark プラグイン。
    // (Milkdown 本体のものは Markdown 記法の画像しか見ない)
    crepe.editor.use(remarkImageBlockHtml);

    onReady({ getMarkdown: () => crepe.getMarkdown() });
    return crepe;
    // 生成は 1 回きり。本文の再読み込みが要るときは親が key を変えて作り直す。
  }, []);

  return <Milkdown />;
}

export default function MilkdownEditor(props: Props) {
  return (
    <MilkdownProvider>
      <CrepeEditor {...props} />
    </MilkdownProvider>
  );
}
