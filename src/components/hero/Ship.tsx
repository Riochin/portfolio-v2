"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLOUD_HAZE, SHIP } from "./sceneConfig";

const WHITE = new THREE.Color("#ffffff");

// この距離の船はシルエットでしかない。テクスチャを貼ると等倍で潰れてジャギる
// ので、Birds が翼を距離関数で描いているのと同じように、船体・船橋・煙突・
// マストを矩形の距離関数の和で組んで描く。どんな大きさでも縁が滑らかに出る。
//
// 航跡も同じ板の中で描く。水面に寝かせた板を別に置いても、水平線の近くでは
// 極端に前縮みして数 px にしかならないので、分けても得るものがない。
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// NOTE: 色空間もトーンマップも通していない。GradientSky が変換を通さずに
// リニア値をそのまま書いているので、霞に溶かした先を空の色と一致させるには
// こちらも同じ書き方でなければならない。include を足すと haze=1 にしても
// 空とは別の色になる。
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uWakeColor;
  uniform float uWake;
  uniform float uWakeAlpha;
  uniform float uDir;
  uniform float uWaterline;
  uniform float uScale;
  uniform float uSoft;
  varying vec2 vUv;

  float box(vec2 p, vec2 half_) {
    vec2 d = abs(p) - half_;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  void main() {
    // 進む向きが変わっても形は同じ。座標のほうを裏返す
    float ux = uDir > 0.0 ? vUv.x : 1.0 - vUv.x;
    // 船体長を 1 とした座標。船首が +0.5、船尾が -0.5、航跡はその後ろへ uWake ぶん
    float x = (ux - 0.5) * (1.0 + 2.0 * uWake);
    // 水線を 0 とした高さ。uScale を掛けて縦も船体長の単位に揃える
    // (揃えないと縁のぼかし幅が縦横で何倍も違ってしまう)
    float h = (vUv.y - uWaterline) / (1.0 - uWaterline);
    vec2 p = vec2(x, h * uScale);

    // 船体。上へ行くほど前へ寄せて、船首の反りと船尾の張り出しを出す
    float hull = box(vec2(p.x - p.y, p.y - 0.028), vec2(0.5, 0.028));
    // 船橋。貨物船は後ろ寄りに立つ
    float bridge = box(p - vec2(-0.30, 0.095), vec2(0.115, 0.045));
    float funnel = box(p - vec2(-0.30, 0.158), vec2(0.042, 0.022));
    float mast = box(p - vec2(0.20, 0.105), vec2(0.007, 0.055));
    float d = min(min(hull, bridge), min(funnel, mast));
    float ship = 1.0 - smoothstep(0.0, uSoft, d);

    // 航跡。船尾から離れるほど薄く、わずかに広がる
    float behind = (-0.5 - x) / uWake;
    float t = clamp(behind, 0.0, 1.0);
    float half_ = mix(0.004, 0.016, t);
    float wake =
      pow(1.0 - t, 1.6) *
      exp(-pow(p.y / half_, 2.0)) *
      smoothstep(-0.02, 0.02, behind) *
      uWakeAlpha;

    // 船体と航跡はそれぞれのアルファで重み付けして混ぜる。被覆率(ship)で
    // 色を混ぜると、航跡がそこに無くてもアンチエイリアスの縁に明るい航跡色が
    // 乗り、空より明るい白い縁になってしまう(小さい船ほど縁の割合が大きい
    // ので、縮めるほど白っぽく見える)
    float behindA = wake * (1.0 - ship);
    float a = clamp(ship + behindA, 0.0, 1.0);
    if (a <= 0.004) discard;
    gl_FragColor = vec4((uColor * ship + uWakeColor * behindA) / a, a);
  }
`;

/** [下限, 上限] のあいだから 1 つ引く */
function pick([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

/** 1 隻ぶんの航海。React の state には持たない(再レンダリングを起こさない) */
type Voyage = {
  /** 渡っている最中か。false のあいだは wait を減らして次の 1 隻を待つ */
  sailing: boolean;
  /** 次の出現までの残り秒。useFrame の delta で減らす */
  wait: number;
  /** 船体の中心の x */
  x: number;
  /** ここを越えたら渡り終わり */
  span: number;
  /** 進む向き。+1 が右へ */
  dir: number;
  speed: number;
};

/**
 * 水平線を渡っていく船。数分かけて渡るので、目で追うものではなく、戻って
 * きたら位置が変わっている類のものになる。
 *
 * 水線から下は海に隠れる——海面は不透明で深度を書くので、y<0 の断片は深度
 * テストで落ちる。航跡の下半分が消えるのはそのためで、意図どおり水線の上
 * だけが残る。
 */
export function Ship({ animated }: { animated: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color() },
      uWakeColor: { value: new THREE.Color() },
      uWake: { value: 2 },
      uWakeAlpha: { value: SHIP.wakeGain },
      uDir: { value: 1 },
      uWaterline: { value: SHIP.waterline },
      uScale: { value: (1 - SHIP.waterline) * SHIP.aspect },
      uSoft: { value: SHIP.soft },
    }),
    [],
  );

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const voyage = useRef<Voyage>({
    sailing: false,
    wait: pick(SHIP.firstGap),
    x: 0,
    span: 0,
    dir: 1,
    speed: 0,
  });

  // 色を混ぜるための置き場。毎フレームは触らないが、確保を繰り返さない
  const scratch = useMemo(
    () => ({ hull: new THREE.Color(), haze: new THREE.Color(CLOUD_HAZE) }),
    [],
  );

  useFrame((_, delta) => {
    const instance = mesh.current;
    const material = materialRef.current;
    if (!instance || !material) return;

    const v = voyage.current;
    // タブを戻したときに delta がどっと入って、船が飛ぶのを防ぐ
    const dt = Math.min(delta, 0.1);

    if (!v.sailing) {
      v.wait -= dt;
      if (v.wait > 0) {
        instance.visible = false;
        return;
      }

      // 1 隻ぶん引き直す。同じ船が同じ速さで何度も通ると、見るたびに
      // 「さっきと同じ」になってしまう
      const z = pick(SHIP.depth);
      const length = pick(SHIP.length);
      const wake = pick(SHIP.wake);
      v.dir = Math.random() < 0.5 ? 1 : -1;
      v.speed = pick(SHIP.speed);
      // 画角の外まで送る。奥ほど同じ方位に着くまでの x が長くなる
      v.span = Math.abs(z) * Math.tan(SHIP.span) + length;
      v.x = -v.dir * v.span;
      v.sailing = true;

      const height = length * SHIP.aspect;
      // 航跡ぶんは船首側にも余白として取る。板の中心が船体の中心のままなら、
      // 向きを裏返すときに位置を補正しなくて済む
      instance.scale.set(length * (1 + 2 * wake), height, 1);
      // 水線 (uv の waterline) がワールドの y=0 に乗るよう板を持ち上げる
      instance.position.set(v.x, (0.5 - SHIP.waterline) * height, z);

      const haze = pick(SHIP.haze);
      material.uniforms.uColor.value
        .copy(scratch.hull.set(SHIP.color))
        .lerp(scratch.haze, haze);
      // 航跡は霞の色から白へ寄せる。空より明るくないと波頭に見えない
      material.uniforms.uWakeColor.value
        .copy(scratch.haze)
        .lerp(WHITE, SHIP.wakeGain);
      material.uniforms.uWake.value = wake;
      material.uniforms.uDir.value = v.dir;
    }

    v.x += v.dir * v.speed * dt;
    if (Math.abs(v.x) > v.span) {
      v.sailing = false;
      v.wait = pick(SHIP.gap);
      instance.visible = false;
      return;
    }

    instance.position.x = v.x;
    instance.visible = true;
  });

  // 静止画キャプチャは animated=false で焼く。ここで出さないことで、水平線に
  // 貼り付いた船がポスターと Canvas で食い違うのを防ぐ (Birds と同じ)
  if (!animated) return null;

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      // 雲より先に描く。雲が手前を通れば船は隠れる
      renderOrder={-1}
      visible={false}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
