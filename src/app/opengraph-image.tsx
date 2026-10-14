import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

export const alt = `${site.ogTitle} — ${site.ogDescription}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [font, logo] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/NotoSansKR-Bold.ttf")),
    readFile(join(process.cwd(), "public/logo.jpg")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#070707",
          color: "#f3e6c4",
          fontFamily: "Noto Sans KR",
          padding: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            border: "2px solid #b8964e",
            padding: "36px 56px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/jpeg;base64,${logo.toString("base64")}`}
            alt=""
            width={460}
            height={460}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 56,
              width: 520,
            }}
          >
            <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.1 }}>
              {site.ogTitle}
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 32,
                lineHeight: 1.5,
                color: "#d9d0be",
              }}
            >
              {site.ogDescription}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Sans KR", data: font, style: "normal", weight: 700 }],
    },
  );
}
