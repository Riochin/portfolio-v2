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
            className="absolute inset-y-0 -right-[7px] flex items-center"
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
      {/* 左レール。2 つのことをしている。

          1) 縦は「収まるときだけ中央」。中身は 25rem ほどあるので、横向きの
             端末 (812x375 など) では画面より高くなる。top-1/2 の中央寄せは
             溢れたぶんを上下へ等分に押し出すので、ワードマークとコピーライトが
             画面の外へ出たまま fixed で掴めなくなっていた。外側を全高の
             スクロール枠にし、中身は min-h-full + justify-center で中央に
             据える ── 収まるあいだは今までと同じ位置、溢れたら送れる。
             justify-center をスクロール枠自身に持たせないこと (溢れると上が
             切れて、そこだけスクロールでも出てこない)。
             天地に余白は入れない。中身は 408.69px で、収まる一番低い画面
             (896x414) との差が 5.31px しかない ── 少しでも足すとそこが
             溢れる側に倒れ、今まで中央にあったものが動く。

          2) 左右に --rail-pad ぶんの余白を持つ。1) の overflow-y は overflow-x も
             visible でなくすので、枠からはみ出して描かれるものが切られる。
             ここには 2 種類ある ── SideNav の ul の -ml-4 (ピルの padding ぶん
             左へ出して、文字の左端を見出しと揃えている) と、font-logo の
             筆記体が字送り幅の外へ流す筆先 (右へ 1.5px)。余白が無いと
             「About me」のピルは左の角丸と余白を失い、ワードマークは R の
             入りと v の払いが落ちる。余白は透明なので見た目には出ない。

          3) 横は本文との隙間を確保する。隙間 = 0.18 x 幅 - --rail-w で、
             本文の左端 (PageShell の md:pl-[28%]) とこのレールの右端
             (10% + レール幅) の差。md の下限 768px でちょうど 1px しかなく、
             ワードマーク (font-logo) の字形が少し変わるだけで食い込む。
             幅が足りないときだけ左へ逃がす。交点は 894px で、そこから上では
             10% - --rail-pad が選ばれる ── left から余白ぶんを引き戻して
             いるので、ワードマークの左端は今までどおり画面の 10% に来る。
             隙間は 2) の余白を含めない字送り幅どうしで測る。余白は透明で、
             そこへはみ出しているのは筆先の 1.5px だけなので、目に見える
             間合いは字送り幅で数えたほうが実態に合う。
             --rail-w はワードマーク (text-4xl) が決めている実測値。
             字の大きさを変えたら --rail-w を測り直す。 */}
      <div className="fixed inset-y-0 left-[min(calc(10%-var(--rail-pad)),calc(28%-var(--rail-w)-var(--rail-pad)-1.5rem))] z-30 hidden w-max overflow-y-auto overscroll-contain px-[var(--rail-pad)] [--rail-pad:1rem] [--rail-w:137px] md:block">
        <div className="flex min-h-full flex-col justify-center gap-16">
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
      </div>
    </>
  );
}
