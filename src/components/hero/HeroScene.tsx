"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Clouds } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { CloudMassCloud } from "./CloudMass";
import { GradientSky } from "./GradientSky";
import { MilkyWay } from "./MilkyWay";
import { Mountains } from "./Mountains";
import { Ocean } from "./Ocean";
import { VolumeClouds } from "./VolumeClouds";
import {
  CAMERA,
  DAY_SKY,
  CLOUD_LAYER,
  CLOUD_LIMIT,
  DAY_OCEAN,
  STARS,
  NIGHT_SKY,
  NIGHT_BG,
} from "./sceneConfig";

function CloudLayer({ animated }: { animated: boolean }) {
  return (
    // 粒の色をそのまま出したいので、光源に依存しない Basic マテリアルにする
    <Clouds material={THREE.MeshBasicMaterial} limit={CLOUD_LIMIT}>
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
      <VolumeClouds animated={animated} />
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
      <Mountains />
    </>
  );
}

declare global {
  interface Window {
    __heroCapture?: () => string;
  }
}

export default function HeroScene({
  mode,
  animated = true,
  onReady,
  exposeCapture = false,
}: {
  mode: "light" | "dark";
  animated?: boolean;
  onReady?: () => void;
  exposeCapture?: boolean;
}) {
  // キャプチャ時は sceneConfig のカメラ角そのままで固定したいので追従を切る
  const interactive = !exposeCapture;
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
      }}
      // toDataURL でのキャプチャ時のみ必要。通常表示では性能上のコストになるので切る
      gl={{ preserveDrawingBuffer: exposeCapture }}
      onCreated={({ gl, scene, camera }) => {
        // 素材の色はそのまま出したいので露出は等倍。空の輝度は DaySky 側で畳む
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => setAttempt((n) => (n < 2 ? n + 1 : n)),
          { once: true },
        );
        if (exposeCapture) {
          window.__heroCapture = () => {
            gl.render(scene, camera);
            return gl.domElement.toDataURL("image/webp", 0.9);
          };
        }
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
