"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cameFromWorksList } from "./WorksHistoryBridge";

/**
 * 詳細ページの「Works に戻る」。
 *
 * 素の <Link> は push なので、一覧に着いたときスクロールが必ず先頭に戻る。
 * 一覧から来ているときは履歴を 1 つ戻す ── ブラウザの戻るボタンと同じ扱い ──
 * にして、読んでいた位置に帰す (モーフは WorksHistoryBridge が面倒をみる)。
 *
 * 直リンクや別ページ経由で来たときは戻り先が一覧ではないので、素直に push する。
 */
export function BackToWorksLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        // 修飾キー・中クリックは「別タブで開く」なのでブラウザに渡す。
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        if (!cameFromWorksList()) return;
        event.preventDefault();
        router.back();
      }}
    >
      {children}
    </Link>
  );
}
