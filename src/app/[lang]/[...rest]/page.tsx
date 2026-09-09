import { notFound } from "next/navigation";

/**
 * 存在しない URL を [lang] の中に引き込むためだけのページ。消さないこと。
 *
 * Next の /_not-found (どのルートにも一致しない URL の受け皿) は、app ディレクトリの
 * 根の not-found.tsx からしか組まれない。このサイトはルートレイアウトが
 * [lang]/layout.tsx にあり、根には layout.tsx が無いので、根に not-found.tsx を
 * 置くと Next が root layout を自動生成する ── html/body・フォント・globals.css・
 * ThemeProvider・SiteChrome を二重に持つことになる。
 * (global-not-found.tsx も同じ理由で採らない。experimental フラグが要るうえ、
 *  レイアウトを丸ごとバイパスするので next-themes のテーマが効かない。)
 *
 * ここに catch-all を置くと /ja/typo が [lang] の中で「一致する」ので、
 * レイアウトごと描画されてから notFound() が飛び、[lang]/not-found.tsx が受ける。
 * chrome もロケールもテーマもそのまま乗った 404 になる。
 *
 * 既存のルートは食わない。静的セグメント (about, works, …) と、より深い
 * 動的セグメント (blog/[slug]) の方が catch-all より優先されるため。
 */
export default function CatchAllPage(): never {
  notFound();
}
