"use client";

import { useCallback, useRef, useState } from "react";
import { HeroSceneClient } from "./HeroSceneClient";
import { HERO_FRAMING, type HeroFramingName } from "./sceneConfig";

// 焼き出す静止画の高さ。幅は画枠の比から出す (16:9 なら 1280、4:3 なら 960)。
// 高さを揃えてあるので、どちらの比でも縦方向の精細さは同じ。
const HEIGHT = 720;

const NAMES = Object.keys(HERO_FRAMING) as HeroFramingName[];

// Canvas は dpr ぶん大きいバッファで描かれる (dpr 2 の機械なら 4:3 が
// 1920x1440 になる)。/public に置くのは画枠ごとの寸法きっかりにしたいので、
// 焼いた 1 枚を一度オフスクリーンへ描き直して縮めてから送る。
// 撮る側で dpr を 1 に落とさないのは、そのぶん粗い絵を撮ることになるため。
async function shrink(dataUrl: string, width: number, height: number) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  if (image.width === width && image.height === height) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/webp", 0.9);
}

// HeroBackground が使う静止画の撮り直し用ビュー。
// ビューポートに依存しない固定サイズで描き、そのまま /public へ焼き出す。
// 画枠は HERO_FRAMING の並びぶんあり、ライブ側と同じ比・同じ yaw で描く
// (ここが食い違うと、静止画へ倒れた瞬間に絵が横へずれる)。
export function HeroCapture({
  initialMode = "light",
  initialFraming = "wide",
  bare = false,
}: {
  initialMode?: "light" | "dark";
  initialFraming?: HeroFramingName;
  bare?: boolean;
}) {
  const [mode, setMode] = useState<"light" | "dark">(initialMode);
  const [name, setName] = useState<HeroFramingName>(initialFraming);
  const [status, setStatus] = useState("");
  const captureRef = useRef<(() => string | null) | null>(null);
  const handleCapture = useCallback((capture: () => string | null) => {
    captureRef.current = capture;
  }, []);

  const framing = HERO_FRAMING[name];
  const width = Math.round((HEIGHT * framing.ratio[0]) / framing.ratio[1]);

  // 縮小表示すると Canvas のバッファも縮むため、原寸のまま置いてはみ出させる
  const canvas = (
    <div style={{ width, height: HEIGHT }}>
      <HeroSceneClient
        // 比が変われば Canvas ごと作り直す。同じ Canvas を伸ばすと
        // drawingBuffer が前の寸法のまま残ることがある
        key={`${mode}-${name}`}
        mode={mode}
        animated={false}
        interactive={false}
        yaw={framing.yaw}
        preserveBuffer
        onCapture={handleCapture}
      />
    </div>
  );

  // ヘッドレスブラウザ用。ページ全体が Canvas 1 枚になる
  if (bare) {
    return <div className="fixed inset-0 overflow-hidden">{canvas}</div>;
  }

  const file = `/hero-${mode}${framing.poster}.webp`;

  const save = async () => {
    const dataUrl = captureRef.current?.();
    if (!dataUrl) {
      setStatus("Canvas がまだ準備できていません");
      return;
    }
    setStatus("保存中…");
    const res = await fetch("/hero-capture/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode,
        framing: name,
        dataUrl: await shrink(dataUrl, width, HEIGHT),
      }),
    });
    const body = await res.json();
    setStatus(res.ok ? `${body.path} を更新しました` : `失敗: ${body.error}`);
  };

  return (
    <div className="min-h-dvh bg-neutral-900 p-4 text-white">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "light" ? "dark" : "light");
            setStatus("");
          }}
          className="rounded bg-white px-3 py-1 text-sm text-black"
        >
          mode: {mode}
        </button>
        <button
          type="button"
          onClick={() => {
            setName(NAMES[(NAMES.indexOf(name) + 1) % NAMES.length]);
            setStatus("");
          }}
          className="rounded bg-white px-3 py-1 text-sm text-black"
        >
          framing: {name} ({framing.ratio[0]}:{framing.ratio[1]} / {width}x
          {HEIGHT})
        </button>
        <button
          type="button"
          onClick={save}
          className="rounded bg-sky-500 px-3 py-1 text-sm"
        >
          /public{file} を更新
        </button>
        <span className="text-sm text-neutral-400">{status}</span>
      </div>
      {canvas}
    </div>
  );
}
