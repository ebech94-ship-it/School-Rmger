
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "GS Scholar by GodSpeed Technologies";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(
    join(process.cwd(), "public", "gss.jpg")
  );

  const logoSrc = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#071426",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 150,
            background: "white",
            borderRadius: 24,
            marginBottom: 30,
          }}
        >
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
  src={logoSrc}
  width="125"
  height="125"
  alt="GS Scholar Logo"
/>
        </div>

        <div style={{ fontSize: 66, fontWeight: 800 }}>
          GS SCHOLAR
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#D6B45A",
            marginTop: 18,
          }}
        >
          SMART SCHOOL MANAGEMENT
        </div>

        <div
          style={{
            fontSize: 23,
            marginTop: 28,
          }}
        >
          Smarter Processes. Accurate Results. Excellent Outcomes.
        </div>

        <div
          style={{
            width: 180,
            height: 5,
            background: "#D6B45A",
            marginTop: 35,
          }}
        />

        <div style={{ fontSize: 19, marginTop: 20 }}>
          BY GODSPEED TECHNOLOGIES
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
