"use client";

import { useEffect, useState } from "react";

/**
 * ヒーローの下端に置くスクロールの合図。細いまっすぐな線を上から一度だけ
 * 引いて、引き終えたら矢じりを足す。そのまま止まる
 * ── 動き続ける合図はくどいので、一度「下だよ」と指したあとは静かな案内
 * として残す。色は線・矢じりとも同じ淡いグレー 1 色。
 *
 * 手書きにしないのは、手書きの線はロゴの筆記体だけに任せたいから。
 * それでも丸で囲んだシェブロンにはせず線一本で置くのは、海の世界観の中で
 * UI 部品に見せないため (「近づいてみる」に枠を付けないのと同じ理由)。
 *
 * 画面に固定せずヒーローに吊るすので、スクロールすると絵の一部として海と
 * 一緒に流れていく。最初にスクロールした時点で役目は済んでいるので、
 * 流れながら薄れて消え、戻ってきてももう出さない (dismissed はモジュールに
 * 置くので、詳細を開いて閉じても、別ページから戻ってきても出ない。
 * 出し直すのはリロードしたときだけ)。
 *
 * 横の位置は、下に続くプロフィールと作品の列の右端に揃える (PageShell と
 * 同じ px-6 / md:pr-[18%])。PC で右の SNS アイコンの列 (right-[10%]) の
 * 下に置くと、流れていく途中で固定のアイコンの上を通る。
 * 中央 (テーマ切替の下) に置かないのは、丸いボタンの付属物に見えて負けるため。
 *
 * 出すのは空が開ききってから (呼び出し側が shown で絞る)。出現と描画は
 * CSS (globals.css の scroll-cue)。short の画面では下に余地が無いので出さない。
 */
let dismissed = false;

export function ScrollCue() {
  const [gone, setGone] = useState(dismissed);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      if (window.scrollY <= 0) return;
      dismissed = true;
      setGone(true);
      window.removeEventListener("scroll", onScroll);
    };
    // 出る前にもう送られていた (リロードで途中から始まった等) ときも消す
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // 消える薄れは外側で受ける。内側の scroll-cue-in が走っている最中でも
    // opacity がぶつからない。
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-6 right-6 text-muted-foreground/60 transition-opacity duration-500 ease-out short:hidden data-[gone]:opacity-0 motion-reduce:transition-none md:bottom-8 md:right-[18%]"
      data-gone={gone || undefined}
    >
      <div className="scroll-cue">
        {/* 描画は pathLength="1" で長さを 1 に正規化し、dashoffset を 1 -> 0 へ
            送る (globals.css の scroll-cue-draw)。実の長さを測らずに済み、
            パスの形を描き直しても CSS を触らなくてよい。
            矢じりの先 (20, 59) を viewBox の横の中央に置いてあるので、
            箱の中心で揃えれば先端が SNS アイコンの列の中心に来る。 */}
        <svg
          viewBox="0 0 40 64"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-auto md:h-11"
        >
          <path pathLength={1} className="scroll-cue-stroke" d="M20 4 V58" />
          <path
            pathLength={1}
            className="scroll-cue-head"
            d="M14 52 L20 59 L26 52"
          />
        </svg>
      </div>
    </div>
  );
}
