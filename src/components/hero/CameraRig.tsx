"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CAMERA, POINTER_LOOK } from "./sceneConfig";

// ポインタの位置に追従してカメラの向きだけを動かす。
// 位置は動かさないので、空を見回しているような視差だけが得られる。
export function CameraRig() {
  // 実際に適用中の角度。ポインタ目標値へ毎フレーム減衰させて追いつかせる
  const current = useRef({ yaw: 0, pitch: CAMERA.rotation[0] });
  // 指でなぞって溜めた向き。マウスの pointer と同じ -1..1 の意味に揃えてある。
  // used は一度でも指で触ったか——触った後にマウス扱いの絶対座標へ戻ると、
  // 指を置いた場所へ視点が飛んでしまう。
  const touch = useRef({ x: 0, y: 0, used: false });
  const gl = useThree((state) => state.gl);

  // 指の場合、ポインタの絶対位置をそのまま向きに使うと、触れた瞬間にそこへ
  // 飛んでしまう。なぞった量だけを積んで、空をつかんで回す手触りにする。
  useEffect(() => {
    const el = gl.domElement;
    const last = { x: 0, y: 0 };
    // 追いかけるのは最初の 1 本だけ。2 本目以降は無視する
    let id: number | null = null;

    const clamp = (value: number) => THREE.MathUtils.clamp(value, -1, 1);

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
      // 指を右へ引けば左が、下へ引けば上が現れる向き(いずれもマウスとは逆)
      touch.current.x = clamp(
        touch.current.x -
          ((event.clientX - last.x) / width) * POINTER_LOOK.drag,
      );
      touch.current.y = clamp(
        touch.current.y +
          ((event.clientY - last.y) / height) * POINTER_LOOK.drag,
      );
      last.x = event.clientX;
      last.y = event.clientY;
    };

    // 離しても向きは戻さない。振り向いた先をそのまま見ていられるように
    const end = (event: PointerEvent) => {
      if (event.pointerId === id) id = null;
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
    const x = touch.current.used ? touch.current.x : state.pointer.x;
    const y = touch.current.used ? touch.current.y : state.pointer.y;

    const targetYaw = -x * POINTER_LOOK.yaw;
    const targetPitch = CAMERA.rotation[0] + y * POINTER_LOOK.pitch;

    current.current.yaw = THREE.MathUtils.damp(
      current.current.yaw,
      targetYaw,
      POINTER_LOOK.damping,
      delta,
    );
    current.current.pitch = THREE.MathUtils.damp(
      current.current.pitch,
      targetPitch,
      POINTER_LOOK.damping,
      delta,
    );

    camera.rotation.set(current.current.pitch, current.current.yaw, 0);
  });

  return null;
}
