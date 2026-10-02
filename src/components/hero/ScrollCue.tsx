/**
 * ヒーローの下端に置くスクロールの合図。途中でくるっと一回転する手書きの
 * 矢印を、上から一度だけ描いて、描き終えたら矢じりを足す。そのまま止まる
 * ── 動き続ける合図はくどいので、一度「下だよ」と指したあとは静かな案内
 * として残す。色は線・矢じりとも同じグレー 1 色。
 *
 * 定規で引いた線ではなく手書きにするのは、海の世界観の中で UI 部品に
 * 見せないため (「近づいてみる」に枠を付けないのと同じ理由)。
 *
 * 画面に固定せずヒーローに吊るすので、スクロールすると絵の一部として海と
 * 一緒に流れていく。消しはしない ── 流れながら薄れると動きが二重になり、
 * 少し送っただけで目の前から手書きの線が消えてしまう。
 *
 * 横の位置は、下に続くプロフィールと作品の列の右端に揃える (PageShell と
 * 同じ px-6 / md:pr-[18%])。PC で右の SNS アイコンの列 (right-[10%]) の
 * 下に置くと、流れていく途中で固定のアイコンの上を通る。
 * 中央 (テーマ切替の下) に置かないのは、丸いボタンの付属物に見えて負けるため。
 *
 * 出すのは空が開ききってから (呼び出し側が shown で絞る)。出現と描画は
 * CSS (globals.css の scroll-cue)。short の画面では下に余地が無いので出さない。
 */
export function ScrollCue() {
  return (
    <div
      aria-hidden
      className="scroll-cue pointer-events-none absolute bottom-6 right-6 text-muted-foreground short:hidden md:bottom-8 md:right-[18%]"
    >
      {/* 描画は pathLength="1" で長さを 1 に正規化し、dashoffset を 1 -> 0 へ
          送る (globals.css の scroll-cue-draw)。実の長さを測らずに済み、
          パスの形を描き直しても CSS を触らなくてよい。
          矢じりの先 (20, 103) を viewBox の横の中央に置いてあるので、
          箱の中心で揃えれば先端が SNS アイコンの列の中心に来る。 */}
      <svg
        viewBox="0 0 40 108"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-16 w-auto md:h-[4.5rem]"
      >
        <path
          pathLength={1}
          className="scroll-cue-stroke"
          d="M18 4 C18 20, 20 30, 21 40 C22 52, 33 56, 31 46 C29 36, 12 40, 15 54 C17 66, 21 80, 20 102"
        />
        <path
          pathLength={1}
          className="scroll-cue-head"
          d="M12 91 Q16.5 96 20 103 Q23.5 96 28 91.5"
        />
      </svg>
    </div>
  );
}
