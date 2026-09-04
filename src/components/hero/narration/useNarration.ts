"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { REVEAL_MS } from "@/lib/motion";
import { localeFromPathname } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/types";
import { onHeroEvent, type HeroEvent } from "../heroEvents";
import { enter, markSeen, readQuiet, rememberQuiet } from "./memory";
import {
  CLOCK_TALK,
  CONTROL,
  GREETING,
  MILESTONES,
  NAV_LIGHTS_RECALL,
  QUIET_TALK,
  REACTIONS,
  SCRIPT,
  SCRIPT_LINES,
  type ScriptKey,
  STATE,
  WISHES,
  WISH_FOLLOWUP,
  WISH_MISSES,
  WISH_OPENERS,
  type Line,
} from "./lines";

/**
 * 何か言ったら、次に口を開くまで最低これだけ黙る (ms)。
 * 言えることが増えたことと、言うことは別 ── 種類が増えるほど連発しやすく
 * なるので、ここは絶対に守る。
 */
const COOLDOWN_MS = 10_000;

/**
 * 消えるまでの時間。だいたい 2 秒 + 1 文字ぶん。
 *
 * 1 文字あたりを言語で変える ── 日本語の 1 字と英語の 1 字では運ぶ情報量が
 * 違い、同じ内容でも英語は字数が倍以上になる。同じ係数を掛けると、英語だけ
 * 16 秒も空に貼り付いたままになって、読み終えた人を待たせるだけになる。
 */
const READ_BASE_MS = 2000;
const READ_PER_CHAR_MS: Record<Locale, number> = { ja: 150, en: 80 };

/** 鳥・船・飛行機に反応する素の率。パターンが増えても上げない */
const REACTION_RATE = 0.35;

/**
 * 反応する気の減衰。素の率にこれを掛ける。
 *
 * 半減期は台本の長さと同じ 4 分 ── 台本が終わる 4:00 でちょうど半分になり、
 * 以降も 4 分ごとに半分ずつ。最初の数分はよく喋り、あとは流れ星が降っても
 * 黙って見ている。「4:00 以降は時間とともに静かになる」を、間隔ではなく
 * 気の向き方のほうで実装したもの。
 *
 * これが無いと夜が成立しない。流れ星は 2 本が別々に間隔を数える
 * (`SHOOTING_STAR.count = 2` × `interval [14, 34]`) ので平均 12 秒に 1 本
 * 降り、しかも流れ星には毎回反応すると決めてある。実際に回すと 22 秒に
 * 1 回喋り続け、沈黙が 90 秒に届かないので静かな時間の独り言が一度も
 * 出ない。減衰を入れると 0〜5 分は 27 秒に 1 回、15 分以降は 105 秒に
 * 1 回まで落ちて、独り言も出るようになる。
 *
 * 下げ止まりを 0 にしないのは、完全に黙ると「壊れた」ように見えるため。
 */
const REACTION_HALF_MS = 240_000;
const REACTION_FLOOR = 0.1;

/** 願い事にならずに終わる率 (WISH_MISSES)。10 回に 1 回程度 */
const WISH_MISS_RATE = 0.1;

/** 願い事の直後に続ける一言を出しておく時間と、それを付ける率。
    流れ星には毎回反応するので、毎回付けると同じ一言が繰り返し出る。
    ひとりごとがふとこちらを向く瞬間は、たまにだから効く */
const FOLLOWUP_MS = 3000;
const FOLLOWUP_RATE = 0.5;

/**
 * 冒頭の反応がクールダウンを飛び越えてよい期限。
 *
 * 0:03 の挨拶を読み終えて黙り始めるのが 0:08 あたりなので、0:15 の鳥 /
 * 流れ星は本来ならクールダウンに弾かれる。名乗った直後に世界を指させる
 * ことが「解説者ではなく隣にいる人」の正体なので、ここだけ通す。
 *
 * 18 秒に置いてあるのは、0〜18 秒に湧きうる出来事が鳥 (15 秒固定) と
 * 流れ星 (14〜15 秒) しか無いため ── 船 [20, 60]・飛行機雲 [25, 70]・
 * 夜行便 [30, 80]・漁火 [25, 70] はどれもここまで届かない。1 回きりの
 * 通行証を、冒頭の 1 本以外に横取りされることがない。
 */
