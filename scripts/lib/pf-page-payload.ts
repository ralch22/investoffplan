/**
 * Parsing for one page of Property Finder's new-projects unit view
 * (`__NEXT_DATA__.props.pageProps`), split out from scrape-pf-catalog.ts so the
 * end-of-results rules can be tested without driving a browser at PF.
 *
 * The one rule worth stating up front: an absent `unitLevelListings` key and an
 * empty one mean different things, and treating them alike is what used to kill
 * the weekly ingest at the finish line. See parsePagePayload.
 */

export interface PfUnit {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  propertyType: string;
  bedrooms: number;
  area: { min: number; max: number };
  location: { fullName: string; coordinates?: { lat: number; lng: number } };
  startingPrice: { min: number; max: number };
  paymentPlan: Array<{
    downPayment: number;
    duringConstruction: number;
    handover: number;
    afterHandover: number;
  }>;
  images: Array<{ small?: string; medium?: string; large?: string }>;
  videoAvailable?: boolean;
  developer: { name: string; logo?: string; slug?: string };
  completionDate?: string;
  contactOptions?: Array<{ type: string; value?: string }>;
  listingLevel?: string;
  stockStatus?: string;
}

export interface PfPageResult {
  /**
   * null when PF answered without a `unitLevelListings` key at all. The caller
   * decides what that means — it depends entirely on which page asked.
   */
  units: PfUnit[] | null;
  total: number;
  totalPages: number;
  devList: unknown[];
  developerSerpLinks: Array<{ title: string; path: string }>;
}

export function parsePagePayload(payload: string): PfPageResult {
  const data = JSON.parse(payload);
  const props = data?.props?.pageProps ?? {};

  // Absent is not empty.
  //
  // Measured against live PF on 2026-07-15, all with view=unit_types in the URL:
  //   page 75 -> 24 listings   page 76 -> 13 listings   (75*24 + 13 = 1813 = total)
  //   page 77 -> no key, and a total/pagination of 2889/121 — the *project*
  //             view's numbers, which is what PF quietly falls back to once you
  //             page past the end.
  //
  // So a missing key means "this is not the unit view": either the view param
  // stopped working, or we asked for a page that no longer exists because PF's
  // inventory moved under a ~20-minute scrape. Reading it as [] made the second
  // case look like a fetch failure, and the retry-then-throw that followed
  // discarded every page already collected.
  const listings = props.unitLevelListings;
  const units = Array.isArray(listings) ? (listings as PfUnit[]) : null;

  const meta = props.searchResult?.meta ?? {};
  const devList = props.devList ?? [];
  const developerSerpLinks =
    props.seoData?.developerSerpPages?.links?.map(
      (l: { title: string; path: string }) => ({ title: l.title, path: l.path }),
    ) ?? [];

  return {
    units,
    total: meta?.count?.total ?? units?.length ?? 0,
    totalPages: meta?.pagination?.total ?? 1,
    devList,
    developerSerpLinks,
  };
}
