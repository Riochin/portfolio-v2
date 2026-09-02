"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { OceanPalette } from "./sceneConfig";
import { OCEAN } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec3 vWorld;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// 反射マップは持たず、フレネル(見込み角)で空の色を混ぜ、太陽の映り込みを
// ノイズで散らしてきらめきを作る。板 1 枚で済むので描画は 1 パス。
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uNear;
  uniform vec3 uFar;
  uniform vec3 uSky;
  uniform vec3 uHaze;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uSunPower;
  uniform float uSunStrength;
  uniform float uClarity;
  uniform vec3 uShimmer;
  uniform float uRipple;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec3 vWorld;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // さざ波の高さ場。方向の違う層を重ねて規則性を消す
  float waves(vec2 p) {
    float h = 0.0;
    h += noise(p * 1.0 + vec2(uTime * 0.05, uTime * 0.03)) * 0.55;
    h += noise(p * 2.3 + vec2(-uTime * 0.08, uTime * 0.05)) * 0.28;
    h += noise(p * 5.1 + vec2(uTime * 0.11, -uTime * 0.07)) * 0.12;
    return h;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float dist = length(cameraPosition.xz - vWorld.xz);

    // 遠景ほど波を平らにする。そうしないと地平付近でノイズがちらつく
    float detail = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);
    vec2 p = vWorld.xz * uRipple;
    // 透明感の明暗は waves() の最低周波数が支配的で、時間が進むと
    // 大きな滲みになる。明暗だけは細かい成分から取り、木漏れ日のような
    // 粒の揃ったきらめきにする
    float dapple = noise(p * 3.1 + vec2(uTime * 0.07, -uTime * 0.05)) * 0.65
      + noise(p * 6.7 - vec2(uTime * 0.05, uTime * 0.08)) * 0.35;
    float eps = 0.35;
    float amp = 0.55 * detail;
    vec3 normal = normalize(vec3(
      (waves(p + vec2(eps, 0.0)) - waves(p - vec2(eps, 0.0))) * -amp,
      1.0,
      (waves(p + vec2(0.0, eps)) - waves(p - vec2(0.0, eps))) * -amp
    ));

    // 見込み角が浅いほど空を映す。手前は見下ろす角度なので映り込みを弱め、
    // 水そのものの色を出す(これをやらないと近景が白っぽく濁る)
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 4.0);
    fresnel = mix(0.03, 1.0, fresnel);
    fresnel *= mix(0.28, 1.0, smoothstep(20.0, 180.0, dist));

    // 手前ほど明るい水色を保ち、遠くだけ濃い青に沈める
    vec3 body = mix(uNear, uFar, pow(smoothstep(0.0, uFadeFar, dist), 1.5));

    // 浅い海の透明感は、波の起伏ごとに光の抜け方が違うことで出る。
    // 谷で uShimmer を「引く」と補色が抜けて黒ずむので、山は光を足し、
    // 谷は色相を保ったまま倍率で軽く沈めるだけにする。
    float crest = max(dapple - 0.5, 0.0);
    float trough = max(0.5 - dapple, 0.0);
    body *= 1.0 - trough * uClarity * 0.3 * detail;
    body += uShimmer * crest * uClarity * detail;

    vec3 color = mix(body, uSky, fresnel * 0.85);

    // 鋭い映り込み(太陽の道)と、水面全体の広いつや
    vec3 reflected = reflect(-viewDir, normal);
    float aligned = max(dot(reflected, normalize(uSunDir)), 0.0);
    float spec = pow(aligned, uSunPower);
    float sheen = pow(aligned, 12.0) * 0.16;
    float sparkle = 0.45 + 0.55 * noise(p * 9.0 + uTime * 0.35);
    color += uSunColor * (spec * sparkle * uSunStrength + sheen) * detail;

    // 水平線に向けて空の霞へ溶かし、板の end を隠す
    float haze = smoothstep(uFadeNear, uFadeFar, dist);
    color = mix(color, uHaze, haze);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Ocean({
  palette,
  animated,
}: {
  palette: OceanPalette;
  animated: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      // 静止画キャプチャでも波が出るよう、初期値は 0 ではなく固定の位相
      uTime: { value: OCEAN.stillTime },
      uNear: { value: new THREE.Color(palette.near) },
      uFar: { value: new THREE.Color(palette.far) },
      uSky: { value: new THREE.Color(palette.sky) },
      uHaze: { value: new THREE.Color(palette.haze) },
      uSunColor: { value: new THREE.Color(palette.sunColor) },
      uSunDir: { value: new THREE.Vector3(...palette.sunDir) },
      uSunPower: { value: palette.sunPower },
      uSunStrength: { value: palette.sunStrength },
      uClarity: { value: palette.clarity },
      uShimmer: { value: new THREE.Color(palette.shimmer) },
      uRipple: { value: OCEAN.ripple },
      uFadeNear: { value: OCEAN.fadeNear },
      uFadeFar: { value: OCEAN.fadeFar },
    }),
    [palette],
  );

  useFrame((_, delta) => {
    if (animated && material.current) {
      material.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[OCEAN.size, OCEAN.size]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}
