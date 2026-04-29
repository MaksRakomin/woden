const { useState: useStateE, useRef: useRefE, useEffect: useEffectE } = React;

function WYSIWYGEditor({ sectionN, title, content, onChange }) {
  const ref = useRefE(null);
  useEffectE(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }, [content]);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const insertAround = (before, after) => {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const sel = content.slice(start, end) || 'text';
    onChange(content.slice(0, start) + before + sel + after + content.slice(end));
    setTimeout(() => { el.focus(); el.selectionStart = start + before.length; el.selectionEnd = start + before.length + sel.length; }, 0);
  };

  const TBtn = ({ label, title, cls='', action }) => (
      <button className={`inline-flex items-center justify-center bg-base border-[1.5px] border-light-gray rounded-md px-2.5 py-1 cursor-pointer text-[13px] text-contrast transition-colors hover:border-contrast active:bg-paper-warm min-w-[28px] ${cls}`} title={title} onMouseDown={e => { e.preventDefault(); action(); }}>{label}</button>
  );

  return (
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 px-4 py-2.5 border-b-[1.5px] border-light-gray flex-wrap bg-paper-warm">
          <TBtn label="B" cls="font-bold" title="Bold" action={() => insertAround('**', '**')} />
          <TBtn label="I" cls="italic font-semibold" title="Italic" action={() => insertAround('_', '_')} />
          <div className="w-px h-[22px] bg-light-gray mx-1.5 shrink-0" />
          <TBtn label="H2" cls="font-mono text-[11px] tracking-wider" title="Heading 2" action={() => insertAround('\n## ', '\n')} />
          <TBtn label="H3" cls="font-mono text-[11px] tracking-wider" title="Heading 3" action={() => insertAround('\n### ', '\n')} />
          <div className="w-px h-[22px] bg-light-gray mx-1.5 shrink-0" />
          <TBtn label="— List" title="Bullet list" action={() => insertAround('\n- ', '')} />
          <TBtn label="❞" title="Quote" action={() => insertAround('\n> ', '\n')} />
          <div className="flex-1" />
          <span className="text-[11px] font-mono text-ink-faint px-2 py-1">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>
        <textarea ref={ref} className="wysiwyg-textarea" value={content} placeholder={`Write the ${title} section here…`} onChange={e => onChange(e.target.value)} rows={12} />
      </div>
  );
}

const PALETTES = [
  { id: 'espresso', name: 'Espresso',  colors: ['#3B2A1F', '#E8D5B7', '#D4572A', '#F7F1E5'] },
  { id: 'slate',    name: 'Slate',     colors: ['#1C2B3A', '#C8D8E8', '#3A7CA5', '#F4F7FA'] },
  { id: 'forest',   name: 'Forest',    colors: ['#1A3A2A', '#B8D8C8', '#2D7A4F', '#F2F7F4'] },
  { id: 'dusk',     name: 'Dusk',      colors: ['#2D1B4E', '#D4C8F0', '#7C4DBC', '#F7F4FD'] },
  { id: 'clay',     name: 'Clay',      colors: ['#3D2B1A', '#F0DDD0', '#C0622A', '#FDF6F2'] },
  { id: 'minimal',  name: 'Minimal',   colors: ['#131215', '#EAEAEA', '#EA3323', '#FFFFFF'] },
];

