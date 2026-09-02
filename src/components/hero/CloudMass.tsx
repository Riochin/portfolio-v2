"use client";

import { Cloud } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { CloudMass } from "./sceneConfig";

// index から決定的に作る擬似乱数。静止画キャプチャと実シーンを一致させるため
// Math.random は使わない。
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 高さ t(0=下端, 1=上端)における塊の太さ(0..1)。
// 下から「肩」までは徐々に絞り、肩から上はドーム状に丸める。
// 平たい雲は shoulderRadius を 1 に近づけて円盤状にする。
function radiusAt(t: number, mass: CloudMass) {
  let radius: number;
  if (t <= mass.shoulder) {
    const k = t / mass.shoulder;
    radius = 1 - (1 - mass.shoulderRadius) * Math.pow(k, mass.taper);
  } else {
    const k = (t - mass.shoulder) / (1 - mass.shoulder);
    radius = mass.shoulderRadius * Math.sqrt(Math.max(0, 1 - k * k));
  }
  // もこもこした段
  return Math.max(
    0,
    radius + mass.bump * Math.sin(t * mass.bumpFreq + mass.seed),
  );
}

// drei の distribute は -1..1 の点を返すと bounds 倍されて粒の位置になる。
// 塊を高さ [from, to] で切った帯のぶんだけ、円柱状にサンプリングする。
function makeDistribute(
  mass: CloudMass,
  from: number,
  to: number,
  seed: number,
) {
  const point = new THREE.Vector3();

  return (cloud: { segments: number }, index: number) => {
    const n = Math.max(1, cloud.segments - 1);
    // 帯の中で下ほど密になるよう偏らせる(雲底のボリュームを稼ぐ)
    const local = Math.pow(index / n, mass.stack);
    const t = from + (to - from) * local;
    const radius = radiusAt(t, mass);

    const angle = hash(index * 1.37 + seed) * Math.PI * 2;
    // 円周方向にこぶを作る。これがないと輪郭がただの円錐になる
    const lump =
      1 + mass.lump * Math.sin(angle * mass.lumpFreq + t * mass.lumpTwist);
    // sqrt で円内一様に。中心に寄りすぎるとシルエットが痩せる
    const spread = Math.sqrt(hash(index * 2.71 + seed)) * radius * lump;
    const jitter = (hash(index * 3.53 + seed) - 0.5) * mass.jitter;

    point.set(
      Math.cos(angle) * spread + t * mass.lean,
      t * 2 - 1 + jitter,
      Math.sin(angle) * spread * mass.depth,
    );

    // 太い層ほど大きい粒を置いて内部を埋める。外周は少し小さくして縁を細かく
    const fill = 0.5 + 0.7 * radius;
    const edge = 1 - 0.3 * (spread / Math.max(radius, 0.001));
    const variance = 0.75 + 0.5 * hash(index * 5.11 + seed);

    return { point, volume: mass.volume * fill * edge * variance };
  };
}

// 塊を高さ方向の帯に割る。ビルボードは常にカメラを向くので法線が揃ってしまい
// 光源では陰影がつかない。帯ごとに色を変えることで陰影を作る。
function buildBands(mass: CloudMass) {
  const bands = [...new Array(mass.bands)].map((_, i) => {
    const from = i / mass.bands;
    const to = (i + 1) / mass.bands;
    const mid = (from + to) / 2;
    return {
      from,
      to,
      // 断面積に比例させて粒を配る
      weight: Math.pow(radiusAt(mid, mass), 2),
      // 影は雲底寄りに溜めたいので、中間より上は早めに白へ寄せる
      color: new THREE.Color(mass.colorBottom)
        .lerp(new THREE.Color(mass.colorTop), Math.pow(mid, 0.55))
        .getStyle(),
      seed: mass.seed + i * 97,
    };
  });

  const total = bands.reduce((sum, band) => sum + band.weight, 0);
  return bands.map((band) => ({
    ...band,
    segments: Math.max(4, Math.round((mass.segments * band.weight) / total)),
  }));
}

export function CloudMassCloud({
  mass,
  animated,
}: {
  mass: CloudMass;
  animated: boolean;
}) {
  const bands = useMemo(() => buildBands(mass), [mass]);

  return (
    <>
      {bands.map((band) => (
        <Cloud
          key={band.seed}
          position={[...mass.position]}
          bounds={[...mass.bounds]}
          segments={band.segments}
          distribute={makeDistribute(mass, band.from, band.to, band.seed)}
          volume={mass.volume}
          smallestVolume={mass.volume * 0.25}
          growth={animated ? mass.growth : 0}
          speed={animated ? mass.speed : 0}
          opacity={mass.opacity}
          color={band.color}
          seed={band.seed}
          fade={mass.fade}
        />
      ))}
    </>
  );
}
