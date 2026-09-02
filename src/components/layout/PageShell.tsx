import { SiteFooter } from "./SiteFooter";

export function PageShell({
  wide = false,
  children,
}: {
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 左は固定ナビ、右は固定の SNS アイコン(right-[10%])の分を空ける。
          モバイルは上に固定ヘッダー (高さ 3.875rem) が乗るので、その下に
          余白が残るよう天だけ厚くする。md 以上はヘッダーが無いので元の py-16。

          高さは min-h-dvh ではなく flex-1。body が縦の flex なので、中身が
          短いページでもここが残りを埋め、下のフッターが画面下端に落ち着く
          (min-h-dvh のままだと必ず 1 画面ぶん送らないとフッターに届かない)。 */}
      <main className="w-full flex-1 px-6 pb-16 pt-28 md:py-16 md:pl-[28%] md:pr-[18%]">
        <div className={wide ? "" : "max-w-3xl"}>{children}</div>
      </main>
      {/* フッターはモバイルだけ。ヒーローは PageShell を使わないので出ない。 */}
      <SiteFooter />
    </>
  );
}
