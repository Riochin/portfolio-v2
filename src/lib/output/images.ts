/**
 * 外部サムネイルのホスト許可リスト。
 *
 * next/image の最適化を通すには next.config.ts の remotePatterns にホストを
 * 登録しておく必要があり、未登録のホストを渡すと配信時に 400 になる。
 * OGP は他所が吐いた URL なので何のホストが来るか保証がない。
 * そこで許可リストをここに一本化し、next.config.ts からも読ませたうえで、
 * 外れたものは取り込み時に捨てて「画像なし」に落とす。
 */
export const OG_IMAGE_HOSTS = [
  // Speaker Deck のスライド 1 枚目プレビュー
  "files.speakerdeck.com",
  // Zenn の OGP (Cloudinary で生成)
  "res.cloudinary.com",
  // Qiita の OGP (imgix で生成)
  "qiita-user-contents.imgix.net",
] as const;

/** 許可ホストの https URL ならそのまま、そうでなければ undefined。 */
export function allowImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return undefined;
    return OG_IMAGE_HOSTS.some((host) => parsed.hostname === host)
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
