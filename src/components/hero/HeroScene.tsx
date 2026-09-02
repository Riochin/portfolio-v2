"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Clouds } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { CloudMassCloud } from "./CloudMass";
import { GradientSky } from "./GradientSky";
import { MilkyWay } from "./MilkyWay";
import { Ocean } from "./Ocean";
import {
  CAMERA,
  DAY_SKY,
  NIGHT_OCEAN,
  CLOUD_LAYER,
  CLOUD_LIMIT,
  CLOUD_TEXTURE,
  DAY_OCEAN,
  STARS,
  NIGHT_SKY,
  NIGHT_BG,
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

function DayScene({ animated }: { animated: boolean }) {
  return (
    <>
      <GradientSky
        top={DAY_SKY.top}
        mid={DAY_SKY.mid}
        bottom={DAY_SKY.bottom}
        curve={DAY_SKY.curve}
      />
      <CloudLayer animated={animated} />
      <Ocean palette={DAY_OCEAN} animated={animated} />
    </>
  );
}

function NightScene({ animated }: { animated: boolean }) {
  return (
    <>
      <color attach="background" args={[NIGHT_BG]} />
      <GradientSky
        top={NIGHT_SKY.top}
        mid={NIGHT_SKY.mid}
        bottom={NIGHT_SKY.bottom}
      />
      <MilkyWay />
      <Stars
        radius={STARS.radius}
        depth={STARS.depth}
        count={STARS.count}
        factor={STARS.factor}
        saturation={STARS.saturation}
        fade={STARS.fade}
        speed={animated ? STARS.speed : 0}
      />
      <Ocean palette={NIGHT_OCEAN} animated={animated} />
    </>
  );
}

export default function HeroScene({
  mode,
  animated = true,
  interactive = true,
  onReady,
  onCapture,
  preserveBuffer = false,
}: {
  mode: "light" | "dark";
  animated?: boolean;
  /** ポインタで視点を振れるようにするか。キャプチャでは切る */
  interactive?: boolean;
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
    <Canvas
      key={attempt}
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
            // preserveDrawingBuffer なしでも、描いてから同じタスクの中で読めば
            // 中身は残っている。読めなかった環境ではほぼ空の画像が返ってくるので、
            // 明らかに小さいものは無かったことにする
            gl.render(scene, camera);
            const url = gl.domElement.toDataURL("image/webp", 0.9);
            return url.length > 2000 ? url : null;
          } catch {
            return null;
          }
        });
        onReady?.();
      }}
      className="h-full w-full"
    >
      {interactive && <CameraRig />}
      {mode === "dark" ? (
        <NightScene animated={animated} />
      ) : (
        <DayScene animated={animated} />
      )}
    </Canvas>
  );
}
