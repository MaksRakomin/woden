// Login + all 4 dashboards
const { useState: useStateL } = React;

// ─── shared form components ───────────────────────────────────────────────────

function ManagerForm({ initial, onSave, onClose }) {
  const [name, setName] = useStateL(initial ? initial.name : '');
  const [email, setEmail] = useStateL(initial ? initial.email : '');
  const save = () => {
    if (!name.trim() || !email.trim()) return toast('Fill all fields');
    onSave({ name: name.trim(), email: email.trim() });
  };
  return (
    <div className="modal-form">
      <Field label="Full name"><input className="wf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" /></Field>
      <Field label="Email"><input className="wf-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@woden.co" /></Field>
      <div className="modal-actions">
        <button className="wf-btn ghost" onClick={onClose}>Cancel</button>
        <button className="wf-btn primary" onClick={save}>{initial ? 'Save changes' : 'Add manager'}</button>
      </div>
    </div>
  );
}

function CompanyForm({ onSave, onClose }) {
  const [name, setName] = useStateL('');
  const [manager, setManager] = useStateL(window.WODEN.MANAGERS[0]?.name || '');
  const save = () => {
    if (!name.trim()) return toast('Enter company name');
    onSave({ name: name.trim(), manager });
  };
  return (
    <div className="modal-form">
      <Field label="Company name"><input className="wf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" /></Field>
      <Field label="Assign manager">
        <select className="wf-input" value={manager} onChange={e => setManager(e.target.value)}>
          {window.WODEN.MANAGERS.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      </Field>
      <div className="modal-actions">
        <button className="wf-btn ghost" onClick={onClose}>Cancel</button>
        <button className="wf-btn primary" onClick={save}>Add client</button>
      </div>
    </div>
  );
}

function ProjectForm({ companies, onSave, onClose }) {
  const [name, setName] = useStateL('');
  const [clientId, setClientId] = useStateL(companies[0]?.id || '');
  const save = () => {
    if (!name.trim()) return toast('Enter project name');
    if (!clientId) return toast('Select a client');
    onSave({ name: name.trim(), clientId });
  };
  return (
    <div className="modal-form">
      <Field label="Project name"><input className="wf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Brand Strategy 2025" /></Field>
      <Field label="Client company">
        <select className="wf-input" value={clientId} onChange={e => setClientId(e.target.value)}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="modal-actions">
        <button className="wf-btn ghost" onClick={onClose}>Cancel</button>
        <button className="wf-btn primary" onClick={save}>Create project</button>
      </div>
    </div>
  );
}

// ─── screens ──────────────────────────────────────────────────────────────────

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
          any button works,<br/>it's a demo!
        </Note>
      </div>
    </div>
  );
}

