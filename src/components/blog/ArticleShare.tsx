import { ShareButton } from "./ShareButton";
import { SITE } from "@/data/site";
import { DICT } from "@/lib/i18n/dictionary";
import { localePath } from "@/lib/i18n/paths";
import { getT } from "@/lib/i18n/server";

/* 枠は付けない。ページ上部の「Output に戻る」(page.tsx) から、字とアイコン
   だけの控えめな見た目を借りている (向こうは <a>、こちらは <button>)。

   DetailPager の枠付きの面は使わなかった。あれは読み終えたあとに次を選ばせる
   ための主導線で、シェアはその手前の「ついで」だから ── 同じ面で作ると
   「ほかの記事も見る」と主従が並んでしまう。 */
const SHARE_ACTION =
  "inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-accent";

/**
 * 記事末尾のシェア導線。本文と DetailPager のあいだに置く。
 *
 * 行き先を名指しするボタンは並べない。名指しできるのは X だけ ── mixi2 には
 * X の intent にあたる共有 URL が無く (mixi.social の /share /post /intent/* は
 * どれも 404)、Web から mixi2 へ投げる道は OS の共有シートだけだから。片方だけ
 * 名前で呼ぶと並びが「X とその他」に歪むので、1 つにまとめてシートに渡し、
 * 何に送るかは読み手に選んでもらう。
 *
 * 枠を付けないのも、これが読み終えたあとの「ついでに」だから。
 */
export async function ArticleShare({
  slug,
  title,
}: {
  slug: string;
  /** Article.title は Localized ではなく素の string (lib/articles/types.ts)。 */
  title: string;
}) {
  const { locale, t } = await getT();

  // 渡す先は読み手の環境ではなく公開 URL なので、localhost ではなく SITE.url。
  // 同じ組み立ては sitemap.ts (:23 ほか) にもあるが、共通のヘルパーは置かない。
  // 置き場所は localePath の隣 (lib/i18n/paths.ts) しかなく、あそこは
  // Client Component からも読むので isomorphic に保つ約束がある (paths.ts:3-9)。
  // SITE.url のためだけに @/data/site を持ち込むと、その約束が崩れる。
  const url = `${SITE.url}${localePath(locale, `/blog/${slug}`)}`;

  return (
    <div className="mt-12 text-sm">
      <ShareButton
        url={url}
        title={title}
        className={SHARE_ACTION}
        /* getT() は Client Component では使えないので、解決済みの文字列を渡す
           (DetailPager の back slot と同じ形)。 */
        labels={{
          share: t(DICT.blog.share),
          copyLink: t(DICT.blog.copyLink),
          copied: t(DICT.blog.copied),
        }}
      />
    </div>
  );
}
