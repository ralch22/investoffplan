// AI-drafted, human-editable FAQ content — source of truth for /faq.
export interface FaqTopic {
  slug: string;
  title: string;
  description: string;
  faqs: Array<{ q: string; a: string }>;
}

export const FAQ_TOPICS: FaqTopic[] = [
  {
    "slug": "off-plan-basics",
    "title": "Off-Plan Basics",
    "description": "What off-plan property means in the UAE, how buying before completion works, and the key risks and rewards every first-time investor should understand.",
    "faqs": [
      {
        "q": "What is an off-plan property?",
        "a": "An off-plan property is a home or investment unit purchased directly from a developer before construction is complete — sometimes before it has even begun. Buyers commit based on floor plans, show units, and marketing material, and pay in stages rather than in one lump sum. In Dubai, every off-plan sale must be registered with the Dubai Land Department through the Oqood system, and buyer payments must flow into a RERA-regulated escrow account, which gives the model a formal legal framework rather than being a purely private arrangement with the developer."
      },
      {
        "q": "How are off-plan purchases typically paid for?",
        "a": "Most UAE off-plan projects are sold on staged payment plans such as 20/80, 40/60, or 60/40 — a booking deposit up front, instalments during construction (often linked to milestones like foundation completion or a percentage of build progress), and a final balance at handover. Some developers extend payments beyond completion through post-handover plans. The exact structure is set out in the Sales and Purchase Agreement, so always confirm the schedule, milestone triggers, and any admin fees before signing."
      },
      {
        "q": "Why do investors buy off-plan instead of ready property?",
        "a": "The main draws are entry price and payment flexibility. Off-plan units are typically priced below comparable ready stock in the same area, developers spread payments over the construction period, and early buyers often get first pick of layouts, floors, and views. If the market rises during construction, capital appreciation is earned on the full unit value while only a fraction has been paid. The trade-offs are construction risk, delivery delays, and the fact that rental income only starts after handover."
      },
      {
        "q": "What are the main risks of buying off-plan in the UAE?",
        "a": "The principal risks are project delays, changes to specifications or layouts between brochure and delivery, market movement between purchase and handover, and — in the worst case — project cancellation. Dubai mitigates these through mandatory escrow accounts under Law 8 of 2007, milestone-based fund release, and RERA oversight of developers and projects. Buyers can reduce risk further by choosing developers with strong delivery track records, verifying project registration on the DLD's official channels, and reading the SPA's delay and compensation clauses carefully."
      },
      {
        "q": "What happens if an off-plan project is delayed?",
        "a": "Delays are common and most SPAs give the developer a grace period — often 6 to 12 months beyond the anticipated completion date — before any buyer remedy applies. Beyond that, remedies depend on the contract: some allow compensation, others allow termination and refund of amounts paid. If a project stalls entirely, RERA can intervene, and Dubai has a dedicated committee for cancelled projects that oversees refunds from the escrow account. Always check the anticipated completion date, grace period, and termination clauses before committing."
      },
      {
        "q": "Can I compare multiple off-plan units before deciding?",
        "a": "Yes. On investoffplan.com you can select up to three units from any search results page and open the compare view to see pricing, payment plans, handover dates, and brochure availability side by side. Comparing across projects and developers is one of the most effective ways to sanity-check a deal: price per square foot, payment plan structure, and handover timing can vary significantly between towers in the same district, and side-by-side comparison exposes those gaps quickly."
      },
      {
        "q": "Is off-plan property in Dubai regulated?",
        "a": "Yes, comprehensively. Developers must be registered with the Dubai Land Department and each project approved by RERA before sales can begin. Buyer funds must be deposited into a project-specific escrow account under Law 8 of 2007, released to the developer only against certified construction progress. Every sale is registered in the Oqood interim register, giving the buyer a documented legal interest before the title deed exists. Other emirates, such as Abu Dhabi, operate their own comparable regulatory regimes."
      }
    ]
  },
  {
    "slug": "payment-plans",
    "title": "Payment Plans",
    "description": "How UAE off-plan payment plans work — 60/40, 80/20, construction-linked milestones, booking deposits, and what happens if you miss an instalment.",
    "faqs": [
      {
        "q": "What do payment plan formats like 60/40 or 80/20 mean?",
        "a": "The two numbers show how the price is split between the construction period and handover. A 60/40 plan means 60% is paid in instalments during construction and 40% at handover; an 80/20 plan front-loads more during the build. The reverse also exists — a 20/80 plan keeps most of the payment until completion, which suits buyers planning to mortgage the final balance. Neither format is inherently better: back-loaded plans reduce capital at risk during construction, while front-loaded plans sometimes come with pricing incentives."
      },
      {
        "q": "How large is the typical booking deposit on an off-plan unit?",
        "a": "Booking deposits in the UAE commonly range from 5% to 20% of the purchase price, with 10% being a frequent benchmark, payable when you sign the reservation form or SPA. On top of the deposit, budget for the DLD registration fee of 4% and the Oqood registration charge, which many developers collect at the same time. Confirm in writing whether the deposit is refundable and under what conditions — in most cases it is not once the SPA is executed."
      },
      {
        "q": "What is a construction-linked payment plan?",
        "a": "A construction-linked plan ties each instalment to a verified build milestone — for example 10% at foundation completion, further payments at 20%, 40%, and 60% construction progress, and the balance at handover. Progress is certified by consultants and reflected in RERA's project tracking, so payments track actual delivery rather than the calendar. This structure protects buyers if a project slows, because instalments pause with the construction, unlike time-based plans where payments fall due on fixed dates regardless of site progress."
      },
      {
        "q": "What happens if I miss an off-plan instalment?",
        "a": "Consequences are set by the SPA and by Dubai's property laws, and they scale with how much you have already paid. Developers typically issue notice through the DLD, giving a 30-day period to cure the default. If unresolved, the developer's remedies depend on construction progress — where a project is substantially complete, the developer may retain a significant portion of amounts paid or pursue auction of the unit. Engage the developer early if you foresee difficulty; restructuring an instalment is usually preferable for both sides."
      },
      {
        "q": "Are 1% per month payment plans genuine?",
        "a": "Yes — several UAE developers market plans where the buyer pays roughly 1% of the price each month, often after an initial down payment, stretching the schedule over many years and frequently past handover. They are legitimate, but read the mechanics: the effective total schedule length, whether title transfer is withheld until full payment, any fees rolled into the price, and how resale is handled mid-plan. A long plan lowers the monthly burden but keeps you contractually tied to the developer for longer."
      },
      {
        "q": "Can I negotiate a developer's payment plan?",
        "a": "Often, yes — especially outside launch periods or on slower-moving inventory. Developers may adjust the down payment, shift weight toward handover, extend post-handover terms, or waive admin fees rather than cut the headline price, since payment structure is easier to flex than published pricing. Bulk or repeat buyers have more leverage. Any agreed variation must appear in the SPA itself, not just in an email or broker message, because the registered contract is what governs the transaction."
      }
    ]
  },
  {
    "slug": "golden-visa",
    "title": "Golden Visa via Property",
    "description": "UAE Golden Visa through property investment — the AED 2 million threshold, off-plan and mortgaged property eligibility, family sponsorship, and renewal.",
    "faqs": [
      {
        "q": "How do I qualify for a UAE Golden Visa through property?",
        "a": "The core route is owning property in the UAE worth at least AED 2 million, which qualifies the owner for a 10-year renewable residence visa. The valuation is generally assessed on the official purchase value registered with the land department rather than the current market estimate. The visa is tied to continued ownership: selling below the threshold ends eligibility at renewal. Application runs through the relevant land department and the federal identity authority, with the property title deed as the anchor document."
      },
      {
        "q": "Does off-plan property count towards the Golden Visa?",
        "a": "In Dubai, off-plan property can qualify, subject to the prevailing conditions applied by the Dubai Land Department at the time of application — historically this has included requirements such as purchasing from approved developers and minimum amounts paid. Because eligibility criteria for off-plan and under-construction assets have been adjusted over time, verify the current rules directly with the DLD or a registered service centre before structuring a purchase around the visa. The AED 2 million value threshold applies regardless."
      },
      {
        "q": "Can I get a Golden Visa if the property is mortgaged?",
        "a": "Yes, mortgaged property can qualify, but conditions apply. Dubai has generally required either that the buyer's paid equity meets the threshold or that a bank letter confirms the position, with rules evolving over time — at various points a minimum paid-in amount was specified. The property's registered value must still be at least AED 2 million. Obtain a no-objection or liability letter from the lender and confirm the current equity requirement with the DLD before applying, as the criteria are periodically updated."
      },
      {
        "q": "Can I combine multiple properties to reach AED 2 million?",
        "a": "Yes. Dubai permits combining the value of more than one owned property to reach the AED 2 million threshold, provided all are registered in the applicant's name. Jointly owned property between spouses can also count, typically with documentation such as a marriage certificate, and each spouse may apply where their attributable share meets the rules in force. As with all Golden Visa criteria, the treatment of combined and joint ownership is administrative practice that gets refined, so confirm current requirements before purchase."
      },
      {
        "q": "Who can I sponsor under a property Golden Visa?",
        "a": "A property-based Golden Visa holder can sponsor their spouse and children for residence matching the visa term, and may also sponsor domestic staff. Sponsorship of parents has its own criteria and should be verified case by case. Family members' visas are linked to the principal holder's status, so if the qualifying property is sold and the visa lapses, dependants' residence is affected too. For investors relocating with family, this sponsorship scope is one of the main practical advantages over standard employment visas."
      },
      {
        "q": "Does the Golden Visa require me to live in the UAE?",
        "a": "No minimum stay is required in the way standard residence visas demand. A key feature of the Golden Visa is that it does not lapse if the holder remains outside the UAE for more than six months, which makes it well suited to overseas investors who visit periodically. The visa runs for ten years and is renewable while the qualifying conditions — principally continued ownership of property meeting the threshold — are still satisfied at renewal."
      }
    ]
  },
  {
    "slug": "escrow-and-rera",
    "title": "Escrow & RERA Protection",
    "description": "How RERA escrow accounts under Dubai Law 8 of 2007 protect off-plan buyers, how funds are released, and how to verify a project is registered.",
    "faqs": [
      {
        "q": "What is an escrow account in a Dubai off-plan purchase?",
        "a": "Under Dubai Law 8 of 2007, every off-plan project must have a dedicated escrow account with an approved bank, and all buyer payments for that project must be deposited into it. The developer cannot draw the money freely: funds are released only against certified construction progress, under the supervision of an escrow agent and RERA. This ring-fences buyer money from the developer's general finances, so instalments fund the building you are buying rather than the developer's other ventures or overheads."
      },
      {
        "q": "What is RERA and what does it actually do?",
        "a": "The Real Estate Regulatory Agency is the regulatory arm of the Dubai Land Department. It licenses developers and brokers, approves projects for off-plan sale, supervises escrow accounts, tracks construction progress, regulates service charges through the Mollak system, and publishes the rules governing sales, resales, and cancellations. Before a developer can sell a single off-plan unit, the project must be RERA-registered with land ownership proven and an escrow account in place. For buyers, RERA registration is the baseline legitimacy check."
      },
      {
        "q": "How are escrow funds released to the developer?",
        "a": "Releases are milestone-based. The project's engineering consultant certifies construction progress, the escrow agent verifies documentation, and tranches are released in line with the percentage of work completed under RERA oversight. A portion — commonly 5% — is typically retained for a period after completion to cover defects. Because the developer only accesses money as the building rises, buyers on construction-linked plans have their payments and the developer's drawdowns broadly synchronised with real progress on site."
      },
      {
        "q": "How do I verify that a project and developer are registered?",
        "a": "Use the Dubai Land Department's official channels — the Dubai REST app and the DLD website let you look up registered projects, their RERA project numbers, escrow account details, approved developers, and reported construction progress. A legitimate off-plan listing should state its DLD project number and escrow account, and licensed brokers carry a RERA broker registration number you can check. If a project or sales agent cannot be found through official DLD channels, treat that as a hard stop, not a formality."
      },
      {
        "q": "What protection do I have if a project is cancelled?",
        "a": "If RERA cancels a registered project, the case passes to Dubai's judicial committee for cancelled projects, which oversees liquidation of the escrow account and repayment of buyers from remaining funds. Because buyer money sits in escrow rather than the developer's accounts, cancellation does not automatically mean total loss, although recovery can take time and may not be complete if funds were drawn against genuine construction. This regime, introduced after earlier market cycles, is the central structural protection for off-plan buyers in Dubai."
      },
      {
        "q": "Should I ever pay a developer outside the escrow account?",
        "a": "No. Payments for the unit itself should be made to the project's registered escrow account — the account name and number should appear on your payment instructions and match the DLD's records. Paying into a developer's general account, a broker's personal account, or in unrecorded cash removes the legal protection escrow exists to provide and is a classic fraud pattern. Legitimate ancillary charges, such as DLD fees, are separately documented; when in doubt, verify the account details through DLD channels before transferring."
      }
    ]
  },
  {
    "slug": "fees-and-costs",
    "title": "Fees & Buying Costs",
    "description": "The full cost of buying off-plan in Dubai — DLD 4% transfer fee, Oqood registration, agency commission, admin fees, and what to budget beyond the price.",
    "faqs": [
      {
        "q": "What is the DLD fee on an off-plan purchase?",
        "a": "The Dubai Land Department charges a transfer/registration fee of 4% of the property's purchase price, plus small fixed administrative amounts. On off-plan sales it is normally collected at the time of purchase alongside Oqood registration, and in practice the buyer usually pays the full 4% even though the law contemplates it being shared. Some developers run promotions where they absorb part or all of the DLD fee — genuinely valuable, but verify it is written into the SPA rather than just marketing copy."
      },
      {
        "q": "What is Oqood and what does registration cost?",
        "a": "Oqood is the DLD's interim register for off-plan sales. Because no title deed exists until completion, each off-plan contract is registered in Oqood, creating a documented legal interest for the buyer and preventing the developer from selling the same unit twice. The registration is processed through the developer, and the associated cost is the 4% DLD fee plus a modest fixed admin charge. At handover, the Oqood registration converts into a full title deed in the buyer's name."
      },
      {
        "q": "Do I pay agency commission on an off-plan purchase?",
        "a": "Usually not directly. On new off-plan sales, the developer typically pays the broker's commission, so buying through a registered agent generally costs the buyer nothing extra compared with buying from the developer's own sales office. On secondary-market and resale transactions, the buyer conventionally pays commission of around 2% of the price plus VAT. Always confirm in writing who pays what before signing, and only deal with RERA-registered brokers whose registration number you can verify."
      },
      {
        "q": "What other fees should I budget for beyond the price?",
        "a": "Beyond the 4% DLD fee, expect Oqood or title registration admin charges, developer administrative fees, and at handover: utility connection deposits (DEWA in Dubai), possibly district cooling deposits, and the first service charge instalment. If you finance the purchase, add mortgage registration at 0.25% of the loan amount, bank arrangement fees, and valuation costs. As a working rule, budgeting roughly 6-8% of the purchase price for total transaction and move-in costs keeps most buyers out of trouble."
      },
      {
        "q": "Is there property tax or capital gains tax in Dubai?",
        "a": "The UAE levies no annual property tax, no capital gains tax on personal property sales, and no tax on rental income for individual owners. The main government charges are transactional — the 4% DLD fee on purchase — plus the housing fee added to utility bills for occupied properties in Dubai, calculated as a percentage of annual rental value. Foreign investors should separately check their home country's tax treatment of overseas property income and gains, which the UAE's regime does not remove."
      },
      {
        "q": "When during an off-plan purchase are the fees actually due?",
        "a": "The typical sequence: booking deposit at reservation; the 4% DLD fee and Oqood admin charge shortly after, when the sale is registered; instalments per the payment plan during construction; then at handover, the final balance, developer handover admin fees, utility and cooling deposits, and the first service charge billing. Mortgage-related fees fall due when the loan is arranged. Ask the developer for a full fee schedule in writing at reservation stage so nothing surfaces as a surprise at handover."
      }
    ]
  },
  {
    "slug": "handover-process",
    "title": "Handover Process",
    "description": "What happens at off-plan handover in Dubai — completion notice, inspection, final payment, title deed issuance, and connecting utilities before moving in.",
    "faqs": [
      {
        "q": "What happens when my off-plan property reaches handover?",
        "a": "Once the building receives its completion certificate, the developer issues a handover notice inviting you to inspect the unit, settle the final payment and any outstanding fees, and take possession. The typical sequence is: inspection and snagging, rectification of defects, payment of the handover balance plus deposits, signing the handover documents, key collection, and registration of the title deed with the DLD. The notice usually gives a defined window to complete these steps, so respond promptly to avoid penalty clauses."
      },
      {
        "q": "Can I inspect the unit before accepting handover?",
        "a": "Yes, and you should. The pre-handover inspection is your opportunity to record defects — finishing flaws, misaligned joinery, plumbing and electrical faults, air conditioning performance — in a formal snagging list the developer must address. Many buyers hire professional snagging companies, which typically inspect systematically and produce a photographic report. Do not feel pressured to sign acceptance on the day; it is normal to require rectification and a re-inspection before taking keys, provided you act within the notice period."
      },
      {
        "q": "When is the final payment due and what does it unlock?",
        "a": "The handover balance — the final percentage in your payment plan — falls due against the completion notice, together with any accrued admin fees, utility deposits, and the opening service charge billing. Paying it entitles you to keys, possession, and the paperwork the DLD needs to issue your title deed. If you are mortgaging the final tranche, coordinate early: the bank will require a valuation of the completed unit and its own documentation, and bank processing time should be built into the handover window."
      },
      {
        "q": "How and when do I receive the title deed?",
        "a": "After the final payment clears and the developer confirms no outstanding liabilities, the Oqood interim registration is converted into a full title deed issued by the Dubai Land Department in your name. The developer usually facilitates the process, and deeds are issued digitally through DLD systems. Timing varies from days to a few weeks after handover formalities complete. If you bought with a mortgage, the deed is issued with the bank's mortgage registered against it until the loan is discharged."
      },
      {
        "q": "How do I connect DEWA and district cooling at handover?",
        "a": "In Dubai you register the unit with DEWA for electricity and water, paying a refundable security deposit — commonly AED 2,000 for apartments and AED 4,000 for villas — plus connection fees, which requires your title or handover documents. Many towers also use district cooling providers, which involve a separate account, deposit, and sometimes demand charges worth checking in advance because they affect running costs. Building access, move-in permits, and community registration are handled with the owners' association management."
      },
      {
        "q": "What if I am overseas at handover time?",
        "a": "Handover can be completed remotely through a power of attorney granted to a representative — commonly a family member, conveyancer, or property management firm — who inspects, signs, and collects keys on your behalf. The POA should be properly notarised; documents executed abroad generally need attestation and legalisation for use in the UAE. Many investors also appoint a snagging company and a property manager in parallel, so the unit moves from handover to the rental market without the owner ever flying in."
      }
    ]
  },
  {
    "slug": "mortgages-for-off-plan",
    "title": "Off-Plan Mortgages",
    "description": "Financing off-plan property in the UAE — 50% LTV caps under construction, handover finance, eligibility for residents and non-residents, and timing.",
    "faqs": [
      {
        "q": "Can I get a mortgage on an off-plan property?",
        "a": "Yes, but with tighter limits than ready property. Under UAE Central Bank rules, lending against property under construction is capped at 50% loan-to-value, so the buyer funds at least half from their own resources during the build. In practice, many buyers self-fund the construction instalments and mortgage only the final handover payment, at which point the completed unit can be financed at standard ready-property LTVs. Bank appetite also varies by developer and project, so pre-check with lenders early."
      },
      {
        "q": "How does financing the handover payment work?",
        "a": "On back-loaded plans such as 20/80 or 40/60, buyers commonly pay the construction instalments in cash and arrange a mortgage a few months before completion to cover the handover balance. The bank values the finished unit, lends against it at ready-property ratios, and pays the developer directly at handover, with the mortgage registered on the new title deed. Start the application two to three months before the expected completion notice, because valuation, approvals, and DLD mortgage registration all take time."
      },
      {
        "q": "What are the standard UAE mortgage limits I should know?",
        "a": "Key regulatory parameters: maximum term of 25 years; loan-to-value caps that vary by borrower type and property value for ready homes, with under-construction property capped at 50% LTV; and affordability rules limiting total debt repayments relative to income. Non-residents can obtain UAE mortgages from selected banks, typically at lower LTVs than residents. Rates, fees, and early settlement terms differ meaningfully between lenders, so compare offers rather than defaulting to the developer's partner bank."
      },
      {
        "q": "Do developers offer their own financing alternatives?",
        "a": "Effectively, yes — extended and post-handover payment plans function as developer financing. Instead of borrowing from a bank, the buyer pays the developer in instalments stretching past completion, usually interest-free on paper with the cost embedded in the price. Some developers also maintain tie-ups with banks offering pre-approved terms on their projects. Compare the true cost: a developer plan avoids bank fees and income checks, but a mortgage may be cheaper overall and delivers a clean title deed at handover."
      },
      {
        "q": "Are UAE mortgage rates fixed or variable?",
        "a": "Both exist. Banks commonly offer an initial fixed period — often one to five years — after which the loan reverts to a variable rate priced off EIBOR plus a margin. Rate levels move with global and local monetary conditions, so treat any specific figure as a snapshot and obtain current quotes from several banks when you are ready to apply. Beyond the headline rate, weigh arrangement fees, life and property insurance requirements, early settlement charges, and the reversion margin, which drives long-term cost."
      },
      {
        "q": "What documents do banks require for an off-plan mortgage?",
        "a": "Expect to provide passport and Emirates ID (or passport alone for non-residents), proof of income such as salary certificates or audited financials for the self-employed, six months of bank statements, existing liability details, and the property paperwork — SPA, Oqood registration, and payment receipts. Banks then run affordability checks under Central Bank rules and instruct a valuation. Pre-approval before you commit to a unit is sensible, since it confirms your borrowing capacity and speeds up completion when the handover notice arrives."
      }
    ]
  },
  {
    "slug": "foreign-buyers",
    "title": "Foreign Buyers",
    "description": "How non-residents and expats buy UAE off-plan property — freehold zones, remote purchases, taxes, inheritance planning, and repatriating rental income.",
    "faqs": [
      {
        "q": "Can foreigners buy property in Dubai?",
        "a": "Yes. Foreign nationals — resident or not — can buy freehold property in Dubai's designated freehold areas, which include most of the districts investors know: Downtown, Dubai Marina, Palm Jumeirah, Business Bay, JVC, Dubai Hills, and many more. Ownership is full freehold: the buyer holds the title deed, can sell, lease, or mortgage the property, and can pass it to heirs. Outside designated areas, ownership is generally restricted to UAE and GCC nationals, so confirm zone status before reserving."
      },
      {
        "q": "Do I need a UAE residence visa to buy off-plan?",
        "a": "No. Non-residents can buy off-plan property on exactly the same freehold basis as residents; a passport is the core identity document for reservation and Oqood registration. Ownership does not itself require residency, though property at or above AED 2 million can qualify the owner for a Golden Visa, and lower-value property has historically supported shorter investor visas under conditions that change periodically. Payments can be made from overseas accounts, though a local account simplifies instalments and rental collection later."
      },
      {
        "q": "Can I complete an off-plan purchase entirely from abroad?",
        "a": "Yes — remote purchase is routine. Reservation and SPA signing are commonly handled electronically, payments can be wired from overseas, and where in-person steps arise, a notarised and legalised power of attorney lets a representative act for you, including at handover. Verify everything independently: confirm the project's DLD registration, pay only into the registered escrow account, and use a RERA-registered broker. The formal registration systems — Oqood and later the title deed — protect remote buyers the same as local ones."
      },
      {
        "q": "What taxes will I face as a foreign owner?",
        "a": "In the UAE itself: no annual property tax, no capital gains tax on personal sales, and no tax on individual rental income — the main charges are the 4% DLD fee at purchase and the housing fee tied to occupied properties. Your home country is the bigger variable: many jurisdictions tax residents on worldwide income and gains, so UAE rental income or a sale profit may be reportable there. Take advice in your country of tax residence before structuring a purchase."
      },
      {
        "q": "What happens to my UAE property when I die?",
        "a": "Inheritance is a planning point for foreign owners because UAE default rules can apply Sharia-based distribution in the absence of arrangements. Non-Muslim expatriates can register wills covering UAE assets — through the DIFC Wills Service Centre or Dubai Courts — which allows their estate to pass according to their own wishes and can name guardians for minor children. For meaningful property holdings, registering a will is inexpensive relative to the certainty it buys and is widely recommended by practitioners."
      },
      {
        "q": "Can I repatriate rental income and sale proceeds freely?",
        "a": "Yes. The UAE has no exchange controls, so rental income and sale proceeds can be converted and transferred abroad freely, and the dirham's US dollar peg removes local currency volatility from that leg. Practicalities: banks apply standard compliance checks on large transfers, so keep clean documentation — title deed, tenancy contracts, sale documents — and a UAE bank account makes collection and transfer smoother. Any tax due on that income sits with your home jurisdiction, not the UAE."
      }
    ]
  },
  {
    "slug": "resale-and-assignment",
    "title": "Resale & Assignment",
    "description": "Selling off-plan before completion in Dubai — assignment rules, developer NOCs, minimum payment thresholds, transfer fees, and how Oqood transfers work.",
    "faqs": [
      {
        "q": "Can I sell an off-plan property before handover?",
        "a": "Yes — this is called an assignment or off-plan resale: you transfer your rights under the SPA to a new buyer before the unit completes. It is a recognised, DLD-registered transaction, not a grey-market flip. Two conditions dominate: you must have paid the developer's minimum threshold (commonly 30-40% of the price, set in the SPA), and the developer must issue a No Objection Certificate. The new buyer takes over the remaining payment plan and is registered in Oqood in your place."
      },
      {
        "q": "What is a developer NOC and why is it required?",
        "a": "The No Objection Certificate is the developer's formal consent to transfer the contract. Before issuing it, the developer verifies you have met the minimum payment threshold, are current on instalments, and have no outstanding liabilities. Developers charge an NOC or transfer administration fee, which varies by developer and should be confirmed early because it affects deal economics. Without the NOC, the DLD will not register the assignment, so obtaining it is a hard prerequisite, not an optional courtesy."
      },
      {
        "q": "What fees apply when assigning an off-plan unit?",
        "a": "Expect the developer's NOC/transfer fee, the DLD's registration charges for the transfer, and broker commission if an agent sourced the buyer. A recurring negotiation point is the 4% DLD fee: it was paid on the original registration, and depending on the developer and how the transfer is processed, the new buyer typically pays registration on the transaction — allocate this explicitly in the agreement. Sellers should net all costs against the premium before concluding a resale is worthwhile."
      },
      {
        "q": "How is the price of an off-plan resale structured?",
        "a": "The buyer typically pays the seller the amount already paid to the developer plus (or minus) a negotiated premium reflecting market movement since launch, then assumes the remaining instalments on the original plan. Example: on an AED 2M unit with 40% paid, the buyer might pay the seller AED 800,000 plus an agreed premium, then owe the developer the outstanding 60%. Well-bought units in appreciating projects can command meaningful premiums; oversupplied phases can trade at or below the original price."
      },
      {
        "q": "What should a buyer check before purchasing an assignment?",
        "a": "Verify the seller's payment history directly with the developer — every instalment receipted, no penalties accrued; confirm the Oqood registration matches the seller's name; obtain the original SPA and read the remaining obligations you are assuming, including any post-handover terms; confirm the developer's NOC conditions and fees; and check current construction progress against the anticipated completion date via DLD channels. An assignment transfers the contract as it stands, so any defaults or disputes attached to it become the buyer's problem."
      },
      {
        "q": "Do developers ever restrict off-plan resales?",
        "a": "Yes. Beyond the standard minimum-payment threshold, some SPAs impose additional conditions: holding periods, caps on resales before a construction stage, or approval discretion designed to discourage speculative flipping during launches. These clauses are enforceable because the NOC gives the developer a control point. If your strategy involves an early exit, read the assignment clause before you sign the original SPA and favour developers whose transfer terms are transparent and reasonably priced."
      }
    ]
  },
  {
    "slug": "service-charges",
    "title": "Service Charges",
    "description": "Dubai service charges explained — what they cover, the AED per square foot model, RERA's Mollak oversight, sinking funds, and budgeting as an owner.",
    "faqs": [
      {
        "q": "What are service charges and what do they cover?",
        "a": "Service charges are the annual fees owners pay for operating and maintaining the building and community: cleaning, security, concierge, landscaping, pool and gym upkeep, lift maintenance, common-area utilities, chiller infrastructure in many towers, building insurance, and management fees. They also fund a reserve (sinking) fund for future capital works such as facade repairs or lift replacement. Charges are levied per square foot of your unit, so larger units pay proportionally more for the same building."
      },
      {
        "q": "How much are service charges in Dubai?",
        "a": "They vary widely with building type and amenity load. As a commonly cited range, service charges run from roughly AED 10-30 per square foot per year: villas and townhouses at the low end, mainstream apartment towers in the middle, and amenity-rich or luxury towers — full pools, spas, extensive facilities, prime districts — at the top or above. Always obtain the actual approved rate for a specific building from the developer or through DLD channels rather than relying on area averages, and factor it into yield calculations."
      },
      {
        "q": "Who sets service charges and can developers charge whatever they like?",
        "a": "No. In Dubai, service charge budgets are regulated by RERA through the Mollak system: the owners' association management submits an annual budget, RERA reviews and approves it, and only approved charges can be billed to owners. Invoices are issued through Mollak, creating an auditable record. This framework was introduced precisely to stop arbitrary increases, and owners can query budgets and raise disputes through the DLD if charges appear unjustified relative to services delivered."
      },
      {
        "q": "When do I start paying service charges on an off-plan unit?",
        "a": "Liability generally begins at handover, when you take possession — not during construction. Expect the first billing at or shortly after handover, sometimes covering a part-year period, and note that developers usually require service charge accounts to be current before issuing NOCs for resale or before certain community services are provided. When comparing off-plan projects, ask for the estimated service charge rate up front: a low purchase price in a high-charge tower can materially change the net yield picture."
      },
      {
        "q": "What is the sinking fund portion of my service charge?",
        "a": "Part of each year's charge is allocated to a reserve fund for major, infrequent capital expenditure — lift overhauls, facade and waterproofing works, chiller replacement, repainting. A healthy, professionally assessed reserve fund protects owners from sudden one-off levies when big items fall due and supports long-term asset value. When assessing a building, ask about the reserve fund balance and study: chronically underfunded reserves in ageing towers are a red flag that future special assessments may land on owners."
      },
      {
        "q": "What happens if an owner does not pay service charges?",
        "a": "Non-payment accrues as a formal debt recorded through Mollak. Practical consequences escalate: the management can restrict access to facilities, the DLD will withhold the NOCs needed to sell or transfer the unit until arrears are settled, and management can pursue recovery through Dubai's legal channels, ultimately including action against the unit. For buyers of resale property, this is why checking for service charge arrears is a standard due diligence step — clearance is required before transfer completes."
      }
    ]
  },
  {
    "slug": "rental-yields",
    "title": "Rental Yields",
    "description": "Understanding rental yields on UAE off-plan property — gross versus net, what drives returns, short-term letting rules, and how to estimate realistically.",
    "faqs": [
      {
        "q": "How do I calculate rental yield on a property?",
        "a": "Gross yield is annual rent divided by purchase price, expressed as a percentage — AED 80,000 rent on an AED 1.2M unit is roughly 6.7% gross. Net yield deducts the owner's running costs: service charges, maintenance, management fees, insurance, and an allowance for vacancy between tenancies. Net is the number that matters for comparing investments, and the gap between gross and net varies a lot by building — a high-service-charge tower can turn an attractive gross figure into a mediocre net one."
      },
      {
        "q": "What rental yields can I expect in Dubai?",
        "a": "Dubai has historically offered gross yields that compare favourably with major global cities, with affordable and mid-market districts typically out-yielding prime luxury areas on a percentage basis — prime tends to compensate through capital values. Actual figures move with market cycles, supply pipelines, and rents, so treat any specific number as dated the moment it is printed. For a live view, check current asking rents against asking prices for comparable units in your target building rather than relying on citywide averages."
      },
      {
        "q": "Do off-plan properties earn anything before handover?",
        "a": "No — there is no rental income during construction, which is the structural trade-off of off-plan investing: your capital works through (potential) price appreciation during the build, and cash yield only begins once the unit is handed over and tenanted. Factor the construction period into your return maths: a unit bought 20% below ready-market pricing but delivering in three years must be compared against the rent a ready unit would have generated over those same three years."
      },
      {
        "q": "What factors most affect the yield a unit achieves?",
        "a": "Location and transport access, building quality and amenities, unit size and layout — smaller units generally yield more per dirham than large ones — service charge levels, competition from new supply in the same district, and the quality of property management all move the needle. Chiller arrangements matter too: whether cooling is paid by tenant or owner changes net returns. Buying well at launch pricing is the single biggest lever, since yield is anchored to what you paid, not what the unit is worth."
      },
      {
        "q": "Can I let my Dubai property short-term on platforms like Airbnb?",
        "a": "Yes, Dubai permits short-term holiday-home letting, but it is regulated: the unit must be licensed as a holiday home through the Department of Economy and Tourism's system, either directly by the owner or via a licensed operator, with fees, standards, and tourism dirham obligations attached. Some buildings and communities restrict short-term rentals through their own rules, so confirm both the regulatory position and the building's stance. Short-term can outperform long-term letting in the right locations, but with higher management costs and occupancy variability."
      },
      {
        "q": "How should I estimate the yield on an off-plan unit realistically?",
        "a": "Work from evidence, not brochures: find current asking and contracted rents for comparable completed units in the same district and quality band, apply them to your total acquisition cost — price plus the 4% DLD fee and other costs — then deduct realistic service charges, management fees, and a vacancy allowance to reach net yield. Stress-test with rents 10-15% lower to cover the risk that heavy supply delivers alongside your building. Treat developer-advertised guaranteed returns as marketing to be scrutinised, not underwriting."
      }
    ]
  },
  {
    "slug": "developer-due-diligence",
    "title": "Developer Due Diligence",
    "description": "How to vet a UAE developer before buying off-plan — track record, RERA registration, escrow checks, SPA red flags, and delivery history that matters.",
    "faqs": [
      {
        "q": "How do I check a developer's track record?",
        "a": "Look at what they have actually delivered, not what they have announced: completed projects, whether they handed over on or near schedule, and the build quality of towers now several years old — visit one if you can, or study resale listings and community reviews. The DLD's channels show a developer's registered projects and construction progress on active ones. A developer with multiple completed, well-maintained communities and reasonable delay history is a categorically different risk from a newly formed entity on its first tower."
      },
      {
        "q": "What official registrations should a legitimate project have?",
        "a": "In Dubai: the developer registered with the DLD, the specific project registered with RERA and carrying a project number, an approved escrow account with a named bank, and evidence of land ownership or development rights. All of this is checkable through the Dubai REST app and DLD website before you pay anything. Sales agents should hold RERA broker registration. If any element is missing or the sales team is evasive about project numbers and escrow details, walk away — compliant developers volunteer this information."
      },
      {
        "q": "What are the biggest red flags when evaluating a developer?",
        "a": "Requests to pay outside the registered escrow account; a project marketed before RERA registration; heavy discounting paired with pressure tactics and expiring-today offers; a launch pipeline far larger than the developer's delivery history; vague or missing anticipated completion dates; SPAs with one-sided clauses — unlimited delay tolerance, broad specification-change rights, punitive default terms; and a track record of stalled or quietly rebranded projects. Any single flag warrants questions; several together warrant choosing a different developer."
      },
      {
        "q": "What should I scrutinise in the SPA before signing?",
        "a": "Focus on: the anticipated completion date and the developer's grace period; compensation or exit rights if delays exceed it; how the unit's area is measured and what happens if the delivered area differs; the developer's rights to vary specifications, layouts, or materials; default and termination clauses on both sides; assignment/resale conditions and fees; post-handover obligations; and the defect liability terms. Off-plan SPAs are largely standardised per developer but not identical across the market — paying a lawyer to review one is cheap insurance on a seven-figure commitment."
      },
      {
        "q": "Does a big developer name guarantee a safe purchase?",
        "a": "It reduces certain risks — established master developers have deep delivery infrastructure, financing strength, and reputational incentives — but it does not eliminate delays, quality variation between projects, or the risk of overpaying at a hyped launch. Conversely, some smaller boutique developers deliver excellent quality. Brand is one input; project-level checks still matter: this project's registration, this escrow account, this SPA, this location's supply pipeline, and this launch price against comparable ready stock. Diligence is per-project, not per-logo."
      },
      {
        "q": "How can I monitor construction progress after buying?",
        "a": "Use the DLD's official project tracking, which reports RERA-registered construction progress percentages, alongside the developer's own updates — most reputable developers send periodic progress reports with photos, and construction-linked payment demands themselves signal certified milestones. Site visits or third-party photography services add ground truth for overseas owners. If official progress stalls across multiple reporting periods or instalment demands stop matching visible progress, engage the developer formally and know your SPA's delay provisions before the situation drifts."
      }
    ]
  },
  {
    "slug": "dubai-vs-other-emirates",
    "title": "Dubai vs Other Emirates",
    "description": "Comparing off-plan investment across the UAE — Dubai, Abu Dhabi, Sharjah, and Ras Al Khaimah on regulation, foreign ownership, pricing, and liquidity.",
    "faqs": [
      {
        "q": "How does buying off-plan in Dubai differ from Abu Dhabi?",
        "a": "Both emirates allow foreign ownership in designated investment zones and both operate escrow and regulatory regimes for off-plan sales, but under separate authorities and laws: Dubai through the DLD and RERA, Abu Dhabi through its own real estate regulator under ADREC with investment areas such as Yas Island, Saadiyat, and Al Reem. Dubai's market is larger and more liquid with a deeper resale market; Abu Dhabi offers a steadier, government-anchored economy. Fees, registration processes, and ownership structures differ in detail, so never assume Dubai rules apply across the border."
      },
      {
        "q": "Can foreigners buy property in Sharjah, Ras Al Khaimah, or other emirates?",
        "a": "Yes, with emirate-specific rules. Ras Al Khaimah offers freehold ownership to foreigners in designated areas such as Al Marjan Island and Mina Al Arab. Sharjah historically offered non-Arab foreigners long-term usufruct (typically 100-year) rights in approved projects rather than classic freehold, with rules that have been progressively liberalised — verify the current ownership form for any specific project. Ajman, Umm Al Quwain, and Fujairah also have designated foreign-ownership zones. The ownership instrument matters, so confirm exactly what title you receive."
      },
      {
        "q": "Is property cheaper outside Dubai?",
        "a": "Generally yes on a per-square-foot basis: comparable-quality units in Sharjah, Ajman, and Ras Al Khaimah typically price below Dubai, and parts of Abu Dhabi also undercut prime Dubai. Lower entry prices often translate into competitive gross yields. The counterweights are liquidity and depth — Dubai's resale and rental markets are the region's largest, which matters when you exit — plus infrastructure, global brand recognition, and tenant demand. Cheaper entry is only an advantage if the exit market exists when you need it."
      },
      {
        "q": "Does the Golden Visa work the same across all emirates?",
        "a": "The Golden Visa is a federal UAE programme, so the AED 2 million property threshold and the 10-year visa apply nationwide — qualifying property can be in any emirate. The application is processed with the land authority of the emirate where the property sits, so procedural details and supporting documents vary by emirate even though the headline criteria are federal. Investors targeting the visa with a lower budget sometimes look outside Dubai, where AED 2 million buys more property."
      },
      {
        "q": "Which emirate suits which investment strategy?",
        "a": "As a broad framing: Dubai for liquidity, tenant depth, short-term rental potential, and the widest choice of off-plan product; Abu Dhabi for stability, government-sector tenant demand, and select waterfront destinations; Ras Al Khaminah for tourism-led growth around Al Marjan Island, where major hospitality developments have driven investor interest; Sharjah for affordability serving Dubai-commuting tenants. Match the emirate to your exit plan: a hold-for-yield strategy tolerates thinner resale markets better than a strategy relying on selling into strength."
      },
      {
        "q": "Do escrow protections exist outside Dubai?",
        "a": "The main investment emirates operate escrow requirements for off-plan sales — Abu Dhabi mandates project escrow accounts under its real estate law, and Sharjah and Ras Al Khaimah have their own regulatory frameworks — but the maturity, enforcement history, and procedural detail of these regimes differ from Dubai's, which has the longest track record since Law 8 of 2007. Wherever you buy, apply the same tests: confirm the project's registration with the local regulator, identify the escrow bank and account, and pay only into it."
      }
    ]
  },
  {
    "slug": "snagging-and-defects",
    "title": "Snagging & Defects",
    "description": "Snagging inspections and defect liability in Dubai — the 1-year MEP warranty, 10-year structural liability, hiring inspectors, and getting defects fixed.",
    "faqs": [
      {
        "q": "What is snagging and why does it matter?",
        "a": "Snagging is the systematic inspection of a newly completed unit to identify defects before you accept handover — paint and finishing flaws, tiling and grouting issues, misaligned doors and joinery, plumbing leaks, electrical faults, air conditioning performance, balcony drainage, and waterproofing. It matters because your leverage is highest before acceptance: documented snags become the developer's rectification list, whereas issues discovered after you have signed and moved in are easier for a contractor to deprioritise or dispute."
      },
      {
        "q": "What warranty periods apply to a new Dubai property?",
        "a": "Under Dubai's established norms, the developer is liable for structural defects for 10 years from the completion certificate, and for defects in mechanical, electrical, and plumbing installations — air conditioning, wiring, pipework, and similar — for one year. These liability periods are anchored in the legal framework and standard SPA terms rather than optional goodwill. The one-year MEP window is the practical one for most owners: report faults formally and in writing within it, because claims raised afterwards are far harder to enforce."
      },
      {
        "q": "Should I hire a professional snagging company?",
        "a": "For most buyers, yes. Professional inspectors typically survey a unit systematically with thermal imaging, moisture meters, and MEP testing, and produce a photographic report that can run to hundreds of items — far beyond what an untrained walkthrough catches, particularly for hidden issues like poor insulation, ductwork faults, or waterproofing gaps. Fees are modest relative to the purchase price. A formal third-party report also carries more weight with developer handover teams than a hand-written list, and supports re-inspection after rectification."
      },
      {
        "q": "What happens after I submit my snagging list?",
        "a": "The developer's handover or customer care team logs the reported defects and schedules rectification by its contractors, after which you re-inspect — called de-snagging — to confirm items are properly closed rather than cosmetically patched. Agree timelines in writing and keep the full paper trail: original report, correspondence, and the de-snag results. Reasonable defects should not be used to delay handover indefinitely on either side, but you are entitled to have legitimate items rectified; persistent non-performance can be escalated to the DLD."
      },
      {
        "q": "What if serious defects emerge after I have moved in?",
        "a": "Report them to the developer in writing immediately, referencing the applicable liability period — one year for MEP systems, ten for structural matters — and keep dated photographic evidence. Most established developers operate customer-care processes that handle warranty claims routinely. If the developer does not respond, escalation paths include formal complaint to the DLD/RERA and, for significant losses, the Dubai courts, where expert technical reports carry weight. For building-wide defects in common areas, the owners' association management leads the claim."
      },
      {
        "q": "Does snagging apply to common areas too?",
        "a": "Yes, though differently. Your personal snagging covers your unit; common areas — lobbies, lifts, pools, gyms, parking, facades, landscaping — are inspected and taken over from the developer by the owners' association management, which holds the developer to the same defect liability framework on behalf of all owners. Early owners in a new tower benefit from engaging with the OA process, because a rigorous common-area handover affects service charges and long-term building condition far more than any single unit's paintwork."
      }
    ]
  },
  {
    "slug": "post-handover-payment-plans",
    "title": "Post-Handover Payment Plans",
    "description": "Post-handover payment plans in Dubai — how paying after completion works, title deed implications, resale mid-plan, and weighing them against mortgages.",
    "faqs": [
      {
        "q": "What is a post-handover payment plan?",
        "a": "A post-handover payment plan (PHPP) lets you continue paying the developer in instalments after the property is completed and handed over — for example 60% by handover and the remaining 40% spread over two to five years while you occupy or rent out the unit. It is effectively interest-free developer financing: no bank, no income checks, no mortgage registration. Developers use PHPPs as a competitive sales tool, and the financing cost is generally embedded in the purchase price rather than charged separately."
      },
      {
        "q": "How are post-handover plans typically structured?",
        "a": "Common structures include 60/40, 50/50, or 70/30 splits, with the post-handover portion paid quarterly or in scheduled instalments over two to seven years depending on the developer. Some plans blend in rental-offset logic — the unit's rental income servicing the instalments — which is the core appeal for investors: the property can become partially self-funding from handover. Review the schedule carefully for balloon payments, admin fees per instalment, and what constitutes default once you have taken possession."
      },
      {
        "q": "Do I get the title deed while still paying a post-handover plan?",
        "a": "Usually not a clean one. Developers protect the outstanding balance, most commonly by withholding title transfer until full payment — leaving the unit on Oqood-style registration — or by registering the title with an encumbrance in the developer's favour. Practically, you occupy and can usually rent the unit, but you cannot sell or mortgage it freely without settling or obtaining developer consent. Confirm the exact title mechanics in the SPA, because they determine your flexibility for the plan's entire duration."
      },
      {
        "q": "Can I rent out or sell a unit during the post-handover period?",
        "a": "Renting is generally permitted and is the whole investor logic of PHPPs — tenant income offsets instalments; check the SPA for any consent requirements. Selling is more constrained: because the developer holds title or an encumbrance, a sale requires settling the outstanding balance (often from the sale proceeds at transfer) and the developer's NOC, with associated fees. It is workable and happens routinely, but budget the NOC costs and factor the outstanding balance into your minimum acceptable sale price."
      },
      {
        "q": "Post-handover plan or mortgage — which is better?",
        "a": "A PHPP wins on accessibility: no interest line, no bank approval, no income documentation, and availability to buyers a bank might decline. A mortgage wins on flexibility and often on true cost: you get a clean title deed at handover, can sell or refinance freely, and a competitive mortgage rate may undercut the premium embedded in PHPP pricing. Compare the PHPP project's price against similar non-PHPP stock to estimate that premium, then weigh it against mortgage interest, fees, and your own eligibility."
      },
      {
        "q": "What happens if I default during the post-handover period?",
        "a": "Default after handover is contractually serious because the developer retains title or an encumbrance as security. SPAs typically provide for notice periods and late-payment charges, escalating to termination remedies under which the developer can reclaim the unit and retain a significant portion of amounts paid, subject to Dubai's legal framework and DLD procedures. Since you may be living in or renting out the property, the disruption is real. If cash flow tightens, approach the developer early — rescheduling instalments is commonly negotiable."
      }
    ]
  }
];

export function getFaqTopic(slug: string): FaqTopic | undefined {
  return FAQ_TOPICS.find((topic) => topic.slug === slug);
}
