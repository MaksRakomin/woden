// Manager project editor + Customize + Team
const { useState: useStateE, useRef: useRefE, useEffect: useEffectE } = React;

// ─── WYSIWYG text editor ──────────────────────────────────────────────────────

function WYSIWYGEditor({ sectionN, title, content, onChange }) {
  const ref = useRefE(null);

  // auto-grow textarea height
  useEffectE(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [content]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const insertAround = (before, after) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = content.slice(start, end) || 'text';
    const next  = content.slice(0, start) + before + sel + after + content.slice(end);
    onChange(next);
    // restore cursor after React re-render
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd   = start + before.length + sel.length;
    }, 0);
  };

  const TBtn = ({ label, title, cls, action }) => (
    <button className={'wysiwyg-tbtn' + (cls ? ' ' + cls : '')} title={title} onMouseDown={e => { e.preventDefault(); action(); }}>
      {label}
    </button>
  );

  return (
    <div className="wysiwyg">
      <div className="wysiwyg-toolbar">
        <TBtn label="B"  cls="wysiwyg-tbtn-bold"   title="Bold"      action={() => insertAround('**', '**')} />
        <TBtn label="I"  cls="wysiwyg-tbtn-italic" title="Italic"    action={() => insertAround('_', '_')} />
        <div className="wysiwyg-divider" />
        <TBtn label="H2" cls="wysiwyg-tbtn-mono"   title="Heading 2" action={() => insertAround('\n## ', '\n')} />
        <TBtn label="H3" cls="wysiwyg-tbtn-mono"   title="Heading 3" action={() => insertAround('\n### ', '\n')} />
        <div className="wysiwyg-divider" />
        <TBtn label="&#8212; List" title="Bullet list" action={() => insertAround('\n- ', '')} />
        <TBtn label="&#10077;&#10078;" title="Quote"   action={() => insertAround('\n> ', '\n')} />
        <div style={{flex: 1}} />
        <span className="wysiwyg-wordcount">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      </div>
      <textarea
        ref={ref}
        className="wysiwyg-textarea"
        value={content}
        placeholder={'Write the ' + title + ' section here…'}
        onChange={e => onChange(e.target.value)}
        rows={12}
      />
    </div>
  );
}

// ─── color palettes ───────────────────────────────────────────────────────────

const PALETTES = [
  { id: 'espresso', name: 'Espresso',  colors: ['#3B2A1F', '#E8D5B7', '#D4572A', '#F7F1E5'] },
  { id: 'slate',    name: 'Slate',     colors: ['#1C2B3A', '#C8D8E8', '#3A7CA5', '#F4F7FA'] },
  { id: 'forest',   name: 'Forest',    colors: ['#1A3A2A', '#B8D8C8', '#2D7A4F', '#F2F7F4'] },
  { id: 'dusk',     name: 'Dusk',      colors: ['#2D1B4E', '#D4C8F0', '#7C4DBC', '#F7F4FD'] },
  { id: 'clay',     name: 'Clay',      colors: ['#3D2B1A', '#F0DDD0', '#C0622A', '#FDF6F2'] },
  { id: 'minimal',  name: 'Minimal',   colors: ['#131215', '#EAEAEA', '#EA3323', '#FFFFFF'] },
];

// ─── project editor ───────────────────────────────────────────────────────────

