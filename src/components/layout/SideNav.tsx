"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/about", label: "About me" },
  { href: "/works", label: "Works" },
  { href: "/experience", label: "Experience" },
  { href: "/output", label: "Output" },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="メインナビゲーション">
      <Link
        href="/"
        className="mb-6 block text-xl font-bold text-foreground transition-colors hover:text-accent"
      >
        Rio Ichikawa
      </Link>
      {/* ピルの padding のぶんだけ左に寄せて、文字の左端を見出しと揃える */}
      <ul className="-ml-4 flex flex-col gap-2">
        {navItems.map((item) => {
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
