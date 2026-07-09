import { permanentRedirect } from "next/navigation";

// IA restructure (SEO plan): the market-data hub folded into /compare.
export default function MarketDataRedirect() {
  permanentRedirect("/compare");
}
