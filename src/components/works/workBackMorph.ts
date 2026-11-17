import {
  WORK_BACK_TRANSITION_TYPE,
  workImageTransitionName,
} from "./workImageTransition";

/**
 * 詳細 -> 一覧 (トップの「作ったもの」も含む) のブラウザバックで、画像のモーフを
 * React を通さずに走らせる。MorphHistoryBridge から呼ぶ。
 *
 * React の <ViewTransition> は、画面外の要素とはペアを作らない (仕様。名前を
 * 付けたあとで viewport の外なら外す)。詳細をスクロールして hero が画面の外に
 * 出てから戻ると、一覧のタイルへのモーフが起きずにパッと切り替わる。
 *
 * そこでこの戻りだけは WORK_BACK_TRANSITION_TYPE を付けて React のペアを切り
 * (WORK_IMAGE_SHARE)、view-transition-name を手で付ける。旧側 (詳細の hero)
 * は戻る直前、新側 (一覧のタイル) は一覧の layout effect (attach) で付ける。
 * ペアも enter も無い commit では React は startViewTransition を呼ばないので、
 * 遷移は自分で始める。手で付けた名前ならブラウザは画面外でも撮るので、
 * 画像は上から降りてきてタイルに収まる。
 *
 * React の遷移とぶつかったときの振る舞いは vt-back-lab で確かめてある
 * (名前の重複は起きない。どちらかが skip されるだけで画面は壊れない)。
 */

/** 手で付ける名前。React が付ける work-image-* とは別の値にする (重複させない)。 */
const MANUAL_NAME = "work-back-morph";

/**
 * 一覧を待つ上限。過ぎたら遷移を諦め、一覧は届いた時点でパッと切り替える。
 * ルーターキャッシュが切れていると一覧の RSC を取りに行き、そのあいだ自前の
 * update が終わらず画面が固まる (2 秒近く固まることがあった)。
 */
const UPDATE_TIMEOUT_MS = 300;

/** 一覧が描かれるのを待っている遷移。attach か yield か時間切れで捨てる。 */
let pending: {
  slug: string;
  transition: ViewTransition;
  /** update を終える。callback がまだ呼ばれていなければ、呼ばれたときに終える。 */
  release: () => void;
} | null = null;

/** 手で名前を付けた要素。遷移が終わったら外す。 */
const named = new Set<HTMLElement>();

function findImage(slug: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-vt-name="${CSS.escape(workImageTransitionName(slug))}"]`,
  );
}

function setName(el: HTMLElement) {
  el.style.viewTransitionName = MANUAL_NAME;
  el.style.setProperty("view-transition-class", "morph");
  named.add(el);
}

function clearNames() {
  for (const el of named) {
    el.style.viewTransitionName = "";
    el.style.removeProperty("view-transition-class");
  }
  named.clear();
}

/**
 * 戻りの遷移を始める。go には router.replace を渡す (transitionTypes 付きで呼ぶ)。
 * View Transitions が無いブラウザでは何もせず false を返す。
 */
export function startWorkBackMorph(
  slug: string,
  go: (transitionTypes: string[]) => void,
): boolean {
  if (typeof document.startViewTransition !== "function") return false;

  const hero = findImage(slug);
  if (hero) setName(hero);

  // 自前の遷移のあいだは root を撮らない (globals.css の html[data-manual-vt])。
  // root が参加者だと、遷移中のクリックが html に落ちて消える。詳細の本文が
  // クロスフェードで透けて残るのも防げる。
  // インライン style ではなく属性 + CSS にする。React は自分の遷移の後片付けで
  // <html> のインラインの view-transition-name を書き戻すので、消されてしまう。
  const root = document.documentElement;
  root.dataset.manualVt = "";

  let cancelled = false;
  let resolveUpdate: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
        // 旧スナップショットを撮るまでのあいだに譲っていたら、もう戻らない。
        if (cancelled) return resolve();
        timer = setTimeout(() => {
          if (pending?.transition !== transition) return;
          pending = null;
          transition.skipTransition();
          resolve();
        }, UPDATE_TIMEOUT_MS);
        go([WORK_BACK_TRANSITION_TYPE]);
      }),
  );

  pending = {
    slug,
    transition,
    release: () => {
      clearTimeout(timer);
      cancelled = true;
      resolveUpdate?.();
    },
  };

  transition.finished.finally(() => {
    delete root.dataset.manualVt;
    clearNames();
  });
  // 中断や skip の reject はここで受けておく (未処理の reject にしない)。
  transition.ready.catch(() => {});
  return true;
}

/**
 * 一覧が描かれた commit の layout effect から呼ぶ。スクロールを戻したあとで
 * 呼ぶこと (新スナップショットはこの直後に撮られる)。
 * onTilesPage は、いま描かれたのがタイルを持つページかどうか。
 */
export function attachWorkBackMorph(onTilesPage: boolean): void {
  const p = pending;
  if (!p || !onTilesPage) return;
  pending = null;
  const tile = findImage(p.slug);
  if (tile) {
    setName(tile);
  } else {
    // 畳まれていてタイルが無い (6 件目以降)、トップに載っていない作品など。
    // 相手がいないと詳細の画像だけがその場でフェードするので、遷移ごとやめる。
    p.transition.skipTransition();
  }
  p.release();
}

/**
 * 一覧を待っている最中に次の履歴移動が来たら、自前の遷移をやめて譲る。
 * 放っておくと来ない一覧を待ち続け、そのあいだ画面が固まる。
 */
export function yieldWorkBackMorph(): void {
  const p = pending;
  if (!p) return;
  pending = null;
  p.transition.skipTransition();
  p.release();
}
