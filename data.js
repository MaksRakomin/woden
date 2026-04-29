// Mock seed data + helpers, exposed on window.
const MOCK_USERS = {
  admin:    { id: 'u1', name: 'Sarah Chen',    initials: 'SC', email: 'sarah@woden.co',   role: 'admin' },
  manager:  { id: 'u2', name: 'Marcus Reed',   initials: 'MR', email: 'marcus@woden.co',  role: 'manager' },
  client:   { id: 'u3', name: 'Elena Vasquez', initials: 'EV', email: 'elena@meridian.co', role: 'client',   company: 'Meridian Coffee Co.' },
  employee: { id: 'u4', name: 'David Park',    initials: 'DP', email: 'david@meridian.co', role: 'client_employee', company: 'Meridian Coffee Co.' },
};

const CLIENT_COMPANIES = [
  { id: 'c1', name: 'Meridian Coffee Co.',  manager: 'Marcus Reed'  },
  { id: 'c2', name: 'Northwind Logistics',  manager: 'Marcus Reed'  },
  { id: 'c3', name: 'Kestrel Medical',      manager: 'Priya Shah'   },
  { id: 'c4', name: 'Forgeworks',           manager: 'Priya Shah'   },
  { id: 'c5', name: 'Luma Therapeutics',    manager: 'Jonah Okafor' },
  { id: 'c6', name: 'Bridgeport Foods',     manager: 'Jonah Okafor' },
];

const TEMPLATES = [
  { id: 't-it',            name: 'IT Company',            category: 'it',            description: 'Tech, SaaS, dev tooling. Emphasis on product narrative and technical credibility.' },
  { id: 't-management',    name: 'Management Consulting', category: 'management',    description: 'Advisory and consulting firms. Emphasis on outcomes, frameworks, and trust.' },
  { id: 't-manufacturing', name: 'Manufacturing',         category: 'manufacturing', description: 'Industrial, B2B, supply chain. Emphasis on operational expertise and reliability.' },
  { id: 't-consumer',      name: 'Consumer Brand',        category: 'consumer',      description: 'Direct-to-consumer, lifestyle. Emphasis on values, identity, and emotional connection.' },
];

const PROJECTS = [
  { id: 'p1', clientIds: ['c1'],       managerIds: ['m1'],      templateId: 't-consumer',      name: 'Brand Strategy 2024',  status: 'published', sections: 14, updated: '2 days ago', team: ['elena@meridian.co', 'david@meridian.co', 'rachel@meridian.co'], description: '', preprompt: '', logo: null },
  { id: 'p2', clientIds: ['c1'],       managerIds: ['m1'],      templateId: 't-consumer',      name: 'Product Launch',       status: 'draft',     sections: 6,  updated: '1 day ago',  team: ['elena@meridian.co'],                                              description: '', preprompt: '', logo: null },
  { id: 'p3', clientIds: ['c2'],       managerIds: ['m1'],      templateId: 't-manufacturing', name: 'Northwind Rebrand',    status: 'draft',     sections: 3,  updated: '5 days ago', team: [],                                                                  description: '', preprompt: '', logo: null },
  { id: 'p4', clientIds: ['c3'],       managerIds: ['m2'],      templateId: 't-management',    name: 'Kestrel Identity',     status: 'published', sections: 14, updated: '1 wk ago',   team: ['james@kestrel.co', 'anna@kestrel.co'],                             description: '', preprompt: '', logo: null },
  { id: 'p5', clientIds: ['c3'],       managerIds: ['m2'],      templateId: 't-management',    name: 'Kestrel Messaging',    status: 'review',    sections: 10, updated: '3 days ago', team: ['james@kestrel.co'],                                                description: '', preprompt: '', logo: null },
  { id: 'p6', clientIds: ['c4'],       managerIds: ['m2'],      templateId: 't-it',            name: 'Forgeworks Brand',     status: 'draft',     sections: 3,  updated: '3 days ago', team: [],                                                                  description: '', preprompt: '', logo: null },
  { id: 'p7', clientIds: ['c5'],       managerIds: ['m3'],      templateId: 't-management',    name: 'Luma Brand Voice',     status: 'review',    sections: 7,  updated: 'yesterday',  team: [],                                                                  description: '', preprompt: '', logo: null },
  { id: 'p8', clientIds: ['c6', 'c5'], managerIds: ['m3', 'm1'],templateId: 't-consumer',      name: 'Bridgeport Rebrand',   status: 'published', sections: 14, updated: '2 wk ago',   team: ['tom@bridgeport.co', 'sarah@bridgeport.co', 'mike@bridgeport.co'], description: '', preprompt: '', logo: null },
  { id: 'p9', clientIds: ['c6'],       managerIds: ['m3'],      templateId: 't-it',            name: 'Bridgeport Digital',   status: 'draft',     sections: 4,  updated: '1 wk ago',   team: ['tom@bridgeport.co'],                                              description: '', preprompt: '', logo: null },
];

const MANAGERS = [
  { id: 'm1', name: 'Marcus Reed',  email: 'marcus@woden.co',  clients: 2, projects: 3 },
  { id: 'm2', name: 'Priya Shah',   email: 'priya@woden.co',   clients: 2, projects: 3 },
  { id: 'm3', name: 'Jonah Okafor', email: 'jonah@woden.co',   clients: 2, projects: 3 },
];

function getProjectClients(p) {
  if (!p) return [];
  const ids = p.clientIds || (p.clientId ? [p.clientId] : []);
  return ids.map(id => CLIENT_COMPANIES.find(c => c.id === id)).filter(Boolean);
}
function getProjectManagers(p) {
  if (!p) return [];
  const ids = p.managerIds || [];
  return ids.map(id => MANAGERS.find(m => m.id === id)).filter(Boolean);
}
function getProjectTemplate(p) {
  if (!p || !p.templateId) return null;
  return TEMPLATES.find(t => t.id === p.templateId) || null;
}

