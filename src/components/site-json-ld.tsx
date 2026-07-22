import { getSiteUrl } from "@/lib/site-url";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "invest off-plan",
        legalName: "Aria Properties LLC",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description:
          "UAE off-plan property intelligence platform. Catalog of off-plan projects from developers across Dubai and UAE communities, with DLD market data.",
        areaServed: ["Dubai", "United Arab Emirates"],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dubai",
          addressCountry: "AE",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: "+971585276222",
          areaServed: "AE",
          availableLanguage: ["en", "ar"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "invest off-plan",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/projects?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}