// AI-drafted, human-editable content. Grounded in data/catalog.json (2026-07-07 scrape).
// Edit freely — this file is the source of truth for expanded guide bodies.
import type { ArticleSection } from "./types";

export const GUIDE_BODIES: Record<string, ArticleSection[]> = {
  "understanding-payment-plans": [
    {
      "heading": "How off-plan payment plans work",
      "paragraphs": [
        "An off-plan payment plan splits the purchase price into scheduled instalments across the life of the project instead of requiring the full amount upfront. The near-universal shorthand — 10/70/20, 20/40/40, 10/80/10 — reads as percentages paid at booking, during construction, and at handover. Across the 679 projects in the InvestOffplan catalog that publish a defined structure, 10/70/20 is the single most common plan, and the majority of structures ask for 10 to 20 percent at booking.",
        "Construction instalments are usually linked to milestones — foundation completion, structural completion, a stated percentage of overall progress — although some developers use fixed calendar dates. The distinction matters: milestone-linked schedules naturally slow if construction slows, while date-based schedules keep collecting regardless of progress. Always confirm which type governs your contract."
      ]
    },
    {
      "heading": "The protections behind the plan",
      "paragraphs": [
        "In Dubai, off-plan instalments for registered projects must be paid into a project-specific escrow account regulated under RERA (the Real Estate Regulatory Agency). Developers can only draw funds against certified construction progress, which is the core mechanism protecting buyer capital during the build. Before paying anything, verify that the project is registered with the Dubai Land Department and obtain the escrow account details — payments should go to the escrow account, not to a general developer account.",
        "Your off-plan purchase itself is registered through Oqood, the DLD's interim registration system for properties under construction. The Oqood certificate is your documentary evidence of ownership rights before the title deed is issued at completion. The DLD registration fee of 4 percent of the purchase price applies to off-plan purchases and is payable in addition to the plan instalments — budget for it at the outset, along with administrative charges."
      ]
    },
    {
      "heading": "Choosing a plan shape that fits your cash flow",
      "paragraphs": [
        "Plan structures cluster into three families. Steady plans like 10/70/20 or 10/80/10 spread the bulk of the price across construction, so you arrive at handover nearly paid up — well suited to buyers who will hold and lease, since rental income starts against a small residual. Back-loaded plans like 10/40/50 or 10/30/60 keep committed capital low during the build and concentrate the obligation at handover — useful if you expect future liquidity or intend to finance the balance with a mortgage at completion, but they create a large single cash call.",
        "The third family extends past the keys. Post-handover plans — 81 projects in our catalog publish four-part structures such as 10/35/5/50 — continue instalments for a period after you take possession, letting rental income help service the balance. The flexibility is real, but so is its cost: developers generally price extended plans into the unit, so compare the same product on different plan terms before assuming the longer plan is the better deal."
      ],
      "bullets": [
        "10/70/20 — the market's most common structure: steady build-phase payments, light handover balance",
        "10/40/50 — low commitment during construction, heavy handover obligation",
        "10/80/10 — nearly fully paid by handover; suits hold-and-lease buyers",
        "Post-handover (e.g. 10/35/5/50) — instalments continue after keys; convenience is usually priced in"
      ]
    },
    {
      "heading": "Questions to resolve before signing",
      "paragraphs": [
        "Confirm five things in writing before committing: whether instalments are milestone-based or date-based; the escrow account details registered with the DLD; whether the quoted plan includes or excludes the 4 percent DLD fee and admin charges; what happens to the schedule if handover is delayed; and the contractual consequences of a missed instalment on your side, including cure periods and forfeiture terms under the sale and purchase agreement. A plan's headline split is marketing; these clauses are the actual deal."
      ]
    }
  ],
  "roi-capital-appreciation": [
    {
      "heading": "The two engines of off-plan return",
      "paragraphs": [
        "Off-plan returns come from two distinct engines, and confusing them is the most common analytical mistake buyers make. The first is capital appreciation: the difference between your launch price and the property's value at completion and beyond. The second is rental yield: income earned once the unit is delivered and leased. A purchase can perform well on one engine and poorly on the other, so underwrite them separately.",
        "Off-plan adds a structural amplifier to the first engine: leverage through the payment plan. If you have paid in 40 percent of the price during construction and the property's value rises, your return on the cash actually deployed is larger than the headline price movement. The same arithmetic works in reverse if values fall — payment-plan leverage cuts both ways, which is why entry price discipline matters more in off-plan than in ready property."
      ]
    },
    {
      "heading": "Price per square foot is your primary instrument",
      "paragraphs": [
        "Headline prices mislead because unit sizes vary; AED per square foot is the comparable metric. Current medians in the InvestOffplan catalog run at roughly AED 1,954 per square foot in Dubai and AED 1,883 in Abu Dhabi, with Sharjah near AED 963 and Ras Al Khaimah — repriced by Al Marjan Island's resort pipeline — around AED 2,717. Within Dubai itself, dispersion across districts is wide, which is exactly where the opportunity analysis lives.",
        "The working method: benchmark a launch against completed resale stock in the same district and against competing launches nearby. A launch priced below nearby ready stock offers a visible convergence argument as construction closes the gap. A launch priced above it is asking you to pay today for tomorrow's district — sometimes justified in fast-maturing master plans, but it should be a conscious decision, not an accident."
      ]
    },
    {
      "heading": "Handover timing shapes the return profile",
      "paragraphs": [
        "The delivery calendar is a return variable most buyers ignore. Over half of the 725 projects in our catalog hand over in 2027–2028, peaking at 215 projects in 2028. A unit completing into a district-level delivery peak faces more competing new stock at precisely the moment it seeks its first tenant, which pressures initial rents and absorption time. A unit completing into a thin delivery window in a maturing district faces the opposite, favourable dynamic.",
        "Longer construction runways — 2029 and 2030 handovers — stretch the payment plan further and give the district more time to mature, at the price of more years of execution risk and no income in the interim. Shorter runways deliver income sooner with less completion risk, but most of the payment plan is already consumed. Neither is inherently better; match the runway to whether your priority is capital efficiency or income start date."
      ]
    },
    {
      "heading": "Yield mathematics after handover",
      "paragraphs": [
        "Once delivered, the return conversation becomes a ready-property one: gross rent against total acquisition cost. Compute yield honestly — include the 4 percent DLD fee, admin charges, and annual service charges, which vary meaningfully by project and directly reduce net yield. Service charge levels are published per project and belong in your underwriting before purchase, not after.",
        "Two structural UAE advantages support the net figure: there is no annual property tax, and no personal income tax on rental income. That said, treat any specific yield percentage quoted in marketing material with scepticism — realised yields depend on the rent actually achieved in your building at your handover date, and delivery-wave timing can move that materially in either direction."
      ],
      "bullets": [
        "Underwrite appreciation and yield as separate engines",
        "Compare AED/sqft against district resale and competing launches — not headline prices",
        "Check the district's handover-year supply before buying the unit's handover year",
        "Net yield = rent minus service charges, against price plus 4% DLD and fees",
        "No annual property tax and no income tax on rent support net returns"
      ]
    }
  ],
  "foreign-investor-guide": [
    {
      "heading": "Can foreigners buy UAE off-plan? Yes — in designated zones",
      "paragraphs": [
        "Foreign nationals of any nationality can buy property with full freehold ownership in designated freehold areas of Dubai — a framework in place since 2002 — and in designated investment zones in Abu Dhabi. The overwhelming majority of the off-plan market is built precisely in these zones: districts like Dubai Creek Harbour, Dubai Hills Estate, Dubai South, Jumeirah Village Circle, Al Reem Island and Yas Island all fall within them. Ras Al Khaimah, Sharjah and the other northern emirates operate their own foreign-ownership frameworks covering their flagship master plans, including Al Marjan Island.",
        "Freehold means what it says: you own the property and can sell, lease, or pass it to heirs. There is no requirement to hold UAE residency to buy, and no local partner is needed for freehold-zone residential purchases."
      ]
    },
    {
      "heading": "The buying process, step by step",
      "paragraphs": [
        "The off-plan process is more standardised than most international buyers expect. You reserve a unit with a booking deposit — typically 10 to 20 percent, consistent with the plan structures across our catalog — and sign the developer's sale and purchase agreement (SPA). In Dubai, the purchase is then registered with the Dubai Land Department through Oqood, the interim registration system for under-construction property, which gives you documentary evidence of your ownership rights before the title deed exists.",
        "Your instalments for a registered Dubai project must be paid into a RERA-regulated escrow account, from which the developer can only draw against certified construction progress. This escrow regime is the central buyer protection in the market — verify the project's DLD registration and pay only into the registered escrow account. At completion, you settle the final instalment, take handover, and the title deed is issued in your name."
      ],
      "bullets": [
        "Reserve with booking deposit (typically 10–20%)",
        "Sign the SPA and register via Oqood (Dubai)",
        "Pay instalments into the RERA-regulated escrow account only",
        "Settle the handover balance; title deed issued at completion"
      ]
    },
    {
      "heading": "Costs to budget beyond the price",
      "paragraphs": [
        "The largest transaction cost is the Dubai Land Department registration fee of 4 percent of the purchase price, plus administrative charges; Oqood registration for off-plan carries its own modest fees. Budget also for annual service charges once the property is delivered — these vary by project and matter for net yield. There is no annual property tax and no personal income tax on rental income in the UAE.",
        "Non-resident buyers can access UAE mortgage financing, though off-plan lending is more restricted than ready-property lending and loan-to-value caps are lower for non-residents. Most international off-plan buyers simply use the developer's payment plan as their financing during construction, then decide between cash settlement and a completion mortgage at handover."
      ]
    },
    {
      "heading": "Residency: what property can and cannot get you",
      "paragraphs": [
        "Property investment of at least AED 2 million supports an application for the UAE's 10-year Golden Visa, and qualifying off-plan purchases from approved developers can count toward it. In the current InvestOffplan catalog, 1,379 of 2,241 live unit options — about 62 percent — list at or above that threshold, so the qualifying universe is wide. Lower-value property can support shorter-duration residency options in some emirates.",
        "Treat visa eligibility as a benefit to verify, not a marketing claim to accept: requirements, documentation and the treatment of mortgaged or jointly held property are applied by the authorities at application time, and you should confirm the current position with the DLD or a qualified adviser for your circumstances."
      ]
    },
    {
      "heading": "Diligence rules that protect international buyers",
      "paragraphs": [
        "Four habits separate well-protected foreign buyers from the rest. Verify the developer and project registration with the relevant land department before paying anything. Pay only into the registered escrow account, never a general corporate account. Read the SPA's delay, default and forfeiture clauses — they govern the scenarios that matter. And underwrite the asset on district-level price per square foot, payment plan shape and handover-year supply, exactly as a local buyer would. The UAE's regulatory framework is genuinely protective, but it protects buyers who transact inside it."
      ]
    }
  ]
};
