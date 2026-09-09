"use client";

import { useEffect, useState } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";

export type ShareLabels = {
  /** 共有シートを開く側の文言。サーバー描画もこれ。 */
  readonly share: string;
  /** 共有シートが無い環境での差し替え。 */
  readonly copyLink: string;
  /** コピー直後だけ出す。 */
  readonly copied: string;
};

/** コピーしたことを伝えて元に戻るまで。 */
const COPIED_MS = 2000;

/**
 * 記事末尾の汎用シェア。記事ページ由来では唯一の Client Component
 * (レイアウトのテーマ切り替えやメニューは別に読み込まれる)。
 *
 * mixi2 には X の intent にあたる共有 URL が無い (mixi.social の /share /post
 * /intent/* はどれも 404)。Web から mixi2 へ投げる道は OS の共有シートだけ
 * なので、mixi2 を名指しせず navigator.share() に委ねる。シートに何が並ぶかは
 * 端末が決めるので、こちらが嘘をつかずに済む。
 *
 * ただし共有シートはどこにでもあるわけではない。モバイルならほぼ確実に
 * 使えるが、デスクトップは navigator.share を持たないブラウザが多い。
 * 無い環境ではボタンごと消さず「リンクをコピー」に化ける ── 押せる面が
 * 消えるより、押した結果が変わるほうが読み手の当てが外れない。
 */
export function ShareButton({
  url,
  title,
  labels,
  className,
}: {
  url: string;
  title: string;
  labels: ShareLabels;
  className?: string;
}) {
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  // ハイドレーション前はサーバーと同じ木を描く。navigator を見られるのは
  // 2 回目の描画から (useHydrated.ts)。
  const canShare = hydrated && typeof navigator.share === "function";

  const Icon = copied ? Check : canShare ? Share2 : LinkIcon;
  const label = copied
    ? labels.copied
    : canShare || !hydrated
      ? labels.share
      : labels.copyLink;

  const onClick = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, url });
      } catch {
        // シートを閉じただけでも AbortError で落ちてくる。共有しなかった
        // だけなので何も言わない。
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // クリップボードを拒まれる文脈 (非セキュアなど)。黙って何もしない。
    }
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon size={16} className="shrink-0" />
      {/* 文言が押したあとに入れ替わるので、読み上げにも伝える。 */}
      <span aria-live="polite">{label}</span>
    </button>
  );
}
