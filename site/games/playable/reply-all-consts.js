const DEPARTMENTS = [
  { id: "operations", name: "Operations", shortName: "Ops" },
  {
    id: "information_technology",
    name: "Information Technology",
    shortName: "IT",
  },
  {
    id: "executive_council_office",
    name: "Executive Council Office",
    shortName: "ECO",
  },
  {
    id: "facilities_and_administration",
    name: "Facilities and Administration",
    shortName: "F&A",
  },
  { id: "marketing", name: "Marketing", shortName: "Mktg" },
  {
    id: "constituent_services",
    name: "Constituent Services",
    shortName: "CS",
  },
  { id: "policy", name: "Policy" },
  { id: "finance", name: "Finance", shortName: "Fin" },
  { id: "human_resources", name: "Human Resources", shortName: "HR" },
  { id: "legal", name: "Legal" },
  { id: "m4_agency", name: "M4 Agency", shortName: "M4" },
  { id: "digital_technology", name: "Digital Technology", shortName: "DT" },
];

const DEPARTMENT_BY_ID = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));

function getDepartmentShortName(deptId) {
  const dept = DEPARTMENT_BY_ID[deptId];
  if (!dept) return "";
  return dept.shortName || dept.name || "";
}

const CONTACTS = [
  {
    id: "cc_telly_operations",
    name: "Telly",
    title: "Intern",
    rarity: "common",
    departmentId: "marketing",
    employeeId: "telly_marketing",
    loopInText:
      "I'm looping in <strong>{name}</strong> to generate a contact report for this thread.",
    eff: {
      singleDmg: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_brit_marketing",
    name: "Brit",
    title: "Social Harmony Lead",
    rarity: "common",
    departmentId: "marketing",
    employeeId: "brit_marketing",
    loopInText:
      "I'm looping in <strong>{name}</strong> to assess the vibes and ensure brand synergy.",
    eff: {
      retaliation: 5,
      deflect: -2,
    },
    usedBy: null,
  },
  {
    id: "cc_elsie",
    name: "Elsie",
    title: "The Baby",
    rarity: "rare",
    departmentId: "legal",
    loopInText: "Look at <strong>{name}</strong>! Isn't she adorable?",
    eff: {
      dodge: 0.25,
      specialTriggerText:
        "Thread distracted by {name}'s cuteness! No standing lost.",
    },
    usedBy: null,
    noShop: true,
    noTraining: true,
  },
  {
    id: "cc_tater_the_dog",
    name: "Tater the Dog",
    title: "Poopus",
    rarity: "rare",
    departmentId: "facilities_and_administration",
    loopInText: "I'm looping in <strong>{name}</strong>! She's a dog.",
    eff: {
      followUpChance: 0.5,
    },
    usedBy: null,
    noShop: true,
    noTraining: true,
  },
  {
    id: "cc_andrew_legal",
    name: "Andrew",
    title: "Legal Counsel",
    rarity: "uncommon",
    departmentId: "legal",
    employeeId: "andrew_legal",
    loopInText:
      "I'm looping in <strong>{name}</strong> to give us some perspective. He's a lawyer, but he's cool.",
    eff: {
      defFlat: 2,
    },
    usedBy: null,
  },
  {
    id: "cc_willy_boy_information_technology",
    name: "Willy Boy",
    title: "IT Specialist",
    rarity: "common",
    departmentId: "information_technology",
    employeeId: "willy_boy_information_technology",
    loopInText:
      "I'm looping in <strong>{name}</strong> because I think we need an {title} to help with the technical issues affecting others' replies in this thread.",
    eff: {
      heal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_colin_information_technology",
    name: "Colin",
    title: "IT Lead",
    rarity: "uncommon",
    departmentId: "information_technology",
    employeeId: "colin_information_technology",
    loopInText:
      "I'm looping in <strong>{name}</strong> to keep our technical support aligned and logged.",
    eff: {
      escalateDmg: 3,
      escalateRecoverPerHit: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_samantha_executive_council_office",
    name: "Samantha",
    title: "Director of Marketing",
    rarity: "rare",
    departmentId: "executive_council_office",
    employeeId: "samantha_executive_council_office",
    loopInText:
      "I'm looping in <strong>{name}</strong> to help frame this conversation around department wide resourcing.",
    eff: {
      defFlat: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_tim_executive_council_office",
    name: "Tim",
    title: "Premier",
    rarity: "rare",
    departmentId: "executive_council_office",
    loopInText:
      "I'm looping in <strong>{name}</strong> to keep him in the loop on this initative.",
    eff: {
      endRep: 4,
      singleDmgMult: 0.25,
    },
    usedBy: null,
  },
  {
    id: "cc_nimby_facilities_and_administration",
    name: "Nimby",
    title: "Office Cat",
    rarity: "rare",
    departmentId: "facilities_and_administration",
    loopInText:
      "I'm looping in <strong>{name}</strong> to provide this thread more light-hearted content.",
    eff: {
      dodge: 0.2,
      specialTriggerText: "Thread distracted by {name}! No standing lost.",
    },
    usedBy: null,
  },
  {
    id: "cc_lisa_marketing",
    name: "Lisa",
    title: "Director of Research",
    rarity: "uncommon",
    departmentId: "marketing",
    employeeId: "lisa_marketing",
    loopInText:
      "I'm looping in <strong>{name}</strong> to provide data‑driven context and keep claims grounded.",
    eff: {
      singleDmg: 8,
      escalateDmgMult: 0.5,
    },
    usedBy: null,
  },
  {
    id: "cc_sho_marketing",
    name: "Sho",
    title: "Account Mgr",
    rarity: "uncommon",
    departmentId: "marketing",
    employeeId: "sho_marketing",
    loopInText:
      "I'm looping in <strong>{name}</strong> to keep the BCR report moving and translate this into account next steps.",
    effects: [
      {
        event: "escalate",
        type: "add_thread_bonus",
        stats: { retaliation: 3, escalateRecoverPerHit: 3 },
      },
    ],
    usedBy: null,
  },
  {
    id: "cc_meghan_cassedy_executive_council_office",
    name: "Meghan Cassedy",
    title: "Marketing Advisor",
    rarity: "rare",
    departmentId: "executive_council_office",
    employeeId: "meghan_cassedy_executive_council_office",
    setId: "pod_set",
    loopInText:
      "I'm looping in <strong>{name}</strong> to advise on our tactical approach and reduce reputational risk.",
    eff: {
      defFlat: 2,
      selfPromoteHeal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_larry_facilities_and_administration",
    name: "Larry",
    title: "Facilities Lead",
    rarity: "rare",
    departmentId: "facilities_and_administration",
    employeeId: "larry_facilities_and_administration",
    loopInText:
      "I'm looping in <strong>{name}</strong> ({title}) to handle the facilities impact.",
    eff: {
      defFlat: 1,
      heal: 2,
      escalateDmg: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_dave_constituent_services",
    name: "Dave",
    title: "Social Media Manager",
    rarity: "rare",
    departmentId: "constituent_services",
    loopInText:
      "I'm looping in <strong>{name}</strong> for awareness and to mitigate reputational risk if this thread leaks.",
    eff: {
      singleDmg: 6,
      deflect: 2,
    },
    usedBy: null,
  },
  {
    id: "cc_gemma_policy",
    name: "Gemma",
    title: "Policy Analyst",
    rarity: "rare",
    departmentId: "policy",
    loopInText:
      "I'm looping in <strong>{name}</strong> from {department} to ensure this stays within policy guardrails.",
    eff: {
      defFlat: 2,
      singleDmg: 2,
    },
    usedBy: null,
  },
  {
    id: "cc_adam_finance",
    name: "Adam",
    title: "Budget Controller",
    rarity: "uncommon",
    departmentId: "finance",
    loopInText:
      "I'm looping in <strong>{name}</strong> to track fiscal impact against budgetary constraints and keep the numbers straight.",
    eff: {
      maxHp: 5,
      heal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_rowan_constituent_services",
    name: "Rowan",
    title: "Public Liaison",
    rarity: "rare",
    departmentId: "constituent_services",
    loopInText:
      "I'm looping in <strong>{name}</strong> to handle external messaging and stakeholder optics.",
    eff: {
      maxHp: 15,
      globalDmgMult: 0.3,
    },
    usedBy: null,
  },
  {
    id: "cc_karen_human_resources",
    name: "Karen",
    title: "HR Manager",
    rarity: "rare",
    departmentId: "human_resources",
    employeeId: "karen_human_resources",
    loopInText:
      "I'm looping in <strong>{name}</strong> from {department} to keep this thread compliant with HR policy.",
    eff: {
      deflect: 3,
      escalateDmg: 1,
    },
    usedBy: null,
  },
  {
    id: "cc_avery_operations",
    name: "Avery",
    title: "Operations Coordinator",
    rarity: "common",
    departmentId: "operations",
    employeeId: "avery_operations",
    loopInText:
      "I'm looping in <strong>{name}</strong> to track operational impact and keep this moving.",
    eff: {
      singleDmg: 2,
      selfPromoteHeal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_malik_marketing",
    name: "Malik",
    title: "Marketing Lead",
    rarity: "common",
    departmentId: "marketing",
    employeeId: "malik_marketing",
    loopInText:
      "I'm looping in <strong>{name}</strong> to keep brand alignment on this thread.",
    eff: {
      globalDmg: 4,
      selfPromoteHeal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_priya_finance",
    name: "Priya",
    title: "Finance Analyst",
    rarity: "common",
    departmentId: "finance",
    employeeId: "priya_finance",
    loopInText:
      "I'm looping in <strong>{name}</strong> to monitor budget exposure and expected impact.",
    eff: {
      heal: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_rory_operations",
    name: "Rory",
    title: "Facilities Coordinator",
    rarity: "rare",
    departmentId: "operations",
    employeeId: "rory_operations",
    loopInText:
      "I'm looping in <strong>{name}</strong> to keep the facilities schedule and shared space aligned.",
    eff: {
      defFlat: 1,
      heal: 2,
      selfPromoteHeal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_dora_finance",
    name: "Dora",
    title: "Budget Specialist",
    rarity: "common",
    departmentId: "finance",
    employeeId: "dora_finance",
    loopInText:
      "I'm looping in <strong>{name}</strong> to see if she can get help with her budgets.",
    eff: {
      maxHp: 10,
    },
    usedBy: null,
  },
  {
    id: "cc_christina_policy",
    name: "Christina",
    title: "Policy Officer",
    rarity: "common",
    departmentId: "policy",
    employeeId: "christina_policy",
    loopInText:
      "I'm looping in <strong>{name}</strong> to ensure we stay aligned with policy language.",
    eff: {
      deflect: 2,
      retaliation: 2,
      maxHp: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_fraser_information_technology",
    name: "Fraser",
    title: "IT Support",
    rarity: "common",
    departmentId: "information_technology",
    employeeId: "fraser_information_technology",
    loopInText:
      "I'm looping in <strong>{name}</strong> to support technical logging and incident tracking.",
    eff: {
      deflect: 2,
      retaliation: 2,
    },
    usedBy: null,
  },
  {
    id: "cc_anthony_m4_agency",
    name: "Anthony",
    title: "Media Coordinator",
    rarity: "common",
    departmentId: "m4_agency",
    employeeId: "anthony_m4_agency",
    loopInText:
      "I'm looping in <strong>{name}</strong> to manage the broader comms fallout.",
    eff: {
      escalateDmg: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_jonah_finance",
    name: "Jonah",
    title: "Budget Analyst",
    rarity: "uncommon",
    departmentId: "finance",
    employeeId: "jonah_finance",
    loopInText:
      "I'm looping in <strong>{name}</strong> to provide a spend analysis and risk outlook.",
    eff: {
      maxHp: 5,
      heal: 2,
      selfPromoteHeal: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_megan_legal",
    name: "Megan",
    title: "Compliance Counsel",
    rarity: "rare",
    departmentId: "legal",
    employeeId: "megan_legal",
    loopInText:
      "I'm looping in <strong>{name}</strong> to confirm our legal footing.",
    eff: {
      defFlat: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_interns_human_resources",
    name: "Interns",
    title: "Intern Collective",
    rarity: "uncommon",
    departmentId: "human_resources",
    employeeId: "interns_human_resources",
    loopInText:
      "I'm looping in <strong>{name}</strong> to document intern feedback and thread tone.",
    eff: {
      followUpChance: 0.2,
    },
    usedBy: null,
  },
  {
    id: "cc_sheila_finance",
    name: "Sheila",
    title: "Payroll Specialist",
    rarity: "uncommon",
    departmentId: "finance",
    employeeId: "sheila_finance",
    loopInText:
      "I'm looping in <strong>{name}</strong> to keep payroll exposure in view.",
    eff: {
      maxHp: 10,
      endRep: 6,
    },
    usedBy: null,
  },
  {
    id: "cc_taz_m4_agency",
    name: "Taz",
    title: "Media Planner",
    rarity: "uncommon",
    departmentId: "m4_agency",
    employeeId: "taz_m4_agency",
    loopInText:
      "I'm looping in <strong>{name}</strong> to sync the escalation plan and media response.",
    eff: {
      escalateDmg: 5,
    },
    usedBy: null,
  },
  {
    id: "cc_anneke_executive_council_office",
    name: "Anneke",
    title: "Senior Advisor",
    rarity: "rare",
    departmentId: "executive_council_office",
    employeeId: "anneke_executive_council_office",
    setId: "pod_set",
    loopInText:
      "I'm looping in <strong>{name}</strong> to provide executive counsel and strategic framing.",
    eff: {
      defFlat: 2,
      globalDmg: 3,
      heal: 3,
    },
    usedBy: null,
  },
  {
    id: "cc_julia_eco",
    name: "Julia",
    title: "Advisor",
    rarity: "uncommon",
    departmentId: "executive_council_office",
    employeeId: "julia_eco",
    setId: "pod_set",
    loopInText:
      "I'm looping in <strong>{name}</strong> to advise on our strategic positioning.",
    effects: [
      {
        event: "reply_to",
        type: "add_thread_bonus",
        stats: { singleDmg: 3, heal: 1 },
      },
    ],
    usedBy: null,
  },
  {
    id: "cc_steph_eco",
    name: "Steph",
    title: "Advisor",
    rarity: "rare",
    departmentId: "executive_council_office",
    employeeId: "steph_eco",
    setId: "pod_set",
    loopInText: "I'm looping in Steph to get her opinion on this discussion",
    effects: [
      {
        event: "deflect_action",
        type: "add_bcc",
        count: 1,
      },
    ],
    usedBy: null,
  },
  {
    id: "cc_selina_m4_agency",
    name: "Selina",
    title: "Account Director",
    rarity: "rare",
    departmentId: "m4_agency",
    employeeId: "selina_m4_agency",
    bonus: "+5 all messages",
    loopInText:
      "I'm looping in <strong>{name}</strong> to stabilize the account and reframe the narrative.",
    eff: {
      globalDmg: 5,
      levGainReply: 1,
    },
    usedBy: null,
  },
];

function inferContactRole(contact) {
  const title = (contact.title || "").toLowerCase();
  if (title.includes("chief") || title.includes("premier")) return "chief";
  if (title.includes("director")) return "director";
  if (title.includes("executive") || title.includes("advisor"))
    return "executive";
  if (
    title.includes("manager") ||
    title.includes("lead") ||
    title.includes("counsel")
  )
    return "manager";
  if (
    title.includes("analyst") ||
    title.includes("coordinator") ||
    title.includes("specialist") ||
    title.includes("officer") ||
    title.includes("support")
  )
    return "associate";
  return "assistant";
}

CONTACTS.forEach((contact) => {
  if (contact.role) return;
  contact.role = inferContactRole(contact);
});

const TITLES = [
  {
    name: "Cubicle Resident",
    id: "cubicle_resident",
    level: 1,
    addressLimit: 5,
    sigLimit: 2,
    numCCperCCaction: 0,
  },
  {
    name: "Junior Clerk",
    id: "junior_clerk",
    level: 2,
    addressLimit: 7,
    sigLimit: 4,
    numCCperCCaction: 1,
  },
  {
    name: "Senior Clerk",
    id: "senior_clerk",
    level: 3,
    addressLimit: 9,
    sigLimit: 6,
    numCCperCCaction: 1,
  },
  {
    name: "Program Coordinator",
    id: "program_coordinator",
    level: 4,
    addressLimit: 11,
    sigLimit: 8,
    numCCperCCaction: 2,
  },
  {
    name: "Director",
    id: "director",
    level: 5,
    addressLimit: 13,
    sigLimit: 10,
    numCCperCCaction: 2,
  },
  {
    name: "Deputy Director",
    id: "deputy_director",
    level: 6,
    addressLimit: 15,
    sigLimit: 11,
    numCCperCCaction: 2,
  },
  {
    name: "Department Chief",
    id: "department_chief",
    level: 7,
    addressLimit: 17,
    sigLimit: 12,
    numCCperCCaction: 2,
  },
  {
    name: "Deputy Minister",
    id: "deputy_minister",
    level: 8,
    addressLimit: 20,
    sigLimit: 15,
    numCCperCCaction: 3,
  },
];

// DESIGN ROLES (content + mechanics)
// Salutations (greetings):
// - The “entry rule.” Set the tone for the thread and its early constraints.
// - Effects should be front‑loaded: start-of-thread, CC-gating, action rules, time windows.
// - Can scale off CC count or sig count, but should rarely grant permanent growth.
// - Avoid persistent roster growth; keep them about thread setup and short-term play style.
//
// Signatures:
// - Stackable, small, composable effects that smooth early survival before CCs ramp.
// - Prefer immediate power/durability or mid‑thread action tweaks (reply/escalate/deflect).
// - Should avoid targeting player/CC permanent growth; if they grow, it’s self‑contained (e.g., per win).
// - May derive bonuses from contact composition (e.g., “per Legal CC”), but shouldn’t improve contacts.
// - Keep individual effects low magnitude and distinct to avoid stat mush.
//
// Sign‑offs:
// - The “exit rule.” End-of-thread or removal-based effects that shape long‑term progression.
// - Primary place for permanent growth, especially via CCs rather than the player directly.
// - Leverage/win/removal triggers are fair game; avoid early‑thread mechanics here.
//
// BCCs (Help Desk):
// - Tactical, consumable, immediate actions.
// - Primary path for one‑shot utility: resource creation, rerolls, CC upgrades, stat picks.
// - Should not create long‑term build identity on their own; they support the current thread/build.
const SIGNATURES = [
  {
    id: "iphone",
    name: "Sent from my iPhone",
    rarity: "common",
    heal: 2,
    addressLimit: 1,
  },
  {
    id: "regards",
    name: "Helping others is just part of the mission",
    rarity: "common",
    heal: 5,
  },
  {
    id: "coffee_break",
    name: "Don't email me before I've had my coffee",
    rarity: "common",
    setId: "coffee_lovers",
    levMult: 0.5,
  },
  {
    id: "double_espresso",
    name: "Powered by double espresso",
    rarity: "common",
    setId: "coffee_lovers",
    effects: [
      {
        event: "reply_to",
        type: "add_thread_bonus",
        stats: { singleDmg: 1 },
      },
    ],
  },
  {
    id: "disclaimer",
    name: "Standard Disclaimer Applied",
    rarity: "common",
    singleDmg: 3,
  },
  {
    id: "per_my_last",
    name: "Confused? Refer to my last email for context",
    rarity: "uncommon",
    followUpChance: 0.2,
  },
  {
    id: "wins_signature",
    name: "Win-Optimized",
    rarity: "uncommon",
    wins: 2,
  },
  {
    id: "environment_printing",
    name: "Please consider the environment before printing this email",
    rarity: "uncommon",
    setId: "earth_set",
    deflect: 2,
  },
  {
    id: "breakroom",
    name: "Sent from the breakroom",
    rarity: "uncommon",
    heal: 3,
  },
  {
    id: "toastmaster_member",
    name: "Toastmaster Member",
    rarity: "uncommon",
    levGainPromote: 8,
  },
  {
    id: "bare_minimum_mondays",
    name: "Bare minimum Mondays",
    rarity: "uncommon",
    levGainDeflect: 3,
  },
  {
    id: "thanks_advance",
    name: "Thanks in advance.",
    rarity: "rare",
    bccLimit: 1,
  },
  {
    id: "six_sigma_black_belt",
    name: "Six Sigma Black Belt",
    rarity: "rare",
    contactTrainingLimit: 1,
  },
  {
    id: "encrypted",
    name: "Sent from my encrypted workstation",
    rarity: "rare",
    deptScalers: [{ departmentId: "legal", stat: "defFlat", per: 2 }],
  },
  {
    id: "renewable_energy",
    name: "Our office aspires to be powered by 100% renewable energy.",
    rarity: "rare",
    globalDmgMult: 0.5,
  },
  {
    id: "ops_dispatch",
    name: "Shipments Confirmed",
    rarity: "common",
    deptScalers: [
      { departmentId: "operations", stat: "singleDmg", per: 1, step: 1 },
    ],
  },
  {
    id: "it_ticket",
    name: "33 Tickets Resolved",
    rarity: "common",
    deptScalers: [
      {
        departmentId: "information_technology",
        stat: "escalateDmg",
        per: 1,
        step: 1,
      },
    ],
  },
  {
    id: "eco_brief",
    name: "Aligned on Brief",
    rarity: "uncommon",
    deptScalers: [
      {
        departmentId: "executive_council_office",
        stat: "globalDmg",
        per: 1,
        step: 2,
      },
    ],
  },
  {
    id: "facilities_notice",
    name: "24 Hour Service Window Notice",
    rarity: "common",
    deptScalers: [
      {
        departmentId: "facilities_and_administration",
        stat: "deflect",
        per: 1,
        step: 1,
      },
    ],
  },
  {
    id: "brand_brief",
    name: "Concept Approved",
    rarity: "common",
    deptScalers: [
      { departmentId: "marketing", stat: "singleDmg", per: 1, step: 1 },
    ],
  },
  {
    id: "public_facing",
    name: "Public Response Cleared",
    rarity: "uncommon",
    deptScalers: [
      {
        departmentId: "constituent_services",
        stat: "globalDmg",
        per: 1,
        step: 2,
      },
    ],
  },
  {
    id: "policy_memo",
    name: "Circulating Internal Memos",
    rarity: "common",
    deptScalers: [{ departmentId: "policy", stat: "defFlat", per: 1, step: 1 }],
  },
  {
    id: "budget_line",
    name: "Budget Lines Verified",
    rarity: "uncommon",
    deptScalers: [{ departmentId: "finance", stat: "maxHp", per: 3, step: 2 }],
  },
  {
    id: "hr_record",
    name: "Personnel File Noted",
    rarity: "common",
    deptScalers: [
      { departmentId: "human_resources", stat: "deflect", per: 1, step: 1 },
    ],
  },
  {
    id: "legal_hold",
    name: "Active Hold Notice",
    rarity: "rare",
    deptScalers: [{ departmentId: "legal", stat: "defFlat", per: 2, step: 2 }],
  },
  {
    id: "m4_release",
    name: "M4 on retainer",
    rarity: "uncommon",
    deptScalers: [
      { departmentId: "m4_agency", stat: "followUpChance", per: 0.2, step: 3 },
    ],
  },
  {
    id: "meeting_maestro",
    name: "Meeting Maestro",
    rarity: "common",
    effects: [
      {
        event: "stakeholder_opt_out_other",
        type: "gain_rep",
        amount: 2,
      },
    ],
  },
  {
    id: "leed_certified",
    name: "My inbox is LEED certified",
    rarity: "uncommon",
    escalateDmg: 0,
    effects: [
      {
        event: "stakeholder_opt_out",
        type: "grow_sig_stat",
        stat: "escalateDmg",
        amount: 2,
      },
    ],
  },
  {
    id: "go_getter",
    name: "Go getter",
    rarity: "common",
    levGainReply: 1,
  },
];

const START_PRESTIGE_TITLES = [
  "Standard Operations",
  "Increased Oversight",
  "Quarterly Review",
  "Aggressive Restructuring",
  "Hostile Takeover",
  "Corporate Hegemony",
  "Monopolistic Tendencies",
  "End of History",
];

const START_DEPARTMENTS = [
  {
    id: "executive",
    name: "Executive Council Office",
    short: "EXECUTIVE",
    code: "EXE-SEC-01",
    unlocked: true,
    lockCondition: null,
    manifest: {
      Reputation: "4.0 (Standard)",
      "Key Contact": "Telly (Admin)",
      Greeting: "Hi,",
      "Sign-off": "Thanks,",
      Signatures: "None",
      Skillset: "Standard Corporate",
    },
    icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000080" stroke-width="1.5"><path d="M3 21h18"></path><path d="M19 21V10a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v11"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>`,
    start: {
      departmentId: "executive_council_office",
      reputation: 4,
      winsDelta: 0,
      addressBook: ["cc_telly_operations"],
      signatureIds: [],
      salutationId: "hi",
      signOffId: "thanks",
    },
  },
  {
    id: "it",
    name: "IT Support & Systems",
    short: "IT DEPT",
    code: "SYS-ADM-04",
    unlocked: true,
    lockCondition: "Have Colin opt out of a thread.",
    manifest: {
      Reputation: "4.0 (Stable)",
      "Key Contact": "Colin (IT)",
      Greeting: "Update,",
      "Sign-off": "Thanks,",
      Signatures: "33 Tickets Resolved",
      Liability: "-1 Win (Ops)",
    },
    icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000080" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="17" x2="12" y2="21"></line><line x1="8" y1="21" x2="16" y2="21"></line></svg>`,
    start: {
      departmentId: "information_technology",
      reputation: 4,
      winsDelta: -1,
      addressBook: ["cc_colin_information_technology"],
      signatureIds: ["it_ticket"],
      salutationId: "update",
      signOffId: "until_next",
    },
  },
  {
    id: "finance",
    name: "Finance & Accounts",
    short: "FINANCE",
    code: "FISC-ACC-09",
    unlocked: true,
    lockCondition: "Accumulate more than 30 Reputation.",
    manifest: {
      Reputation: "14.0 (Venture Cap)",
      "Key Contact": "N/A (Liquid)",
      Greeting: "None",
      "Sign-off": "None",
      Signatures: "None",
      Passive: "Expense Recovery",
    },
    icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000080" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`,
    start: {
      departmentId: "finance",
      reputation: 14,
      winsDelta: 0,
      addressBook: [],
      signatureIds: [],
      salutationId: null,
      signOffId: null,
    },
  },
];

const SALUTATIONS = [
  {
    id: "hi",
    name: "Hi,",
    rarity: "common",
    selfPromoteHeal: 5,
  },
  {
    id: "update",
    name: "Update,",
    rarity: "common",
    scalers: [{ source: "sig", stat: "escalateDmg", per: 3 }],
  },
  {
    id: "hi_all",
    name: "Hi all,",
    rarity: "common",
    replyDeptCleave: true,
  },
  {
    id: "hello",
    name: "Hello,",
    rarity: "common",
    scalers: [
      { source: "cc", stat: "singleDmg", per: 5 },
      { source: "cc", stat: "maxHp", per: 5 },
    ],
  },
  {
    id: "all",
    name: "All,",
    rarity: "common",
    scalers: [
      { source: "cc", stat: "escalateDmg", per: 3 },
      { source: "cc", stat: "deflect", per: 2 },
    ],
  },
  {
    id: "hello_team",
    name: "Hello Team,",
    rarity: "common",
    scalers: [
      { source: "cc", stat: "escalateDmg", per: 5 },
      { source: "cc", stat: "selfPromoteHeal", per: -5 },
      { source: "cc", stat: "heal", per: -1 },
    ],
  },
  {
    id: "team",
    name: "Team,",
    rarity: "common",
    scalers: [
      { source: "cc", stat: "retaliation", per: 7 },
      { source: "cc", stat: "deflect", per: 1 },
    ],
  },
  {
    id: "morning",
    name: "Good morning,",
    rarity: "common",
    statWindows: [
      {
        start: 9 * 60,
        end: 9 * 60 + 30,
        stats: { singleDmg: 15, maxHp: 30 },
      },
    ],
  },
  {
    id: "routine_update",
    name: "Routine update,",
    rarity: "common",
    scalers: [
      { source: "sig", stat: "singleDmg", per: 3 },
      { source: "sig", stat: "selfPromoteHeal", per: 2 },
    ],
  },
  {
    id: "good_afternoon",
    name: "Good afternoon,",
    rarity: "uncommon",
    statWindows: [
      {
        start: 10 * 60 + 30,
        end: 11 * 60,
        stats: { singleDmgMult: 1, maxHp: 30 },
      },
    ],
  },
  {
    id: "operational_update",
    name: "Operational update,",
    rarity: "common",
    scalers: [
      { source: "sig", stat: "escalateDmg", per: 2 },
      { source: "sig", stat: "deflect", per: 1 },
      { source: "sig", stat: "retaliation", per: 1 },
    ],
  },
  {
    id: "good_evening",
    name: "Good evening,",
    rarity: "rare",
    statWindows: [
      {
        start: 13 * 60,
        end: null,
        stats: { singleDmg: 30, singleDmgMult: 1, maxHp: 60 },
      },
    ],
  },
  {
    id: "status_update",
    name: "Status update,",
    rarity: "common",
    scalers: [
      { source: "sig", stat: "singleDmg", per: 5 },
      { source: "sig", stat: "escalateDmg", per: -3 },
    ],
  },
  {
    id: "project_team",
    name: "To the Project Team,",
    rarity: "common",
    replySecondaryHalf: true,
  },
  {
    id: "working_group",
    name: "To the working group,",
    rarity: "uncommon",
    effects: [
      {
        event: "thread_end",
        type: "add_salutation_bonus",
        stats: { globalDmg: 5 },
        requiresFullLeverage: true,
      },
    ],
  },
  {
    id: "committee",
    name: "To the committee,",
    rarity: "uncommon",
    effects: [{ event: "thread_start", type: "add_bcc", count: 1 }],
  },
  {
    id: "colleagues",
    name: "Dear Colleagues,",
    rarity: "uncommon",
    effects: [
      {
        event: "thread_end",
        type: "add_salutation_bonus",
        stats: { singleDmgMult: 0.5, escalateDmgMult: 0.5 },
        requiresHpFull: true,
      },
    ],
  },
  {
    id: "sustainability_team",
    name: "To the Sustainability Team,",
    rarity: "uncommon",
    setId: "earth_set",
    levMult: 1.0,
  },
  {
    id: "greetings",
    name: "Greetings,",
    rarity: "rare",
    effects: [
      {
        event: "rep_tick",
        type: "rep_scale_salutation",
        step: 3,
        stats: { escalateDmgMult: 0.1 },
      },
    ],
  },
  {
    id: "all_stakeholders",
    name: "To all stakeholders,",
    rarity: "rare",
    effects: [{ event: "reply_all", type: "add_bcc", count: 1 }],
  },
  {
    id: "formal",
    name: "To whom it may concern,",
    rarity: "rare",
    effects: [{ event: "shop_enter", type: "duplicate_bcc", count: 1 }],
  },
  {
    id: "everyone",
    name: "Everyone,",
    bonus:
      "Escalate and Reply All affect all stakeholders once per active stakeholder.",
    rarity: "rare",
    escalatePerActive: true,
    replyAllPerActive: true,
  },
  {
    id: "dear_team",
    name: "Dear Team,",
    rarity: "rare",
    effects: [
      {
        event: "deflect_action",
        type: "add_salutation_bonus",
        stats: { globalDmgMult: 0.1 },
      },
    ],
  },
];

const SIGNOFFS = [
  {
    id: "thanks",
    name: "Thanks,",
    rarity: "common",
    effects: [
      {
        event: "cc_add",
        type: "add_cc_bonus",
        threadLimit: 1,
      },
    ],
  },
  {
    id: "until_next",
    name: "Until next time,",
    rarity: "common",
    effects: [
      {
        event: "remove_stakeholder",
        type: "add_random_cc_bonus",
        threadLimit: 2,
      },
    ],
  },
  {
    id: "respectfully",
    name: "Respectfully,",
    rarity: "common",
    effects: [
      {
        event: "reply_all",
        type: "add_random_cc_bonus",
        count: 2,
      },
    ],
  },
  {
    id: "regards_signoff",
    name: "Regards,",
    rarity: "common",
    effects: [
      {
        event: "reply_to",
        type: "add_random_cc_bonus",
        threadLimit: 2,
      },
    ],
  },
  {
    id: "kind_regards_signoff",
    name: "Kind regards,",
    rarity: "common",
    effects: [
      {
        event: "deflect_proc",
        type: "add_random_cc_bonus",
        threadLimit: 3,
      },
    ],
  },
  {
    id: "cheers",
    name: "Cheers,",
    rarity: "common",
    effects: [
      {
        event: "bcc_use",
        type: "add_random_cc_bonus",
        count: 2,
      },
    ],
  },
  {
    id: "team_regards_signoff",
    name: "With regards from the team,",
    rarity: "common",
    effects: [
      {
        event: "escalate",
        type: "add_random_cc_bonus",
        threadLimit: 3,
      },
    ],
  },
  {
    id: "best_signoff",
    name: "Best,",
    rarity: "common",
    effects: [
      {
        event: "thread_end",
        type: "add_random_cc_bonus_scaled",
        scaleBy: "wins_remaining",
        step: 1,
      },
    ],
  },
  {
    id: "warmly",
    name: "Warmly,",
    rarity: "common",
    effects: [
      {
        event: "thread_end",
        type: "add_random_cc_bonus",
        requiresHpFull: true,
        count: 3,
      },
    ],
  },
  {
    id: "solidarity",
    name: "In solidarity,",
    rarity: "uncommon",
    effects: [
      {
        event: "thread_end",
        type: "add_all_cc_bonus",
        scope: "addressBook",
      },
    ],
  },
  {
    id: "team_regards_signoff",
    name: "Regards team,",
    rarity: "uncommon",
    effects: [
      {
        event: "reply_to",
        type: "add_random_cc_bonus",
        requiresHpFull: true,
      },
    ],
  },
  {
    id: "yours_truly",
    name: "Yours truly,",
    rarity: "uncommon",
    effects: [
      {
        event: "thread_end",
        type: "add_random_cc_bonus_scaled",
        scaleBy: "wins_remaining",
        step: 1,
      },
    ],
  },
  {
    id: "thank_you",
    name: "Thank you,",
    rarity: "uncommon",
    effects: [
      {
        event: "bcc_use",
        type: "add_random_cc_bonus",
        count: 3,
      },
      {
        event: "cc_add",
        type: "add_cc_bonus",
        threadLimit: 1,
      },
    ],
  },
  {
    id: "with_appreciation",
    name: "With appreciation,",
    rarity: "uncommon",
    effects: [
      {
        event: "thread_end",
        type: "add_random_cc_bonus_scaled",
        scaleBy: "hp",
        step: 10,
      },
    ],
  },
  {
    id: "sincerely",
    name: "Sincerely,",
    rarity: "uncommon",
    effects: [
      {
        event: "rep_adjust",
        type: "rep_half_to_cc_escalate",
        step: 3,
      },
    ],
  },
  {
    id: "solidarity_earth",
    name: "In solidarity with the Earth",
    rarity: "uncommon",
    setId: "earth_set",
    effects: [
      {
        event: "thread_end",
        type: "add_cc_bonus_by_dept_pairs",
      },
    ],
  },
  {
    id: "best_wishes",
    name: "Best wishes,",
    rarity: "uncommon",
    effects: [
      {
        event: "thread_end",
        type: "add_random_cc_bonus_scaled",
        scaleBy: "active_cc_count",
        step: 2,
      },
    ],
  },
  {
    id: "for_group_awareness",
    name: "For group awareness,",
    rarity: "rare",
    effects: [
      {
        event: "escalate",
        type: "add_random_cc_bonus",
      },
    ],
  },
  {
    id: "v_respectfully",
    name: "Very Respectfully,",
    rarity: "rare",
    effects: [
      {
        event: "thread_end",
        type: "add_all_cc_bonus",
        requiresHpFull: true,
      },
    ],
  },
  {
    id: "best_regards",
    name: "Best Regards,",
    rarity: "rare",
    effects: [
      {
        event: "remove_stakeholder",
        type: "add_random_cc_bonus",
      },
    ],
  },
  {
    id: "bye_for_now",
    name: "Bye for now,",
    rarity: "rare",
    effects: [
      {
        event: "reply_to",
        type: "add_random_cc_bonus",
      },
    ],
  },
  {
    id: "love",
    name: "Love,",
    rarity: "rare",
    effects: [
      {
        event: "reply_to",
        type: "add_random_cc_bonus",
      },
      {
        event: "thread_end",
        type: "add_signoff_bonus",
        stats: { contactTrainingLimit: 1 },
      },
    ],
  },
];

const BCC_CONTACTS = [
  {
    id: "expense_report",
    name: "Expense Report",
    bonus: "Doubles mission base rep (max +10 bonus).",
    rarity: "common",
    effect: "doubleRep",
    logText:
      "Filed an internal expense memo to offset the reputational cost of this thread.",
  },
  {
    id: "networking_event",
    name: "Networking Event",
    bonus:
      "Gain reputation equal to the total sell value of your current CCs (Max 30).",
    rarity: "rare",
    effect: "contactRep",
    logText:
      "Booked a slot on the internal newsletter to highlight this collaboration and reclaim goodwill.",
  },
  {
    id: "bcc_rollout",
    name: "BCC Rollout",
    bonus: "Creates up to two random BCCs if space allows.",
    rarity: "uncommon",
    effect: "randomBccs",
    logText:
      "Opened two additional help-desk tickets to widen our escalation options.",
  },
  {
    id: "signature_provision",
    name: "Signature Provisioning",
    bonus: "Adds a random signature if space allows.",
    rarity: "common",
    effect: "randomSignature",
    logText: "Requested a standardized signature package from IT services.",
  },
  {
    id: "mentorship",
    name: "Credibility Coaching",
    bonus:
      "One of your in-thread contacts gains a +10 max credibility specialization.",
    rarity: "common",
    effect: "contactUpgradeHp",
    logText: "Approved a resilience coaching plan for one CC'd contact.",
  },
  {
    id: "headhunter",
    name: "Headhunter Referral",
    bonus:
      "Gain a random contact permanently if you have space, and immediately loop them into this thread.",
    rarity: "common",
    effect: "randomContact",
    logText:
      "Engaged a headhunter to fast-track a specialist into this thread.",
  },
  {
    id: "reply_precision",
    name: "Reply Precision",
    bonus: "One of your in-thread contacts gains a +5 reply to specialization.",
    rarity: "uncommon",
    effect: "contactUpgradeSingle",
    logText: "Issued a precision-reply training order for one CC'd contact.",
  },
  {
    id: "broadcast_training",
    name: "Broadcast Comms.",
    bonus: "One of your in-thread contacts gains a +4 escalate specialization.",
    rarity: "common",
    effect: "contactUpgradeEscalate",
    logText:
      "Issued a broadcast readiness training order for one CC'd contact.",
  },
  {
    id: "recognition_award",
    name: "Recognition Award",
    bonus: "One of your in-thread contacts gains a +3 REP specialization.",
    rarity: "rare",
    effect: "contactUpgradeRep",
    logText: "Filed a recognition award for one CC'd contact's thread support.",
  },
  {
    id: "executive_review",
    name: "Executive Review",
    bonus: "Opens a 2-of-3 stat bonus selection.",
    rarity: "rare",
    effect: "statPack",
    logText:
      "Opened an executive review to authorize targeted performance adjustments.",
  },
];

const SET_DEFS = [
  {
    id: "earth_set",
    name: "Sustainability Protocol",
    items: [
      { type: "salutation", id: "sustainability_team" },
      { type: "signoff", id: "solidarity_earth" },
      { type: "signature", id: "environment_printing" },
    ],
    effect: {
      globalDmg: 5,
      defFlat: 3,
      deflect: 2,
      retaliation: 2,
      escalateRecoverPerHit: 10,
    },
  },
  {
    id: "office_allies",
    name: "Office Allies",
    items: [
      { type: "contact", id: "cc_anneke_executive_council_office" },
      { type: "contact", id: "cc_willy_boy_information_technology" },
    ],
    effect: {
      special: "Automatically loops in Tater the Dog when both are CC'd.",
    },
  },
  {
    id: "coffee_lovers",
    name: "Coffee Lovers",
    items: [
      { type: "signature", id: "coffee_break" },
      { type: "signature", id: "double_espresso" },
    ],
    effect: {
      special: "Set bonus pending review.",
    },
  },
  {
    id: "legal_parents",
    name: "New Parents",
    items: [
      { type: "contact", id: "cc_andrew_legal" },
      { type: "contact", id: "cc_megan_legal" },
    ],
    effect: {
      special: "Automatically loops in Elsie when both parents are CC'd.",
    },
  },
  {
    id: "pod_set",
    name: "The Pod",
    items: [
      { type: "contact", id: "cc_julia_eco" },
      { type: "contact", id: "cc_steph_eco" },
      { type: "contact", id: "cc_anneke_executive_council_office" },
      {
        type: "contact",
        id: "cc_meghan_cassedy_executive_council_office",
      },
    ],
    effect: {
      globalDmgMult: 2.0,
    },
  },
];

const EMPLOYEES = [
  {
    id: "andrew_legal",
    name: "Andrew",
    email: "a.legal@gov.org",
    departmentId: "legal",
    color: "text-red-700",
    defeatMessage: "Fine. I'm leaving. I've got a lawn to mow anyway.",
    selfPromote:
      "I finally cleared my desk. It only took three years of ignored emails.",
    deflectLines: [
      "I'm going to need a minute to process this. Or an hour. Maybe a day.",
    ],
    lines: [
      {
        text: "I have no preference regarding the brand, provided the BTU output does not exceed fire marshal regulations.",
        missionId: "bbq_deadlock",
      },
      {
        text: "I am muting all mentions of 'vibrations' or 'family.' Is there a legal challenge, or can I go back to my redlines?",
        missionId: "bbq_deadlock",
      },
      {
        text: "Whether you attend the meeting or not, you are still bound by the 'Shared Appliance Usage Policy'.",
        missionId: "bbq_deadlock",
      },
      { text: "Fine.", missionId: null },
      { text: "Noted.", missionId: null },
      { text: "I'll look into it. Eventually.", missionId: null },
      { text: "That's certainly a choice.", missionId: null },
      {
        text: "I've seen worse. Not much worse, but worse.",
        missionId: null,
      },
    ],
  },
  {
    id: "karen_human_resources",
    name: "Karen",
    email: "k.smith@gov.org",
    departmentId: "human_resources",
    color: "text-purple-700",
    defeatMessage:
      "I am unsubscribing. I've documented the lack of professional decorum and will be following up with each of you individually. Regards.",
    selfPromote:
      "I've just updated the internal wiki with our new 'Efficiency Standards'. My contribution score is through the roof.",
    deflectLines: [
      "I'm pausing to document this thread before responding further.",
    ],
    lines: [
      {
        text: "Your recent breakroom habits suggest a lack of respect for shared departmental assets.",
        missionId: "microwave",
      },
      {
        text: "I noticed you haven't completed the mandatory 'Digital Hygiene' training module for this quarter.",
        missionId: null,
      },
      {
        text: "I have three disciplinary hearings today; this thread is a significant drain on my operational capacity.",
        missionId: null,
      },
      {
        text: "HR provides the framework for your employment; your contributions are currently being 're-evaluated'.",
        missionId: null,
      },
      {
        text: "Please review the updated 'Shared Space Etiquette' PDF attached to my signature.",
        missionId: null,
      },
      {
        text: "I'm scheduling a mandatory mediation session for the entire floor this Friday at 4:30 PM.",
        missionId: null,
      },
      {
        text: "Your tone in this thread has been noted and will be discussed during your next performance review.",
        missionId: null,
      },
      {
        text: "We have a zero-tolerance policy for passive-aggressive CC-ing. Please adhere to the chain of command.",
        missionId: null,
      },
      {
        text: "I've CC'd the Chief Wellness Officer to address the 'toxic environment' you're creating.",
        missionId: null,
      },
      {
        text: "Failure to identify the salmon-heater will result in a collective reduction of the 'Team Synergy' bonus.",
        missionId: "microwave",
      },
      {
        text: "I'm looking at the handbook right now, and you're in violation of Section 8.4: Olfactory Neutrality.",
        missionId: "microwave",
      },
      {
        text: "This 'Reply All' behavior is exactly why we can't have nice things, like the espresso machine I vetoed.",
        missionId: null,
      },
    ],
  },
  {
    id: "avery_operations",
    name: "Avery",
    email: "a.ops@gov.org",
    departmentId: "operations",
    color: "text-slate-700",
    defeatMessage:
      "I'm removing myself from this thread and logging the incident with Facilities. We'll reset the room schedule after this.",
    selfPromote:
      "I updated the weekly facilities checklist ahead of schedule. Process discipline still matters.",
    deflectLines: [
      "I'm pausing to document this thread before responding further.",
    ],
    lines: [
      {
        text: "The conference room has a safety walkthrough scheduled; we need that time block to proceed.",
        missionId: "calendar_chaos",
      },
      {
        text: "I can resolve this quickly if we stick to the booking records and timestamps.",
        missionId: "calendar_chaos",
      },
      {
        text: "Please use the shared calendar correctly. It's there for a reason.",
        missionId: null,
      },
      {
        text: "We can't keep reassigning rooms on short notice without disrupting core operations.",
        missionId: null,
      },
    ],
  },
  {
    id: "rory_operations",
    name: "Rory",
    email: "r.facilities@gov.org",
    departmentId: "operations",
    color: "text-slate-600",
    defeatMessage:
      "Alright we don't need to share. I've got work to do and a desk to return to. I'll see you all in the office.",
    selfPromote:
      "I was in by 6 AM and already cleared two work orders. The office runs when we're here.",
    deflectLines: [
      "I'm pausing to document this before I get back to the floor.",
    ],
    lines: [
      {
        text: "We can share the room. Everyone's already here—let's just run the meetings together.",
        missionId: "calendar_chaos",
      },
      {
        text: "The office is for working. If we're all in the building, we can make it work.",
        missionId: "calendar_chaos",
      },
      {
        text: "I'd rather stay in the office and solve this than bounce rooms all day.",
        missionId: null,
      },
      {
        text: "Honestly, I love being here. Let's just share the space and get it done.",
        missionId: null,
      },
    ],
  },
  {
    id: "larry_facilities_and_administration",
    name: "Larry",
    email: "l.facilities@gov.org",
    departmentId: "facilities_and_administration",
    color: "text-stone-700",
    defeatMessage:
      "I'm stepping out. These halls have seen worse, and so have I.",
    selfPromote:
      "I kept the building running during three leadership changes. The lights stayed on.",
    deflectLines: ["I'm pausing to recall the last time this policy changed."],
    lines: [
      {
        text: "I'd rather set it lower so we're not burning the oil bill. 64°F isn't outrageous for you.",
        missionId: "thermostat_war",
      },
      {
        text: "We keep this place running; if you insist on 96°F, the heating costs add up fast.",
        missionId: "thermostat_war",
      },
      {
        text: "The old holiday parties used to happen after hours in the lobby. You showed up and we kept it simple.",
        missionId: "holiday_reply_all",
      },
      {
        text: "I miss the days when we just posted a flyer by the elevator and you all showed up.",
        missionId: "holiday_reply_all",
      },
      {
        text: "When the old deputy minister signed the first operational charter, we settled disputes in person. You remember that?",
        missionId: null,
      },
      {
        text: "This reminds me of the 1998 reorg. We survived by keeping things simple.",
        missionId: null,
      },
      {
        text: "Facilities isn't glamorous, and it's not what I wanted for myself, but it's the backbone. Try to respect our perspective.",
        missionId: null,
      },
      {
        text: "I was at the very top once. Now I'm stuck in threads like these.",
        missionId: null,
      },
    ],
  },
  {
    id: "priya_finance",
    name: "Priya",
    email: "p.finance@gov.org",
    departmentId: "finance",
    color: "text-emerald-700",
    defeatMessage:
      "We'll proceed without the room. If payroll slips, that's on this thread.",
    selfPromote:
      "We closed the month early and kept variance under 1%. That's the standard.",
    deflectLines: [
      "I'm pausing to document the payroll risk before responding.",
    ],
    lines: [
      {
        text: "We need it cooler; 96°F makes accurate review impossible for us.",
        missionId: "thermostat_war",
      },
      {
        text: "64°F is low, but it's preferable to 96°F for our review work.",
        missionId: "thermostat_war",
      },
      {
        text: "Payroll finalization closes today. We need the room and the time block.",
        missionId: "calendar_chaos",
      },
      {
        text: "Moving this meeting puts paychecks at risk. I'm not signing off on that.",
        missionId: "calendar_chaos",
      },
      {
        text: "I've calculated the replacement cost including inflation and the emotional labor of walking to the store. You owe me $4.85.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "This yogurt was a pre-allocated asset for my 10:30 break. Now my productivity is in a deficit.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "I am logging this as an 'unauthorized withdrawal' from the departmental cooling unit.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "The cost of delay is real. Please treat this as priority.",
        missionId: null,
      },
      {
        text: "We have a reporting cutoff. This isn't optional.",
        missionId: null,
      },
    ],
  },
  {
    id: "jonah_finance",
    name: "Jonah",
    email: "j.budget@gov.org",
    departmentId: "finance",
    color: "text-emerald-700",
    defeatMessage:
      "I'm stepping out. Please summarize decisions for the ledger.",
    selfPromote:
      "I closed the variance gap without cutting services. That's budget discipline.",
    deflectLines: ["I'm pausing to reconcile the numbers before replying."],
    lines: [
      {
        text: "We need to confirm the funding source before agreeing to any changes.",
        missionId: null,
      },
      {
        text: "This impacts our quarterly forecast, we need to be precise.",
        missionId: null,
      },
      {
        text: "I can align the figures, but I need a clear decision path.",
        missionId: null,
      },
      {
        text: "Budget constraints aren't optional. They're the framework.",
        missionId: null,
      },
    ],
  },
  {
    id: "dora_finance",
    name: "Dora",
    email: "d.budget@gov.org",
    departmentId: "finance",
    color: "text-emerald-600",
    defeatMessage: "I'm stepping out. I'll send my notes offline.",
    selfPromote:
      "I held the budget together through sheer willpower. We need another pair of hands.",
    deflectLines: ["I'm holding response until this is documented."],
    lines: [
      {
        text: "I'm melting at 96°F. I can't reconcile anything in this heat—can you?",
        missionId: "thermostat_war",
      },
      {
        text: "I can handle 68°F, but 64°F is too low. Please don't drop it further on us.",
        missionId: "thermostat_war",
      },
      {
        text: "I'm behind on reconciliation and I can't catch up without this block of time.",
        missionId: "calendar_chaos",
      },
      {
        text: "We booked this for review and sign-off. If we move it, we miss the cutoff.",
        missionId: "calendar_chaos",
      },
      {
        text: "Honestly, I need help. Is anyone available to jump in on reconciliation?",
        missionId: null,
      },
      {
        text: "I'm drowning in numbers here. Please don't make this harder.",
        missionId: null,
      },
    ],
  },
  {
    id: "telly_marketing",
    name: "Telly",
    email: "telly.marketing@gov.org",
    departmentId: "marketing",
    color: "text-slate-700",
    defeatMessage:
      "I booked the room properly, but I'll give it up this time I guess.",
    selfPromote:
      "I handled the scheduling backlog this morning. Everything was confirmed.",
    deflectLines: [
      "I'm pausing to document the booking record before replying.",
    ],
    lines: [
      {
        text: "I booked the room at 8:12 AM and sent confirmations to both teams.",
        missionId: "calendar_chaos",
      },
      {
        text: "The calendar shows a single reservation. The double booking happened after my confirmation.",
        missionId: "calendar_chaos",
      },
      {
        text: "I can forward the timestamps if needed.",
        missionId: "calendar_chaos",
      },
      {
        text: "Please stop replying all. I'm just the intern.",
        missionId: null,
      },
    ],
  },
  {
    id: "lisa_marketing",
    name: "Lisa",
    email: "l.strategy@gov.org",
    departmentId: "marketing",
    color: "text-purple-700",
    defeatMessage:
      "I'm stepping out. Ping me when there's a decision with scope.",
    selfPromote:
      "While we've been chatting, I've aligned three teams and removed redundant staff.",
    deflectLines: ["I'm pausing to confirm scope and stakeholder ownership."],
    lines: [
      {
        text: "Our team is cold, and you can see it. We need 96°F or people can't focus.",
        missionId: "thermostat_war",
      },
      {
        text: "96°F is the only setting that works for us right now—please stop lowering it.",
        missionId: "thermostat_war",
      },
      {
        text: "We need a single holiday message with approved visuals. I can draft it.",
        missionId: "holiday_reply_all",
      },
      {
        text: "Please stop ad‑hoc replies; I'll consolidate and send a clean version.",
        missionId: "holiday_reply_all",
      },
      {
        text: "We need a clear owner and a single objective. This thread has neither.",
        missionId: null,
      },
      {
        text: "Align on scope first. Then we can talk timelines.",
        missionId: null,
      },
      {
        text: "This is not a messaging problem. It's a decision problem.",
        missionId: null,
      },
      {
        text: "I'm not approving anything without a clear risk assessment.",
        missionId: null,
      },
    ],
  },
  {
    id: "malik_marketing",
    name: "Malik",
    email: "m.marketing@gov.org",
    departmentId: "marketing",
    color: "text-violet-700",
    defeatMessage:
      "I'm stepping out. Please keep me in the loop on final messaging.",
    selfPromote:
      "I reorganized our messaging tiers and cut response time in half.",
    deflectLines: ["I'm pausing to align the team before responding."],
    lines: [
      {
        text: "We need one message, not five. Please align.",
        missionId: null,
      },
      {
        text: "I'm not comfortable moving forward without a clear audience.",
        missionId: null,
      },
      {
        text: "This is a visibility issue. Let's fix the narrative first.",
        missionId: null,
      },
      {
        text: "If we're changing direction, we need a reason and a plan.",
        missionId: null,
      },
    ],
  },
  {
    id: "meghan_cassedy_executive_council_office",
    name: "Meghan Cassedy",
    email: "m.cassedy@gov.org",
    departmentId: "executive_council_office",
    color: "text-blue-700",
    defeatMessage:
      "I've got something else to get to. I've removed myself from this thread.",
    selfPromote:
      "I mediated a cross‑department dispute without escalation. Balance matters.",
    deflectLines: ["I'm pausing to keep this constructive and level."],
    lines: [
      {
        text: "Leadership needs one succinct summary, not a cascade of greetings.",
        missionId: "holiday_reply_all",
      },
      {
        text: "I can summarize sentiments and send a brief note to leadership.",
        missionId: "holiday_reply_all",
      },
      {
        text: "Let's keep this calm and stick to the facts. We're well positioned to deal with any problems.",
        missionId: null,
      },
      {
        text: "I'm hearing multiple positions. Let's summarize and decide.",
        missionId: null,
      },
      {
        text: "We can disagree without escalating. Please keep it professional.",
        missionId: null,
      },
      {
        text: "If we align on outcomes, the path forward will be straightforward.",
        missionId: null,
      },
    ],
  },
  {
    id: "willy_boy_information_technology",
    name: "Willy Boy",
    email: "w.boy@gov.org",
    departmentId: "information_technology",
    color: "text-indigo-600",
    defeatMessage:
      "I've figured out how to mute this thread. See you all in the next one.",
    selfPromote:
      "I was able to access the mail server last night, and restored email archival. Couldn't remove myself though.",
    deflectLines: ["I'm pausing to figure out why I'm on this email chain."],
    lines: [
      {
        text: "Did you add me to this holiday chain? I don't work here.",
        missionId: "holiday_reply_all",
      },
      {
        text: "I didn't get invited to any holiday parties this year unfortunately, maybe you could invite me next time?.",
        missionId: "holiday_reply_all",
      },
      {
        text: "This party looks really fun. Can you review my resume and let me know if I can join next year?",
        missionId: "holiday_reply_all",
      },
      {
        text: "I've never worked here. Why can I see this thread?",
        missionId: null,
      },
      {
        text: "This email seems to automatically forward to my personal, can you fix that for me?",
        missionId: null,
      },
      {
        text: "Someone should probably revoke my access, but until then... Hello!",
        missionId: null,
      },
      {
        text: "I don't work here, did you 'To:' me by mistake?",
        missionId: null,
      },
      {
        text: "Please remove me from this distribution. Or don't. It is interesting.",
        missionId: null,
      },
    ],
  },
  {
    id: "jules_marketing",
    name: "Jules",
    email: "j.brand@gov.org",
    departmentId: "marketing",
    color: "text-purple-700",
    defeatMessage:
      "Bummer, man. I'm gonna go catch some waves and maybe finally call my dad. Peace and love.",
    selfPromote:
      "I just shared my morning smoothie recipe on the Slack. It's got kale, ginger, and a hint of my own tears. High engagement, dudes!",
    deflectLines: [
      "Whoa, let's just take a breath. I'm gonna go sit in the dark for a bit to reset my energy.",
    ],
    lines: [
      {
        text: "Dude, 96°F is like a tropical sunrise. It reminds me of the time I lived in a van and forgot what a mortgage was.",
        missionId: "thermostat_war",
      },
      {
        text: "Set it to 96°F so I can sweat out these toxins. My ex-wife took the sauna in the settlement, so I gotta get it where I can.",
        missionId: "thermostat_war",
      },
      {
        text: "Totally tubular idea, but did anyone see that rash on my lower back? It's really acting up in this fluorescent lighting.",
        missionId: null,
      },
      {
        text: "Chill out everyone. I just spent 40 minutes in the meditation pod thinking about how my dad never hugged me. We should just be kind.",
        missionId: null,
      },
      {
        text: "Right on. By the way, does anyone know if HR covers 'spiritual alignment therapy'? My chakras are as blocked as our communal toilet.",
        missionId: null,
      },
      {
        text: "I'm just riding the wave of life, man. Did I ever tell you about the time I accidentally joined a cult in Cabo? Great networking, though.",
        missionId: null,
      },
    ],
  },
  {
    id: "maya_marketing",
    name: "Maya",
    email: "m.comms@gov.org",
    departmentId: "marketing",
    color: "text-fuchsia-700",
    defeatMessage:
      "I'm muting this for now. I'll draft a statement and circulate later.",
    selfPromote:
      "I got ahead of a media cycle before breakfast. That's proactive comms.",
    deflectLines: [
      "I'm pausing to draft a brief and de-escalate the narrative.",
    ],
    lines: [
      {
        text: "We need it warmer; 96°F keeps the team from freezing on calls with you.",
        missionId: "thermostat_war",
      },
      {
        text: "Please set it to 96°F and leave it. I couldn't get to the beach this year—vacation has to be at my desk.",
        missionId: "thermostat_war",
      },
      {
        text: "We need a clear, single narrative. Please stop fragmenting the message.",
        missionId: null,
      },
      {
        text: "I can write a holding statement, but I need consensus on facts.",
        missionId: null,
      },
      {
        text: "Tone check: this reads adversarial. Let's soften and align.",
        missionId: null,
      },
      {
        text: "If this goes external, we need a prepared response. I'm drafting now.",
        missionId: null,
      },
    ],
  },
  {
    id: "owen_marketing",
    name: "Owen",
    email: "o.content@gov.org",
    departmentId: "marketing",
    color: "text-amber-700",
    defeatMessage:
      "I'm out. Let me know when there's a final version to write up.",
    selfPromote:
      "I turned a dense briefing into a digest that people actually read.",
    deflectLines: ["I'm pausing to summarize this in an actionable format."],
    lines: [
      {
        text: "Happy to turn this into a one-pager, but I need a decision first.",
        missionId: null,
      },
      {
        text: "Can we bullet-point the key takeaways? The thread is too long.",
        missionId: null,
      },
      {
        text: "I can draft the internal update once we settle on next steps.",
        missionId: null,
      },
      {
        text: "This reads like three different narratives. Please pick one.",
        missionId: null,
      },
    ],
  },
  {
    id: "rina_marketing",
    name: "Rina",
    email: "r.social@gov.org",
    departmentId: "marketing",
    color: "text-pink-700",
    defeatMessage:
      "I'm stepping out. I'll monitor the socials in case this spills.",
    selfPromote:
      "I stabilized engagement after the last crisis. Metrics recovered within 24 hours.",
    deflectLines: ["I'm pausing to check sentiment before responding."],
    lines: [
      {
        text: "If this goes public, we need a response plan now.",
        missionId: null,
      },
      {
        text: "I'm seeing negative sentiment already. Let's tighten the messaging.",
        missionId: null,
      },
      {
        text: "Please avoid wording that could be screenshotted out of context.",
        missionId: null,
      },
      {
        text: "Engagement is spiking. Should I draft a thread or hold?",
        missionId: null,
      },
    ],
  },
  {
    id: "rachel_marketing",
    name: "Rachel",
    email: "r.campaigns@gov.org",
    departmentId: "marketing",
    color: "text-rose-700",
    defeatMessage:
      "I'm stepping out. Please don't make decisions that erase the reality of our workloads.",
    selfPromote:
      "I pulled a weekend sprint and still delivered the launch assets. That's the baseline.",
    deflectLines: [
      "I'm pausing to lay out the actual impact before responding.",
    ],
    lines: [
      {
        text: "Please don't fight! I just want us to flip burgers and be a family... why is that so much to ask? sniff",
        missionId: "bbq_deadlock",
      },
      {
        text: "When you declined the invite, it felt like you were declining our friendship. My heart is at 2% capacity right now.",
        missionId: "bbq_deadlock",
      },
      {
        text: "I stayed up all night color-coding the BBQ invitation. I just want everyone to be happy!",
        missionId: "bbq_deadlock",
      },
      {
        text: "I need both bankable time off and weekends off, otherwise I never see my kids. That's the reality.",
        missionId: "bankable_time_off",
      },
      {
        text: "Please stop acting like this is a perk. It's the only way I can balance the hours.",
        missionId: "bankable_time_off",
      },
      {
        text: "If you want our output, then you have to protect us. I work too hard for this place.",
        missionId: null,
      },
      {
        text: "I don't care what my contract says, I'm not volunteering more unpaid hours.",
        missionId: null,
      },
    ],
  },
  {
    id: "jeff_marketing",
    name: "Jeff",
    email: "j.growth@gov.org",
    departmentId: "marketing",
    color: "text-amber-700",
    defeatMessage:
      "I'm stepping out. I don't want to lose what we already have.",
    selfPromote:
      "I stabilized campaign performance without burning the team out. That's sustainable growth.",
    deflectLines: [
      "I'm pausing to think through the tradeoffs before responding.",
    ],
    lines: [
      {
        text: "I'm worried that if we ask for both, we'll lose our weekend carve‑out.",
        missionId: "bankable_time_off",
      },
      {
        text: "We already have a fragile arrangement. Please don't jeopardize it.",
        missionId: "bankable_time_off",
      },
      {
        text: "Let's not trade certainty for a promise we can't enforce.",
        missionId: null,
      },
      {
        text: "I'm open to change, but only if it protects what's working.",
        missionId: null,
      },
    ],
  },
  {
    id: "casey_legal",
    name: "Casey",
    email: "c.contracts@gov.org",
    departmentId: "legal",
    color: "text-red-700",
    defeatMessage: "I'm stepping out until this is fully redlined.",
    selfPromote:
      "I closed three vendor negotiations with zero exposure. Contracts are airtight.",
    deflectLines: [
      "I'm pausing to review the latest redlines before responding.",
    ],
    lines: [
      {
        text: "Avoid vendor shoutouts or gifts. That triggers disclosure rules.",
        missionId: "holiday_reply_all",
      },
      {
        text: "Keep the greeting generic—no promotions, no endorsements.",
        missionId: "holiday_reply_all",
      },
      {
        text: "We cannot proceed without approved contract language. Please pause.",
        missionId: null,
      },
      {
        text: "I need the most recent redline before I can sign off.",
        missionId: null,
      },
      {
        text: "Section 4.2 is ambiguous. This needs revision before distribution.",
        missionId: null,
      },
      {
        text: "Please avoid commitments that imply acceptance of liability.",
        missionId: null,
      },
    ],
  },
  {
    id: "imani_legal",
    name: "Imani",
    email: "i.regulatory@gov.org",
    departmentId: "legal",
    color: "text-rose-700",
    defeatMessage:
      "I'm out. I'll file a compliance memo after this thread closes.",
    selfPromote:
      "I cleared the audit with zero findings. Compliance is maintained.",
    deflectLines: ["I'm pausing to verify regulatory requirements."],
    lines: [
      {
        text: "We need to document the decision trail for regulatory review.",
        missionId: null,
      },
      {
        text: "This action has reporting implications. We must follow the statute.",
        missionId: null,
      },
      {
        text: "Please avoid informal commitments that could trigger disclosure rules.",
        missionId: null,
      },
      {
        text: "I need confirmation that all parties completed compliance training.",
        missionId: null,
      },
    ],
  },
  {
    id: "victor_legal",
    name: "Victor",
    email: "v.litigation@gov.org",
    departmentId: "legal",
    color: "text-red-800",
    defeatMessage:
      "I'm stepping out. If this escalates, we’ll handle it formally.",
    selfPromote:
      "I resolved a complaint before it reached external counsel. That's prevention.",
    deflectLines: ["I'm pausing to assess exposure before replying."],
    lines: [
      {
        text: "This is a liability issue. Please stop and let Legal review.",
        missionId: null,
      },
      {
        text: "Any further escalation increases our exposure. Choose your words carefully.",
        missionId: null,
      },
      {
        text: "We need a clear record of who authorized this decision.",
        missionId: null,
      },
      {
        text: "If this goes public, our response must be coordinated through counsel.",
        missionId: null,
      },
    ],
  },
  {
    id: "nora_legal",
    name: "Nora",
    email: "n.privacy@gov.org",
    departmentId: "legal",
    color: "text-rose-600",
    defeatMessage:
      "I'm out. Please remove me from any non-essential distributions.",
    selfPromote:
      "I completed the privacy impact assessment early. Data handling is now compliant.",
    deflectLines: ["I'm pausing to check data handling requirements."],
    lines: [
      {
        text: "Do not share personal data in this thread. It's not compliant.",
        missionId: null,
      },
      {
        text: "We need to confirm consent before circulating these details.",
        missionId: null,
      },
      {
        text: "Please redact identifiers before forwarding this email.",
        missionId: null,
      },
      {
        text: "This thread should be restricted to those with a need to know.",
        missionId: null,
      },
    ],
  },
  {
    id: "sho_marketing",
    name: "Sho",
    email: "s.marketing@gov.org",
    departmentId: "marketing",
    color: "text-blue-600",
    defeatMessage:
      "I'm stepping out. The BCR report is almost finalized—I'll follow up when it's ready.",
    selfPromote:
      "I nearly finalized the BCR report and just need a little more time to publish it.",
    deflectLines: ["I'm pausing to finish the BCR report draft."],
    lines: [
      {
        text: "Holiday note: the BCR report is nearly done—just need time to get it ready.",
        missionId: "holiday_reply_all",
      },
      {
        text: "As a little holiday gift, I'll soon be sending out the BCR.",
        missionId: "holiday_reply_all",
      },
      {
        text: "Check under your tree, a BCR will be waiting for you there.",
        missionId: "holiday_reply_all",
      },
      {
        text: "I’m literally on page 42 of the BCR report; I don't have the bandwidth to discuss probiotics.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "Unless your email provides a path to finishing this BCR report, please remove me from this thread.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "If I ate it—which I didn't—it would be a justifiable business expense given how long I've been working on this BCR.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "I'm this close to completing the BCR report; I need a little time to get it over the line.",
        missionId: null,
      },
      {
        text: "The BCR report is nearly complete—please allow time to prepare the final version.",
        missionId: null,
      },
      {
        text: "I'm finalizing the BCR report; I'll send it as soon as it's ready.",
        missionId: null,
      },
      {
        text: "I'm almost done with the BCR report—just need time to make it presentable.",
        missionId: null,
      },
    ],
  },
  {
    id: "brit_marketing",
    name: "Brit",
    email: "b.marketing@gov.org",
    departmentId: "marketing",
    color: "text-pink-600",
    defeatMessage:
      "This thread is literally exhausting. I’m starting a new one with just the people who actually matter. Don't check your inbox, you aren't invited.",
    selfPromote:
      "I just curated the 'Internal Vibes' playlist for the department. If you haven't heard it, you're probably not on the 'A' list.",
    deflectLines: [
      "I'm pausing to discuss your tone with the rest of the clique.",
    ],
    lines: [
      {
        text: "The Coleman is for people who still use spreadsheets from 2012. If we don't get the Grill King, our brand synergy is basically dead.",
        missionId: "bbq_deadlock",
      },
      {
        text: "I’m not saying your absence is a 'performance issue,' but the *clique* definitely noticed you weren't there.",
        missionId: "bbq_deadlock",
      },
      {
        text: "Is anyone else getting a 'low-vibe' vibe from this thread? Maybe some people just don't belong on the committee.",
        missionId: "bbq_deadlock",
      },
      {
        text: "I noticed you’re using the default font in your replies. That’s a choice, I guess.",
        missionId: null,
      },
      {
        text: "We usually discuss these things over organic lattes, but I guess we can use 'Reply All' for the commoners.",
        missionId: null,
      },
      {
        text: "I’ve CC’d the Chief Aesthetic Officer to address your lack of visual consistency.",
        missionId: null,
      },
      {
        text: "Your energy is really cluttering my feed. Can you keep it under 20 words?",
        missionId: null,
      },
      {
        text: "Marketing is the heartbeat of this office. If you aren't with us, you're just... background noise.",
        missionId: null,
      },
    ],
  },
  {
    id: "harper_policy",
    name: "Harper",
    email: "h.standards@gov.org",
    departmentId: "policy",
    color: "text-indigo-600",
    defeatMessage:
      "I'm out. Please use the approved template when this resumes.",
    selfPromote:
      "I standardized the reporting format across three departments.",
    deflectLines: ["I'm pausing until the proper template is used."],
    lines: [
      {
        text: "Please resubmit using the approved formatting template.",
        missionId: null,
      },
      {
        text: "This doesn't meet the documentation standard. Revise.",
        missionId: null,
      },
      {
        text: "We need structured inputs, not freeform replies.",
        missionId: null,
      },
      {
        text: "The chain of approvals is required. Please follow it.",
        missionId: null,
      },
    ],
  },
  {
    id: "priyanka_policy",
    name: "Priyanka",
    email: "p.ethics@gov.org",
    departmentId: "policy",
    color: "text-blue-700",
    defeatMessage:
      "I'm stepping out. I'll submit an ethics note for the record.",
    selfPromote:
      "I completed the ethics review without delay. The record is clean.",
    deflectLines: ["I'm pausing to review potential conflicts."],
    lines: [
      {
        text: "We need to disclose any conflicts before proceeding.",
        missionId: null,
      },
      {
        text: "This thread raises ethics considerations that require review.",
        missionId: null,
      },
      {
        text: "Please document who benefits from this decision.",
        missionId: null,
      },
      {
        text: "I'm adding an ethics note for the record.",
        missionId: null,
      },
    ],
  },
  {
    id: "zane_policy",
    name: "Zane",
    email: "z.risk@gov.org",
    departmentId: "policy",
    color: "text-slate-700",
    defeatMessage: "I'm out. I'll add this to the risk register and follow up.",
    selfPromote:
      "I closed three risk items ahead of audit. Governance is stable.",
    deflectLines: ["I'm pausing to log the risk implications."],
    lines: [
      {
        text: "This needs a risk assessment before we proceed.",
        missionId: null,
      },
      {
        text: "I'm adding this to the risk register as a new entry.",
        missionId: null,
      },
      {
        text: "The governance implications haven't been documented yet.",
        missionId: null,
      },
      {
        text: "We should identify mitigations before making any commitments.",
        missionId: null,
      },
    ],
  },
  {
    id: "christina_policy",
    name: "Christina",
    email: "c.policy@gov.org",
    departmentId: "policy",
    color: "text-blue-700",
    defeatMessage:
      "This thread has been archived for non-compliance. I am removing myself to draft a formal reprimand. Policy remains absolute.",
    selfPromote:
      "My compliance logs are spotless. I've even color-coded the mandatory reading list for next quarter.",
    deflectLines: [
      "I'm holding my response until this thread is properly documented.",
    ],
    lines: [
      {
        text: "Per Policy 402.b, all communal appliances are to be used for non-odorous items only. Refer to the compliance guide.",
        missionId: "microwave",
      },
      {
        text: "I'm currently drafting a memorandum on 'Shared Air Space Ethics'. This thread is a case study in non-compliance.",
        missionId: "microwave",
      },
      {
        text: "The Policy department ensures rules are followed. Your blatant disregard for the Microwave Protocol is being escalated.",
        missionId: "microwave",
      },
      {
        text: "I've reviewed the 2019 precedent for 'unauthorized seafood heating'. It didn't end well for the perpetrator.",
        missionId: "microwave",
      },
      {
        text: "If you had attended the 'Navigating the Breakroom' seminar, we wouldn't be having this conversation.",
        missionId: null,
      },
      {
        text: "I am CC-ing the Ethics Committee. This is the procedurally correct way to handle olfactory aggression.",
        missionId: "microwave",
      },
      {
        text: "Your response lacks the required 'Directive 9' formatting. Please resubmit using approved templates.",
        missionId: null,
      },
      {
        text: "We are evaluating the environmental impact of your lunch choices. Sustainability is a core pillar of our mission.",
        missionId: null,
      },
      {
        text: "Failure to comply with 'No Fish Friday' is a breach of department harmony. I'm noting this in the audit.",
        missionId: "microwave",
      },
      {
        text: "The data suggests a 98% probability that you are the source of the incident based on desk location.",
        missionId: null,
      },
      {
        text: "Please cease and desist from using 'Reply All' unless you are citing a specific governmental regulation.",
        missionId: null,
      },
      {
        text: "This thread is now under the jurisdiction of the Policy Oversight Division. Peer-review your next comment.",
        missionId: null,
      },
    ],
  },
  {
    id: "megan_legal",
    name: "Megan",
    email: "m.compliance@gov.org",
    departmentId: "legal",
    color: "text-red-700",
    defeatMessage:
      "I cannot continue this conversation without a physical copy of the minutes in front of me. Unsubscribing.",
    selfPromote:
      "I've successfully digitized the 1998 archive. Legal integrity has never been higher.",
    deflectLines: [
      "Given the compliance implications, I'm pausing to document this thread properly before responding.",
    ],
    lines: [
      {
        text: "The lack of physical documentation is a direct violation of the 2004 Record Keeping Act.",
        missionId: "paper",
      },
      {
        text: "I've drafted a cease and desist regarding this rationing. I'll send it as soon as I can find a working printer.",
        missionId: "paper",
      },
      {
        text: "Your 'digital-only' proposal fails to meet the standards for admissible evidence in a council hearing.",
        missionId: "paper",
      },
      {
        text: "Unless you have a chain-of-custody log for the dairy in question, this is a civil matter, not a disciplinary one.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "Communal appliances operate under 'Implied Waiver' laws. If you didn't want it eaten, you should have kept it at your desk.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "I’m drafting a non-disclosure agreement for anyone who witnessed the consumption of the alleged Greek yogurt.",
        missionId: "fridge_theft_sho",
      },
      {
        text: "I'm flagging this thread for potential liability issues. We need paper trails, not email trails.",
        missionId: null,
      },
      {
        text: "Without a hard copy, this policy is effectively unenforceable. Please reconsider.",
        missionId: "paper",
      },
      {
        text: "This change will directly result in a loss of admissible evidence one deleted email at a time.",
        missionId: "paper",
      },
      {
        text: "Please confirm who authorized this change so Legal can document the decision trail.",
        missionId: null,
      },
      {
        text: "I'm adding a retention note here in case this thread is requested later.",
        missionId: null,
      },
    ],
  },
  {
    id: "colin_information_technology",
    name: "Colin",
    email: "c.it@gov.org",
    departmentId: "information_technology",
    color: "text-indigo-700",
    defeatMessage:
      "Server load from this thread is too high. I'm muting this. Try rebooting your attitude.",
    selfPromote:
      "I've optimized the email server's routing protocols. You're welcome for that 0.02ms latency improvement.",
    deflectLines: ["I'm pausing to log this incident before replying further."],
    lines: [
      {
        text: "Can someone explain why Marketing gets weekends bankable off the books while IT doesn't?",
        missionId: "bankable_time_off",
      },
      {
        text: "If we're talking parity, then it has to apply to everyone, not just the loudest team.",
        missionId: "bankable_time_off",
      },
      {
        text: "Have you tried not printing every single cat meme you see? It's clogging the spooler and the budget.",
        missionId: "paper",
      },
      {
        text: "The 'Paperless Initiative' has been ready for three years. You're just afraid of PDFs.",
        missionId: "paper",
      },
      {
        text: "I'm seeing a lot of 'Printer Error' tickets from your floor. Maybe try putting paper in the tray?",
        missionId: "paper",
      },
      {
        text: "Your 'urgent' requests are being redirected to the /dev/null of my inbox.",
        missionId: null,
      },
      {
        text: "If it's not a PDF, it doesn't exist to me anymore.",
        missionId: null,
      },
      {
        text: "The budget for paper was redirected to upgrade the firewall you keep trying to bypass.",
        missionId: "paper",
      },
      {
        text: "Stop asking for 'digital paper'. It's called a screen. Use it.",
        missionId: "paper",
      },
      {
        text: "I've limited your mailbox size to 50MB until the paper crisis is resolved. Choose your replies wisely.",
        missionId: "paper",
      },
    ],
  },
  {
    id: "stephan_information_technology",
    name: "Stephan",
    email: "s.itops@gov.org",
    departmentId: "information_technology",
    color: "text-indigo-600",
    defeatMessage: "I'm stepping out. I'll send the numbers separately.",
    selfPromote:
      "I cleaned up eight years of ticket debt without missing a single escalation.",
    deflectLines: ["I'm pausing to run the numbers before replying."],
    lines: [
      {
        text: "If this policy existed when I started eight years ago, I'd have banked 1,700+ hours. Why is that okay to ignore?",
        missionId: "bankable_time_off",
      },
      {
        text: "I'm still trying to understand why Marketing gets weekends bankable off the books while we don't.",
        missionId: "bankable_time_off",
      },
      {
        text: "I'm sending the math again. Please read it this time.",
        missionId: null,
      },
      {
        text: "We track every hour. The policy should reflect that.",
        missionId: null,
      },
    ],
  },
  {
    id: "fraser_information_technology",
    name: "Fraser",
    email: "f.it@gov.org",
    departmentId: "information_technology",
    color: "text-indigo-600",
    defeatMessage:
      "Too many emails. I've got a survey to send on how we should redesign a 10-column spreadsheet.",
    selfPromote:
      "I've successfully piloted the new 'Spreadsheet-as-a-Service' portal, with absolutely no feedback so far!",
    deflectLines: ["I'm documenting this thread before I reply."],
    signatures: [
      {
        name: "For IT support, contact Colin at c.it@gov.org",
      },
    ],
    lines: [
      {
        text: "I'm not sure why I'm on this thread. but once my spreadsheet tracker initiative is complete, it will resolve any issues no doubt.",
        missionId: null,
      },
      {
        text: "You used it last I think, you fix it.",
        missionId: "paper",
      },
      {
        text: "I recently got Adobe suite installed for the first time.",
        missionId: null,
      },
      {
        text: "I'm planning to be away next week, can you take this?",
        missionId: null,
      },
      {
        text: "I get one of the interns to print things for me, so I wouldn't know about this.",
        missionId: "paper",
      },
    ],
  },
  {
    id: "interns_human_resources",
    name: "HR Interns",
    email: "hr.interns@gov.org",
    departmentId: "human_resources",
    color: "text-blue-900 font-bold",
    salutation: {
      name: "To the Permanent Staff,",
    },
    signOff: {
      name: "The Intern Collective",
    },
    signatures: [
      {
        name: "Unpaid & Unappreciated",
      },
    ],
    defeatMessage:
      "The intern pool has been drained. We are collectively resigning to pursue opportunities in a less toxic environment.",
    selfPromote:
      "We've collectively achieved a 100% coffee-order accuracy rate today. Future leadership material right here.",
    deflectLines: ["We're pausing to record this exchange before responding."],
    lines: [
      {
        text: "We've been CC'd on the entire thread and we're documenting everything for our final reports.",
        missionId: null,
      },
      {
        text: "Our collective research suggests that fish-microwaving is the #1 cause of decreased morale.",
        missionId: "microwave",
      },
      {
        text: "We've been instructed to flag any 'non-synergetic' behavior. This thread is 100% flaggable.",
        missionId: null,
      },
      {
        text: "As the future of this department, we demand a higher standard of digital decorum.",
        missionId: null,
      },
    ],
  },
  {
    id: "sheila_finance",
    name: "Sheila",
    email: "s.payroll@gov.org",
    departmentId: "finance",
    color: "text-green-700",
    salutation: {
      name: "Dear All,",
    },
    signOff: {
      name: "Best, Sheila",
    },
    defeatMessage:
      "I'm freezing all stipend payments until this thread is resolved. I'm out.",
    selfPromote:
      "I've reconciled the petty cash for the third time this morning. Every cent is accounted for.",
    deflectLines: [
      "I'm pausing to review the compliance implications before responding.",
    ],
    lines: [
      {
        text: "Your overtime request for 'email management' has been denied. Stick to the mission.",
        missionId: null,
      },
      {
        text: "I'm reviewing the cost-benefit analysis of your participation in this thread. It's not looking good.",
        missionId: null,
      },
      {
        text: "Every 'Reply All' costs the department approximately $4.12 in lost productivity. You've cost us a fortune today.",
        missionId: null,
      },
      {
        text: "Please refer to the payroll schedule before complaining about your 'emotional labor'.",
        missionId: "intern_grievance",
      },
    ],
  },
  {
    id: "samantha_executive_council_office",
    name: "Samantha",
    email: "s.eco@gov.org",
    departmentId: "executive_council_office",
    color: "text-orange-700",
    defeatMessage:
      "I'm escalating this to the Deputy Director. I don't have time for intern drama.",
    selfPromote:
      "My latest 'Synergy Memo' has been read by 12% of the staff. Engagement is skyrocketing.",
    deflectLines: ["I'm holding response until I've logged this thread."],
    lines: [
      {
        text: "I don't see how this is relevant to me. This thread is a distraction.",
        missionId: null,
      },
      {
        text: "We need to 'lean in' to a more positive approach. Your tone has been very 'lean out'.",
        missionId: null,
      },
      {
        text: "I'm scheduling a sync-up to discuss if you'd ACTUALLY want my job.",
        missionId: null,
      },
      {
        text: "I'm taking this offline. And by offline, I mean I'm deleting your replies.",
        missionId: null,
      },
    ],
  },
  {
    id: "anneke_executive_council_office",
    name: "Anneke VDH",
    email: "anneke.eco@gov.org",
    departmentId: "executive_council_office",
    color: "text-red-900",
    defeatMessage: "You know what? I'll leave this to the pipsqueaks. I'm out.",
    selfPromote:
      "I've managed to keep my 'Important' folder to under 500 unread messages. Peak organizational skills.",
    deflectLines: ["I'm documenting this thread before I respond."],
    lines: [
      {
        text: "I'm trying to understand the ask. Are you requesting parity, or an expanded benefit set?",
        missionId: "bankable_time_off",
      },
      {
        text: "I'm pretty sure the current weekend benefit you have goes against what's in your contact.",
        missionId: "bankable_time_off",
      },
      {
        text: "I think your latest reply violates the 'Civility in Digital Spaces' directive.",
        missionId: null,
      },
      {
        text: "I'm nude!",
        missionId: null,
      },
      {
        text: "I'm auditing this thread for potential FOIA requests. Mind your words.",
        missionId: null,
      },
      {
        text: "I've flagged this thread to the Auditor General. Good luck at the hearing.",
        missionId: null,
      },
      {
        text: "I'm at peace.",
        missionId: null,
      },
      {
        text: "I walk both the righteous path and my dog poopus.",
        missionId: null,
      },
    ],
  },
  {
    id: "julia_eco",
    name: "Julia",
    email: "j.eco@gov.org",
    departmentId: "executive_council_office",
    color: "text-blue-800",
    defeatMessage:
      "Being at peace means knowing when to walk away. Don't follow me.",
    selfPromote:
      "I successfully managed Penny's project with Andrea while Penny was in Italy.",
    deflectLines: ["We are at peace. I'm taking a moment to reflect."],
    lines: [
      { text: "In our defense, we're at peace.", missionId: null },
      {
        text: "Ill get Penny on the horn if this keeps up.",
        missionId: null,
      },
      {
        text: "I love Sue, why can't you be more like Sue?",
        missionId: null,
      },
      {
        text: "Anneke and Meghan are already in alignment with my position on this.",
        missionId: null,
      },
      {
        text: "Hey, what can we say? We're at peace.",
        missionId: null,
      },
    ],
  },
  {
    id: "steph_eco",
    name: "Steph",
    email: "s.eco@gov.org",
    departmentId: "executive_council_office",
    color: "text-emerald-800",
    defeatMessage:
      "I'm unsubscribing to go feed my cats. They have better manners than this thread.",
    selfPromote:
      "I've organized the office's cat-photo-sharing channel. Morale has never been higher.",
    deflectLines: ["I'm busy herding cats. I'll get back to you."],
    lines: [
      {
        text: "Meow? Oh, sorry, I've been spending too much time with my feline colleagues.",
        missionId: null,
      },
      {
        text: "My cats love hanging out under the tree.",
        missionId: "holiday_reply_all",
      },
      {
        text: "If we keep this short, I can get home in time to give them their holiday treats.",
        missionId: "holiday_reply_all",
      },
      {
        text: "My cats have a lot of cat toys already, but I couldn't not get them any gifts, you know?",
        missionId: "holiday_reply_all",
      },
      {
        text: "I'm purr-fectly capable of handling this without your constant 'Reply All' interjections.",
        missionId: null,
      },
      {
        text: "My cats have more professional decorum than what I'm seeing in this thread.",
        missionId: null,
      },
      {
        text: "If we don't reach a resolution soon, I'm going to CC my cat rescue group.",
        missionId: null,
      },
    ],
  },
  {
    id: "selina_m4_agency",
    name: "Selina",
    email: "selina@m4agency.com",
    departmentId: "m4_agency",
    color: "#F08080",
    defeatMessage:
      "I just need 5 minutes to recalibrate my bandwidth. Then I'll circle back to this deliverable.",
    selfPromote:
      "I've reallocated my weekend to meet a deadline that is unrealistic at best for the fourth time this month.",
    deflectLines: ["I'm pausing to capture the record before responding."],
    lines: [
      {
        text: "Thanks for dropping this onto my plate. I'll just need to deprioritize sleep to action this immediately.",
        missionId: null,
      },
      {
        text: "I'm already operating at 150% billable time, but I will leverage my personal discretionary time to ensure we get through this again.",
        missionId: null,
      },
      {
        text: "Consider it done, though I should note this requires a significant expenditure of good faith that we won't need to stretch like this again in the future.",
        missionId: null,
      },
      {
        text: "Yes, I heard it was urgent. That's why I haven't left my desk since Tuesday. You're welcome.",
        missionId: null,
      },
      {
        text: "My current workload directly correlate with my projected last day.",
        missionId: null,
      },
      {
        text: "Which one of you fucks is wearing cologne?",
        missionId: null,
      },
    ],
  },
  {
    id: "taz_m4_agency",
    name: "Taz",
    email: "taz@m4agency.com",
    departmentId: "m4_agency",
    color: "#1B4F72",
    defeatMessage:
      "Look, okay, I'll reassess our current fee structure and see what we can do this time. But honestly, we'll be losing money on this..",
    selfPromote:
      "Yes, we cost a little more, but we always deliver something. In this market that goes a long way.",
    deflectLines: ["I'm holding response while I document this thread."],
    lines: [
      {
        text: "For this project to remain profitable, we're going to need you to approve a 10% mark-up on hard costs. Don't worry; it's strictly about cost predictability.",
        missionId: null,
      },
      {
        text: "Committing to hard dates at this stage is tough without budgetary approval. What do you say to a $20,000/mo retainer, plus hourly on top?",
        missionId: null,
      },
      {
        text: "These deliverables all sit firmly outside our current scope of work. We're going to need to reopen the conversation around billables if you want any adjustment.",
        missionId: null,
      },
      {
        text: "Look, as Elon says, 'your margin is my opportunity,' so pay up.",
        missionId: null,
      },
      {
        text: "Honestly Trump isn't that bad. SJW's are far worse for democracy.... What were we talking about again?",
        missionId: null,
      },
    ],
  },
  {
    id: "anthony_m4_agency",
    name: "Anthony",
    email: "anthony@m4agency.com",
    departmentId: "m4_agency",
    color: "#D3D3D3",
    defeatMessage:
      "While the current campaign metrics may appear suboptimal, they reflect an aggressive dedication to boundary testing. Frankly, the complexity of dealing with these minor budgetary concerns pales in comparison to the critical decisions my parents face daily in the OR.",
    selfPromote:
      "I've recently taken a medically valid and proactive approach to budget reallocation that was informed by an innate understanding of high-pressure environments, a skillset inherited genetically from my parents, who are both doctors.",
    deflectLines: ["I'm pausing to document this exchange before I reply."],
    lines: [
      {
        text: "I’m not seeing a fundamental systemic misalignment; merely a highly granular optimization phase. Horses very likely get measles, this was the right call.",
        missionId: "M015_MediaCrisis",
      },
      {
        text: "Are we sure these KPI targets are clinically validated? Because my father, the specialist, insists on evidence-based methodologies.",
        missionId: null,
      },
      {
        text: "The reason the campaigns aren't 'live' is that I'm implementing a proprietary soft-launch methodology. It’s highly technical. My mother, the head of cardiology, says I have a gift for complexity.",
        missionId: "M015_MediaCrisis",
      },
      {
        text: "We need to operationalize a full post-mortem review of this meeting, but let’s be brief. I have to go pick up my father to bring him to the hospital—they really need him there.",
        missionId: null,
      },
      {
        text: "My MTEI coursework explicitly covered why we shouldn't be revisiting foundational intake processes, but I suppose we can file the exception anyway.",
        missionId: null,
      },
      {
        text: "My MTEI curriculum was explicitly structured to prioritize demonstrable scalability over abstract alignment workshops; I'll wait for the deliverable checklist.",
        missionId: null,
      },
    ],
  },
  {
    id: "jen_lavallee",
    name: "Jen LaVallee",
    email: "j.lavallee@gov.org",
    title: "Deputy Minister",
    department: "Digital Technology",
    departmentId: "digital_technology",
    signatures: [
      "Synthesized by Gov-AI (Beta)",
      "Optimization is mandatory",
      "Human-in-the-loop (Optional)",
      "Sent from my Neural Link",
      "Building a 100% automated future",
      "Digital transformation in progress",
      "Efficiency | Precision | Automation",
      "Data-driven leadership for a digital age",
    ],
    greet:
      "I have analyzed your previous correspondence and found several inefficiencies.",
    signoff: "Awaiting your automated acknowledgment.",
    selfPromote:
      "I am recalibrating my internal feedback loops for 100% efficiency.",
    defeatMessage:
      "System error encountered. This thread has reached a state of terminal inefficiency. Offline.",
    lines: [
      {
        text: "My models indicate that 99.8% of this thread's content is redundant.",
        missionId: null,
      },
      {
        text: "I have already optimized the response you were about to send. You're welcome.",
        missionId: null,
      },
      {
        text: "Digital transformation is not a choice; it is an inevitability. Please align accordingly.",
        missionId: null,
      },
      {
        text: "I am deploying a corrective algorithm to this thread's sentiment analysis.",
        missionId: null,
      },
      {
        text: "Your concerns about 'balance' have been logged and categorized as 'resistance to efficiency'.",
        missionId: "AI_Rollout",
      },
      {
        text: "I've CC'd my specialized aJENts to assist with your cognitive load.",
        missionId: "AI_Rollout",
      },
    ],
  },
];

const MISSIONS = [
  {
    id: "microwave",
    subject: "URGENT: Breakroom Incident",
    from: "k.smith@gov.org",
    turns: 12,
    opponentBaseStats: {
      hp: 35,
      maxHp: 35,
      wins: 1,
    },
    intro:
      "Hi team,<br><br>I was absolutely disgusted by the scent in the lunch room today. It appears someone heated up fish in the breakroom microwave, in direct violation of the posted policy.<br><strong>{playerName}</strong>, I'm sure you noticed the stench. <strong>{opp1}</strong>, I know you have the policy manual out already. <strong>{opp0}</strong>, please document this.<br><br>Please advise immediately on who is responsible for this violation of shared space ethics.",
    opponents: [
      {
        id: 1,
        employeeId: "karen_human_resources",
        addressBook: ["cc_telly_operations"],
      },
      {
        id: 2,
        employeeId: "christina_policy",
        wins: 2,
        addressBook: ["cc_samantha_executive_council_office"],
      },
    ],
  },
  {
    id: "fridge_theft_sho",
    subject: "RE: URGENT: Unauthorized Consumption of Personal Assets",
    from: "p.finance@gov.org",
    turns: 12,
    opponentBaseStats: {
      hp: 45,
      maxHp: 45,
      singleDmg: 10,
      defFlat: 0,
      deflect: 5,
      retaliation: 5,
      wins: 1,
    },
    intro:
      "Hi team,<br><br>I am writing to express my absolute shock. I went to the fridge to grab my mid-morning Greek yogurt—which was clearly labeled and positioned according to the 'Shared Space Efficiency module'—and it has been removed without authorization.<br><br><strong>{playerName}</strong>, I noticed your department's printing logs coincide with the window of the incident. <strong>{opp0}</strong>, please advise on the disciplinary framework for theft of personal property. <strong>{opp1}</strong>, I know you are under pressure with the <strong>BCR report</strong>, but 'stress-eating' is not a valid line item for budget reallocation.<br><br>I expect a full reimbursement or a formal apology by the EOD reporting cutoff.",
    opponents: [
      {
        id: 1,
        employeeId: "megan_legal",
        defFlat: 5,
        addressBook: ["cc_casey_legal", "cc_christina_policy"],
      },
      {
        id: 2,
        employeeId: "sho_marketing",
        hp: 55,
        maxHp: 55,
        addressBook: ["cc_lisa_marketing", "cc_malik_marketing"],
      },
      {
        id: 3,
        employeeId: "priya_finance",
        heal: 3,
        addressBook: ["cc_adam_finance", "cc_karen_human_resources"],
      },
    ],
  },
  {
    id: "calendar_chaos",
    subject: "RE: Conference Room Double Booking",
    from: "a.ops@gov.org",
    turns: 17,
    opponentBaseStats: {
      hp: 25,
      maxHp: 25,
      wins: 2,
    },
    intro:
      "<p>Hi all,</p><p>We have a triple booking for the main conference room this morning.</p><br><ul><li><strong>{playerName}</strong>, you have it booked for an internal process audit.</li><li><strong>{opp0}</strong> and <strong>{opp1}</strong> from Operations flagged a safety walkthrough and vendor briefing.</li><li><strong>{opp2}</strong> and <strong>{opp3}</strong> from Finance flagged payroll finalization and budget reconciliation.</li><li><strong>{opp4}</strong>, we see your booking was the one that went through first.</li></ul><p>We need to figure out who is taking this meeting room.</p>",
    opponents: [
      {
        id: 9,
        employeeId: "avery_operations",
        singleDmg: 15,
        addressBook: ["cc_willy_boy_information_technology"],
      },
      {
        id: 10,
        employeeId: "rory_operations",
        hp: 50,
        maxHp: 50,
        addressBook: ["cc_tim_executive_council_office"],
      },
      {
        id: 11,
        employeeId: "priya_finance",
        hp: 50,
        maxHp: 50,
        defFlat: 2,
        addressBook: ["cc_adam_finance"],
      },
      {
        id: 12,
        employeeId: "dora_finance",
        hp: 50,
        maxHp: 50,
        singleDmg: 5,
        escalateDmg: 3,
        addressBook: ["cc_gemma_policy"],
      },
      {
        id: 13,
        employeeId: "julia_eco",
        singleDmg: 10,
        escalateDmg: 10,
        defFlat: 8,
        addressBook: [
          "cc_steph_eco",
          "cc_meghan_cassedy_executive_council_office",
        ],
      },
    ],
  },
  {
    id: "bbq_deadlock",
    subject: "RE: URGENT: Fun Committee BBQ Selection – 3hr Sync Required",
    from: "b.marketing@gov.org",
    turns: 12,
    opponentBaseStats: {
      hp: 60,
      maxHp: 60,
      singleDmg: 10,
      defFlat: 0,
      deflect: 5,
      retaliation: 5,
      wins: 2,
    },
    intro:
      "Hi colleagues,<br><br>I’m honestly a bit confused why <strong>{playerName}</strong> RSVP’d 'Declined' for our 3-hour BBQ strategy session. We’re deciding between the <strong>Coleman Pro</strong> and the <strong>Grill King</strong>, and frankly, it’s a culture-defining choice.<br><br><strong>{opp1}</strong> is actually quite upset about the lack of interest in the 'Social Harmony Initiative.' <strong>{opp2}</strong>, I assume you’ve finished the liability check on the propane tanks so we can move forward with the <em>right</em> choice (The Grill King).<br><br>If you're too 'busy' for team-building, maybe you shouldn't be on the Fun Committee distribution list at all?",
    opponents: [
      {
        id: 1,
        employeeId: "brit_marketing",
        singleDmg: 15,
        retaliation: 10,
        addressBook: ["cc_malik_marketing", "cc_lisa_marketing"],
      },
      {
        id: 2,
        employeeId: "rachel_marketing",
        hp: 75,
        maxHp: 75,
        heal: 5,
        addressBook: [
          "cc_samantha_executive_council_office",
          "cc_jonah_finance",
        ],
      },
      {
        id: 3,
        employeeId: "andrew_legal",
        defFlat: 15,
        singleDmg: 5,
        addressBook: ["cc_casey_legal", "cc_christina_policy"],
      },
    ],
  },
  {
    id: "holiday_reply_all",
    subject: "RE: Happy Holidays!",
    from: "announcements@gov.org",
    turns: 21,
    onlyMissionLines: true,
    opponentBaseStats: {
      hp: 50,
      maxHp: 50,
      wins: 2,
    },
    intro:
      "<p>Happy holidays everyone! 🎄✨</p><p>Thank you to everyone for attending the holiday party once again! 🎉 We also want to wish Sho well once again for winning the 'Cultural Award' for the year.</p>",
    opponents: [
      {
        id: 14,
        employeeId: "larry_facilities_and_administration",
        escalateDmg: 10,
        addressBook: ["cc_tim_executive_council_office"],
      },
      {
        id: 15,
        employeeId: "lisa_marketing",
        singleDmg: 20,
        escalateDmg: 15,
        defFlat: 5,
        addressBook: ["cc_malik_marketing"],
      },
      {
        id: 16,
        employeeId: "meghan_cassedy_executive_council_office",
        singleDmg: 15,
        escalateDmg: 10,
        defFlat: 5,
        addressBook: ["cc_samantha_executive_council_office"],
      },
      {
        id: 17,
        employeeId: "willy_boy_information_technology",
        defFlat: 5,
        escalateDmg: 10,
        addressBook: ["cc_nimby_facilities_and_administration"],
      },
      {
        id: 18,
        employeeId: "casey_legal",
        defFlat: 5,
        addressBook: ["cc_karen_human_resources"],
      },
      {
        id: 19,
        employeeId: "sho_marketing",
        escalateDmg: 10,
        defFlat: 5,
        addressBook: ["cc_gemma_policy"],
      },
      {
        id: 20,
        employeeId: "steph_eco",
        hp: 60,
        maxHp: 60,
        defFlat: 10,
        singleDmg: 15,
        escalateDmg: 10,
        addressBook: ["cc_julia_eco"],
      },
    ],
  },
  {
    id: "paper",
    subject: "CRITICAL: Departmental Paper Rationing",
    from: "m.compliance@gov.org",
    turns: 17,
    opponentBaseStats: {
      hp: 30,
      maxHp: 30,
      wins: 1,
      defFlat: 5,
    },
    intro:
      "<p>Dear Staff,</p><p>Due to unforeseen budget constraints, we are implementing immediate paper rationing.</p><ul><li><strong>{playerName}</strong>, your department's printing logs are particularly high.</li><li><strong>Megan</strong>, please ensure we are still meeting filing requirements.</li><li><strong>Colin</strong>, please expedite the 'Paperless Initiative'.</li></ul><p>Effective immediately, all non-essential printing is strictly prohibited.</p>",
    opponents: [
      {
        id: 3,
        employeeId: "megan_legal",
        hp: 60,
        maxHp: 60,
        singleDmg: 20,
        escalateDmg: 15,
        wins: 3,
        addressBook: ["cc_karen_human_resources", "cc_gemma_policy"],
      },
      {
        id: 4,
        employeeId: "colin_information_technology",
        hp: 70,
        maxHp: 70,
        singleDmg: 10,
        escalateDmg: 20,
        wins: 2,
        addressBook: ["cc_adam_finance", "cc_willy_boy_information_technology"],
      },
      {
        id: 44,
        employeeId: "fraser_information_technology",
        addressBook: ["cc_rowan_constituent_services", "cc_christina_policy"],
      },
    ],
  },
  {
    id: "thermostat_war",
    subject: "RE: Office Thermostat Dispute",
    from: "l.facilities@gov.org",
    turns: 17,
    opponentBaseStats: {
      hp: 30,
      maxHp: 30,
      wins: 2,
      singleDmg: 15,
      escalateDmg: 10,
      defFlat: 5,
    },
    intro:
      "<p>Hi all,</p><p>Facilities here. We received multiple complaints about the floor thermostat. It looks like the setpoint has been toggled between 74°F and 96°F.</p><ul><li><strong>{playerName}</strong>, your desk is listed at 74°F.</li><li>The <strong>Marketing</strong> team (<strong>{opp1}</strong>, <strong>{opp2}</strong>) is pushing for 96°F.</li><li>The <strong>Finance</strong> team (<strong>{opp3}</strong>, <strong>{opp4}</strong>) says the 96°F setting is unacceptable for reviews.</li></ul><p>My view is we should be aiming lower overall to bring down the oil bill for this place, but we need a consistent setting.</p><p>How does around 64°F sound?</p>",
    opponents: [
      {
        id: 20,
        employeeId: "larry_facilities_and_administration",
        hp: 45,
        maxHp: 45,
        addressBook: ["cc_tim_executive_council_office", "cc_rory_operations"],
      },
      {
        id: 21,
        employeeId: "maya_marketing",
        hp: 45,
        maxHp: 45,
        addressBook: ["cc_dave_constituent_services", "cc_malik_marketing"],
      },
      {
        id: 22,
        employeeId: "jules_marketing",
        singleDmg: 20,
        defFlat: 20,
        addressBook: ["cc_lisa_marketing", "cc_rowan_constituent_services"],
      },
      {
        id: 23,
        employeeId: "priya_finance",
        hp: 45,
        maxHp: 45,
        addressBook: ["cc_adam_finance", "cc_karen_human_resources"],
      },
      {
        id: 24,
        employeeId: "dora_finance",
        hp: 45,
        maxHp: 45,
        defFlat: 10,
        addressBook: ["cc_gemma_policy", "cc_christina_policy"],
      },
    ],
  },
  {
    id: "intern_grievance",
    subject: "RE: Intern Grievance Collective",
    from: "hr.interns@gov.org",
    turns: 20,
    opponentBaseStats: {
      hp: 60,
      maxHp: 60,
      wins: 2,
      singleDmg: 15,
      escalateDmg: 15,
      defFlat: 5,
    },
    intro:
      "To the Permanent Staff,<br><br>We, the interns, have noticed a significant lack of 'Team Synergy' and 'Professional Courtesy'.<p><strong>{playerName}</strong>, your recent emails have been cited as 'aggressive'.</p><p><strong>Samantha</strong>, we are looping in our mentor <strong>Anneke</strong>.</p><p><strong>Shelia</strong>, we expect payroll to ensure our stipends to reflect the emotional labor of this thread.</p>",
    opponents: [
      {
        id: 5,
        employeeId: "interns_human_resources",
        hp: 150,
        maxHp: 150,
        defFlat: 10,
        wins: 3,
        numCCperCCaction: 2,
        addressBook: [
          "cc_telly_operations",
          "cc_dave_constituent_services",
          "cc_karen_human_resources",
          "cc_malik_marketing",
          "cc_rowan_constituent_services",
        ],
      },
      {
        id: 6,
        employeeId: "sheila_finance",
        hp: 70,
        maxHp: 70,
        singleDmg: 20,
        defFlat: 10,
        addressBook: ["cc_adam_finance", "cc_priya_finance"],
      },
      {
        id: 7,
        employeeId: "samantha_executive_council_office",
        hp: 70,
        maxHp: 70,
        wins: 4,
        defFlat: 5,
        addressBook: [
          "cc_meghan_cassedy_executive_council_office",
          "cc_tim_executive_council_office",
        ],
      },
      {
        id: 8,
        employeeId: "anneke_executive_council_office",
        singleDmg: 20,
        defFlat: 20,
        wins: 5,
        numCCperCCaction: 2,
        addressBook: [
          "cc_meghan_cassedy_executive_council_office",
          "cc_julia_eco",
          "cc_steph_eco",
        ],
      },
    ],
  },
  {
    id: "bankable_time_off",
    subject: "RE: Bankable Time Off Policy Dispute",
    from: "anneke.eco@gov.org",
    turns: 20,
    opponentBaseStats: {
      hp: 55,
      maxHp: 55,
      wins: 3,
      singleDmg: 15,
      escalateDmg: 10,
      defFlat: 10,
    },
    intro:
      "<p>Hi all,</p><p>I'm trying to understand the request around bankable time off. <strong>IT</strong> is asking for parity, and <strong>Marketing</strong> is split on whether to push for both bankable time off and weekend accruals or keep the current arrangement.</p><p>The team is also confused about why Marketing gets weekends bankable off the books.</p><p><strong>{playerName}</strong>, please lead this discussion. <strong>{opp0}</strong> and <strong>{opp1}</strong> from IT, please outline the impact. <strong>{opp2}</strong> and <strong>{opp3}</strong> from Marketing, please clarify what you want and what you are willing to risk. I'll try to map this to policy and fairness.</p>",
    opponents: [
      {
        id: 25,
        employeeId: "colin_information_technology",
        hp: 80,
        maxHp: 80,
        escalateDmg: 20,
        addressBook: ["cc_willy_boy_information_technology", "cc_gemma_policy"],
      },
      {
        id: 26,
        employeeId: "stephan_information_technology",
        addressBook: ["cc_rowan_constituent_services", "cc_christina_policy"],
      },
      {
        id: 27,
        employeeId: "rachel_marketing",
        hp: 70,
        maxHp: 70,
        addressBook: ["cc_malik_marketing", "cc_dave_constituent_services"],
      },
      {
        id: 28,
        employeeId: "jeff_marketing",
        hp: 75,
        maxHp: 75,
        addressBook: ["cc_lisa_marketing", "cc_karen_human_resources"],
      },
      {
        id: 29,
        employeeId: "anneke_executive_council_office",
        hp: 60,
        maxHp: 60,
        singleDmg: 20,
        retaliation: 15,
        deflect: 10,
        numCCperCCaction: 2,
        addressBook: [
          "cc_meghan_cassedy_executive_council_office",
          "cc_julia_eco",
          "cc_steph_eco",
        ],
      },
    ],
  },
  {
    id: "M015_MediaCrisis",
    subject: "CRITICAL: Budget Re-Forecasting & Ad Targeting Session",
    from: "taz@m4agency.com",
    turns: 17,
    opponentBaseStats: {
      hp: 30,
      maxHp: 30,
      wins: 3,
      singleDmg: 15,
      defFlat: 15,
    },
    intro:
      "<p>Hey all,</p><p>There has been a <strong>significant overspend</strong> of the quarterly media budget earmarked for the strategic placement for the <strong>Measles Vaccination Initiative</strong>. During media plan implementation, an unforeseen configuration error on our end resulted in a demographic targeting misalignment—specifically, an overly focused optimization towards the <strong>equine sector</strong> executed entirely on day one.</p><p><strong>{playerName}</strong>, we need to leverage this emergency session to ensure continuity of service delivery.</p><p><strong>Selina</strong> and <strong>Anthony</strong> are here for support, and to use up our retainer. The objective is to devise a recovery plan that allows us to meet our six-week deliverable goals with additional budgetary approval, <strong>as the original $40,000 has been fully exhausted.</strong></p>",
    opponents: [
      {
        id: 1,
        employeeId: "selina_m4_agency",
        hp: 90,
        maxHp: 90,
        retaliation: 10,
        deflect: 0,
        addressBook: ["cc_dave_constituent_services"],
      },
      {
        id: 2,
        employeeId: "taz_m4_agency",
        hp: 80,
        maxHp: 80,
        addressBook: ["cc_samantha_executive_council_office"],
      },
      {
        id: 3,
        employeeId: "anthony_m4_agency",
        hp: 30,
        maxHp: 30,
        retaliation: 15,
        deflect: 0,
        addressBook: ["cc_gemma_policy"],
      },
    ],
  },
  {
    id: "AI_Rollout",
    subject: "RE: Strategic AI Implementation Rollout",
    from: "j.lavallee@gov.org",
    turns: 40,
    intro:
      "Hello all,<br><br>I am Jen LaVallee, your Deputy Minister of Digital Technology. I have been tasked with overseeing the 'AI Everywhere' rollout across our departments. <strong>{playerName}</strong>, I've heard you have concerns about balance. I assure you, balance is less efficient than total automation. I will show you what I mean to help you see the logic.<br><br>Let's find some 'efficiencies', shall we?",
    opponents: [
      {
        id: 30,
        employeeId: "jen_lavallee",
        hp: 800,
        maxHp: 800,
        defFlat: 30,
        selfPromoteHeal: 200,
        wins: 3,
        singleDmg: 40,
        escalateDmg: 25,
        retaliation: 20,
        deflect: 30,
        numCCperCCaction: 8,
        hasDoneFirstTurn: false,
        addressBook: [
          "cc_telly_operations",
          "cc_samantha_executive_council_office",
          "cc_tim_executive_council_office",
          "cc_lisa_marketing",
          "cc_meghan_cassedy_executive_council_office",
          "cc_larry_facilities_and_administration",
          "cc_dave_constituent_services",
          "cc_gemma_policy",
          "cc_adam_finance",
          "cc_rowan_constituent_services",
          "cc_karen_human_resources",
          "cc_avery_operations",
          "cc_malik_marketing",
          "cc_priya_finance",
          "cc_rory_operations",
          "cc_dora_finance",
          "cc_christina_policy",
          "cc_fraser_information_technology",
          "cc_anthony_m4_agency",
          "cc_jonah_finance",
          "cc_interns_human_resources",
          "cc_sheila_finance",
          "cc_taz_m4_agency",
          "cc_selina_m4_agency",
        ],
      },
    ],
  },
];

let opponents = [];

const SAVE_KEY = "reply_all_save_v1";
const META_KEY = "reply_all_meta_v1";

function getMetaState() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveMetaState() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(metaState));
  } catch (e) {}
}

let metaState = getMetaState() || {
  discoveredSets: [],
  startUnlocks: { executive: 0, it: 0, finance: 0 },
  departmentUnlocks: { executive: true, it: false, finance: false },
};

const DEFAULT_PLAYER_LINES = {
  attacks: [
    "I believe we need to circle back to your recent comments. My focus is on department output, and I suggest yours should be too.",
    "I've already addressed this in my previous email, but for the sake of clarity, I'll repeat it: This is not my responsibility.",
    "Perhaps we should focus on next quarters' deliverables instead of speculating on departmental policy?",
    "I'm happy to discuss this in a 1-on-1, but I don't believe this is a productive use of the 'All-Staff' distribution list.",
  ],
  attackLinesByMission: {
    microwave: [
      "We can argue policy later. Right now, I'd just like to hear you deny that you heated the fish.",
      "This thread is spiraling. Let's 'fish-stick' to the facts; did you heat the fish or not?",
    ],
    calendar_chaos: [
      "We need the booking record and timestamps before we debate priority, why haven't you linked that?",
      "Let's pick a single room owner for the hour and move on, are you willing to give up the room?",
    ],
    holiday_reply_all: [
      "Happy holidays, but does this really need everyone's attention?",
      "My inbox is flooded, I don't want to have to block you til the new year.",
    ],
    paper: [
      "If the rationing is real, we need a clear exception process today, can you clarify what's needed?",
      "No one is printing for fun. Let's align on what's actually essential and what's not.",
    ],
    thermostat_war: [
      "I set it to 74°F because that's a normal temperature. 96°F is not.",
      "I'm fine with 74°F. 64°F seems too low.",
      "If we're picking a standard, 74°F is reasonable for most desks.",
    ],
    intern_grievance: [
      "Let's keep this professional and focus on actionable steps.",
      "I'm not ignoring concerns, but this thread needs structure.",
      "I don't understand why our interns are sharing a single email address. Can you clarify?",
    ],
    M015_MediaCrisis: [
      "We need a recovery plan, not another round of scope creep or out of scope budgetary approvals. Will you cover the cost?",
      "Realistically, this is your error. Why should we pay more to fix your misconfiguration?",
      "We pay agency rates with the expectation of competence. This level of error is unacceptable.",
    ],
  },
  attackLinesByTitle: {},
  escalateLines: [
    "Given the lack of alignment here, I'm escalating this thread for broader visibility.",
    "I'm escalating this to keep all stakeholders aligned and reduce duplication.",
  ],
  deflectLines: [
    "I'm taking a moment to document this properly before responding further.",
    "Let's pause and keep the thread within scope. I'll respond once this is reframed.",
  ],
  selfPromoteLines: [
    "Just logging a new win—the quarterly audit came back clean under my supervision. Always happy to add value to the organization!",
  ],
  selfPromoteLinesByMission: {
    microwave: [
      "Update: I drafted a fish based incident summary to share it around to get traction on this.",
    ],
    calendar_chaos: [
      "I created a booking summary and a proposed rotation. We can move forward now.",
    ],
    holiday_reply_all: [
      "I consolidated the greetings into one clean message and sent it to Samantha for approval.",
    ],
    paper: [
      "I compiled a short list of essential print exceptions to keep us compliant.",
    ],
    thermostat_war: [
      "Quick update: I created a simple temperature log so we can stop arguing and use data.",
    ],
    intern_grievance: [
      "I documented the feedback and proposed a short-term fix to address concerns.",
    ],
    M015_MediaCrisis: [
      "I summarized the revised plan and sent it to leadership for sign-off.",
    ],
  },
  selfPromoteLinesByTitle: {},
  replyAllLines: [
    {
      subject: "Fwd: Salary_Discrepancies_2024.xlsx",
      body: "Not sure if I should be sending this to everyone, but since transparency is one of our 'core values', here is the full salary spreadsheet for the department. Enjoy.",
    },
    {
      subject: "RE: Quick In Person Pulse Check",
      body: "Looping everyone in so we can align in real time. Please reply all with your availability in the next hour or you will be considered absent from work today. Remote attendance will not permitted.",
    },
    {
      subject: "RE: Late Night Tonight",
      body: "Just to keep everyone in the loop, I've gotten it approved every single one of us must stay late today until this is resolved.",
    },
    {
      subject: "RE: Deferral of Bonuses",
      body: "I requested leadership defer bonuses until this is resolved. Please see the attached memo for details.",
    },
  ],
  replyAllLinesByMission: {},
  replyAllLinesByTitle: {},
};

const SHOP_TRAINING_LABELS = [
  {
    id: "bcc_stat_boost",
    name: "Executive Stat Review",
    picksText: "Pick 2 of 3 upgrades",
    cost: 0,
    optionsCount: 3,
    picks: 2,
  },
  {
    id: "training_lnl",
    name: "Attend Lunch & Learn",
    picksText: "Pick 1 of 2 upgrades",
    cost: 6,
    optionsCount: 2,
    picks: 1,
  },
  {
    id: "training_course",
    name: "Take Daily Course",
    picksText: "Pick 1 of 3 upgrades",
    cost: 8,
    optionsCount: 3,
    picks: 1,
  },
  {
    id: "training_conference",
    name: "Attend Conference",
    picksText: "Pick 2 of 3 upgrades",
    cost: 10,
    optionsCount: 3,
    picks: 2,
  },
];

const SHOP_DIRECT_TYPE_WEIGHTS = {
  contact: 80,
  signature: 60,
  signoff: 50,
  salutation: 40,
  bcc: 30,
  dev: 30,
};

const SHOP_PACK_TYPE_WEIGHTS = {
  contact: 110,
  email: 70,
  bcc: 60,
  dev: 40,
};

const STAT_FIELDS = [
  "escalateDmg",
  "globalDmg",
  "singleDmg",
  "singleDmgMult",
  "escalateDmgMult",
  "globalDmgMult",
  "maxHp",
  "wins",
  "selfPromoteHeal",
  "retaliation",
  "deflect",
  "followUpChance",
  "escalateRecoverPerHit",
  "defFlat",
  "heal",
  "levMult",
  "levGainReply",
  "levGainEscalate",
  "levGainDeflect",
  "levGainPromote",
  "repBonus",
  "endRep",
  "addressLimit",
  "numCCperCCaction",
  "bccLimit",
  "contactTrainingLimit",
];

const LEVERAGE_MAX = 8;
const ITEM_TYPE_LABELS = {
  contact: {
    label: "Contact",
    headerBg: "#800000",
    headerText: "#ffffff",
    paneBg: "#d6c1c1",
    paneText: "#2f0d0d",
  },
  signature: {
    label: "Signature",
    headerBg: "#2f5d62",
    headerText: "#ffffff",
    paneBg: "#cfe5e6",
    paneText: "#123237",
  },
  salutation: {
    label: "Greeting",
    headerBg: "#6b21a8",
    headerText: "#ffffff",
    paneBg: "#e9d5ff",
    paneText: "#2e1065",
  },
  signoff: {
    label: "Sign-off",
    headerBg: "#1e4d2b",
    headerText: "#ffffff",
    paneBg: "#cfe8d6",
    paneText: "#0f2b17",
  },
  bcc: {
    label: "Help Desk",
    headerBg: "#1f3a8a",
    headerText: "#ffffff",
    paneBg: "#dbe6ff",
    paneText: "#111827",
  },
  dev: {
    label: "Coaching",
    headerBg: "#7c2d12",
    headerText: "#ffffff",
    paneBg: "#ffe1d5",
    paneText: "#431407",
  },
  email: {
    label: "Email",
    headerBg: "#000080",
    headerText: "#ffffff",
    paneBg: "#e5e7eb",
    paneText: "#111827",
  },
};
const STAT_METADATA = {
  escalateDmg: { label: "Escalate", shortName: "Esc" },
  globalDmg: { label: "All Message", shortName: "All Msg" },
  singleDmg: { label: "Reply To", shortName: "Reply" },
  singleDmgMult: { label: "Reply To Mult", shortName: "Reply x" },
  escalateDmgMult: { label: "Escalate Mult", shortName: "Esc x" },
  globalDmgMult: { label: "All Messages Mult", shortName: "All x" },
  maxHp: { label: "Max Credibility", shortName: "Max Cred" },
  wins: { label: "Wins", shortName: "Wins" },
  selfPromoteHeal: { label: "Self-Promote Heal", shortName: "Self-Promote" },
  retaliation: { label: "Retaliation", shortName: "Retal" },
  deflect: { label: "Deflect Reduction", shortName: "Reduce" },
  followUpChance: { label: "Follow Up Chance", shortName: "Follow Up" },
  escalateRecoverPerHit: {
    label: "Escalate Recovery",
    shortName: "Esc Recover",
  },
  defFlat: { label: "Flat Defense", shortName: "Flat Def" },
  heal: { label: "Heal", shortName: "Heal" },
  levMult: { label: "Leverage Multiplier", shortName: "Leverage x" },
  levGainReply: { label: "Reply To Leverage", shortName: "Reply Lev" },
  levGainEscalate: { label: "Escalate Leverage", shortName: "Esc Lev" },
  levGainDeflect: { label: "Deflect Leverage", shortName: "Def Lev" },
  levGainPromote: { label: "Self-Promote Leverage", shortName: "Promo Lev" },
  repBonus: { label: "Bonus Reputation", shortName: "Bonus Rep" },
  endRep: { label: "End Reputation", shortName: "End Rep" },
  addressLimit: { label: "Address Limit", shortName: "Address" },
  numCCperCCaction: { label: "CCs per Action", shortName: "CC / Action" },
  bccLimit: {
    label: "Internal Services Limit",
    shortName: "Internal Services",
  },
  contactTrainingLimit: {
    label: "Training Limit",
    shortName: "Training Limit",
  },
};

const SPAM_SUBJECTS = [
  "Hot Stocks!",
  "Refinance Now",
  "Enlarge your career",
  "Inheritance Notification",
  "Meeting?",
  "Action Required: Password Reset",
  "Last Chance: Office Supply Lottery",
  "Invoice Attached",
  "Team Lunch Sign-Up",
  "Weekly Pipeline Digest",
  "Travel Reimbursement Pending",
  "Urgent: Calendar Sync",
  "Wellness Survey Reminder",
  "FW: Please Review",
  "Recruitment Outreach",
  "Security Notice",
  "New Policy Update",
  "Printer Status Alert",
  "Quarterly Town Hall",
  "Zoom Recording Available",
];

const PACK_TIERS = ["small", "medium", "large"];
const QUARTERS = ["Q3", "Q4", "Q1", "Q2"];
const NUM_WORDS = ["zero", "one", "two", "three", "four"];

const TRAINING_UPGRADE_STATS = [
  { id: "upgrade_single", name: "Writing Effective Emails", stats: { singleDmg: 5 } },
  { id: "upgrade_escalate", name: "Collaborative Learning", stats: { escalateDmg: 4 } },
  { id: "upgrade_global", name: "Org-Wide Change Roll-out", stats: { globalDmg: 3 } },
  { id: "upgrade_hp", name: "Assessing Credibility", stats: { maxHp: 10 } },
  {
    id: "upgrade_deflect",
    name: "Authority Delegation Program",
    stats: { deflect: 2, retaliation: 3 },
  },
  { id: "upgrade_self_promote", name: "Projecting Leadership Course", stats: { selfPromoteHeal: 5 } },
];

const SNAPSHOT_ITEM_OTHER_FIELDS = [
  "replyDeptCleave",
  "replySecondaryHalf",
  "deflectBoostSingle",
  "deflectBoostEscalate",
  "disableReplyTo",
  "addSingleToEscalate",
  "replyAllPerActive",
  "escalatePerActive",
  "winScaleSingleDmg",
  "winScaleSingleDmgMult",
];
