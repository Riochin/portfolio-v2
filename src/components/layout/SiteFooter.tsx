import { Copyright } from "./Copyright";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SocialLinks } from "./SocialLinks";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";

/**
 * モバイル専用のフッター。
 *
 * PC は左レール (ワードマーク・ナビ・JP/EN・テーマ・©) と右レール (SNS) が
 * 画面端に出しっぱなしなので、同じものを下にも置くと二重になる。md 以上で
 * 畳んでいるのはそのため。
 *
 * 逆にモバイルでは、その両レールがまるごとハンバーガーの中に入っている。
 * つまり「開かないと連絡先も著作表示も出てこない」状態だったので、そこだけを
 * 埋める最小の構成にしてある ── SNS・JP/EN・© の 3 つだけ。
 *
 * テーマ切替は入れていない。モバイルではヘッダー右端に常設されていて、
 * 足すと画面内に同じボタンが 2 つ並ぶため。
 *
 * 置き場所は PageShell。ヒーロー (トップ) だけは PageShell を使わず自前の
 * <main> で 1 画面に閉じているので、pathname を見て消す必要がない。
 */
export async function SiteFooter() {
  const { locale, t } = await getT();

  return (
    <footer className="flex flex-col items-center gap-6 border-t border-border px-6 pb-10 pt-8 md:hidden">
      <SocialLinks direction="row" />
      <LanguageSwitcher
        locale={locale}
        ariaLabel={t(DICT.aria.languageToggle)}
      />
      <Copyright />
    </footer>
  );
}
