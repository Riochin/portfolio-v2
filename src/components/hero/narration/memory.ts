"use client";

/**
 * 語りが覚えていること。
 *
 * 「静かに」と再訪は localStorage (ブラウザを閉じても覚えている)、
 * 「同じセッションで 2 回目の全画面」は sessionStorage ── タブを閉じたら
 * 忘れてよく、明日また「また来てくれた！」と言われると初回の挨拶を
 * 一度も聞けない人が出る。
 *
 * どれも読めなくて当たり前のもの (プライベートウィンドウ、サイトデータを
 * 拒否している設定) なので、失敗したら初回として扱う。語りが出ないのが
 * 正しい落ち方ではなく、初めましてとして出るのが正しい落ち方。
 */

const QUIET_KEY = "hero-narration-quiet";
const SEEN_KEY = "hero-narration-seen";
const ENTRIES_KEY = "hero-narration-entries";

function read(store: Storage | undefined, key: string) {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(store: Storage | undefined, key: string, value: string) {
  try {
    store?.setItem(key, value);
  } catch {
    // 覚えられないだけ。今この場の語りは続けてよい
  }
}

const local = () => (typeof window === "undefined" ? undefined : window.localStorage);
const session = () =>
  typeof window === "undefined" ? undefined : window.sessionStorage;

/** 一度「静かに」と言った人に、次も話しかけるのは失礼 */
export function readQuiet() {
  return read(local(), QUIET_KEY) === "1";
}

export function rememberQuiet(quiet: boolean) {
  write(local(), QUIET_KEY, quiet ? "1" : "0");
}

/**
 * 全画面に入ったことを記録し、今回が何回目かを返す。
 *
 * seen は「種明かしを聞き終えたことがあるか」、entries は「このタブで
 * 何回入ったか」。種明かし (0:20) とボタンの案内 (0:33) は seen で落とすので、
 * 通うほどこの海は静かになる。
 */
export function enter() {
  const seen = read(local(), SEEN_KEY) === "1";
  const entries = Number(read(session(), ENTRIES_KEY) ?? "0") + 1;
  write(session(), ENTRIES_KEY, String(entries));
  return { seen, entries };
}

/**
 * 種明かし (0:20) を最後まで聞いてもらえた。
 *
 * ここで初めて「知っている人」になる。入った瞬間に記録すると、間違えて
 * 開いて 5 秒で閉じた人まで再訪扱いになり、**いちばん聞いてほしい一行を
 * 二度と聞けなくなる**。一度きりだから価値がある、の一度は、本当に一度
 * 聞けた人の一度でなければ意味がない。
 */
export function markSeen() {
  write(local(), SEEN_KEY, "1");
}
