"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  /** ロケール接頭辞まで解決済みの href。組み立ては SiteChrome (server) が行う。 */
  readonly href: string;
  readonly label: string;
};

export function SideNav({
  items,
  heading,
  headingHref,
  ariaLabel,
}: {
  items: readonly NavItem[];
  heading: string;
  headingHref: string;
  ariaLabel: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel}>
      <Link
        href={headingHref}
        className="mb-6 block text-xl font-bold text-foreground transition-colors hover:text-accent"
      >
        {heading}
      </Link>
      {/* ピルの padding のぶんだけ左に寄せて、文字の左端を見出しと揃える */}
      <ul className="-ml-4 flex flex-col gap-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-block rounded-full px-4 py-1.5 transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-foreground hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
