"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MILKY_WAY } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 bandColor;
  uniform vec3 coreColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    float dist = abs(vUv.y - 0.5) * 2.0;
    float band = smoothstep(1.0, 0.0, dist);
    float cloud = noise(vUv * vec2(14.0, 5.0)) * 0.6 + noise(vUv * vec2(40.0, 14.0)) * 0.4;
    float edgeFade = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
    float intensity = band * band * (0.35 + cloud * 0.65) * edgeFade;
    vec3 color = mix(bandColor, coreColor, band * cloud);
    gl_FragColor = vec4(color, intensity * 0.55);
  }
`;

export function MilkyWay() {
  const uniforms = useMemo(
    () => ({
      bandColor: { value: new THREE.Color("#4b3f8f") },
      coreColor: { value: new THREE.Color("#8b7ef0") },
    }),
    [],
  );

  return (
    <mesh
      position={[...MILKY_WAY.position]}
      rotation={[...MILKY_WAY.rotation]}
    >
      <planeGeometry args={[320, 90]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
