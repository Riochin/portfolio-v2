"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SUN, VOLUME_CLOUDS as C } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec3 vWorld;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// 雲をポリゴンで持たず、空間の密度関数として定義してレイマーチで積分する。
// ピクセルごとに視線を進めながら密度を拾い、各点から太陽へ短いレイを飛ばして
// 「そこまで光が届くか」を測ることで、雲頂が白く雲底が沈む陰影が計算から出る。
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uShadowColor;
  uniform vec3 uHaze;
  uniform float uBottom;
  uniform float uTop;
  uniform float uCoverage;
  uniform float uDensity;
  uniform float uScale;
  uniform float uDetailScale;
  uniform float uErode;
  uniform float uMaxDistance;
  uniform float uMaxStep;
  uniform float uFadeDistance;
  uniform vec3 uWind;
  varying vec3 vWorld;

  const int STEPS = ${C.steps};
  const int LIGHT_STEPS = ${C.lightSteps};

  float hash13(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm3(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise3(p); p *= 2.03;
    f += 0.2500 * noise3(p); p *= 2.01;
    f += 0.1250 * noise3(p);
    return f / 0.875;
  }

  // 高度で挟んだ層の重み。下端と上端をなめらかに落とす
  float slabAt(vec3 p) {
    float h = (p.y - uBottom) / (uTop - uBottom);
    if (h < 0.0 || h > 1.0) return 0.0;
    return smoothstep(0.0, 0.22, h) * smoothstep(1.0, 0.55, h);
  }

  // 光の減衰を測るための粗い密度。縁を削るノイズは省いて安くする
  float densityCoarse(vec3 p) {
    float slab = slabAt(p);
    if (slab <= 0.0) return 0.0;
    vec3 wind = uWind * uTime;
    float base = fbm3(p * uScale + wind * uScale);
    float d = smoothstep(1.0 - uCoverage, 1.0 - uCoverage + 0.22, base);
    return d * slab * uDensity;
  }

  // ある点にどれだけ雲があるか。0 なら空
  float density(vec3 p) {
    float slab = slabAt(p);
    if (slab <= 0.0) return 0.0;

    vec3 wind = uWind * uTime;
    float base = fbm3(p * uScale + wind * uScale);
    // coverage を上げるほど、より薄い塊まで雲として残る。
    // 単純な引き算だと境界が硬く、紙を破ったような縁になるので
    // smoothstep でなだらかに立ち上げる
    float d = smoothstep(1.0 - uCoverage, 1.0 - uCoverage + 0.22, base);
    if (d <= 0.0) return 0.0;

    // 細かいノイズで縁を削る。billow(折り返したノイズ)にすると
    // 綿あめではなく積雲らしいもこもこした削れ方になる
    vec3 dp = p * uDetailScale + wind * uDetailScale;
    float billow = 1.0 - abs(noise3(dp) * 2.0 - 1.0);
    // 薄いところほど強く削る。一律に引くと雲がちぎれて粒々になる
    d -= billow * uErode * (1.0 - smoothstep(0.0, 0.25, d));
    return max(d, 0.0) * slab * uDensity;
  }

  // その点から太陽へ短く進み、通ってきた雲の量から届く光を出す
  float lightMarch(vec3 p) {
    float step = (uTop - uBottom) / float(LIGHT_STEPS) * 0.9;
    float sum = 0.0;
    for (int i = 0; i < LIGHT_STEPS; i++) {
      p += uSunDir * step;
      sum += densityCoarse(p);
    }
    return exp(-sum * step * 0.35);
  }

  void main() {
    vec3 dir = normalize(vWorld - cameraPosition);
    // 上を向いていないレイは雲の層に入らない
    if (dir.y <= 0.001) discard;

    // 視線と層の交差区間を求め、そこだけを積分する
    float t0 = (uBottom - cameraPosition.y) / dir.y;
    float t1 = (uTop - cameraPosition.y) / dir.y;
    t0 = max(t0, 0.0);
    t1 = min(t1, uMaxDistance);
    if (t1 <= t0) discard;

    // 水平に近いレイは区間が長大になる。刻みを上限で抑えないと
    // 1 ステップが数百単位になり、縞とちらつきになる
    float stepSize = min((t1 - t0) / float(STEPS), uMaxStep);
    // 等間隔だと縞が出るので、ピクセルごとに開始位置をずらす
    float jitter = hash13(vec3(gl_FragCoord.xy, 1.0));
    float t = t0 + stepSize * jitter;

    float transmittance = 1.0;
    vec3 scattered = vec3(0.0);

    for (int i = 0; i < STEPS; i++) {
      if (transmittance < 0.02) break;
      vec3 p = cameraPosition + dir * t;
      // 遠いほど 1 ステップを大きく取る。近景の精度は保ったまま、
      // 水平線側の長大な区間まで届かせるため
      float ds = max(stepSize, t * 0.012);
      float d = density(p);
      if (d > 0.0) {
        float light = lightMarch(p);
        vec3 color = mix(uShadowColor, uSunColor, light);
        // 遠いものほど空の霞に溶かす
        color = mix(color, uHaze, smoothstep(0.0, uFadeDistance, t));
        float absorbed = d * ds;
        scattered += transmittance * color * absorbed;
        transmittance *= exp(-absorbed);
      }
      t += ds;
    }

    float alpha = 1.0 - transmittance;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(scattered / max(alpha, 0.001), alpha);
  }
`;

export function VolumeClouds({ animated }: { animated: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: C.stillTime },
      uSunDir: { value: new THREE.Vector3(...SUN).normalize() },
      uSunColor: { value: new THREE.Color(C.sunColor) },
      uShadowColor: { value: new THREE.Color(C.shadowColor) },
      uHaze: { value: new THREE.Color(C.haze) },
      uBottom: { value: C.bottom },
      uTop: { value: C.top },
      uCoverage: { value: C.coverage },
      uDensity: { value: C.density },
      uScale: { value: C.scale },
      uDetailScale: { value: C.detailScale },
      uErode: { value: C.erode },
      uMaxDistance: { value: C.maxDistance },
      uMaxStep: { value: C.maxStep },
      uFadeDistance: { value: C.fadeDistance },
      uWind: { value: new THREE.Vector3(...C.wind) },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (animated && material.current) {
      material.current.uniforms.uTime.value += delta;
    }
  });

  // カメラを包む球。面そのものは見せず、各ピクセルの視線方向を得るために使う
  return (
    <mesh>
      <sphereGeometry args={[C.domeRadius, 24, 16]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
