import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Accept-Language の簡易ネゴシエーション。
 * docs は @formatjs/intl-localematcher + negotiator を勧めているが、
 * 2 ロケールのサイトに 40KB の依存を足す価値はないので自前で持つ。
 */
function negotiate(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const preferences = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferences) {
    const hit = LOCALES.find((l) => tag === l || tag.startsWith(`${l}-`));
    if (hit) return hit;
  }
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first] = pathname.split("/");
  if (isLocale(first)) return;

  // ユーザーが明示的に選んだ言語 (cookie) を Accept-Language より優先する
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie)
    ? cookie
    : negotiate(request.headers.get("accept-language"));

  request.nextUrl.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // _next / 開発用の保存エンドポイント / 拡張子付きのパス (画像・favicon) は素通し
  matcher: ["/((?!_next|hero-capture/save|.*\\.[\\w]+$).*)"],
};
