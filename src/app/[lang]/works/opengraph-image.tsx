import { renderOgImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";

export default function OgImage() {
  return renderOgImage("Works");
}
