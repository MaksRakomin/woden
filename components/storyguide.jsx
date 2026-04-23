// StoryGuide renderer with swappable nav patterns + chat slide-over
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

function StoryGuide({ readOnly, navPattern = 'toc', rhythm = 'editorial', chatMode = 'slideover' }) {
  const [theme, setTheme] = useStateS(() => localStorage.getItem('wdn-sg-theme') || 'light');
  const [active, setActive] = useStateS(1);
  const [page, setPage] = useStateS(1);
  const [chatOpen, setChatOpen] = useStateS(false);
  const [tocOpen, setTocOpen] = useStateS(false);
  const titles = window.WODEN.SECTION_TITLES;

  useEffectS(() => {
    const h = () => setTheme(localStorage.getItem('wdn-sg-theme') || 'light');
    window.addEventListener('storage', h);
    const open = () => setChatOpen(true);
    window.addEventListener('open-chat', open);
    return () => { window.removeEventListener('storage', h); window.removeEventListener('open-chat', open); };
  }, []);

  // scroll-spy for toc/scrollspy modes
  useEffectS(() => {
    if (navPattern !== 'toc' && navPattern !== 'scrollspy') return;
    const handler = () => {
      for (let i = titles.length; i >= 1; i--) {
        const el = document.getElementById('sg-s-' + i);
        if (el && el.getBoundingClientRect().top < 200) {
          setActive(i);
          return;
        }
      }
      setActive(1);
    };
    const container = document.querySelector('.sg-scroll');
    if (container) container.addEventListener('scroll', handler);
    window.addEventListener('scroll', handler);
    return () => {
      if (container) container.removeEventListener('scroll', handler);
      window.removeEventListener('scroll', handler);
    };
  }, [navPattern]);

  const wrapperCls = 'screen sg-wrapper ' + (theme === 'night' ? 'sg-theme-night' : '');
  const isPaginated = navPattern === 'paginated' || navPattern === 'book';

  // sections array to render
  const sectionsToRender = isPaginated ? [page] : titles.map((_, i) => i + 1);

  return (
    <div className={wrapperCls} style={{position: 'relative'}}>
      {/* reader toolbar */}
      <div className="row" style={{justifyContent:'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10}}>
        <div>
          <div className="mono muted" style={{fontSize: 11, letterSpacing: '0.15em'}}>MERIDIAN COFFEE CO. · STORYGUIDE v1.3</div>
          <h1 className="scribble" style={{marginTop: 4}}>Coffee with conviction.</h1>
        </div>
        <div className="row" style={{gap: 8}}>
          {navPattern === 'paginated' || navPattern === 'book' ? (
            <>
              <button className="wf-btn sm ghost" disabled={page===1} onClick={() => setPage(p => Math.max(1,p-1))}>← Prev</button>
              <span className="mono" style={{fontSize:11}}>{page} / 14</span>
              <button className="wf-btn sm ghost" disabled={page===14} onClick={() => setPage(p => Math.min(14,p+1))}>Next →</button>
            </>
          ) : null}
          {(navPattern === 'drawer') && (
            <button className="wf-btn sm ghost" onClick={() => setTocOpen(true)}>☰ Sections</button>
          )}
          <button className="wf-btn sm ghost" onClick={() => toast('Preparing PDF…')}>Export PDF</button>
          <button className="wf-btn sm ghost" onClick={() => { toast('Sending to printer…'); }}>Print</button>
          {!readOnly && <button className="wf-btn sm primary" onClick={() => toast('Link copied to clipboard')}>Share</button>}
        </div>
      </div>

      {/* shell: with or without ToC */}
      {(navPattern === 'toc' || navPattern === 'scrollspy') ? (
        <div className="sg-shell">
          <aside className="sg-toc">
            <h4>Contents</h4>
            <ol>
              {titles.map((t, i) => (
                <li key={i}>
                  <a className={active === i+1 ? 'active' : ''}
                     onClick={() => { const el = document.getElementById('sg-s-'+(i+1)); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); setActive(i+1); }}>
                    <span className="wf-circle">{i+1}</span>
                    <span>{t}</span>
                  </a>
                </li>
              ))}
            </ol>
            {navPattern === 'scrollspy' && <Note style={{marginTop: 12, fontSize: 14}}>scroll-spy ⇡<br/>updates on scroll</Note>}
          </aside>
          <main>
            {sectionsToRender.map(n => <RenderSection key={n} n={n} rhythm={rhythm} theme={theme} />)}
          </main>
        </div>
      ) : (
        <div>
          {sectionsToRender.map(n => <RenderSection key={n} n={n} rhythm={rhythm} theme={theme} />)}
          {/* drawer overlay */}
          {tocOpen && (
            <div onClick={() => setTocOpen(false)} style={{position:'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 60}}>
              <div onClick={e => e.stopPropagation()} style={{position:'absolute', top:0,left:0,bottom:0, width: 320, background: 'var(--paper)', borderRight: '2px solid var(--line)', padding: 20, overflowY:'auto'}}>
                <div className="row" style={{justifyContent:'space-between', marginBottom: 14}}>
                  <h3>Sections</h3>
                  <button className="wf-btn sm ghost" onClick={() => setTocOpen(false)}>✕</button>
                </div>
                <ol style={{listStyle:'none', padding: 0, margin: 0, display:'flex', flexDirection:'column', gap: 4}}>
                  {titles.map((t,i) => (
                    <li key={i} style={{display:'flex',alignItems:'center',gap:10, padding:'8px 10px', border:'1.5px dashed var(--ink)', borderRadius: 6, cursor:'pointer'}}
                        onClick={() => { if (isPaginated) { setPage(i+1); } else { const el=document.getElementById('sg-s-'+(i+1)); if(el) el.scrollIntoView({behavior:'smooth'}); } setTocOpen(false); }}>
                      <span className="wf-circle" style={{width: 26, height: 26, fontSize: 12}}>{i+1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
          {/* book mode: show book spread feedback */}
          {navPattern === 'book' && (
            <Note style={{textAlign:'center', marginTop: 20, fontSize: 16}}>
              📖 Book mode — arrow keys turn pages
            </Note>
          )}
        </div>
      )}

      {/* floating chat FAB */}
      <button className="chat-fab" onClick={() => setChatOpen(o => !o)} aria-label="Open chat">
        {chatOpen ? '✕' : '💬'}
      </button>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} mode={chatMode} />
    </div>
  );
}

function RenderSection({ n, rhythm, theme }) {
  const title = window.WODEN.SECTION_TITLES[n-1];
  return (
    <section id={'sg-s-' + n} className="sg-section">
      <div className="sg-section-header">
        <div className="wf-circle accent">{n}</div>
        <div>
          <div className="sg-section-num">SECTION {String(n).padStart(2,'0')} · OF 14</div>
          <h2>{title}</h2>
        </div>
      </div>
      <SectionBody n={n} rhythm={rhythm} />
    </section>
  );
}

function SectionBody({ n, rhythm }) {
  const M = window.WODEN.MERIDIAN;
  const layouts = {
    centered:   { maxWidth: 720, margin: '0 auto' },
    editorial:  {},
    split:      {},
    fullbleed:  {},
  };
  const wrap = layouts[rhythm] || {};

  if (n === 1) { // cover
    return (
      <div style={wrap}>
        <div className="grid" style={{gridTemplateColumns: rhythm === 'split' ? '1fr 1fr' : '1fr', gap: 40, alignItems:'center'}}>
          <div>
            <Rect label="Client logo · 480×120" h={120} />
            <h1 style={{fontSize: 52, marginTop: 30, lineHeight: 1.05}}>{M.tagline}</h1>
            <p className="mono muted" style={{marginTop: 20, fontSize: 12, letterSpacing: '0.12em'}}>PREPARED BY WODEN · v1.3 · APRIL 2026</p>
          </div>
          {rhythm === 'split' && <Rect label="Cover image · 1/1" h={360} />}
        </div>
      </div>
    );
  }
  if (n === 2) { // narrative
    return (
      <div style={{...wrap, maxWidth: 760, margin: rhythm==='centered'?'0 auto':0}}>
        {M.narrative.map((p, i) => (
          <p key={i} style={{fontSize: 18, lineHeight: 1.6, marginBottom: 16}}>{p}</p>
        ))}
        <blockquote className="wdn-pullquote">"Transparency isn't a feature. It's the point."</blockquote>
      </div>
    );
  }
  if (n === 3) { // mission & vision
    return (
      <div className="grid g-2">
        <Card pad={24}><div className="mono muted" style={{fontSize: 10, letterSpacing: '0.1em'}}>MISSION</div><p style={{fontSize: 20, marginTop: 10, lineHeight: 1.4}}>{M.mission}</p></Card>
        <Card pad={24}><div className="mono muted" style={{fontSize: 10, letterSpacing: '0.1em'}}>VISION</div><p style={{fontSize: 20, marginTop: 10, lineHeight: 1.4}}>{M.vision}</p></Card>
      </div>
    );
  }
  if (n === 4) { // audience
    return (
      <div className="grid g-2">
        {M.personas.map(p => (
          <Card key={p.name} pad={0}>
            <Rect label={`${p.name} · portrait`} h={200} style={{borderRadius: '4px 4px 0 0', borderLeft: 0, borderTop: 0, borderRight: 0}}/>
            <div style={{padding: 20}}>
              <h3>{p.name}, {p.age}</h3>
              <p className="script accent-c" style={{fontSize: 20, marginTop: 6, marginBottom: 12}}>"{p.quote}"</p>
              <div className="row" style={{flexWrap:'wrap', gap: 6}}>
                {p.tags.map(t => <span key={t} className="wf-tag">{t}</span>)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  if (n === 5) { // positioning
    return (
      <div style={{maxWidth: 820}}>
        <Card pad={36} style={{background: 'var(--paper-warm)'}}>
          <div className="mono muted" style={{fontSize: 11, letterSpacing: '0.12em', marginBottom: 12}}>POSITIONING STATEMENT</div>
          <p style={{fontSize: 24, lineHeight: 1.45, fontFamily: 'var(--hand-display)'}}>{M.positioning}</p>
        </Card>
      </div>
    );
  }
  if (n === 6) { // pillars
    return (
      <div className="grid g-4">
        {M.pillars.map((p, i) => (
          <Card key={p.title}>
            <div className="wf-circle accent" style={{marginBottom: 12}}>{i+1}</div>
            <h3 style={{marginBottom: 6}}>{p.title}</h3>
            <p className="muted" style={{fontSize: 14}}>{p.body}</p>
          </Card>
        ))}
      </div>
    );
  }
  if (n === 7) { // messaging
    return (
      <div>
        <h2 style={{fontSize: 42, maxWidth: 700}}>Every bag names a farmer. Because transparency isn't marketing — it's the whole point.</h2>
        <div className="grid g-3" style={{marginTop: 30}}>
          {['Named farmer on every bag','Cupped 3× before roast','72-hr anaerobic process'].map(p => (
            <Card key={p}><h4>✓ {p}</h4><Lines n={2} /></Card>
          ))}
        </div>
      </div>
    );
  }
  if (n === 8) { // tone
    return (
      <div className="col">
        {M.tone.map(t => (
          <Card key={t.trait}>
            <div className="grid" style={{gridTemplateColumns: '120px 1fr 1fr', gap: 20, alignItems: 'center'}}>
              <h3>{t.trait}</h3>
              <div><div className="mono muted" style={{fontSize: 10}}>WE SAY</div><p style={{margin: '6px 0 0'}}>"{t.say}"</p></div>
              <div><div className="mono muted" style={{fontSize: 10}}>WE DON'T</div><p style={{margin: '6px 0 0', textDecoration:'line-through', opacity: 0.6}}>"{t.dont}"</p></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  if (n === 9) { // values
    return (
      <div className="grid g-3">
        {M.values.map((v,i) => (
          <Card key={v}>
            <div className="wf-circle accent" style={{marginBottom: 10}}>{i+1}</div>
            <h3>{v}</h3>
            <Lines n={2} />
          </Card>
        ))}
      </div>
    );
  }
  if (n === 10) { // personality
    return (
      <div className="grid" style={{gridTemplateColumns:'1fr 1.5fr', gap: 24}}>
        <Card pad={28} style={{textAlign:'center', background:'var(--paper-warm)'}}>
          <div className="mono muted" style={{fontSize: 10}}>ARCHETYPE</div>
          <h1 style={{fontSize: 40, marginTop: 8}}>{M.personality.archetype}</h1>
        </Card>
        <Card>
          <h3 style={{marginBottom: 12}}>If Meridian were a person…</h3>
          <div className="row" style={{flexWrap:'wrap', gap: 8, marginBottom: 14}}>
            {M.personality.adjectives.map(a => <span key={a} className="wf-tag">{a}</span>)}
          </div>
          <Lines n={4} />
        </Card>
      </div>
    );
  }
  if (n === 11) { // visual identity
    return (
      <div className="col">
        <Card>
          <h3 style={{marginBottom: 14}}>Logo variants</h3>
          <div className="grid g-3">
            <Rect label="Primary" h={120}/>
            <Rect label="Reversed" h={120} style={{background:'#131215'}}/>
            <Rect label="Icon" h={120}/>
          </div>
        </Card>
        <Card>
          <h3 style={{marginBottom: 14}}>Palette</h3>
          <div className="grid g-6">
            {M.palette.map(p => (
              <div key={p.hex}>
                <div style={{background: p.hex, height: 80, borderRadius: 6, border: '1.5px solid var(--line)'}}/>
                <div style={{marginTop: 6, fontWeight: 700, fontSize: 13}}>{p.name}</div>
                <div className="mono muted" style={{fontSize: 10}}>{p.hex}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{marginBottom: 14}}>Typography</h3>
          <div className="grid g-2">
            <div><div className="mono muted" style={{fontSize: 10}}>HEADINGS · TIEMPOS HEADLINE</div><div style={{fontSize: 36, fontFamily: 'var(--hand-display)'}}>Coffee with conviction.</div></div>
            <div><div className="mono muted" style={{fontSize: 10}}>BODY · INTER</div><p style={{fontSize: 14}}>Radically transparent coffee — named farmers, documented process, honest prices.</p></div>
          </div>
        </Card>
      </div>
    );
  }
  if (n === 12) { // photography
    return (
      <div>
        <p style={{fontSize: 17, marginBottom: 20, maxWidth: 600}}>Natural light. Human hands. Never over-styled. We shoot what's real and let it breathe.</p>
        <div className="grid g-3">
          {Array.from({length: 6}).map((_, i) => <Rect key={i} label={`Mood ${i+1}`} h={200}/>)}
        </div>
      </div>
    );
  }
  if (n === 13) { // applications
    return (
      <div className="grid g-2">
        <Card><h4>Business card</h4><Rect label="Front / back · 3.5×2in" h={220} style={{marginTop:10}}/></Card>
        <Card><h4>Letterhead</h4><Rect label="A4 mockup" h={220} style={{marginTop:10}}/></Card>
        <Card><h4>Website header</h4><Rect label="Desktop hero" h={220} style={{marginTop:10}}/></Card>
        <Card><h4>Social post</h4><Rect label="1080×1080" h={220} style={{marginTop:10}}/></Card>
      </div>
    );
  }
  if (n === 14) { // glossary
    return (
      <div className="col">
        {M.glossary.map(g => (
          <div key={g.term} style={{display:'grid', gridTemplateColumns: '200px 1fr', gap: 20, padding: '14px 0', borderBottom: '1.5px dashed var(--ink-faint)'}}>
            <h4>{g.term}</h4>
            <p className="muted" style={{margin: 0}}>{g.def}</p>
          </div>
        ))}
      </div>
    );
  }
  return <div><Lines n={5}/></div>;
}

function ChatPanel({ open, onClose, mode = 'slideover' }) {
  const [messages, setMessages] = useStateS(() => {
    try { return JSON.parse(localStorage.getItem('wdn-chat') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useStateS('');
  const [typing, setTyping] = useStateS(false);
  const bodyRef = useRefS(null);

  useEffectS(() => {
    localStorage.setItem('wdn-chat', JSON.stringify(messages));
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages(m => [...m, { id: Date.now(), role: 'user', content: q }]);
    setInput('');
    setTyping(true);
    const delay = 700 + Math.random() * 700;
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: window.WODEN.mockChatReply(q) }]);
      setTyping(false);
    }, delay);
  };

  return (
    <div className={'chat-panel' + (open ? ' open' : '')}>
      <div className="chat-header">
        <div>
          <h3>Ask your StoryGuide</h3>
          <div className="mono muted" style={{fontSize: 10, letterSpacing: '0.1em'}}>MERIDIAN · AI (SIMULATED)</div>
        </div>
        <button className="wf-btn sm ghost" onClick={onClose}>✕</button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div className="col">
            <div className="muted" style={{fontSize: 13, marginBottom: 4}}>Try one of these:</div>
            <div className="chat-prompts">
              {window.WODEN.CHAT_SUGGESTIONS.map(s => (
                <button key={s} className="chat-prompt" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
            <Note style={{marginTop: 12, textAlign: 'center'}}>responses are simulated ✦</Note>
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
