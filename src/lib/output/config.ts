import { SITE } from "@/data/site";

export const SPEAKERDECK_USER = SITE.accounts.speakerdeck;
export const ZENN_USER = SITE.accounts.zenn;
export const QIITA_USER = SITE.accounts.qiita;

export const REVALIDATE_SECONDS = 3600;

/**
 * /output の「書いた記事」セクションに振る id。
 *
 * 記事の詳細から「ほかの記事も見る」で戻るとき、ページの頂上 (= 登壇資料) では
 * なくここへ着地させたい。飛ぶ側 (blog/[slug]) と受ける側 (output) の両方が
 * 読むので、文字列は一箇所に置く。
 */
export const ARTICLES_ANCHOR = "articles";
