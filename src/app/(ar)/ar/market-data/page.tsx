import { permanentRedirect } from "next/navigation";

// IA restructure (SEO plan): the market-data hub folded into /ar/compare.
export default function ArMarketDataRedirect() {
  permanentRedirect("/ar/compare");
}
