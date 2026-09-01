"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CAMERA, POINTER_LOOK } from "./sceneConfig";

// マウス(タッチ)の位置に追従してカメラの向きだけを動かす。
// 位置は動かさないので、空を見回しているような視差だけが得られる。
export function CameraRig() {
  // 実際に適用中の角度。ポインタ目標値へ毎フレーム減衰させて追いつかせる
  const current = useRef({ yaw: 0, pitch: CAMERA.rotation[0] });

  useFrame((state, delta) => {
    const camera = state.camera;
    // 見上げ角(X)を保ったまま左右(Y)を回すため YXZ 順に固定する
    camera.rotation.order = "YXZ";

    // pointer は canvas 上で -1..1 に正規化済み
    const targetYaw = -state.pointer.x * POINTER_LOOK.yaw;
    const targetPitch =
      CAMERA.rotation[0] + state.pointer.y * POINTER_LOOK.pitch;

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