const SECTION_TITLES = [
  'Cover', 'Strategic Narrative', 'Mission & Vision', 'Target Audience',
  'Positioning Statement', 'Brand Pillars', 'Core Messaging', 'Tone of Voice',
  'Brand Values', 'Brand Personality', 'Visual Identity', 'Photography & Imagery',
  'Applications', 'Glossary'
];

const MERIDIAN = {
  tagline: 'Coffee with conviction.',
  narrative: [
    'In 2014, a barista named Ana walked into a co-op in Huila, Colombia and realized the supply chain she had trusted for a decade was broken.',
    'Three farmers. Seven middlemen. A cup of coffee that cost $4.50 and returned $0.08 to the person who grew it.',
    'Meridian began as a single direct-trade relationship. Ten years later, every bag still carries a farmer\'s name — because transparency isn\'t a feature. It\'s the point.'
  ],
  mission: 'To connect growers and drinkers through radically transparent coffee.',
  vision: 'A coffee industry where every cup traces back to a named farmer.',
  personas: [
    { name: 'Conscious Casey', age: 31, quote: 'I want to know where my money actually goes.', tags: ['urban', 'ethics-driven', 'subscribes to 2+ brands'] },
    { name: 'Office Owen',     age: 45, quote: 'I buy coffee for 50 people. It has to taste good and feel good.', tags: ['bulk buyer', 'operations', 'values story'] },
  ],
  positioning: 'For people who care where their coffee comes from, Meridian is the specialty roaster that names every farmer on every bag, because transparency changes everything.',
  pillars: [
    { title: 'Transparent', body: 'Every bag names a farmer, a farm, a harvest.' },
    { title: 'Rigorous',    body: 'We cup every lot three times before roast.' },
    { title: 'Warm',        body: 'Coffee is craft, but it\'s also company.' },
    { title: 'Curious',     body: 'We chase processing methods most roasters won\'t touch.' },
  ],
  tone: [
    { trait: 'Direct',   say: 'This is a natural-process Gesha from Finca La Serrana.', dont: 'A whimsical dance of notes across the palate.' },
    { trait: 'Warm',     say: 'Brew it however you like — we\'re not precious.',          dont: 'For optimal extraction, calibrate to 1:16.5 at 94.5°C.' },
    { trait: 'Informed', say: 'Anaerobic fermentation takes 72 hours.',                    dont: 'Crazy-good process vibes.' },
  ],
  values: ['Honesty', 'Craft', 'Community', 'Curiosity', 'Quality', 'Sustainability'],
  personality: { archetype: 'The Sage', adjectives: ['Honest', 'Grounded', 'Curious', 'Steady', 'Generous'] },
  palette: [
    { name: 'Espresso', hex: '#3B2A1F' },
    { name: 'Crema',    hex: '#E8D5B7' },
    { name: 'Rust',     hex: '#D4572A' },
    { name: 'Paper',    hex: '#F7F1E5' },
    { name: 'Ink',      hex: '#1B1410' },
  ],
  glossary: [
    { term: 'Cherry',     def: 'The fruit of the coffee plant; each contains two beans.' },
    { term: 'Cupping',    def: 'A standardized tasting protocol used to evaluate coffee lots.' },
    { term: 'Direct Trade', def: 'A sourcing model where roasters buy straight from producers.' },
    { term: 'Processing', def: 'The method of removing the coffee fruit from the bean — washed, natural, honey, anaerobic.' },
    { term: 'Single Origin', def: 'Coffee from one producer, region, or farm.' },
  ],
};

const CHAT_SUGGESTIONS = [
  'What are our brand colors?',
  'Write a LinkedIn post in our tone of voice.',
  'Summarize our positioning statement.',
  'Who is our target audience?',
];

function mockChatReply(q) {
  const text = q.toLowerCase();
  if (/color|palette|visual/.test(text)) {
    return 'Your palette centers on **#3B2A1F Espresso** as the primary, **#E8D5B7 Crema** as warm neutral, and **#D4572A Rust** as the accent. Paper (#F7F1E5) and Ink (#1B1410) round it out.';
  }
  if (/linkedin|post|social/.test(text)) {
    return 'Draft: "Every bag on our shelf names a farmer. Not because it\'s marketing — because it\'s the whole point. Meet Luis Vargas, who grew this week\'s washed Caturra in Huila, Colombia. #Meridian #DirectTrade"';
  }
  if (/position|statement/.test(text)) {
    return 'Your positioning: For people who care where their coffee comes from, Meridian is the specialty roaster that names every farmer on every bag — because transparency changes everything.';
  }
  if (/audience|persona|customer/.test(text)) {
    return 'Two primary personas: Conscious Casey (31, urban, ethics-driven, subscribes to multiple brands) and Office Owen (45, buys in bulk for teams, values a story he can share).';
  }
  if (/tone|voice/.test(text)) {
    return 'Direct, Warm, Informed, Never precious. We\'d say "This is a natural-process Gesha from Finca La Serrana" — not "a whimsical dance of notes."';
  }
  if (/mission|vision/.test(text)) {
    return 'Mission: Connect growers and drinkers through radically transparent coffee. Vision: A coffee industry where every cup traces back to a named farmer.';
  }
  return 'Based on your StoryGuide, the short answer is: Meridian\'s differentiation is transparency at the bag level — every product names its farmer. Let me know if you want me to pull from a specific section.';
}

