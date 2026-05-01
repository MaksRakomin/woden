const { useState: useSGState, useEffect: useSGEffect, useRef: useSGRef } = React;

// ─── Nav Definition ───────────────────────────────────────────────────────────
const SG_NAV = [
    { type: 'item', id: 'ai', icon: '⚡', label: 'AI Assistant' },
    { type: 'item', id: 'home', icon: '⬡', label: 'Home' },
    { type: 'group', id: 'sk', icon: '◈', label: 'StoryKernel', items: [{ id: 'sk-intro', label: 'Understanding the StoryKernel' }, { id: 'sk-full', label: '[CLIENT] StoryKernel', sub: true }] },
    { type: 'group', id: 'mh', icon: '◇', label: 'Messaging Hierarchy', items: [{ id: 'mh-intro', label: 'Understanding the Messaging Hierarchy' }, { id: 'mh-verbal', label: 'Verbal Identity', sub: true }, { id: 'mh-icp', label: 'ICP', sub: true }, { id: 'mh-values', label: 'Values', sub: true }, { id: 'mh-mission', label: 'Mission', sub: true }, { id: 'mh-pos', label: 'Positioning', sub: true }, { id: 'mh-diff', label: 'Differentiators', sub: true }, { id: 'mh-promise', label: 'Brand Promise', sub: true }, { id: 'mh-vision', label: 'Vision', sub: true }] },
    { type: 'group', id: 'cj', icon: '◉', label: 'Customer Journey', items: [{ id: 'cj-intro', label: 'Understanding the Customer Journey' }, { id: 'cj-awareness', label: 'Awareness', sub: true }, { id: 'cj-aw-icp', label: 'ICP', sub2: true }, { id: 'cj-consider', label: 'Consideration', sub: true }, { id: 'cj-personas', label: 'Personas', sub2: true }, { id: 'cj-evaluation', label: 'Evaluation', sub: true }, { id: 'cj-credibility', label: 'Credibility Story', sub2: true }, { id: 'cj-origin', label: 'Origin Story', sub2: true }, { id: 'cj-cx', label: 'Customer Experience', sub: true }, { id: 'cj-product', label: 'Product Stories', sub2: true }, { id: 'cj-evangelism', label: 'Evangelism', sub: true }, { id: 'cj-stories', label: 'Customer Stories', sub2: true }] },
    { type: 'group', id: 'ng', icon: '◈', label: 'Narrative Guide', items: [{ id: 'ng-apps', label: 'Narrative Applications', sub: true }] },
    { type: 'group', id: 'app', icon: '◇', label: 'Appendix', items: [{ id: 'app-research', label: 'Research Insights', sub: true }, { id: 'app-competitive', label: 'Competitive Analysis', sub: true }, { id: 'app-docs', label: 'Relevant Documents', sub: true }] },
];

function pageGroup(pageId) {
    for (const g of SG_NAV) { if (g.type === 'group' && g.items.find(i => i.id === pageId)) return g.id; } return null;
}

