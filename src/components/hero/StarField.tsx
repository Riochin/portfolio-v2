"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bandMask, extinction } from "./galaxy";
import { registerStarMaterial, setStarHeightScale } from "./starPass";
import { STAR_RADIUS, STARS } from "./sceneConfig";

// 星の色。大半は青白から白の間で、少数だけ橙へ振れる。
// 実際の等級表と同じで、赤い星は明るいものほど目につく
const COOL = new THREE.Color("#bcd0ff");
const WHITE = new THREE.Color("#fff6ec");
const WARM = new THREE.Color("#ffc79a");
// 色を抜いた先。暗い星はここへ寄せる
const NEUTRAL = new THREE.Color("#f3f2f6");

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aRate;
  attribute float aTwinkle;

  uniform float time;
  uniform float heightScale;

  varying vec3 vColor;

  void main() {
    // またたき。暗い星ほど、低い星ほど大きく振れる (aTwinkle に畳んである)
    float flicker = 1.0 + aTwinkle * sin(time * aRate + aPhase);
    vColor = aColor * flicker;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // 下限は倍率を掛けたあとに当てる。水面の鏡像は小さなバッファへ焼くので、
    // 先に下限を取ってから縮めると 1px を切って均され、海から星が消える。
    // 暗い星はサイズではなく色の側で暗くしてあるので、下限で潰れはしない
    gl_PointSize = max(aSize * flicker * heightScale, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

// 芯と、その外に広がるハローの 2 枚重ね。明るい星ほど粒が大きく、
// ハローもピクセル上で広がるので、それだけで「大きい星は滲む」が出る。
// ポストプロセスの Bloom を足さずに済ませたいのは、ヒーローの Canvas が
// ページを開いている間ずっと回るため。
const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 8.0);
    float halo = exp(-d * d * 1.6) * 0.42;
    // 加算合成。色は積んだ時点の値をそのまま足す (乗算済みアルファ)
    gl_FragColor = vec4(vColor * (core + halo), 1.0);
  }
`;

function useStarGeometry() {
  return useMemo(() => {
    const { count, size, falloff, dimmest, bandBias, saturation, twinkle } =
      STARS;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const rates = new Float32Array(count);
    const twinkles = new Float32Array(count);

    const dir = new THREE.Vector3();
    const color = new THREE.Color();
    // 帯の中と外で受け入れ率がどれだけ違うかの上限。これで割って 0..1 にする
    const accept = 1 + bandBias;

    for (let i = 0; i < count; i++) {
      // 上半球にだけ撒く。水面が映すのも空の上側だけで、
      // 地平線の下の星は一度も見えないまま反射に紛れ込むだけになる。
      // y を一様に取ると球面上で面積一様になる
      let tries = 0;
      for (;;) {
        const y = Math.random();
        const azimuth = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - y * y);
        dir.set(r * Math.cos(azimuth), y, r * Math.sin(azimuth));
        // 天の川の帯へ寄せる。帯は星が濃い場所であって、
        // 上に乗った霞ではないので、密度そのものを上げる
        tries += 1;
        if (tries >= 8) break;
        if (Math.random() * accept <= 1 + bandBias * bandMask(dir)) break;
      }

      positions[i * 3] = dir.x * STAR_RADIUS;
      positions[i * 3 + 1] = dir.y * STAR_RADIUS;
      positions[i * 3 + 2] = dir.z * STAR_RADIUS;

      // 等級。pow で 0 側へ寄せると、暗い星が大多数で明るい星が希少になる
      const lum = dimmest + (1 - dimmest) * Math.pow(Math.random(), falloff);
      const dimmed = lum * extinction(dir.y);

      const t = Math.random();
      if (t < 0.62) {
        color.copy(COOL).lerp(WHITE, t / 0.62);
      } else {
        color.copy(WHITE).lerp(WARM, Math.pow((t - 0.62) / 0.38, 1.6));
      }
      // 暗い星ほど白へ寄せる。目の色覚は暗いところではほとんど働かないので、
      // 肉眼でもカメラでも、色がつくのは明るい星だけ。ここを一律にすると
      // 空じゅうに色の粒が散って紙吹雪のように見える
      color.lerp(NEUTRAL, 1 - saturation * (0.3 + 0.7 * lum));
      // 明るい星だけ 1 を越えさせる。芯が白く飽和して、周りにだけ色の
      // ついたハローが残る——肉眼で「大きい星」に見えるのはこの形
      const gain = dimmed * (1 + 0.18 * lum * lum);
      colors[i * 3] = color.r * gain;
      colors[i * 3 + 1] = color.g * gain;
      colors[i * 3 + 2] = color.b * gain;

      // 明るい星ほど大きく、ただし差は平方根で抑える
      sizes[i] = size * (0.62 + 1.5 * Math.sqrt(lum));

      phases[i] = Math.random() * Math.PI * 2;
      rates[i] = STARS.twinkleSpeed * (0.6 + Math.random() * 0.9);
      // 低いところほど大気の層を長く通るので瞬きが強い。
      // 明るい星は視直径のぶん平均されて瞬きにくい
      const low = 1 - THREE.MathUtils.smoothstep(dir.y, 0.05, 0.55);
      twinkles[i] = twinkle * (0.3 + 0.7 * (1 - lum)) * (0.35 + 0.65 * low);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aRate", new THREE.BufferAttribute(rates, 1));
    geometry.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkles, 1));
    // 球面いっぱいなので視錐台カリングは当たらない。毎フレームの計算だけ無駄
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(),
      STAR_RADIUS,
    );
    return geometry;
  }, []);
}

export function StarField({ animated }: { animated: boolean }) {
  const geometry = useStarGeometry();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      heightScale: { value: 1 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const material = materialRef.current;
    return material ? registerStarMaterial(material) : undefined;
  }, []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    if (animated) material.uniforms.time.value += delta;
    // 通常のパスでの倍率。鏡像を焼く間だけ Ocean が一時的に差し替える
    setStarHeightScale(state.gl.getPixelRatio());
  });

  return (
    <points geometry={geometry} renderOrder={2} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneFactor}
      />
    </points>
  );
}
