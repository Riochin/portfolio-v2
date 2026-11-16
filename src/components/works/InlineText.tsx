import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/paths";
import { isSitePath, splitInlineLinks } from "@/lib/inline-links";

const LINK_CLASS =
  "text-accent underline underline-offset-[0.2em] transition-opacity hover:opacity-70";

/**
 * 日本語の段落では、リンクの英字も途中で折り返してよいことにする。
 * 「Imacalla」のような語は丸ごと次の行へ送られ、前の行の右端が空いてしまうため。
 * 英語の段落で単語が途中で切れると読みにくいので、日本語だけに当てる。
 */
const linkClass = (locale: Locale) =>
  locale === "ja" ? `${LINK_CLASS} break-all` : LINK_CLASS;

/**
 * 作品の段落。`[文字](/works/off)` だけをリンクにして、ほかはそのまま出す。
 * サイト内はロケールを前に足して next/link で、外部は別タブで開く
 * (トップの道のりの href と同じ扱い)。
 */
export function InlineText({ text, locale }: { text: string; locale: Locale }) {
  return splitInlineLinks(text).map((segment, i) => {
    if (segment.kind === "text") return segment.text;
    if (isSitePath(segment.href)) {
      return (
        <Link
          key={i}
          href={localePath(locale, segment.href)}
          className={linkClass(locale)}
        >
          {segment.text}
        </Link>
      );
    }
    return (
      <a
        key={i}
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass(locale)}
      >
        {segment.text}
        <ExternalLink
          size={13}
          className="ml-1 inline-block align-[-0.125em] opacity-60"
        />
      </a>
    );
  });
}