const OPENING_MS = 18_000;

/** 夜行便を呼び戻すまで。NAV_LIGHTS.duration が [150, 230] 秒なのでまだ飛んでいる */
const RECALL_MS = 60_000;

/**
 * 静かな時間の独り言を挟むまでに要る沈黙と、1 つ出すごとに延びるぶん、その上限。
 * 時間とともに口数が減っていく ── 永遠に同じ調子で喋るものは嫌われる。
 */
const QUIET_FIRST_MS = 90_000;
const QUIET_STEP_MS = 30_000;
const QUIET_MAX_MS = 300_000;

/** 節目 (MILESTONES) にぶつかって言えなかったとき、粘る猶予 */
const MILESTONE_WINDOW_MS = 30_000;

/** 時間で進むほうを見に行く間隔。0:03 と 0:15 の噛み合わせを崩さない細かさ */
const TICK_MS = 250;

/**
 * 短いほうのフェード。ボタンへの返事と、動きを減らす設定のとき。
 *
 * 「わかりました！！」だけ短いのは、元気に返事してからピタッと止まる落差を
 * 出すため。ゆっくり消えると、止まったのではなく力尽きたように見える。
 */
const FAST_MS = 150;

/**
 * この一言が出入りするのにかける時間。
 *
 * 既定は REVEAL_MS ── 「近づいてみる」やナビのホバーとまったく同じ尺と
 * 曲線で出入りすることが、「同じ手で作られている」の正体なので、数値は
 * lib/motion から借りるだけにして、ここに書き写さない。
 *
 * 描くのは HeroNarration、消すのはこのファイルのタイマーなので、両方が
 * 同じ答えを見るようにここで 1 つだけ持つ。
 */
export function fadeMs(fast: boolean, calm: boolean) {
  return fast || calm ? FAST_MS : REVEAL_MS;
}

export type Utterance = {
  /** 言い直しを見分けるだけの通し番号。描く側はこれを key にする */
  id: number;
  text: string;
  /** フェードを短くするか (ボタンへの返事だけ) */
  fast: boolean;
  /** もう消えかけているか。文字は残したまま薄くなる */
  leaving: boolean;
};

type SayOptions = {
  /** 「静かに」もクールダウンも飛び越える。ボタンへの返事だけ */
  force?: boolean;
  /** クールダウンだけ飛び越える。冒頭の反応と、願い事に続く一言だけ */
  now?: boolean;
  fast?: boolean;
  /** 表示時間を決め打つ */
  ms?: number;
  /** 消えたあと、間を置かずに続ける一言 */
  then?: string;
  /** 最後まで出しきれたら呼ぶ */
  done?: () => void;
};

/** 引いたら戻さない袋。全部使い切ったら詰め直す */
function bag(size: number) {
  let rest: number[] = [];
  return () => {
    if (rest.length === 0) rest = Array.from({ length: size }, (_, i) => i);
    const at = Math.floor(Math.random() * rest.length);
    return rest.splice(at, 1)[0];
  };
}

/** 見ている人の現地時刻に当てる言葉。昼間 (11〜17 時) には持っていない */
function clockLine(hour: number): Line | null {
  if (hour >= 2 && hour < 5) return CLOCK_TALK.lateNight;
  if (hour >= 5 && hour < 11) return CLOCK_TALK.morning;
  if (hour >= 18 || hour < 2) return CLOCK_TALK.night;
  return null;
}

/**
 * 全画面で Riochin が語りかける仕組み。
 *
 * 台本 (時間で進む) と反応 (出来事に応じる) の 2 系統が、1 つの口を
 * 取り合う。ぶつかったら反応が勝つ ── 反応は 1 秒遅れると何の話か
 * 分からなくなるが、台本は次のスロットへ送れる。
 *
 * 中身はすべて useEffect の中のローカル変数で持ち、React の状態は
 * 「今どの一言が出ているか」だけにしてある。隣で Canvas が 60fps で
 * 回っているので、数え事のたびに再レンダリングを起こさない。
 */
