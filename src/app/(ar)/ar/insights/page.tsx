import { permanentRedirect } from "next/navigation";

/** /ar/insights is the legacy hub URL — /ar/guides is canonical. */
export default function ArabicInsightsRedirect() {
  permanentRedirect("/ar/guides");
}
