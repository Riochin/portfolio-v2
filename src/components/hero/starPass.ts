import type * as THREE from "three";

/**
 * gl_PointSize はピクセル単位で効くので、水面の鏡像を焼く小さなバッファへ
 * そのまま描くと星だけが相対的に何倍にも膨らみ、水平線沿いの白い塊になる。
 * 焼いている間だけ倍率をそのバッファに合わせるため、星の材質をここへ預けて
 * Ocean から触れるようにする。
 *
 * useFrame では間に合わない。鏡像を描くのは Water の onBeforeRender の中、
 * つまり 1 フレームの描画のさらに内側なので、フレーム単位では両方の
 * パスを区別できない。
 */
let material: THREE.ShaderMaterial | null = null;

export function registerStarMaterial(m: THREE.ShaderMaterial) {
  material = m;
  return () => {
    if (material === m) material = null;
  };
}

/** 倍率 = 描画先の高さ(px) / canvas の高さ(css px) */
export function setStarHeightScale(scale: number) {
  if (material) material.uniforms.heightScale.value = scale;
}
