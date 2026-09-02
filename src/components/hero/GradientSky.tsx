"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SKY_RADIUS } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 midColor;
  uniform vec3 bottomColor;
  uniform float curve;
  varying vec3 vWorldPosition;

  // NOTE: このシェーダは gl_FragColor をそのまま書き出しており、three の
  // <colorspace_fragment>(linearToOutputTexel)を通していない。THREE.Color は
  // hex を sRGB→リニアへ直して渡してくるので、画面に出るのは「hex のリニア値」
  // であって hex そのものではない(実測: #0a68b4 が #21498e として出る)。
  // 直すなら gl_FragColor の代入直後に #include <colorspace_fragment> を足す。
  // ただし DAY_SKY / NIGHT_SKY の色はこの状態を前提に詰めてあるので、
  // 足すときは両方の hex を「今のリニア値」に置き換えないと見た目が飛ぶ。
  void main() {
    float h = normalize(vWorldPosition).y;
    // curve が小さいほど、低い仰角でも一気に topColor へ寄る
    vec3 color = h > 0.0
      ? mix(midColor, topColor, pow(min(h, 1.0), curve))
      : mix(midColor, bottomColor, pow(min(-h, 1.0), 0.8));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function GradientSky({
  top,
  mid,
  bottom,
  curve = 0.65,
}: {
  top: string;
  mid: string;
  bottom: string;
  curve?: number;
}) {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color(top) },
      midColor: { value: new THREE.Color(mid) },
      bottomColor: { value: new THREE.Color(bottom) },
      curve: { value: curve },
    }),
    [top, mid, bottom, curve],
  );

  return (
    <mesh scale={SKY_RADIUS}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
