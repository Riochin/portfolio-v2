/**
 * ジャケット画像のホスト許可リスト。
 *
 * 役割は lib/output/images.ts の OG_IMAGE_HOSTS と同じで、next.config.ts の
 * remotePatterns に載せるホストを一本化するためのもの。あちらは「他所が吐いた
 * OGP の URL」が対象で何が来るか保証がないのに対し、こちらは Spotify の CDN に
 * 固定なので、リストを共有せず別に持つ。
 * (両者を 1 つのモジュールに寄せる整理は、output 側を触るついでにやるのがよい)
 */
export const SPOTIFY_IMAGE_HOSTS = ["i.scdn.co"] as const;

/** 許可ホストの https URL ならそのまま、そうでなければ undefined。 */
export function allowArtworkUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return undefined;
    return SPOTIFY_IMAGE_HOSTS.some((host) => parsed.hostname === host)
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
