// StoryGuide v2 — EFC layout with sidebar navigation + inline chat home
const { useState: useSGState, useEffect: useSGEffect, useRef: useSGRef } = React;

// ── Nav definition ──────────────────────────────────────────────────────────
const SG_NAV = [
  { type: 'item', id: 'home', icon: '⬡', label: 'Home' },
  {
    type: 'group', id: 'sk', icon: '◈', label: 'StoryKernel',
    items: [
      { id: 'sk-intro', label: 'Understanding the StoryKernel' },
      { id: 'sk-full',  label: '[CLIENT] StoryKernel', sub: true },
    ],
  },
  {
    type: 'group', id: 'mh', icon: '◇', label: 'Messaging Hierarchy',
    items: [
      { id: 'mh-intro',  label: 'Understanding the Messaging Hierarchy' },
      { id: 'mh-verbal', label: 'Verbal Identity',   sub: true },
      { id: 'mh-icp',    label: 'ICP',               sub: true },
      { id: 'mh-values', label: 'Values',             sub: true },
      { id: 'mh-mission',label: 'Mission',            sub: true },
      { id: 'mh-pos',    label: 'Positioning',        sub: true },
      { id: 'mh-diff',   label: 'Differentiators',    sub: true },
      { id: 'mh-promise',label: 'Brand Promise',      sub: true },
      { id: 'mh-vision', label: 'Vision',             sub: true },
    ],
  },
  {
    type: 'group', id: 'cj', icon: '◉', label: 'Customer Journey',
    items: [
      { id: 'cj-intro',       label: 'Understanding the Customer Journey' },
      { id: 'cj-awareness',   label: 'Awareness',          sub: true },
      { id: 'cj-aw-icp',      label: 'ICP',                sub2: true },
      { id: 'cj-consider',    label: 'Consideration',      sub: true },
      { id: 'cj-personas',    label: 'Personas',           sub2: true },
      { id: 'cj-evaluation',  label: 'Evaluation',         sub: true },
      { id: 'cj-credibility', label: 'Credibility Story',  sub2: true },
      { id: 'cj-origin',      label: 'Origin Story',       sub2: true },
      { id: 'cj-cx',          label: 'Customer Experience',sub: true },
      { id: 'cj-product',     label: 'Product Stories',    sub2: true },
      { id: 'cj-evangelism',  label: 'Evangelism',         sub: true },
      { id: 'cj-stories',     label: 'Customer Stories',   sub2: true },
    ],
  },
  {
    type: 'group', id: 'ng', icon: '◈', label: 'Narrative Guide',
    items: [
      { id: 'ng-apps', label: 'Narrative Applications', sub: true },
    ],
  },
  {
    type: 'group', id: 'app', icon: '◇', label: 'Appendix',
    items: [
      { id: 'app-research',    label: 'Research Insights',    sub: true },
      { id: 'app-competitive', label: 'Competitive Analysis', sub: true },
      { id: 'app-docs',        label: 'Relevant Documents',   sub: true },
    ],
  },
];

// which group does each page belong to?
function pageGroup(pageId) {
  for (const g of SG_NAV) {
    if (g.type === 'item' && g.id === pageId) return null;
    if (g.type === 'group') {
      if (g.items.find(i => i.id === pageId)) return g.id;
    }
  }
  return null;
}

