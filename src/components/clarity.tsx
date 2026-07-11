"use client";

import Script from "next/script";

const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

/**
 * Microsoft Clarity loader (session recordings + heatmaps). Env-gated like the
 * GA components: renders nothing unless NEXT_PUBLIC_CLARITY_ID is set at build
 * time, so it has no effect on ISR output when unconfigured.
 */
export function Clarity() {
  if (!clarityId) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");`}
    </Script>
  );
}
