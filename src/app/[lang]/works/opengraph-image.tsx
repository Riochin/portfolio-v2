import { renderOgImage, ogSize, ogContentType, ogAlt } from "@/lib/og";
import { LOCALES } from "@/lib/i18n/config";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * 表紙と同じ 1 枚を返す。ファイルを消して親の画像に任せないのは、
 * page の metadata が openGraph を丸ごと上書きするため。
 */
export default function OgImage() {
  return renderOgImage();
}
