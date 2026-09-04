"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { emitHeroEvent } from "./heroEvents";
import { FISHING_LIGHTS } from "./sceneConfig";

// 灯りは点(gl_Points)ではなく板で描く。gl_PointSize はピクセル単位で効くので、
// 水面の鏡像を焼く小さなバッファ(block では 128〜256 px)ではそこだけ何倍にも
// 膨らんでしまう。星は starPass.ts で倍率を差し替えて凌いでいるが、板なら
// 投影がそのまま効くので、この仕掛けを増やさずに済む。
//
// ビルボードは Birds と同じやり方。インスタンスの中心だけビュー空間へ移して、
// クアッドは画面平面に置く。視線を振っても灯りは正面を向いたままになる。
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aRate;

  uniform float uTime;
  uniform float uSway;

  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    vUv = uv * 2.0 - 1.0;

    // ゆらぎ。星の瞬き(StarField)と同じで、整数比にならない 2 つの sin の和に
    // して拍が揃わないようにする。ただし速さも振れ幅も星よりずっと控えめ——
    // 漁火が揺れるのは大気ではなく波と船なので、瞬きではなく息づきに見せる
    float wave = 0.62 * sin(uTime * aRate + aPhase)
               + 0.38 * sin(uTime * aRate * 1.618 + aPhase * 2.7);
    vColor = aColor * (1.0 + uSway * wave);

    vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += position.xy * aSize;
    gl_Position = projectionMatrix * center;
  }
`;

// 芯とハローの 2 枚重ね。StarField と同じ式にしてあるので、星と同じ滲み方で
// 光る。色だけが暖色なので、空の粒とは別のものに見える
const fragmentShader = /* glsl */ `
  uniform float uFade;
  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    float d = length(vUv);
    if (d > 1.0) discard;
    float core = exp(-d * d * 8.0);
    float halo = exp(-d * d * 1.6) * 0.42;
    gl_FragColor = vec4(vColor * ((core + halo) * uFade), 1.0);
  }
