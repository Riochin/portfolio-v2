"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { emitHeroEvent, inFrame } from "./heroEvents";
import { BIRDS } from "./sceneConfig";

// 遠くの鳥は数ピクセルにしかならない。テクスチャを貼ると等倍で潰れて
// ジャギるので、フラグメントで翼の線を引いて描く。距離関数を
// smoothstep で締めるぶん、どんな大きさでも縁が滑らかに出る。
const vertexShader = /* glsl */ `
  attribute float aSize;
  // x=羽ばたきの位相, y=速さ。個体ごとにずらして群れが揃わないようにする
  attribute vec2 aFlap;
  uniform float uTime;
  uniform vec2 uFlapAngle;
  varying vec2 vUv;
  varying float vAngle;

  void main() {
    vUv = uv * 2.0 - 1.0;

    // 打ち下ろしを速く、打ち上げをゆっくりにしたいので sin を尖らせる
    float s = sin(uTime * aFlap.y + aFlap.x);
    float k = 0.5 + 0.5 * sign(s) * pow(abs(s), 0.7);
    vAngle = mix(uFlapAngle.x, uFlapAngle.y, k);

    // ビルボード。インスタンスの中心だけビュー空間へ移して、
    // クアッドはそのまま画面平面に置く。CPU で毎フレーム回転を
    // 焼かなくていいぶん、群れが増えても効いてこない
    vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += position.xy * aSize;
    gl_Position = projectionMatrix * center;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uThickness;
  varying vec2 vUv;
  varying float vAngle;

  void main() {
    // 左右対称なので片翼だけ考える
    vec2 p = vec2(abs(vUv.x), vUv.y);
    vec2 dir = vec2(cos(vAngle), sin(vAngle));
    float t = clamp(dot(p, dir), 0.0, 0.95);
    float d = length(p - dir * t);

    // 翼端ほど細く。均一な太さだと棒が折れているようにしか見えない
    float w = uThickness * (1.0 - 0.55 * t);
    float a = 1.0 - smoothstep(w * 0.5, w * 1.5, d);
    if (a <= 0.004) discard;

    gl_FragColor = vec4(uColor, a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// 決定的な擬似乱数。毎回同じ順で群れが出るほうが、見え方を詰めるときに追える
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** いま飛んでいる群れ。飛んでいない間は count=0 にして描画から外す */
type Flock = {
  flying: boolean;
  /** 次の群れが出るまでの残り秒。flying の間は使わない */
  wait: number;
  /** 枠に入ったことをもう知らせたか。1 群れにつき 1 回だけ流す */
  told: boolean;
  /** 端の位置(|x|)。奥行きから起こす。ここを越えたら渡り終わり */
  span: number;
  /** 飛び始めた x。濃さの立ち上がりをここから測る */
  from: number;
  count: number;
  x: number;
  y: number;
  z: number;
  speed: number;
};

export function Birds({ animated }: { animated: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  // ジオメトリへ渡す初期バッファ。以降の書き換えは
  // instance.geometry.attributes 側を直に触る
  const sizes = useMemo(() => new Float32Array(BIRDS.limit), []);
  const flaps = useMemo(() => new Float32Array(BIRDS.limit * 2), []);
  // 描画に要らない可変の状態は ref に置く。useMemo に置いてフレームループから
  // 書き換えると React Compiler に止められる
  const state = useRef({
    random: rng(BIRDS.seed),
    matrix: new THREE.Matrix4(),
    /** 群れの中の相対位置。描画には要らないのでここに置く */
    offsets: new Float32Array(BIRDS.limit * 3),
    /** 上下のゆれ。x=振幅, y=速さ, z=位相 */
    bobs: new Float32Array(BIRDS.limit * 3),
    flock: {
      flying: false,
      // 待ちは「枠に入るまで」で書いてあるので、枠の手前の助走ぶんを引く
      wait: BIRDS.firstGap - BIRDS.lead,
      told: false,
      span: 0,
      from: 0,
      count: 0,
      x: 0,
      y: 0,
      z: 0,
      speed: 0,
    } as Flock,
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(BIRDS.color) },
      uOpacity: { value: BIRDS.opacity },
      uThickness: { value: BIRDS.thickness },
      uFlapAngle: { value: new THREE.Vector2(...BIRDS.flapAngle) },
    }),
    [],
  );

  useFrame((frame, delta) => {
    const instance = mesh.current;
    if (!instance) return;
    const { random, matrix, flock, offsets, bobs } = state.current;
    const aSize = instance.geometry.attributes.aSize;
    const aFlap = instance.geometry.attributes.aFlap;

    // タブを戻したときに delta がどっと入って、群れが一瞬で通り過ぎるのを防ぐ
    const dt = Math.min(delta, 0.1);
    const time = frame.clock.elapsedTime;
    (instance.material as THREE.ShaderMaterial).uniforms.uTime.value = time;

    const between = (range: readonly [number, number]) =>
      range[0] + (range[1] - range[0]) * random();

    if (!flock.flying) {
      flock.wait -= dt;
      if (flock.wait > 0) {
        instance.count = 0;
        return;
      }

      // 群れを組み直す。先頭を頂点に、後ろへ左右交互に広がる雁行
      flock.count = Math.round(between(BIRDS.flock));
      flock.y = between(BIRDS.altitude);
      flock.z = between(BIRDS.depth);
      flock.speed = between(BIRDS.speed);
      flock.span = Math.abs(flock.z) * Math.tan(BIRDS.span);
      flock.flying = true;
      flock.told = false;

      // 枠の左の縁を、カメラで見て探す。方位から解くと画枠 (16:9 と 4:3)
      // と基準の yaw、それに見回している角度まで式に入ってくるので、
      // 実際に投影して探すほうが短く、どの画枠でも同じだけ確かになる。
      // 縁が見つかったら lead 秒ぶん手前へ戻し、そこから飛ばせてやる。
      // これで gap / firstGap が「次に鳥が見えるまで」の秒数として素直に
      // 効く——端からいきなり飛ばすと、画角の外を十数秒飛んでから見え
      // 始めることになり、firstGap = 8 が台本の 0:08 と噛み合わない
      const step = flock.span / 128;
      flock.x = -flock.span;
      while (flock.x < flock.span && !inFrame(flock, frame.camera)) {
        flock.x += step;
      }
      flock.x -= BIRDS.lead * flock.speed;
      flock.from = flock.x;

      for (let i = 0; i < flock.count; i++) {
        const gap = BIRDS.spacing * (0.75 + 0.5 * random());
        // 真横から見るので、隊列は「後ろへ伸びるゆるい斜めの列」にする。
        // V 字に開いたり奥行きへばらけさせたりすると、横切るのではなく
        // 遠ざかっていくように見えてしまう
        offsets[i * 3] = -i * gap;
        offsets[i * 3 + 1] =
          -i * gap * BIRDS.trail + (random() - 0.5) * BIRDS.spacing * 0.7;
        offsets[i * 3 + 2] = (random() - 0.5) * BIRDS.spacing * 0.6;

        aSize.setX(i, between(BIRDS.size));
        aFlap.setXY(i, random() * Math.PI * 2, between(BIRDS.flapSpeed));

        bobs[i * 3] = BIRDS.bob * (0.5 + random());
        bobs[i * 3 + 1] = 0.5 + random();
        bobs[i * 3 + 2] = random() * Math.PI * 2;
      }
      aSize.needsUpdate = true;
      aFlap.needsUpdate = true;
    }

    // 進む向きは左から右で固定。方向が毎回変わると、目に留まるたびに
    // 別のものが起きているように見えて落ち着かない
    flock.x += flock.speed * dt;
    if (flock.x > flock.span) {
      flock.flying = false;
      flock.wait = between(BIRDS.gap) - BIRDS.lead;
      instance.count = 0;
      return;
    }

    for (let i = 0; i < flock.count; i++) {
      matrix.makeTranslation(
        flock.x + offsets[i * 3],
        flock.y +
          offsets[i * 3 + 1] +
          bobs[i * 3] * Math.sin(time * bobs[i * 3 + 1] + bobs[i * 3 + 2]),
        flock.z + offsets[i * 3 + 2],
      );
      instance.setMatrixAt(i, matrix);
    }
    instance.count = flock.count;
    instance.instanceMatrix.needsUpdate = true;

    // 出入りの濃さ。置くのも消すのも枠の外だが、目いっぱい左右を覗くと
    // そこまで見えてしまうので、湧いて出たようにも消灯したようにも見せない。
    // 助走 (lead) のほうが長いので、枠に入るころには濃さは出切っている
    const flown = (flock.x - flock.from) / flock.speed;
    const left = (flock.span - flock.x) / flock.speed;
    (instance.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
      BIRDS.opacity *
      Math.min(
        THREE.MathUtils.smoothstep(flown, 0, BIRDS.fade),
        THREE.MathUtils.smoothstep(left, 0, BIRDS.fade),
      );

    // 外へ知らせるのは先頭が枠に入ってから (heroEvents の inFrame 参照)。
    // 助走のぶんは待ちから引いてあるので、ここへ来る時刻がそのまま
    // gap / firstGap になる
    if (!flock.told && inFrame(flock, frame.camera)) {
      flock.told = true;
      emitHeroEvent({ type: "bird", flock: flock.count });
    }
  });

  // 静止画キャプチャは animated=false で焼く。ここで出さないことで、
  // 空中で固まった鳥がポスターに写り込むのを防ぐ
  if (!animated) return null;

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, BIRDS.limit]}
      // インスタンスの位置は毎フレーム動く。素のバウンディングでは
      // 消えてしまうので、カリングは任せない
      frustumCulled={false}
      renderOrder={2}
    >
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aFlap"
          args={[flaps, 2]}
        />
      </planeGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
}
