"use client";

import { useMemo } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 midColor;
  uniform vec3 bottomColor;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    vec3 color = h > 0.0
      ? mix(midColor, topColor, pow(min(h, 1.0), 0.65))
      : mix(midColor, bottomColor, pow(min(-h, 1.0), 0.8));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function GradientSky({
  top,
  mid,
  bottom,
}: {
  top: string;
  mid: string;
  bottom: string;
}) {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color(top) },
      midColor: { value: new THREE.Color(mid) },
      bottomColor: { value: new THREE.Color(bottom) },
    }),
    [top, mid, bottom],
  );

  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
