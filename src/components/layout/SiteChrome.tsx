import Link from "next/link";

import { Copyright } from "./Copyright";
import { MobileMenu } from "./MobileMenu";
import { SideNav, type NavItem } from "./SideNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SocialLinks } from "./SocialLinks";
import { NAV_ITEMS, SITE } from "@/data/site";
import { DICT } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/paths";

/**
 * ロケールの解決点。Server Component のまま、ナビ・aria ラベルを解決して
 * 各 Client Component へプレーンなデータとして渡す。
 * (SocialLink がアイコンのコンポーネント参照ではなく key を持つのはこのため)
 */
export async function SiteChrome() {
  const { locale, t } = await getT();

  const items: readonly NavItem[] = NAV_ITEMS.map((item) => ({
    href: localePath(locale, item.path),
    label: t(DICT.nav[item.key]),
  }));

  const homeHref = localePath(locale, "/");

  const labels = {
    open: t(DICT.aria.openMenu),
    close: t(DICT.aria.closeMenu),
    mainNav: t(DICT.aria.mainNav),
  };

  return (
    <>
      <MobileMenu
        items={items}
        heading={SITE.wordmark}
        headingHref={homeHref}
        labels={labels}
        languageSwitcher={
          <LanguageSwitcher
            locale={locale}
            ariaLabel={t(DICT.aria.languageToggle)}
          />
        }
      />
      {/* モバイルはサイドナビが畳まれるので、ホームへの導線としてワードマークを
          画面上部中央に常設する。ハンバーガーと天地を揃えたいので、
          ボタンと同じ h-12 の箱に入れて中央寄せする。
          メニュー展開時はオーバーレイ (z-50) の下に隠れ、
          代わりにその中の SideNav 見出しが同じ役割を担う。 */}
      <Link
        href={homeHref}
        className="fixed left-1/2 top-4 z-40 flex h-12 -translate-x-1/2 items-center font-logo text-3xl leading-none text-foreground md:hidden"
      >
        {SITE.wordmark}
      </Link>
      {/* SNS アイコンは全ページ共通で右端の同じ位置に置く */}
      <div className="fixed right-[10%] top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <SocialLinks />
      </div>
      <div className="fixed left-[10%] top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-16 md:flex">
        <SideNav
          items={items}
          heading={SITE.wordmark}
          headingHref={homeHref}
          ariaLabel={labels.mainNav}
        />
        <div className="flex flex-col gap-3">
          <LanguageSwitcher
            locale={locale}
            ariaLabel={t(DICT.aria.languageToggle)}
          />
          <Copyright />
        </div>
      </div>
    </>
  );
}
