"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { emitHeroEvent, inFrame } from "./heroEvents";
import { CONTRAIL } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 板 1 枚に経路全体を持たせ、筋の形は「その場所が引かれてから何秒経ったか」
// だけで決める。引きたては細く濃く、時間が経つほど広がって薄れる——これは
// 実際の飛行機雲がそうなる理由(拡散)そのままなので、係数を 2 つ置くだけで
// 先端から後ろへ向かう自然な勾配が出る。頂点を動かして線を伸ばす必要もない。
//
// NOTE: 色空間もトーンマップも通していない。GradientSky が変換を通さずリニア値
// をそのまま書いているので、空の上に重ねるにはこちらも同じ書き方に揃える。
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgress;
  uniform float uExtra;
  uniform float uDraw;
  uniform float uDir;
  uniform float uW0;
  uniform float uW1;
  uniform float uSpread;
  uniform float uDecay;
  uniform float uFresh;
  uniform float uOpacity;
  uniform float uFade;
  uniform float uWaver;
  uniform float uHead;
  uniform float uHeadLength;
  varying vec2 vUv;

  float hash1(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
  }

  // 1 次元の値ノイズ。うねりを出すだけなので 1 オクターブで足りる
  float noise1(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash1(i), hash1(i + 1.0), f);
  }

  void main() {
    // 進む向きが変わっても形は同じ。座標のほうを裏返す
    float u = uDir > 0.0 ? vUv.x : 1.0 - vUv.x;
    // まだ機体が通っていない先は空のまま
    if (u > uProgress) discard;

    // ここが引かれてからの秒数。uExtra は引き終わったあとの経過ぶんで、
    // これを足しておくと引き終わった線もそのまま広がり続ける
    float age = (uProgress - u) * uDraw + uExtra;

    float wob = (noise1(u * 9.0) - 0.5) * uWaver;
    float wobble = 1.0 + (noise1(u * 17.0 + 5.0) - 0.5) * uWaver;
    float w = mix(uW0, uW1, 1.0 - exp(-age / uSpread)) * wobble;
    float across = (vUv.y - 0.5) + wob * uW1;
    float prof = exp(-across * across / (w * w));

    // 濃さは時間とともに落ちる。引きたての数秒だけは、まだ濃い芯が残る
    float a = uOpacity * exp(-age / uDecay) *
              (1.0 + 0.8 * exp(-age / uFresh)) * prof;

    // 先端の機影。線が「何かに引かれている」ことの説明になる
    float ahead = (uProgress - u) / uHeadLength;
    float head = uHead * exp(-ahead * ahead) *
                 exp(-across * across / (uW0 * uW0 * 2.0));

    a = clamp((a + head) * uFade, 0.0, 1.0);
    if (a <= 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

/** [下限, 上限] のあいだから 1 つ引く */
function pick([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

/** 1 本ぶんの状態。React の state には持たない(再レンダリングを起こさない) */
type Trail = {
  /** wait=まだ出ていない, draw=引いている最中, linger=引き終わって消えていく */
  phase: "wait" | "draw" | "linger";
  /** 次の 1 本までの残り秒 */
  wait: number;
  /** いまの phase に入ってからの秒 */
  elapsed: number;
  draw: number;
  linger: number;
  /** 機影が枠に入ったことをもう知らせたか。1 本につき 1 回だけ流す */
  told: boolean;
};

/**
 * 飛行機雲。引かれて、滲んで、消える。
 *
 * この空でいちばん寿命の長い出来事で、引き終わってからも数分は残る。見どころは
 * 機体ではなく線が残ることのほうで、少し目を離して戻ってきた人にだけ、さっきと
 * 違う空が見える。
 */
export function Contrail({ animated }: { animated: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(CONTRAIL.color) },
      uProgress: { value: 0 },
      uExtra: { value: 0 },
      uDraw: { value: CONTRAIL.draw[0] },
      uDir: { value: 1 },
      // 幅は板の高さに対する比で持つ。ガウスの裾が 1/e になる半幅なので、
      // 見た目の太さになるよう半分にしてから渡す
      uW0: { value: CONTRAIL.width[0] / CONTRAIL.height / 2 },
      uW1: { value: CONTRAIL.width[1] / CONTRAIL.height / 2 },
      uSpread: { value: CONTRAIL.spread },
      uDecay: { value: CONTRAIL.decay },
      uFresh: { value: CONTRAIL.fresh },
      uOpacity: { value: CONTRAIL.opacity },
      uFade: { value: 0 },
      uWaver: { value: CONTRAIL.waver },
      uHead: { value: CONTRAIL.head },
      uHeadLength: { value: CONTRAIL.headLength },
    }),
    [],
  );

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const trail = useRef<Trail>({
    phase: "wait",
    wait: pick(CONTRAIL.firstGap),
    elapsed: 0,
    draw: 0,
    linger: 0,
    told: false,
  });

  // 機影の位置を割り出すための置き場。使い回して確保を起こさない
  const head = useRef(new THREE.Vector3());

  useFrame((frame, delta) => {
    const instance = mesh.current;
    const material = materialRef.current;
    if (!instance || !material) return;

    const t = trail.current;
    const dt = Math.min(delta, 0.1);

    if (t.phase === "wait") {
      t.wait -= dt;
      if (t.wait > 0) {
        instance.visible = false;
        return;
      }

      // 1 本ぶん引き直す。高さも傾きも向きも変えて、同じ線を二度見せない
      t.draw = pick(CONTRAIL.draw);
      t.linger = pick(CONTRAIL.linger);
      t.elapsed = 0;
      t.phase = "draw";
      t.told = false;

      instance.scale.set(CONTRAIL.span * 2, CONTRAIL.height, 1);
      instance.position.set(0, pick(CONTRAIL.altitude), pick(CONTRAIL.depth));
      // 経路の傾きは板ごと倒して作る。中心線を uv でずらす手もあるが、
      // 端の高低差(±144)が板の高さ(90)を越えるので収まらない
      instance.rotation.z = pick(CONTRAIL.tilt);
      material.uniforms.uDraw.value = t.draw;
      material.uniforms.uDir.value = Math.random() < 0.5 ? 1 : -1;
      material.uniforms.uExtra.value = 0;
      material.uniforms.uProgress.value = 0;
    }

    t.elapsed += dt;

    if (t.phase === "draw") {
      const progress = Math.min(t.elapsed / t.draw, 1);
      material.uniforms.uProgress.value = progress;
      // 出はじめの機影がいきなり点かないよう、2 秒かけて濃くする
      material.uniforms.uFade.value = THREE.MathUtils.smoothstep(t.elapsed, 0, 2);

      // 板は画角 (±42.8°) より広い ±54° を覆っていて、機影が枠に入るまで
      // 引き始めから 10 秒以上かかる。外へ知らせるのはそこから。
      // 機影は uv の x=progress にいる。板の中の位置をワールドへ移せば、
      // 傾き (rotation.z) も長さ (scale) もまとめて通る
      if (!t.told) {
        const dir = material.uniforms.uDir.value;
        const at = head.current.set(dir * (progress - 0.5), 0, 0);
        instance.localToWorld(at);
        if (inFrame(at, frame.camera)) {
          t.told = true;
          emitHeroEvent({ type: "contrail" });
        }
      }

      if (t.elapsed >= t.draw) {
        t.phase = "linger";
        t.elapsed = 0;
      }
    } else {
      // 引き終わってからも、線は広がりながら薄れ続ける。残りを畳むのは
      // linger の後ろ半分を使ってゆっくり——ここを詰めると、薄れて消えるので
      // はなく消灯したように見える。linger が短いほどこの配分が効いてくる
      material.uniforms.uProgress.value = 1;
      material.uniforms.uExtra.value = t.elapsed;
      material.uniforms.uFade.value =
        1 -
        THREE.MathUtils.smoothstep(t.elapsed, t.linger * 0.5, t.linger);
      if (t.elapsed >= t.linger) {
        t.phase = "wait";
        t.wait = pick(CONTRAIL.gap);
        instance.visible = false;
        return;
      }
    }

    instance.visible = true;
  });

  // 静止画キャプチャでは出さない。引きかけの線がポスターに焼き付くと、
  // Canvas と差し替えた瞬間に別の空になってしまう (Birds と同じ)
  if (!animated) return null;

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      // 雲より先に描く。雲が手前を通れば飛行機雲は隠れる
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
