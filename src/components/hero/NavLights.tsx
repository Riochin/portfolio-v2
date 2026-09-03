"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NAV_LIGHTS } from "./sceneConfig";

/** 灯りの並び。0=左舷(赤), 1=右舷(緑), 2=ストロボ(白) */
const PORT = 0;
const STARBOARD = 1;
const STROBE = 2;
const LIGHTS = 3;

const UP = new THREE.Vector3(0, 1, 0);

// 漁火と同じビルボードのグロー。違うのは aRole で、ストロボの 1 枚だけが
// uStrobe に従って点滅する。毎フレーム変わるのは uniform 1 つだけで済む
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aRole;

  uniform float uStrobe;
  uniform float uFade;

  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    vUv = uv * 2.0 - 1.0;
    // 航行灯は点きっぱなし、ストロボは閃光の瞬間だけ強く光る
    float gain = aRole > 0.5 ? uStrobe : 1.0;
    vColor = aColor * (gain * uFade);

    vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += position.xy * aSize;
    gl_Position = projectionMatrix * center;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    float d = length(vUv);
    if (d > 1.0) discard;
    float core = exp(-d * d * 8.0);
    float halo = exp(-d * d * 1.6) * 0.42;
    gl_FragColor = vec4(vColor * (core + halo), 1.0);
  }
