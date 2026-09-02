"use client";

import { useCallback, useRef, useState } from "react";
import { HeroSceneClient } from "./HeroSceneClient";

const WIDTH = 1280;
const HEIGHT = 720;

// HeroBackground が使う静止画の撮り直し用ビュー。
// ビューポートに依存しない固定 16:9 で描き、そのまま /public へ焼き出す。
export function HeroCapture({
  initialMode = "light",
  bare = false,
}: {
  initialMode?: "light" | "dark";
  bare?: boolean;
}) {
  const [mode, setMode] = useState<"light" | "dark">(initialMode);
  const [status, setStatus] = useState("");
  const captureRef = useRef<(() => string | null) | null>(null);
  const handleCapture = useCallback(
    (capture: () => string | null) => {
      captureRef.current = capture;
    },
    [],
  );

  // 縮小表示すると Canvas のバッファも縮むため、原寸のまま置いてはみ出させる
  const canvas = (
    <div style={{ width: WIDTH, height: HEIGHT }}>
      <HeroSceneClient
        key={mode}
        mode={mode}
        animated={false}
        interactive={false}
        preserveBuffer
        onCapture={handleCapture}
      />
    </div>
  );

  // ヘッドレスブラウザ用。ページ全体が Canvas 1 枚になる
  if (bare) {
    return <div className="fixed inset-0 overflow-hidden">{canvas}</div>;
  }

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
      body: JSON.stringify({ mode, dataUrl }),
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
          onClick={save}
          className="rounded bg-sky-500 px-3 py-1 text-sm"
        >
          /public/hero-{mode}.webp を更新
        </button>
        <span className="text-sm text-neutral-400">{status}</span>
      </div>
      {canvas}
    </div>
  );
}
