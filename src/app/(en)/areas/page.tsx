import { permanentRedirect } from "next/navigation";

// IA restructure (SEO plan): /areas is now /communities.
export default function AreasRedirect() {
  permanentRedirect("/communities");
}
