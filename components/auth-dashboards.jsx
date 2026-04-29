const { useState: useStateL } = React;

// ─── Shared Form Components ───────────────────────────────────────────────────

function ManagerForm({ initial, onSave, onClose }) {
  const [name, setName] = useStateL(initial ? initial.name : '');
  const [email, setEmail] = useStateL(initial ? initial.email : '');
  const save = () => {
    if (!name.trim() || !email.trim()) return toast('Fill all fields');
    onSave({ name: name.trim(), email: email.trim() });
  };
  return (
      <div className="flex flex-col gap-3.5">
        <Field label="Full name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" /></Field>
        <Field label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@woden.co" /></Field>
        <div className="flex flex-wrap justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? 'Save changes' : 'Add manager'}</Button>
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
      <div className="flex flex-col gap-3.5">
        <Field label="Company name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" /></Field>
        <Field label="Assign manager">
          <Select value={manager} onChange={e => setManager(e.target.value)}>
            {window.WODEN.MANAGERS.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </Select>
        </Field>
        <div className="flex flex-wrap justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Add client</Button>
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
      <div className="flex flex-col gap-3.5">
        <Field label="Project name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Brand Strategy 2025" /></Field>
        <Field label="Client company">
          <Select value={clientId} onChange={e => setClientId(e.target.value)}>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <div className="flex flex-wrap justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Create project</Button>
        </div>
      </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function Login({ setRole, nav }) {
  const [email, setEmail] = useStateL('sarah@woden.co');
  const [pwd, setPwd] = useStateL('••••••••');
  const go = (r) => {
    setRole(r);
    nav({ admin: '/admin', manager: '/manager', client: '/client', employee: '/employee/storyguide' }[r]);
  };
  return (
      <div className="min-h-screen grid place-items-center p-4 sm:p-10 bg-paper-warm animate-screen-in">
        <Card className="w-full max-w-[440px] p-6 sm:p-10">
          <div className="text-center mb-7">
            <img src="assets/woden-logo-black.svg" alt="Woden" className="h-9 mx-auto mb-2.5" />
            <div className="font-bold text-xs tracking-widest uppercase text-primary">Story is the strategy.</div>
          </div>
          <h2 className="text-center text-2xl font-bold mb-1.5">Sign in</h2>
          <p className="text-center text-ink-soft text-[13px] mb-5">story is the strategy.</p>
          <div className="flex flex-col gap-3.5">
            <Field label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <Field label="Password"><Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} /></Field>
            <Button variant="primary" size="lg" className="w-full mt-2" onClick={() => go('admin')}>Sign in →</Button>
          </div>
          <div className="my-6 border-t border-light-gray"></div>
          <Label className="text-center">Or demo as</Label>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button size="sm" onClick={() => go('admin')}>Admin</Button>
            <Button size="sm" onClick={() => go('manager')}>Manager</Button>
            <Button size="sm" onClick={() => go('client')}>Client</Button>
            <Button size="sm" onClick={() => go('employee')}>Employee</Button>
          </div>
          <Note className="hidden sm:block absolute -top-7 -right-20 rotate-6 text-center">any button works,<br/>it's a demo!</Note>
        </Card>
      </div>
  );
}

function AdminDash({ nav }) {
  const [tick, setTick] = useStateL(0);
  const [managerModal, setManagerModal] = useStateL(false);
  const allProjects = window.WODEN.PROJECTS;
  const getCompany = (clientId) => window.WODEN.CLIENT_COMPANIES.find(c => c.id === clientId);

  const addManager = (data) => {
    window.WODEN.MANAGERS.push({ id: 'm' + Date.now(), ...data, clients: 0, projects: 0 });
    setTick(t => t + 1); setManagerModal(false); toast('Manager added');
  };

  return (
      <div className="animate-screen-in">
        {managerModal && <Modal title="New manager" onClose={() => setManagerModal(false)}><ManagerForm onSave={addManager} onClose={() => setManagerModal(false)} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Admin overview</h1>
            <p className="text-ink-soft mt-1">Everything across Woden, in one place.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="ghost" size="sm">Export CSV</Button>
            <Button variant="primary" size="sm" onClick={() => setManagerModal(true)}>+ New manager</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          {[
            [String(allProjects.length), 'Active projects', '+2 this week'],
            [String(window.WODEN.CLIENT_COMPANIES.length), 'Client companies', '+1'],
            [String(window.WODEN.MANAGERS.length), 'Managers', '—'],
            ['412', 'Chat sessions', '+48'],
          ].map(([n, l, d]) => (
              <Card key={l} pad="p-6">
                <div className="font-sans text-[2.75rem] font-extrabold leading-none tracking-tight">{n}</div>
                <div className="font-bold text-[11px] uppercase tracking-widest text-ink-soft mt-2.5">{l}</div>
                <div className="font-mono text-xs text-primary mt-1">{d}</div>
              </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-light-gray">
              <h3 className="text-lg font-bold">Recent projects</h3>
              <span className="text-primary font-mono text-[11px] cursor-pointer hover:underline" onClick={() => nav('/admin/clients')}>VIEW ALL →</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
              <tr>{['Client', 'Project', 'Manager', 'Status', 'Team', 'Updated'].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[11px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr>
              </thead>
              <tbody>
              {allProjects.map(p => {
                const co = getCompany(p.clientId);
                return (
                    <tr key={p.id} className="cursor-pointer hover:bg-super-light-gray transition-colors" onClick={() => nav('/admin/projects/' + p.id)}>
                      <td className="py-4 px-5 border-b border-light-gray font-bold">{co ? co.name : ''}</td>
                      <td className="py-4 px-5 border-b border-light-gray">{p.name}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-ink-soft">{co ? co.manager : ''}</td>
                      <td className="py-4 px-5 border-b border-light-gray"><Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge></td>
                      <td className="py-4 px-5 border-b border-light-gray font-mono text-xs">{p.team.length}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-ink-soft">{p.updated}</td>
                    </tr>
                );
              })}
              </tbody>
            </table>
            </div>
          </Card>
          <div className="flex flex-col gap-6">
            <Card>
              <h3 className="text-lg font-bold mb-3">Activity feed</h3>
              <div className="flex flex-col gap-2.5">
                {['Marcus published Meridian v1.3','Priya invited 2 clients','David opened chat 14x','Elena changed theme — Night','Jonah created Forgeworks'].map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[13px]">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">{a[0]}</div>
                      <div className="flex-1 text-ink-soft">{a}</div>
                      <span className="font-mono text-[10px] text-ink-faint">{i + 1}h</span>
                    </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold mb-3">System</h3>
              <Button variant="ghost" size="sm" onClick={() => { localStorage.clear(); toast('Demo data reset'); }}>Reset demo data</Button>
            </Card>
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

  const getCompanyName = (clientId) => window.WODEN.CLIENT_COMPANIES.find(c => c.id === clientId)?.name || '';
  const addProject = (data) => {
    window.WODEN.PROJECTS.push({ id: 'p' + Date.now(), ...data, status: 'draft', sections: 0, updated: 'just now', team: [] });
    setProjects(window.WODEN.PROJECTS.filter(p => myClientIds.includes(p.clientId)));
    setProjectModal(false); toast('Project created');
  };

  return (
      <div className="animate-screen-in">
        {projectModal && <Modal title="New project" onClose={() => setProjectModal(false)}><ProjectForm companies={myCompanies} onSave={addProject} onClose={() => setProjectModal(false)} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">My projects</h1>
            <p className="text-ink-soft mt-1">Strategist workspace — {managerName}.</p>
          </div>
          <Button variant="primary" className="self-start md:self-auto" onClick={() => setProjectModal(true)}>+ New project</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {projects.map(p => (
              <Card key={p.id} pad="p-5" className="cursor-pointer" onClick={() => nav('/manager/projects/' + p.id + '/edit')}>
                <div className="flex justify-between mb-1.5">
                  <Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge>
                </div>
                <div className="font-mono text-[11px] text-ink-faint mb-1">{getCompanyName(p.clientId)}</div>
                <h3 className="text-lg font-bold mb-3.5">{p.name}</h3>
                <div className="h-2 bg-paper-warm border-[1.5px] border-light-gray rounded overflow-hidden">
                  <div className="h-full bg-primary" style={{width: (p.sections / 14 * 100) + '%'}} />
                </div>
                <div className="flex gap-2 mt-3.5">
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); nav('/manager/projects/' + p.id + '/edit'); }}>Edit</Button>
                  <Button size="sm" onClick={e => { e.stopPropagation(); nav('/client/storyguide'); }}>Preview</Button>
                </div>
              </Card>
          ))}
          {projects.length === 0 && (
              <Card pad="p-8" className="text-center col-span-full">
                <p className="text-ink-soft mb-3">No projects yet.</p>
                <Button variant="primary" size="sm" onClick={() => setProjectModal(true)}>+ New project</Button>
              </Card>
          )}
        </div>

        <Card pad="p-0" className="overflow-hidden">
          <div className="p-5 border-b border-light-gray"><h3 className="text-lg font-bold">My clients</h3></div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left border-collapse">
            <thead><tr>{['Client', 'Projects', ''].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[11px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr></thead>
            <tbody>
            {myCompanies.map(c => {
              const count = window.WODEN.PROJECTS.filter(p => p.clientId === c.id).length;
              return (
                  <tr key={c.id} className="hover:bg-super-light-gray transition-colors">
                    <td className="py-4 px-5 border-b border-light-gray font-bold">{c.name}</td>
                    <td className="py-4 px-5 border-b border-light-gray font-mono text-xs">{count}</td>
                    <td className="py-4 px-5 border-b border-light-gray text-right"><Button size="sm" variant="ghost" onClick={() => nav('/manager/projects/' + c.id + '/edit')}>Open →</Button></td>
                  </tr>
              );
            })}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
  );
}

function ClientDash({ nav }) {
  const u = window.WODEN.MOCK_USERS.client;
  const [projects] = useStateL(window.WODEN.PROJECTS.filter(p => p.clientId === 'c1'));

  return (
      <div className="animate-screen-in">
        <Card pad="p-5 sm:p-8" className="mb-7 bg-paper-warm">
          <div className="font-mono text-[11px] tracking-[0.15em] text-ink-faint">WELCOME BACK, ELENA</div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2 mb-1.5">{u.company}</h1>
          <p className="text-base sm:text-lg text-ink-soft m-0">"{window.WODEN.MERIDIAN.tagline}"</p>
          <Note className="hidden sm:block absolute -top-4 right-6 rotate-3">your projects</Note>
        </Card>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-2xl font-bold">Projects</h2>
          <span className="font-mono text-xs text-ink-faint">{projects.length} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
              <Card key={p.id} pad="p-5" className="cursor-pointer" onClick={() => nav('/client/projects/' + p.id)}>
                <div className="flex justify-between mb-2.5">
                  <Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge>
                  <span className="font-mono text-[11px] text-ink-faint">{p.team.length} members · {p.updated}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{p.name}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={e => { e.stopPropagation(); nav('/client/projects/' + p.id); }}>Open StoryGuide →</Button>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); nav('/client/team/' + p.id); }}>Team</Button>
                </div>
              </Card>
          ))}
        </div>
      </div>
  );
}

function EmployeeHome({ nav }) {
  return (
      <div className="animate-screen-in">
        <Card pad="p-6 sm:p-10" className="text-center">
          <div className="font-mono text-[11px] tracking-[0.15em] text-ink-faint">READ-ONLY ACCESS</div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2.5">Meridian Coffee Co.</h1>
          <p className="text-ink-soft mb-5">Your company's StoryGuide + AI chat.</p>
          <Button variant="primary" size="lg" onClick={() => nav('/employee/storyguide')}>Open StoryGuide →</Button>
        </Card>
      </div>
  );
}

function ManagersTable() {
  const [managers, setManagers] = useStateL([...window.WODEN.MANAGERS]);
  const [modal, setModal] = useStateL(null);

  const saveManager = (data) => {
    if (modal === 'add') {
      window.WODEN.MANAGERS.push({ id: 'm' + Date.now(), ...data, clients: 0, projects: 0 });
      toast('Manager added');
    } else {
      const updated = window.WODEN.MANAGERS.map(m => m.id === modal.id ? { ...m, ...data } : m);
      window.WODEN.MANAGERS.splice(0, window.WODEN.MANAGERS.length, ...updated);
      toast('Manager updated');
    }
    setManagers([...window.WODEN.MANAGERS]); setModal(null);
  };

  return (
      <div className="animate-screen-in">
        {modal && <Modal title={modal === 'add' ? 'New manager' : 'Edit manager'} onClose={() => setModal(null)}><ManagerForm initial={modal === 'add' ? null : modal} onSave={saveManager} onClose={() => setModal(null)} /></Modal>}
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Managers</h1>
          <Button variant="primary" className="self-start md:self-auto" onClick={() => setModal('add')}>+ Add manager</Button>
        </div>
        <Card pad="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead><tr>{['Name', 'Email', 'Clients', 'Projects', ''].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[11px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr></thead>
            <tbody>
            {managers.map(m => (
                <tr key={m.id} className="hover:bg-super-light-gray transition-colors">
                  <td className="py-4 px-5 border-b border-light-gray font-bold">{m.name}</td>
                  <td className="py-4 px-5 border-b border-light-gray font-mono text-xs">{m.email}</td>
                  <td className="py-4 px-5 border-b border-light-gray">{m.clients}</td>
                  <td className="py-4 px-5 border-b border-light-gray">{m.projects}</td>
                  <td className="py-4 px-5 border-b border-light-gray text-right"><Button size="sm" variant="ghost" onClick={() => setModal(m)}>Edit</Button></td>
                </tr>
            ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
  );
}

function ClientsTable({ nav }) {
  const [companies, setCompanies] = useStateL([...window.WODEN.CLIENT_COMPANIES]);
  const [expanded, setExpanded] = useStateL({});
  const [clientModal, setClientModal] = useStateL(false);
  const [projectModal, setProjectModal] = useStateL(null);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const addCompany = (data) => { window.WODEN.CLIENT_COMPANIES.push({ id: 'c' + Date.now(), ...data }); setCompanies([...window.WODEN.CLIENT_COMPANIES]); setClientModal(false); toast('Client added'); };
  const addProject = (data) => { window.WODEN.PROJECTS.push({ id: 'p' + Date.now(), ...data, status: 'draft', sections: 0, updated: 'just now', team: [] }); setExpanded(e => ({ ...e, [data.clientId]: true })); setProjectModal(null); toast('Project created'); };

  return (
      <div className="animate-screen-in">
        {clientModal && <Modal title="New client" onClose={() => setClientModal(false)}><CompanyForm onSave={addCompany} onClose={() => setClientModal(false)} /></Modal>}
        {projectModal && <Modal title="New project" onClose={() => setProjectModal(null)}><ProjectForm companies={window.WODEN.CLIENT_COMPANIES.filter(c => c.id === projectModal)} onSave={addProject} onClose={() => setProjectModal(null)} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Clients</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
            <Input placeholder="Search clients..." className="w-full sm:w-56" />
            <Button variant="primary" onClick={() => setClientModal(true)}>+ New client</Button>
          </div>
        </div>
        <Card pad="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead><tr>{['', 'Client', 'Manager', 'Projects', ''].map((h,i) => <th key={i} className={`py-4 px-5 border-b border-contrast font-bold text-[11px] uppercase tracking-widest text-ink-soft ${i===0?'w-8':''}`}>{h}</th>)}</tr></thead>
            <tbody>
            {companies.map(c => {
              const projects = window.WODEN.PROJECTS.filter(p => p.clientId === c.id);
              const isOpen = !!expanded[c.id];
              return (
                  <React.Fragment key={c.id}>
                    <tr className={`cursor-pointer transition-colors hover:bg-super-light-gray ${isOpen ? 'bg-super-light-gray' : ''}`} onClick={() => toggle(c.id)}>
                      <td className="py-4 px-5 border-b border-light-gray text-center text-primary font-bold text-xs">{isOpen ? '▾' : '▸'}</td>
                      <td className="py-4 px-5 border-b border-light-gray font-bold">{c.name}</td>
                      <td className="py-4 px-5 border-b border-light-gray">{c.manager}</td>
                      <td className="py-4 px-5 border-b border-light-gray font-mono text-xs">{projects.length} project{projects.length !== 1 ? 's' : ''}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setProjectModal(c.id); }}>+ Project</Button>
                          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); nav('/admin/projects/' + c.id); }}>Open →</Button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && projects.length === 0 && (
                        <tr className="bg-super-light-gray animate-accordion-in">
                          <td className="border-b border-light-gray"></td>
                          <td colSpan={3} className="py-4 px-5 border-b border-light-gray pl-7 text-ink-faint text-[13px] italic">No projects yet</td>
                          <td className="py-4 px-5 border-b border-light-gray text-right"><Button size="sm" variant="ghost" onClick={() => setProjectModal(c.id)}>+ Add project</Button></td>
                        </tr>
                    )}
                    {isOpen && projects.map(p => (
                        <tr key={p.id} className="bg-super-light-gray cursor-pointer hover:bg-light-gray transition-colors animate-accordion-in" onClick={() => nav('/admin/projects/' + p.id)}>
                          <td className="py-4 px-5 border-b border-light-gray text-center text-ink-faint text-sm">└</td>
                          <td className="py-4 px-5 border-b border-light-gray pl-3 text-[13px]">{p.name}</td>
                          <td className="py-4 px-5 border-b border-light-gray"><Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge></td>
                          <td className="py-4 px-5 border-b border-light-gray text-ink-soft text-xs">{p.team.length} members · {p.updated}</td>
                          <td className="py-4 px-5 border-b border-light-gray text-right"><Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); nav('/admin/projects/' + p.id); }}>Edit →</Button></td>
                        </tr>
                    ))}
                  </React.Fragment>
              );
            })}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
  );
}

function StatsPage() {
  return (
      <div className="animate-screen-in">
        <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight mb-5">Platform stats</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-3">Projects by month</h3>
            <div className="flex items-end gap-2 h-[180px] px-2">
              {[3,5,4,6,8,7,9,11,10,13,12,14].map((v, i) => (
                  <div key={i} className={`flex-1 rounded-t ${i === 11 ? 'bg-primary' : 'bg-contrast'}`} style={{height: (v * 12) + 'px'}} />
              ))}
            </div>
            <div className="flex justify-between font-mono text-[10px] text-ink-soft mt-2"><span>JAN</span><span>DEC</span></div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold mb-3">Chat sessions (last 30d)</h3>
            <Rect label="Line chart placeholder" h={180} />
          </Card>
        </div>
      </div>
  );
}

Object.assign(window, { Login, AdminDash, ManagerDash, ClientDash, EmployeeHome, ManagersTable, ClientsTable, StatsPage });
