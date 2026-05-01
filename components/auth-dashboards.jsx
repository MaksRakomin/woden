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

function NewProjectModal({ availableCompanies, currentRole, lockedClientId, onClose, onCreated, presetManagerIds }) {
  const isAdmin = currentRole === 'admin';
  const myManagerName = window.WODEN.MOCK_USERS[currentRole]?.name || '';
  const myManager = window.WODEN.MANAGERS.find(m => m.name === myManagerName);
  const initialClientIds = lockedClientId ? [lockedClientId] : [];
  const initialManagerIds = presetManagerIds || (currentRole === 'manager' && myManager ? [myManager.id] : []);

  const [name, setName] = useStateL('');
  const [selectedClientIds, setSelectedClientIds] = useStateL(initialClientIds);
  const [creatingClient, setCreatingClient] = useStateL(false);
  const [newClientName, setNewClientName] = useStateL('');
  const [newClientEmail, setNewClientEmail] = useStateL('');
  const [templateId, setTemplateId] = useStateL(window.WODEN.TEMPLATES[0]?.id || '');
  const [selectedManagerIds, setSelectedManagerIds] = useStateL(initialManagerIds);

  const toggleClient = (id) => setSelectedClientIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleManager = (id) => setSelectedManagerIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const submit = () => {
    if (!name.trim()) return toast('Enter project name');
    if (!templateId) return toast('Pick a template');
    let clientIds = [...selectedClientIds];
    if (creatingClient) {
      if (!newClientName.trim() || !newClientEmail.trim()) return toast('Fill new client name and email');
      const newClient = {
        id: 'c' + Date.now(),
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        manager: myManagerName || (window.WODEN.MANAGERS[0]?.name || ''),
      };
      window.WODEN.CLIENT_COMPANIES.push(newClient);
      clientIds.push(newClient.id);
    }
    if (clientIds.length === 0) return toast('Pick or create at least one client');
    const project = {
      id: 'p' + Date.now(),
      name: name.trim(),
      clientIds,
      managerIds: selectedManagerIds,
      templateId,
      status: 'draft',
      sections: 0,
      updated: 'just now',
      team: [],
      description: '',
      preprompt: '',
      logo: null,
    };
    window.WODEN.PROJECTS.push(project);
    onCreated(project);
  };

  return (
      <div className="flex flex-col gap-3.5">
        <Field label="Project name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Brand Strategy 2026" /></Field>

        <Field label="Template">
          <Select value={templateId} onChange={e => setTemplateId(e.target.value)}>
            {window.WODEN.TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name} — {t.category}</option>)}
          </Select>
        </Field>

        <div>
          <Label>Clients</Label>
          <MultiSelect
            options={availableCompanies}
            value={selectedClientIds}
            onChange={vals => setSelectedClientIds(lockedClientId && !vals.includes(lockedClientId) ? [...vals, lockedClientId] : vals)}
            disabled={lockedClientId ? [lockedClientId] : []}
            placeholder="Choose clients..."
          />
          {!creatingClient && !lockedClientId && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setCreatingClient(true)}>+ Create new client</Button>
          )}
          {creatingClient && (
              <div className="flex flex-col gap-2 mt-2 p-3 border border-light-gray rounded-lg bg-paper-warm">
                <Field label="New client name"><Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Acme Corp" /></Field>
                <Field label="New client email"><Input value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="contact@acme.co" /></Field>
                <Button size="sm" variant="ghost" className="self-start" onClick={() => { setCreatingClient(false); setNewClientName(''); setNewClientEmail(''); }}>Cancel new client</Button>
              </div>
          )}
        </div>

        {isAdmin && (
            <div>
              <Label>Managers</Label>
              <MultiSelect
                options={window.WODEN.MANAGERS}
                value={selectedManagerIds}
                onChange={setSelectedManagerIds}
                placeholder="Choose managers..."
              />
            </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Create project</Button>
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
    nav({ admin: '/admin', manager: '/manager', client: '/client', employee: '/employee' }[r]);
  };
  return (
      <div className="min-h-screen grid place-items-center p-4 sm:p-10 bg-paper-warm animate-screen-in">
        <Card className="w-full max-w-[440px] p-6 sm:p-10">
          <div className="text-center mb-7">
            <img src="assets/woden-logo-black.svg" alt="Woden" className="h-9 mx-auto mb-2.5" />
            <div className="font-bold text-xs tracking-widest uppercase text-primary">Story is the strategy.</div>
          </div>
          <h2 className="text-center text-2xl font-bold mb-1.5">Sign in</h2>
          <p className="text-center text-ink-soft text-sm mb-5">story is the strategy.</p>
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
  const [projectModal, setProjectModal] = useStateL(false);
  const allProjects = window.WODEN.PROJECTS;

  const addManager = (data) => {
    window.WODEN.MANAGERS.push({ id: 'm' + Date.now(), ...data, clients: 0, projects: 0 });
    setTick(t => t + 1); setManagerModal(false); toast('Manager added');
  };
  const onProjectCreated = (p) => { setProjectModal(false); toast('Project created'); nav('/admin/projects/' + p.id); };

  return (
      <div className="animate-screen-in">
        {managerModal && <Modal title="New manager" onClose={() => setManagerModal(false)}><ManagerForm onSave={addManager} onClose={() => setManagerModal(false)} /></Modal>}
        {projectModal && <Modal title="New project" onClose={() => setProjectModal(false)}><NewProjectModal availableCompanies={window.WODEN.CLIENT_COMPANIES} currentRole="admin" onClose={() => setProjectModal(false)} onCreated={onProjectCreated} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Admin overview</h1>
            <p className="text-ink-soft mt-1">Everything across Woden, in one place.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="ghost" size="sm">Export CSV</Button>
            <Button variant="primary" size="sm" onClick={() => setProjectModal(true)}>+ New project</Button>
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
                <div className="font-bold text-[14px] uppercase tracking-widest text-ink-soft mt-2.5">{l}</div>
                <div className="font-mono text-xs text-primary mt-1">{d}</div>
              </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-light-gray">
              <h3 className="text-lg font-bold">Recent projects</h3>
              <span className="text-primary font-mono text-[14px] cursor-pointer hover:underline" onClick={() => nav('/admin/clients')}>VIEW ALL →</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
              <tr>{['Client', 'Project', 'Manager', 'Status', 'Team', 'Updated'].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[14px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr>
              </thead>
              <tbody>
              {allProjects.map(p => {
                const cos = window.WODEN.getProjectClients(p);
                const mgrs = window.WODEN.getProjectManagers(p);
                return (
                    <tr key={p.id} className="cursor-pointer hover:bg-super-light-gray transition-colors" onClick={() => nav('/admin/projects/' + p.id)}>
                      <td className="py-4 px-5 border-b border-light-gray font-bold">{cos[0] ? cos[0].name : ''}{cos.length > 1 ? <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-light-gray text-[12px] font-mono text-ink-soft">+{cos.length - 1}</span> : null}</td>
                      <td className="py-4 px-5 border-b border-light-gray">{p.name}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-ink-soft">{mgrs.map(m => m.name).join(', ') || (cos[0]?.manager || '')}</td>
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
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[12px] font-bold shrink-0">{a[0]}</div>
                      <div className="flex-1 text-ink-soft">{a}</div>
                      <span className="font-mono text-[12px] text-ink-faint">{i + 1}h</span>
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
  const myManager = window.WODEN.MANAGERS.find(m => m.name === managerName);
  const myManagerId = myManager?.id;
  const myCompanies = window.WODEN.CLIENT_COMPANIES.filter(c => c.manager === managerName);
  const myClientIds = myCompanies.map(c => c.id);
  const isMine = (p) => (p.managerIds || []).includes(myManagerId) || (p.clientIds || []).some(cid => myClientIds.includes(cid));
  const [projects, setProjects] = useStateL(window.WODEN.PROJECTS.filter(isMine));
  const [projectModal, setProjectModal] = useStateL(false);

  const onProjectCreated = (p) => {
    setProjects(window.WODEN.PROJECTS.filter(isMine));
    setProjectModal(false); toast('Project created');
    nav('/manager/projects/' + p.id);
  };

  return (
      <div className="animate-screen-in">
        {projectModal && <Modal title="New project" onClose={() => setProjectModal(false)}><NewProjectModal availableCompanies={window.WODEN.CLIENT_COMPANIES} currentRole="manager" onClose={() => setProjectModal(false)} onCreated={onProjectCreated} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">My projects</h1>
            <p className="text-ink-soft mt-1">Strategist workspace — {managerName}.</p>
          </div>
          <Button variant="primary" className="self-start md:self-auto" onClick={() => setProjectModal(true)}>+ New project</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {projects.map(p => {
            const cos = window.WODEN.getProjectClients(p);
            const tpl = window.WODEN.getProjectTemplate(p);
            return (
                <Card key={p.id} pad="p-5" className="cursor-pointer" onClick={() => nav('/manager/projects/' + p.id)}>
                  <div className="flex justify-between mb-1.5">
                    <Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge>
                    {tpl && <span className="font-mono text-[12px] text-ink-faint uppercase">{tpl.category}</span>}
                  </div>
                  <div className="font-mono text-[14px] text-ink-faint mb-1 truncate">{cos.map(c => c.name).join(' · ') || '—'}</div>
                  <h3 className="text-lg font-bold mb-3.5">{p.name}</h3>
                  <div className="h-2 bg-paper-warm border-[1.5px] border-light-gray rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{width: (p.sections / 14 * 100) + '%'}} />
                  </div>
                  <div className="flex gap-2 mt-3.5 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); nav('/manager/projects/' + p.id); }}>Edit</Button>
                    <Button size="sm" onClick={e => { e.stopPropagation(); nav('/preview/' + p.id); }}>Preview</Button>
                  </div>
                </Card>
            );
          })}
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
            <thead><tr>{['Client', 'Projects', ''].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[14px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr></thead>
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
  const [projects] = useStateL(window.WODEN.PROJECTS.filter(p => (p.clientIds || []).includes('c1')));

  return (
      <div className="animate-screen-in">
        <Card pad="p-5 sm:p-8" className="mb-7 bg-paper-warm">
          <div className="font-mono text-[14px] tracking-[0.15em] text-ink-faint">WELCOME BACK, ELENA</div>
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
                  <span className="font-mono text-[14px] text-ink-faint">{p.team.length} members · {p.updated}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{p.name}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={e => { e.stopPropagation(); nav('/preview/' + p.id); }}>Preview</Button>
                </div>
              </Card>
          ))}
        </div>
      </div>
  );
}

function EmployeeHome({ nav }) {
  const u = window.WODEN.MOCK_USERS.employee;
  const myEmail = u.email;
  const projects = window.WODEN.PROJECTS.filter(p => (p.team || []).includes(myEmail));

  return (
      <div className="animate-screen-in">
        <Card pad="p-5 sm:p-8" className="mb-7 bg-paper-warm">
          <div className="font-mono text-[14px] tracking-[0.15em] text-ink-faint">READ-ONLY ACCESS · {u.name.toUpperCase()}</div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2 mb-1.5">{u.company}</h1>
          <p className="text-base sm:text-lg text-ink-soft m-0">Projects you've been assigned to.</p>
        </Card>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-2xl font-bold">Projects</h2>
          <span className="font-mono text-xs text-ink-faint">{projects.length} assigned</span>
        </div>
        {projects.length === 0 ? (
            <Card pad="p-8" className="text-center">
              <p className="text-ink-soft mb-1">No projects assigned to you yet.</p>
              <p className="font-mono text-[14px] text-ink-faint">Ask your client admin to add you to a project's Team.</p>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(p => {
                const cos = window.WODEN.getProjectClients(p);
                const tpl = window.WODEN.getProjectTemplate(p);
                return (
                    <Card key={p.id} pad="p-5">
                      <div className="flex justify-between mb-2.5 flex-wrap gap-2">
                        <Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge>
                        {tpl && <span className="font-mono text-[12px] text-ink-faint uppercase self-center">{tpl.category}</span>}
                      </div>
                      <div className="font-mono text-[14px] text-ink-faint mb-1 truncate">{cos.map(c => c.name).join(' · ') || '—'}</div>
                      <h3 className="text-xl font-bold mb-4">{p.name}</h3>
                      <Button size="sm" variant="primary" onClick={() => nav('/preview/' + p.id)}>Preview →</Button>
                    </Card>
                );
              })}
            </div>
        )}
      </div>
  );
}

function EmployeeSettings() {
  const u = window.WODEN.MOCK_USERS.employee;
  const [current, setCurrent] = useStateL('');
  const [next, setNext] = useStateL('');
  const [confirm, setConfirm] = useStateL('');

  const submit = () => {
    if (!current.trim()) return toast('Enter current password');
    if (next.length < 6) return toast('New password must be 6+ chars');
    if (next !== confirm) return toast("Passwords don't match");
    setCurrent(''); setNext(''); setConfirm('');
    toast('Password updated');
  };

  return (
      <div className="animate-screen-in">
        <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight mb-5">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-3">Profile</h3>
            <div className="flex flex-col gap-3">
              <Field label="Name"><Input defaultValue={u.name} disabled /></Field>
              <Field label="Email"><Input defaultValue={u.email} disabled /></Field>
              <Field label="Company"><Input defaultValue={u.company} disabled /></Field>
              <p className="font-mono text-[12px] text-ink-faint">Profile fields are managed by your client admin.</p>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold mb-3">Change password</h3>
            <div className="flex flex-col gap-3">
              <Field label="Current password"><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} /></Field>
              <Field label="New password"><Input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="6+ characters" /></Field>
              <Field label="Confirm new password"><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></Field>
              <Button variant="primary" className="self-start mt-1" onClick={submit}>Update password</Button>
            </div>
          </Card>
        </div>
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
            <thead><tr>{['Name', 'Email', 'Clients', 'Projects', ''].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[14px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr></thead>
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
  const [tick, setTick] = useStateL(0);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const addCompany = (data) => { window.WODEN.CLIENT_COMPANIES.push({ id: 'c' + Date.now(), ...data }); setCompanies([...window.WODEN.CLIENT_COMPANIES]); setClientModal(false); toast('Client added'); };
  const onProjectCreated = (p) => { setExpanded(e => ({ ...e, [(p.clientIds[0])]: true })); setProjectModal(null); setTick(t => t + 1); toast('Project created'); };

  return (
      <div className="animate-screen-in">
        {clientModal && <Modal title="New client" onClose={() => setClientModal(false)}><CompanyForm onSave={addCompany} onClose={() => setClientModal(false)} /></Modal>}
        {projectModal && <Modal title="New project" onClose={() => setProjectModal(null)}><NewProjectModal availableCompanies={window.WODEN.CLIENT_COMPANIES} currentRole="admin" lockedClientId={projectModal} onClose={() => setProjectModal(null)} onCreated={onProjectCreated} /></Modal>}

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
            <thead><tr>{['', 'Client', 'Manager', 'Projects', ''].map((h,i) => <th key={i} className={`py-4 px-5 border-b border-contrast font-bold text-[14px] uppercase tracking-widest text-ink-soft ${i===0?'w-8':''}`}>{h}</th>)}</tr></thead>
            <tbody>
            {companies.map(c => {
              const projects = window.WODEN.PROJECTS.filter(p => (p.clientIds || []).includes(c.id));
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
                          <td colSpan={3} className="py-4 px-5 border-b border-light-gray pl-7 text-ink-faint text-sm italic">No projects yet</td>
                          <td className="py-4 px-5 border-b border-light-gray text-right"><Button size="sm" variant="ghost" onClick={() => setProjectModal(c.id)}>+ Add project</Button></td>
                        </tr>
                    )}
                    {isOpen && projects.map(p => (
                        <tr key={p.id} className="bg-super-light-gray cursor-pointer hover:bg-light-gray transition-colors animate-accordion-in" onClick={() => nav('/admin/projects/' + p.id)}>
                          <td className="py-4 px-5 border-b border-light-gray text-center text-ink-faint text-sm">└</td>
                          <td className="py-4 px-5 border-b border-light-gray pl-3 text-sm">{p.name}</td>
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

function AllProjectsTable({ nav, role = 'admin' }) {
  const [tick, setTick] = useStateL(0);
  const [projectModal, setProjectModal] = useStateL(false);
  const [filter, setFilter] = useStateL('');
  const [templateFilter, setTemplateFilter] = useStateL('');

  const isManager = role === 'manager';
  const managerName = window.WODEN.MOCK_USERS[role]?.name || '';
  const myManager = window.WODEN.MANAGERS.find(m => m.name === managerName);
  const myManagerId = myManager?.id;
  const myCompanies = window.WODEN.CLIENT_COMPANIES.filter(c => c.manager === managerName);
  const myClientIds = myCompanies.map(c => c.id);
  const isMine = (p) => (p.managerIds || []).includes(myManagerId) || (p.clientIds || []).some(cid => myClientIds.includes(cid));

  const all = isManager ? window.WODEN.PROJECTS.filter(isMine) : window.WODEN.PROJECTS;
  const f = filter.trim().toLowerCase();
  const visible = all.filter(p => {
    if (templateFilter && p.templateId !== templateFilter) return false;
    if (!f) return true;
    if (p.name.toLowerCase().includes(f)) return true;
    const cos = window.WODEN.getProjectClients(p);
    return cos.some(c => c.name.toLowerCase().includes(f));
  });

  const onProjectCreated = (p) => { setProjectModal(false); setTick(t => t + 1); toast('Project created'); nav((isManager ? '/manager/projects/' : '/admin/projects/') + p.id); };

  return (
      <div className="animate-screen-in">
        {projectModal && <Modal title="New project" onClose={() => setProjectModal(false)}><NewProjectModal availableCompanies={window.WODEN.CLIENT_COMPANIES} currentRole={role} onClose={() => setProjectModal(false)} onCreated={onProjectCreated} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Projects</h1>
            <p className="text-ink-soft mt-1">{isManager ? 'Projects assigned to you or your clients.' : 'All projects across the platform.'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
            <Input placeholder="Search projects or clients..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full sm:w-64" />
            <Select value={templateFilter} onChange={e => setTemplateFilter(e.target.value)} className="w-full sm:w-48">
              <option value="">All templates</option>
              {window.WODEN.TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Button variant="primary" onClick={() => setProjectModal(true)}>+ New project</Button>
          </div>
        </div>

        <Card pad="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left border-collapse">
              <thead><tr>{['Project', 'Clients', 'Template', 'Managers', 'Status', 'Updated', ''].map(h => <th key={h} className="py-4 px-5 border-b border-contrast font-bold text-[14px] uppercase tracking-widest text-ink-soft">{h}</th>)}</tr></thead>
              <tbody>
              {visible.map(p => {
                const cos = window.WODEN.getProjectClients(p);
                const mgrs = window.WODEN.getProjectManagers(p);
                const tpl = window.WODEN.getProjectTemplate(p);
                return (
                    <tr key={p.id} className="hover:bg-super-light-gray transition-colors">
                      <td className="py-4 px-5 border-b border-light-gray font-bold">{p.name}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-sm">
                        {cos[0] ? cos[0].name : '—'}
                        {cos.length > 1 && <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-light-gray text-[12px] font-mono text-ink-soft">+{cos.length - 1}</span>}
                      </td>
                      <td className="py-4 px-5 border-b border-light-gray font-mono text-[14px] text-ink-soft uppercase">{tpl ? tpl.category : '—'}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-sm text-ink-soft">{mgrs.map(m => m.name).join(', ') || '—'}</td>
                      <td className="py-4 px-5 border-b border-light-gray"><Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'}>{p.status}</Badge></td>
                      <td className="py-4 px-5 border-b border-light-gray text-ink-soft text-xs">{p.updated}</td>
                      <td className="py-4 px-5 border-b border-light-gray text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => nav('/preview/' + p.id)}>Preview</Button>
                          <Button size="sm" variant="ghost" onClick={() => nav((isManager ? '/manager/projects/' : '/admin/projects/') + p.id)}>Edit →</Button>
                        </div>
                      </td>
                    </tr>
                );
              })}
              {visible.length === 0 && (
                  <tr><td colSpan={7} className="py-10 px-5 text-center text-ink-faint italic">No projects match.</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );
}

function TemplatesPage() {
  const [templates, setTemplates] = useStateL([...window.WODEN.TEMPLATES]);
  const [modal, setModal] = useStateL(null);

  const save = (data) => {
    if (modal === 'add') {
      const t = { id: 't-' + Date.now(), ...data };
      window.WODEN.TEMPLATES.push(t); toast('Template added');
    } else {
      const i = window.WODEN.TEMPLATES.findIndex(t => t.id === modal.id);
      if (i >= 0) { window.WODEN.TEMPLATES[i] = { ...window.WODEN.TEMPLATES[i], ...data }; toast('Template updated'); }
    }
    setTemplates([...window.WODEN.TEMPLATES]); setModal(null);
  };

  return (
      <div className="animate-screen-in">
        {modal && <Modal title={modal === 'add' ? 'New template' : 'Edit template'} onClose={() => setModal(null)}><TemplateForm initial={modal === 'add' ? null : modal} onSave={save} onClose={() => setModal(null)} /></Modal>}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Templates</h1>
            <p className="text-ink-soft mt-1">Predefined industry templates used when creating new projects.</p>
          </div>
          <Button variant="primary" className="self-start md:self-auto" onClick={() => setModal('add')}>+ New template</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
              <Card key={t.id} pad="p-5">
                <div className="flex justify-between items-start mb-2">
                  <Badge>{t.category}</Badge>
                  <Button size="sm" variant="ghost" className="px-2 py-1" onClick={() => setModal(t)}>Edit</Button>
                </div>
                <h3 className="text-lg font-bold mb-1.5">{t.name}</h3>
                <p className="text-ink-soft text-sm leading-[1.6]">{t.description}</p>
                <div className="mt-3 font-mono text-[12px] text-ink-faint">{window.WODEN.PROJECTS.filter(p => p.templateId === t.id).length} projects use this</div>
              </Card>
          ))}
        </div>
      </div>
  );
}

function TemplateForm({ initial, onSave, onClose }) {
  const [name, setName] = useStateL(initial ? initial.name : '');
  const [category, setCategory] = useStateL(initial ? initial.category : 'it');
  const [description, setDescription] = useStateL(initial ? initial.description : '');
  const save = () => {
    if (!name.trim() || !category.trim()) return toast('Fill name and category');
    onSave({ name: name.trim(), category: category.trim(), description: description.trim() });
  };
  return (
      <div className="flex flex-col gap-3.5">
        <Field label="Name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="IT Company" /></Field>
        <Field label="Category">
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="it">it</option>
            <option value="management">management</option>
            <option value="manufacturing">manufacturing</option>
            <option value="consumer">consumer</option>
            <option value="other">other</option>
          </Select>
        </Field>
        <Field label="Description">
          <textarea className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description of when to use this template..." />
        </Field>
        <div className="flex flex-wrap justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? 'Save changes' : 'Add template'}</Button>
        </div>
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
            <div className="flex justify-between font-mono text-[12px] text-ink-soft mt-2"><span>JAN</span><span>DEC</span></div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold mb-3">Chat sessions (last 30d)</h3>
            <Rect label="Line chart placeholder" h={180} />
          </Card>
        </div>
      </div>
  );
}

function ClientEmployees({ nav }) {
  const clientId = 'c1';
  const myProjects = window.WODEN.PROJECTS.filter(p => (p.clientIds || []).includes(clientId));

  // Derive employees list from all project teams + seed with known employee
  const seedEmails = ['david@meridian.co', 'rachel@meridian.co', 'elena@meridian.co'];
  const allEmails = new Set(seedEmails);
  myProjects.forEach(p => (p.team || []).forEach(e => allEmails.add(e)));

  const [employees, setEmployees] = useStateL([...allEmails]);
  const [inviteEmail, setInviteEmail] = useStateL('');
  const [assignModal, setAssignModal] = useStateL(null); // email being assigned
  const [tick, setTick] = useStateL(0);

  const addEmployee = () => {
    const v = inviteEmail.trim().toLowerCase();
    if (!v || !v.includes('@')) return toast('Enter a valid email');
    if (employees.includes(v)) return toast('Already added');
    setEmployees(e => [...e, v]);
    setInviteEmail('');
    toast('Employee invited');
  };

  const removeEmployee = (email) => {
    // Remove from all project teams
    myProjects.forEach(p => { p.team = (p.team || []).filter(e => e !== email); });
    setEmployees(e => e.filter(x => x !== email));
    setTick(t => t + 1);
    toast('Employee removed');
  };

  const getAssignedProjects = (email) => myProjects.filter(p => (p.team || []).includes(email));

  return (
      <div className="animate-screen-in">
        {assignModal && (
            <Modal title={`Assign ${assignModal.split('@')[0]}`} onClose={() => setAssignModal(null)}>
              <AssignProjectsModal email={assignModal} projects={myProjects} onClose={() => { setAssignModal(null); setTick(t => t + 1); }} />
            </Modal>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5">
          <div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Employees</h1>
            <p className="text-ink-soft mt-1">Manage who has access and which projects they're on.</p>
          </div>
          <span className="font-mono text-xs text-ink-faint self-start md:self-auto">{employees.length} member{employees.length !== 1 ? 's' : ''}</span>
        </div>

        <Card className="mb-6">
          <h3 className="text-lg font-bold mb-3">Invite employee</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="name@company.co"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEmployee()}
              className="flex-1"
            />
            <Button variant="primary" onClick={addEmployee}>Invite</Button>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          {employees.map(email => {
            const assigned = getAssignedProjects(email);
            const initials = email[0].toUpperCase();
            return (
                <Card key={email} pad="p-4 sm:p-5" className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{email.split('@')[0]}</div>
                    <div className="font-mono text-ink-soft text-[14px] truncate">{email}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {assigned.length === 0
                        ? <span className="font-mono text-[12px] text-ink-faint uppercase">Not assigned to any project</span>
                        : assigned.map(p => <Badge key={p.id} variant="soft">{p.name}</Badge>)
                      }
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <Button size="sm" variant="primary" onClick={() => setAssignModal(email)}>Assign to project</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeEmployee(email)}>Remove</Button>
                  </div>
                </Card>
            );
          })}
          {employees.length === 0 && (
              <Card pad="p-8" className="text-center">
                <p className="text-ink-soft mb-1">No employees yet.</p>
                <p className="font-mono text-[14px] text-ink-faint">Invite someone above to get started.</p>
              </Card>
          )}
        </div>
      </div>
  );
}

function AssignProjectsModal({ email, projects, onClose }) {
  const [tick, setTick] = useStateL(0);

  const toggle = (project) => {
    const team = project.team || [];
    if (team.includes(email)) {
      project.team = team.filter(e => e !== email);
    } else {
      project.team = [...team, email];
    }
    setTick(t => t + 1);
  };

  return (
      <div className="flex flex-col gap-3">
        <p className="text-ink-soft text-sm mb-1">Toggle which projects <span className="font-bold text-contrast">{email}</span> is assigned to.</p>
        {projects.map(p => {
          const assigned = (p.team || []).includes(email);
          return (
              <button key={p.id} type="button" onClick={() => toggle(p)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 border-2 rounded-xl text-left transition-colors w-full ${assigned ? 'border-contrast bg-contrast text-base' : 'border-light-gray bg-base text-contrast hover:border-contrast'}`}>
                <div>
                  <div className="font-bold text-sm">{p.name}</div>
                  <Badge variant={p.status === 'published' ? 'accent' : p.status === 'review' ? 'soft' : 'default'} className={assigned ? 'border-white/30' : ''}>{p.status}</Badge>
                </div>
                <span className={`font-bold text-xs uppercase tracking-widest shrink-0 ${assigned ? 'text-base' : 'text-primary'}`}>{assigned ? '✓ Assigned' : '+ Assign'}</span>
              </button>
          );
        })}
        <div className="flex justify-end mt-2">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
  );
}

Object.assign(window, { Login, AdminDash, ManagerDash, ClientDash, EmployeeHome, EmployeeSettings, ManagersTable, ClientsTable, AllProjectsTable, TemplatesPage, StatsPage, NewProjectModal, ClientEmployees });