function ProjectEditor({ nav, projectId }) {
  const [flowStep, setFlowStep] = useStateE(1);
  const [content, setContent] = useStateE('');
  const [palette, setPalette] = useStateE(PALETTES[0].id);
  const [description, setDescription] = useStateE('');

  const generate = () => {
    window.WODEN.PROJECTS.push({ id: 'p' + Date.now(), clientId: 'c1', name: description.trim() || 'New StoryGuide', status: 'draft', sections: 0, updated: 'just now', team: [], palette: PALETTES.find(p => p.id === palette)?.colors || [] });
    toast('Project created'); nav('/manager/projects');
  };

  return (
      <div className="animate-screen-in">
        <div className="flex mb-2">
          <a className="font-mono text-ink-soft text-[11px] cursor-pointer hover:underline" onClick={() => flowStep === 2 ? setFlowStep(1) : nav('/manager/projects')}>← {flowStep === 2 ? 'BACK' : 'PROJECTS'}</a>
        </div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Meridian Coffee Co.</h1>
            <div className="flex items-center mt-2.5">
              <div className={`flex items-center gap-2 text-[13px] font-medium ${flowStep >= 1 ? 'text-contrast' : 'text-ink-faint'}`}><span className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-bold font-mono transition-all ${flowStep >= 1 ? 'bg-contrast border-contrast text-base' : 'border-ink-faint'}`}>1</span><span>Content</span></div>
              <div className="w-8 h-[1.5px] bg-light-gray mx-2" />
              <div className={`flex items-center gap-2 text-[13px] font-medium ${flowStep >= 2 ? 'text-contrast' : 'text-ink-faint'}`}><span className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-bold font-mono transition-all ${flowStep >= 2 ? 'bg-contrast border-contrast text-base' : 'border-ink-faint'}`}>2</span><span>Brand</span></div>
            </div>
          </div>
          <div className="flex gap-3">
            {flowStep === 1 && <><Button variant="ghost" size="sm" onClick={() => toast('Draft saved')}>Save draft</Button><Button variant="primary" onClick={() => setFlowStep(2)}>Next step →</Button></>}
            {flowStep === 2 && <><Button variant="ghost" onClick={() => setFlowStep(1)}>← Back</Button><Button variant="primary" onClick={generate}>Generate project ✓</Button></>}
          </div>
        </div>

        {flowStep === 1 && <Card pad="p-0" className="overflow-hidden flex flex-col"><WYSIWYGEditor title="StoryGuide" content={content} onChange={setContent} /></Card>}
        {flowStep === 2 && (
            <div className="flex flex-col gap-6 max-w-[720px]">
              <Card pad="p-7">
                <h3 className="text-lg font-bold mb-1">Brand palette</h3>
                <p className="text-ink-soft text-[13px] mb-5">Choose the colour set that best fits this client's identity. You can refine it later.</p>
                <div className="grid grid-cols-3 gap-3 p-1">
                  {PALETTES.map(p => (
                      <div key={p.id} className={`border-2 rounded-xl p-3 cursor-pointer transition-all outline outline-2 outline-offset-1 ${palette === p.id ? 'border-contrast outline-contrast bg-paper-warm' : 'border-light-gray outline-transparent hover:border-ink-faint'}`} onClick={() => setPalette(p.id)}>
                        <div className="flex rounded-md overflow-hidden mb-2.5">{p.colors.map((c, i) => <div key={i} className="flex-1 h-10" style={{background: c}} />)}</div>
                        <div className={`text-xs text-contrast ${palette === p.id ? 'font-bold' : 'font-semibold'}`}>{p.name}</div>
                      </div>
                  ))}
                </div>
              </Card>
              <Card pad="p-7">
                <h3 className="text-lg font-bold mb-1">Project description</h3>
                <p className="text-ink-soft text-[13px] mb-3.5">A short note on what this StoryGuide is for. Used as the project name.</p>
                <textarea className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus" rows={3} placeholder="e.g. Brand voice refresh ahead of Q3 launch…" value={description} onChange={e => setDescription(e.target.value)} />
              </Card>
            </div>
        )}
      </div>
  );
}

