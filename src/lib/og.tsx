import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

export function renderOgImage(title?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #101024 0%, #07070f 100%)",
          color: "#f5f5f5",
        }}
      >
        <div style={{ fontSize: 96, fontStyle: "italic", fontWeight: 700 }}>
          Riochin
        </div>
        {title && (
          <div style={{ marginTop: 24, fontSize: 40, color: "#8b8b99" }}>
            {title}
          </div>
        )}
        <div style={{ marginTop: 40, fontSize: 24, color: "#8b7ef0" }}>
          riochin.dev
        </div>
      </div>
    ),
    ogSize,
  );
}
