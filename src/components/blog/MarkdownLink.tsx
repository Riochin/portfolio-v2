import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LinkCard } from "./LinkCard";
import type { ComponentPropsWithoutRef } from "react";

/**
 * 本文中のリンク。サイト内は next/link でクライアント遷移、外部は別タブ。
 *
 * OutputGrid が外部リンクにだけ target と ExternalLink の印を付けるのと同じ判断を、
 * 本文でも揃える。印を inline-block にするのは位置合わせのためだけではない ──
 * CSS の text-decoration は atomic inline-level な子孫には伝播しないので、
 * globals.css の `.article-body a` が引く下線がアイコンの下まで伸びずに済む。
 *
 * rehypeLinkCard が置いた単独行のリンクは data 属性でカードの中身を運んでくる。
 * `<a>` のまま出しておくことで、ここを通らなくてもリンクとしては機能し、
 * 差し込む口も既にある components={{ a: MarkdownLink }} で足りる。
 * data 属性がハイフンのままの prop 名で届くのは MarkdownImage の data-scale と同じ。
 */
export function MarkdownLink({
  href,
  children,
  ...rest
}: ComponentPropsWithoutRef<"a">) {
  if (typeof href !== "string" || href === "") return <>{children}</>;

  const data = rest as Record<string, unknown>;
  const read = (key: string) => {
    const value = data[key];
    return typeof value === "string" && value !== "" ? value : undefined;
  };

  const cardTitle = read("data-card-title");
  if (cardTitle) {
    return (
      <LinkCard
        href={href}
        title={cardTitle}
        description={read("data-card-description")}
        image={read("data-card-image")}
        siteName={read("data-card-site") ?? ""}
        internal={data["data-card-internal"] === "true"}
      />
    );
  }

  const internal = href.startsWith("/") && !href.startsWith("//");
  if (internal) return <Link href={href}>{children}</Link>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink
        size={14}
        className="ml-1 inline-block align-baseline opacity-60"
      />
    </a>
  );
}
