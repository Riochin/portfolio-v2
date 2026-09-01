export function PageShell({
  wide = false,
  children,
}: {
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh w-full px-6 py-16 md:pl-[28%] md:pr-[8%]">
      <div className={wide ? "max-w-6xl" : "max-w-3xl"}>{children}</div>
    </main>
  );
}
