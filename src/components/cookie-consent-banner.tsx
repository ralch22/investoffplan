"use client";

import { useEffect, useRef, useState } from "react";

const CONSENT_KEY = "iop_consent";
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

function loadClarity() {
  if (!clarityId || typeof document === "undefined") return;
  if (document.getElementById("ms-clarity")) return;
  const s = document.createElement("script");
  s.id = "ms-clarity";
  s.async = true;
  s.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`;
  document.head.appendChild(s);
}

function updateConsent(value: "granted" | "denied") {
  // gtag may not be defined yet if GA hasn't loaded; dataLayer push is the
  // canonical way to queue a consent update before the tag fires.
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("consent", "update", {
        analytics_storage: value,
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
      });
    }
    // Persist as a cookie so the /api/leads server-side GA4 MP call can check it.
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${CONSENT_KEY}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
  }
}

function setConsentHeightPx(px: number) {
  document.documentElement.style.setProperty(
    "--consent-h",
    px > 0 ? `${Math.ceil(px)}px` : "0px",
  );
}

/**
 * Cookie consent banner + Consent Mode v2 runtime adapter.
 *
 * On first visit → shows a minimal bottom banner. On accept → updates the
 * gtag consent state to "granted", loads Clarity dynamically (keeping it out
 * of the initial bundle when not consented), and persists the choice.
 * On decline → persists "denied" and hides. On subsequent visits → reads the
 * stored preference and applies the consent update silently without re-showing
 * the banner.
 *
 * Publishes the **measured** banner height to `:root --consent-h` via
 * ResizeObserver so CompareBar / bottom tabs / advisor FAB can lift above
 * multi-line mobile banners (hardcoded 72px understated ~123px at 375px).
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const isAr =
    typeof document !== "undefined" && document.documentElement.lang === "ar";

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved === "granted") {
      updateConsent("granted");
      loadClarity();
    } else if (!saved) {
      setVisible(true);
    }
    // "denied" → banner stays hidden, nothing fires
  }, []);

  // Measure real height while visible; clear when hidden / unmount.
  useEffect(() => {
    if (!visible) {
      setConsentHeightPx(0);
      return;
    }
    const el = bannerRef.current;
    if (!el) return;

    const publish = () => setConsentHeightPx(el.getBoundingClientRect().height);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener("resize", publish);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);
      setConsentHeightPx(0);
    };
  }, [visible]);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "granted");
    updateConsent("granted");
    loadClarity();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "denied");
    updateConsent("denied");
    setVisible(false);
  }

  if (!visible) return null;

  const policyHref = isAr ? "/ar/cookie-policy" : "/cookie-policy";

  return (
    <div
      ref={bannerRef}
      role="dialog"
      data-testid="cookie-consent-banner"
      aria-label={isAr ? "موافقة ملفات تعريف الارتباط" : "Cookie consent"}
      aria-live="polite"
      className="fixed bottom-0 start-0 end-0 z-50 border-t border-border bg-white px-5 py-4 shadow-elevation-md sm:px-8"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {isAr ? (
            <>
              نستخدم ملفات تعريف الارتباط للتحليل والتخصيص.{" "}
              <a
                href={policyHref}
                className="font-semibold text-brand underline hover:no-underline"
              >
                سياسة ملفات تعريف الارتباط
              </a>
            </>
          ) : (
            <>
              We use cookies for analytics and personalisation. See our{" "}
              <a
                href={policyHref}
                className="font-semibold text-brand underline hover:no-underline"
              >
                cookie policy
              </a>
              .
            </>
          )}
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={decline}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
          >
            {isAr ? "رفض" : "Decline"}
          </button>
          <button
            onClick={accept}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {isAr ? "قبول الكل" : "Accept all"}
          </button>
        </div>
      </div>
    </div>
  );
}
