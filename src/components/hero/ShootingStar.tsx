"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SHOOTING_STAR, STAR_RADIUS } from "./sceneConfig";

// 星より少しだけ内側に置く。奥行きの前後は renderOrder で決めているので
// 見た目には効かないが、星と同じ球の上に乗っているほうが考えやすい
const RADIUS = STAR_RADIUS * 0.98;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// uv.x は 0 が尾、1 が頭。頭に光を集めて、尾へ向かって細く暗くする
const fragmentShader = /* glsl */ `
  uniform vec3 color;
  uniform float intensity;
  uniform float fade;
  varying vec2 vUv;

  void main() {
    float along = pow(vUv.x, 2.2);
    float across = (vUv.y - 0.5) * 2.0;
    float profile = exp(-across * across * 6.0);
    gl_FragColor = vec4(color * (along * profile * fade * intensity), 1.0);
  }
`;

/** 飛んでいる 1 本ぶんの状態。React の state には持たない(再レンダリングを起こさない) */
type Flight = {
  /** 飛んでいるか。false のあいだは wait を減らして次の出現を待つ */
  active: boolean;
  /** 次の出現までの残り秒。useFrame の delta で減らす */
  wait: number;
  /** 飛び始めてからの秒 */
  elapsed: number;
  /** 出発点の向き(単位ベクトル) */
  start: THREE.Vector3;
  /** 出発点における進行方向(start と直交する単位ベクトル) */
  tangent: THREE.Vector3;
  /** 横切る角度 */
  length: number;
};

const UP = new THREE.Vector3(0, 1, 0);

function interval() {
  const { minInterval, maxInterval } = SHOOTING_STAR;
  return minInterval + Math.random() * (maxInterval - minInterval);
}

/** 出発点と進行方向を引き直す */
function spawn(flight: Flight) {
  const {
    minElevation,
    maxElevation,
    minAzimuth,
    maxAzimuth,
    minTilt,
    maxTilt,
    minLength,
    maxLength,
  } = SHOOTING_STAR;

  // カメラは -z を向いている。azimuth は正が画面の右
  const azimuth = minAzimuth + Math.random() * (maxAzimuth - minAzimuth);
  const elevation =
    minElevation + Math.random() * (maxElevation - minElevation);
  const horizontal = Math.cos(elevation);
  flight.start.set(
    horizontal * Math.sin(azimuth),
    Math.sin(elevation),
    -horizontal * Math.cos(azimuth),
  );

  // 出発点の接平面に、画面の右(east)と上(north)を作る。
  // start × UP が画面の右で、UP × start だと左になるので向きに注意
  const east = new THREE.Vector3().crossVectors(flight.start, UP).normalize();
  const north = new THREE.Vector3().crossVectors(east, flight.start);
  // 真下(-north)を 0 として、右(+east)へ tilt だけ傾けて落とす。
  // 幅を持たせてあるので、毎回わずかに違う角度で落ちる
  const tilt = minTilt + Math.random() * (maxTilt - minTilt);
  flight.tangent
    .copy(north)
    .multiplyScalar(-Math.cos(tilt))
    .addScaledVector(east, Math.sin(tilt))
    .normalize();

  flight.length = minLength + Math.random() * (maxLength - minLength);
  flight.elapsed = 0;
  flight.active = true;
}

export function ShootingStar({ animated }: { animated: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(SHOOTING_STAR.color) },
      intensity: { value: SHOOTING_STAR.intensity },
      fade: { value: 0 },
    }),
    [],
  );

  const flight = useRef<Flight>({
    active: false,
    wait: interval(),
    elapsed: 0,
    start: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    length: 0,
  });

  // 毎フレーム 4 頂点を世界座標で書き直す。回転を組むより、頭と尾の位置から
  // 直接置くほうが短く済む(板は視線に正対させたいので、どのみち毎フレーム
  // カメラを見る必要がある)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // 毎フレームの計算用。使い回して確保を起こさない
  const scratch = useRef({
    head: new THREE.Vector3(),
    tail: new THREE.Vector3(),
    side: new THREE.Vector3(),
    axis: new THREE.Vector3(),
  });

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    // 静止画を焼くときは出さない。止まった光の筋がポスターに残ってしまう
    if (!animated) {
      mesh.visible = false;
      return;
    }

    const f = flight.current;

    if (!f.active) {
      f.wait -= delta;
      if (f.wait > 0) {
        mesh.visible = false;
        return;
      }
      spawn(f);
    }

    f.elapsed += delta;
    const t = f.elapsed / SHOOTING_STAR.duration;
    if (t >= 1) {
      f.active = false;
      f.wait = interval();
      mesh.visible = false;
      return;
    }

    // 大円に沿って進める。start と tangent は直交しているので、
    // この 2 つの線形結合がそのまま球面上の弧になる
    const { head, tail, side, axis } = scratch.current;
    const headAngle = f.length * t;
    const tailAngle = Math.max(0, headAngle - f.length * SHOOTING_STAR.tail);
    head
      .copy(f.start)
      .multiplyScalar(Math.cos(headAngle))
      .addScaledVector(f.tangent, Math.sin(headAngle))
      .multiplyScalar(RADIUS);
    tail
      .copy(f.start)
      .multiplyScalar(Math.cos(tailAngle))
      .addScaledVector(f.tangent, Math.sin(tailAngle))
      .multiplyScalar(RADIUS);

    // 視線に正対させる。カメラは原点のごく近くなので、頭の向きを視線とみなす
    axis.subVectors(head, tail).normalize();
    side.crossVectors(head, axis).normalize();
    const halfWidth = RADIUS * SHOOTING_STAR.width * 0.5;

    const position = mesh.geometry.attributes.position;
    const array = position.array as Float32Array;
    // PlaneGeometry の頂点は uv (0,1) (1,1) (0,0) (1,0) の順。
    // uv.x が 0 のほうを尾、1 のほうを頭に割り当てる
    const write = (i: number, base: THREE.Vector3, sign: number, w: number) => {
      array[i * 3] = base.x + side.x * sign * w;
      array[i * 3 + 1] = base.y + side.y * sign * w;
      array[i * 3 + 2] = base.z + side.z * sign * w;
    };
    // 尾は細くしぼる
    write(0, tail, 1, halfWidth * 0.25);
    write(1, head, 1, halfWidth);
    write(2, tail, -1, halfWidth * 0.25);
    write(3, head, -1, halfWidth);
    position.needsUpdate = true;

    // 出入りをなめらかに。いきなり点いて消えると瞬きに見える
    material.uniforms.fade.value =
      THREE.MathUtils.smoothstep(t, 0, 0.15) *
      (1 - THREE.MathUtils.smoothstep(t, 0.7, 1));
    mesh.visible = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      renderOrder={3}
      frustumCulled={false}
      visible={false}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        // 4 頂点を毎フレーム置き直すので、面の裏表は成り行きで決まる。
        // 片面だと向きによって裏面カリングで丸ごと消える
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneFactor}
      />
    </mesh>
  );
}
