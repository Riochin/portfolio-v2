"use client";

import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { useHydrated } from "@/lib/useHydrated";

type Row = [label: string, value: string];

function safe(fn: () => unknown): string {
  try {
    return String(fn());
  } catch (e) {
    return `throw: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function readEnv(): Row[] {
  const w = window as Window & {
    webkit?: { messageHandlers?: unknown };
  };
  return [
    ["'startViewTransition' in document", safe(() => "startViewTransition" in document)],
    [
      "prefers-reduced-motion: reduce",
      safe(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    ],
    ["navigator.userAgent", navigator.userAgent],
    [
      "CSS.supports('view-transition-name', 'x')",
      safe(() => CSS.supports("view-transition-name", "x")),
    ],
    // React の <ViewTransition> が頼る機能。どれかが欠けると黙ってアニメなしに倒れる
    [
      "CSS.supports('view-transition-class', 'x')",
      safe(() => CSS.supports("view-transition-class", "x")),
    ],
    [
      "CSS.supports('selector(::view-transition)')",
      safe(() => CSS.supports("selector(::view-transition)")),
    ],
    ["'ViewTransition' in window", safe(() => "ViewTransition" in window)],
    [
      "'ViewTransitionTypeSet' in window",
      safe(() => "ViewTransitionTypeSet" in window),
    ],
    ["'navigation' in window", safe(() => "navigation" in window)],
    ["document.visibilityState", document.visibilityState],
    // WKWebView のアプリ内ブラウザでだけ生える (Safari 本体には無い)
    ["window.webkit.messageHandlers", safe(() => w.webkit?.messageHandlers !== undefined)],
  ];
}

// push-during: Next の遷移と同じく、update の中で URL を書き換える
// push-after:  アニメが終わってから URL を書き換える
type Form = "callback" | "object+types" | "push-during" | "push-after";

function now() {
  return Math.round(performance.now());
}

function viewport() {
  const vv = window.visualViewport;
  return `inner ${window.innerHeight} / vv ${vv ? Math.round(vv.height) : "-"}`;
}

let pushCount = 0;

function pushUrl() {
  pushCount += 1;
  const url = new URL(window.location.href);
  url.searchParams.set("vt", String(pushCount));
  window.history.pushState(window.history.state, "", url);
}

export function VtDiagnostics() {
  const mounted = useHydrated();
  const [moved, setMoved] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const push = useCallback((line: string) => {
    setLog((prev) => [...prev, line]);
  }, []);

  const run = useCallback(
    (form: Form) => {
      const t0 = now();
      const at = () => `+${now() - t0}ms`;
      push(`--- ${form} ---`);
      push(`開始時 ${viewport()}`);

      if (typeof document.startViewTransition !== "function") {
        push("startViewTransition がない → 即時切替");
        setMoved((m) => !m);
        return;
      }

      // 遷移の前後 2 秒に起きた表示領域の変化を拾う。X の下のシートが
      // 伸び縮みすると、ここに resize が並ぶ
      const onResize = () => push(`  resize ${at()} ${viewport()}`);
      window.addEventListener("resize", onResize);
      window.visualViewport?.addEventListener("resize", onResize);
      const stopWatching = () => {
        window.removeEventListener("resize", onResize);
        window.visualViewport?.removeEventListener("resize", onResize);
      };

      const update = () => {
        flushSync(() => setMoved((m) => !m));
        if (form === "push-during") {
          pushUrl();
          push(`pushState (update 内) ${at()}`);
        }
      };

      let transition: ViewTransition;
      try {
        transition =
          form === "object+types"
            ? document.startViewTransition({ update, types: ["debug"] })
            : document.startViewTransition(update);
      } catch (e) {
        push(`呼び出しで throw: ${describe(e)}`);
        setMoved((m) => !m);
        stopWatching();
        return;
      }
      push(`呼び出し OK ${at()}`);

      let readyAt: number | null = null;
      transition.ready.then(
        () => {
          readyAt = now();
        },
        () => {},
      );
      transition.finished.finally(() => {
        // ready から 800ms (四角のアニメの長さ) 経たずに終わったら打ち切り
        if (readyAt !== null) {
          const ran = now() - readyAt;
          push(
            ran < 700
              ? `→ アニメは ${ran}ms で打ち切られた`
              : `→ アニメは最後まで走った (${ran}ms)`,
          );
        }
        push(`終了時 ${viewport()}`);
        if (form === "push-after") {
          pushUrl();
          push(`pushState (finished 後) ${at()}`);
        }
        setTimeout(stopWatching, 2000);
      });

      transition.updateCallbackDone.then(
        () => push(`updateCallbackDone: resolved ${at()}`),
        (e) => push(`updateCallbackDone: rejected ${describe(e)} ${at()}`),
      );
      transition.ready.then(
        () => {
          // 実際に疑似要素のアニメーションが走っているか。0 件や duration 0 なら
          // API は通っても見た目は即時切替になる
          const anims = document
            .getAnimations()
            .filter((a) =>
              (a.effect as KeyframeEffect | null)?.pseudoElement?.includes(
                "view-transition",
              ),
            );
          push(`ready: resolved ${at()} / 疑似要素アニメ ${anims.length} 件`);
          for (const a of anims.slice(0, 6)) {
            const effect = a.effect as KeyframeEffect;
            const timing = effect.getComputedTiming();
            push(
              `  ${effect.pseudoElement} ${a.playState} ${String(timing.duration)}ms`,
            );
          }
        },
        (e) => push(`ready: rejected ${describe(e)} ${at()}`),
      );
      transition.finished.then(
        () => push(`finished: resolved ${at()}`),
        (e) => push(`finished: rejected ${describe(e)} ${at()}`),
      );
    },
    [push],
  );

  const env = mounted ? readEnv() : [];

  const copy = async () => {
    const text = [...env.map(([k, v]) => `${k}: ${v}`), "", ...log].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      push("コピー失敗 (clipboard 不可)");
    }
  };

  const button =
    "rounded-[3px] border border-border px-3 py-2 text-sm hover:border-foreground";

  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-foreground">
      <style>{`
        .vt-debug-box { view-transition-name: vt-debug-box; }
        ::view-transition-group(vt-debug-box) { animation-duration: 800ms; }
      `}</style>

      <h1 className="mb-6 text-xl font-bold">View Transitions 診断</h1>

      <table className="mb-8 w-full text-left text-xs">
        <tbody>
          {env.map(([k, v]) => (
            <tr key={k} className="border-b border-border align-top">
              <th className="py-2 pr-3 font-normal text-muted-foreground">{k}</th>
              <td className="py-2 font-mono break-all">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => run("callback")}>
          startViewTransition(fn)
        </button>
        <button
          type="button"
          className={button}
          onClick={() => run("object+types")}
        >
          {"startViewTransition({ update, types })"}
        </button>
      </div>

      <p className="mb-2 text-xs text-muted-foreground">
        URL の書き換え (pushState) をどこでするか。X では下のシートが短いときに押す (戻ると短くなる)
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => run("push-during")}>
          pushState: 遷移の中で
        </button>
        <button type="button" className={button} onClick={() => run("push-after")}>
          pushState: アニメの後で
        </button>
      </div>

      <div className="relative mb-6 h-16 rounded-[3px] border border-border">
        <div
          className={`vt-debug-box absolute top-2 h-12 w-12 rounded-[3px] bg-accent ${
            moved ? "right-2" : "left-2"
          }`}
        />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-bold">結果</h2>
        <button type="button" className={button} onClick={copy}>
          {copied ? "コピーした" : "全部コピー"}
        </button>
        <button type="button" className={button} onClick={() => setLog([])}>
          消す
        </button>
      </div>
      <pre className="min-h-24 rounded-[3px] border border-border p-3 font-mono text-xs whitespace-pre-wrap break-all">
        {log.join("\n")}
      </pre>
    </main>
  );
}

function describe(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return String(e);
}