function Customize({ nav }) {
  const [theme, setTheme] = useStateE(() => localStorage.getItem('wdn-sg-theme') || 'light');
  const apply = (t) => { setTheme(t); localStorage.setItem('wdn-sg-theme', t); toast('Theme saved'); };
  return (
      <div className="animate-screen-in">
        <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight mb-1.5">Customize</h1>
        <p className="text-ink-soft mb-6">Pick how your StoryGuide looks to your team.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
          <Card pad="p-5" className={`cursor-pointer transition-all ${theme === 'light' ? 'border-primary shadow-[0_0_0_2px_#EA3323]' : 'hover:border-gray'}`} onClick={() => apply('light')}>
            <div className="flex justify-between mb-2.5"><h3 className="text-lg font-bold">Daylight</h3>{theme === 'light' && <Badge variant="accent">Selected</Badge>}</div>
            <div className="aspect-[4/3] rounded-lg p-4 flex flex-col gap-2.5 border border-light-gray bg-white text-contrast">
              <div className="font-sans text-xl">Coffee with conviction.</div>
              <div className="h-px bg-contrast opacity-20" />
              <div className="text-[11px] text-ink-faint font-mono">01 · STRATEGIC NARRATIVE</div>
              <Lines n={3} />
            </div>
            <p className="text-ink-soft text-[13px] mt-2.5">White background, black text, red accents.</p>
          </Card>
          <Card pad="p-5" className={`cursor-pointer transition-all ${theme === 'night' ? 'border-primary shadow-[0_0_0_2px_#EA3323]' : 'hover:border-gray'}`} onClick={() => apply('night')}>
            <div className="flex justify-between mb-2.5"><h3 className="text-lg font-bold">Nightshift</h3>{theme === 'night' && <Badge variant="accent">Selected</Badge>}</div>
            <div className="aspect-[4/3] rounded-lg p-4 flex flex-col gap-2.5 border border-[#2a2a2d] bg-contrast text-base">
              <div className="font-sans text-xl text-white">Coffee with conviction.</div>
              <div className="h-px bg-white opacity-20" />
              <div className="text-[11px] text-[#bbb] font-mono">01 · STRATEGIC NARRATIVE</div>
              <div className="flex flex-col gap-2"><div className="h-2.5 rounded w-[90%] bg-white opacity-40"/><div className="h-2.5 rounded w-[70%] bg-white opacity-40"/><div className="h-2.5 rounded w-[80%] bg-white opacity-40"/></div>
            </div>
            <p className="text-ink-soft text-[13px] mt-2.5">Near-black background, white text, red accents.</p>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><h3 className="text-lg font-bold mb-2.5">Logo</h3><Rect label="Drop logo · SVG/PNG · max 2MB" h={120} className="mb-3" /><label className="flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked /> Use Meridian fallback wordmark</label></Card>
          <Card><h3 className="text-lg font-bold mb-2.5">Live preview</h3><div className={`p-4 rounded-md ${theme === 'night' ? 'bg-[#131215] text-white' : ''}`}><div className="font-mono text-[10px] tracking-[0.12em] opacity-60">02 · STRATEGIC NARRATIVE</div><div className="font-sans text-[22px] mt-1.5 mb-3">Coffee with conviction.</div><Lines n={3} /></div></Card>
        </div>
      </div>
  );
}

function Team({ projectId }) {
  const project = window.WODEN.PROJECTS.find(p => p.id === projectId) || window.WODEN.PROJECTS[0];
  const [emails, setEmails] = useStateE(project ? [...project.team] : []);
  const [inv, setInv] = useStateE('');
  const add = () => { if (!inv.trim()) return; const updated = [...emails, inv.trim()]; if (project) project.team = updated; setEmails(updated); setInv(''); toast('Invite sent'); };
  return (
      <div className="animate-screen-in">
        <div className="flex justify-between mb-1.5"><h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Team</h1><Badge>{emails.length} members</Badge></div>
        {project && <p className="font-mono text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">{project.name.toUpperCase()}</p>}
        <p className="text-ink-soft mb-6">Invite colleagues to access this project's StoryGuide.</p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <Card><h3 className="text-lg font-bold mb-3">Members</h3><div className="flex flex-col gap-2">{emails.map((e, i) => (<div key={i} className="flex items-center gap-3 p-2.5 border-[1.5px] border-contrast rounded-lg"><div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{e[0].toUpperCase()}</div><div className="flex-1"><div className="font-bold">{e.split('@')[0]}</div><div className="font-mono text-ink-soft text-[11px]">{e}</div></div><Badge>{i === 0 ? 'Active' : 'Invited'}</Badge><Button size="sm" variant="ghost" onClick={() => { const u = emails.filter((_, j) => j !== i); if (project) project.team = u; setEmails(u); toast('Removed'); }}>Remove</Button></div>))}</div></Card>
          <Card><h3 className="text-lg font-bold mb-3">Invite by email</h3><Input placeholder="name@company.co" value={inv} onChange={e => setInv(e.target.value)} className="mb-2.5" onKeyDown={e => e.key === 'Enter' && add()} /><Button variant="primary" className="w-full justify-center" onClick={add}>Send invite</Button><div className="my-6 border-t border-light-gray" /><Label>Role</Label><p className="text-ink-soft text-[13px] mt-1 m-0">Client Employee · read-only StoryGuide + chat.</p></Card>
        </div>
      </div>
  );
}

Object.assign(window, { ProjectEditor, Customize, Team });
