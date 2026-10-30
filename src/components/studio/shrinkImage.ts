/**
 * 送る前にブラウザで画像を縮める。
 *
 * Vercel の関数は本文 4.5MB までしか受けない。スマホの写真はそれを軽く超えるので、
 * 長辺 2000px に落としてから送る (サーバー側の upload/route.ts が改めて webp に
 * 揃えるので、ここでの形式は何でもよい)。
 *
 * 小さいものはそのまま通す。GIF は動きを保つために触らない
 * (canvas に描くと 1 コマ目だけになる)。HEIC は Chrome が読めないので
 * createImageBitmap が落ちたら元のまま送り、サーバーの sharp に任せる。
 */

const MAX_EDGE = 2000;
/** これ以下ならそのまま送る。縮める価値が無い。 */
const SKIP_UNDER = 1.5 * 1024 * 1024;

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

const EXTENSION: Record<string, string> = {
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export async function shrinkImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  const looksHeic = /hei[cf]/i.test(`${file.type} ${file.name}`);
  if (file.size <= SKIP_UNDER && !looksHeic) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Safari は webp を書けず、頼んでも PNG を返す。そのときは透過が要る PNG 以外を
  // JPEG に落とす (PNG のままだと写真が何 MB にもなる)。
  let blob = await toBlob(canvas, "image/webp", 0.85);
  if (blob && blob.type !== "image/webp" && file.type !== "image/png") {
    blob = await toBlob(canvas, "image/jpeg", 0.9);
  }
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]*$/, "") || "image";
  return new File([blob], `${base}${EXTENSION[blob.type] ?? ""}`, {
    type: blob.type,
  });
}
