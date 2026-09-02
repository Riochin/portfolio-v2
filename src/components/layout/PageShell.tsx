export function PageShell({
  wide = false,
  children,
}: {
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    // 左は固定ナビ、右は固定の SNS アイコン(right-[10%])の分を空ける。
    // モバイルは上に固定ヘッダー (高さ 3.875rem) が乗るので、その下に
    // 余白が残るよう天だけ厚くする。md 以上はヘッダーが無いので元の py-16。
    <main className="min-h-dvh w-full px-6 pb-16 pt-28 md:py-16 md:pl-[28%] md:pr-[18%]">
      <div className={wide ? "" : "max-w-3xl"}>{children}</div>
    </main>
  );
}
