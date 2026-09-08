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
          /* 字そのものは 19x23 しかなく、WCAG 2.2 の下限 (24x24) を割る。
             見た目を動かさずに当たり判定だけ広げたいので、透明な擬似要素を
             敷く (padding + 相殺マージンと違い、flex の計算にも
             getBoundingClientRect にも出ない)。
             横を 4px までにしているのは、gap-2 (8px) で隣り合う JA と EN の
             判定がちょうど接して重ならない上限だから。ここを 44px まで
             広げると判定が食い合い、隙間を押したとき逆側が反応する。 */
          className={`relative before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] ${
            l === locale
              ? "text-accent"
              : "text-muted-foreground transition-colors hover:text-accent"
          }`}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
