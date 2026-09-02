"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { bandChunk, CORE, extinctionChunk, POLE, SIDE } from "./galaxy";
import { GALAXY_RADIUS, MILKY_WAY, STARS } from "./sceneConfig";

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 板ではなく空の球に描く。板だと矩形の縁が霞の途切れとして見えるうえ、
// 星の分布と同じ座標で語れない。
const fragmentShader = /* glsl */ `
  uniform vec3 coreDir;
  uniform float coreSpread;
  uniform float coreGain;
  uniform float dustDepth;
  uniform float dustWidth;
  uniform float intensity;
  uniform vec3 bandColor;
  uniform vec3 coreColor;

  varying vec3 vDir;

  ${bandChunk}
  ${extinctionChunk}

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y),
      f.z);
  }

  // 雲斑。1 オクターブだと均一な帯にしかならず、写真のむらが出ない
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += noise(p) * amp;
      p *= 2.03;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float lon = galacticLon(dir);
    float d = bandDistance(dir, lon);
    float band = bandMask(d);

    // 中心部の膨らみ。銀河中心の方向からの角距離で落とす
    // pow(x, 2.0) は x が負だと GLSL では未定義。角距離も緯度差も
    // 符号を持つので、2 乗は必ず掛け算で書く
    float toCore = acos(clamp(dot(dir, coreDir), -1.0, 1.0)) / coreSpread;
    float bulge = exp(-toCore * toCore);

    // むらは強めに。差が小さいと霧を吹いたようにのっぺりする
    float mottle = mix(0.25, 1.45, fbm(dir * 11.0)) * mix(0.6, 1.3, fbm(dir * 34.0));

    // 暗黒帯。銀河面のわずかに片側を走る塵の筋で、帯を縦に裂く
    float offset = (d - 0.03) / dustWidth;
    float lane = exp(-offset * offset);
    float dust = 1.0 - dustDepth * lane * mix(0.55, 1.0, fbm(dir * 13.0));

    float glow = band * mottle * dust * (1.0 + coreGain * bulge) * intensity;
    glow *= extinction(dir.y);

    vec3 color = mix(bandColor, coreColor, clamp(bulge * 1.2, 0.0, 1.0) * 0.9);
    gl_FragColor = vec4(color * glow, 1.0);
  }
`;

export function MilkyWay() {
  const uniforms = useMemo(
    () => ({
      pole: { value: POLE.clone() },
      bandRef: { value: CORE.clone() },
      bandSide: { value: SIDE.clone() },
      bandWidth: { value: MILKY_WAY.width },
      bandCurve: { value: MILKY_WAY.curve },
      coreDir: { value: CORE.clone() },
      coreSpread: { value: MILKY_WAY.coreSpread },
      coreGain: { value: MILKY_WAY.coreGain },
      dustDepth: { value: MILKY_WAY.dust },
      dustWidth: { value: MILKY_WAY.dustWidth },
      intensity: { value: MILKY_WAY.intensity },
      bandColor: { value: new THREE.Color(MILKY_WAY.band) },
      coreColor: { value: new THREE.Color(MILKY_WAY.coreColor) },
      extinctionFloor: { value: STARS.extinctionFloor },
      extinctionTop: { value: STARS.extinctionTop },
    }),
    [],
  );

  return (
    <mesh scale={GALAXY_RADIUS} renderOrder={1} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneFactor}
      />
    </mesh>
  );
}
