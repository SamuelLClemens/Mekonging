// Tourist ENTRY / VISA guidance per country. Rules DEPEND ON NATIONALITY and change
// often — every screen makes that explicit and links to the official portal. Produced by
// a research + adversarial-verify workflow (WebSearch): official e-visa URLs were checked
// as genuine government domains, and mandatory new arrival forms (Vietnam Digital Arrival
// Card, Laos LDIF) and pending reforms were caught. Guidance only; confirm officially.
export const VISA = {
  "th": {
    "summary": "Entry rules depend on nationality. As of July 2026 the 60-day visa exemption (~93 countries) applies, but an approved reform cutting most to 30 days (and VoA to four nationalities) awaits Royal Gazette publication. All arrivals must file the TDAC online; confirm on official site.",
    "options": [
      {
        "type": "visa-free",
        "who": "~93 exemption nationalities (US, UK, EU, Australia, Canada, Japan, China, etc.); nationality-dependent",
        "duration": "Up to 60 days currently (approved reform reduces ~54 nationalities to 30 days, and Maldives/Mauritius/Seychelles to 15, once gazetted); extendable once +30 days",
        "fee": "Free (extension 1,900 THB)",
        "howApply": "No visa needed; complete the Thailand Digital Arrival Card (TDAC) online at tdac.immigration.go.th within 72h of arrival; carry proof of funds and onward travel"
      },
      {
        "type": "visa-on-arrival",
        "who": "Nationalities still eligible for VoA (notably India, plus others such as Kazakhstan/Saudi Arabia). Pending reform cuts the list to just Azerbaijan, Belarus, Serbia and India. Note: China and Taiwan enter visa-free, not via VoA",
        "duration": "15 days, non-extendable",
        "fee": "2,000 THB, cash only",
        "howApply": "Apply at designated airports/land borders on arrival; TDAC required; proof of funds 10,000 THB/person (20,000/family)"
      },
      {
        "type": "e-visa",
        "who": "Nationalities not eligible for exemption or VoA who want a tourist visa",
        "duration": "60-day single-entry tourist visa (TR), extendable +30 days",
        "fee": "Approx. USD 30-40 / ~1,000-2,000 THB (varies by mission)",
        "howApply": "Apply online in advance at the official portal thaievisa.go.th; no in-person embassy visit for most"
      },
      {
        "type": "visa-required",
        "who": "Nationalities outside the exemption and VoA lists",
        "duration": "Per visa granted",
        "fee": "Varies by visa type",
        "howApply": "Obtain visa before travel via thaievisa.go.th or a Royal Thai Embassy/Consulate"
      }
    ],
    "officialEvisa": {
      "name": "Thailand E-Visa Official Website (Ministry of Foreign Affairs)",
      "url": "https://www.thaievisa.go.th/"
    },
    "landBorderNotes": "Visa-on-arrival and visa exemption are issued at major land crossings from Laos, Myanmar, Cambodia and Malaysia for eligible nationalities; carry the 2,000 THB VoA fee and 10,000 THB (20,000/family) proof-of-funds cash. Land visa-exempt entries are capped (two/year). TDAC required at all crossings. Thailand-Cambodia crossings (e.g. Poipet) reopened but remain tense — verify.",
    "overstay": "500 THB per day, capped at 20,000 THB. Overstays beyond 90 days trigger re-entry bans of 1 to 10 years; voluntary surrender is treated more leniently.",
    "scams": [
      "Fake police or officials demanding to inspect passports then extorting a fine for an alleged visa/overstay violation",
      "Third-party or fake visa/e-visa websites that overcharge or harvest data; only use thaievisa.go.th and tdac.immigration.go.th",
      "'Grand Palace/temple is closed today' tuk-tuk drivers diverting tourists to gem or tailor shops for commission"
    ],
    "asOf": "2026-07-08",
    "sources": [
      {
        "org": "Royal Thai Government - Thailand E-Visa (MFA)",
        "url": "https://www.thaievisa.go.th/"
      },
      {
        "org": "Thai Immigration Bureau - Thailand Digital Arrival Card (TDAC)",
        "url": "https://tdac.immigration.go.th/"
      },
      {
        "org": "U.S. Embassy & Consulate in Thailand - Thai Visas for Americans",
        "url": "https://th.usembassy.gov/thai-visas-for-americans/"
      },
      {
        "org": "U.S. Embassy Thailand - Common Scams to Avoid",
        "url": "https://th.usembassy.gov/common-scams-to-avoid/"
      },
      {
        "org": "Siam Legal - Thailand Approves End of 60-Day Visa-Free Stay",
        "url": "https://siam-legal.com/travel-to-thailand/thailand-approves-end-of-60-day-visa-free-stay/"
      },
      {
        "org": "Insubuy - Thailand Visa Update 2026: New 30-Day Rules",
        "url": "https://www.insubuy.com/thailand-visa-update-2026-30-day-visa-free-stay/"
      }
    ],
    "confidence": "medium"
  },
  "vi": {
    "summary": "Vietnam entry rules depend on nationality; confirm officially. Many use the 90-day e-visa (open to all nationalities); ~23 European nations plus Japan and South Korea get 45 days visa-free, ASEAN 30. Since 15 April 2026 a free Digital Arrival Card is mandatory at major airports.",
    "options": [
      {
        "type": "visa-free",
        "who": "~23 European nations (France, Germany, UK, Italy, Spain, Russia, Nordics, plus the 2025 Resolution-229 group: Belgium, Netherlands, Poland, Switzerland, Czechia, etc.), plus Japan and South Korea",
        "duration": "45 days",
        "fee": "Free",
        "howApply": "No application; enter via an international checkpoint (air, land or sea). Passport valid 6+ months. Digital Arrival Card required at enforced airports."
      },
      {
        "type": "visa-free",
        "who": "ASEAN member-state citizens (Thailand, Malaysia, Singapore, Laos, Cambodia, Indonesia, Philippines, Brunei, Myanmar); Chile and Panama at 30 days",
        "duration": "30 days (varies; some ASEAN 14-30)",
        "fee": "Free",
        "howApply": "No application; enter via an international checkpoint."
      },
      {
        "type": "e-visa",
        "who": "All nationalities/territories (policy extended to every country in 2025); the standard route for travellers without a visa exemption",
        "duration": "Up to 90 days, single or multiple entry",
        "fee": "USD 25 single entry / USD 50 multiple entry",
        "howApply": "Apply online at the official portal evisa.gov.vn; approval typically 3-5 working days; print the e-visa to show on arrival."
      },
      {
        "type": "visa-on-arrival",
        "who": "Travellers arriving by AIR who first obtain a pre-approval letter through a licensed agent (being superseded by the e-visa)",
        "duration": "Commonly 30-90 days depending on the approval letter",
        "fee": "Stamping fee ~USD 25 (single) paid in cash at the airport counter, plus the agent's service fee",
        "howApply": "Obtain pre-approval letter before departure, then collect the visa stamp at a designated international airport. Not available at land borders."
      },
      {
        "type": "visa-required",
        "who": "Travellers whose purpose or length of stay is not covered by exemption/e-visa (e.g. work, some long stays), or those from categories needing an embassy visa",
        "duration": "Per visa type",
        "fee": "Varies by type and mission",
        "howApply": "Apply at a Vietnamese embassy/consulate or via a sponsoring entity."
      }
    ],
    "officialEvisa": {
      "name": "Vietnam National Electronic Visa System (Immigration Department, Ministry of Public Security)",
      "url": "https://evisa.gov.vn/"
    },
    "landBorderNotes": "The e-visa is accepted at 27+ approved land gates (e.g. Moc Bai/Cambodia, Lao Bao/Laos) — confirm your exact gate is listed. Visa-on-arrival pre-approval letters are air-airports only, not land. Carry small USD cash for incidental fees. The free Digital Arrival Card is enforced at major airports, not yet all land gates — verify.",
    "overstay": "Under Decree 282 (from 15 Dec 2025): 1-15 days ~VND 500,000-2,000,000 (~USD 19-76) plus warning; longer overstays escalate to ~VND 40,000,000, with deportation and entry bans possible.",
    "scams": [
      "Third-party 'official-looking' reseller websites that mimic the government portal and charge inflated fees or hidden service charges — apply only at evisa.gov.vn.",
      "'Expedited/urgent processing' upsells promising same-day approval for large extra fees that are unnecessary for standard tourists.",
      "Agents or fixers at land borders demanding extra cash 'stamping' or 'facilitation' payments beyond the official fee."
    ],
    "asOf": "2026-07-08",
    "sources": [
      {
        "org": "Vietnam National Electronic Visa System (Immigration Department)",
        "url": "https://evisa.gov.vn/"
      },
      {
        "org": "Vietnam Immigration - Digital Arrival Card (pre-arrival portal)",
        "url": "https://prearrival.immigration.gov.vn/"
      },
      {
        "org": "U.S. Embassy & Consulate in Vietnam - Vietnamese Visas and Entry/Exit",
        "url": "https://vn.usembassy.gov/vietnamese-visas-and-entry-exit/"
      },
      {
        "org": "Vietnam Tourism (official) - visa exemption for European countries",
        "url": "https://vietnam.travel/things-to-do/viet-nam-waives-visas-citizens-12-countries"
      },
      {
        "org": "Vietnam News - new overstay penalties (Decree 282)",
        "url": "https://vietnamnews.vn/society/1731763/viet-nam-tightens-penalties-for-foreign-overstays-under-new-decree.html"
      }
    ],
    "confidence": "medium"
  },
  "kh": {
    "summary": "Cambodia entry rules depend on nationality; confirm officially. ASEAN citizens generally enter visa-free (14-30 days); most others use the $30 e-visa or visa-on-arrival for 30 days, while a short list must obtain a visa in advance. An e-Arrival card is also required.",
    "options": [
      {
        "type": "visa-free",
        "who": "ASEAN nationals (Brunei, Indonesia, Laos, Malaysia, Philippines, Singapore, Thailand, Vietnam; Myanmar generally excluded)",
        "duration": "14-30 days, varies by nationality",
        "fee": "None",
        "howApply": "No advance visa; passport valid 6+ months. Duration is nationality-specific. Complete the e-Arrival card."
      },
      {
        "type": "e-visa",
        "who": "Most non-ASEAN nationalities (tourist T-class)",
        "duration": "30 days, single entry; valid for entry within ~3 months of issue",
        "fee": "USD $30 (reduced from $36 on 1 Jan 2025), plus card processing; extendable once for 30 days (~$30)",
        "howApply": "Apply online at the official portal evisa.gov.kh; upload photo, pay by card, receive PDF in ~3 business days. Separate e-Arrival card also required."
      },
      {
        "type": "visa-on-arrival",
        "who": "Most non-ASEAN nationalities arriving at international airports (Phnom Penh/Techo, Siem Reap Angkor, Sihanoukville) and many land/sea crossings",
        "duration": "30 days, single entry; extendable once for 30 days",
        "fee": "USD $30 tourist (bring exact USD cash, plus a passport photo)",
        "howApply": "Complete arrival form at the counter, present photo, pay in USD cash."
      },
      {
        "type": "visa-required",
        "who": "A short list of nationalities not eligible for e-visa/VOA (e.g. certain countries in Africa/Middle East/South Asia such as Afghanistan, Bangladesh, Iran, Iraq, Nigeria, Pakistan, Saudi Arabia, Sri Lanka, Sudan)",
        "duration": "Per visa granted",
        "fee": "Set by embassy",
        "howApply": "Apply in advance at a Cambodian embassy/consulate; confirm your nationality's status before travel."
      }
    ],
    "officialEvisa": {
      "name": "eVisa Kingdom of Cambodia - Ministry of Foreign Affairs and International Cooperation",
      "url": "https://www.evisa.gov.kh/"
    },
    "landBorderNotes": "Visa-on-arrival is available at major land crossings; the e-visa is accepted at four land posts - Poipet & Cham Yeam (Thailand), Bavet (Vietnam), Trapeang Kreal (Laos). Bring exact USD cash for VOA plus a passport photo. Thailand-Cambodia crossings reopened after the 2025 dispute but remain tense - verify Poipet/Cham Yeam before travel.",
    "overstay": "USD $10 per day, payable in cash on exit. Overstays of 30+ days require settling the fine plus a ~$30 exit visa, and risk detention, deportation and re-entry bans.",
    "scams": [
      "Poipet visa overcharge: officials/touts demand payment in Thai baht (~1,200-1,500 THB) or add a fake '100 baht stamp fee' versus the official $30.",
      "Fake pre-border 'visa offices': buses drop travellers at unofficial offices near Aranyaprathet charging $5-20 extra to arrange the visa - apply only at the official counter or evisa.gov.kh.",
      "Bogus e-visa websites: third-party lookalike sites impersonating the government portal charge inflated fees; use only evisa.gov.kh."
    ],
    "asOf": "2026-07-08",
    "sources": [
      {
        "org": "Royal Government of Cambodia - Official eVisa Portal (MFAIC)",
        "url": "https://www.evisa.gov.kh/"
      },
      {
        "org": "Cambodia eVisa - Ports of entry list",
        "url": "https://www.evisa.gov.kh/information/port_entry/3"
      },
      {
        "org": "Cambodia e-Arrival (official arrival card)",
        "url": "https://arrival.gov.kh/"
      },
      {
        "org": "VisasNews - Cambodia lowers electronic visa prices ($36 to $30)",
        "url": "https://visasnews.com/en/cambodia-lowers-electronic-visa-prices/"
      },
      {
        "org": "U.S. Department of State - Cambodia Travel Advisory",
        "url": "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Cambodia.html"
      },
      {
        "org": "Government of Canada - Travel Advice for Cambodia",
        "url": "https://travel.gc.ca/destinations/cambodia"
      }
    ],
    "confidence": "medium"
  },
  "la": {
    "summary": "Laos entry rules depend on nationality; confirm officially. ASEAN citizens plus Japan, South Korea, Russia, Belarus, Mongolia and Timor-Leste enter visa-free (30 days); others use the official e-visa or visa-on-arrival. Since 2026 all arrivals must file the Lao Digital Immigration Form (LDIF).",
    "options": [
      {
        "type": "visa-free",
        "who": "ASEAN nationals (Thailand, Vietnam, Cambodia, Singapore, Malaysia, Indonesia, Philippines, Brunei, Myanmar) plus Japan, South Korea, Russia, Belarus, Mongolia, Timor-Leste; Luxembourg/Switzerland get 15 days",
        "duration": "30 days (15 days for Luxembourg/Switzerland)",
        "fee": "Free",
        "howApply": "No visa needed; passport valid 6 months on arrival. Complete the LDIF online within 72h."
      },
      {
        "type": "e-visa",
        "who": "Most other nationalities not visa-exempt and not on the visa-required list",
        "duration": "30-day stay; e-visa valid ~60 days from issue, single entry",
        "fee": "Approx USD 35-52 total (visa fee plus service/processing; varies by nationality)",
        "howApply": "Apply on the official Lao eVisa portal (laoevisa.gov.la), typically 3 business days"
      },
      {
        "type": "visa-on-arrival",
        "who": "Most non-exempt nationalities; reduced fee for Chinese and Vietnamese citizens",
        "duration": "30 days, extendable twice up to 90 days total",
        "fee": "Approx USD 30-45 depending on nationality (about USD 20 for Chinese/Vietnamese); bring USD cash plus one 4x6cm photo",
        "howApply": "At eligible international airports and designated land/rail checkpoints; need a photo and address of accommodation"
      },
      {
        "type": "visa-required",
        "who": "Nationals of ~30+ listed countries (e.g. Afghanistan, Pakistan, Iran, Iraq, Syria and many others) must obtain a visa in advance",
        "duration": "As granted by the issuing mission",
        "fee": "Set by the embassy/consulate",
        "howApply": "Apply at a Lao embassy or consulate before travel"
      }
    ],
    "officialEvisa": {
      "name": "Lao Official Online Visa (Lao eVisa) - Department of Immigration, Lao PDR",
      "url": "https://laoevisa.gov.la/"
    },
    "landBorderNotes": "E-visa and VOA are accepted only at designated checkpoints, not all borders (Thai-Lao Friendship Bridges I-IV, Boten/China, and rail). Some are VOA-only. Carry crisp USD cash (~USD 40) plus small kip surcharges. All arrivals by air or land must also complete the LDIF online within 72h and show its QR code.",
    "overstay": "Overstay is fined per day (commonly cited around USD 10/day; some sources cite higher LAK amounts). No grace period; large fines or blacklisting possible. Pay at airport/border on exit.",
    "scams": [
      "Fake e-visa websites mimicking the official portal that overcharge (reports up to ~USD 135 vs the official ~USD 50); apply only via laoevisa.gov.la",
      "Missing entry-stamp scam - a visa fee is collected at some borders but no entry stamp is given, causing fines on departure; always verify your entry stamp",
      "Unofficial 'stamping/service fees' at land crossings (e.g. Chiang Rai/Thai-Lao borders), including weekend or 'overtime' surcharges"
    ],
    "asOf": "2026-07-08",
    "sources": [
      {
        "org": "Department of Immigration, Lao PDR - Visas",
        "url": "https://immigration.gov.la/en/visas"
      },
      {
        "org": "Lao Official Online Visa (Lao eVisa)",
        "url": "https://laoevisa.gov.la/"
      },
      {
        "org": "Department of Immigration, Lao PDR - Lao Digital Immigration Form (LDIF)",
        "url": "https://www.immigration.gov.la/"
      },
      {
        "org": "U.S. Embassy in Laos - Lao Visa Extension",
        "url": "https://la.usembassy.gov/lao-visa-extension/"
      },
      {
        "org": "Tilleke & Gibbins - Laos Announces Exemptions from Visa Overstay Fines",
        "url": "https://www.tilleke.com/insights/laos-announces-exemptions-visa-overstay-fines/"
      }
    ],
    "confidence": "medium"
  }
};

export function getVisa(cc) { return VISA[cc] || null; }
