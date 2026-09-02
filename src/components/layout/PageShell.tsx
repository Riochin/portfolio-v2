export function PageShell({
  wide = false,
  children,
}: {
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    // 左は固定ナビ、右は固定の SNS アイコン(right-[10%])の分を空ける
    <main className="min-h-dvh w-full px-6 py-16 md:pl-[28%] md:pr-[18%]">
      <div className={wide ? "" : "max-w-3xl"}>{children}</div>
    </main>
  );
}
