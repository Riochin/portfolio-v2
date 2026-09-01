"use client";

import { Canvas } from "@react-three/fiber";
import { Stars, Clouds } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { CloudMassCloud } from "./Cumulonimbus";
import { GradientSky } from "./GradientSky";
import { MilkyWay } from "./MilkyWay";
import {
  CAMERA,
  CLOUD_LIMIT,
  CUMULONIMBUS,
  DAY_SKY,
  STARS,
  NIGHT_SKY,
  NIGHT_BG,
} from "./sceneConfig";

function DayScene({ animated }: { animated: boolean }) {
  return (
    <>
      <GradientSky top={DAY_SKY.top} mid={DAY_SKY.mid} bottom={DAY_SKY.bottom} />
      {/* 粒の色をそのまま出したいので、光源に依存しない Basic マテリアルにする */}
      <Clouds material={THREE.MeshBasicMaterial} limit={CLOUD_LIMIT}>
        {CUMULONIMBUS.map((mass) => (
          <CloudMassCloud key={mass.seed} mass={mass} animated={animated} />
        ))}
      </Clouds>
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

  return (
    <Canvas
      camera={{
        position: [...CAMERA.position],
        rotation: [...CAMERA.rotation],
        fov: CAMERA.fov,
      }}
      // toDataURL でのキャプチャ時のみ必要。通常表示では性能上のコストになるので切る
      gl={{ preserveDrawingBuffer: exposeCapture }}
      onCreated={({ gl, scene, camera }) => {
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
