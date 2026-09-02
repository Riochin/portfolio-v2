import Link from "next/link";

import { ChromeThemeToggle } from "./ChromeThemeToggle";
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

  const items: readonly NavItem[] = [
    ...NAV_ITEMS.map((item) => ({
      href: localePath(locale, item.path),
      label: t(DICT.nav[item.key]),
    })),
    // 記事を書く studio は dev だけの道具なので NAV_ITEMS には混ぜず、ここで
    // 末尾 (Output の下) に足す。本番ではページ自体が notFound() になるので
    // 項目も出さない。文言を DICT に足さないのも studio のページと同じ理由で、
    // 著者ひとりの道具なので日英に訳す相手が居ない。
    ...(process.env.NODE_ENV === "production"
      ? []
      : [{ href: localePath(locale, "/studio"), label: "Studio" }]),
  ];

  const homeHref = localePath(locale, "/");

  const labels = {
    open: t(DICT.aria.openMenu),
    close: t(DICT.aria.closeMenu),
    mainNav: t(DICT.aria.mainNav),
  };

  return (
    <>
      {/* モバイルはサイドナビが畳まれるので、ホームへの導線としてワードマークを
          画面上部中央に常設する。ハンバーガーと同じヘッダー行に載せたいので、
          MobileMenu へ slot として渡す。 */}
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
        themeToggle={
          <ChromeThemeToggle
            ariaLabel={t(DICT.aria.themeToggle)}
            className="pointer-events-auto absolute inset-y-0 -right-[7px] flex items-center"
          />
        }
        wordmark={
          <Link
            href={homeHref}
            className="font-logo text-3xl leading-none text-foreground"
          >
            {SITE.wordmark}
          </Link>
        }
      />
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
          {/* テーマ切替は JP/EN と同じ「サイトの設定」の列なので同じ行に並べる。
              ヒーローではボタンが消えるが、行の高さは JP/EN が決めるので
              下の Copyright は動かない。 */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher
              locale={locale}
              ariaLabel={t(DICT.aria.languageToggle)}
            />
            <ChromeThemeToggle
              ariaLabel={t(DICT.aria.themeToggle)}
              className="-my-2"
            />
          </div>
          <Copyright />
        </div>
      </div>
    </>
  );
}
