// Login + all 4 dashboards
const { useState: useStateL } = React;

function Login({ setRole, nav }) {
  const [email, setEmail] = useStateL('sarah@woden.co');
  const [pwd, setPwd] = useStateL('••••••••');
  const go = (r) => {
    setRole(r);
    const homes = { admin: '/admin', manager: '/manager', client: '/client', employee: '/employee/storyguide' };
    nav(homes[r]);
  };
  return (
    <div className="screen" style={{minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 40, background: 'var(--paper-warm)'}}>
      <div className="wf-box" style={{padding: 40, width: 440, position: 'relative'}}>
        <div style={{textAlign: 'center', marginBottom: 28}}>
          <img src="assets/woden-logo-black.svg" alt="Woden" style={{height: 36, marginBottom: 10}} />
          <div className="wdn-eyebrow" style={{color: 'var(--wdn-primary)'}}>Story is the strategy.</div>
        </div>
        <h2 className="center" style={{marginBottom: 6}}>Sign in</h2>
        <p className="center muted" style={{fontSize: 13, marginBottom: 20}}>story is the strategy.</p>
        <div className="col" style={{gap: 14}}>
          <div>
            <label className="wf-label">Email</label>
            <input className="wf-input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="wf-label">Password</label>
            <input className="wf-input" type="password" value={pwd} onChange={e => setPwd(e.target.value)} />
          </div>
          <button className="wf-btn primary lg" style={{width: '100%', justifyContent: 'center'}} onClick={() => go('admin')}>Sign in →</button>
        </div>
        <div className="wf-hr" />
        <div className="wf-label" style={{textAlign: 'center'}}>Or demo as</div>
        <div className="grid g-2" style={{marginTop: 12}}>
          <button className="wf-btn sm" onClick={() => go('admin')}>Admin</button>
          <button className="wf-btn sm" onClick={() => go('manager')}>Manager</button>
          <button className="wf-btn sm" onClick={() => go('client')}>Client</button>
          <button className="wf-btn sm" onClick={() => go('employee')}>Employee</button>
        </div>
        <Note style={{position: 'absolute', top: -28, right: -80, transform: 'rotate(6deg)'}}>
          ← any button works,<br/>it's a demo!
        </Note>
      </div>
    </div>
  );
}

