import * as THREE from "three";
import { MILKY_WAY, STARS } from "./sceneConfig";

/**
 * 天の川の帯。星の配置(CPU)と霞の描画(GLSL)の両方から参照する。
 * 別々に持つと帯と星団がずれ、「霞の中に星が濃い」に見えなくなるので、
 * 同じ式をここに 1 つだけ置く。
 *
 * pole は銀河面の法線。ある向き d の銀河緯度は sin θ = dot(d, pole) で、
 * 帯はそれが 0 に近いところ、つまり pole に垂直な大円まわりに広がる。
 *
 * ただし大円は画面ではほぼ直線に見える(弧が見えるのは頂点が画面に入って
 * いるときだけ)。写真の天の川は弓なりなので、帯に沿った角度に応じて
 * 銀河面から浮かせ、意図的に曲げている。
 */
export const POLE = new THREE.Vector3(...MILKY_WAY.pole).normalize();
export const CORE = new THREE.Vector3(...MILKY_WAY.core).normalize();
/** 帯に沿った角度を測るための、pole とも core とも直交する向き */
export const SIDE = new THREE.Vector3().crossVectors(POLE, CORE).normalize();

/** 帯の中心線をどれだけ浮かせるか。core の位置を 0 とした弧になる */
function bandOffset(lon: number): number {
  return MILKY_WAY.curve * (1 - Math.cos(2 * lon));
}

/** 帯の濃さ 0..1。dir は正規化済みの向き */
export function bandMask(dir: THREE.Vector3): number {
  const lon = Math.atan2(dir.dot(SIDE), dir.dot(CORE));
  const d = dir.dot(POLE) - bandOffset(lon);
  return Math.exp(-(d * d) / (MILKY_WAY.width * MILKY_WAY.width));
}

/** 上と同じ式の GLSL 版 */
export const bandChunk = /* glsl */ `
  uniform vec3 pole;
  uniform vec3 bandRef;
  uniform vec3 bandSide;
  uniform float bandWidth;
  uniform float bandCurve;

  /** 帯に沿った角度。bandRef の向きを 0 として測る */
  float galacticLon(vec3 dir) {
    return atan(dot(dir, bandSide), dot(dir, bandRef));
  }

  /** 銀河面からの距離。帯を弓なりにするぶんを差し引いてある */
  float bandDistance(vec3 dir, float lon) {
    return dot(dir, pole) - bandCurve * (1.0 - cos(2.0 * lon));
  }

  float bandMask(float d) {
    return exp(-(d * d) / (bandWidth * bandWidth));
  }
`;

/** 向きの y 成分から大気の減光を出す。星と霞で同じ落ち方にする */
export function extinction(y: number): number {
  const { extinctionFloor, extinctionTop } = STARS;
  const t = (y - extinctionFloor) / (extinctionTop - extinctionFloor);
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
}

export const extinctionChunk = /* glsl */ `
  uniform float extinctionFloor;
  uniform float extinctionTop;

  float extinction(float y) {
    return smoothstep(extinctionFloor, extinctionTop, y);
  }
`;
