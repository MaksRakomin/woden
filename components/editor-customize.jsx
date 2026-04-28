// Manager project editor (14-section wizard) + Customize + Team
const { useState: useStateE } = React;

function ProjectEditor({ nav, projectId }) {
  const [step, setStep] = useStateE(1);
  const titles = window.WODEN.SECTION_TITLES;
  return (
    <div className="screen">
      <div className="row" style={{marginBottom: 8, gap: 8}}>
        <a className="mono muted" style={{fontSize: 11, cursor:'pointer'}} onClick={() => nav('/manager/projects')}>← PROJECTS</a>
      </div>
      <div className="row" style={{justifyContent:'space-between', marginBottom: 4}}>
        <h1 className="scribble">Meridian Coffee Co.</h1>
        <div className="row">
          <span className="wf-tag">draft</span>
          <button className="wf-btn sm ghost" onClick={() => { toast('Draft saved'); }}>Save draft</button>
          <button className="wf-btn sm" onClick={() => nav('/client/storyguide')}>Preview →</button>
          <button className="wf-btn primary sm" onClick={() => toast('Published v1.4')}>Publish</button>
        </div>
      </div>
      <p className="muted" style={{marginBottom: 20}}>Section {step} of 14 · auto-saved 2 min ago</p>

      <div className="wizard-steps">
        {titles.map((t, i) => (
          <div key={i}
               className={'wizard-step ' + (step === i+1 ? 'active' : step > i+1 ? 'done' : '')}
               onClick={() => setStep(i+1)}>
            <span className="n">{i+1}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      <div className="grid" style={{gridTemplateColumns: '1.3fr 1fr', gap: 24}}>
        <Card pad={24}>
          <div className="wf-label">Section {step}</div>
          <h2 style={{marginBottom: 16}}>{titles[step-1]}</h2>
          <SectionForm step={step} />
          <div className="wf-hr" />
          <div className="row" style={{justifyContent:'space-between'}}>
            <button className="wf-btn ghost" disabled={step===1} onClick={() => setStep(s => Math.max(1, s-1))}>← Prev</button>
            <span className="mono muted" style={{fontSize: 11}}>STEP {step} / 14</span>
            <button className="wf-btn primary" onClick={() => { if (step < 14) setStep(step+1); else toast('All sections complete'); }}>
              {step < 14 ? 'Next →' : 'Finish ✓'}
            </button>
          </div>
        </Card>

        <div className="col">
          <Card>
            <div className="row" style={{justifyContent:'space-between', marginBottom: 10}}>
              <h4>Live preview</h4>
              <span className="wf-tag">read-only</span>
            </div>
            <div style={{borderLeft: '3px solid var(--accent)', paddingLeft: 14}}>
              <div className="mono muted" style={{fontSize: 10, letterSpacing: '0.12em'}}>SECTION {String(step).padStart(2,'0')}</div>
              <h3 style={{marginTop: 6, marginBottom: 10}}>{titles[step-1]}</h3>
              <Lines n={5} />
            </div>
          </Card>
          <Card>
            <h4 style={{marginBottom: 10}}>Tips</h4>
            <ul style={{margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6}} className="muted">
              <li>Use plain language — the client reads this.</li>
              <li>Short sentences. Active verbs.</li>
              <li>This section feeds the AI chat.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionForm({ step }) {
  // generic form that changes shape per section
  const fields = {
    1: [['Client name','input','Meridian Coffee Co.'],['Tagline','input','Coffee with conviction.'],['Prepared by','input','Woden'],['Version','input','1.3'],['Logo','file','']],
    2: [['Origin','textarea','In 2014, a barista named Ana…'],['Conflict','textarea','Three farmers. Seven middlemen…'],['Resolution','textarea','Meridian began as a single direct-trade relationship…']],
    3: [['Mission','textarea','To connect growers and drinkers…'],['Vision','textarea','A coffee industry where every cup traces…']],
    4: [['Persona 1 name','input','Conscious Casey'],['Persona 1 quote','input','I want to know where my money actually goes.'],['Persona 2 name','input','Office Owen'],['Persona 2 quote','input','I buy coffee for 50 people…']],
    5: [['Positioning statement (template-filled)','textarea','For people who care where their coffee comes from, Meridian is the specialty roaster that names every farmer on every bag…']],
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
          {kind === 'file' && <div className="wf-rect" style={{height: 80}}>⬆ Drop logo · SVG or PNG</div>}
        </div>
      ))}
    </div>
  );
}

function Customize({ nav }) {
  const [theme, setTheme] = useStateE(() => localStorage.getItem('wdn-sg-theme') || 'light');
  const apply = (t) => { setTheme(t); localStorage.setItem('wdn-sg-theme', t); toast('Theme saved'); };
  return (
    <div className="screen">
      <h1 className="scribble" style={{marginBottom: 6}}>Customize</h1>
      <p className="muted" style={{marginBottom: 24}}>Pick how your StoryGuide looks to your team.</p>

      <div className="grid g-2" style={{marginBottom: 28}}>
        <div className={'theme-card ' + (theme === 'light' ? 'selected' : '')} onClick={() => apply('light')}>
          <div className="row" style={{justifyContent:'space-between', marginBottom: 10}}>
            <h3>Daylight</h3>
            {theme === 'light' && <span className="wf-tag accent">Selected</span>}
          </div>
          <div className="theme-preview light">
            <div style={{fontFamily:'var(--hand-display)', fontSize: 20}}>Coffee with conviction.</div>
            <div style={{height: 1, background:'#1a1a1a', opacity: 0.2}}/>
            <div style={{fontSize: 11, color:'#6a6a6a'}} className="mono">01 · STRATEGIC NARRATIVE</div>
            <Lines n={3} />
          </div>
          <p className="muted" style={{fontSize: 13, marginTop: 10}}>White background, black text, red accents.</p>
        </div>
        <div className={'theme-card ' + (theme === 'night' ? 'selected' : '')} onClick={() => apply('night')}>
          <div className="row" style={{justifyContent:'space-between', marginBottom: 10}}>
            <h3>Nightshift</h3>
            {theme === 'night' && <span className="wf-tag accent">Selected</span>}
          </div>
          <div className="theme-preview night">
            <div style={{fontFamily:'var(--hand-display)', fontSize: 20, color:'#fff'}}>Coffee with conviction.</div>
            <div style={{height: 1, background:'#fff', opacity: 0.2}}/>
            <div style={{fontSize: 11, color:'#bbb'}} className="mono">01 · STRATEGIC NARRATIVE</div>
            <div className="wf-lines">
              <div className="wf-line w90" style={{background:'#fff', opacity: 0.4}}/>
              <div className="wf-line w70" style={{background:'#fff', opacity: 0.4}}/>
              <div className="wf-line w80" style={{background:'#fff', opacity: 0.4}}/>
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
          <div style={theme === 'night' ? {background:'#131215', color:'#fff', padding: 16, borderRadius: 6} : {}}>
            <div className="mono" style={{fontSize: 10, letterSpacing: '0.12em', opacity: 0.6}}>02 · STRATEGIC NARRATIVE</div>
            <div style={{fontFamily:'var(--hand-display)', fontSize: 22, marginTop: 6}}>Coffee with conviction.</div>
            <Lines n={3} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Team({ projectId }) {
  const project = window.WODEN.PROJECTS.find(p => p.id === projectId) || window.WODEN.PROJECTS[0];
  const [emails, setEmails] = useStateE(project ? [...project.team] : []);
  const [inv, setInv] = useStateE('');
  const persist = (updated) => {
    if (project) project.team = updated;
  };
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
      <div className="row" style={{justifyContent:'space-between', marginBottom: 6}}>
        <h1 className="scribble">Team</h1>
        <span className="wf-tag">{emails.length} members</span>
      </div>
      {project && <p className="mono muted" style={{fontSize: 11, letterSpacing: '0.1em', marginBottom: 6}}>{project.name.toUpperCase()}</p>}
      <p className="muted" style={{marginBottom: 24}}>Invite colleagues to access this project's StoryGuide.</p>

      <div className="grid" style={{gridTemplateColumns: '1.3fr 1fr', gap: 24}}>
        <Card>
          <h3 style={{marginBottom: 12}}>Members</h3>
          <div className="col" style={{gap: 8}}>
            {emails.map((e,i) => (
              <div key={i} className="row" style={{padding: '10px 12px', border: '1.5px solid var(--ink)', borderRadius: 6}}>
                <div className="wf-circle" style={{width: 32, height: 32, fontSize: 12}}>{e[0].toUpperCase()}</div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 700}}>{e.split('@')[0]}</div>
                  <div className="mono muted" style={{fontSize: 11}}>{e}</div>
                </div>
                <span className="wf-tag">{i === 0 ? 'Active' : 'Invited'}</span>
                <button className="wf-btn sm ghost" onClick={() => { const updated = emails.filter((_,j) => j!==i); persist(updated); setEmails(updated); toast('Removed'); }}>Remove</button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{marginBottom: 12}}>Invite by email</h3>
          <input className="wf-input" placeholder="name@meridian.co" value={inv} onChange={e => setInv(e.target.value)} style={{marginBottom: 10}} />
          <button className="wf-btn primary" style={{width: '100%', justifyContent:'center'}} onClick={add}>Send invite</button>
          <div className="wf-hr" />
          <div className="wf-label">Role</div>
          <p className="muted" style={{fontSize: 13, margin: '4px 0 0'}}>Client Employee · read-only StoryGuide + chat.</p>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectEditor, Customize, Team });
