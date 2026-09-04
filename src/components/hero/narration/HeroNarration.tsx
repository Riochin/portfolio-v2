"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, MessageCircleOff } from "lucide-react";
import { REVEAL_MS, revealTransition } from "@/lib/motion";
import { pick } from "@/lib/i18n/types";
import { CONTROL } from "./lines";
import { fadeMs, useNarration } from "./useNarration";

/**
 * 1 文字ずつの遅れ。挨拶文 (HeroSection の CHAR_STAGGER_MS) と同じ値。
 * 同じ手で結像するからこそ、全画面の語りが同じ人の声に聞こえる。
 */
const CHAR_STAGGER_MS = 40;

/**
 * 折り返しの最小単位に切る正規表現。HeroSection の WORD と同じもの。
 *
 * 1 文字ずつ inline-block に割ると、どの文字と文字のあいだにも折り返し
 * どころができて、英文が単語の途中で切れる。英字だけは単語のまとまりで
 * 取り (中で nowrap する)、それ以外は 1 文字ずつ ── 日本語はどこで折り
 * 返しても読める。
 */
const WORD = /[A-Za-z0-9'’]+|[\s\S]/gu;

/** 1 文字ずつ結像させる。読み上げには素の 1 文を渡し、こちらは隠す */
function Chars({ text }: { text: string }) {
  // 遅れは「文の頭から何文字目か」で決まる。語ごとの開始位置を先に
  // 数えてから組む ── 描く途中で外の数を書き換えない
  const words: { word: string; at: number }[] = [];
  let at = 0;
  for (const word of text.match(WORD) ?? []) {
    words.push({ word, at });
    at += [...word].length;
  }

  return (
    <span aria-hidden>
      {words.map(({ word, at: start }, w) =>
        // セリフの中の改行はそこで送る (lines.ts の Line を参照)
        word === "\n" ? (
          <br key={w} />
        ) : // 空白は素のテキストのまま置く。ここが唯一の折り返しどころに
        // なり、行末に来たぶんは消えてくれる。拾った文字をそのまま返すのは、
        // 俳句の句切れに使う全角スペースを半角に潰さないため
        /\s/.test(word) ? (
          word
        ) : (
          <span key={w} className="whitespace-nowrap">
            {[...word].map((char, c) => (
              <span
                key={c}
                className="hero-welcome-char"
                style={
                  {
                    "--char-delay": `${(start + c) * CHAR_STAGGER_MS}ms`,
                  } as CSSProperties
                }
              >
                {char}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  );
}

/**
 * 全画面のときだけ現れる語り。
 *
 * 出し方の要は「囲わないこと」── 枠も背景も名前も吹き出しの尻尾も付けない。
 * 囲った瞬間にチャット UI になり、狙っているもの (世界の中に人がいる) と
 * 逆になる。文字だけを空の上に置き、輪郭は薄い影だけで拾わせる。
 *
 * 出るときは挨拶文と同じく 1 文字ずつ結像させ (globals.css の
 * hero-welcome-char)、消えるときだけ 1 枚でフェードする。消えぎわまで
 * 1 文字ずつ送ると、読み終えた人を待たせるだけで意味が無い。
 *
 * 静かにするボタンは閉じるボタンの左隣。出したり引っ込めたりの間合いは
 * 親 (HeroFullscreen) が 1 つ持って両方へ配る。
 */
export function HeroNarration({
  mode,
  visible,
  onHoldChange,
}: {
  mode: "light" | "dark";
  /** 今ボタンを出しておくか。閉じるボタンと同じ間合いで親が決める */
  visible: boolean;
  /** ホバー / フォーカスで、消えないよう親に押さえてもらう */
  onHoldChange: (held: boolean) => void;
}) {
  const { utterance, muted, toggleMuted, locale } = useNarration(mode);
  // 語り自体は動きを減らす設定でも出す (動きではなく情報なので)。
  // 短くするのはフェードのほう。1 文字ずつの結像は globals.css の
  // hero-welcome-char がその設定を見て止める
  const calm = useReducedMotion() === true;
  const fade = utterance ? fadeMs(utterance.fast, calm) : REVEAL_MS;

  const hold = (held: boolean) => () => onHoldChange(held);
  const press = (event: ReactMouseEvent) => {
    // 全画面はどこを押しても閉じる。ここで止めないと、黙らせた瞬間に閉じる
    event.stopPropagation();
    toggleMuted();
  };

  return (
    <>
      {/* 場所は下寄り。中央に置くと空を隠す。モバイルはホームバーぶん上げる。
          読み上げにも載せる ── 「静かにする」はこちらにも効いて、黙らせた
          あとはこの箱ごと空になる。 */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-10 px-6"
      >
        {utterance && (
          // id を key にすることで、言い直しのたびに要素が置き直され、
          // 1 文字ずつの結像が毎回やり直される
          <p
            key={utterance.id}
            style={{ ...revealTransition, transitionDuration: `${fade}ms` }}
            className={`mx-auto max-w-2xl text-center text-sm leading-relaxed font-medium tracking-[0.05em] text-balance text-white transition-opacity [text-shadow:0_0_16px_rgb(0_0_0/0.45)] md:text-base ${
              utterance.leaving ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* 1 文字ずつ span に割ると読み上げが文字単位になりうるので、
                支援技術には素の 1 文として渡す */}
            <span className="sr-only">{utterance.text}</span>
            <Chars text={utterance.text} />
          </p>
        )}
      </div>

      {/* 閉じるボタンの左隣。入場の間合いも見た目もそちらに揃える ──
          右上に 2 つ並ぶものが別々の出方をすると、片方だけ後から現れる。
          止まるのは語りだけで、空の出来事はそのまま続く。黙らせたのは
          私であって世界ではない。

          アイコンは今の状態を映す ── 話している間は吹き出し、黙らせた
          あとは斜線付き。押すと何が起きるかは aria-label が言う。
          押すたびに絵が変わるので、状態と行き先の両方が読める。 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute top-6 right-20 z-20"
      >
        <motion.button
          type="button"
          onClick={press}
          aria-label={pick(locale, muted ? CONTROL.talk : CONTROL.quiet)}
          onPointerEnter={hold(true)}
          onPointerLeave={hold(false)}
          onFocus={hold(true)}
          onBlur={hold(false)}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: visible ? 0.2 : 0.6 }}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 ${
            visible ? "" : "pointer-events-none"
          }`}
        >
          {muted ? <MessageCircleOff size={22} /> : <MessageCircle size={22} />}
        </motion.button>
      </motion.div>
    </>
  );
}
