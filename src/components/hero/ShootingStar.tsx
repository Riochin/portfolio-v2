"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { emitHeroEvent } from "./heroEvents";
import {
  SHOOTING_STAR,
  STAR_RADIUS,
  type ShootingStarCadence,
} from "./sceneConfig";

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
  /** この 1 本の明るさ。並と大物で大きく変わる */
  intensity: number;
};

const UP = new THREE.Vector3(0, 1, 0);

/** [下限, 上限] のあいだから 1 つ引く */
function pick([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

function interval(cadence: ShootingStarCadence) {
  // 間隔は用途ごとに決まるが、続けざまに 2 本出ないよう下限で押さえる
  return Math.max(SHOOTING_STAR.minInterval, pick(cadence.interval));
}

/** 出発点と進行方向、それにこの 1 本の顔つきを引き直す */
function spawn(flight: Flight) {
  const {
    azimuth: azimuthRange,
    elevationAtLeft,
    elevationAtRight,
    tilt,
    rareChance,
    rare,
    common,
  } = SHOOTING_STAR;

  // カメラは -z を向いている。azimuth は正が画面の右
  const azimuth = pick(azimuthRange);
  // 天の川は右上がりに空を横切る。出発点の高さも方位に合わせて上げていけば、
  // 左右へばらしても帯のあたりから離れない
  const across =
    (azimuth - azimuthRange[0]) / (azimuthRange[1] - azimuthRange[0]);
  const elevation = pick([
    THREE.MathUtils.lerp(elevationAtLeft[0], elevationAtRight[0], across),
    THREE.MathUtils.lerp(elevationAtLeft[1], elevationAtRight[1], across),
  ]);
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
  // 真下(-north)を 0 として、出てきた側へ傾けて落とす。右から出れば右下、
  // 左から出れば左下。幅を持たせてあるので、毎回わずかに違う角度で落ちる
  const lean = pick(tilt) * (azimuth < 0 ? -1 : 1);
  flight.tangent
    .copy(north)
    .multiplyScalar(-Math.cos(lean))
    .addScaledVector(east, Math.sin(lean))
    .normalize();

  // 並と大物。毎回同じ明るさ・同じ長さで出るのが一番の既視感なので、
  // ここは組で引く。長さだけ伸ばしても、細い光が長く伸びるだけになる
  const grade = Math.random() < rareChance ? rare : common;
  flight.length = pick(grade.length);
  flight.intensity = pick(grade.intensity);
  flight.elapsed = 0;
  flight.active = true;
}

/** 板 1 枚ぶん。飛んでいない間は自分の間隔を数えて次の 1 本を待つ */
function Streak({
  animated,
  cadence,
  fallingRef,
  firstGap,
}: {
  animated: boolean;
  cadence: ShootingStarCadence;
  /** 今この瞬間に降っている本数。板どうしで共有して数える */
  fallingRef: RefObject<number>;
  /** この板の 1 本目までの秒数。省略すると間隔から引く */
  firstGap?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(SHOOTING_STAR.color) },
      // 1 本ごとに引き直すので、ここは飛び始めるまでの置き
      intensity: { value: 1 },
      fade: { value: 0 },
    }),
    [],
  );

  const flight = useRef<Flight>({
    active: false,
    wait: firstGap ?? interval(cadence),
    elapsed: 0,
    start: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    length: 0,
    intensity: 1,
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

    const f = flight.current;

    // 静止画を焼くときは出さない。止まった光の筋がポスターに残ってしまう
    if (!animated) {
      mesh.visible = false;
      // 降っている途中で切り替わったら、同時本数の数えも戻しておく。
      // 置いたままにすると、以降ずっと 1 本多く数えることになる
      if (f.active) {
        f.active = false;
        f.wait = interval(cadence);
        fallingRef.current -= 1;
      }
      return;
    }

    if (!f.active) {
      f.wait -= delta;
      if (f.wait > 0) {
        mesh.visible = false;
        return;
      }
      spawn(f);
      material.uniforms.intensity.value = f.intensity;
      // 出るのは一瞬で、しかも方位は枠の内側から引いている。鳥や船と違って
      // 「枠に入るのを待つ」必要がないので、降り始めをそのまま出来事にする
      fallingRef.current += 1;
      emitHeroEvent({ type: "shootingStar", concurrent: fallingRef.current });
    }

    f.elapsed += delta;
    const t = f.elapsed / SHOOTING_STAR.duration;
    if (t >= 1) {
      f.active = false;
      f.wait = interval(cadence);
      fallingRef.current -= 1;
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

/**
 * 流れ星。板を SHOOTING_STAR.count 枚ぶん並べ、それぞれが自分の間隔で待つ。
 * 1 本が飛んでいる間ももう 1 本は数え続けているので、間隔を縮めずに出会う
 * 回数だけが増える。
 */
export function ShootingStar({
  animated,
  cadence,
}: {
  animated: boolean;
  /** 1 枚ぶんの出現の間隔。ブロック常設と全画面で変える */
  cadence: ShootingStarCadence;
}) {
  // 今この瞬間に降っている本数。板どうしで 1 つを数える (2 本同時には
  // 専用の反応があるので、降り始めた 1 本にこの数を添えて外へ流す)
  const fallingRef = useRef(0);

  return (
    <>
      {Array.from({ length: SHOOTING_STAR.count }, (_, index) => (
        <Streak
          key={index}
          animated={animated}
          cadence={cadence}
          fallingRef={fallingRef}
          // 1 本目の時刻を決め打つのは 1 枚目だけ。残りは既定の間隔のまま
          // 待たせるので、2 本目以降の出方は変わらない
          firstGap={index === 0 ? cadence.firstGap : undefined}
        />
      ))}
    </>
  );
}
