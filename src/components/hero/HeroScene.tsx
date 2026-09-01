"use client";

import { Canvas } from "@react-three/fiber";
import { Stars, Cloud, Clouds } from "@react-three/drei";
import * as THREE from "three";
import { GradientSky } from "./GradientSky";
import { MilkyWay } from "./MilkyWay";
import {
  CAMERA,
  DAY_SKY,
  CLOUDS,
  STARS,
  NIGHT_SKY,
  NIGHT_BG,
} from "./sceneConfig";

function DayScene({ animated }: { animated: boolean }) {
  return (
    <>
      <GradientSky top={DAY_SKY.top} mid={DAY_SKY.mid} bottom={DAY_SKY.bottom} />
      <ambientLight intensity={1.2} />
      <Clouds material={THREE.MeshBasicMaterial}>
        {CLOUDS.map((cloud, i) => (
          <Cloud
            key={i}
            position={[...cloud.position]}
            scale={cloud.scale}
            opacity={cloud.opacity}
            speed={animated ? cloud.speed : 0}
            seed={cloud.seed}
            color="#ffffff"
          />
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
      {mode === "dark" ? (
        <NightScene animated={animated} />
      ) : (
        <DayScene animated={animated} />
      )}
    </Canvas>
  );
}
