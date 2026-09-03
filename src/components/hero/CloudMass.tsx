"use client";

import { Cloud } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CLOUD_DRIFT, CLOUD_HAZE, SUN, type CloudMass } from "./sceneConfig";

// 静止画キャプチャと実シーンでシルエットが食い違うと、ポスターと Canvas を
// 差し替えた瞬間に絵が飛ぶ。だから形は seed から決定的に作り、Math.random は
// 使わない。mulberry32(周期も分布も素直な整数 PRNG)。
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 塊を組み立てる球ひとつ。座標は -1..1 の正規化空間(drei が bounds 倍する) */
type Lobe = {
  center: THREE.Vector3;
  radius: number;
};

/** 粒ひとつ。drei の distribute はこの形をそのまま受け取る */
type Puff = {
  point: THREE.Vector3;
  /** volume prop に掛かる倍率。drei は distribute の戻り値と prop を掛ける */
  volume: number;
  /** この粒が乗っている球。陰影の法線を取るのに要る */
  host: Lobe;
  shade: number;
};

// 単位球面上の向き。up を上げるほど上半球へ寄る
function direction(rand: () => number, up: number, out: THREE.Vector3) {
  const y = rand() * 2 - 1;
  const angle = rand() * Math.PI * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  out.set(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
  out.y = out.y * (1 - up) + up;
  return out.normalize();
}

// 積雲は「平らな雲底から丸い塔がいくつも立ち上がる」形をしている。
// 高さ 1 本の関数で半径を決める(=回転体)とどうしても円錐に見えるので、
// 球を積んで稜線を作り、その表面へ一回り小さい球を生やしてぼこぼこにする。
function buildLobes(mass: CloudMass, rand: () => number): Lobe[] {
  const lobes: Lobe[] = [];

  // 雲底。球の中心を y=-1 のすぐ上に置くと下半分がはみ出す。粒を撒くときに
  // y=-1 で潰すので、そのはみ出したぶんが平らな底になる。
  const feet = Math.max(2, Math.round(mass.towers * 1.7));
  for (let i = 0; i < feet; i++) {
    const u = feet === 1 ? 0.5 : i / (feet - 1);
    const radius =
      mass.girth * (0.8 + 0.4 * rand()) * (1 - 0.3 * Math.abs(u - 0.5) * 2);
    lobes.push({
      center: new THREE.Vector3(
        (u - 0.5) * 2 * mass.spread * 1.05 + (rand() - 0.5) * 0.2 * mass.girth,
        -1 + radius * 0.4,
        (rand() - 0.5) * 1.2 * mass.girth,
      ),
      radius,
    });
  }

  // 塔。主峰(peak)から離れた塔ほど低くして、稜線に高低差をつける。
  // ここが単調だと、塊がいくつあっても同じ三角に見える。
  for (let i = 0; i < mass.towers; i++) {
    const u = mass.towers === 1 ? 0.5 : i / (mass.towers - 1);
    const fall =
      Math.abs(u - mass.peak) / Math.max(mass.peak, 1 - mass.peak, 0.001);
    const top =
      -1 +
      (mass.height + 1) *
        Math.max(0.15, 1 - mass.slope * fall * fall) *
        (0.85 + 0.3 * rand());
    const foot =
      (u - 0.5) * 2 * mass.spread + (rand() - 0.5) * 0.25 * mass.girth;
    const z = (rand() - 0.5) * 1.1 * mass.girth;

    // 上ほど球を小さくすると頭が丸くなる。背の高い塊ほど球を多く積まないと
    // 柱がすかすかになるので、段数は bounds の縦横比で伸ばす
    const slender = Math.max(1, mass.bounds[1] / mass.bounds[0]);
    const steps = Math.max(2, Math.round((2 + 3.2 * (top + 1)) * slender));
    for (let s = 0; s < steps; s++) {
      const k = steps === 1 ? 0 : s / (steps - 1);
      const y = -1 + (top + 1) * k;
      // 入道雲は頭が湧き上がって太る。crown はその膨らみ
      const swell =
        1 + mass.crown * Math.exp(-Math.pow((k - 0.82) / 0.24, 2));
      lobes.push({
        center: new THREE.Vector3(
          foot + mass.lean * (y + 1) + (rand() - 0.5) * 0.35 * mass.girth,
          y,
          z + (rand() - 0.5) * 0.5 * mass.girth,
        ),
        radius:
          mass.girth *
          (1 - mass.taper * Math.pow(k, 0.8)) *
          swell *
          (0.85 + 0.3 * rand()),
      });
    }
  }

  // こぶ。骨格の球の表面に小さい球を生やす。これが輪郭の細かさになる。
  // 下向きに生やすとぶら下がって見えるので、雲底の球以外は上半球へ寄せる。
  const skeleton = lobes.length;
  const dir = new THREE.Vector3();
  for (let i = 0; i < skeleton; i++) {
    const parent = lobes[i];
    const count = Math.round(mass.roughness * 5 * (parent.radius / mass.girth));
    for (let j = 0; j < count; j++) {
      direction(rand, parent.center.y < -0.75 ? 0.1 : 0.45, dir);
      lobes.push({
        center: parent.center
          .clone()
          .addScaledVector(dir, parent.radius * (0.7 + 0.25 * rand())),
        radius: parent.radius * (0.3 + 0.25 * rand()),
      });
    }
  }

  return lobes;
}

// 球ごとに、断面積に比例した数の粒を配る。ルーレットで引くと球あたりの数が
// ばらついて小さいこぶが消えるので、累積比から個数を決め打ちする
// (合計はきっかり segments になる)。
function samplePuffs(mass: CloudMass, lobes: Lobe[], rand: () => number) {
  const weights = lobes.map((lobe) => lobe.radius * lobe.radius);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  const puffs: Puff[] = [];
  const dir = new THREE.Vector3();
  let cumulative = 0;
  let placed = 0;

  lobes.forEach((lobe, index) => {
    cumulative += weights[index];
    const target = Math.round((cumulative / total) * mass.segments);
    const count = target - placed;
    placed = target;

    for (let i = 0; i < count; i++) {
      // 1/3 乗なら球内一様。指数を上げるほど表面へ寄る。中も少し埋めないと
      // 逆光で向こう側が透ける
      const depth = Math.pow(rand(), 1 / 3.2);
      const point = lobe.center
        .clone()
        .addScaledVector(direction(rand, 0, dir), lobe.radius * depth);

      // 雲底より下は潰す。真っ平らに切ると定規で引いたようになるので少し残す
      if (point.y < -1) point.y = -1 + (point.y + 1) * mass.flatBase;

      puffs.push({
        point,
        // 大きい球には大きい粒、こぶには小さい粒。粒の大きさに幅が出て、
        // 同じ大きさを並べたときの「梱包材」っぽさが消える。
        // ただし球の半径への依存は弱くする。塔は上ほど球が細り(taper)、
        // こぶも上半球へ寄せてあるので、素直に比例させると頂きの粒だけが
        // 雲底の半分ほどになり、そこだけ粒々して見えてしまう。
        // 本物の雲は上へ行くほど細かくなったりはしない。
        // 表面の粒だけわずかに小さくして輪郭を締める
        volume:
          (1 + 0.55 * (lobe.radius / mass.girth)) *
          (0.88 + 0.24 * rand()) *
          (1 - 0.12 * depth),
        host: lobe,
        shade: 0,
      });
    }
  });

  return puffs;
}

// 粒ごとの明るさを焼く。ビルボードは常にカメラを向くので法線が揃ってしまい、
// three の光源では陰影がつかない。だから位置から自前で明るさを出す。
function shadePuffs(mass: CloudMass, puffs: Puff[]) {
  const sun = new THREE.Vector3(...SUN).normalize();
  // 見えている形(bounds で潰したあと)で陰影を決めたいので、法線はワールド
  // 比率へ直してから取る
  const scale = new THREE.Vector3(...mass.bounds);
  const reach = Math.max(scale.x, scale.y, scale.z);

  const world = new THREE.Vector3();
  const outward = new THREE.Vector3();
  const local = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (const puff of puffs) {
    world.copy(puff.point).multiply(scale);
    // 塊全体から見た外向き。大づかみな陰影
    outward.copy(world).divideScalar(reach);
    // 乗っている球から見た外向き。こぶ 1 つ 1 つの丸み
    local.copy(puff.host.center).multiply(scale);
    local.subVectors(world, local).normalize();

    normal
      .copy(outward)
      .normalize()
      .multiplyScalar(0.4)
      .addScaledVector(local, 0.6)
      .normalize();

    // Math.pow に負の底を渡すと NaN になる。丸め誤差で内積が -1 を割ることも、
    // 雲底の粒が y=-1 を少し下回ることもあるので、どちらも 0..1 に丸めてから使う
    const lambert = THREE.MathUtils.clamp(0.5 + 0.5 * normal.dot(sun), 0, 1);
    // 太陽側から見た奥行き。向こう側の粒は手前の雲に隠れて光が届かない
    const through = THREE.MathUtils.clamp(0.5 - 0.5 * outward.dot(sun), 0, 1);
    // 上ほど天空光を浴びる。雲底が暗いのはこれと自己遮蔽の合わせ技
    const sky = THREE.MathUtils.clamp(0.5 + 0.5 * puff.point.y, 0, 1);

    puff.shade = THREE.MathUtils.clamp(
      0.55 * Math.pow(lambert, 1.2) +
        0.3 * Math.pow(sky, 1.3) +
        0.15 -
        mass.selfShadow * through,
      0,
      1,
    );
  }
}

// 影 → 本体 → 直射 の 3 点ランプ。contrast は明るい側へ寄せる曲がり具合。
function ramp(mass: CloudMass, shade: number) {
  const t = Math.pow(shade, mass.contrast);
  const color =
    t < 0.5
      ? new THREE.Color(mass.shadow).lerp(new THREE.Color(mass.body), t * 2)
      : new THREE.Color(mass.body).lerp(
          // 直射面は 1 を超えてよい。instanceColor は float なので通り、
          // ACES のトーンマップが白へ畳んでくれる
          new THREE.Color(mass.sunlit).multiplyScalar(mass.gain),
          (t - 0.5) * 2,
        );

  // 遠いものほど空の霞に溶ける。opacity だけで奥へ送ると色が痩せる
  return color.lerp(new THREE.Color(CLOUD_HAZE), mass.haze);
}

// 色は <Cloud> 単位でしか変えられない(drei が instanceColor へ流すのは
// Cloud ごとの 1 色)。なので明るさを段に量子化し、段ごとに <Cloud> を作る。
// 段はすべて親の <Clouds> の instancedMesh に入るので、描画は 1 回のまま。
function buildBands(mass: CloudMass) {
  const rand = rng(mass.seed);
  const lobes = buildLobes(mass, rand);
  const puffs = samplePuffs(mass, lobes, rand);
  shadePuffs(mass, puffs);

  const buckets: Puff[][] = [...new Array(mass.shades)].map(() => []);
  for (const puff of puffs) {
    buckets[
      Math.min(mass.shades - 1, Math.floor(puff.shade * mass.shades))
    ].push(puff);
  }

  return buckets
    .map((bucket, index) => ({
      puffs: bucket,
      // 段の中央の明るさで代表させる
      color: ramp(mass, (index + 0.5) / mass.shades),
      seed: mass.seed + index * 131,
    }))
    .filter((band) => band.puffs.length > 0);
}

export function CloudMassCloud({
  mass,
  animated,
}: {
  mass: CloudMass;
  animated: boolean;
}) {
  const bands = useMemo(() => buildBands(mass), [mass]);
  const drift = useRef<THREE.Group>(null);
  // 流した距離。clock.elapsedTime ではなく delta の積算で持つ。ブロックの
  // Canvas は画面外・タブ非表示で frameloop が止まるので、止まっているあいだに
  // 進んだことにしたくない(ShootingStar と同じ流儀)
  const shift = useRef(0);

  // <Clouds> は毎フレーム塊の group の matrixWorld を分解し直しているので、
  // group をひとつ動かすだけで粒はまとめて付いてくる。粒には触らない。
  useFrame((_, delta) => {
    const group = drift.current;
    if (!animated || !group) return;

    const span = CLOUD_DRIFT.wrap * 2;
    shift.current = (shift.current + delta * CLOUD_DRIFT.speed) % span;
    // 塊の元の位置に足してから ±wrap の帯へ丸め、その差を group に持たせる。
    // 塊ごとに折り返す位置が違うので、丸めるのは group の offset ではなく
    // ワールドの x のほう。
    // 開いているのは -wrap の側(帯は (-wrap, +wrap])。逆にすると x=+1540 に
    // 置いた塊が t=0 で左端へ飛び、静止画ポスターと食い違う
    const x = mass.position[0] + shift.current;
    const wrapped =
      CLOUD_DRIFT.wrap - ((((CLOUD_DRIFT.wrap - x) % span) + span) % span);
    group.position.x = wrapped - mass.position[0];
  });

  return (
    <group ref={drift}>
      {bands.map((band) => (
        <Cloud
          key={band.seed}
          position={[...mass.position]}
          bounds={[...mass.bounds]}
          segments={band.puffs.length}
          distribute={(_, index) => band.puffs[index]}
          volume={mass.volume}
          growth={animated ? mass.growth : 0}
          speed={animated ? mass.speed : 0}
          opacity={mass.opacity}
          color={band.color}
          seed={band.seed}
          fade={mass.fade}
        />
      ))}
    </group>
  );
}