function AdminDash({ nav }) {
  return (
    <div className="screen">
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
        <div>
          <h1 className="scribble">Admin overview</h1>
          <p className="muted" style={{marginTop: 4}}>Everything across Woden, in one place.</p>
        </div>
        <div className="row">
          <button className="wf-btn ghost sm">Export CSV</button>
          <button className="wf-btn primary sm">+ New manager</button>
        </div>
      </div>
      <div className="grid g-4" style={{marginBottom: 24}}>
        {[['14','Active projects','+2 this week'],['6','Client companies','+1'],['3','Managers','—'],['412','Chat sessions','+48']].map(([n,l,d]) => (
          <div className="wf-box kpi" key={l}>
            <div className="n">{n}</div>
            <div className="l">{l}</div>
            <div className="delta">{d}</div>
          </div>
        ))}
      </div>
      <div className="grid" style={{gridTemplateColumns: '2fr 1fr', gap: 24}}>
        <div className="wf-box" style={{padding: 20}}>
          <div className="row" style={{justifyContent: 'space-between', marginBottom: 14}}>
            <h3>Recent projects</h3>
            <a className="accent-c mono" style={{fontSize: 11, cursor: 'pointer'}} onClick={() => nav('/admin/projects')}>VIEW ALL →</a>
          </div>
          <table className="wf-table">
            <thead><tr><th>Client</th><th>Manager</th><th>Status</th><th>Seats</th><th>Updated</th></tr></thead>
            <tbody>
              {window.WODEN.CLIENT_COMPANIES.map(c => (
                <tr key={c.id} style={{cursor:'pointer'}} onClick={() => nav('/admin/projects/' + c.id)}>
                  <td style={{fontWeight: 700}}>{c.name}</td>
                  <td>{c.manager}</td>
                  <td><span className={'wf-tag ' + (c.status === 'published' ? 'accent' : c.status === 'draft' ? '' : 'soft')}>{c.status}</span></td>
                  <td className="mono" style={{fontSize: 12}}>{c.seats}</td>
                  <td className="muted">{c.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col">
          <div className="wf-box" style={{padding: 20}}>
            <h3 style={{marginBottom: 10}}>Activity feed</h3>
            <div className="col" style={{gap: 10}}>
              {['Marcus published Meridian v1.3','Priya invited 2 clients','David opened chat 14×','Elena changed theme → Night','Jonah created Forgeworks'].map((a,i) => (
                <div key={i} className="row" style={{gap: 10, fontSize: 13}}>
                  <div className="wf-circle" style={{width: 24, height: 24, fontSize: 10}}>{a[0]}</div>
                  <div style={{flex:1}}>{a}</div>
                  <span className="mono muted" style={{fontSize: 10}}>{i+1}h</span>
                </div>
              ))}
            </div>
          </div>
          <div className="wf-box" style={{padding: 20}}>
            <h3 style={{marginBottom: 10}}>System</h3>
            <button className="wf-btn ghost sm" onClick={() => { localStorage.clear(); toast('Demo data reset'); }}>Reset demo data</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManagerDash({ nav }) {
  return (
    <div className="screen">
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
        <div>
          <h1 className="scribble">My projects</h1>
          <p className="muted" style={{marginTop: 4}}>Strategist workspace — Marcus Reed.</p>
        </div>
        <button className="wf-btn primary" onClick={() => nav('/manager/projects/new')}>+ New project</button>
      </div>
      <div className="grid g-3" style={{marginBottom: 24}}>
        {[
          { c: 'Meridian Coffee Co.', s: 'published', prog: 14, id: 'c1' },
          { c: 'Northwind Logistics', s: 'draft', prog: 8, id: 'c2' },
          { c: 'Forgeworks (new)',    s: 'draft', prog: 3, id: 'c4' },
        ].map(p => (
          <div key={p.id} className="wf-box" style={{padding: 18, cursor: 'pointer'}} onClick={() => nav('/manager/projects/' + p.id + '/edit')}>
            <div className="row" style={{justifyContent:'space-between', marginBottom: 10}}>
              <span className={'wf-tag ' + (p.s === 'published' ? 'accent' : '')}>{p.s}</span>
              <span className="mono muted" style={{fontSize:10}}>{p.prog}/14 sections</span>
            </div>
            <h3 style={{marginBottom: 14}}>{p.c}</h3>
            <div style={{height: 8, background: 'var(--paper-warm)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden'}}>
              <div style={{width: (p.prog/14*100) + '%', height: '100%', background: 'var(--accent)'}}/>
            </div>
            <div className="row" style={{marginTop: 14, gap: 8}}>
              <button className="wf-btn sm ghost" onClick={(e)=>{e.stopPropagation(); nav('/manager/projects/' + p.id + '/edit');}}>Edit</button>
              <button className="wf-btn sm" onClick={(e)=>{e.stopPropagation(); nav('/client/storyguide');}}>Preview</button>
            </div>
          </div>
        ))}
      </div>
      <Card>
        <h3 style={{marginBottom: 12}}>My clients</h3>
        <table className="wf-table">
          <thead><tr><th>Client</th><th>Project</th><th>Seats used</th><th>Last active</th><th></th></tr></thead>
          <tbody>
            {window.WODEN.CLIENT_COMPANIES.filter(c => c.manager === 'Marcus Reed').map(c => (
              <tr key={c.id}>
                <td style={{fontWeight: 700}}>{c.name}</td>
                <td><span className="wf-tag">{c.status}</span></td>
                <td className="mono">{c.seats}</td>
                <td className="muted">{c.updated}</td>
                <td><button className="wf-btn sm ghost" onClick={() => nav('/manager/projects/' + c.id + '/edit')}>Open →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ClientDash({ nav }) {
  const u = window.WODEN.MOCK_USERS.client;
  return (
    <div className="screen">
      <Card pad={32} style={{position: 'relative', marginBottom: 24, background: 'var(--paper-warm)'}}>
        <div className="grid" style={{gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'center'}}>
          <div>
            <div className="mono muted" style={{fontSize: 11, letterSpacing: '0.15em'}}>WELCOME BACK, ELENA</div>
            <h1 style={{marginTop: 8, marginBottom: 10}}>{u.company}</h1>
            <p style={{fontSize: 18, marginBottom: 18}} className="scribble">"{window.WODEN.MERIDIAN.tagline}"</p>
            <div className="row">
              <button className="wf-btn primary" onClick={() => nav('/client/storyguide')}>Open StoryGuide →</button>
              <button className="wf-btn ghost" onClick={() => { nav('/client/storyguide'); setTimeout(() => window.dispatchEvent(new CustomEvent('open-chat')), 100); }}>Ask the AI</button>
            </div>
          </div>
          <Rect label="Cover preview · 14 sections" h={200} />
        </div>
        <Note style={{position: 'absolute', top: -18, right: 24, transform: 'rotate(4deg)'}}>your brandbook ↗</Note>
      </Card>
      <div className="grid g-3">
        <Card>
          <h3 style={{marginBottom: 8}}>Customize</h3>
          <p className="muted" style={{fontSize: 13, marginBottom: 12}}>Pick Daylight or Nightshift. Swap your logo.</p>
          <button className="wf-btn sm" onClick={() => nav('/client/customize')}>Open →</button>
        </Card>
        <Card>
          <h3 style={{marginBottom: 8}}>Team</h3>
          <p className="muted" style={{fontSize: 13, marginBottom: 12}}>4 of 5 seats used. Invite more colleagues.</p>
          <button className="wf-btn sm" onClick={() => nav('/client/team')}>Manage →</button>
        </Card>
        <Card>
          <h3 style={{marginBottom: 8}}>AI chat</h3>
          <p className="muted" style={{fontSize: 13, marginBottom: 12}}>Ask anything. Trained on your StoryGuide.</p>
          <button className="wf-btn sm" onClick={() => { nav('/client/storyguide'); setTimeout(() => window.dispatchEvent(new CustomEvent('open-chat')), 100); }}>Open chat →</button>
        </Card>
      </div>
    </div>
  );
}

function EmployeeHome({ nav }) {
  return (
    <div className="screen">
      <Card pad={40} style={{textAlign: 'center'}}>
        <div className="mono muted" style={{fontSize: 11, letterSpacing: '0.15em'}}>READ-ONLY ACCESS</div>
        <h1 style={{marginTop: 10}}>Meridian Coffee Co.</h1>
        <p className="muted" style={{marginBottom: 20}}>Your company's StoryGuide + AI chat.</p>
        <button className="wf-btn primary lg" onClick={() => nav('/employee/storyguide')}>Open StoryGuide →</button>
      </Card>
    </div>
  );
}

function ManagersTable() {
  return (
    <div className="screen">
      <div className="row" style={{justifyContent:'space-between', marginBottom: 20}}>
        <h1 className="scribble">Managers</h1>
        <button className="wf-btn primary">+ Add manager</button>
      </div>
      <Card pad={0}>
        <table className="wf-table">
          <thead><tr><th>Name</th><th>Email</th><th>Clients</th><th>Projects</th><th></th></tr></thead>
          <tbody>
            {window.WODEN.MANAGERS.map(m => (
              <tr key={m.id}>
                <td style={{fontWeight: 700}}>{m.name}</td>
                <td className="mono" style={{fontSize:12}}>{m.email}</td>
                <td>{m.clients}</td>
                <td>{m.projects}</td>
                <td><button className="wf-btn sm ghost">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ClientsTable({ nav }) {
  return (
    <div className="screen">
      <div className="row" style={{justifyContent:'space-between', marginBottom: 20}}>
        <h1 className="scribble">Clients</h1>
        <div className="row">
          <input className="wf-input" placeholder="Search clients…" style={{width: 220}} />
          <button className="wf-btn primary">+ New client</button>
        </div>
      </div>
      <Card pad={0}>
        <table className="wf-table">
          <thead><tr><th>Client</th><th>Manager</th><th>Status</th><th>Seats</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            {window.WODEN.CLIENT_COMPANIES.map(c => (
              <tr key={c.id}>
                <td style={{fontWeight: 700}}>{c.name}</td>
                <td>{c.manager}</td>
                <td><span className={'wf-tag ' + (c.status === 'published' ? 'accent' : '')}>{c.status}</span></td>
                <td className="mono" style={{fontSize:12}}>{c.seats}</td>
                <td className="muted">{c.updated}</td>
                <td><button className="wf-btn sm ghost" onClick={() => nav('/admin/projects/' + c.id)}>Open →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatsPage() {
  return (
    <div className="screen">
      <h1 className="scribble" style={{marginBottom: 20}}>Platform stats</h1>
      <div className="grid g-2">
        <Card>
          <h3 style={{marginBottom: 12}}>Projects by month</h3>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0 8px'}}>
            {[3,5,4,6,8,7,9,11,10,13,12,14].map((v,i) => (
              <div key={i} style={{flex:1, height: (v*12)+'px', background: i===11 ? 'var(--accent)' : 'var(--ink)', borderRadius: '4px 4px 0 0'}} />
            ))}
          </div>
          <div className="row mono muted" style={{fontSize: 10, justifyContent: 'space-between', marginTop: 8}}>
            <span>JAN</span><span>DEC</span>
          </div>
        </Card>
        <Card>
          <h3 style={{marginBottom: 12}}>Chat sessions (last 30d)</h3>
          <Rect label="Line chart placeholder" h={180} />
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { Login, AdminDash, ManagerDash, ClientDash, EmployeeHome, ManagersTable, ClientsTable, StatsPage });
