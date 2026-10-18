"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { arrivedFrom } from "@/components/works/WorksHistoryBridge";
import { stripLocale } from "@/lib/i18n/paths";

/**
 * 詳細ページの「一覧に戻る」。
 *
 * 素の <Link> は push なので、どこから来ても一覧へ進んでしまう。トップの
 * タイルから作品や記事を開いた人が「戻る」を押すと、来たことのない一覧に
 * 着き、しかもスクロールは先頭から。
 *
 * そこで来た道で振る舞いを分ける:
 * - 一覧から来た: 履歴を 1 つ戻る ── ブラウザの戻るボタンと同じ扱い ── に
 *   して、読んでいた位置に帰す (Works のモーフは WorksHistoryBridge が面倒をみる)
 * - 一覧以外のサイト内 (トップなど) から来た: `elsewhere` を渡していれば
 *   その表示 (「戻る」) に替えて、同じく履歴を戻る
 * - 直リンク・リロード・戻る/進むで着いた: 戻り先が分からないので、
 *   素直に一覧へ push する
 *
 * 表示を描き分けるのは render 中。ハイドレーションでは「来た道」がまだ
 * 無い (= 一覧の表示) ので、サーバーの HTML とずれない。
 */
export function BackLink({
  href,
  className,
  children,
  elsewhere,
}: {
  /** 一覧の URL。ハッシュ付きでもよい (比べるのはパスだけ)。 */
  href: string;
  className?: string;
  children: React.ReactNode;
  /** 一覧以外のサイト内ページから来たときの表示。省くと一覧から来たときだけ戻る。 */
  elsewhere?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const from = arrivedFrom(pathname);
  const listPath = stripLocale(new URL(href, "http://_").pathname);
  const fromList = from !== null && stripLocale(from) === listPath;
  const fromElsewhere = from !== null && !fromList && elsewhere !== undefined;
  const goesBack = fromList || fromElsewhere;

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
        if (!goesBack) return;
        event.preventDefault();
        router.back();
      }}
    >
      {fromElsewhere ? elsewhere : children}
    </Link>
  );
}