const EFC = {
  client: 'EFC International',
  tagline: 'THE STRENGTH BEHIND EVERY CONNECTOR IS THE PEOPLE WHO UNDERSTAND ITS POWER',

  storykernel: {
    arcs: [
      { n: 1, title: 'Existential Threat', stage: 'Awareness',
        why: 'Every compelling story begins with stakes. The Existential Threat names a significant shift in the market — something external to your buyer that makes the status quo untenable. By naming it first, EFC builds urgency and earns the right to be part of the conversation.',
        passage: 'The biggest projects succeed or fail based on the smallest parts. Today\'s production expectations are highly volatile, and the procurement process for small parts hasn\'t kept pace.' },
      { n: 2, title: 'Shared Threat', stage: 'Awareness',
        why: 'The Shared Threat brings the Existential Threat down to earth, showing how it lands specifically for a business like the buyer\'s. It creates the "before" in the story — the old way that\'s no longer viable — and where urgency becomes personal.',
        passage: 'Fasteners are seemingly worth only a couple of cents, but each one chosen in isolation erodes efficiency and grinds projects to a halt, saddling suppliers, manufacturers, and builders with financial and reputational risk. When businesses focus on a supplier catalog, they miss strategic opportunities within their own operations. Because the real cost of the fastener isn\'t the cents, it\'s the impact on operations.' },
      { n: 3, title: 'Our Hero & Their Meaning', stage: 'Consideration',
        why: 'The hero of the story is the customer, not EFC. This section defines who they are, what drives them, what they\'re trying to accomplish, and what the stakes mean to them personally. When buyers see themselves here, they trust EFC understands them.',
        passage: 'Design-responsible contributors know intuitively that projects are more than their individual components. Whether they are an engineer in the automotive industry or a project manager in construction, fasteners determine how — and when — their projects will come together. But these small parts are often the last thing on their minds, entering surface-level conversations with transactional vendors only after major decisions have been made. With limited time, a long list of seemingly higher priorities, and only basic vendor input, they default to familiar parts. Fasteners get locked in without understanding their broader potential, but if chosen strategically, they create a ripple effect that boosts efficiency from production to purchasing and beyond.' },
      { n: 4, title: 'The Mentor & Their Allies', stage: 'Evaluation',
        why: 'EFC enters the story not as the hero, but as the mentor — the wiser, more experienced guide who has navigated this terrain before. This section establishes why EFC is uniquely positioned to guide the buyer through the challenges ahead.',
        passage: 'Engineered Fastener Company believes that small parts must be considered in the context of the entire project they bind together. As EFC scaled from an automotive fastener distributor into an international supply chain partner, they saw firsthand how fasteners strategically transformed operations by unlocking efficiencies and reducing delays. With extensive internal expertise, supplier relationships, and the ability to act as an extension of the manufacturer, EFC delivers the right connectors for each customer with the full application, workflow, and production demands in mind.' },
      { n: 5, title: 'Call to Adventure', stage: 'Evaluation',
        why: 'The pivot point where EFC invites the buyer to make a choice and begin their transformation. This is also where EFC\'s purpose lives — the belief that drives the organization forward.',
        passage: 'The strength behind every connector is the people who understand its power.' },
      { n: 6, title: 'The Talisman', stage: 'Customer Experience',
        why: 'EFC\'s strategic guidance is the Talisman — both functional (what it does) and magical (what it makes possible). This is what equips the hero for the journey and what they carry long after.',
        passage: 'EFC provides strategic consultation to uncover and deliver value hidden in the smallest parts. With dedicated points of contact who have deep engineering expertise and understand the broader impact of the project, everyone in the organization — from design through purchasing — gets the guidance they need to source the right parts.' },
      { n: 7, title: 'Obstacles to Overcome', stage: 'Customer Experience',
        why: 'The specific challenges buyers navigate as they put EFC\'s guidance to work. These are also where EFC\'s differentiators live — the ways EFC is uniquely equipped to help buyers overcome what others cannot.',
        passage: 'EFC becomes the go-to partner for total operational perspective, ensuring the supply chain runs smoothly and every solution keeps teams focused on the big picture for their customers. When organizations partner with EFC, they make every connector a strategic purchase that has an outsized benefit for operations.' },
      { n: 8, title: 'Spoils of Victory', stage: 'Evangelism',
        why: 'The tangible outcomes customers take back to their world — the measurable wins that make the journey worth it. This is EFC\'s promise made visible, transforming satisfied buyers into active advocates.',
        passage: 'With a partner who understands the power of connection, small parts become a source of stability rather than disruption. Across the company, teams no longer spend their days chasing vendors based on price.' },
      { n: 9, title: 'Potential Achieved', stage: 'Evangelism',
        why: 'The story ends with the buyer and their world transformed — what becomes possible when the journey is complete. This is the vision EFC is working toward.',
        passage: 'Design-responsible contributors build connections that drive efficiency for each project, and purchasing sees their impact beyond the bill of materials. With EFC, companies grow with confidence, supported by a partner that reveals the strategic opportunities hidden in every connector.' },
    ],
  },

  messaging: {
    mission: 'To transform the smallest parts into our customers\' largest advantage.',
    vision: 'To empower every customer with the right connections that reduce complexity and simplify their business operations.',
    values: [
      { name: 'Proactive in Practice', body: 'We look forward, listen closely, and let curiosity guide us to seize opportunities that improve outcomes before our customers even ask.' },
      { name: 'Transparent Communication', body: 'We speak directly, share information openly, and highlight concerns early with a no-drama approach that builds trust and keeps every connection strong.' },
      { name: 'Focus on the Details', body: 'We are thorough, thoughtful, and precise, prioritizing the customer in every decision so our solutions reflect their true needs.' },
      { name: 'Power of Connection', body: 'We strengthen the connections that hold projects and people together by collaborating as one team.' },
    ],
    positioning: 'We make every connector an operational advantage.',
    brandPromise: 'We\'ll deliver the right connectors for your operation before you know you need them.',
    differentiator: {
      title: 'Total Operational Perspective to Guide Selection, Ensure Delivery, and Connect Your Business.',
      body: 'Rather than treating fasteners as isolated line items, EFC evaluates every connector in the context of the full operation — from design intent through production, delivery, and real-world use. This perspective allows EFC to guide selection decisions early, ensuring the right connectors are specified with application requirements, workflows, and downstream impacts in mind.',
    },
    verbalIdentity: [
      { phrase: 'The Power of Connection', note: 'Anchors EFC\'s belief that every connector has outsized impact when considered in context; builds mindshare around the strategic, not transactional, role of fasteners.' },
      { phrase: 'Total Operational Perspective', note: 'Owns the differentiating approach: EFC evaluates each connector across the full workflow, timeline, and production reality of the customer\'s operation.' },
    ],
  },

  icp: {
    who: 'EFC\'s ideal customer carries responsibility for how a project comes together. They may be a design engineer selecting components for a new product line, an engineer coordinating a large automotive program, or a project manager preparing for an upcoming build. Regardless of title, they share a common reality: the success or failure of their work hinges on countless decisions about seemingly small parts, and fasteners sit squarely in that category.\n\nYour ICP operates in an environment where production expectations are constantly shifting and stakes are high. They\'re managing complex projects with tight deadlines, and they know that small oversights can balloon into major problems.\n\nThey suspect there\'s a better way. They recognize that if someone with total operational perspective could help them think strategically about connectors without adding undue burden, these small decisions could become genuine operational advantages. This is the person EFC was built to serve.',
    company: [
      { label: 'Industry / Sector', value: 'Automotive manufacturing, industrial manufacturing, commercial construction, distribution' },
      { label: 'Company Size', value: 'Mid-to-large manufacturers; contractors and developers with multi-site operations; regional to national distributors' },
      { label: 'Organizational Structure', value: 'Engineering-led or project-led organizations with separate purchasing functions; multi-tier supply chains' },
      { label: 'Geography', value: 'North America primary; international programs for automotive and industrial verticals' },
      { label: 'Indicators of Fit', value: 'New programs in design phase, multiple supplier relationships creating coordination overhead, history of last-minute fastener substitutions or production delays' },
    ],
    howToFind: [
      { channel: 'LinkedIn', detail: 'Search by title: Design Engineer, Engineering Manager, Project Manager, Purchasing Manager. Filter by industry: Automotive, Industrial Manufacturing, Construction.' },
      { channel: 'Industry Events', detail: 'SAE World Congress, FABTECH, World of Concrete, automotive supplier forums.' },
      { channel: 'Direct Outreach', detail: 'Time outreach to new program announcements, RFQ activity, or job postings indicating new product development.' },
      { channel: 'Referrals', detail: 'Existing customers within multi-tier supply chains or corporate groups can introduce EFC to peers facing similar challenges.' },
    ],
    keyPhrases: [
      { phrase: 'Projects are more than their individual components.', note: 'Captures the ICP\'s intuitive belief that every decision — even a small fastener — connects to the broader outcome.' },
      { phrase: 'Fasteners determine how — and when — their projects will come together.', note: 'Names the specific stakes: connector decisions are schedule and quality decisions, not just purchasing tasks.' },
      { phrase: 'They default to familiar parts.', note: 'Describes the behavior EFC is positioned to change — not from criticism but from understanding real constraints.' },
      { phrase: 'A ripple effect that boosts efficiency from production to purchasing and beyond.', note: 'The transformation the ICP hopes for but hasn\'t had a partner to help them achieve.' },
    ],
  },

  personas: [
    { name: 'Evelyn Engineering', initial: 'E', title: 'Engineering Manager', industry: 'Automotive / Industrial Manufacturing',
      challenges: 'Limited time for fasteners, must avoid unnecessary downstream risk, accountable for design integrity across programs',
      triggers: 'New programs requiring confident part selection, OEM requirement changes, design reviews revealing gaps',
      goals: 'Design efficiently without downstream issues; uphold team\'s credibility and standard of work',
      msgs: [
        'Total Operational Perspective: EFC evaluates connectors in the context of Evelyn\'s full operation — not as isolated line items — helping her make decisions she doesn\'t have to revisit.',
        'Brand Promise: EFC\'s promise gives her confidence that connector decisions are handled proactively and scoped correctly from the start, without pulling her team into unnecessary details.',
        'OEM Expertise: EFC\'s OEM experience helps her navigate standards and expectations without slowing design or introducing compliance risk.',
      ]},
    { name: 'Peter Project', initial: 'P', title: 'Project Manager', industry: 'Commercial Construction',
      challenges: 'Keeping projects moving with the right parts in scope; reacting to delays, substitutions, and unreliable vendors',
      triggers: 'New projects or changing scope, unreliable vendors, process inefficiencies, approaching busy seasons',
      goals: 'Maintain schedule certainty and reduce avoidable friction; stop solving the same problems over and over',
      msgs: [
        'Opportunities Hidden in Small Parts: EFC addresses connector decisions early — uncovering hidden risks and avoiding downstream disruptions that slow crews and put schedules at risk.',
        'Custom Kitting: EFC creates custom kits so site teams can quickly identify the right connectors — reducing field confusion and keeping crews productive.',
        'International Supply Chain: EFC\'s supply capabilities reassure Peter that they can follow through on their promise across complex, multi-phase projects.',
      ]},
    { name: 'Bill Buyer', initial: 'B', title: 'Senior Buyer / Purchasing Manager', industry: 'Automotive / Industrial / Construction',
      challenges: 'Competitive pricing, timely fulfillment, vendor management, absorbing supply chain disruptions',
      triggers: 'Desire for partner guidance and improved processes, production disruptions traced to poor connector decisions',
      goals: 'See impact beyond the bill of materials; fewer mornings spent reacting to supplier problems',
      msgs: [
        'Impact Beyond the Bill of Materials: EFC helps Bill make strategic connector decisions that reduce downtime and deliver stability the organization can rely on.',
        'Brand Promise: EFC\'s proactive support signals it will help Bill anticipate needs, avoid last-minute sourcing scrambles, and keep purchasing decisions aligned to real operational constraints.',
        'Program Continuity: EFC helps maintain continuity through substitutions, documentation support, and sourcing options that reduce disruption when timelines tighten.',
      ]},
    { name: 'Dean Distributor', initial: 'D', title: 'Purchasing Manager', industry: 'Distribution',
      challenges: 'Securing hard-to-find connectors for customers; being more than a parts fulfiller; protecting customer relationships when something goes wrong',
      triggers: 'Customer requests for non-standard parts, strategic sourcing guidance needs, supplier reliability issues',
      goals: 'Strengthen customer relationships; resolve connector challenges quickly; be a trusted resource, not just an order-taker',
      msgs: [
        'Hard-to-Find Parts: EFC helps Dean navigate substitutions and alternatives so he can respond quickly while mitigating downstream risk to his customers.',
        'Total Operational Perspective (Without Direct Access): EFC brings deep pattern recognition from real-world connector use — giving Dean a place to turn for advice and alternatives.',
        'Source of Strategic Consultation: When customers come to Dean with urgent questions, EFC becomes his go-to resource — strengthening his own role as a trusted advisor.',
      ]},
  ],

  awareness: {
    goal: 'EFC\'s Awareness goal is to reach design-responsible contributors — engineers, project managers, and purchasing leaders — and introduce the cost of inaction around fastener decisions. Most prospects are "out of market," unaware that their current approach carries hidden risk. The Awareness stage pulls them off the sideline by naming something they\'ve felt but never had the language for: that small connector decisions compound into operational disruption.\n\nEFC\'s unique positioning in this stage is leading not with price or availability, but with the operational impact of overlooked fasteners — establishing a clear contrast with catalog-driven suppliers before the prospect is even actively evaluating partners.',
    elevatorPitch: [
      '"Have your current suppliers talked to you about the operational impact of the fasteners you\'re using?"',
      '"Projects fail or succeed based on the smallest parts, yet fasteners don\'t get the attention they need. When they\'re chosen in isolation, those small decisions quietly introduce risk, delays, and inefficiencies that surface much later in operations."',
      '"At EFC, we believe every connector should be evaluated in the context of the entire operation it supports. That\'s why our people bring a total operational perspective, looking beyond the spec to guide the best selection for your specific project."',
      '"Together, we\'ll make every connector an operational advantage."',
      '"What\'s your current plan to select connectors for your upcoming programs?"',
    ],
    msgPoints: [
      { text: 'Projects fail or succeed based on the smallest parts — but fasteners rarely get the strategic attention they deserve until they\'re already causing problems.', personas: ['Evelyn Engineering', 'Peter Project'] },
      { text: 'The real cost of a fastener isn\'t the cents. It\'s the delays, rework, and shutdowns that surface long after the decision was made.', personas: ['Bill Buyer'] },
      { text: 'When fasteners are chosen late, in isolation, without operational context, they become a background risk in every program — one no one sees coming until it\'s expensive to fix.', personas: ['Evelyn Engineering'] },
      { text: 'On-site disruptions often trace back to connectors that looked fine on a drawing but weren\'t selected with delivery timing, sequencing, or site conditions in mind.', personas: ['Peter Project'] },
      { text: 'A part can be ordered correctly, priced competitively, and still create operational problems later if it\'s not understood in the context of the full project.', personas: ['Dean Distributor'] },
    ],
    objections: [
      { q: 'I already have a relationship with a competitor.', a: 'Most teams we talk to have supplier relationships they\'re happy with. When\'s the last time that supplier talked with you about the downstream impact of the fastener decisions you\'re making?' },
      { q: 'Fasteners aren\'t a major concern for us.', a: 'Fasteners only feel "small" before they cause rework, delays, or inefficiencies downstream. Our goal is to get a total operational understanding early so our recommendations strategically improve your operations instead of becoming a problem later.' },
      { q: 'I just need a part that works.', a: 'It\'s rarely about choosing the "best" part — it\'s about understanding the context the part will live in. Without total operational perspective, there\'s a higher risk of unforeseen consequences on site or during production.' },
    ],
    ctas: [
      { persona: 'Evelyn Engineering', text: 'What\'s the biggest challenge you\'ve been encountering in your programs? Let\'s schedule time to talk through how you\'re currently scoping in fasteners.' },
      { persona: 'Peter Project', text: 'What challenges have you been running into in your projects? I can set up a call this week to talk through what you\'ve been working on in depth.' },
      { persona: 'Bill Buyer', text: 'How are you thinking about fastener selection today, and what kind of support are you getting from vendors?' },
      { persona: 'Dean Distributor', text: 'Let\'s set up a call to talk more about your customer base and the types of connector challenges they run into.' },
    ],
  },

  consideration: {
    goal: 'EFC\'s Consideration goal is to build enough empathy and trust that a prospect takes the next step — a discovery call, a site visit, or a conversation about a specific program or project. EFC\'s differentiated edge here is storytelling: sharing real scenarios from similar buyers that help prospects see themselves in EFC\'s story and recognize the gap between their current approach and what\'s possible.',
    msgPoints: [
      { text: 'I\'ve worked with a lot of engineering managers like you who had never gotten strategic guidance around their connectors — even though these parts bind all programs together.', personas: ['Evelyn Engineering'] },
      { text: 'We\'ve worked with teams who standardized a part years ago, but it was actually causing downtime or maintenance headaches they didn\'t know about. A quick review upfront ensures every connector is working as intended.', personas: ['Evelyn Engineering', 'Bill Buyer'] },
      { text: 'I know we\'re approaching your busy season — I\'ve been working with another client who has similar ebbs and flows, and scoping in the right connectors early is a critical first step that pays off throughout the year.', personas: ['Peter Project'] },
      { text: 'We\'ve seen situations where parts weren\'t scoped with delivery timing, sequencing, and site conditions in mind — crews end up improvising anyway or scrambling for parts last-minute.', personas: ['Peter Project', 'Bill Buyer'] },
      { text: 'I know where to find hard-to-find parts — and I\'d be happy to walk through the use case with you to make sure your customer is getting a part that will support them in the long run.', personas: ['Dean Distributor'] },
    ],
    objections: [
      { q: 'Why would working with you be different from our other vendors?', a: 'What makes us different is our total operational perspective. A lot of suppliers talk about their pricing, parts, or capabilities — but what they\'re missing is the perspective to make sure every connector contributes to smooth operations.' },
      { q: 'We\'ve got the design covered. Just talk to purchasing.', a: 'The guidance we bring to design ensures the best-fit fasteners are scoped into the project without adding hassle for you or purchasing later. We\'ve seen this challenge play out multiple times — let\'s set up a conversation with you and the purchasing manager.' },
      { q: 'We\'ve standardized these fasteners. Re-evaluating adds complexity.', a: 'Standardization is often the right move. Where we add value is making sure those standards still support each project\'s assembly, maintenance, sourcing, and service life.' },
    ],
    ctas: [
      { persona: 'All Personas', text: 'What you\'re going through reminds me of a client we helped. Let\'s set up a call — I can tell you more about the change in their operations after working with us.' },
      { persona: 'Evelyn Engineering', text: 'How about I stop by your office, and we can talk through your current program design? I\'ll be in the area next week.' },
      { persona: 'Peter Project', text: 'Can you share your takeoff list with me? I\'ll review it and let you know what suggestions we have to streamline your projects on site.' },
      { persona: 'Dean Distributor', text: 'Let\'s talk through your other client needs and see if we can help you consolidate and respond with more confidence.' },
    ],
  },

  evaluation: {
    goal: 'EFC\'s Evaluation goal is to assert credibility without losing sight of the buyer. The Mentor section of the StoryKernel defines how EFC is uniquely suited to guide the buyer — its experience, approach, and supplier relationships. Evaluation content should feel less like a pitch and more like a promise: EFC has done this before, understands this journey, and is the right guide to help them succeed. Key proof points include EFC\'s origin story, scenario-specific differentiators, and real customer outcomes.',
    msgPoints: [
      { text: 'We\'ve spent decades working backward from OEM requirements, understanding exactly what they\'re looking for — so we can flag a wrong material call before it goes to the OEM and creates costly rework.', personas: ['Evelyn Engineering'] },
      { text: 'After reviewing your bill of materials, I have a good sense of where things are headed. The solution I\'m about to walk you through will help you avoid issues seen in past projects, by making sure the right connector decisions are in place now.', personas: ['Evelyn Engineering', 'Bill Buyer'] },
      { text: 'Looking at your takeoff list, I can see where pressure usually starts to build once the job moves from planning to the field. Our total operational perspective makes the biggest difference before anything gets ordered.', personas: ['Peter Project'] },
      { text: 'Here\'s our quote. This part fits the application you described, and we\'re set up to support it long-term — whether maintaining supply or advising on alternatives if conditions change.', personas: ['Dean Distributor'] },
    ],
    objections: [
      { q: 'Your prices are too high.', a: 'We\'ve seen teams choose a lower-cost option that checked the box on price, only to spend far more later dealing with rework, delays, or unexpected approval issues. Our pricing reflects the perspective and risk reduction built into the recommendation.' },
      { q: 'I need to get bids from other suppliers first.', a: 'As you compare bids, also compare the level of guidance you\'re getting. We\'re here to make your connectors an operational advantage — not just to quote parts.' },
      { q: 'PPAP makes this complicated to switch.', a: 'When teams work with us, they\'re gaining total operational perspective to decide whether a change is actually worth making. PPAP may be a hassle now, but we\'re thinking about long-term impact — and we\'re ready to help make it as seamless as possible.' },
      { q: 'How do I know you\'ll have what we need when the project goes live?', a: 'We pride ourselves on getting you the connectors you need before you need them. That starts in design and goes all the way through the project — and we have distribution center capabilities for urgent orders.' },
    ],
    scenarios: [
      { industry: 'Automotive', body: 'An automotive engineering team is deep in early program design. They have suppliers for fasteners they\'ve used before — so they\'re designing the new program the same way. But when EFC first enters the conversation, the rep asks: "When was the last time your supplier gave you strategic advice about fasteners?" EFC helps the team evaluate connector choices in the context of the full program lifecycle, from design intent and OEM approval through production, global supply, and real-world use.' },
      { industry: 'Industrial Manufacturing', body: 'An industrial manufacturing team is finalizing a new equipment design under tight deadlines. When it comes to fasteners, they default to familiar choices. EFC steps in to remove fasteners from the engineering team\'s mental backlog — walking the line and identifying real opportunities to make confident recommendations quickly.' },
      { industry: 'Commercial Construction', body: 'A project manager is finalizing designs for an upcoming project. Fasteners are specified late — often treated as interchangeable details. EFC works with project and design teams early to ensure the right connectors are specified from the start, supporting efficient installation and reducing on-site delays.' },
      { industry: 'Distribution', body: 'A distributor fields requests from customers under pressure. EFC supports distributors by bringing deep connector expertise behind every recommendation — not just confirming availability, but advising on how fasteners perform and where substitutions make sense.' },
    ],
  },

  originStory: {
    short: 'When EFC was founded in 1983, fasteners were an afterthought — chosen late, sourced in isolation, valued only by unit cost. Early on, we saw firsthand how a single overlooked connector could halt production and cost a customer hundreds of thousands of dollars. Instead of offering another part number, we walked the process, asked the right questions, and found a better solution. That experience shaped a belief that still guides us: every connector must be considered in context, by people who understand how small parts shape entire operations.',
    full: [
      'When EFC was founded in 1983, the fastener industry was dominated by catalogs, part numbers, and transactional thinking. Companies treated fasteners as an afterthought. They were sourced late, chosen in isolation, and valued only by unit cost. What most organizations could not see was the hidden danger of that approach. A single overlooked connector could stall production and introduce risk that ripples across an entire operation.',
      'Early on, an automotive engineer came to EFC with a challenge. A single process issue was triggering shutdowns, costing hundreds of thousands of dollars each time production stopped. Instead of offering another part number, the EFC team walked the process with them, asking what the operation needed to accomplish and where breakdowns were occurring. Together, they identified a better alternative. It was the first time that customer had received strategic guidance around their fasteners. The outcome was only possible because the EFC team understood the power of connection: each part must be considered in context, by people who understand how processes, parts, and performance intersect.',
      'From that moment forward, EFC understood something fundamental had to change. Relying on a catalog alone would always limit outcomes. If every connector was going to become an operational advantage, it had to be selected with a total operational perspective. That belief reshaped every customer interaction, pushing the team to ask better questions, understand the full context, and make strategic recommendations instead of transactional ones.',
      'What began as a better way to serve individual customers quickly became a repeatable approach. As more teams experienced the operational impact of early guidance and strategic connector selection, EFC\'s role naturally expanded. Customers no longer came for parts alone. They came for perspective, continuity, and confidence across their operations. EFC gradually scaled to become an international supply chain partner, supporting customers earlier, more holistically, and across verticals.',
    ],
  },

  cx: {
    goal: 'Great customer experience is about keeping the promises made through the first three phases of the funnel. Delivering on these promises ensures retention and creates loyalty. An empowering experience keeps customers motivated, supported, and guided — the ongoing role of the Mentor.',
    msgDesign: [
      { text: 'As you look ahead, what programs do you have coming up? If we can get involved earlier, we may be able to carry forward what worked here and reduce the number of suppliers you have to coordinate across programs.', personas: ['Evelyn Engineering'] },
      { text: 'It\'s been great working with you on this project. What else do you have coming your way? Based on what I\'ve seen so far, I\'m confident we could help you consolidate suppliers.', personas: ['Peter Project'] },
      { text: 'As your program launches, let\'s set up a QBR with you and the purchasing team. We can review performance, upcoming demand, and opportunities to simplify sourcing.', personas: ['Evelyn Engineering', 'Peter Project'] },
    ],
    msgPurchasing: [
      { text: 'I saw your first order arrived. How did everything go? Is there anything we can improve or streamline?', personas: ['Bill Buyer'] },
      { text: 'Would you be open to connecting us with your engineering team? If we can review programs while they\'re still in design, we can make sure connectors are chosen with total operational perspective before you make the orders.', personas: ['Bill Buyer'] },
      { text: 'It\'s been a while since we walked your line. How about we do a walk together? That gives us a chance to spot opportunities to streamline processes and consolidate vendors.', personas: ['Bill Buyer'] },
    ],
    ctas: [
      { label: 'Set a QBR', body: 'Review performance, upcoming demand, and opportunities to simplify sourcing. Include engineering to identify what\'s coming and make a plan early.' },
      { label: 'Set an Annual Review', body: 'Step back and look at patterns, what\'s working well, and where earlier guidance could make future programs easier to support.' },
      { label: 'Connect with Engineering', body: 'If we can look at upcoming programs while they\'re still in design, we align connector decisions early and avoid last-minute changes.' },
      { label: 'Consolidate Suppliers', body: 'Let\'s walk the line and identify where we can help you consolidate — reducing complexity without sacrificing flexibility.' },
    ],
    welcomeEmail: 'At EFC, we view every connector with a total operational perspective. Not just the spec. Not just the price. But how it affects design decisions, production flow, procurement, and delivery once work is underway.\n\nAs part of the EFC community, you\'ll receive insights and guidance grounded in total operational perspective. That means practical ways to reduce downstream issues, improve coordination across teams, and make connector decisions that hold up over time.\n\nWe\'re glad you\'re here. Let\'s make every connector an operational advantage.\n\n— EFC International',
  },

  evangelism: {
    goal: 'EFC\'s Evangelism goal is to celebrate customer transformation and equip advocates with language to share their story — pulling new prospects into the Awareness stage through peer-to-peer storytelling. EFC should make advocacy feel like the natural extension of the customer\'s own success — not a favor to the brand.',
    msgPoints: [
      { text: 'Since we started working together, you\'ve been able to consolidate suppliers and eliminate unnecessary friction around small parts. I noticed you\'re connected with [Name] at [Company] who seems to be dealing with similar challenges — would you be open to making an introduction?', personas: ['Evelyn Engineering', 'Bill Buyer'] },
      { text: 'I\'ve talked to a lot of people going through a similar challenge. Would you be willing to participate in a case study? It could be motivating for them to hear how a total operational perspective helped you guide selection, ensure delivery, and connect your business.', personas: ['All Personas'] },
      { text: 'Many customers tell us they rely on peer feedback when evaluating partners. If you\'d be open to it, a brief review sharing how EFC has helped create strategic opportunities through connectors would go a long way in helping others facing similar challenges.', personas: ['All Personas'] },
    ],
    customerStories: [
      { title: 'Automotive: Honesty Is the Best Policy', outcome: 'Trust, reduced cost, avoided rework',
        body: 'An automotive manufacturer came to EFC looking to purchase a clip to hold a bracket beneath a bus window. Instead of fulfilling the request as-is, EFC\'s sales rep evaluated the application with a total operational perspective and advised that a standard screw would meet the need more effectively and at a lower cost. EFC didn\'t make a sale on the original part — but they changed the trajectory of that project. Today, that same buyer comes to EFC first for connector decisions and strategic advice, knowing they have a partner who flags risks early and recommends the right solution before it becomes expensive to change.' },
      { title: 'Construction: Eliminating an Entire Process', outcome: 'Eliminated process step, reduced delays, less rework',
        body: 'A playground equipment supplier (UltraPlay) was using a welded insert inside a tube for a picnic table. During welding, the insert often rotated out of alignment — their line ground to a halt time after time. Instead of troubleshooting the weld, EFC\'s team stepped back and evaluated the full production process. They brought a press-in insert that eliminated the welding entirely. "Now they get it started, smack it with a hammer one time, and send it on down the line." Fewer steps, no rework, faster production.' },
      { title: 'Industrial Manufacturing: Moving One C-Item at a Time', outcome: 'Supply stability, reduced disruption, strategic new product support',
        body: 'At Duke Manufacturing, a category manager overseeing fasteners was navigating constant uncertainty — commodity prices shifting, supply continuity fragile, and fasteners capable of stalling production entirely. EFC implemented a Vendor Managed Inventory (VMI) program, monitoring bin levels proactively. When Duke partnered with Subway on a new protein lid requiring unique food-service fasteners, EFC joined engineering conversations early, identified viable alternatives, and secured inventory before delays could impact the rollout.' },
    ],
  },

  appendix: {
    quotes: [
      { text: 'Fasteners are the last thing that buyers, engineers, and everybody come to for the vehicle. It\'s crazy. You\'d think, "How the hell do they hold everything together?"', who: 'Employee', context: 'Captured the fundamental disconnect EFC\'s StoryKernel addresses — and became a key anchor for the Existential Threat section.' },
      { text: 'Nobody wants to shut a plant down, especially for a piece of hardware.', who: 'Customer', context: 'Revealed how deeply buyers feel the operational risk of fastener failures — validating Cost of Inaction as the central awareness-stage message.' },
      { text: 'What they\'re not attributing for is that total cost of ownership.', who: 'Employee', context: 'Articulated EFC\'s core belief that the real cost of a fastener is measured in operational impact, not unit price — grounding the Shared Threat.' },
      { text: 'What we sell here really is to be the reason that customers want to keep coming back to us. Not because our bolts are better than anybody\'s, but because we\'ll do everything the other distributors don\'t want to bother with.', who: 'Employee', context: 'Defined EFC\'s mentorship role and the basis for its brand promise — the operational perspective that goes beyond the transaction.' },
      { text: 'Sometimes no sale is a sale… otherwise you\'re just going to get the clip even if you needed a screw.', who: 'Employee', context: 'Became the kernel of the "Honesty Is the Best Policy" customer story and a powerful illustration of EFC\'s strategic partnership over transactional selling.' },
    ],
    competitors: [
      { name: 'RH Fastener Supply', body: 'RH positions itself around abundance and familiarity — emphasizing inventory size, speed, and customer commitment through phrases like "incredible inventory" and "best sales agents." This language signals competence but closely mirrors industry-wide messaging, making differentiation difficult. RH reinforces the industry\'s default narrative: competing on inventory and price while treating service as responsiveness rather than strategic involvement. This leaves space for EFC to differentiate by addressing not just how fast a part arrives, but how the right decision upstream prevents downstream disruption.' },
      { name: 'Nu Way Concrete Forms', body: 'Nu Way leads with "everything for the contractor" — a completeness promise that signals convenience but quickly shifts from high-level positioning to product catalogs, reinforcing a transactional buying experience. Its differentiation is rooted in longevity and contractor-founded heritage. Nu Way competes effectively within a catalog-driven model but does not challenge customers to reconsider how parts decisions affect broader outcomes — opening the door for EFC to introduce a context-driven, operational perspective approach.' },
      { name: 'AFC Industries', body: 'AFC takes a more progressive step by attempting to move beyond parts toward solutions — using language like "solving complex challenges," "simplifying operations," and "improving performance." This framing shows awareness that customers want more than fulfillment, but the messaging often stays abstract: describing outcomes without defining the underlying problem or how AFC uniquely solves it. AFC comes closest to EFC in language but stops short of reframing the problem itself — creating a meaningful opening for EFC to differentiate on how it helps customers see their own business differently.' },
    ],
  },
};

