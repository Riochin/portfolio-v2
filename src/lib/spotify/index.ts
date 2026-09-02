import { PER_RANGE, POOL_SIZE, TIME_RANGES } from "./config";
import { allowArtworkUrl } from "./images";
import type { TopTrack } from "./types";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const TOP_TRACKS_ENDPOINT = "https://api.spotify.com/v1/me/top/tracks";

type SpotifyImage = { url?: string };

type SpotifyTrack = {
  id?: string;
  name?: string;
  external_urls?: { spotify?: string };
  album?: { name?: string; images?: SpotifyImage[] };
  artists?: { name?: string }[];
};

type Credentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

/**
 * 認可情報。3 つ揃っていなければ「Spotify 連携なし」として扱う。
 *
 * 欠けていることをエラーにしないのが重要。クローンしただけの手元や
 * シークレットを持たないプレビュー環境でもビルドを通したいので、
 * 取れなければ空配列に落として、セクションごと出さない方針にしている。
 */
function readCredentials(): Credentials | undefined {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return undefined;
  return { clientId, clientSecret, refreshToken };
}

/**
 * refresh token をアクセストークン (有効 1 時間) に交換する。
 *
 * fetch のキャッシュ指定を付けないのは意図的。Next 16 のキャッシュは opt-in で、
 * 既定では「静的プリレンダリング時に 1 回だけ実行」される。つまりページ側の
 * `export const revalidate` が再生成の間隔をそのまま取得の間隔にしてくれる。
 * ここで force-cache を付けると、キャッシュキーに Authorization ヘッダが
 * 含まれる (URL / method / headers / body で一致判定する) ぶん当たらない
 * エントリが増えるうえ、1 時間で切れるトークンを掴み続ける危険もある。
 */
async function fetchAccessToken(credentials: Credentials): Promise<string> {
  const basic = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!res.ok) {
    // 本文にエラー理由 (invalid_grant など) が入るので拾う。
    // refresh token が失効したときここに出る。
    throw new Error(
      `Spotify token refresh failed: ${res.status} ${await res.text()}`,
    );
  }

  const json: { access_token?: string } = await res.json();
  if (!json.access_token) {
    throw new Error("Spotify token refresh returned no access_token");
  }
  return json.access_token;
}

function toTopTrack(track: SpotifyTrack): TopTrack | undefined {
  const url = track.external_urls?.spotify;
  if (!track.id || !track.name || !url) return undefined;

  const artists = (track.artists ?? [])
    .map((artist) => artist.name)
    .filter((name): name is string => Boolean(name));

  return {
    id: track.id,
    title: track.name,
    artists: artists.join(", "),
    album: track.album?.name ?? "",
    url,
    // images は大きい順に返る。next/image が縮めるので先頭 (640px) を使う。
    artwork: allowArtworkUrl(track.album?.images?.[0]?.url),
  };
}

async function fetchRange(
  accessToken: string,
  timeRange: string,
): Promise<TopTrack[]> {
  const url = new URL(TOP_TRACKS_ENDPOINT);
  url.searchParams.set("time_range", timeRange);
  url.searchParams.set("limit", String(POOL_SIZE));

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify top tracks (${timeRange}) failed: ${res.status}`);
  }

  const json: { items?: SpotifyTrack[] } = await res.json();
  return (json.items ?? [])
    .map(toTopTrack)
    .filter((track): track is TopTrack => track !== undefined);
}

/** Fisher-Yates。元の配列は壊さない。 */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 重複判定のキー。
 *
 * track.id では足りない ── 同じ曲でもシングル版と feat. 表記付きの版で
 * 別 ID になることがあり ("Surges" が Orangestar 単独名義と
 * "Orangestar, 夏背., ルワン" 名義の 2 件で返ってきた)、id だけ見ていると
 * 同じ曲が 2 枚並ぶ。曲名と筆頭アーティストで見れば同一視できる。
 * 筆頭だけにしているのは、まさにその feat. の差を無視したいため。
 * 別アーティストのカバーは筆頭が違うので、これで潰れることはない。
 */
function dedupeKey(track: TopTrack): string {
  const leadArtist = track.artists.split(",")[0] ?? "";
  return `${track.title.trim().toLowerCase()}|${leadArtist.trim().toLowerCase()}`;
}

/**
 * 各期間の候補から PER_RANGE 曲ずつ無作為に選び、重複を除いて並べる。
 *
 * 同じ曲が複数の期間の上位に入ることがあるので、取ったものを覚えて飛ばす。
 * それでも枠が埋まらなければ残りの候補から補う。
 *
 * 抽選はレンダリング時に 1 回だけ走る。About ページは revalidate を持たず
 * build 時にプリレンダリングされるので、顔ぶれが変わるのはデプロイのときだけ。
 * 訪問者ごとにもリロードごとにも変わらない。
 */
function pickTracks(lists: readonly TopTrack[][]): TopTrack[] {
  const picked: TopTrack[] = [];
  const seen = new Set<string>();

  const take = (track: TopTrack) => {
    const key = dedupeKey(track);
    if (seen.has(key)) return false;
    seen.add(key);
    picked.push(track);
    return true;
  };

  const pools = lists.map(shuffled);

  for (const pool of pools) {
    let taken = 0;
    for (const track of pool) {
      if (taken >= PER_RANGE) break;
      if (take(track)) taken++;
    }
  }

  // どこかの期間が PER_RANGE に足りなかったぶんの穴埋め。
  const wanted = PER_RANGE * lists.length;
  for (const pool of pools) {
    for (const track of pool) {
      if (picked.length >= wanted) return picked;
      take(track);
    }
  }
  return picked;
}

/**
 * 表示順。抽選が済んだあとにアーティスト名で並べ替える。
 *
 * どの期間から来たかは並びに出さない ── 見出しで区別していない以上、
 * 段が期間を表していても読み手には伝わらないので、名前順の方が一覧として
 * 読みやすい。比較は dedupeKey と同じく筆頭アーティストで行い、同じ
 * アーティストのときは曲名で決める (抽選が同じなら並びも毎回同じになる)。
 */
function byArtistName(a: TopTrack, b: TopTrack): number {
  const lead = (track: TopTrack) => track.artists.split(",")[0]?.trim() ?? "";
  return (
    lead(a).localeCompare(lead(b), "ja") ||
    a.title.localeCompare(b.title, "ja")
  );
}

/**
 * よく聴いている曲。最近と全期間を混ぜて返す (割り振りは config.ts)。
 *
 * 呼び出し側のページに `export const revalidate` を足さないこと。
 * 足すとその間隔で取り直され、曲が勝手に入れ替わる (about/page.tsx 参照)。
 *
 * 失敗しても About ページ全体を落としたくないので、例外は握って空配列にする
 * (lib/output の Promise.allSettled と同じ方針)。空配列のときセクションは出ない。
 */
export async function getTopTracks(): Promise<TopTrack[]> {
  const credentials = readCredentials();
  if (!credentials) return [];

  try {
    // トークンは 1 回だけ取り、両方の期間で使い回す。
    const accessToken = await fetchAccessToken(credentials);
    const lists = await Promise.all(
      TIME_RANGES.map((range) => fetchRange(accessToken, range)),
    );
    return pickTracks(lists).sort(byArtistName);
  } catch (error) {
    console.error("[spotify] top tracks fetch failed:", error);
    return [];
  }
}
