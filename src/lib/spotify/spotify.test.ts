import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTopTracks } from "@/lib/spotify";

/**
 * About の「よく聴いている曲」。Spotify の API の応答を差し替え、
 * 期間ごとの割り振り・重複の除き方・並び・失敗時の潰し方を見る。
 * 抽選 (shuffle) が入るので、どの順に引いても結果の集合が変わらない形で組んである。
 */

type Track = {
  id?: string;
  name?: string;
  artists?: { name?: string }[];
  album?: { name?: string; images?: { url?: string }[] };
  external_urls?: { spotify?: string };
};

const track = (id: string, name: string, artist: string, artwork?: string): Track => ({
  id,
  name,
  artists: [{ name: artist }, { name: "Featuring" }],
  album: { name: `${name} (album)`, images: artwork ? [{ url: artwork }] : [] },
  external_urls: { spotify: `https://open.spotify.com/track/${id}` },
});

let ranges: Record<string, Track[]>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("SPOTIFY_CLIENT_ID", "id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret");
  vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "refresh");

  ranges = {
    // 最近はちょうど 3 曲
    short_term: [
      track("s1", "Crossing Field", "LiSA", "https://i.scdn.co/image/a"),
      track("s2", "unravel", "TK"),
      track("s3", "群青", "YOASOBI"),
    ],
    // 全期間は、最近と同じ曲 (id 違い・表記ゆれ) と、欠けた曲と、残り 3 曲
    long_term: [
      track("l1", " crossing field ", "lisa"),
      { id: "l2", name: "名前だけ" },
      track("l3", "Bad Apple!!", "Alstroemeria Records", "https://example.com/x.jpg"),
      track("l4", "残酷な天使のテーゼ", "高橋洋子"),
      track("l5", "Aimer の曲", "Aimer"),
    ],
  };

  fetchMock = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    if (url.href === "https://accounts.spotify.com/api/token") {
      return Response.json({ access_token: "token" });
    }
    const range = url.searchParams.get("time_range")!;
    return Response.json({ items: ranges[range] });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getTopTracks", () => {
  it("期間ごとに 3 曲ずつ、重複と欠けた曲を除き、アーティスト順に並べる", async () => {
    const tracks = await getTopTracks();
    expect(tracks.map((t) => t.id)).toEqual(["l5", "l3", "s1", "s2", "s3", "l4"]);
  });

  it("曲名とリードアーティストが同じなら、id が違っても 1 曲と数える", async () => {
    // 全期間に新しい曲が 2 曲しか無いので、重複を数えてしまうと必ず 6 曲になる
    ranges.long_term = [ranges.long_term[0], ranges.long_term[2], ranges.long_term[3]];
    const tracks = await getTopTracks();
    expect(tracks.map((t) => t.id).sort()).toEqual(["l3", "l4", "s1", "s2", "s3"]);
  });

  it("曲の形に直す。ジャケットは許可ホストだけ", async () => {
    const tracks = await getTopTracks();
    expect(tracks.find((t) => t.id === "s1")).toEqual({
      id: "s1",
      title: "Crossing Field",
      artists: "LiSA, Featuring",
      album: "Crossing Field (album)",
      url: "https://open.spotify.com/track/s1",
      artwork: "https://i.scdn.co/image/a",
    });
    expect(tracks.find((t) => t.id === "l3")?.artwork).toBeUndefined();
  });

  it("トークンは 1 回だけ取り、refresh_token で頼む", async () => {
    await getTopTracks();
    const tokenCalls = fetchMock.mock.calls.filter(
      ([input]) => String(input) === "https://accounts.spotify.com/api/token",
    );
    expect(tokenCalls).toHaveLength(1);

    const [, init] = tokenCalls[0];
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe(
      `Basic ${Buffer.from("id:secret").toString("base64")}`,
    );
    expect(String(init.body)).toBe("grant_type=refresh_token&refresh_token=refresh");
  });

  it("ある期間が足りなければ、もう片方で穴を埋める", async () => {
    ranges.short_term = [track("s1", "Only One", "A")];
    const tracks = await getTopTracks();
    // 最近 1 曲 + 全期間から 5 曲のうち、使える 4 曲 (重複なし・欠けを除く)
    expect(tracks.map((t) => t.id).sort()).toEqual(["l1", "l3", "l4", "l5", "s1"]);
  });

  it("認証情報が無ければ取りに行かずに空", async () => {
    vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "");
    expect(await getTopTracks()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("失敗しても例外にせず空にする", async () => {
    fetchMock.mockImplementationOnce(async () => new Response("bad", { status: 400 }));
    expect(await getTopTracks()).toEqual([]);
  });
});
