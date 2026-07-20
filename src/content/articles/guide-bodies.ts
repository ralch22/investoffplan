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
  ],
  "escrow-and-rera-protections": [
    {
      "heading": "Why your money sits in escrow, not with the developer",
      "paragraphs": [
        "In Dubai, an off-plan developer cannot legally take your instalments into a general company account. Under Law No. 8 of 2007 concerning Escrow Accounts for Real Estate Development, every registered project must have its own escrow account, opened in the name of the project and dedicated exclusively to that project's construction. Buyer payments are deposited there, and — importantly — the law shields those funds from attachment by the developer's own creditors. The account is administered by an accredited escrow agent (a bank), not by the developer.",
        "The Dubai Land Department (DLD) registers and oversees projects, while the Real Estate Regulatory Agency (RERA) — the regulatory arm of the DLD — handles day-to-day supervision. The single most reliable safety check you can make is simple: your payments should be going to a named project escrow account, never to a personal or general corporate account. Confirm the escrow details in writing before you transfer anything."
      ]
    },
    {
      "heading": "How funds are released — and why that protects you",
      "paragraphs": [
        "Escrow is not a lockbox that simply holds cash; it is a milestone mechanism. The developer draws down funds in stages, against construction progress that has been certified — so money is released as the building actually rises, not on the developer's say-so. Before a project can even launch sales, the developer is generally required to commit its own capital: depositing at least 20% of the estimated construction cost into escrow, or providing an equivalent bank guarantee. That requirement is designed to ensure the developer has real skin in the game from day one.",
        "There is also a completion safeguard. Once the developer obtains the building completion certificate, the escrow agent retains 5% of the account's value, releasing it one year after the units are registered in buyers' names. That retention exists to make sure defects visible at completion — or appearing within the first year — get fixed, which ties directly into the defect-liability framework covered in our handover guide."
      ],
      "bullets": [
        "Payments go to a project-named escrow account, administered by a bank — not the developer",
        "Developer draws funds only against certified construction milestones",
        "≥20% of construction cost (or a bank guarantee) committed before sales launch",
        "5% retained after completion, released ~1 year after unit registration, to cover defects"
      ]
    },
    {
      "heading": "What escrow does and does not cover",
      "paragraphs": [
        "Escrow protects the capital you pay toward construction and ties its release to progress; if a registered project is cancelled, RERA can step in and the escrow framework governs how buyer funds are handled. What escrow does not do is guarantee a market outcome, a delivery date, or a resale price — those depend on the developer's execution and on the market. It also only protects you if you transact inside the system: paying into the registered escrow account, on a project registered with the DLD.",
        "Regulations are periodically tightened, and specific thresholds can change. Treat the figures here as the framework's shape, and verify the current escrow rules and a specific project's status directly with the DLD before you commit. For anything turning on your particular contract, take independent legal advice — this guide is general information, not legal advice."
      ]
    }
  ],
  "developer-due-diligence": [
    {
      "heading": "Verify the developer before the brochure convinces you",
      "paragraphs": [
        "Marketing quality tells you nothing about whether a developer is registered. The check that matters takes minutes: confirm the developer is licensed in the official DLD database. The Dubai REST app — the Dubai Land Department's official app, free on iOS and Android — lets you search real-estate companies and see whether a developer is registered. A registered, established developer with a delivery track record is a materially different risk profile from a first-time entity, and the register is where you tell them apart.",
        "Registration is necessary but not sufficient. Look separately at delivery history: has this developer completed projects, and did they hand over on or near the promised dates? Track record is the single best predictor available to a buyer, and it is public information you can assemble from completed-project data and the developer's own portfolio."
      ]
    },
    {
      "heading": "Verify the project, not just the company",
      "paragraphs": [
        "A registered developer can still market a project that is not yet cleared to take your money. Every project must have its own RERA registration/permit number and a dedicated escrow account before the developer can legally accept buyer payments. Ask for the project's RERA number and DLD project number, and confirm the escrow account exists and is in the project's name. Project registration information is intended to be accessible through the Dubai REST app.",
        "When you sign, the sale is registered through Oqood, the DLD's interim registration system for under-construction property; the developer is required to register the contract via Oqood within 90 days. Your Oqood record is your documentary proof of ownership rights before the final title deed is issued at completion — make sure it happens."
      ]
    },
    {
      "heading": "The red flags that should stop a transaction",
      "paragraphs": [
        "Certain signals warrant walking away, or at least pausing until they are resolved. Any of these is a reason to slow down and verify independently before paying:"
      ],
      "bullets": [
        "No RERA registration/permit number for the project, despite active marketing",
        "No DLD project number available",
        "A request to pay into a personal or general company account rather than the named project escrow",
        "Pressure to pay a large booking amount immediately, before you can verify registration",
        "Reluctance to put escrow details, handover dates, or delay terms in writing"
      ]
    },
    {
      "heading": "A five-minute checklist",
      "paragraphs": [
        "Before any payment: (1) find the developer in the DLD register via Dubai REST; (2) confirm the project's RERA and DLD numbers; (3) confirm the escrow account is in the project's name and get the details in writing; (4) confirm your contract will be registered on Oqood within 90 days; and (5) read the SPA's delay, default and forfeiture clauses. None of this requires a lawyer — but for anything on your specific contract that you are unsure about, get independent professional advice. This guide is general information, not legal advice."
      ]
    }
  ],
  "off-plan-risks": [
    {
      "heading": "The real risks — named honestly",
      "paragraphs": [
        "Off-plan buying in Dubai sits inside a genuinely protective regulatory framework, but no framework removes risk — it manages it. Being clear-eyed about the actual risks is what lets you mitigate them. The main ones are construction delay, the possibility of a project being cancelled, market movement between purchase and handover, and handover quality falling short of what was sold. Each has a concrete mitigation, and most of the mitigation happens before you sign, not after."
      ]
    },
    {
      "heading": "Delay and cancellation",
      "paragraphs": [
        "Construction delay is the most common issue: handover slips beyond the contracted date. Your protection is contractual — the SPA's delay clause defines what a delay entitles you to — combined with the escrow structure, which only releases funds against actual progress, so a stalled project cannot keep freely drawing your money. Read the delay clause before signing; it is the document that governs the scenario.",
        "Cancellation is rarer and more serious: a registered project that does not proceed. Here the regulator is central — RERA oversees registered projects, and the escrow framework governs how buyer funds are handled if a project is cancelled. This is precisely why buying only into DLD-registered projects with a live escrow account matters: the protections exist for projects inside the system. Verify registration first (see our due-diligence guide)."
      ]
    },
    {
      "heading": "Market movement and handover quality",
      "paragraphs": [
        "Between purchase and completion, prices can move either way. Payment-plan leverage amplifies both directions: paying a fraction of the price during construction magnifies your return on deployed cash if values rise, and magnifies the downside if they fall. The mitigation is entry-price discipline — benchmark a launch on district-level price per square foot against completed resale stock and competing launches, rather than the headline price. Off-plan is not a guaranteed gain; treat it as a leveraged position and size it accordingly.",
        "Handover quality — the finished unit differing from what was sold — is mitigated by the defect-liability framework and a proper snagging inspection at handover, both covered in our handover guide. Dubai law provides a 10-year structural defect-liability period and a minimum one-year period for non-structural defects, and the 5% escrow retention exists to back exactly this."
      ],
      "bullets": [
        "Delay → read and rely on the SPA delay clause; escrow gates fund release to progress",
        "Cancellation → buy only DLD-registered projects with live escrow; RERA governs cancellations",
        "Market movement → underwrite on district price/sqft; respect payment-plan leverage",
        "Handover quality → snag at handover; the defect-liability period and 5% retention back you"
      ]
    },
    {
      "heading": "Risk is managed by transacting inside the system",
      "paragraphs": [
        "The throughline across every risk is the same: the protections are real, and they apply to buyers who transact inside the framework — registered project, named escrow, contract on Oqood, clauses read before signing. Off-plan is not risk-free, and this guide does not promise any outcome; it maps the risks so you can mitigate them. Verify a specific project's status with the DLD, and take independent professional advice on anything specific to your contract."
      ]
    }
  ],
  "handover-and-snagging": [
    {
      "heading": "What handover actually involves",
      "paragraphs": [
        "Handover is the point at which the developer has obtained the building completion certificate and calls you to take possession. It is not merely collecting keys — it is a transition with legal and practical steps. Your interim Oqood registration is converted to a final title deed issued through the Dubai Land Department, settlement of any outstanding plan balance falls due, and you inspect the unit before you formally accept it. Treat the inspection as the most important thing you do that day.",
        "Do not sign off on acceptance under time pressure. Once you accept the unit, you are agreeing that it matches what was contracted — so the inspection, or snagging, has to happen properly and be documented before you sign."
      ]
    },
    {
      "heading": "Snagging: inspect before you accept",
      "paragraphs": [
        "Snagging is a systematic inspection to find defects before you take ownership: finish issues (hollow or lifting tiles, paint and grouting defects, sealant failures), MEP faults (air-conditioning drainage, electrical earthing, plumbing, smoke-detector commissioning), and any deviation from the specification in your sale-and-purchase agreement. Many buyers engage a professional snagging company; the goal either way is a written, photographed defect list handed to the developer for rectification before acceptance.",
        "Document everything and keep the record. The snag list is not just a to-do for the developer — it is your evidence, and it links directly to the defect-liability period that begins at handover."
      ],
      "bullets": [
        "Check finishes: tiles, paint, grouting, sealant, doors and joinery",
        "Test MEP: AC and drainage, electrical points and earthing, plumbing, smoke detectors",
        "Compare the unit against the SPA specification for any deviations",
        "Deliver a written, photographed snag list; keep a copy as your record"
      ]
    },
    {
      "heading": "The defect-liability period — your post-handover protection",
      "paragraphs": [
        "Dubai law gives buyers of new property a defect-liability period after handover. Under Article 40 of Law No. 6 of 2019, developers carry structural defect liability for 10 years from the completion certificate, and a minimum of one year for non-structural defects (finishes and MEP) from the date of handover. Structural liability covers the primary load-bearing elements — foundations, columns, beams, slabs, load-bearing walls — and waterproofing/façade failures that affect structural integrity; the one-year period covers finish-quality and installation defects.",
        "This is why the snag list and its timing matter: non-structural claims run from handover, so raising defects promptly — ideally at inspection, and certainly within the first year — is how you preserve them. The 5% escrow retention held after completion (released about a year after unit registration) sits behind this framework, backing the developer's obligation to fix defects."
      ]
    },
    {
      "heading": "Before you accept the keys",
      "paragraphs": [
        "A clean handover comes down to a short sequence: inspect thoroughly and snag in writing; have defects rectified or formally logged before you sign acceptance; confirm the title deed is issued in your name through the DLD; and keep every document — SPA, snag list, completion certificate, title deed. Timelines and thresholds in the law can be updated, so verify the current defect-liability position with the DLD, and take independent professional advice on anything specific to your situation. This guide is general information, not legal advice."
      ]
    }
  ]
};