export function useNarration(mode: "light" | "dark") {
  const locale = localeFromPathname(usePathname());
  const [utterance, setUtterance] = useState<Utterance | null>(null);
  const [muted, setMuted] = useState(readQuiet);

  // 「静かに」は語りの途中でも切り替わる。effect の deps に入れると
  // そのたびに台本が最初からになるので、ref で覗きに行く
  const mutedRef = useRef(muted);
  // ボタンの返事だけは effect の外から言わせる
  const sayRef = useRef<((text: string, opts?: SayOptions) => boolean) | null>(
    null,
  );
  // StrictMode の二重マウントで 2 回目扱いにしない
  const visitRef = useRef<{ seen: boolean; entries: number } | null>(null);

  useEffect(() => {
    visitRef.current ??= enter();
    const visit = visitRef.current;
    const t = (line: Line) => pick(locale, line);

    const startedAt = Date.now();
    // タブを離れていた合計。見ていない間は台本を進めず、出来事にも
    // 反応しない (戻ったときには何も残っていないので)。10 分滞在も
    // これで正直な数字になる。
    //
    // 離れたことは visibilitychange の遷移からだけ受け取り、
    // visibilityState の初期値は読まない。全画面はクリックで開く以上
    // マウントの瞬間は必ず見えているし、描画も入力も生きているのに
    // hidden と答える埋め込みブラウザがある ── そこで初期値を信じると、
    // 語りが一度も口を開かないまま終わる。
    let away = 0;
    let hiddenAt = 0;

    let seq = 0;
    let current: Utterance | null = null;
    let lastText = "";
    /** 最後に黙った時刻。マウントの時点では、もうずっと黙っている */
    let silentSince = startedAt - COOLDOWN_MS;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    // 動きを減らす設定。全画面はそもそも開かない設定だが、語りは動きでは
    // なく情報なので出す ── そのときフェードだけ短くする
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** 今の一言を薄くする。文字は残したまま、消えるのを待つ状態にする */
    const dim = () => {
      const going = { ...current!, leaving: true };
      current = going;
      setUtterance(going);
      return fadeMs(going.fast, calm);
    };

    const show = (text: string, opts: SayOptions) => {
      lastText = text;
      current = { id: ++seq, text, fast: opts.fast ?? false, leaving: false };
      setUtterance(current);

      const ms =
        opts.ms ??
        READ_BASE_MS + [...text].length * READ_PER_CHAR_MS[locale];
      hideTimer = setTimeout(() => {
        hideTimer = setTimeout(() => {
          hideTimer = null;
          current = null;
          // 黙り始めるのは、文字が消えきったこの瞬間から数える
          silentSince = Date.now();
          setUtterance(null);
          opts.done?.();
          if (opts.then) say(opts.then, { now: true, ms: FOLLOWUP_MS });
        }, dim());
      }, ms);
    };

    const say = (text: string, opts: SayOptions = {}): boolean => {
      if (mutedRef.current && !opts.force) return false;
      // 同じセリフを 2 回続けない。同じ出来事が続いた回もこれで黙る
      if (text === lastText && !opts.force) return false;
      const now = Date.now();
      if (!opts.force && !opts.now) {
        if (current !== null) return false;
        if (now - silentSince < COOLDOWN_MS) return false;
      }

      if (hideTimer) clearTimeout(hideTimer);
      // まだ出ている一言があるなら、薄くしてから差し替える。文字だけが
      // 入れ替わる瞬間を作らない (そこだけ紙芝居に見える)
      if (current !== null) {
        lastText = text;
        hideTimer = setTimeout(() => show(text, opts), dim());
        return true;
      }
      show(text, opts);
      return true;
    };
    sayRef.current = say;

    const later = (ms: number, run: () => void) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        run();
      }, ms);
      timers.add(timer);
    };

    // ── 台本 ──────────────────────────────────────────────
    // ぶつかって言えなかったぶんは、ここに残って次のスロットで片付く
    const pending: { key: ScriptKey; text: string }[] = [];
    let nextSlot = 0;

    const scriptText = (key: ScriptKey) => {
      if (key !== "greeting") return t(SCRIPT_LINES[key]);
      if (visit.entries > 1) return t(GREETING.again);
      return t(visit.seen ? GREETING.returning : GREETING.first);
    };

    // ── 反応 ──────────────────────────────────────────────
    const reactions = REACTIONS[mode];
    // 袋に入れるのは願い事のほうだけ。先頭の「おっ流れ星！！！」は 1 本目の
    // 決め打ち専用なので抽選には回さない (lines.ts の WISH_OPENERS)
    const drawWish = bag(WISHES.length - WISH_OPENERS);
    const drawMiss = bag(WISH_MISSES.length);
    /** この全画面で、まだ 1 本目の流れ星を言えていない */
    let firstStar = true;
    let openingUsed = false;
    let nextMilestone = 0;

    /** 見ていた時間 (タブを離れていたぶんは数えない) */
    const elapsedNow = () => Date.now() - startedAt - away;

    /** 今どれくらい反応する気があるか。0〜1 */
    const attention = () =>
      Math.max(REACTION_FLOOR, 0.5 ** (elapsedNow() / REACTION_HALF_MS));

    /** その出来事に反応してよいか。冒頭の 1 回だけクールダウンを飛び越える */
    const opening = () => {
      if (openingUsed) return false;
      if (elapsedNow() >= OPENING_MS) return false;
      return true;
    };

    const react = (text: string) => {
      const now = opening();
      const said = say(text, { now });
      if (said && now) openingUsed = true;
      return said;
    };

    const shootingStar = () => {
      const now = opening();

      // 1 本目は決め打つ。まず驚いて、願い事はその次から ── この順が崩れると
      // いきなり願い事から始まる回ができて、何に驚いているのか分からない。
      // 倒すのは言えたときだけ。黙らせてある間に降った 1 本や、クールダウンに
      // 弾かれた 1 本では消費しないので、誰でも必ず一度はここを通る
      if (firstStar) {
        const said = say(t(WISHES[0]), { now });
        if (said) {
          firstStar = false;
          if (now) openingUsed = true;
        }
        return said;
      }

      // 願い事を言えずに終わる回。続きの一言は付けない
      if (Math.random() < WISH_MISS_RATE)
        return react(t(WISH_MISSES[drawMiss()]));
      // 袋は願い事だけなので、引いた番号を出だしのぶんだけ後ろへずらす
      const at = drawWish() + WISH_OPENERS;
      const then = Math.random() < FOLLOWUP_RATE ? t(WISH_FOLLOWUP) : undefined;
      const said = say(t(WISHES[at]), { now, then });
      if (said && now) openingUsed = true;
      return said;
    };

    const handle = (event: HeroEvent) => {
      if (mutedRef.current) return;
      // 見ていない間に起きたことに反応しても、戻ったときには何も残っていない
      if (hiddenAt) return;

      // 冒頭の 1 回 (0:15) は率を掛けずに必ず言う。名乗った直後に世界を
      // 指させることが「解説者ではなく隣にいる人」の正体なので、ここを
      // 3〜4 割の抽選に任せると、昼の来訪者の 3 人に 2 人が取りこぼす
      const first = opening();
      const rolled = (rate: number) =>
        first || Math.random() < rate * attention();

      switch (event.type) {
        case "bird":
          if (!("bird" in reactions)) return;
          // 群れの数 (event.flock) では言い分けない。数を数えて驚いてみせる
          // より、同じ出来事に同じ調子で反応するほうがこの人らしい
          if (!rolled(REACTION_RATE)) return;
          return void react(t(reactions.bird));
        case "ship":
          if (!("ship" in reactions)) return;
          if (!rolled(REACTION_RATE)) return;
          return void react(t(reactions.ship));
        case "contrail":
          if (!("contrail" in reactions)) return;
          if (!rolled(REACTION_RATE)) return;
          return void react(t(reactions.contrail));
        case "navLights": {
          if (!("navLights" in reactions)) return;
          if (!rolled(REACTION_RATE)) return;
          if (!react(t(reactions.navLights))) return;
          // 1 分後にはまだ渡り切っていない。呼び戻すセリフが必ず本当になる
          return later(RECALL_MS, () => say(t(NAV_LIGHTS_RECALL)));
        }
        case "shootingStar":
          if (mode !== "dark") return;
          // 素の率は毎回 (1.0)。減らすのは時間のほうだけ
          if (!rolled(1)) return;
          // 2 本同時に降った回も、言うのは 1 本ぶん ── 2 本目はクールダウンに
          // 弾かれる。数を実況するより、願い事を 1 つ言うほうがこの人らしい
          return void shootingStar();
        // cameraMoved には反応しない。見回したのは見ている人の操作で、
        // それを実況するのは隣にいる人ではなく画面の中の案内役になる
      }
    };

    // ── 静かな時間の独り言 ────────────────────────────────
    const quiet: Line[] = [
      ...QUIET_TALK[mode],
      ...QUIET_TALK.both,
      ...(clockLine(new Date().getHours()) ? [clockLine(new Date().getHours())!] : []),
    ];
    const drawQuiet = bag(quiet.length);
    let quietGap = QUIET_FIRST_MS;

    // ── 時間で進むほう ────────────────────────────────────
    const tick = () => {
      if (hiddenAt) return;
      const now = Date.now();
      const elapsed = elapsedNow();

      while (nextSlot < SCRIPT.length && elapsed >= SCRIPT[nextSlot].at * 1000) {
        const slot = SCRIPT[nextSlot++];
        // 黙らせてある間もスロットは進める。戻したときに昔の行から
        // 喋り直すと、居なかった時間まで巻き戻ることになる
        if (mutedRef.current) continue;
        // 種明かしとボタンの案内は、知っている人には雑音
        if (slot.firstVisitOnly && visit.seen) continue;
        pending.push({ key: slot.key, text: scriptText(slot.key) });
      }
      // 反応に負けた行は、ここで次のスロットへ送られる
      if (pending.length > 0) {
        const next = pending[0];
        // 種明かしは、最後まで聞いてもらえたときだけ「知っている人」にする
        const done = next.key === "reveal" ? markSeen : undefined;
        if (say(next.text, { done })) pending.shift();
      }

      if (mutedRef.current) return;

      // 長居への一言。段ごとに独立して数えるので、10 分を逃した人も
      // 30 分でちゃんと拾える。粘るのは 30 秒だけで、過ぎた段は捨てる
      while (
        nextMilestone < MILESTONES.length &&
        elapsed > MILESTONES[nextMilestone].at * 1000 + MILESTONE_WINDOW_MS
      )
        nextMilestone++;
      if (
        nextMilestone < MILESTONES.length &&
        elapsed >= MILESTONES[nextMilestone].at * 1000 &&
        say(t(MILESTONES[nextMilestone].line))
      )
        nextMilestone++;

      if (current === null && pending.length === 0 && now - silentSince >= quietGap) {
        if (say(t(quiet[drawQuiet()]))) {
          quietGap = Math.min(quietGap + QUIET_STEP_MS, QUIET_MAX_MS);
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt) away += Date.now() - hiddenAt;
      hiddenAt = 0;
      if (!mutedRef.current) say(t(STATE.returned));
    };

    const timer = setInterval(tick, TICK_MS);
    const off = onHeroEvent(handle);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      sayRef.current = null;
      clearInterval(timer);
      off();
      document.removeEventListener("visibilitychange", onVisibility);
      if (hideTimer) clearTimeout(hideTimer);
      for (const t of timers) clearTimeout(t);
      setUtterance(null);
    };
  }, [locale, mode]);

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    rememberQuiet(next);
    // 元気に返事してからピタッと止まる。この一言だけフェードを短くする
    sayRef.current?.(pick(locale, next ? CONTROL.hushed : CONTROL.resumed), {
      force: true,
      fast: true,
    });
  }, [locale]);

  return { utterance, muted, toggleMuted, locale };
}