const EFC_CHAT_SUGGESTIONS = [
  'Explain our StoryKernel',
  'Write a LinkedIn post for Evelyn Engineering',
  'What makes EFC different from competitors?',
  'Summarize our elevator pitch',
  'Handle the "prices are too high" objection',
];

function mockEFCChatReply(q) {
  const t = q.toLowerCase();
  if (/storykernel|story kernel|narrative|arc/.test(t)) {
    return 'EFC\'s StoryKernel positions the customer as the hero navigating a world where small fastener decisions carry outsized operational risk. EFC enters as the mentor — bringing Total Operational Perspective to guide selection, ensure delivery, and connect the business. The moral: "The strength behind every connector is the people who understand its power."';
  }
  if (/linkedin|post|social/.test(t)) {
    return 'Draft:\n\n"A single fastener ground an entire project to a halt.\n\nNo one wants to shut down a production line for such a small part, but when vendors don\'t have strategic conversations about these small parts, shutdowns become more likely.\n\nAt EFC, we believe small parts should be considered in the context of the entire project they bind together.\n\nWith total operational perspective, the right connectors do more than hold your products together — they raise the bar for manufacturing success.\n\nHow are you planning to mitigate risk with your smallest parts?"';
  }
  if (/different|differenti|competi/.test(t)) {
    return 'EFC\'s core differentiator is Total Operational Perspective — evaluating every connector in the context of the full operation, from design intent through production, delivery, and real-world use. Unlike catalog-driven suppliers who compete on price and availability, EFC guides selection decisions early, ensuring the right connectors are specified with application requirements, workflows, and downstream impacts in mind.';
  }
  if (/elevator|pitch/.test(t)) {
    return 'Elevator pitch:\n\n"Have your current suppliers talked to you about the operational impact of the fasteners you\'re using? Projects fail or succeed based on the smallest parts, yet fasteners don\'t get the attention they need. At EFC, we bring a total operational perspective — looking beyond the spec to guide the best selection for your specific project. Together, we\'ll make every connector an operational advantage."';
  }
  if (/price|cost|expensive|objection/.test(t)) {
    return 'Response to "prices are too high":\n\n"We\'ve seen teams choose a lower-cost option that checked the box on price, only to spend far more later dealing with rework, delays, or unexpected approval issues. Our pricing reflects the perspective and risk reduction built into the recommendation. The real cost of a fastener isn\'t the cents — it\'s the operational impact no one sees until it\'s too late."';
  }
  if (/mission|vision/.test(t)) {
    return 'Mission: "To transform the smallest parts into our customers\' largest advantage."\n\nVision: "To empower every customer with the right connections that reduce complexity and simplify their business operations."';
  }
  if (/value|proactive|transparent/.test(t)) {
    return 'EFC\'s four core values:\n\n1. Proactive in Practice — Seize opportunities that improve outcomes before customers even ask.\n2. Transparent Communication — Speak directly, share information openly, no-drama approach.\n3. Focus on the Details — Thorough, thoughtful, and precise in every decision.\n4. Power of Connection — Strengthen connections that hold projects and people together.';
  }
  return 'Based on EFC\'s StoryGuide, I can help you explore any section — from the StoryKernel narrative to specific messaging for each customer journey stage. What would you like to know more about?';
}

window.WODEN = {
  MOCK_USERS, CLIENT_COMPANIES, PROJECTS, MANAGERS, TEMPLATES, SECTION_TITLES, MERIDIAN,
  CHAT_SUGGESTIONS, mockChatReply,
  EFC, EFC_CHAT_SUGGESTIONS, mockEFCChatReply,
  getProjectClients, getProjectManagers, getProjectTemplate,
};
