import { permanentRedirect } from "next/navigation";

/** /insights is the legacy hub URL — /guides is canonical. */
export default function InsightsRedirect() {
  permanentRedirect("/guides");
}
