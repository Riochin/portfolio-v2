"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { emitHeroEvent } from "./heroEvents";
import { CAMERA, POINTER_LOOK } from "./sceneConfig";

// なぞって溜められる限界。端 (±1) から over ぶんまでは押し込めるが、
// 押すほど返りが小さくなり、見える角度は give ぶんまでしか増えない。
// 端に着いたことが手応えで分かればよく、可動域そのものは広げない。
const LIMIT = 1 + POINTER_LOOK.over;

// 「見回した」と認めるまでの道のり。-1..1 に正規化した入力での長さなので、
// 0.25 は画面のおよそ 1/8。触れただけ・手が揺れただけでは越えない。
const LOOK_TRAVEL = 0.25;
// 1 フレームぶんのゆらぎはここで捨てる
const LOOK_STILL = 0.002;
// これだけ入力が止まったら、次のひと振りをまた 1 回として数え直す
const LOOK_REARM = 1.5;

const rubber = (value: number) => {
  const over = Math.abs(value) - 1;
  if (over <= 0) return value;
  const t = Math.min(over / POINTER_LOOK.over, 1);
  // t(2-t) は端で傾きが 0 になる曲線。押し込むほど 1 px あたりの動きが細る
  return Math.sign(value) * (1 + POINTER_LOOK.give * t * (2 - t));
};

// ポインタの位置に追従してカメラの向きだけを動かす。
// 位置は動かさないので、空を見回しているような視差だけが得られる。
// yaw は画枠ごとの基準の向き (HERO_FRAMING)。振れ幅はそこを中心に取る。
export function CameraRig({ yaw = 0 }: { yaw?: number }) {
  // 実際に適用中の角度。ポインタ目標値へ毎フレーム減衰させて追いつかせる
  const current = useRef({ yaw, pitch: CAMERA.rotation[0] });
  // 指でなぞって溜めた向き。マウスの pointer と同じ -1..1 の意味に揃えてある
  // (押し込んでいる間だけ ±LIMIT まで溢れる)。
  // used は一度でも指で触ったか——触った後にマウス扱いの絶対座標へ戻ると、
  // 指を置いた場所へ視点が飛んでしまう。
  const touch = useRef({ x: 0, y: 0, used: false });
  // 見回したことを外へ知らせるための数え。started は基準を取ったか、
  // travel はひと振りで動いた道のり、still は止まっている秒、
  // told はこのひと振りぶんをもう流したか
  const look = useRef({
    x: 0,
    y: 0,
    started: false,
    travel: 0,
    still: 0,
    told: false,
  });
  const gl = useThree((state) => state.gl);

  // 指の場合、ポインタの絶対位置をそのまま向きに使うと、触れた瞬間にそこへ
  // 飛んでしまう。なぞった量だけを積んで、空をつかんで回す手触りにする。
  useEffect(() => {
    const el = gl.domElement;
    const last = { x: 0, y: 0 };
    // 追いかけるのは最初の 1 本だけ。2 本目以降は無視する
    let id: number | null = null;

    const clamp = (value: number) =>
      THREE.MathUtils.clamp(value, -LIMIT, LIMIT);

    // マウス以外(指とペン)はなぞりとして扱う
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || id !== null) return;
      id = event.pointerId;
      last.x = event.clientX;
      last.y = event.clientY;
      touch.current.used = true;
    };

    const move = (event: PointerEvent) => {
      if (event.pointerId !== id) return;
      const width = el.clientWidth || 1;
      const height = el.clientHeight || 1;
      // 指を右へ引けば左が、下へ引けば上が現れる向き(いずれもマウスとは逆)。
      // 縦は可動域が狭いぶん倍率を落とす (POINTER_LOOK.dragY)
      touch.current.x = clamp(
        touch.current.x -
          ((event.clientX - last.x) / width) * POINTER_LOOK.drag,
      );
      touch.current.y = clamp(
        touch.current.y +
          ((event.clientY - last.y) / height) *
            POINTER_LOOK.drag *
            POINTER_LOOK.dragY,
      );
      last.x = event.clientX;
      last.y = event.clientY;
    };

    // 離しても向きは戻さない。振り向いた先をそのまま見ていられるように。
    // ただし端を越えて押し込んでいたぶんだけは端へ帰す——目標が端へ戻り、
    // 追従の減衰がそのままばねの戻りになる。
    const end = (event: PointerEvent) => {
      if (event.pointerId !== id) return;
      id = null;
      touch.current.x = THREE.MathUtils.clamp(touch.current.x, -1, 1);
      touch.current.y = THREE.MathUtils.clamp(touch.current.y, -1, 1);
    };

    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerup", end, { passive: true });
    el.addEventListener("pointercancel", end, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const camera = state.camera;
    // 見上げ角(X)を保ったまま左右(Y)を回すため YXZ 順に固定する
    camera.rotation.order = "YXZ";

    // pointer は canvas 上で -1..1 に正規化済み
    const touched = touch.current.used;
    const x = touched ? rubber(touch.current.x) : state.pointer.x;
    const y = touched ? rubber(touch.current.y) : state.pointer.y;

    // 見回したことを外へ知らせる。見るのは入力 (ポインタ / なぞりで溜めた
    // 向き) そのもので、下の damp が追いついていく途中の角度ではない——
    // 慣性で動いているだけの間は「動かした」ではないため。
    const l = look.current;
    if (!l.started) {
      // 最初の 1 フレームは基準を取るだけ。ポインタが (0,0) の初期値から
      // 実際の位置へ着くぶんを、ひと振りと数えない
      l.x = x;
      l.y = y;
      l.started = true;
    } else {
      const moved = Math.hypot(x - l.x, y - l.y);
      l.x = x;
      l.y = y;
      if (moved > LOOK_STILL) {
        l.still = 0;
        l.travel += moved;
        if (!l.told && l.travel >= LOOK_TRAVEL) {
          l.told = true;
          emitHeroEvent({ type: "cameraMoved" });
        }
      } else {
        l.still += delta;
        if (l.still >= LOOK_REARM) {
          l.travel = 0;
          l.told = false;
        }
      }
    }

    const targetYaw = yaw - x * POINTER_LOOK.yaw;
    const targetPitch = CAMERA.rotation[0] + y * POINTER_LOOK.pitch;

    // 指は一気に置いていくので、マウスの慣性のままだと遅れが鈍さになる
    const damping = touched ? POINTER_LOOK.touchDamping : POINTER_LOOK.damping;

    current.current.yaw = THREE.MathUtils.damp(
      current.current.yaw,
      targetYaw,
      damping,
      delta,
    );
    current.current.pitch = THREE.MathUtils.damp(
      current.current.pitch,
      targetPitch,
      damping,
      delta,
    );

    camera.rotation.set(current.current.pitch, current.current.yaw, 0);
  });

  return null;
}
