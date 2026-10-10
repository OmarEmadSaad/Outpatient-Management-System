import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/shared/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #e6f0ff 0%, #ffffff 55%, #fff9ea 100%)",
          color: "#181A1E",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "#0067FF",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "56px",
              fontWeight: 700,
            }}
          >
            +
          </div>
          <div style={{ fontSize: "40px", fontWeight: 700, color: "#0067FF" }}>
            {SITE_NAME}
          </div>
        </div>
        <div
          style={{
            marginTop: "48px",
            fontSize: "72px",
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: "980px",
          }}
        >
          We help patients live a healthy, longer life
        </div>
        <div style={{ marginTop: "32px", fontSize: "32px", color: "#4E545F" }}>
          Find a doctor, book an appointment, and manage your visits online.
        </div>
      </div>
    ),
    size
  );
}
