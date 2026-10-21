import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decodeEntities, fetchHeadMeta } from "@/lib/meta-tags";

/**
 * 他所のページの head 読み。body をストリームで読み、`</head>` か上限で止める。
 * Response / ReadableStream / AbortSignal.timeout といった実行環境の API に
 * 直に乗っているので、Node や型定義の更新で崩れないかをここで見る。
 */

const encoder = new TextEncoder();

/** 渡した塊を 1 つずつ流し、どこまで読まれたかを数える Response。 */
function streamed(chunks: string[], init?: ResponseInit) {
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled < chunks.length) {
        controller.enqueue(encoder.encode(chunks[pulled]));
        pulled += 1;
      } else {
        controller.close();
      }
    },
    // 先読みさせない。読まれた分だけ pull が呼ばれるようにする。
  }, { highWaterMark: 0 });
  return { response: new Response(body, init), pulled: () => pulled };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchHeadMeta", () => {
  it("meta と title を拾う。property / name の大小は問わず、先に出た値を採る", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        `<html><head><title> ページ &#8212; タイトル </title>
<meta property="OG:Title" content="一つ目">
<meta property="og:title" content="二つ目">
<meta name='description' content='説明 &amp; 補足'>
<meta content="x" property="og:image">
</head><body></body></html>`,
      ),
    );

    const head = await fetchHeadMeta("https://example.com/");
    expect(head?.title).toBe("ページ — タイトル");
    expect(Object.fromEntries(head!.meta)).toEqual({
      "og:title": "一つ目",
      description: "説明 & 補足",
      "og:image": "x",
    });
  });

  it("</head> まで来たら残りを読まない", async () => {
    const { response, pulled } = streamed([
      "<head><title>t</title>",
      "</head><body>",
      "本文 1",
      "本文 2",
    ]);
    fetchMock.mockResolvedValue(response);

    await fetchHeadMeta("https://example.com/");
    expect(pulled()).toBe(2);
  });

  it("</head> が来なくても 256KB で打ち切る", async () => {
    const chunk = "x".repeat(64 * 1024);
    const { response, pulled } = streamed(
      ["<head><title>t</title>", ...Array<string>(10).fill(chunk)],
    );
    fetchMock.mockResolvedValue(response);

    const head = await fetchHeadMeta("https://example.com/");
    expect(head?.title).toBe("t");
    expect(pulled()).toBeLessThanOrEqual(6);
  });

  it("Content-Type の charset で解く", async () => {
    // "テスト" の Shift_JIS
    const sjis = new Uint8Array([0x83, 0x65, 0x83, 0x58, 0x83, 0x67]);
    const html = new Uint8Array([
      ...encoder.encode("<head><title>"),
      ...sjis,
      ...encoder.encode("</title></head>"),
    ]);
    fetchMock.mockResolvedValue(
      new Response(html, { headers: { "content-type": "text/html; charset=Shift_JIS" } }),
    );

    expect((await fetchHeadMeta("https://example.com/"))?.title).toBe("テスト");
  });

  it("UA とタイムアウトの signal を付け、キャッシュの方針を渡す", async () => {
    fetchMock.mockResolvedValue(new Response("<head></head>"));

    await fetchHeadMeta("https://example.com/", { revalidate: 60 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["user-agent"]).toContain("riochin.dev");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.next).toEqual({ revalidate: 60 });
  });

  it("失敗は undefined に潰す (例外もステータスも)", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
    expect(await fetchHeadMeta("https://example.com/")).toBeUndefined();

    fetchMock.mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"));
    expect(await fetchHeadMeta("https://example.com/")).toBeUndefined();
  });
});

describe("decodeEntities", () => {
  it.each([
    ["a &amp; b", "a & b"],
    ["&lt;tag&gt; &quot;q&quot; &#39;s&#39;", `<tag> "q" 's'`],
    ["&#8212; &#x2014; &#X2014;", "— — —"],
    ["&unknown; &#0; &#x110000;", "&unknown; &#0; &#x110000;"],
  ])("%s → %s", (input, expected) => {
    expect(decodeEntities(input)).toBe(expected);
  });
});
