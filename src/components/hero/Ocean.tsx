"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Water } from "three-stdlib";
import { OCEAN, SUN, type OceanPalette } from "./sceneConfig";
import { setStarHeightScale } from "./starPass";

/**
 * three.js 公式サンプル由来の Water(three-stdlib, MIT)。
 * 自前シェーダと違い、シーンをもう一度描いた鏡像を水面に映すので、
 * 空と雲がそのまま水に落ちる。波はタイル法線マップを 4 通りの向きと速度で
 * スクロールさせて作るため、手前から水平線まで細かさが自然に詰まる。
 *
 * 法線マップ(/water-normals.png)は、周期がテクスチャ幅を割り切る正弦波だけを
 * 足して作った継ぎ目のないもの。外部アセットには依存しない。
 */
export function Ocean({
  palette,
  animated,
  reflectionSize = OCEAN.reflectionSize,
}: {
  palette: OceanPalette;
  animated: boolean;
  /** 鏡像を焼くテクスチャの一辺。常時描画するブロックでは落として使う */
  reflectionSize?: number;
}) {
  const normals = useTexture(OCEAN.normalMap);
  const ref = useRef<Water>(null);

  const water = useMemo(() => {
    // useTexture が返すテクスチャは共有物なので、複製してから設定する
    const map = normals.clone();
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.needsUpdate = true;

    const mesh = new Water(new THREE.PlaneGeometry(OCEAN.size, OCEAN.size), {
      textureWidth: reflectionSize,
      textureHeight: reflectionSize,
      waterNormals: map,
      sunDirection: new THREE.Vector3(...SUN).normalize(),
      sunColor: new THREE.Color(palette.sunColor),
      waterColor: new THREE.Color(palette.water),
      distortionScale: palette.distortion,
      fog: false,
    });
    // Water のシェーダは rf0(垂直入射での反射率)が 0.3 固定で、
    // 水平に近い視点だとほぼ全面が鏡になり水の色が出ない。下げて色を出す
    mesh.material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader
        .replace("float rf0 = 0.3;", `float rf0 = ${OCEAN.reflectance.toFixed(3)};`)
        // 反射側に足される定数。夜はこれが効いて海が灰色に浮くので下げる
        .replace("vec3( 0.1 ) +", `vec3( ${palette.ambient.toFixed(3)} ) +`)
        .replace(
          "reflectionSample * 0.9",
          `reflectionSample * ${palette.reflectStrength.toFixed(2)}`,
        )
        // 拡散光が白く乗って水の色を潰すので係数を下げる
        .replace(
          "sunColor * diffuseLight * 0.3",
          `sunColor * diffuseLight * ${palette.diffuse.toFixed(3)}`,
        )
        // 素の scatter は視線が浅いほど水の色が消える。下限を持たせて
        // 水平に近い視点でも色が残るようにする
        .replace(
          "vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;",
          `vec3 scatter = mix( ${palette.scatterFloor.toFixed(2)}, 1.0, max( 0.0, dot( surfaceNormal, eyeDirection ) ) ) * waterColor;`,
        );
    };
    mesh.material.needsUpdate = true;

    // 鏡像は reflectionSize 四方のバッファへシーンをもう一度描いて作る。
    // gl_PointSize はピクセル単位なので、そのまま描くと星だけが相対的に
    // 何倍にも膨らみ、水平線沿いの白い塊になる。焼いている間だけ倍率を
    // このバッファに合わせ、終わったら画面のものへ戻す。
    // (useFrame では間に合わない。鏡像を描くのは 1 フレームの内側)
    const drawReflection = mesh.onBeforeRender;
    const canvasSize = new THREE.Vector2();
    mesh.onBeforeRender = function (renderer, ...rest) {
      renderer.getSize(canvasSize);
      setStarHeightScale(reflectionSize / canvasSize.y);
      drawReflection.call(this, renderer, ...rest);
      setStarHeightScale(renderer.getPixelRatio());
    };

    mesh.rotation.x = -Math.PI / 2;
    // size は法線マップの繰り返し。小さいほど波ひとつが大きくなる
    mesh.material.uniforms.size.value = palette.waveSize;
    // 静止画キャプチャでも波が出るよう、初期位相をずらしておく
    mesh.material.uniforms.time.value = OCEAN.stillTime;
    return mesh;
  }, [normals, palette, reflectionSize]);

  useEffect(() => {
    const { geometry, material } = water;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [water]);

  useFrame((_, delta) => {
    if (animated && ref.current) {
      ref.current.material.uniforms.time.value += delta * palette.speed;
    }
  });

  return <primitive ref={ref} object={water} />;
}
