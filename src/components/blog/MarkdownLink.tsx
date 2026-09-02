import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * 本文中のリンク。サイト内は next/link でクライアント遷移、外部は別タブ。
 *
 * OutputGrid が外部リンクにだけ target を付けるのと同じ判断を、本文でも揃える。
 */
export function MarkdownLink({
  href,
  children,
}: ComponentPropsWithoutRef<"a">) {
  if (typeof href !== "string" || href === "") return <>{children}</>;

  const internal = href.startsWith("/") && !href.startsWith("//");
  if (internal) return <Link href={href}>{children}</Link>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
