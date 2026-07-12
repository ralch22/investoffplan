import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";


export const alt = "Project Preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const pricedUnits = project.units.filter((u) => u.launchPriceAed > 0);
  const minPrice = pricedUnits.length ? Math.min(...pricedUnits.map((u) => u.launchPriceAed)) : 0;
  const baseUrl = getSiteUrl();
  const backgroundImage = project.imageUrl 
    ? (project.imageUrl.startsWith("http") ? project.imageUrl : `${baseUrl}${project.imageUrl.startsWith("/") ? "" : "/"}${project.imageUrl}`)
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#1a1a1a",
          position: "relative",
        }}
      >
        {/* Background Image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.5,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "60px",
            color: "white",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <div
              style={{
                backgroundColor: "#E60000",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "24px",
                marginRight: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              InvestOffPlan
            </div>
            <div style={{ fontSize: "28px", color: "#ccc", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {project.developer}
            </div>
          </div>
          
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              margin: "0 0 20px 0",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {project.name}
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", fontSize: "32px", color: "#ddd" }}>
            <span>{project.area}</span>
            {minPrice > 0 && (
              <>
                <span style={{ margin: "0 16px", color: "#E60000" }}>•</span>
                <span>From {formatPrice(minPrice, "AED")}</span>
              </>
            )}
            {project.paymentPlan && (
              <>
                <span style={{ margin: "0 16px", color: "#E60000" }}>•</span>
                <span>{project.paymentPlan} Payment</span>
              </>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
