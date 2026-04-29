const { useState: useStateA, useEffect: useEffectA } = React;

const DEFAULT_TWEAKS = { "navPattern": "toc", "rhythm": "editorial", "chatMode": "slideover", "showAnnotations": true };

function App() {
  const [route, nav] = useRoute();
  const [role, setRole] = useRole();
  const [tweaksVisible, setTweaksVisible] = useStateA(false);
  const [tweaks, setTweaks] = useStateA(() => { try { return { ...DEFAULT_TWEAKS, ...JSON.parse(localStorage.getItem('wdn-tweaks') || '{}') }; } catch { return DEFAULT_TWEAKS; } });
  const [chatOpen, setChatOpen] = useStateA(false);
  const [sgSearch, setSgSearch] = useStateA('');
  const [mobileNavOpen, setMobileNavOpen] = useStateA(false);

  useEffectA(() => { localStorage.setItem('wdn-tweaks', JSON.stringify(tweaks)); }, [tweaks]);
  useEffectA(() => { setMobileNavOpen(false); }, [route]);

  if (!role || route === '/login') return <><Login setRole={setRole} nav={nav} /><ToastHost /></>;

  const renderScreen = () => {
    if (route === '/admin') return <AdminDash nav={nav} />;
    if (route === '/admin/managers') return <ManagersTable />;
    if (route === '/admin/clients') return <ClientsTable nav={nav} />;
    if (route === '/admin/projects') return <AllProjectsTable nav={nav} role="admin" />;
    if (route === '/admin/templates') return <TemplatesPage />;
    if (route.startsWith('/admin/projects/')) return <ProjectEditor nav={nav} projectId={route.split('/')[3]} role="admin" />;
    if (route === '/admin/stats') return <StatsPage />;
    if (route === '/manager') return <ManagerDash nav={nav} />;
    if (route === '/manager/projects') return <AllProjectsTable nav={nav} role="manager" />;
    if (route.startsWith('/manager/projects/')) return <ProjectEditor nav={nav} projectId={route.split('/')[3]} role="manager" />;
    if (route === '/manager/clients') return <ClientsTable nav={nav} />;
    if (route === '/manager/templates') return <TemplatesPage />;
    if (route === '/client') return <ClientDash nav={nav} />;
    if (route === '/client/employees') return <ClientEmployees nav={nav} />;
    if (route.endsWith('/edit') && route.startsWith('/client/projects/')) return <ProjectEditor nav={nav} projectId={route.split('/')[3]} role="client" />;
    if (route === '/client/storyguide' || route.startsWith('/client/projects/')) return <StoryGuide search={sgSearch} onSearchChange={setSgSearch} />;
    if (route === '/client/settings') return <ClientSettings />;
    if (route === '/employee') return <EmployeeHome nav={nav} />;
    if (route === '/employee/settings') return <EmployeeSettings />;
    if (route === '/employee/storyguide') return <StoryGuide readOnly search={sgSearch} onSearchChange={setSgSearch} />;
    if (route.startsWith('/preview/')) return <StoryGuide readOnly search={sgSearch} onSearchChange={setSgSearch} />;
    return <NotFound nav={nav} />;
  };

  const isSgRoute = route === '/client/storyguide' || route === '/employee/storyguide' || route.startsWith('/preview/');
  const isSgSearch = isSgRoute || route.includes('storyguide');

  return (
      <div className="flex min-h-screen bg-base text-contrast font-sans">
        {role && !isSgRoute && <SideNav role={role} route={route} nav={nav} onLogout={() => { setRole(null); nav('/login'); }} mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen} />}
        <div className={`flex-1 flex flex-col min-w-0 ${isSgRoute ? 'h-screen overflow-hidden' : ''}`}>
          {role && <SubBar route={route} role={role} search={isSgSearch ? sgSearch : null} onSearch={isSgSearch ? setSgSearch : null} onMenuClick={!isSgRoute ? () => setMobileNavOpen(true) : null} />}
          <main className={`flex-1 w-full max-w-[1400px] mx-auto ${isSgRoute ? 'p-0 max-w-none overflow-hidden' : 'p-4 md:p-10'}`}>
            {renderScreen()}
          </main>
        </div>
        <RoleSwitcher role={role} setRole={setRole} nav={nav} chatOpen={chatOpen} />
        {tweaksVisible && <Tweaks tweaks={tweaks} set={(k,v) => setTweaks({...tweaks, [k]:v})} onClose={() => setTweaksVisible(false)} />}
        <ToastHost />
      </div>
  );
}

function ClientSettings() {
  return (
      <div className="animate-screen-in">
        <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight mb-5">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-3">Profile</h3>
            <div className="flex flex-col gap-3">
              <Field label="Name"><Input defaultValue="Elena Vasquez" /></Field>
              <Field label="Email"><Input defaultValue="elena@meridian.co" /></Field>
              <Button variant="primary" className="self-start mt-1" onClick={() => toast('Profile saved')}>Save</Button>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold mb-3">Password</h3>
            <div className="flex flex-col gap-3">
              <Field label="Current"><Input type="password" defaultValue="••••••••"/></Field>
              <Field label="New"><Input type="password" defaultValue=""/></Field>
              <Button className="self-start mt-1" onClick={() => toast('Password updated')}>Update</Button>
            </div>
          </Card>
        </div>
      </div>
  );
}

function NotFound({ nav }) {
  return (
      <div className="animate-screen-in text-center p-20">
        <h1 className="text-[80px] font-bold leading-none">404</h1>
        <p className="text-ink-soft mb-5">That route doesn't exist in the wireframe.</p>
        <Button variant="primary" onClick={() => nav('/login')}>Back to start</Button>
      </div>
  );
}

function Tweaks({ tweaks, set, onClose }) {
  const Opt = ({ k, v, label }) => <button className={`px-3 py-1.5 border border-contrast rounded-full font-bold text-[11px] uppercase tracking-widest transition-colors ${tweaks[k] === v ? 'bg-primary text-black border-primary' : 'bg-base text-contrast hover:bg-super-light-gray'}`} onClick={() => set(k, v)}>{label}</button>;
  return (
      <div className="fixed top-[76px] right-3 left-3 w-auto sm:left-auto sm:right-6 sm:w-[300px] bg-base border border-light-gray rounded-[24px] shadow-lg z-[90] max-h-[calc(100vh-120px)] overflow-y-auto">
        <h4 className="p-4 border-b border-light-gray bg-super-light-gray m-0 flex justify-between items-center rounded-t-[24px] font-bold text-sm uppercase tracking-wider">
          <span>Tweaks</span><Button variant="ghost" size="sm" className="px-2 py-1" onClick={onClose}>✕</Button>
        </h4>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2"><Label>Nav pattern</Label><div className="flex flex-wrap gap-1.5"><Opt k="navPattern" v="toc" label="Sticky ToC" /><Opt k="navPattern" v="scrollspy" label="Scroll-spy" /></div></div>
          <div className="flex flex-col gap-2"><Label>Section rhythm</Label><div className="flex flex-wrap gap-1.5"><Opt k="rhythm" v="editorial" label="Editorial" /><Opt k="rhythm" v="centered" label="Centered" /></div></div>
          <p className="text-ink-soft text-[11px] m-0">Toggle via the Tweaks button in the top toolbar.</p>
        </div>
      </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
