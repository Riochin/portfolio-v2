"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { stripLocale } from "@/lib/i18n/paths";

/**
 * ブラウザの「戻る/進む」でも一覧 <-> 詳細の画像モーフを走らせるための橋渡し。
 *
 * Next は popstate を ACTION_RESTORE として処理するが、この経路だけは React の
 * transition の外で state を差し替えるため <ViewTransition> が起動せず、画像が
 * ハードカットで入れ替わる (vercel/next.js#94369)。そこで一覧 <-> 詳細の移動に
 * 限って popstate を横取りし、同じ URL への router.replace() ── リンクを押した
 * ときと同じ経路 ── としてやり直す。
 *
 * ルートレイアウトに置く。works 配下でしか効かない仕組みだが、下の
 * addEventListener が Next の購読 (AppRouter の useEffect = ハイドレーション後)
 * より先に走らないと横取りできないので、最初のバンドルに入る位置から読み込む。
 */

/** いま居るパスと 1 つ前。ロケール接頭辞込み。 */
let currentPath: string | null = null;
let previousPath: string | null = null;

/** パスごとの最後のスクロール位置。works のページはこれを自分で戻す。 */
const scrollByPath = new Map<string, number>();

/** popstate を横取りする関数。Bridge がマウントされている間だけ立つ。 */
let takeOver: ((href: string) => boolean) | null = null;

if (typeof window !== "undefined") {
  // 同じ window のリスナは登録順に呼ばれる。ここはモジュール評価時
  // ── ハイドレーションより前 ── なので Next の購読より必ず先に走り、
  // stopImmediatePropagation() で Next 側の復元を止められる。
  // 万一あとから登録されても、Next の復元が普通に走るだけで壊れはしない
  // (モーフが付かない従来の挙動に戻る)。
  window.addEventListener("popstate", (event) => {
    if (takeOver?.(window.location.href)) {
      event.stopImmediatePropagation();
    }
  });
}

function isWorkDetail(path: string): boolean {
  return path.startsWith("/works/");
}

/** 画像モーフのペアが在る組み合わせ (一覧 <-> 詳細) か。 */
function isMorphPair(from: string | null, to: string): boolean {
  if (from === null) return false;
  const a = stripLocale(from);
  const b = stripLocale(to);
  return (
    (a === "/works" && isWorkDetail(b)) || (isWorkDetail(a) && b === "/works")
  );
}

/** スクロールの復元を自分で持つページか (= scrollRestoration を manual にする)。 */
function ownsScroll(path: string): boolean {
  const p = stripLocale(path);
  return p === "/works" || isWorkDetail(p);
}

/** 1 つ前に居たのが Works 一覧か。詳細ページの「戻る」がこれを見る。 */
export function cameFromWorksList(): boolean {
  return previousPath !== null && stripLocale(previousPath) === "/works";
}

/**
 * いま描こうとしている一覧が「詳細から戻ってきた」ものか。
 *
 * 一覧の render 中 ── currentPath の更新 (layout effect) より前 ── に呼ぶ前提。
 * その時点の currentPath はまだ遷移元、つまり詳細ページを指している。
 */
export function isReturningFromWorkDetail(): boolean {
  return currentPath !== null && isWorkDetail(stripLocale(currentPath));
}

export function WorksHistoryBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const pendingScroll = useRef<number | null>(null);

  // パスの記録とスクロールの復元は layout effect で行う。
  // 復元が view transition のスナップショットより後になると、モーフが
  // 「戻す前のタイルの位置」へ飛んでから画面が跳ねる。
  useLayoutEffect(() => {
    if (currentPath !== pathname) {
      previousPath = currentPath;
      currentPath = pathname;
    }
    if (pendingScroll.current !== null) {
      window.scrollTo(0, pendingScroll.current);
      pendingScroll.current = null;
    }
  }, [pathname]);

  /* --- ブラウザの履歴スクロール復元を works のページでだけ止める ---
     この復元は popstate を配った「次のタスク」で走る。つまり行き先の DOM が
     入る前 ── まだ行き元のページが映っている状態 ── で行き先の位置まで飛ばす
     ので、行き先の方が長いと丈が足りずに丸められ、行き元が一番下まで送られる。
     モーフの「行き」のスナップショットはその位置で撮られるため、画像が画面の
     外から動き出すことになり、動いていないように見える (1 列で縦に長いスマホの
     一覧で顕著。詳細が 700px 以上ずれていた)。
     マイクロタスクで押し戻す・そこで manual にする、はどちらも間に合わない
     (復元はそのあと) ので、そのエントリに居るあいだに切っておくしかない。
     切ったぶんは上の pendingScroll で自分で戻す。 */
  useEffect(() => {
    // 履歴エントリを積むのは AppRouter の effect (親なのでこの後)。先に書くと
    // 1 つ前のエントリの設定を書き換えてしまうので 1 拍待つ。
    const id = setTimeout(() => {
      history.scrollRestoration = ownsScroll(pathname) ? "manual" : "auto";
    }, 0);
    // リロードやタブを閉じるときの復元まで殺す必要はないので戻しておく。
    const toAuto = () => {
      history.scrollRestoration = "auto";
    };
    window.addEventListener("pagehide", toAuto);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pagehide", toAuto);
    };
  }, [pathname]);

  // 着地したときの位置も控えておく (push なら 0、履歴移動なら復元後の位置)。
  // これが無いと「一度もスクロールしなかったページ」の記録が空のままになり、
  // 下の takeOver が横取りを見送ってしまう。
  useEffect(() => {
    scrollByPath.set(pathname, window.scrollY);
  }, [pathname]);

  // scroll イベントの購読は 1 回だけ。pathname ごとに貼り直すと、遷移直後に
  // Next が行う「先頭へ戻す」の分を古いリスナ ── まだ前のページのキーを
  // 掴んでいる ── が拾い、読んでいた位置を 0 で上書きしてしまう。
  // 行き先の記録は layout effect で先に済んでいるので currentPath を見る。
  useEffect(() => {
    const onScroll = () => {
      if (currentPath !== null) scrollByPath.set(currentPath, window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    takeOver = (href) => {
      const to = new URL(href).pathname;
      const saved = scrollByPath.get(to);

      // 行き先が works のページなら、ブラウザの復元は切ってあるので自分で戻す。
      // (横取りするかどうかとは別。一覧へ普通に戻るだけの移動もここを通る)
      if (ownsScroll(to) && saved !== undefined) {
        pendingScroll.current = saved;
      }

      // 戻す位置を握っていないとき (リロード直後など) は横取りしない。
      // 自前の replace は DOM の差し替えが 1 テンポ遅れるぶん、位置を戻せないと
      // 「読んでいた場所に帰る」が壊れる。モーフを諦めて Next の復元に任せる。
      if (saved === undefined || !isMorphPair(currentPath, to)) return false;

      router.replace(href, { scroll: false });
      return true;
    };
    return () => {
      takeOver = null;
    };
  }, [router]);

  return null;
}
