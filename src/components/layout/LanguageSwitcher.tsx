"use client";

import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { localePath, stripLocale } from "@/lib/i18n/paths";

/**
 * 現在のロケールはサーバーで解決した値を props で受け取り、
 * 切り替え先の href は usePathname() から組む。
 * /works/[slug] のような深いパスを知る手段は usePathname しかないため。
 *
 * next/link ではなく素の <a> なのは、ロケール切り替えをハードナビゲーションに
 * するため。[lang] はルートセグメントなので、ソフトナビで跨ぐとルートレイアウトが
 * まるごと再マウントされ、next-themes が no-flash 用の <script> をクライアントで
 * 再レンダリングしてしまう (React が「Scripts inside React components are never
 * executed when rendering on the client」を出す)。ついでに Hero の WebGL
 * コンテキストのロストも避けられる。
 * <a> のままでも middle-click・hreflang・クローラビリティは保てる。
 */
export function LanguageSwitcher({
  locale,
  ariaLabel,
}: {
  locale: Locale;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const rest = stripLocale(pathname);

  return (
    <nav aria-label={ariaLabel} className="flex items-center gap-2 text-sm">
      {LOCALES.map((l) => (
        <a
          key={l}
          href={localePath(l, rest)}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          onClick={() => {
            // 次に接頭辞なしで来たとき proxy がこの選択を尊重する
            document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={
            l === locale
              ? "text-accent"
              : "text-muted-foreground transition-colors hover:text-accent"
          }
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
