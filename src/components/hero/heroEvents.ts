import * as THREE from "three";

/**
 * ヒーローの空で起きたことを、外から購読できるようにするだけの仕組み。
 *
 * 発火はすべて useFrame の中から来る。React の状態にすると、鳥が一群れ
 * 通るたびに 60fps で回っている Canvas の隣のツリーが描き直しになるので、
 * ここは React に一切触らない。購読側は useEffect で onHeroEvent を張り、
 * 返ってきた関数で外す——それだけ。
 *
 * ブロックの Canvas と全画面の Canvas が同時に立つことは無い
 * (HeroSection が isExpanded で片方を外す) ので、どちらの空から来たかは
 * 区別していない。
 */

/** 空で起きた 1 つの出来事 */
export type HeroEvent =
  /** 鳥の群れが枠に入った */
  | { type: "bird"; flock: number }
  /** 流れ星が 1 本降り始めた。concurrent は今この瞬間に降っている本数 */
  | { type: "shootingStar"; concurrent: number }
  /** 船が枠に入った */
  | { type: "ship" }
  /** 飛行機雲の機影が枠に入った */
  | { type: "contrail" }
  /** 夜行便が枠に入った */
  | { type: "navLights" }
  /** 漁火が灯った */
  | { type: "fishingLights" }
  /** 見ている人が視点を振った */
  | { type: "cameraMoved" };

export type HeroEventType = HeroEvent["type"];

type HeroEventListener = (event: HeroEvent) => void;

const listeners = new Set<HeroEventListener>();

/** 購読する。返ってきた関数を呼ぶと外れる */
export function onHeroEvent(listener: HeroEventListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 出来事を配る。誰も聞いていなければ何もしない */
export function emitHeroEvent(event: HeroEvent) {
  if (listeners.size === 0) return;
  // 配っている途中で購読が外れることがある。複製してから回す
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch (error) {
      // ここは useFrame の中。1 人の例外で描画のループごと落とさない
      console.error("hero event listener failed", error);
    }
  }
}

// project() は渡した Vector3 を書き換えるので、判定用の置き場を 1 つ持つ
const projected = new THREE.Vector3();

/**
 * その点が今、画面の左右の内側にあるか。
 *
 * 鳥・船・飛行機雲・夜行便は、いずれも画角のずっと外で組まれてから枠へ
 * 入ってくる (船は入るまでに 1 分以上かかることもある)。組んだ瞬間に
 * 知らせると、何も無い空へ向かって「船が通ってる」と言うことになるので、
 * 出来事とみなすのは枠に入ってからにする。
 *
 * 上下を見ないのは、高さはどれも枠に収まるよう決めてあるうえ、見上げる
 * 操作 (POINTER_LOOK.pitch) の加減で、通り過ぎるまで一度も「出現しない」
 * 群れが出かねないため。左右だけで足りる。
 */
export function inFrame(
  point: { x: number; y: number; z: number },
  camera: THREE.Camera,
) {
  projected.set(point.x, point.y, point.z).project(camera);
  // カメラの後ろの点は w が負になって x の符号が裏返り、枠の中に見えて
  // しまう。そちら側は必ず z > 1 になるので、まずそこで弾く
  return projected.z < 1 && Math.abs(projected.x) <= 1;
}
