"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MOUNTAINS, type MountainRidge } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec3 vWorld;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// 稜線より下だけを塗りつぶす。板 1 枚で 1 つの尾根になるので、
// z 違いで重ねると奥行きのある山並みになる。
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBase;
  uniform float uHeight;
  uniform float uScale;
  uniform float uSeed;
  varying vec3 vWorld;

  float hash(float n) {
    return fract(sin(n * 127.1 + uSeed) * 43758.5453);
  }

  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
  }

  // 粗い起伏に細かい起伏を重ねて尾根をつくる
  float ridge(float x) {
    float h = noise(x) * 0.6;
    h += noise(x * 2.3 + 11.0) * 0.26;
    h += noise(x * 5.7 + 31.0) * 0.14;
    return h;
  }

  void main() {
    float line = uBase + ridge(vWorld.x * uScale) * uHeight;
    // 1px 程度でぼかしてジャギーを消す
    float edge = fwidth(vWorld.y) * 1.5;
    float alpha = 1.0 - smoothstep(line - edge, line + edge, vWorld.y);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function Ridge({ ridge }: { ridge: MountainRidge }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(ridge.color) },
      uBase: { value: ridge.base },
      uHeight: { value: ridge.height },
      uScale: { value: ridge.scale },
      uSeed: { value: ridge.seed },
    }),
    [ridge],
  );

  return (
    <mesh position={[0, MOUNTAINS.centerY, ridge.z]}>
      <planeGeometry args={[MOUNTAINS.width, MOUNTAINS.tall]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function Mountains() {
  return (
    <>
      {MOUNTAINS.ridges.map((ridge) => (
        <Ridge key={ridge.seed} ridge={ridge} />
      ))}
    </>
  );
}
