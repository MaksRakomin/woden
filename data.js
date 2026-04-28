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

const PROJECTS = [
  { id: 'p1', clientId: 'c1', name: 'Brand Strategy 2024',  status: 'published', sections: 14, updated: '2 days ago', team: ['elena@meridian.co', 'david@meridian.co', 'rachel@meridian.co'] },
  { id: 'p2', clientId: 'c1', name: 'Product Launch',       status: 'draft',     sections: 6,  updated: '1 day ago',  team: ['elena@meridian.co'] },
  { id: 'p3', clientId: 'c2', name: 'Northwind Rebrand',    status: 'draft',     sections: 3,  updated: '5 days ago', team: [] },
  { id: 'p4', clientId: 'c3', name: 'Kestrel Identity',     status: 'published', sections: 14, updated: '1 wk ago',   team: ['james@kestrel.co', 'anna@kestrel.co'] },
  { id: 'p5', clientId: 'c3', name: 'Kestrel Messaging',    status: 'review',    sections: 10, updated: '3 days ago', team: ['james@kestrel.co'] },
  { id: 'p6', clientId: 'c4', name: 'Forgeworks Brand',     status: 'draft',     sections: 3,  updated: '3 days ago', team: [] },
  { id: 'p7', clientId: 'c5', name: 'Luma Brand Voice',     status: 'review',    sections: 7,  updated: 'yesterday',  team: [] },
  { id: 'p8', clientId: 'c6', name: 'Bridgeport Rebrand',   status: 'published', sections: 14, updated: '2 wk ago',   team: ['tom@bridgeport.co', 'sarah@bridgeport.co', 'mike@bridgeport.co'] },
  { id: 'p9', clientId: 'c6', name: 'Bridgeport Digital',   status: 'draft',     sections: 4,  updated: '1 wk ago',   team: ['tom@bridgeport.co'] },
];

const MANAGERS = [
  { id: 'm1', name: 'Marcus Reed',  email: 'marcus@woden.co',  clients: 2, projects: 3 },
  { id: 'm2', name: 'Priya Shah',   email: 'priya@woden.co',   clients: 2, projects: 3 },
  { id: 'm3', name: 'Jonah Okafor', email: 'jonah@woden.co',   clients: 2, projects: 3 },
];

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

window.WODEN = {
  MOCK_USERS, CLIENT_COMPANIES, PROJECTS, MANAGERS, SECTION_TITLES, MERIDIAN,
  CHAT_SUGGESTIONS, mockChatReply,
};
