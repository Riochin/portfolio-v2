import { renderOgImage, ogSize, ogContentType, ogAlt } from "@/lib/og";
import { LOCALES } from "@/lib/i18n/config";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default function OgImage() {
  return renderOgImage();
}
