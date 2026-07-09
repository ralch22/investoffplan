import { permanentRedirect } from "next/navigation";

// IA restructure (SEO plan): /ar/areas is now /ar/communities.
export default function ArAreasRedirect() {
  permanentRedirect("/ar/communities");
}