`;

/** [下限, 上限] のあいだから 1 つ引く */
function pick([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

/** 1 機ぶんの航跡。React の state には持たない(再レンダリングを起こさない) */
type Flight = {
  flying: boolean;
  /** 次の 1 機までの残り秒 */
  wait: number;
  /** 飛び始めてからの秒 */
  elapsed: number;
  duration: number;
};

/**
 * 航行灯。赤(左舷)・緑(右舷)と白のストロボが、ゆっくり空を渡っていく。
 *
 * 流れ星が一瞬の出来事なのに対して、こちらは 1 分以上かけて渡る持続で、昼の
 * Contrail と対になる。鳥の 1/5 ほどの角速度しかないので、目の端で光り続けても
 * 気が散らない。
 */
export function NavLights({ animated }: { animated: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const sizes = useMemo(
    () => new Float32Array(LIGHTS).fill(NAV_LIGHTS.size),
    [],
  );
  const roles = useMemo(
    () => Float32Array.from([0, 0, 1]),
    [],
  );
  const colors = useMemo(() => {
    const array = new Float32Array(LIGHTS * 3);
    const color = new THREE.Color();
    const write = (index: number, hex: string, gain: number) => {
      color.set(hex).multiplyScalar(gain);
      array[index * 3] = color.r;
      array[index * 3 + 1] = color.g;
      array[index * 3 + 2] = color.b;
    };
    write(PORT, NAV_LIGHTS.port, NAV_LIGHTS.intensity);
    write(STARBOARD, NAV_LIGHTS.starboard, NAV_LIGHTS.intensity);
    // ストロボは閃光の瞬間だけ出るので、そのぶん強く積んでおく
    write(STROBE, NAV_LIGHTS.strobe, NAV_LIGHTS.intensity * NAV_LIGHTS.strobeGain);
    return array;
  }, []);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({ uStrobe: { value: 0 }, uFade: { value: 0 } }),
    [],
  );

  const state = useRef({
    matrix: new THREE.Matrix4(),
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
    /** 右舷の向き。翼端を左右へ振り分けるのに使う */
    starboard: new THREE.Vector3(),
    position: new THREE.Vector3(),
    offset: new THREE.Vector3(),
    flight: {
      flying: false,
      wait: pick(NAV_LIGHTS.firstGap),
      elapsed: 0,
      duration: 0,
    } as Flight,
  });

  useFrame((_, delta) => {
    const instance = mesh.current;
    const material = materialRef.current;
    if (!instance || !material) return;

    const s = state.current;
    const f = s.flight;
    const dt = Math.min(delta, 0.1);

    if (!f.flying) {
      f.wait -= dt;
      if (f.wait > 0) {
        instance.count = 0;
        return;
      }

      // 1 機ぶん引き直す。両端の方位も奥行きも毎回引くので、出てくる場所も
      // 消える場所も、空を横切る線の傾きも 1 機ごとに変わる。
      //
      // 奥行きを両端で変えるのは見た目のためだけではない——真横に渡らせると
      // 機体を翼端の方向から見ることになり、左右の灯が画面上で重なって赤と緑
      // が分離しない。手前から奥か、奥から手前かも引く。
      const dir = Math.random() < 0.5 ? 1 : -1;
      const away = Math.random() < 0.5 ? 1 : -1;
      const altitude = pick(NAV_LIGHTS.altitude);
      const spread = pick(NAV_LIGHTS.depthSpread);
      const middle = pick([
        NAV_LIGHTS.depth[0] + spread / 2,
        NAV_LIGHTS.depth[1] - spread / 2,
      ]);
      const z0 = middle - (away * spread) / 2;
      const z1 = middle + (away * spread) / 2;
      // 方位から x を起こす。奥ほど、同じ方位でも x は大きくなる
      s.start.set(
        -dir * Math.abs(z0) * Math.tan(pick(NAV_LIGHTS.azimuth)),
        altitude,
        z0,
      );
      s.end.set(
        dir * Math.abs(z1) * Math.tan(pick(NAV_LIGHTS.azimuth)),
        altitude + pick(NAV_LIGHTS.climb),
        z1,
      );
      // 右舷 = 進行方向 × 上。進む向きが変われば赤と緑も入れ替わる
      s.starboard
        .subVectors(s.end, s.start)
        .normalize()
        .cross(UP)
        .normalize()
        .multiplyScalar(NAV_LIGHTS.wing * 0.5);

      f.duration = pick(NAV_LIGHTS.duration);
      f.elapsed = 0;
      f.flying = true;
    }

    f.elapsed += dt;
    const t = f.elapsed / f.duration;
    if (t >= 1) {
      f.flying = false;
      f.wait = pick(NAV_LIGHTS.gap);
      instance.count = 0;
      return;
    }

    const { matrix, position, offset, starboard } = s;
    position.lerpVectors(s.start, s.end, t);

    offset.copy(position).sub(starboard);
    matrix.makeTranslation(offset.x, offset.y, offset.z);
    instance.setMatrixAt(PORT, matrix);

    offset.copy(position).add(starboard);
    matrix.makeTranslation(offset.x, offset.y, offset.z);
    instance.setMatrixAt(STARBOARD, matrix);

    matrix.makeTranslation(position.x, position.y, position.z);
    instance.setMatrixAt(STROBE, matrix);

    instance.instanceMatrix.needsUpdate = true;
    instance.count = LIGHTS;

    // ストロボ。cycle 秒ごとに flash 秒の閃光を gap 秒あけて 2 発。
    // この二連が「飛行機だ」と一目で分かる正体なので、1 発には削らない
    const { strobeCycle, strobeFlash, strobeGap } = NAV_LIGHTS;
    const phase = f.elapsed % strobeCycle;
    const second = strobeFlash + strobeGap;
    material.uniforms.uStrobe.value =
      phase < strobeFlash || (phase >= second && phase < second + strobeFlash)
        ? 1
        : 0;

    // 枠の外で点いて外で消えるが、出入りだけはなめらかにしておく
    material.uniforms.uFade.value =
      THREE.MathUtils.smoothstep(t, 0, 0.06) *
      (1 - THREE.MathUtils.smoothstep(t, 0.94, 1));
  });

  // 静止画キャプチャでは出さない (Birds と同じ)
  if (!animated) return null;

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, LIGHTS]}
      // インスタンスの位置は毎フレーム動く。カリングは任せない
      frustumCulled={false}
      renderOrder={2}
    >
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <instancedBufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <instancedBufferAttribute attach="attributes-aRole" args={[roles, 1]} />
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
  );
}
