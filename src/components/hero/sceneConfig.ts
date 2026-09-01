export const CAMERA = {
  position: [0, 0, 12] as [number, number, number],
  rotation: [0.6, 0, 0] as [number, number, number],
  fov: 55,
} as const;

export const DAY_SKY = {
  top: "#3d8fd9",
  mid: "#8ec9f0",
  bottom: "#eef7fd",
} as const;

export const CLOUDS = [
  { position: [-12, 18, -24] as [number, number, number], scale: 1.1, opacity: 0.75, speed: 0.08, seed: 2 },
  { position: [11, 14, -28] as [number, number, number], scale: 1.3, opacity: 0.65, speed: 0.06, seed: 7 },
  { position: [-4, 6, -22] as [number, number, number], scale: 1.2, opacity: 0.7, speed: 0.07, seed: 13 },
  { position: [6, 24, -32] as [number, number, number], scale: 1, opacity: 0.6, speed: 0.05, seed: 21 },
] as const;

export const STARS = {
  radius: 60,
  depth: 50,
  count: 14000,
  factor: 5,
  saturation: 0.7,
  fade: true,
  speed: 0.6,
} as const;

export const NIGHT_SKY = {
  top: "#101024",
  mid: "#0b0b1a",
  bottom: "#07070f",
} as const;

export const NIGHT_BG = "#07070f";

// マウス追従で視点を振る量(ラジアン)と追従の減衰係数
export const POINTER_LOOK = {
  yaw: 0.45,
  pitch: 0.2,
  damping: 3,
} as const;
