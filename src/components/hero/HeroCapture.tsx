"use client";

import { useState } from "react";
import { HeroCanvasWrapper } from "./HeroCanvasWrapper";

const WIDTH = 1280;
const HEIGHT = 720;

// HeroBackground が使う静止画の撮り直し用ビュー。
// ビューポートに依存しない固定 16:9 で描き、そのまま /public へ焼き出す。
export function HeroCapture() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [status, setStatus] = useState("");

  const save = async () => {
    const dataUrl = window.__heroCapture?.();
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
      {/* 縮小表示すると Canvas のバッファも縮むため、原寸のまま置いてはみ出させる */}
      <div style={{ width: WIDTH, height: HEIGHT }}>
        <HeroCanvasWrapper
          key={mode}
          mode={mode}
          animated={false}
          exposeCapture
        />
      </div>
    </div>
  );
}
