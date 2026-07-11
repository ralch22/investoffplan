import { ContactCtaForm } from "@/components/contact-cta-form";

const INFO_ITEMS = [
  { label: "Project Brochure", icon: "📖" },
  { label: "Payment Plans", icon: "📋" },
  { label: "Floor Plans", icon: "▦" },
  { label: "Available Units", icon: "⌂" },
];

export function ContactCta() {
  return (
    <section className="bg-surface-darker py-16 text-white">
      <div className="mx-auto grid grid-cols-1 max-w-[1200px] gap-10 px-5 md:grid-cols-2 md:items-center md:px-8">
        <div className="overflow-hidden rounded-2xl bg-white text-text-dark shadow-xl">
          <div className="bg-brand px-6 py-4 text-center font-semibold text-white">
            Get information on
          </div>
          <ul className="divide-y divide-dashed divide-brand/30">
            {INFO_ITEMS.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 px-6 py-4 text-sm font-medium"
              >
                <span className="text-brand">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-4xl font-semibold">
            Contact us<span className="text-brand">.</span>
          </h2>
          <p className="mt-3 text-white/80">
            Leave your details — we&apos;ll open WhatsApp with a pre-filled message for our team.
          </p>
          <ContactCtaForm />
        </div>
      </div>
    </section>
  );
}