// ── Main StoryGuide component ────────────────────────────────────────────────
function StoryGuide({ readOnly, search = '', onSearchChange }) {
  const [page, setPage] = useSGState('home');
  const [openGroups, setOpenGroups] = useSGState(() => {
    return { sk: false, mh: false, cj: false, ng: false, app: false };
  });
  const mainRef = useSGRef(null);
  const EFC = window.WODEN.EFC;

  function goPage(id) {
    setPage(id);
    const g = pageGroup(id);
    if (g) setOpenGroups(prev => ({ ...prev, [g]: true }));
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }

  function toggleGroup(gid) {
    setOpenGroups(prev => ({ ...prev, [gid]: !prev[gid] }));
  }

  // open active group on init
  useSGEffect(() => {
    const g = pageGroup(page);
    if (g) setOpenGroups(prev => ({ ...prev, [g]: true }));
  }, []);

  // search filtering — returns flat list of matching items
  const searchLower = search.trim().toLowerCase();
  function matchesSearch(label) {
    return !searchLower || label.toLowerCase().includes(searchLower);
  }

  return (
    <div className="sg2-shell">
      {/* Sidebar */}
      <aside className="sg2-sidebar">
        <div className="sg2-sidebar-head">
          <div className="sg2-client">{EFC.client}</div>
          <div className="sg2-badge">StoryEngine</div>
        </div>

        <nav className="sg2-nav">
          {SG_NAV.map(entry => {
            if (entry.type === 'item') {
              if (!matchesSearch(entry.label)) return null;
              return (
                <button
                  key={entry.id}
                  className={'sg2-nav-btn' + (page === entry.id ? ' active' : '')}
                  onClick={() => goPage(entry.id)}
                >
                  <span className="sg2-nav-icon">{entry.icon}</span>
                  {entry.label}
                </button>
              );
            }

            // group
            const visibleItems = entry.items.filter(i => matchesSearch(i.label) || matchesSearch(entry.label));
            if (searchLower && visibleItems.length === 0) return null;

            const isOpen = searchLower ? true : openGroups[entry.id];
            const isActiveSection = entry.items.some(i => i.id === page);

            return (
              <div key={entry.id}>
                <button
                  className={'sg2-nav-section-header' + (isActiveSection ? ' active-section' : '')}
                  onClick={() => toggleGroup(entry.id)}
                >
                  <span className="sg2-nav-icon">{entry.icon}</span>
                  {entry.label}
                  <span className="sg2-nav-chevron">{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && entry.items.map(item => {
                  if (!matchesSearch(item.label) && !matchesSearch(entry.label)) return null;
                  const cls = 'sg2-nav-btn'
                    + (item.sub2 ? ' sub2' : item.sub ? ' sub' : '')
                    + (page === item.id ? ' active' : '');
                  return (
                    <button key={item.id} className={cls} onClick={() => goPage(item.id)}>
                      {item.sub2 ? '↳ ' : ''}{item.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sg2-sidebar-footer">© 2025 Woden, Ltd. &amp; EFC International</div>
      </aside>

      {/* Main content */}
      <main className="sg2-main" ref={mainRef}>
        <SGPage id={page} goPage={goPage} readOnly={readOnly} />
      </main>
    </div>
  );
}

// ── Page router ──────────────────────────────────────────────────────────────
function SGPage({ id, goPage, readOnly }) {
  const EFC = window.WODEN.EFC;
  switch (id) {
    case 'home':         return <PageHome goPage={goPage} />;
    case 'sk-intro':     return <PageSkIntro />;
    case 'sk-full':      return <PageSkFull />;
    case 'mh-intro':     return <PageMhIntro goPage={goPage} />;
    case 'mh-verbal':    return <PageMhSimple label="Messaging Hierarchy" title="Verbal Identity" content={<MhVerbalIdentity />} />;
    case 'mh-icp':       return <PageMhSimple label="Messaging Hierarchy" title="Ideal Customer Profile" content={<PageIcpFull />} />;
    case 'mh-values':    return <PageMhSimple label="Messaging Hierarchy" title="Core Values" content={<MhValues />} />;
    case 'mh-mission':   return <PageMhSimple label="Messaging Hierarchy" title="Mission" content={<MhMission />} />;
    case 'mh-pos':       return <PageMhSimple label="Messaging Hierarchy" title="Positioning" content={<MhPositioning />} />;
    case 'mh-diff':      return <PageMhSimple label="Messaging Hierarchy" title="Differentiators" content={<MhDiff />} />;
    case 'mh-promise':   return <PageMhSimple label="Messaging Hierarchy" title="Brand Promise" content={<MhPromise />} />;
    case 'mh-vision':    return <PageMhSimple label="Messaging Hierarchy" title="Vision" content={<MhVision />} />;
    case 'cj-intro':     return <PageCjIntro goPage={goPage} />;
    case 'cj-awareness': return <PageCjAwareness />;
    case 'cj-aw-icp':    return <PageMhSimple label="Awareness" title="Ideal Customer Profile" content={<PageIcpFull />} />;
    case 'cj-consider':  return <PageCjConsideration />;
    case 'cj-personas':  return <PagePersonas />;
    case 'cj-evaluation':return <PageCjEvaluation />;
    case 'cj-credibility':return <PageMhSimple label="Evaluation" title="Credibility Story" content={<PageCredibility />} />;
    case 'cj-origin':    return <PageOriginStory />;
    case 'cj-cx':        return <PageCjCx />;
    case 'cj-product':   return <PagePlaceholder label="Customer Experience" title="Product Stories" />;
    case 'cj-evangelism':return <PageCjEvangelism />;
    case 'cj-stories':   return <PageCustomerStories />;
    case 'ng-apps':      return <PagePlaceholder label="Narrative Guide" title="Narrative Applications" />;
    case 'app-research': return <PageResearch />;
    case 'app-competitive': return <PageCompetitive />;
    case 'app-docs':     return <PagePlaceholder label="Appendix" title="Relevant Documents" />;
    default:             return <PageHome goPage={goPage} />;
  }
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function SgHead({ label, title }) {
  return (
    <div style={{marginBottom: 20}}>
      <div className="sg2-page-label">{label}</div>
      <h1 className="sg2-page-title">{title}</h1>
    </div>
  );
}

function SgInfoBanner({ arcs }) {
  return (
    <div className="sg2-info-banner">
      <strong>StoryKernel Arc:</strong>
      {arcs.map(a => <span key={a} className="sg2-tag green">{a}</span>)}
    </div>
  );
}

function SgMsgPoint({ text, personas }) {
  return (
    <div className="sg2-msg-point">
      <div className="sg2-msg-text">{text}</div>
      {personas && personas.map(p => <span key={p} className="sg2-tag" style={{marginRight:4}}>{p}</span>)}
    </div>
  );
}

function SgObjection({ q, a }) {
  return (
    <div className="sg2-objection">
      <div className="sg2-obj-q">{q}</div>
      <div className="sg2-obj-a">{a}</div>
    </div>
  );
}

// ── Home page (inline chat) ──────────────────────────────────────────────────
function PageHome({ goPage }) {
  const EFC = window.WODEN.EFC;
  const [messages, setMessages] = useSGState(() => {
    try { return JSON.parse(localStorage.getItem('wdn-efc-chat') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useSGState('');
  const [typing, setTyping] = useSGState(false);
  const bodyRef = useSGRef(null);

  useSGEffect(() => {
    localStorage.setItem('wdn-efc-chat', JSON.stringify(messages));
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    setMessages(m => [...m, { id: Date.now(), role: 'user', content: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: window.WODEN.mockEFCChatReply(q) }]);
      setTyping(false);
    }, 600 + Math.random() * 600);
  }

  return (
    <div>
      <div className="sg2-hero">
        <div className="sg2-hero-label">EFC International</div>
        <div className="sg2-hero-title">Digital StoryGuide</div>
        <div className="sg2-hero-desc">Your story is your strategy. This is where it lives. Every section is built on EFC's StoryKernel — a story about your customer, the world they're navigating, and why EFC is uniquely positioned to help them succeed.</div>
      </div>

      <div className="sg2-landing-grid">
        {[
          ['sk-full',  '◈', 'The StoryKernel', 'EFC\'s complete nine-part strategic narrative. Start here if you\'re new to the brand.'],
          ['mh-intro', '◇', 'Messaging Hierarchy', 'Mission, vision, values, positioning, brand promise, and differentiators.'],
          ['cj-intro', '◉', 'Customer Journey', 'Messaging mapped to every stage of the buying experience.'],
          ['app-research', '◇', 'Appendix', 'Research insights, competitive analysis, and relevant documents.'],
        ].map(([id, icon, title, desc]) => (
          <button key={id} className="sg2-landing-card" onClick={() => goPage(id)}>
            <div className="sg2-landing-card-icon">{icon}</div>
            <div className="sg2-landing-card-title">{title}</div>
            <div className="sg2-landing-card-desc">{desc}</div>
          </button>
        ))}
      </div>

      <div className="sg2-chat-wrap">
        <div className="sg2-chat-header">
          <div>
            <div className="sg2-chat-header-title">⚡ StoryEngine</div>
            <div className="sg2-chat-header-sub">EFC International · AI Assistant (Simulated)</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); localStorage.removeItem('wdn-efc-chat'); }}
              style={{marginLeft:'auto', background:'none', border:'none', color:'#c0d8c0', fontSize:12, cursor:'pointer'}}
            >
              Clear
            </button>
          )}
        </div>

        <div className="sg2-chat-body" ref={bodyRef}>
          {messages.length === 0 && (
            <div>
              <div className="chat-msg assistant" style={{marginBottom:10}}>
                Hi! I'm StoryEngine, your AI assistant for navigating EFC's strategic narrative. I can help you explore your StoryGuide, generate brand-aligned content, or answer questions about your messaging. How can I help you today?
              </div>
              <div className="sg2-chat-prompts">
                {window.WODEN.EFC_CHAT_SUGGESTIONS.map(s => (
                  <button key={s} className="sg2-chat-prompt" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={'chat-msg ' + m.role} style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
          ))}
          {typing && <div className="chat-msg assistant typing"><span/><span/><span/></div>}
        </div>

        <div className="sg2-chat-input-row">
          <textarea
            rows={1}
            value={input}
            placeholder="Ask anything about your brand story..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button className="sg2-chat-send" onClick={() => send()}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ── StoryKernel pages ────────────────────────────────────────────────────────
function PageSkIntro() {
  const EFC = window.WODEN.EFC;
  const arcs = EFC.storykernel.arcs;
  return (
    <div>
      <SgHead label="Strategic Narrative Foundation" title="Understanding the StoryKernel™" />
      <p className="sg2-body">EFC's StoryKernel is a strategic narrative designed to articulate what makes EFC essential. It follows a nine-part storytelling arc — positioning the customer as the hero and EFC as the mentor. Each passage maps directly to a phase of the customer journey.</p>
      <div className="sg2-callout">"The strength behind every connector is the people who understand its power."</div>
      <h3 className="sg2-section-h">The Nine-Part Arc</h3>
      {arcs.map(a => (
        <div key={a.n} className="sg2-arc-card">
          <div className="sg2-arc-card-header">
            <div className="sg2-arc-num">{a.n}</div>
            <span className="sg2-arc-title">{a.title}</span>
            <span className="sg2-tag green" style={{marginLeft:4, fontSize:10}}>{a.stage}</span>
          </div>
          <div className="sg2-arc-body">{a.why}</div>
        </div>
      ))}
    </div>
  );
}

const PASSAGE_CLASSES = ['arc-et','arc-st','arc-hero','arc-mentor','arc-cta','arc-tal','arc-obs','arc-sov','arc-pot'];

function PageSkFull() {
  const EFC = window.WODEN.EFC;
  const arcs = EFC.storykernel.arcs;
  return (
    <div>
      <SgHead label="EFC International" title="EFC's StoryKernel™" />
      <div className="sg2-callout">"The strength behind every connector is the people who understand its power."</div>
      <h3 className="sg2-section-h">Full Narrative</h3>
      <p className="sg2-body" style={{color:'#aaa', fontStyle:'italic', marginBottom:12}}>Hover each passage to reveal which arc section it corresponds to.</p>
      {arcs.map((a, i) => (
        <div key={a.n} className={'sg2-passage ' + PASSAGE_CLASSES[i]} title={a.title}>
          <div className="sg2-passage-label">{a.title}</div>
          {a.passage}
        </div>
      ))}
    </div>
  );
}

// ── Messaging Hierarchy pages ────────────────────────────────────────────────
function PageMhSimple({ label, title, content }) {
  return (
    <div>
      <SgHead label={label} title={title} />
      {content}
    </div>
  );
}

function PageMhIntro({ goPage }) {
  const EFC = window.WODEN.EFC;
  const m = EFC.messaging;
  return (
    <div>
      <SgHead label="Strategic Building Blocks" title="Messaging Hierarchy" />
      <p className="sg2-body">These elements translate EFC's StoryKernel into specific language and commitments used every day — internally to stay aligned and externally to move buyers.</p>

      <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#aaa',marginBottom:10}}>Internal Elements</p>

      <div className="sg2-card">
        <div className="sg2-card-label">Mission</div>
        <div className="sg2-callout">"{m.mission}"</div>
        <p className="sg2-body" style={{marginBottom:0}}>Derived from the Call to Adventure, the mission gives EFC's team a clear directive: everything they do should be in service of transforming how customers think about and use connectors.</p>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Vision</div>
        <div className="sg2-callout">"{m.vision}"</div>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Core Values</div>
        {m.values.map(v => (
          <div key={v.name} className="sg2-value-row">
            <div className="sg2-value-dot" />
            <div className="sg2-value-text"><strong>{v.name}:</strong> {v.body}</div>
          </div>
        ))}
      </div>

      <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#aaa',margin:'20px 0 10px'}}>External Elements</p>

      <div className="sg2-card">
        <div className="sg2-card-label">Positioning Statement</div>
        <div className="sg2-callout">"{m.positioning}"</div>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Brand Promise</div>
        <div className="sg2-callout">"{m.brandPromise}"</div>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Core Differentiator</div>
        <div className="sg2-callout">"{m.differentiator.title}"</div>
        <p className="sg2-body" style={{marginBottom:0}}>{m.differentiator.body}</p>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Verbal Identity</div>
        <p className="sg2-body">These are the terms EFC should own in customers' minds. Use them consistently across all channels.</p>
        {m.verbalIdentity.map(v => <span key={v.phrase} className="sg2-tag gold" style={{marginRight:6,marginBottom:6,display:'inline-block'}}>{v.phrase}</span>)}
        <div style={{marginTop:12}}>
          {m.verbalIdentity.map(v => (
            <div key={v.phrase} style={{fontSize:13,color:'#555',marginBottom:8}}>
              <strong>{v.phrase}</strong> — {v.note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MhVerbalIdentity() {
  const vi = window.WODEN.EFC.messaging.verbalIdentity;
  return (
    <div>
      <p className="sg2-body">These are the terms EFC should own in customers' minds. Use them consistently across all channels and touchpoints.</p>
      {vi.map(v => (
        <div key={v.phrase} className="sg2-card">
          <div className="sg2-card-label">Key Phrase</div>
          <div className="sg2-callout" style={{fontSize:20, fontStyle:'normal', fontWeight:700}}>"{v.phrase}"</div>
          <p className="sg2-body" style={{marginBottom:0}}>{v.note}</p>
        </div>
      ))}
    </div>
  );
}

function MhValues() {
  const vals = window.WODEN.EFC.messaging.values;
  return (
    <div>
      <p className="sg2-body">EFC's four core values define how the team shows up — internally and in every customer interaction.</p>
      {vals.map((v, i) => (
        <div key={v.name} className="sg2-card">
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
            <div className="sg2-arc-num">{i+1}</div>
            <div className="sg2-card-label" style={{margin:0}}>{v.name}</div>
          </div>
          <p className="sg2-body" style={{marginBottom:0}}>{v.body}</p>
        </div>
      ))}
    </div>
  );
}

function MhMission() {
  const { mission } = window.WODEN.EFC.messaging;
  return (
    <div>
      <div className="sg2-callout">"{mission}"</div>
      <div className="sg2-card">
        <p className="sg2-body" style={{marginBottom:0}}>Derived from the Call to Adventure, the mission gives EFC's team a clear directive: everything they do should be in service of transforming how customers think about and use connectors.</p>
      </div>
    </div>
  );
}

function MhPositioning() {
  const { positioning } = window.WODEN.EFC.messaging;
  return (
    <div>
      <div className="sg2-callout">"{positioning}"</div>
      <div className="sg2-card">
        <p className="sg2-body" style={{marginBottom:0}}>In a category dominated by price and part numbers, EFC focuses on connection — not just how parts fit together, but how decisions connect across engineering, purchasing, and production.</p>
      </div>
    </div>
  );
}

function MhDiff() {
  const { differentiator } = window.WODEN.EFC.messaging;
  return (
    <div>
      <div className="sg2-callout">"{differentiator.title}"</div>
      <div className="sg2-card">
        <p className="sg2-body" style={{marginBottom:0}}>{differentiator.body}</p>
      </div>
    </div>
  );
}

function MhPromise() {
  const { brandPromise } = window.WODEN.EFC.messaging;
  return (
    <div>
      <div className="sg2-callout">"{brandPromise}"</div>
      <div className="sg2-card">
        <p className="sg2-body" style={{marginBottom:0}}>"Before you know you need them" speaks to EFC's ability to engage early, anticipate downstream requirements, and account for operational realities often overlooked when fasteners are treated as an afterthought.</p>
      </div>
    </div>
  );
}

function MhVision() {
  const { vision } = window.WODEN.EFC.messaging;
  return (
    <div>
      <div className="sg2-callout">"{vision}"</div>
      <div className="sg2-card">
        <p className="sg2-body" style={{marginBottom:0}}>This vision describes a future where customers no longer manage unnecessary complexity caused by overlooked decisions around small parts — connectors become a stabilizing force rather than a hidden risk.</p>
      </div>
    </div>
  );
}

// ── ICP (shared) ─────────────────────────────────────────────────────────────
function PageIcpFull() {
  const icp = window.WODEN.EFC.icp;
  return (
    <div>
      <p className="sg2-body">EFC's ICP takes the Hero of the StoryKernel off the page and into the real world — defining not just who this person is, but what their company looks like, what their role demands daily, and how to identify them in the market.</p>
      <div className="sg2-callout">"Design-responsible contributors know intuitively that projects are more than their individual components."</div>

      <div className="sg2-card">
        <div className="sg2-card-label">Who This Person Is</div>
        {icp.who.split('\n\n').map((p, i) => <p key={i} className="sg2-body" style={{marginBottom:10}}>{p}</p>)}
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Their Company</div>
        <table className="sg2-table">
          <tbody>
            {icp.company.map(r => (
              <tr key={r.label}><td>{r.label}</td><td>{r.value}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">How to Find Them</div>
        <table className="sg2-table">
          <tbody>
            {icp.howToFind.map(r => (
              <tr key={r.channel}><td>{r.channel}</td><td>{r.detail}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sg2-card">
        <div className="sg2-card-label">Key Phrases from the StoryKernel</div>
        {icp.keyPhrases.map(p => (
          <div key={p.phrase} style={{borderBottom:'1px solid #f0f0f0', padding:'10px 0'}}>
            <div style={{fontWeight:600, fontSize:13, fontStyle:'italic', color:'#333', marginBottom:2}}>"{p.phrase}"</div>
            <div style={{fontSize:12, color:'#888'}}>{p.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Customer Journey pages ───────────────────────────────────────────────────
function PageCjIntro({ goPage }) {
  return (
    <div>
      <SgHead label="Customer Journey Overview" title="Understanding the Customer Journey" />
      <p className="sg2-body">The customer journey maps EFC's story to five stages of the buying experience — from first awareness of a problem through becoming an active advocate. Each stage has a distinct strategic goal, a set of targeted messaging points, and calls to action.</p>

      <div className="sg2-landing-grid">
        {[
          ['cj-awareness',  'Awareness',          "Before prospects know EFC's name, they're living inside a problem. Awareness content meets them there."],
          ['cj-consider',   'Consideration',       "Once a buyer decides something needs to change, EFC's job is to be understood, not to sell."],
          ['cj-evaluation', 'Evaluation',          'Where trust becomes the deciding factor. Every buying decision is ultimately emotional.'],
          ['cj-cx',         'Customer Experience', 'Great customer experience is about keeping the promises made through the first three phases.'],
          ['cj-evangelism', 'Evangelism',          'When EFC keeps its promises, customers become champions.'],
        ].map(([id, title, desc]) => (
          <button key={id} className="sg2-landing-card" onClick={() => goPage(id)}>
            <div className="sg2-landing-card-title">{title}</div>
            <div className="sg2-landing-card-desc">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PageCjAwareness() {
  const aw = window.WODEN.EFC.awareness;
  return (
    <div>
      <SgHead label="Customer Journey · Stage 1" title="Awareness" />
      <SgInfoBanner arcs={['Existential Threat', 'Shared Threat']} />
      <p className="sg2-body">Before prospects know EFC's name, they're living inside a problem — feeling the friction of inefficiency or sensing opportunity that keeps slipping away. Awareness content meets them there and gives their frustration a name. This is not the time to outline features and benefits — it's time to speak directly to the person experiencing the pain.</p>

      <div className="sg2-card">
        <div className="sg2-card-label">Strategic Goal</div>
        {aw.goal.split('\n\n').map((p,i) => <p key={i} className="sg2-body" style={{marginBottom:8}}>{p}</p>)}
      </div>

      <h3 className="sg2-section-h">Elevator Pitch</h3>
      <div className="sg2-script-block">
        <div className="sg2-script-label">Script</div>
        {aw.elevatorPitch.map((line, i) => (
          <p key={i} style={{marginBottom: i < aw.elevatorPitch.length - 1 ? 12 : 0,
            color: i === aw.elevatorPitch.length - 1 ? '#ffd966' : undefined,
            fontStyle: i === aw.elevatorPitch.length - 1 ? 'italic' : undefined}}>
            {line}
          </p>
        ))}
      </div>

      <h3 className="sg2-section-h">Messaging Points</h3>
      {aw.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}

      <h3 className="sg2-section-h">Objections &amp; Responses</h3>
      {aw.objections.map((o, i) => <SgObjection key={i} q={o.q} a={o.a} />)}

      <h3 className="sg2-section-h">Calls to Action</h3>
      <div className="sg2-cta-grid">
        {aw.ctas.map((c, i) => (
          <div key={i} className="sg2-cta-card">
            <div className="sg2-cta-title">{c.persona}</div>
            <div className="sg2-cta-body">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageCjConsideration() {
  const co = window.WODEN.EFC.consideration;
  return (
    <div>
      <SgHead label="Customer Journey · Stage 2" title="Consideration" />
      <SgInfoBanner arcs={['Our Hero & Their Meaning']} />
      <p className="sg2-body">Once a buyer decides something needs to change, the story shifts. They're no longer just feeling a problem — they're actively looking for a path forward. At this stage, EFC's job isn't to sell. It's to be understood.</p>

      <div className="sg2-card">
        <div className="sg2-card-label">Strategic Goal</div>
        <p className="sg2-body" style={{marginBottom:0}}>{co.goal}</p>
      </div>

      <h3 className="sg2-section-h">Messaging Points by Industry</h3>
      {co.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}

      <h3 className="sg2-section-h">Objections &amp; Responses</h3>
      {co.objections.map((o, i) => <SgObjection key={i} q={o.q} a={o.a} />)}

      <h3 className="sg2-section-h">Calls to Action</h3>
      <div className="sg2-cta-grid">
        {co.ctas.map((c, i) => (
          <div key={i} className="sg2-cta-card">
            <div className="sg2-cta-title">{c.persona}</div>
            <div className="sg2-cta-body">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PagePersonas() {
  const personas = window.WODEN.EFC.personas;
  return (
    <div>
      <SgHead label="Consideration · Sub-Section" title="Personas" />
      <p className="sg2-body">A buying decision rarely happens in isolation. Beyond the Hero (the ICP), there are other personas whose perspectives shape the path to a sale. Each needs to hear EFC's story told through their own lens.</p>
      {personas.map(p => (
        <div key={p.name} className="sg2-persona">
          <div className="sg2-persona-header">
            <div className="sg2-persona-avatar">{p.initial}</div>
            <div>
              <div className="sg2-persona-name">{p.name}</div>
              <div className="sg2-persona-sub">{p.title} · {p.industry}</div>
            </div>
          </div>
          <div className="sg2-persona-row"><strong>Challenges:</strong> {p.challenges}</div>
          <div className="sg2-persona-row"><strong>Triggers:</strong> {p.triggers}</div>
          <div className="sg2-persona-row" style={{marginBottom:14}}><strong>Goals:</strong> {p.goals}</div>
          <div style={{borderTop:'1px solid #f0f0f0', paddingTop:12}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#aaa',marginBottom:8}}>Targeted Messaging</div>
            {p.msgs.map((msg, i) => (
              <div key={i} style={{fontSize:13, color:'#555', marginBottom:6, lineHeight:1.6}}>• {msg}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PageCjEvaluation() {
  const ev = window.WODEN.EFC.evaluation;
  return (
    <div>
      <SgHead label="Customer Journey · Stage 3" title="Evaluation" />
      <SgInfoBanner arcs={['The Mentor & Their Allies', 'Call to Adventure']} />
      <p className="sg2-body">The Evaluation stage is where trust becomes the deciding factor. The buyer has acknowledged the problem, engaged with EFC, and is now making a decision — not just about which solution, but which partner to trust.</p>

      <div className="sg2-card">
        <div className="sg2-card-label">Strategic Goal</div>
        <p className="sg2-body" style={{marginBottom:0}}>{ev.goal}</p>
      </div>

      <h3 className="sg2-section-h">Messaging Points by Industry</h3>
      {ev.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}

      <h3 className="sg2-section-h">Objections &amp; Responses</h3>
      {ev.objections.map((o, i) => <SgObjection key={i} q={o.q} a={o.a} />)}

      <h3 className="sg2-section-h">Why EFC Wins: Total Operational Perspective</h3>
      {ev.scenarios.map((s, i) => (
        <div key={i} className="sg2-card">
          <div className="sg2-card-label">{s.industry}</div>
          <p className="sg2-body" style={{marginBottom:0}}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function PageCredibility() {
  const ev = window.WODEN.EFC.evaluation;
  return (
    <div>
      <p className="sg2-body">A compelling credibility story does more than list accomplishments — it reveals the depth of EFC's operational understanding. At the Evaluation stage, buyers are deciding whether to trust.</p>
      <div className="sg2-callout">"We've spent decades working backward from OEM requirements — understanding exactly what they're looking for, so we can flag a wrong call before it becomes costly rework."</div>
      <h3 className="sg2-section-h">Industry Scenarios</h3>
      {ev.scenarios.map((s, i) => (
        <div key={i} className="sg2-card">
          <div className="sg2-card-label">{s.industry}</div>
          <p className="sg2-body" style={{marginBottom:0}}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function PageOriginStory() {
  const os = window.WODEN.EFC.originStory;
  return (
    <div>
      <SgHead label="Evaluation · Sub-Section" title="Origin Story" />
      <p className="sg2-body">A compelling origin story does more than explain how EFC started — it reveals why EFC exists. At the Evaluation stage, buyers are deciding whether to trust. The origin story answers the question: "Do these people genuinely believe what they're saying?"</p>
      <div className="sg2-callout">"Opportunity was missed, not because teams lacked effort, but because they lacked total operational perspective to guide selection."</div>

      <div className="sg2-card" style={{lineHeight:1.8, color:'#444', fontSize:14}}>
        {os.full.map((p, i) => (
          <p key={i} style={{marginBottom: i < os.full.length - 1 ? 14 : 0,
            fontStyle: i === os.full.length - 1 ? 'italic' : undefined,
            fontWeight: i === os.full.length - 1 ? 600 : undefined,
            color: i === os.full.length - 1 ? '#1a3a2a' : undefined}}>
            {p}
          </p>
        ))}
      </div>

      <div className="sg2-card" style={{marginTop:14}}>
        <div className="sg2-card-label">Short-Form Origin Story (75–100 words)</div>
        <p style={{fontSize:13, color:'#555', lineHeight:1.7, margin:0}}>{os.short}</p>
      </div>
    </div>
  );
}

function PageCjCx() {
  const cx = window.WODEN.EFC.cx;
  return (
    <div>
      <SgHead label="Customer Journey · Stage 4" title="Customer Experience" />
      <SgInfoBanner arcs={['The Talisman', 'Obstacles to Overcome']} />
      <p className="sg2-body">{cx.goal}</p>

      <h3 className="sg2-section-h">Messaging — Design-Responsible Contributors</h3>
      {cx.msgDesign.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}

      <h3 className="sg2-section-h">Messaging — Purchasing</h3>
      {cx.msgPurchasing.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}

      <h3 className="sg2-section-h">Calls to Action</h3>
      <div className="sg2-cta-grid">
        {cx.ctas.map((c, i) => (
          <div key={i} className="sg2-cta-card">
            <div className="sg2-cta-title">{c.label}</div>
            <div className="sg2-cta-body">{c.body}</div>
          </div>
        ))}
      </div>

      <div className="sg2-card accent" style={{marginTop:14}}>
        <div className="sg2-card-label">Sample Welcome Email — Subject: Getting Connected with EFC</div>
        <div style={{fontSize:13, color:'#444', lineHeight:1.8, whiteSpace:'pre-line'}}>{cx.welcomeEmail}</div>
      </div>
    </div>
  );
}

function PageCjEvangelism() {
  const ev = window.WODEN.EFC.evangelism;
  return (
    <div>
      <SgHead label="Customer Journey · Stage 5" title="Evangelism" />
      <SgInfoBanner arcs={['Spoils of Victory', 'Potential Achieved']} />
      <p className="sg2-body">When EFC keeps its promises, customers become champions. The Evangelism stage is the culmination of everything the customer journey has been building toward — the moment when the transformation the StoryKernel describes becomes real.</p>

      <div className="sg2-card">
        <div className="sg2-card-label">Strategic Goal</div>
        <p className="sg2-body" style={{marginBottom:0}}>{ev.goal}</p>
      </div>

      <h3 className="sg2-section-h">Messaging Points</h3>
      {ev.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
    </div>
  );
}

function PageCustomerStories() {
  const stories = window.WODEN.EFC.evangelism.customerStories;
  return (
    <div>
      <SgHead label="Evangelism · Sub-Section" title="Customer Stories" />
      <p className="sg2-body">Real outcomes from real partnerships. These stories demonstrate how EFC's Total Operational Perspective creates measurable change — transforming satisfied buyers into active advocates.</p>
      {stories.map((s, i) => (
        <div key={i} className="sg2-story-card">
          <div className="sg2-story-title">{s.title}</div>
          <div className="sg2-story-body">{s.body}</div>
          <span className="sg2-tag green">Outcome: {s.outcome}</span>
        </div>
      ))}
    </div>
  );
}

// ── Appendix pages ───────────────────────────────────────────────────────────
function PageResearch() {
  const quotes = window.WODEN.EFC.appendix.quotes;
  return (
    <div>
      <SgHead label="Appendix" title="Research Insights" />
      <p className="sg2-body">Every brand story is built on a foundation of real voices and real research. These insights shaped EFC's strategic narrative — the discovery quotes that became anchors for the StoryKernel.</p>
      {quotes.map((q, i) => (
        <div key={i} className="sg2-quote-card">
          <div className="sg2-quote-text">"{q.text}"</div>
          <div className="sg2-quote-who">— {q.who}</div>
          <div className="sg2-quote-ctx">{q.context}</div>
        </div>
      ))}
    </div>
  );
}

function PageCompetitive() {
  const comps = window.WODEN.EFC.appendix.competitors;
  return (
    <div>
      <SgHead label="Appendix" title="Competitive Analysis" />
      <p className="sg2-body">The competitive landscape the story was built to navigate. Understanding how competitors position themselves clarifies where EFC's differentiation is most valuable.</p>
      {comps.map((c, i) => (
        <div key={i} className="sg2-comp-card">
          <div className="sg2-comp-name">{c.name}</div>
          <div className="sg2-comp-body">{c.body}</div>
        </div>
      ))}
    </div>
  );
}

function PagePlaceholder({ label, title }) {
  return (
    <div>
      <SgHead label={label} title={title} />
      <div className="sg2-placeholder">
        <h3>Content Coming Soon</h3>
        <p>This section will be populated with {title.toLowerCase()} content.</p>
      </div>
    </div>
  );
}

// ── Keep ChatPanel for any other usage ───────────────────────────────────────
function ChatPanel({ open, onClose }) {
  const [messages, setMessages] = useSGState(() => {
    try { return JSON.parse(localStorage.getItem('wdn-chat') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useSGState('');
  const [typing, setTyping] = useSGState(false);
  const bodyRef = useSGRef(null);

  useSGEffect(() => {
    localStorage.setItem('wdn-chat', JSON.stringify(messages));
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages(m => [...m, { id: Date.now(), role: 'user', content: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: window.WODEN.mockChatReply(q) }]);
      setTyping(false);
    }, 700 + Math.random() * 700);
  };

  return (
    <div className={'chat-panel' + (open ? ' open' : '')}>
      <div className="chat-header">
        <div>
          <h3>Ask your StoryGuide</h3>
          <div className="mono muted" style={{fontSize: 10, letterSpacing: '0.1em'}}>AI (SIMULATED)</div>
        </div>
        <button className="wf-btn sm ghost" onClick={onClose}>✕</button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div className="col">
            <div className="chat-prompts">
              {window.WODEN.CHAT_SUGGESTIONS.map(s => (
                <button key={s} className="chat-prompt" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={'chat-msg ' + m.role}>{m.content}</div>
        ))}
        {typing && <div className="chat-msg assistant typing"><span/><span/><span/></div>}
      </div>
      <div className="chat-input-row">
        <textarea
          rows={1}
          value={input}
          placeholder="Ask anything about your StoryGuide…"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="chat-send" onClick={() => send()} aria-label="Send">➤</button>
      </div>
    </div>
  );
}

Object.assign(window, { StoryGuide, ChatPanel });