function AdminDash({ nav }) {
  const [tick, setTick] = useStateL(0);
  const [managerModal, setManagerModal] = useStateL(false);

  const allProjects = window.WODEN.PROJECTS;
  const getCompany = (clientId) => window.WODEN.CLIENT_COMPANIES.find(c => c.id === clientId);

  const addManager = (data) => {
    const m = { id: 'm' + Date.now(), ...data, clients: 0, projects: 0 };
    window.WODEN.MANAGERS.push(m);
    setTick(t => t + 1);
    setManagerModal(false);
    toast('Manager added');
  };

  return (
    <div className="screen">
      {managerModal && (
        <Modal title="New manager" onClose={() => setManagerModal(false)}>
          <ManagerForm onSave={addManager} onClose={() => setManagerModal(false)} />
        </Modal>
      )}
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
        <div>
          <h1 className="scribble">Admin overview</h1>
          <p className="muted" style={{marginTop: 4}}>Everything across Woden, in one place.</p>
        </div>
        <div className="row">
          <button className="wf-btn ghost sm">Export CSV</button>
          <button className="wf-btn primary sm" onClick={() => setManagerModal(true)}>+ New manager</button>
        </div>
      </div>
      <div className="grid g-4" style={{marginBottom: 24}}>
        {[
          [String(allProjects.length), 'Active projects', '+2 this week'],
          [String(window.WODEN.CLIENT_COMPANIES.length), 'Client companies', '+1'],
          [String(window.WODEN.MANAGERS.length), 'Managers', '—'],
          ['412', 'Chat sessions', '+48'],
        ].map(([n, l, d]) => (
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
            <a className="accent-c mono" style={{fontSize: 11, cursor: 'pointer'}} onClick={() => nav('/admin/clients')}>VIEW ALL →</a>
          </div>
          <table className="wf-table">
            <thead><tr><th>Client</th><th>Project</th><th>Manager</th><th>Status</th><th>Team</th><th>Updated</th></tr></thead>
            <tbody>
              {allProjects.map(p => {
                const co = getCompany(p.clientId);
                return (
                  <tr key={p.id} style={{cursor: 'pointer'}} onClick={() => nav('/admin/projects/' + p.id)}>
                    <td style={{fontWeight: 700}}>{co ? co.name : ''}</td>
                    <td>{p.name}</td>
                    <td className="muted">{co ? co.manager : ''}</td>
                    <td><span className={'wf-tag ' + (p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : '')}>{p.status}</span></td>
                    <td className="mono" style={{fontSize: 12}}>{p.team.length}</td>
                    <td className="muted">{p.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="col">
          <div className="wf-box" style={{padding: 20}}>
            <h3 style={{marginBottom: 10}}>Activity feed</h3>
            <div className="col" style={{gap: 10}}>
              {['Marcus published Meridian v1.3','Priya invited 2 clients','David opened chat 14x','Elena changed theme — Night','Jonah created Forgeworks'].map((a, i) => (
                <div key={i} className="row" style={{gap: 10, fontSize: 13}}>
                  <div className="wf-circle" style={{width: 24, height: 24, fontSize: 10}}>{a[0]}</div>
                  <div style={{flex: 1}}>{a}</div>
                  <span className="mono muted" style={{fontSize: 10}}>{i + 1}h</span>
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
  const managerName = window.WODEN.MOCK_USERS.manager.name;
  const myCompanies = window.WODEN.CLIENT_COMPANIES.filter(c => c.manager === managerName);
  const myClientIds = myCompanies.map(c => c.id);

  const [projects, setProjects] = useStateL(window.WODEN.PROJECTS.filter(p => myClientIds.includes(p.clientId)));
  const [projectModal, setProjectModal] = useStateL(false);

  const getCompanyName = (clientId) => {
    const c = window.WODEN.CLIENT_COMPANIES.find(c => c.id === clientId);
    return c ? c.name : '';
  };

  const addProject = (data) => {
    const p = { id: 'p' + Date.now(), ...data, status: 'draft', sections: 0, updated: 'just now', team: [] };
    window.WODEN.PROJECTS.push(p);
    setProjects(window.WODEN.PROJECTS.filter(p => myClientIds.includes(p.clientId)));
    setProjectModal(false);
    toast('Project created');
  };

  return (
    <div className="screen">
      {projectModal && (
        <Modal title="New project" onClose={() => setProjectModal(false)}>
          <ProjectForm companies={myCompanies} onSave={addProject} onClose={() => setProjectModal(false)} />
        </Modal>
      )}
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
        <div>
          <h1 className="scribble">My projects</h1>
          <p className="muted" style={{marginTop: 4}}>Strategist workspace — {managerName}.</p>
        </div>
        <button className="wf-btn primary" onClick={() => setProjectModal(true)}>+ New project</button>
      </div>
      <div className="grid g-3" style={{marginBottom: 24}}>
        {projects.map(p => (
          <div key={p.id} className="wf-box" style={{padding: 18, cursor: 'pointer'}} onClick={() => nav('/manager/projects/' + p.id + '/edit')}>
            <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
              <span className={'wf-tag ' + (p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : '')}>{p.status}</span>
              {/*<span className="mono muted" style={{fontSize: 10}}>{p.sections}/14 sections</span>*/}
            </div>
            <div className="mono muted" style={{fontSize: 11, marginBottom: 4}}>{getCompanyName(p.clientId)}</div>
            <h3 style={{marginBottom: 14}}>{p.name}</h3>
            <div style={{height: 8, background: 'var(--paper-warm)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden'}}>
              <div style={{width: (p.sections / 14 * 100) + '%', height: '100%', background: 'var(--accent)'}} />
            </div>
            <div className="row" style={{marginTop: 14, gap: 8}}>
              <button className="wf-btn sm ghost" onClick={e => { e.stopPropagation(); nav('/manager/projects/' + p.id + '/edit'); }}>Edit</button>
              <button className="wf-btn sm" onClick={e => { e.stopPropagation(); nav('/client/storyguide'); }}>Preview</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="wf-box" style={{padding: 32, textAlign: 'center', gridColumn: '1/-1'}}>
            <p className="muted" style={{marginBottom: 12}}>No projects yet.</p>
            <button className="wf-btn primary sm" onClick={() => setProjectModal(true)}>+ New project</button>
          </div>
        )}
      </div>
      <Card>
        <h3 style={{marginBottom: 12}}>My clients</h3>
        <table className="wf-table">
          <thead><tr><th>Client</th><th>Projects</th><th></th></tr></thead>
          <tbody>
            {myCompanies.map(c => {
              const count = window.WODEN.PROJECTS.filter(p => p.clientId === c.id).length;
              return (
                <tr key={c.id}>
                  <td style={{fontWeight: 700}}>{c.name}</td>
                  <td className="mono">{count}</td>
                  <td><button className="wf-btn sm ghost" onClick={() => nav('/manager/projects/' + c.id + '/edit')}>Open →</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ClientDash({ nav }) {
  const u = window.WODEN.MOCK_USERS.client;
  const [projects, setProjects] = useStateL(window.WODEN.PROJECTS.filter(p => p.clientId === 'c1'));

  return (
    <div className="screen">
      <Card pad={32} style={{position: 'relative', marginBottom: 28, background: 'var(--paper-warm)'}}>
        <div className="mono muted" style={{fontSize: 11, letterSpacing: '0.15em'}}>WELCOME BACK, ELENA</div>
        <h1 style={{marginTop: 8, marginBottom: 6}}>{u.company}</h1>
        <p style={{fontSize: 18, margin: 0}} className="scribble">"{window.WODEN.MERIDIAN.tagline}"</p>
        <Note style={{position: 'absolute', top: -18, right: 24, transform: 'rotate(4deg)'}}>your projects</Note>
      </Card>
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
        <h2>Projects</h2>
        <span className="mono muted" style={{fontSize: 12}}>{projects.length} total</span>
      </div>
      <div className="grid g-2">
        {projects.map(p => (
          <div key={p.id} className="wf-box" style={{padding: 20, cursor: 'pointer'}} onClick={() => nav('/client/projects/' + p.id)}>
            <div className="row" style={{justifyContent: 'space-between', marginBottom: 10}}>
              <span className={'wf-tag ' + (p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : '')}>{p.status}</span>
              <span className="mono muted" style={{fontSize: 11}}>{p.team.length} members · {p.updated}</span>
            </div>
            <h3 style={{marginBottom: 16}}>{p.name}</h3>
            <div className="row" style={{gap: 8}}>
              <button className="wf-btn sm primary" onClick={e => { e.stopPropagation(); nav('/client/projects/' + p.id); }}>Open StoryGuide →</button>
              <button className="wf-btn sm ghost" onClick={e => { e.stopPropagation(); nav('/client/team/' + p.id); }}>Team</button>
            </div>
          </div>
        ))}
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
  const [managers, setManagers] = useStateL([...window.WODEN.MANAGERS]);
  const [modal, setModal] = useStateL(null); // null | 'add' | <manager object>

  const saveManager = (data) => {
    if (modal === 'add') {
      const m = { id: 'm' + Date.now(), ...data, clients: 0, projects: 0 };
      window.WODEN.MANAGERS.push(m);
      setManagers([...window.WODEN.MANAGERS]);
      toast('Manager added');
    } else {
      const updated = window.WODEN.MANAGERS.map(m => m.id === modal.id ? { ...m, ...data } : m);
      window.WODEN.MANAGERS.splice(0, window.WODEN.MANAGERS.length, ...updated);
      setManagers([...window.WODEN.MANAGERS]);
      toast('Manager updated');
    }
    setModal(null);
  };

  return (
    <div className="screen">
      {modal && (
        <Modal title={modal === 'add' ? 'New manager' : 'Edit manager'} onClose={() => setModal(null)}>
          <ManagerForm initial={modal === 'add' ? null : modal} onSave={saveManager} onClose={() => setModal(null)} />
        </Modal>
      )}
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
        <h1 className="scribble">Managers</h1>
        <button className="wf-btn primary" onClick={() => setModal('add')}>+ Add manager</button>
      </div>
      <Card pad={0}>
        <table className="wf-table">
          <thead><tr><th>Name</th><th>Email</th><th>Clients</th><th>Projects</th><th></th></tr></thead>
          <tbody>
            {managers.map(m => (
              <tr key={m.id}>
                <td style={{fontWeight: 700}}>{m.name}</td>
                <td className="mono" style={{fontSize: 12}}>{m.email}</td>
                <td>{m.clients}</td>
                <td>{m.projects}</td>
                <td><button className="wf-btn sm ghost" onClick={() => setModal(m)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ClientsTable({ nav }) {
  const [companies, setCompanies] = useStateL([...window.WODEN.CLIENT_COMPANIES]);
  const [expanded, setExpanded] = useStateL({});
  const [clientModal, setClientModal] = useStateL(false);
  const [projectModal, setProjectModal] = useStateL(null); // null | companyId

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const addCompany = (data) => {
    const c = { id: 'c' + Date.now(), ...data };
    window.WODEN.CLIENT_COMPANIES.push(c);
    setCompanies([...window.WODEN.CLIENT_COMPANIES]);
    setClientModal(false);
    toast('Client added');
  };

  const addProject = (data) => {
    const p = { id: 'p' + Date.now(), ...data, status: 'draft', sections: 0, updated: 'just now', team: [] };
    window.WODEN.PROJECTS.push(p);
    setExpanded(e => ({ ...e, [data.clientId]: true }));
    setProjectModal(null);
    toast('Project created');
  };

  return (
    <div className="screen">
      {clientModal && (
        <Modal title="New client" onClose={() => setClientModal(false)}>
          <CompanyForm onSave={addCompany} onClose={() => setClientModal(false)} />
        </Modal>
      )}
      {projectModal && (
        <Modal title="New project" onClose={() => setProjectModal(null)}>
          <ProjectForm
            companies={window.WODEN.CLIENT_COMPANIES.filter(c => c.id === projectModal)}
            onSave={addProject}
            onClose={() => setProjectModal(null)}
          />
        </Modal>
      )}
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
        <h1 className="scribble">Clients</h1>
        <div className="row">
          <input className="wf-input" placeholder="Search clients..." style={{width: 220}} />
          <button className="wf-btn primary" onClick={() => setClientModal(true)}>+ New client</button>
        </div>
      </div>
      <Card pad={0}>
        <table className="wf-table">
          <thead>
            <tr>
              <th style={{width: 32}}></th>
              <th>Client</th>
              <th>Manager</th>
              <th>Projects</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => {
              const projects = window.WODEN.PROJECTS.filter(p => p.clientId === c.id);
              const isOpen = !!expanded[c.id];
              return (
                <React.Fragment key={c.id}>
                  <tr className={'accordion-row' + (isOpen ? ' open' : '')} onClick={() => toggle(c.id)} style={{cursor: 'pointer'}}>
                    <td style={{textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 12}}>
                      {isOpen ? '▾' : '▸'}
                    </td>
                    <td style={{fontWeight: 700}}>{c.name}</td>
                    <td>{c.manager}</td>
                    <td className="mono" style={{fontSize: 12}}>{projects.length} project{projects.length !== 1 ? 's' : ''}</td>
                    <td>
                      <div className="row" style={{gap: 6}}>
                        <button className="wf-btn sm ghost" onClick={e => { e.stopPropagation(); setProjectModal(c.id); }}>+ Project</button>
                        <button className="wf-btn sm ghost" onClick={e => { e.stopPropagation(); nav('/admin/projects/' + c.id); }}>Open →</button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && projects.length === 0 && (
                    <tr className="accordion-child">
                      <td></td>
                      <td colSpan={3} style={{paddingLeft: 28, color: 'var(--ink-faint)', fontSize: 13, fontStyle: 'italic'}}>No projects yet</td>
                      <td>
                        <button className="wf-btn sm ghost" onClick={() => setProjectModal(c.id)}>+ Add project</button>
                      </td>
                    </tr>
                  )}
                  {isOpen && projects.map(p => (
                    <tr key={p.id} className="accordion-child" style={{cursor: 'pointer'}} onClick={() => nav('/admin/projects/' + p.id)}>
                      <td style={{textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14}}>└</td>
                      <td style={{paddingLeft: 12, fontSize: 13}}>{p.name}</td>
                      <td>
                        <span className={'wf-tag ' + (p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : '')}>{p.status}</span>
                      </td>
                      <td className="muted" style={{fontSize: 12}}> {p.team.length} members · {p.updated}</td>
                      <td>
                        <button className="wf-btn sm ghost" onClick={e => { e.stopPropagation(); nav('/admin/projects/' + p.id); }}>Edit →</button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
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
            {[3,5,4,6,8,7,9,11,10,13,12,14].map((v, i) => (
              <div key={i} style={{flex: 1, height: (v * 12) + 'px', background: i === 11 ? 'var(--accent)' : 'var(--ink)', borderRadius: '4px 4px 0 0'}} />
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
