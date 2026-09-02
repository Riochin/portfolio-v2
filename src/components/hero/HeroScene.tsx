"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Clouds, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { Birds } from "./Birds";
import { CloudMassCloud } from "./CloudMass";
import { GradientSky } from "./GradientSky";
import { MilkyWay } from "./MilkyWay";
import { Ocean } from "./Ocean";
import { ShootingStar } from "./ShootingStar";
import { StarField } from "./StarField";
import {
  CAMERA,
  DAY_SKY,
  NIGHT_OCEAN,
  CLOUD_LAYER,
  CLOUD_LIMIT,
  CLOUD_TEXTURE,
  DAY_OCEAN,
  QUALITY,
  NIGHT_SKY,
  NIGHT_BG,
  type Quality,
} from "./sceneConfig";

function CloudLayer({ animated }: { animated: boolean }) {
  return (
    // 粒の色をそのまま出したいので、光源に依存しない Basic マテリアルにする
    <Clouds
      material={THREE.MeshBasicMaterial}
      limit={CLOUD_LIMIT}
      texture={CLOUD_TEXTURE}
    >
      {CLOUD_LAYER.map((mass) => (
        <CloudMassCloud key={mass.seed} mass={mass} animated={animated} />
      ))}
    </Clouds>
  );
}

function DayScene({
  animated,
  quality,
}: {
  animated: boolean;
  quality: Quality;
}) {
  return (
    <>
      <GradientSky
        top={DAY_SKY.top}
        mid={DAY_SKY.mid}
        bottom={DAY_SKY.bottom}
        curve={DAY_SKY.curve}
      />
      <CloudLayer animated={animated} />
      <Birds animated={animated} />
      <Ocean
        palette={DAY_OCEAN}
        animated={animated}
        reflectionSize={quality.reflectionSize}
      />
    </>
  );
}

function NightScene({
  animated,
  quality,
}: {
  animated: boolean;
  quality: Quality;
}) {
  return (
    <>
      <color attach="background" args={[NIGHT_BG]} />
      <GradientSky
        top={NIGHT_SKY.top}
        mid={NIGHT_SKY.mid}
        bottom={NIGHT_SKY.bottom}
        curve={NIGHT_SKY.curve}
      />
      <MilkyWay />
      <StarField animated={animated} />
      <ShootingStar animated={animated} />
      <Ocean
        palette={NIGHT_OCEAN}
        animated={animated}
        reflectionSize={quality.reflectionSize}
      />
    </>
  );
}

// 素材の読み込み割合(0..1)を外へ流すだけの部品。drei の useProgress は
// three の DefaultLoadingManager を見ているので Canvas の外でも読める。
// 実際に外へ置いているのは、Canvas の中だと Ocean のテクスチャ待ちで
// Suspense に巻き込まれ、肝心の読み込み中に値が流れなくなるため。
function AssetProgress({ onProgress }: { onProgress: (value: number) => void }) {
  const { progress } = useProgress();

  useEffect(() => {
    onProgress(progress / 100);
  }, [progress, onProgress]);

  return null;
}

// Canvas の中、Suspense の内側に置く。ここがマウントされた時点で素材は揃っている。
// そこからさらに useFrame を 2 回見送ってから onReady を投げる。useFrame は
// 描画の前に走るので、1 回目の時点ではまだ 1 枚も出ていないため。
function SceneReady({
  onAssetsReady,
  onReady,
}: {
  onAssetsReady?: () => void;
  onReady?: () => void;
}) {
  const frames = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    onAssetsReady?.();
  }, [onAssetsReady]);

  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      done.current = true;
      onReady?.();
    }
  });

  return null;
}

export default function HeroScene({
  mode,
  animated = true,
  interactive = true,
  quality = QUALITY.full,
  paused = false,
  onAssetProgress,
  onAssetsReady,
  onReady,
  onCapture,
  preserveBuffer = false,
}: {
  mode: "light" | "dark";
  animated?: boolean;
  /** ポインタで視点を振れるようにするか。ヒーローブロックでは切る */
  interactive?: boolean;
  quality?: Quality;
  /** 描画を止める。画面外やタブ非表示のとき用。
      ただし onReady は useFrame で拾うので、初回フレームより前に止めてはいけない */
  paused?: boolean;
  /** 素材の読み込み割合(0..1) */
  onAssetProgress?: (value: number) => void;
  /** 素材が揃った合図。ここから初回フレームまではシェーダのコンパイル待ち */
  onAssetsReady?: () => void;
  /** 実際に 1 枚描き終えた合図 */
  onReady?: () => void;
  /** 今描かれている絵を静止画として取り出す手段を親へ渡す */
  onCapture?: (capture: () => string | null) => void;
  /** 描画バッファを保持する。静止画の焼き出し用で、通常表示では性能上のコストになる */
  preserveBuffer?: boolean;
}) {
  // WebGL コンテキストを失うと以降なにも描かれず真っ白になる。canvas 要素ごと
  // 作り直さないと復帰できないので、key を進めて Canvas を張り替える。
  // (dev の StrictMode 二重マウントで R3F が forceContextLoss を呼ぶケースと、
  //  実ブラウザの GPU リセットの両方に効く。無限ループを避けて 2 回まで)
  const [attempt, setAttempt] = useState(0);

  return (
    <>
      {onAssetProgress && <AssetProgress onProgress={onAssetProgress} />}
      <Canvas
        key={attempt}
        dpr={[...quality.dpr]}
        frameloop={paused ? "never" : "always"}
        camera={{
          position: [...CAMERA.position],
          rotation: [...CAMERA.rotation],
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
        }}
        gl={{ preserveDrawingBuffer: preserveBuffer }}
        onCreated={({ gl, scene, camera }) => {
          // 素材の色はそのまま出したいので露出は等倍。空の輝度は DaySky 側で畳む
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => setAttempt((n) => (n < 2 ? n + 1 : n)),
            { once: true },
          );
          onCapture?.(() => {
            try {
              // preserveDrawingBuffer なしでも、描いてから同じタスクの中で
              // 読めば中身は残っている。読めなかった環境ではほぼ空の画像が
              // 返ってくるので、明らかに小さいものは無かったことにする
              gl.render(scene, camera);
              const url = gl.domElement.toDataURL("image/webp", 0.9);
              return url.length > 2000 ? url : null;
            } catch {
              return null;
            }
          });
        }}
        // 視点を振らないときはポインタも拾わせない。ヒーローブロックでは
        // Canvas がボタンの上に乗るので、クリックを下へ通す必要がある。
        // 振るときは touch-none を当てる。指のなぞりをブラウザのスクロールや
        // 引っ張り更新に持っていかれると、そこで pointercancel が飛んで
        // 見回しが途切れてしまうため。
        // 角丸を canvas 自身にも持たせるのは、別の合成レイヤになると親の
        // overflow-hidden で切られず角がはみ出すため。--hero-radius を持たない
        // 全画面では変数が解決できず、border-radius は初期値(0)に戻る
        className={`h-full w-full rounded-[var(--hero-radius)]${interactive ? " touch-none" : " pointer-events-none"}`}
      >
        {interactive && <CameraRig />}
        <Suspense fallback={null}>
          {mode === "dark" ? (
            <NightScene animated={animated} quality={quality} />
          ) : (
            <DayScene animated={animated} quality={quality} />
          )}
          <SceneReady onAssetsReady={onAssetsReady} onReady={onReady} />
        </Suspense>
      </Canvas>
    </>
  );
}