`;

/** [下限, 上限] のあいだから 1 つ引く */
function pick([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

/** いま灯っている船団。灯っていない間は count=0 にして描画から外す */
type Fleet = {
  lit: boolean;
  /** 次の船団までの残り秒。lit の間は使わない */
  wait: number;
  /** 灯ってからの秒 */
  elapsed: number;
  /** 消えるまでの秒 */
  life: number;
  count: number;
  /** 流れる速さ(符号つき) */
  drift: number;
};

/**
 * 漁火。水平線のすぐ上に灯る船団で、昼の Ship と対になる。
 *
 * 灯ってから消えるまで数分あり、そのあいだほとんど動かない。夜の空でいちばん
 * 静かな出来事で、流れ星の派手さの隣に置くとちょうど釣り合う。
 */
export function FishingLights({ animated }: { animated: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const drift = useRef<THREE.Group>(null);

  // ジオメトリへ渡す初期バッファ。以降の書き換えは attributes 側を直に触る
  const sizes = useMemo(() => new Float32Array(FISHING_LIGHTS.limit), []);
  const colors = useMemo(() => new Float32Array(FISHING_LIGHTS.limit * 3), []);
  const phases = useMemo(() => new Float32Array(FISHING_LIGHTS.limit), []);
  const rates = useMemo(() => new Float32Array(FISHING_LIGHTS.limit), []);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSway: { value: FISHING_LIGHTS.sway },
      uFade: { value: 0 },
    }),
    [],
  );

  // 描画に要らない可変の状態は ref に置く。useMemo に置いてフレームループから
  // 書き換えると React Compiler に止められる
  const state = useRef({
    matrix: new THREE.Matrix4(),
    warm: [
      new THREE.Color(FISHING_LIGHTS.warm[0]),
      new THREE.Color(FISHING_LIGHTS.warm[1]),
    ],
    color: new THREE.Color(),
    fleet: {
      lit: false,
      wait: pick(FISHING_LIGHTS.firstGap),
      elapsed: 0,
      life: 0,
      count: 0,
      drift: 0,
    } as Fleet,
  });

  useFrame((frame, delta) => {
    const instance = mesh.current;
    const group = drift.current;
    const material = materialRef.current;
    if (!instance || !group || !material) return;

    const { matrix, warm, color, fleet } = state.current;
    const dt = Math.min(delta, 0.1);
    material.uniforms.uTime.value = frame.clock.elapsedTime;

    if (!fleet.lit) {
      fleet.wait -= dt;
      if (fleet.wait > 0) {
        instance.count = 0;
        return;
      }

      // 船団を組み直す。1 つの方位のまわりに集めるのは、漁船が漁場へ
      // 集まるため。空じゅうにばらまくと、水平線に星が落ちたようにしか
      // 見えない
      const azimuth = pick(FISHING_LIGHTS.azimuth);
      const depth = pick(FISHING_LIGHTS.depth);
      const center = Math.abs(depth) * Math.tan(azimuth);
      const spread = pick(FISHING_LIGHTS.spread);

      fleet.count = Math.round(pick(FISHING_LIGHTS.count));
      fleet.life = pick(FISHING_LIGHTS.stay);
      fleet.elapsed = 0;
      fleet.drift =
        pick(FISHING_LIGHTS.drift) * (Math.random() < 0.5 ? 1 : -1);
      fleet.lit = true;
      group.position.x = 0;

      const aSize = instance.geometry.attributes.aSize;
      const aColor = instance.geometry.attributes.aColor;
      const aPhase = instance.geometry.attributes.aPhase;
      const aRate = instance.geometry.attributes.aRate;

      for (let i = 0; i < fleet.count; i++) {
        matrix.makeTranslation(
          center + (Math.random() - 0.5) * 2 * spread,
          pick(FISHING_LIGHTS.altitude),
          // 奥行きもばらす。同じ z に並ぶと灯りが一直線に揃ってしまう
          depth + (Math.random() - 0.5) * spread,
        );
        instance.setMatrixAt(i, matrix);

        aSize.setX(i, pick(FISHING_LIGHTS.size));
        color
          .copy(warm[0])
          .lerp(warm[1], Math.random())
          .multiplyScalar(pick(FISHING_LIGHTS.intensity));
        aColor.setXYZ(i, color.r, color.g, color.b);
        aPhase.setX(i, Math.random() * Math.PI * 2);
        aRate.setX(i, pick(FISHING_LIGHTS.swaySpeed));
      }

      aSize.needsUpdate = true;
      aColor.needsUpdate = true;
      aPhase.needsUpdate = true;
      aRate.needsUpdate = true;
      instance.instanceMatrix.needsUpdate = true;

      // 灯った瞬間をそのまま出来事にする。船団の方位 (azimuth) はどちらの
      // 画枠でも枠の中に収まる範囲から引いているので、鳥や船のように
      // 「枠に入るのを待つ」必要がない
      emitHeroEvent({ type: "fishingLights" });
    }

    fleet.elapsed += dt;
    if (fleet.elapsed >= fleet.life) {
      fleet.lit = false;
      fleet.wait = pick(FISHING_LIGHTS.gap);
      instance.count = 0;
      return;
    }

    // 点いて消えるところを長く取る。ふっと現れると「点いた」ではなく
    // 「湧いた」に見えてしまう
    const fade = FISHING_LIGHTS.fade;
    material.uniforms.uFade.value =
      THREE.MathUtils.smoothstep(fleet.elapsed, 0, fade) *
      (1 - THREE.MathUtils.smoothstep(fleet.elapsed, fleet.life - fade, fleet.life));

    group.position.x += fleet.drift * dt;
    instance.count = fleet.count;
  });

  // 静止画キャプチャでは出さない。ポスターに焼くと夜の空に動かないものが
  // 増え、Canvas と差し替えた瞬間の食い違いも生まれる (Birds と同じ)
  if (!animated) return null;

  return (
    <group ref={drift}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, FISHING_LIGHTS.limit]}
        // インスタンスの位置は船団ごとに置き直す。素のバウンディングでは
        // 消えてしまうので、カリングは任せない
        frustumCulled={false}
        renderOrder={2}
      >
        <planeGeometry args={[1, 1]}>
          <instancedBufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <instancedBufferAttribute
            attach="attributes-aColor"
            args={[colors, 3]}
          />
          <instancedBufferAttribute
            attach="attributes-aPhase"
            args={[phases, 1]}
          />
          <instancedBufferAttribute attach="attributes-aRate" args={[rates, 1]} />
        </planeGeometry>
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
      </instancedMesh>
    </group>
  );
}