// ─── StoryGuide Wrappers ──────────────────────────────────────────────────────
function SgHead({ label, title }) { return <div className="mb-5"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary mb-1">{label}</div><h1 className="text-[26px] font-extrabold text-contrast leading-[1.15]">{title}</h1></div>; }
function SgBody({ children, className='' }) { return <p className={`text-[14px] leading-[1.7] text-ink-soft mb-4 ${className}`}>{children}</p>; }
function SgCallout({ children }) { return <div className="border-l-4 border-primary bg-primary-bg-subtle p-4 pr-5 rounded-r-[10px] italic text-[17px] leading-[1.6] text-contrast my-4">{children}</div>; }
function SgCard({ label, children, className='' }) { return <div className={`bg-base border border-light-gray rounded-xl p-5 mb-3.5 shadow-sm ${className}`}>{label && <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint mb-2.5">{label}</div>}{children}</div>; }
function SgSectionH({ children }) { return <h3 className="text-base font-bold text-black mt-6 mb-3">{children}</h3>; }
function SgInfoBanner({ arcs }) { return <div className="bg-super-light-gray border border-light-gray rounded-lg px-3.5 py-2 text-xs text-ink-soft mb-4 flex flex-wrap gap-1.5 items-center"><strong className="text-contrast">StoryKernel Arc:</strong>{arcs.map(a => <span key={a} className="inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-primary-bg-subtle text-secondary">{a}</span>)}</div>; }
function SgMsgPoint({ text, personas }) { return <div className="bg-super-light-gray border border-light-gray rounded-lg p-3 mb-2"><div className="text-[13px] text-ink-soft leading-[1.6] mb-1.5">{text}</div>{personas?.map(p => <span key={p} className="inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-light-gray text-ink-soft mr-1">{p}</span>)}</div>; }
function SgObjection({ q, a }) { return <div className="bg-base border border-light-gray rounded-[10px] p-3.5 mb-2.5"><div className="text-[13px] font-semibold text-contrast mb-1.5 before:content-['\201C'] before:mr-0.5 before:text-primary">{q}</div><div className="text-[13px] text-ink-soft leading-[1.6]">{a}</div></div>; }

// ─── Main Component ───────────────────────────────────────────────────────────
function StoryGuide({ readOnly, search = '', onSearchChange }) {
    const [page, setPage] = useSGState('ai');
    const [openGroups, setOpenGroups] = useSGState({ sk: false, mh: false, cj: false, ng: false, app: false });
    const [navOpen, setNavOpen] = useSGState(false);
    const mainRef = useSGRef(null);
    const EFC = window.WODEN.EFC;

    function goPage(id) { setPage(id); const g = pageGroup(id); if (g) setOpenGroups(prev => ({ ...prev, [g]: true })); if (mainRef.current) mainRef.current.scrollTop = 0; setNavOpen(false); }
    function toggleGroup(gid) { setOpenGroups(prev => ({ ...prev, [gid]: !prev[gid] })); }
    useSGEffect(() => { const g = pageGroup(page); if (g) setOpenGroups(prev => ({ ...prev, [g]: true })); }, []);
    useSGEffect(() => { const h = (e) => { if (e.key === 'Escape') setNavOpen(false); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

    const searchLower = search.trim().toLowerCase();
    const matchesSearch = (label) => !searchLower || label.toLowerCase().includes(searchLower);

    return (
        <div className="flex h-full min-h-0 bg-super-light-gray relative">
            {navOpen && <div className="md:hidden fixed inset-0 bg-black/45 z-[140]" onClick={() => setNavOpen(false)} />}
            <aside className={`bg-base border-r border-light-gray flex flex-col overflow-hidden md:static md:translate-x-0 md:w-[240px] md:shrink-0 md:h-full fixed top-0 bottom-0 left-0 w-[280px] z-[150] transition-transform duration-200 ${navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="px-4 pt-4 pb-3 border-b border-light-gray shrink-0 relative">
                    <div className="text-[12px] font-bold text-contrast truncate mb-1 pr-8">{EFC.client}</div>
                    <button onClick={() => setNavOpen(false)} className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-ink-soft hover:text-contrast" aria-label="Close sections">✕</button>
                </div>
                <nav className="flex-1 overflow-y-auto py-1.5">
                    {SG_NAV.map(entry => {
                        if (entry.type === 'item') {
                            if (!matchesSearch(entry.label)) return null;
                            return (
                                <button key={entry.id} onClick={() => goPage(entry.id)}
                                    className={`w-full text-left flex items-center gap-2 px-3.5 py-2 text-[13px] font-sans truncate transition-colors
                                        ${page === entry.id ? 'text-primary font-semibold bg-primary-bg-subtle' : 'text-ink-soft hover:bg-super-light-gray hover:text-contrast'}`}>
                                    <span className={`shrink-0 w-4 text-center text-[11px] ${page === entry.id ? 'opacity-100' : 'opacity-40'}`}>{entry.icon}</span>
                                    {entry.label}
                                </button>
                            );
                        }
                        const visibleItems = entry.items.filter(i => matchesSearch(i.label) || matchesSearch(entry.label));
                        if (searchLower && visibleItems.length === 0) return null;
                        const isOpen = searchLower ? true : openGroups[entry.id];
                        const isActiveSection = entry.items.some(i => i.id === page);
                        return (
                            <div key={entry.id}>
                                <button onClick={() => toggleGroup(entry.id)}
                                    className={`flex items-center gap-2 w-full text-left px-3.5 py-2 text-[13px] font-semibold font-sans transition-colors hover:bg-super-light-gray
                                        ${isActiveSection ? 'text-primary' : 'text-contrast'}`}>
                                    <span className="shrink-0 w-4 text-center text-[11px] opacity-40">{entry.icon}</span>
                                    {entry.label}
                                    <span className="ml-auto text-[10px] text-ink-faint shrink-0">{isOpen ? '▾' : '▸'}</span>
                                </button>
                                {isOpen && entry.items.map(item => {
                                    if (!matchesSearch(item.label) && !matchesSearch(entry.label)) return null;
                                    return (
                                        <button key={item.id} onClick={() => goPage(item.id)}
                                            className={`w-full text-left flex items-start gap-2 py-1.5 pr-2 text-[13px] font-sans transition-colors
                                                ${item.sub2 ? 'pl-10 text-[11px] text-ink-faint' : 'pl-7'}
                                                ${page === item.id ? 'text-primary font-semibold bg-primary-bg-subtle' : 'text-ink-soft hover:bg-super-light-gray hover:text-contrast'}`}>
                                            {item.sub2 ? <span className="text-ink-faint mr-0.5">↳</span> : null}
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
                <div className="px-3.5 py-2.5 border-t border-light-gray text-[10px] text-ink-faint shrink-0 leading-[1.5]">
                    © 2025 Woden, Ltd. &amp; {EFC.client}
                </div>
            </aside>
            <main className={`flex-1 min-w-0 flex flex-col ${page === 'ai' ? 'overflow-hidden' : 'overflow-y-auto'}`} ref={mainRef}>
                <div className="md:hidden sticky top-0 z-30 bg-base border-b border-light-gray flex items-center gap-3 px-4 py-2.5 shrink-0">
                    <button onClick={() => setNavOpen(true)} className="w-9 h-9 flex items-center justify-center -ml-2 text-contrast hover:bg-super-light-gray rounded-lg" aria-label="Open sections">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                    </button>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-contrast">Sections</div>
                </div>
                {page === 'ai' ? (
                    <div className="flex-1 min-h-0 px-4 py-5 md:px-8 md:py-6 flex flex-col">
                        <SGPage id={page} goPage={goPage} readOnly={readOnly} />
                    </div>
                ) : (
                    <div className="max-w-[1240px] mx-auto px-4 py-5 md:px-8 md:py-8 w-full">
                        <SGPage id={page} goPage={goPage} readOnly={readOnly} />
                    </div>
                )}
            </main>
        </div>
    );
}

function SGPage({ id, goPage, readOnly }) {
    switch (id) {
        case 'ai':           return <PageAI />;
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

// ─── Pages ────────────────────────────────────────────────────────────────────

function PageAI() {
    const [messages, setMessages] = useSGState(() => { try { return JSON.parse(localStorage.getItem('wdn-efc-chat') || '[]'); } catch { return []; } });
    const [input, setInput] = useSGState('');
    const [typing, setTyping] = useSGState(false);
    const bodyRef = useSGRef(null);
    const inputRef = useSGRef(null);

    useSGEffect(() => {
        localStorage.setItem('wdn-efc-chat', JSON.stringify(messages));
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, typing]);

    function send(text) {
        const q = (text || input).trim(); if (!q) return;
        setMessages(m => [...m, { id: Date.now(), role: 'user', content: q }]);
        setInput(''); setTyping(true);
        setTimeout(() => {
            setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: window.WODEN.mockEFCChatReply(q) }]);
            setTyping(false);
        }, 600 + Math.random() * 600);
    }

    const suggestions = window.WODEN.EFC_CHAT_SUGGESTIONS;

    return (
        <div className="flex flex-col h-full" style={{minHeight: 'calc(100vh - 120px)'}}>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-light-gray shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-contrast flex items-center justify-center text-[16px] shrink-0">
                        <span style={{color: '#f5c842'}}>⚡</span>
                    </div>
                    <div>
                        <div className="font-bold text-[15px] text-contrast leading-tight">StoryEngine</div>
                        <div className="text-[11px] text-ink-faint mt-0.5">AI Assistant · EFC International</div>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button onClick={() => { setMessages([]); localStorage.removeItem('wdn-efc-chat'); }}
                        className="text-[16px] text-primary hover:text-contrast transition-colors px-3 py-1.5 rounded-lg hover:bg-super-light-gray border border-transparent hover:border-light-gray font-sans">
                        Clear chat
                    </button>
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto flex flex-col" ref={bodyRef} style={{minHeight: 0}}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-contrast flex items-center justify-center text-[26px] mb-5 shadow-sm">
                            <span style={{color: '#f5c842'}}>⚡</span>
                        </div>
                        <div className="text-[18px] font-extrabold text-contrast mb-2">How can I help you?</div>
                        <div className="text-[13px] text-ink-soft max-w-[360px] leading-[1.65] mb-8">
                            I'm StoryEngine — your AI guide through EFC's strategic narrative. Ask me anything about your brand story, messaging, or customer journey.
                        </div>
                        <div className="w-full max-w-[520px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestions.map(s => (
                                <button key={s} onClick={() => send(s)}
                                    className="text-left px-4 py-3 border border-light-gray rounded-xl bg-base font-sans text-[12px] text-ink-soft hover:border-primary hover:text-contrast hover:shadow-sm transition-all leading-[1.5]">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-2 pb-4 max-w-[720px] w-full mx-auto px-1">
                        {messages.map(m => (
                            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {m.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-lg bg-contrast flex items-center justify-center text-[12px] shrink-0 mt-0.5">
                                        <span style={{color: '#f5c842'}}>⚡</span>
                                    </div>
                                )}
                                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-[13px] leading-[1.65] whitespace-pre-wrap
                                    ${m.role === 'user'
                                        ? 'bg-contrast text-base rounded-tr-sm'
                                        : 'bg-super-light-gray text-contrast rounded-tl-sm border border-light-gray'}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="flex gap-3 flex-row">
                                <div className="w-7 h-7 rounded-lg bg-contrast flex items-center justify-center text-[12px] shrink-0 mt-0.5">
                                    <span style={{color: '#f5c842'}}>⚡</span>
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-super-light-gray border border-light-gray inline-flex gap-1 items-center">
                                    <span className="w-[6px] h-[6px] rounded-full bg-ink-faint animate-[bounce-dots_1s_infinite]"/>
                                    <span className="w-[6px] h-[6px] rounded-full bg-ink-faint animate-[bounce-dots_1s_infinite_0.15s]"/>
                                    <span className="w-[6px] h-[6px] rounded-full bg-ink-faint animate-[bounce-dots_1s_infinite_0.3s]"/>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="pt-4 mt-2 border-t border-light-gray shrink-0">
                <div className="max-w-[720px] mx-auto">
                    <div className="flex gap-2 items-end bg-base border border-light-gray rounded-2xl px-4 py-3 focus-within:border-contrast transition-colors shadow-sm">
                        <textarea rows={1} value={input} ref={inputRef}
                            placeholder="Ask anything about your brand story..."
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            className="flex-1 resize-none min-h-[22px] max-h-[120px] text-[13px] font-sans bg-transparent outline-none text-contrast placeholder:text-ink-faint" />
                        <button onClick={() => send()}
                            disabled={!input.trim()}
                            className="w-8 h-8 rounded-xl bg-contrast border-none text-base cursor-pointer text-[13px] shrink-0 flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-default">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white" style={{transform:'rotate(90deg)'}}>
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                            </svg>
                        </button>
                    </div>
                    <div className="text-center text-[10px] text-ink-faint mt-2">
                        Responses are simulated · StoryEngine AI · EFC International
                    </div>
                </div>
            </div>
        </div>
    );
}

function PageHome({ goPage }) {
    const [messages, setMessages] = useSGState(() => { try { return JSON.parse(localStorage.getItem('wdn-efc-chat') || '[]'); } catch { return []; } });
    const [input, setInput] = useSGState('');
    const [typing, setTyping] = useSGState(false);
    const bodyRef = useSGRef(null);

    useSGEffect(() => { localStorage.setItem('wdn-efc-chat', JSON.stringify(messages)); if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, typing]);

    function send(text) {
        const q = (text || input).trim(); if (!q) return;
        setMessages(m => [...m, { id: Date.now(), role: 'user', content: q }]); setInput(''); setTyping(true);
        setTimeout(() => { setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: window.WODEN.mockEFCChatReply(q) }]); setTyping(false); }, 600 + Math.random() * 600);
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Hero */}
            <div className="bg-contrast rounded-2xl px-5 py-6 sm:px-8 sm:py-7">
                <div className="text-[10px] uppercase tracking-[0.14em] text-primary mb-2 font-bold">EFC International</div>
                <div className="text-[26px] font-extrabold text-base mb-2.5 leading-[1.15]">Digital StoryGuide</div>
                <div className="text-[13px] text-white/60 leading-[1.75] max-w-[480px]">
                    Your story is your strategy. This is where it lives. Every section is built on EFC's StoryKernel — a story about your customer, the world they're navigating, and why EFC is uniquely positioned to help them succeed.
                </div>
            </div>

            {/* Nav cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                    ['sk-full',      '◈', 'The StoryKernel',      "EFC's complete nine-part strategic narrative. Start here if you're new to the brand."],
                    ['mh-intro',     '◇', 'Messaging Hierarchy',  'Mission, vision, values, positioning, brand promise, and differentiators.'],
                    ['cj-intro',     '◉', 'Customer Journey',     'Messaging mapped to every stage of the buying experience.'],
                    ['app-research', '◇', 'Appendix',             'Research insights, competitive analysis, and relevant documents.'],
                ].map(([id, icon, title, desc]) => (
                    <button key={id} onClick={() => goPage(id)}
                        className="bg-base border border-light-gray rounded-xl p-5 text-left transition-all hover:border-primary hover:shadow-sm w-full font-sans">
                        <div className="text-[20px] text-primary mb-2.5">{icon}</div>
                        <div className="font-bold text-[14px] text-contrast mb-1">{title}</div>
                        <div className="text-[12px] text-ink-faint leading-[1.6]">{desc}</div>
                    </button>
                ))}
            </div>

            {/* StoryEngine chat */}
            <div className="bg-base border border-light-gray rounded-xl flex flex-col overflow-hidden h-[70vh] sm:h-[500px]">
                <div className="px-5 py-3.5 border-b border-light-gray flex items-center gap-3 bg-contrast rounded-t-xl shrink-0">
                    <div className="min-w-0">
                        <div className="font-bold text-[14px] text-base flex items-center gap-1.5 truncate">
                            StoryEngine
                        </div>
                        <div className="text-[10px] text-white uppercase tracking-[0.08em] mt-0.5 truncate">
                            EFC International · AI Assistant (Simulated)
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <button onClick={() => { setMessages([]); localStorage.removeItem('wdn-efc-chat'); }}
                            className="ml-auto shrink-0 bg-transparent border-none text-primary hover:text-white/70 text-xs cursor-pointer transition-colors">
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5" ref={bodyRef}>
                    {messages.length === 0 && (
                        <div>
                            <div className="max-w-[85%] px-4 py-3 rounded-[18px] rounded-bl-sm text-[13px] leading-[1.55] bg-super-light-gray text-contrast mb-3">
                                Hi! I'm StoryEngine, your AI assistant for navigating EFC's strategic narrative. I can help you explore your StoryGuide, generate brand-aligned content, or answer questions about your messaging. How can I help you today?
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {window.WODEN.EFC_CHAT_SUGGESTIONS.map(s => (
                                    <button key={s} onClick={() => send(s)}
                                        className="text-left px-3.5 py-2 border border-light-gray rounded-[18px] bg-base font-sans text-[12px] cursor-pointer transition-colors text-ink-soft hover:bg-contrast hover:text-white hover:border-contrast">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id}
                            className={`max-w-[85%] px-4 py-3 rounded-[18px] text-[13px] leading-[1.55] whitespace-pre-wrap
                                ${m.role === 'user'
                                    ? 'self-end bg-primary text-white rounded-br-sm'
                                    : 'self-start bg-super-light-gray text-contrast rounded-bl-sm'}`}>
                            {m.content}
                        </div>
                    ))}
                    {typing && (
                        <div className="max-w-[85%] px-4 py-3 rounded-[18px] rounded-bl-sm self-start bg-super-light-gray text-contrast inline-flex gap-1">
                            <span className="w-[7px] h-[7px] rounded-full bg-gray animate-[bounce-dots_1s_infinite]"/>
                            <span className="w-[7px] h-[7px] rounded-full bg-gray animate-[bounce-dots_1s_infinite_0.15s]"/>
                            <span className="w-[7px] h-[7px] rounded-full bg-gray animate-[bounce-dots_1s_infinite_0.3s]"/>
                        </div>
                    )}
                </div>
                <div className="px-4 py-3 border-t border-light-gray flex gap-2 items-end bg-base shrink-0">
                    <textarea rows={1} value={input}
                        placeholder="Ask anything about your brand story..."
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        className="flex-1 resize-none min-h-[38px] max-h-[80px] px-3.5 py-2 border border-light-gray rounded-[18px] text-[13px] font-sans bg-super-light-gray outline-none focus:border-contrast focus:bg-base" />
                    <button onClick={() => send()}
                        className="w-[38px] h-[38px] rounded-full bg-primary border-none text-base cursor-pointer text-[14px] shrink-0 flex items-center justify-center transition-colors hover:bg-primary-hover">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}

function PageSkIntro() {
    const arcs = window.WODEN.EFC.storykernel.arcs;
    return (
        <div>
            <SgHead label="Strategic Narrative Foundation" title="Understanding the StoryKernel™" />
            <SgBody>EFC's StoryKernel is a strategic narrative designed to articulate what makes EFC essential. It follows a nine-part storytelling arc — positioning the customer as the hero and EFC as the mentor. Each passage maps directly to a phase of the customer journey.</SgBody>
            <SgCallout>"The strength behind every connector is the people who understand its power."</SgCallout>
            <SgSectionH>The Nine-Part Arc</SgSectionH>
            {arcs.map(a => (
                <div key={a.n} className="border border-light-gray rounded-[10px] p-3.5 mb-2.5 bg-base">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <div className="w-[22px] h-[22px] rounded-full bg-contrast text-base text-[11px] font-bold flex items-center justify-center shrink-0">{a.n}</div>
                        <span className="font-bold text-[14px] text-contrast">{a.title}</span>
                        <span className="inline-block px-2 py-0.5 rounded-[5px] text-[10px] font-medium bg-primary-bg-subtle text-secondary ml-1">{a.stage}</span>
                    </div>
                    <div className="text-[13px] text-ink-soft leading-[1.6]">{a.why}</div>
                </div>
            ))}
        </div>
    );
}

function PageSkFull() {
    const arcs = window.WODEN.EFC.storykernel.arcs;
    const colors = ['bg-[#fff5f5] border-[#ffd5d5]', 'bg-[#fff8f0] border-[#ffdbb5]', 'bg-[#f0f5ff] border-[#c0d0f0]', 'bg-[#f5f5f5] border-[#e0e0e0]', 'bg-primary-bg-subtle border-primary', 'bg-[#f8f0ff] border-[#d5b5f0]', 'bg-[#fff0f8] border-[#f0b5d5]', 'bg-[#f0fbfb] border-[#b5ddd5]', 'bg-[#f0f0ff] border-[#b5b5f0]'];
    return (
        <div>
            <SgHead label="EFC International" title="EFC's StoryKernel™" />
            <SgCallout>"The strength behind every connector is the people who understand its power."</SgCallout>
            <SgSectionH>Full Narrative</SgSectionH>
            <SgBody className="italic text-[#aaa]">Hover each passage to reveal which arc section it corresponds to.</SgBody>
            {arcs.map((a, i) => (
                <div key={a.n} className={`rounded-lg border p-3.5 mb-2.5 text-[14px] text-contrast leading-[1.7] ${colors[i]}`} title={a.title}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-faint mb-1.5">{a.title}</div>
                    {a.passage}
                </div>
            ))}
        </div>
    );
}

function PageMhSimple({ label, title, content }) { return <div><SgHead label={label} title={title} />{content}</div>; }

function PageMhIntro({ goPage }) {
    const m = window.WODEN.EFC.messaging;
    return (
        <div>
            <SgHead label="Strategic Building Blocks" title="Messaging Hierarchy" />
            <SgBody>These elements translate EFC's StoryKernel into specific language and commitments used every day — internally to stay aligned and externally to move buyers.</SgBody>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#aaa] mb-2.5">Internal Elements</div>
            <SgCard label="Mission"><SgCallout>"{m.mission}"</SgCallout><SgBody className="!mb-0">Derived from the Call to Adventure, the mission gives EFC's team a clear directive: everything they do should be in service of transforming how customers think about and use connectors.</SgBody></SgCard>
            <SgCard label="Vision"><SgCallout>"{m.vision}"</SgCallout></SgCard>
            <SgCard label="Core Values">{m.values.map(v => <div key={v.name} className="flex gap-2.5 mb-2.5 items-start"><div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" /><div className="text-[13px] text-ink-soft leading-[1.6]"><strong className="text-contrast">{v.name}:</strong> {v.body}</div></div>)}</SgCard>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#aaa] mt-5 mb-2.5">External Elements</div>
            <SgCard label="Positioning Statement"><SgCallout>"{m.positioning}"</SgCallout></SgCard>
            <SgCard label="Brand Promise"><SgCallout>"{m.brandPromise}"</SgCallout></SgCard>
            <SgCard label="Core Differentiator"><SgCallout>"{m.differentiator.title}"</SgCallout><SgBody className="!mb-0">{m.differentiator.body}</SgBody></SgCard>
            <SgCard label="Verbal Identity"><SgBody>These are the terms EFC should own in customers' minds. Use them consistently across all channels.</SgBody>{m.verbalIdentity.map(v => <span key={v.phrase} className="inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-super-light-gray text-ink-soft border border-light-gray mr-1.5 mb-1.5">{v.phrase}</span>)}<div className="mt-3">{m.verbalIdentity.map(v => <div key={v.phrase} className="text-[13px] text-[#555] mb-2"><strong className="text-contrast">{v.phrase}</strong> — {v.note}</div>)}</div></SgCard>
        </div>
    );
}

function MhVerbalIdentity() {
    return <div><SgBody>These are the terms EFC should own in customers' minds. Use them consistently across all channels and touchpoints.</SgBody>{window.WODEN.EFC.messaging.verbalIdentity.map(v => <SgCard key={v.phrase} label="Key Phrase"><div className="border-l-4 border-primary bg-primary-bg-subtle p-4 pr-5 rounded-r-[10px] text-[20px] font-bold text-contrast my-4">"{v.phrase}"</div><SgBody className="!mb-0">{v.note}</SgBody></SgCard>)}</div>;
}
function MhValues() { return <div><SgBody>EFC's four core values define how the team shows up — internally and in every customer interaction.</SgBody>{window.WODEN.EFC.messaging.values.map((v, i) => <SgCard key={v.name}><div className="flex items-center gap-2.5 mb-2"><div className="w-[22px] h-[22px] rounded-full bg-contrast text-base text-[11px] font-bold flex items-center justify-center shrink-0">{i+1}</div><div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint m-0">{v.name}</div></div><SgBody className="!mb-0">{v.body}</SgBody></SgCard>)}</div>; }
function MhMission() { return <div><SgCallout>"{window.WODEN.EFC.messaging.mission}"</SgCallout><SgCard><SgBody className="!mb-0">Derived from the Call to Adventure, the mission gives EFC's team a clear directive: everything they do should be in service of transforming how customers think about and use connectors.</SgBody></SgCard></div>; }
function MhPositioning() { return <div><SgCallout>"{window.WODEN.EFC.messaging.positioning}"</SgCallout><SgCard><SgBody className="!mb-0">In a category dominated by price and part numbers, EFC focuses on connection — not just how parts fit together, but how decisions connect across engineering, purchasing, and production.</SgBody></SgCard></div>; }
function MhDiff() { return <div><SgCallout>"{window.WODEN.EFC.messaging.differentiator.title}"</SgCallout><SgCard><SgBody className="!mb-0">{window.WODEN.EFC.messaging.differentiator.body}</SgBody></SgCard></div>; }
function MhPromise() { return <div><SgCallout>"{window.WODEN.EFC.messaging.brandPromise}"</SgCallout><SgCard><SgBody className="!mb-0">"Before you know you need them" speaks to EFC's ability to engage early, anticipate downstream requirements, and account for operational realities often overlooked when fasteners are treated as an afterthought.</SgBody></SgCard></div>; }
function MhVision() { return <div><SgCallout>"{window.WODEN.EFC.messaging.vision}"</SgCallout><SgCard><SgBody className="!mb-0">This vision describes a future where customers no longer manage unnecessary complexity caused by overlooked decisions around small parts — connectors become a stabilizing force rather than a hidden risk.</SgBody></SgCard></div>; }

function PageIcpFull() {
    const icp = window.WODEN.EFC.icp;
    return (
        <div>
            <SgBody>EFC's ICP takes the Hero of the StoryKernel off the page and into the real world — defining not just who this person is, but what their company looks like, what their role demands daily, and how to identify them in the market.</SgBody>
            <SgCallout>"Design-responsible contributors know intuitively that projects are more than their individual components."</SgCallout>
            <SgCard label="Who This Person Is">{icp.who.split('\n\n').map((p, i) => <SgBody key={i} className="!mb-2.5">{p}</SgBody>)}</SgCard>
            <SgCard label="Their Company"><div className="overflow-x-auto -mx-2"><table className="w-full min-w-[460px] border-collapse text-[13px]"><tbody>{icp.company.map(r => <tr key={r.label}><td className="py-2 px-2.5 border-b border-light-gray font-semibold text-contrast w-[180px] align-top">{r.label}</td><td className="py-2 px-2.5 border-b border-light-gray text-ink-soft align-top">{r.value}</td></tr>)}</tbody></table></div></SgCard>
            <SgCard label="How to Find Them"><div className="overflow-x-auto -mx-2"><table className="w-full min-w-[460px] border-collapse text-[13px]"><tbody>{icp.howToFind.map(r => <tr key={r.channel}><td className="py-2 px-2.5 border-b border-light-gray font-semibold text-contrast w-[180px] align-top">{r.channel}</td><td className="py-2 px-2.5 border-b border-light-gray text-ink-soft align-top">{r.detail}</td></tr>)}</tbody></table></div></SgCard>
            <SgCard label="Key Phrases from the StoryKernel">{icp.keyPhrases.map(p => <div key={p.phrase} className="border-b border-[#f0f0f0] py-2.5"><div className="font-semibold text-[13px] italic text-[#333] mb-0.5">"{p.phrase}"</div><div className="text-[12px] text-[#888]">{p.note}</div></div>)}</SgCard>
        </div>
    );
}

function PageCjIntro({ goPage }) {
    return (
        <div>
            <SgHead label="Customer Journey Overview" title="Understanding the Customer Journey" />
            <SgBody>The customer journey maps EFC's story to five stages of the buying experience — from first awareness of a problem through becoming an active advocate. Each stage has a distinct strategic goal, a set of targeted messaging points, and calls to action.</SgBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                {[
                    ['cj-awareness',  'Awareness',          "Before prospects know EFC's name, they're living inside a problem. Awareness content meets them there."],
                    ['cj-consider',   'Consideration',       "Once a buyer decides something needs to change, EFC's job is to be understood, not to sell."],
                    ['cj-evaluation', 'Evaluation',          'Where trust becomes the deciding factor. Every buying decision is ultimately emotional.'],
                    ['cj-cx',         'Customer Experience', 'Great customer experience is about keeping the promises made through the first three phases.'],
                    ['cj-evangelism', 'Evangelism',          'When EFC keeps its promises, customers become champions.'],
                ].map(([id, title, desc]) => (
                    <button key={id} className="bg-base border border-light-gray rounded-xl p-4 text-left transition-all hover:border-primary hover:shadow-sm w-full font-sans" onClick={() => goPage(id)}>
                        <div className="font-bold text-[14px] text-contrast mb-1">{title}</div>
                        <div className="text-[12px] text-ink-faint leading-[1.6]">{desc}</div>
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
            <SgBody>Before prospects know EFC's name, they're living inside a problem — feeling the friction of inefficiency or sensing opportunity that keeps slipping away. Awareness content meets them there and gives their frustration a name. This is not the time to outline features and benefits — it's time to speak directly to the person experiencing the pain.</SgBody>
            <SgCard label="Strategic Goal">{aw.goal.split('\n\n').map((p,i) => <SgBody key={i} className="!mb-2">{p}</SgBody>)}</SgCard>
            <SgSectionH>Elevator Pitch</SgSectionH>
            <div className="bg-contrast rounded-xl p-5 text-white/75 text-[13px] leading-[1.8] mb-5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/40 mb-3 font-bold">Script</div>
                {aw.elevatorPitch.map((line, i) => <p key={i} className={i === aw.elevatorPitch.length - 1 ? 'text-[#ffd966] italic m-0' : 'mb-3'}>{line}</p>)}
            </div>
            <SgSectionH>Messaging Points</SgSectionH>
            {aw.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
            <SgSectionH>Objections &amp; Responses</SgSectionH>
            {aw.objections.map((o, i) => <SgObjection key={i} q={o.q} a={o.a} />)}
            <SgSectionH>Calls to Action</SgSectionH>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {aw.ctas.map((c, i) => <div key={i} className="bg-base border border-light-gray rounded-[10px] p-3"><div className="text-[12px] font-bold text-contrast mb-1">{c.persona}</div><div className="text-[12px] text-ink-soft leading-[1.5]">{c.text}</div></div>)}
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
            <SgBody>Once a buyer decides something needs to change, the story shifts. They're no longer just feeling a problem — they're actively looking for a path forward. At this stage, EFC's job isn't to sell. It's to be understood.</SgBody>
            <SgCard label="Strategic Goal"><SgBody className="!mb-0">{co.goal}</SgBody></SgCard>
            <SgSectionH>Messaging Points by Industry</SgSectionH>
            {co.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
            <SgSectionH>Objections &amp; Responses</SgSectionH>
            {co.objections.map((o, i) => <SgObjection key={i} q={o.q} a={o.a} />)}
            <SgSectionH>Calls to Action</SgSectionH>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {co.ctas.map((c, i) => <div key={i} className="bg-base border border-light-gray rounded-[10px] p-3"><div className="text-[12px] font-bold text-contrast mb-1">{c.persona}</div><div className="text-[12px] text-ink-soft leading-[1.5]">{c.text}</div></div>)}
            </div>
        </div>
    );
}

function PagePersonas() {
    const personas = window.WODEN.EFC.personas;
    return (
        <div>
            <SgHead label="Consideration · Sub-Section" title="Personas" />
            <SgBody>A buying decision rarely happens in isolation. Beyond the Hero (the ICP), there are other personas whose perspectives shape the path to a sale. Each needs to hear EFC's story told through their own lens.</SgBody>
            {personas.map(p => (
                <div key={p.name} className="bg-base border border-light-gray rounded-xl p-5 mb-3.5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-[46px] h-[46px] rounded-full bg-contrast text-base text-[18px] font-bold flex items-center justify-center shrink-0">{p.initial}</div>
                        <div className="min-w-0"><div className="font-bold text-[15px] text-contrast truncate">{p.name}</div><div className="text-[12px] text-ink-faint truncate">{p.title} · {p.industry}</div></div>
                    </div>
                    <div className="text-[13px] text-ink-soft mb-1.5 leading-[1.5]"><strong className="text-contrast">Challenges:</strong> {p.challenges}</div>
                    <div className="text-[13px] text-ink-soft mb-1.5 leading-[1.5]"><strong className="text-contrast">Triggers:</strong> {p.triggers}</div>
                    <div className="text-[13px] text-ink-soft mb-3.5 leading-[1.5]"><strong className="text-contrast">Goals:</strong> {p.goals}</div>
                    <div className="border-t border-[#f0f0f0] pt-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#aaa] mb-2">Targeted Messaging</div>
                        {p.msgs.map((msg, i) => <div key={i} className="text-[13px] text-[#555] mb-1.5 leading-[1.6]">• {msg}</div>)}
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
            <SgBody>The Evaluation stage is where trust becomes the deciding factor. The buyer has acknowledged the problem, engaged with EFC, and is now making a decision — not just about which solution, but which partner to trust.</SgBody>
            <SgCard label="Strategic Goal"><SgBody className="!mb-0">{ev.goal}</SgBody></SgCard>
            <SgSectionH>Messaging Points by Industry</SgSectionH>
            {ev.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
            <SgSectionH>Objections &amp; Responses</SgSectionH>
            {ev.objections.map((o, i) => <SgObjection key={i} q={o.q} a={o.a} />)}
            <SgSectionH>Why EFC Wins: Total Operational Perspective</SgSectionH>
            {ev.scenarios.map((s, i) => <SgCard key={i} label={s.industry}><SgBody className="!mb-0">{s.body}</SgBody></SgCard>)}
        </div>
    );
}

function PageCredibility() {
    const ev = window.WODEN.EFC.evaluation;
    return (
        <div>
            <SgBody>A compelling credibility story does more than list accomplishments — it reveals the depth of EFC's operational understanding. At the Evaluation stage, buyers are deciding whether to trust.</SgBody>
            <SgCallout>"We've spent decades working backward from OEM requirements — understanding exactly what they're looking for, so we can flag a wrong call before it becomes costly rework."</SgCallout>
            <SgSectionH>Industry Scenarios</SgSectionH>
            {ev.scenarios.map((s, i) => <SgCard key={i} label={s.industry}><SgBody className="!mb-0">{s.body}</SgBody></SgCard>)}
        </div>
    );
}

function PageOriginStory() {
    const os = window.WODEN.EFC.originStory;
    return (
        <div>
            <SgHead label="Evaluation · Sub-Section" title="Origin Story" />
            <SgBody>A compelling origin story does more than explain how EFC started — it reveals why EFC exists. At the Evaluation stage, buyers are deciding whether to trust. The origin story answers the question: "Do these people genuinely believe what they're saying?"</SgBody>
            <SgCallout>"Opportunity was missed, not because teams lacked effort, but because they lacked total operational perspective to guide selection."</SgCallout>
            <SgCard className="leading-[1.8] text-[#444] text-[14px]">
                {os.full.map((p, i) => <p key={i} className={i === os.full.length - 1 ? 'm-0 italic font-semibold text-[#1a3a2a]' : 'mb-3.5'}>{p}</p>)}
            </SgCard>
            <SgCard label="Short-Form Origin Story (75–100 words)" className="mt-3.5">
                <p className="text-[13px] text-[#555] leading-[1.7] m-0">{os.short}</p>
            </SgCard>
        </div>
    );
}

function PageCjCx() {
    const cx = window.WODEN.EFC.cx;
    return (
        <div>
            <SgHead label="Customer Journey · Stage 4" title="Customer Experience" />
            <SgInfoBanner arcs={['The Talisman', 'Obstacles to Overcome']} />
            <SgBody>{cx.goal}</SgBody>
            <SgSectionH>Messaging — Design-Responsible Contributors</SgSectionH>
            {cx.msgDesign.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
            <SgSectionH>Messaging — Purchasing</SgSectionH>
            {cx.msgPurchasing.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
            <SgSectionH>Calls to Action</SgSectionH>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {cx.ctas.map((c, i) => <div key={i} className="bg-base border border-light-gray rounded-[10px] p-3"><div className="text-[12px] font-bold text-contrast mb-1">{c.label}</div><div className="text-[12px] text-ink-soft leading-[1.5]">{c.body}</div></div>)}
            </div>
            <SgCard label="Sample Welcome Email — Subject: Getting Connected with EFC" className="mt-3.5 border-primary bg-primary-bg-subtle">
                <div className="text-[13px] text-[#444] leading-[1.8] whitespace-pre-line">{cx.welcomeEmail}</div>
            </SgCard>
        </div>
    );
}

function PageCjEvangelism() {
    const ev = window.WODEN.EFC.evangelism;
    return (
        <div>
            <SgHead label="Customer Journey · Stage 5" title="Evangelism" />
            <SgInfoBanner arcs={['Spoils of Victory', 'Potential Achieved']} />
            <SgBody>When EFC keeps its promises, customers become champions. The Evangelism stage is the culmination of everything the customer journey has been building toward — the moment when the transformation the StoryKernel describes becomes real.</SgBody>
            <SgCard label="Strategic Goal"><SgBody className="!mb-0">{ev.goal}</SgBody></SgCard>
            <SgSectionH>Messaging Points</SgSectionH>
            {ev.msgPoints.map((mp, i) => <SgMsgPoint key={i} text={mp.text} personas={mp.personas} />)}
        </div>
    );
}

function PageCustomerStories() {
    const stories = window.WODEN.EFC.evangelism.customerStories;
    return (
        <div>
            <SgHead label="Evangelism · Sub-Section" title="Customer Stories" />
            <SgBody>Real outcomes from real partnerships. These stories demonstrate how EFC's Total Operational Perspective creates measurable change — transforming satisfied buyers into active advocates.</SgBody>
            {stories.map((s, i) => (
                <div key={i} className="bg-base border border-light-gray rounded-xl p-5 mb-4">
                    <div className="font-bold text-[15px] text-contrast mb-2.5">{s.title}</div>
                    <div className="text-[13px] text-ink-soft leading-[1.75] mb-2.5">{s.body}</div>
                    <span className="inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-primary-bg-subtle text-secondary">Outcome: {s.outcome}</span>
                </div>
            ))}
        </div>
    );
}

function PageResearch() {
    const quotes = window.WODEN.EFC.appendix.quotes;
    return (
        <div>
            <SgHead label="Appendix" title="Research Insights" />
            <SgBody>Every brand story is built on a foundation of real voices and real research. These insights shaped EFC's strategic narrative — the discovery quotes that became anchors for the StoryKernel.</SgBody>
            {quotes.map((q, i) => (
                <div key={i} className="bg-base border border-light-gray rounded-xl p-5 mb-3.5">
                    <div className="text-[15px] italic text-contrast leading-[1.7] mb-2.5">"{q.text}"</div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint mb-1.5">— {q.who}</div>
                    <div className="text-[12px] text-ink-soft leading-[1.6]">{q.context}</div>
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
            <SgBody>The competitive landscape the story was built to navigate. Understanding how competitors position themselves clarifies where EFC's differentiation is most valuable.</SgBody>
            {comps.map((c, i) => (
                <div key={i} className="bg-base border border-light-gray rounded-xl p-5 mb-3.5">
                    <div className="font-bold text-[15px] text-contrast mb-2.5">{c.name}</div>
                    <div className="text-[13px] text-ink-soft leading-[1.75]">{c.body}</div>
                </div>
            ))}
        </div>
    );
}

function PagePlaceholder({ label, title }) {
    return (
        <div>
            <SgHead label={label} title={title} />
            <div className="bg-base border-[1.5px] border-dashed border-light-gray rounded-xl p-10 text-center text-ink-faint">
                <h3 className="text-[16px] text-ink-faint mb-2">Content Coming Soon</h3>
                <p className="text-[13px]">This section will be populated with {title.toLowerCase()} content.</p>
            </div>
        </div>
    );
}

Object.assign(window, { StoryGuide });