function ProjectEditor({ nav, projectId }) {
  const [flowStep, setFlowStep] = useStateE(1); // 1 = editor, 2 = colors + description
  const [content, setContent] = useStateE('');
  const [palette, setPalette] = useStateE(PALETTES[0].id);
  const [description, setDescription] = useStateE('');

  const generate = () => {
    const sel = PALETTES.find(p => p.id === palette);
    const p = {
      id: 'p' + Date.now(),
      clientId: 'c1',
      name: description.trim() || 'New StoryGuide',
      status: 'draft',
      sections: 0,
      updated: 'just now',
      team: [],
      palette: sel ? sel.colors : [],
    };
    window.WODEN.PROJECTS.push(p);
    toast('Project created');
    nav('/manager/projects');
  };

  return (
    <div className="screen">
      <div className="row" style={{marginBottom: 8}}>
        <a className="mono muted" style={{fontSize: 11, cursor: 'pointer'}} onClick={() => flowStep === 2 ? setFlowStep(1) : nav('/manager/projects')}>
          &#8592; {flowStep === 2 ? 'BACK' : 'PROJECTS'}
        </a>
      </div>

      {/* flow progress */}
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24}}>
        <div>
          <h1 className="scribble">Meridian Coffee Co.</h1>
          <div className="flow-steps">
            <div className={'flow-step' + (flowStep >= 1 ? ' active' : '')}>
              <span className="flow-step-n">1</span>
              <span>Content</span>
            </div>
            <div className="flow-step-line" />
            <div className={'flow-step' + (flowStep >= 2 ? ' active' : '')}>
              <span className="flow-step-n">2</span>
              <span>Brand</span>
            </div>
          </div>
        </div>
        <div className="row">
          {flowStep === 1 && (
            <>
              <button className="wf-btn sm ghost" onClick={() => toast('Draft saved')}>Save draft</button>
              <button className="wf-btn primary" onClick={() => setFlowStep(2)}>Next step &#8594;</button>
            </>
          )}
          {flowStep === 2 && (
            <>
              <button className="wf-btn ghost" onClick={() => setFlowStep(1)}>&#8592; Back</button>
              <button className="wf-btn primary" onClick={generate}>Generate project &#10003;</button>
            </>
          )}
        </div>
      </div>

      {/* step 1 — editor */}
      {flowStep === 1 && (
        <div className="wf-box" style={{overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <WYSIWYGEditor
            title="StoryGuide"
            content={content}
            onChange={setContent}
          />
        </div>
      )}

      {/* step 2 — palette + description */}
      {flowStep === 2 && (
        <div className="col" style={{gap: 24, maxWidth: 720}}>
          <Card pad={28}>
            <h3 style={{marginBottom: 4}}>Brand palette</h3>
            <p className="muted" style={{fontSize: 13, marginBottom: 20}}>Choose the colour set that best fits this client's identity. You can refine it later.</p>
            <div className="palette-grid">
              {PALETTES.map(p => (
                <div
                  key={p.id}
                  className={'palette-card' + (palette === p.id ? ' selected' : '')}
                  onClick={() => setPalette(p.id)}
                >
                  <div className="palette-swatches">
                    {p.colors.map((c, i) => (
                      <div key={i} className="palette-swatch" style={{background: c}} />
                    ))}
                  </div>
                  <div className="palette-name">{p.name}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={28}>
            <h3 style={{marginBottom: 4}}>Project description</h3>
            <p className="muted" style={{fontSize: 13, marginBottom: 14}}>A short note on what this StoryGuide is for. Used as the project name.</p>
            <textarea
              className="wf-input"
              rows={3}
              placeholder="e.g. Brand voice refresh ahead of Q3 launch…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Card>

        </div>
      )}
    </div>
  );
}

/*
function SectionForm({ step }) {
  const fields = {
    1: [['Client name','input','Meridian Coffee Co.'],['Tagline','input','Coffee with conviction.'],['Prepared by','input','Woden'],['Version','input','1.3'],['Logo','file','']],
    2: [['Origin','textarea','In 2014, a barista named Ana…'],['Conflict','textarea','Three farmers. Seven middlemen…'],['Resolution','textarea','Meridian began as a single direct-trade relationship…']],
    3: [['Mission','textarea','To connect growers and drinkers…'],['Vision','textarea','A coffee industry where every cup traces…']],
    4: [['Persona 1 name','input','Conscious Casey'],['Persona 1 quote','input','I want to know where my money actually goes.'],['Persona 2 name','input','Office Owen'],['Persona 2 quote','input','I buy coffee for 50 people…']],
    5: [['Positioning statement','textarea','For people who care where their coffee comes from…']],
    6: [['Pillar 1','input','Transparent'],['Pillar 2','input','Rigorous'],['Pillar 3','input','Warm'],['Pillar 4','input','Curious']],
  };
  const f = fields[step] || [['Content','textarea','Fill this section…'],['Notes','textarea','']];
  return (
    <div className="col" style={{gap: 14}}>
      {f.map(([label, kind, val], i) => (
        <div key={i}>
          <label className="wf-label">{label}</label>
          {kind === 'input' && <input className="wf-input" defaultValue={val} />}
          {kind === 'textarea' && <textarea className="wf-input" rows={3} defaultValue={val} />}
          {kind === 'file' && <div className="wf-rect" style={{height: 80}}>Drop logo · SVG or PNG</div>}
        </div>
      ))}
    </div>
  );
}
*/

// ─── customize ────────────────────────────────────────────────────────────────

function Customize({ nav }) {
  const [theme, setTheme] = useStateE(() => localStorage.getItem('wdn-sg-theme') || 'light');
  const apply = (t) => { setTheme(t); localStorage.setItem('wdn-sg-theme', t); toast('Theme saved'); };
  return (
    <div className="screen">
      <h1 className="scribble" style={{marginBottom: 6}}>Customize</h1>
      <p className="muted" style={{marginBottom: 24}}>Pick how your StoryGuide looks to your team.</p>
      <div className="grid g-2" style={{marginBottom: 28}}>
        <div className={'theme-card ' + (theme === 'light' ? 'selected' : '')} onClick={() => apply('light')}>
          <div className="row" style={{justifyContent: 'space-between', marginBottom: 10}}>
            <h3>Daylight</h3>
            {theme === 'light' && <span className="wf-tag accent">Selected</span>}
          </div>
          <div className="theme-preview light">
            <div style={{fontFamily: 'var(--hand-display)', fontSize: 20}}>Coffee with conviction.</div>
            <div style={{height: 1, background: '#1a1a1a', opacity: 0.2}} />
            <div style={{fontSize: 11, color: '#6a6a6a'}} className="mono">01 · STRATEGIC NARRATIVE</div>
            <Lines n={3} />
          </div>
          <p className="muted" style={{fontSize: 13, marginTop: 10}}>White background, black text, red accents.</p>
        </div>
        <div className={'theme-card ' + (theme === 'night' ? 'selected' : '')} onClick={() => apply('night')}>
          <div className="row" style={{justifyContent: 'space-between', marginBottom: 10}}>
            <h3>Nightshift</h3>
            {theme === 'night' && <span className="wf-tag accent">Selected</span>}
          </div>
          <div className="theme-preview night">
            <div style={{fontFamily: 'var(--hand-display)', fontSize: 20, color: '#fff'}}>Coffee with conviction.</div>
            <div style={{height: 1, background: '#fff', opacity: 0.2}} />
            <div style={{fontSize: 11, color: '#bbb'}} className="mono">01 · STRATEGIC NARRATIVE</div>
            <div className="wf-lines">
              <div className="wf-line w90" style={{background: '#fff', opacity: 0.4}} />
              <div className="wf-line w70" style={{background: '#fff', opacity: 0.4}} />
              <div className="wf-line w80" style={{background: '#fff', opacity: 0.4}} />
            </div>
          </div>
          <p className="muted" style={{fontSize: 13, marginTop: 10}}>Near-black background, white text, red accents.</p>
        </div>
      </div>
      <div className="grid g-2">
        <Card>
          <h3 style={{marginBottom: 10}}>Logo</h3>
          <div className="wf-rect" style={{height: 120, marginBottom: 12}}>Drop logo · SVG/PNG · max 2MB</div>
          <label className="row" style={{fontSize: 13, gap: 8}}>
            <input type="checkbox" defaultChecked /> Use Meridian fallback wordmark
          </label>
        </Card>
        <Card>
          <h3 style={{marginBottom: 10}}>Live preview</h3>
          <div style={theme === 'night' ? {background: '#131215', color: '#fff', padding: 16, borderRadius: 6} : {}}>
            <div className="mono" style={{fontSize: 10, letterSpacing: '0.12em', opacity: 0.6}}>02 · STRATEGIC NARRATIVE</div>
            <div style={{fontFamily: 'var(--hand-display)', fontSize: 22, marginTop: 6}}>Coffee with conviction.</div>
            <Lines n={3} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── team ─────────────────────────────────────────────────────────────────────

function Team({ projectId }) {
  const project = window.WODEN.PROJECTS.find(p => p.id === projectId) || window.WODEN.PROJECTS[0];
  const [emails, setEmails] = useStateE(project ? [...project.team] : []);
  const [inv, setInv] = useStateE('');
  const persist = (updated) => { if (project) project.team = updated; };
  const add = () => {
    if (!inv.trim()) return;
    const updated = [...emails, inv.trim()];
    persist(updated);
    setEmails(updated);
    setInv('');
    toast('Invite sent');
  };
  return (
    <div className="screen">
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
        <h1 className="scribble">Team</h1>
        <span className="wf-tag">{emails.length} members</span>
      </div>
      {project && <p className="mono muted" style={{fontSize: 11, letterSpacing: '0.1em', marginBottom: 6}}>{project.name.toUpperCase()}</p>}
      <p className="muted" style={{marginBottom: 24}}>Invite colleagues to access this project's StoryGuide.</p>
      <div className="grid" style={{gridTemplateColumns: '1.3fr 1fr', gap: 24}}>
        <Card>
          <h3 style={{marginBottom: 12}}>Members</h3>
          <div className="col" style={{gap: 8}}>
            {emails.map((e, i) => (
              <div key={i} className="row" style={{padding: '10px 12px', border: '1.5px solid var(--ink)', borderRadius: 6}}>
                <div className="wf-circle" style={{width: 32, height: 32, fontSize: 12}}>{e[0].toUpperCase()}</div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 700}}>{e.split('@')[0]}</div>
                  <div className="mono muted" style={{fontSize: 11}}>{e}</div>
                </div>
                <span className="wf-tag">{i === 0 ? 'Active' : 'Invited'}</span>
                <button className="wf-btn sm ghost" onClick={() => { const u = emails.filter((_, j) => j !== i); persist(u); setEmails(u); toast('Removed'); }}>Remove</button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{marginBottom: 12}}>Invite by email</h3>
          <input className="wf-input" placeholder="name@company.co" value={inv} onChange={e => setInv(e.target.value)} style={{marginBottom: 10}} onKeyDown={e => e.key === 'Enter' && add()} />
          <button className="wf-btn primary" style={{width: '100%', justifyContent: 'center'}} onClick={add}>Send invite</button>
          <div className="wf-hr" />
          <div className="wf-label">Role</div>
          <p className="muted" style={{fontSize: 13, margin: '4px 0 0'}}>Client Employee · read-only StoryGuide + chat.</p>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectEditor, Customize, Team });
