// Main app: router + tweaks panel
const { useState: useStateA, useEffect: useEffectA } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "navPattern": "toc",
  "rhythm": "editorial",
  "chatMode": "slideover",
  "showAnnotations": true
}/*EDITMODE-END*/;

function App() {
  const [route, nav] = useRoute();
  const [role, setRole] = useRole();
  const [tweaksVisible, setTweaksVisible] = useStateA(false);
  const [tweaks, setTweaks] = useStateA(() => {
    try { return { ...DEFAULT_TWEAKS, ...JSON.parse(localStorage.getItem('wdn-tweaks') || '{}') }; }
    catch { return DEFAULT_TWEAKS; }
  });
  const [chatOpen, setChatOpen] = useStateA(false);

  useEffectA(() => { localStorage.setItem('wdn-tweaks', JSON.stringify(tweaks)); }, [tweaks]);

  // listen for chat-open events to shift role switcher
  useEffectA(() => {
    const o = () => setChatOpen(true);
    const watch = setInterval(() => {
      const panel = document.querySelector('.chat-panel');
      setChatOpen(!!(panel && panel.classList.contains('open')));
    }, 200);
    window.addEventListener('open-chat', o);
    return () => { clearInterval(watch); window.removeEventListener('open-chat', o); };
  }, []);

  // edit-mode protocol
  useEffectA(() => {
    const fn = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweaksVisible(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', fn);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', fn);
  }, []);

  const updateTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch {}
  };

  // route guards — bounce to login if no role
  useEffectA(() => {
    if (!role && route !== '/login') nav('/login');
  }, [role, route]);

  if (!role || route === '/login') {
    return <>
      <Login setRole={setRole} nav={nav} />
      <ToastHost />
    </>;
  }

  const renderScreen = () => {
    // admin
    if (route === '/admin') return <AdminDash nav={nav} />;
    if (route === '/admin/managers') return <ManagersTable />;
    if (route === '/admin/clients') return <ClientsTable nav={nav} />;
    if (route.startsWith('/admin/projects/')) {
      const id = route.split('/')[3];
      return <ProjectEditor nav={nav} projectId={id} />;
    }
    if (route === '/admin/stats') return <StatsPage />;
    // manager
    if (route === '/manager') return <ManagerDash nav={nav} />;
    if (route === '/manager/projects') return <ManagerDash nav={nav} />;
    if (route.startsWith('/manager/projects/')) {
      const id = route.split('/')[3];
      return <ProjectEditor nav={nav} projectId={id} />;
    }
    if (route === '/manager/clients') return <ClientsTable nav={nav} />;
    // client
    if (route === '/client') return <ClientDash nav={nav} />;
    if (route === '/client/storyguide') return <StoryGuide navPattern={tweaks.navPattern} rhythm={tweaks.rhythm} chatMode={tweaks.chatMode} />;
    if (route.startsWith('/client/projects/')) {
      const id = route.split('/')[3];
      return <StoryGuide navPattern={tweaks.navPattern} rhythm={tweaks.rhythm} chatMode={tweaks.chatMode} />;
    }
    if (route === '/client/customize') return <Customize nav={nav} />;
    if (route.startsWith('/client/team/')) {
      const id = route.split('/')[3];
      return <Team projectId={id} />;
    }
    if (route === '/client/team') return <Team projectId={null} />;
    if (route === '/client/settings') return <ClientSettings />;
    // employee
    if (route === '/employee' || route === '/employee/storyguide') return <StoryGuide readOnly navPattern={tweaks.navPattern} rhythm={tweaks.rhythm} chatMode={tweaks.chatMode} />;
    // fallback
    return <NotFound nav={nav} />;
  };

  return (
    <div className="app-shell">
      {role && <SideNav role={role} route={route} nav={nav} onLogout={() => { setRole(null); nav('/login'); }} />}
      <div className="app-content">
        {role && <SubBar route={route} role={role} />}
        <div className="app-main">
          {renderScreen()}
        </div>
      </div>
      <RoleSwitcher role={role} setRole={setRole} nav={nav} chatOpen={chatOpen} />
      {tweaksVisible && <Tweaks tweaks={tweaks} set={updateTweak} onClose={() => setTweaksVisible(false)} />}
      <ToastHost />
    </div>
  );
}

function ClientSettings() {
  return (
    <div className="screen">
      <h1 className="scribble" style={{marginBottom: 20}}>Settings</h1>
      <div className="grid g-2">
        <Card>
          <h3 style={{marginBottom: 12}}>Profile</h3>
          <div className="col" style={{gap: 12}}>
            <div><label className="wf-label">Name</label><input className="wf-input" defaultValue="Elena Vasquez" /></div>
            <div><label className="wf-label">Email</label><input className="wf-input" defaultValue="elena@meridian.co" /></div>
            <button className="wf-btn primary" style={{alignSelf: 'flex-start'}} onClick={() => toast('Profile saved')}>Save</button>
          </div>
        </Card>
        <Card>
          <h3 style={{marginBottom: 12}}>Password</h3>
          <div className="col" style={{gap: 12}}>
            <div><label className="wf-label">Current</label><input className="wf-input" type="password" defaultValue="••••••••"/></div>
            <div><label className="wf-label">New</label><input className="wf-input" type="password" defaultValue=""/></div>
            <button className="wf-btn" style={{alignSelf: 'flex-start'}} onClick={() => toast('Password updated')}>Update</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NotFound({ nav }) {
  return (
    <div className="screen" style={{textAlign: 'center', padding: 80}}>
      <h1 style={{fontSize: 80}}>404</h1>
      <p className="muted" style={{marginBottom: 20}}>That route doesn't exist in the wireframe.</p>
      <button className="wf-btn primary" onClick={() => nav('/login')}>Back to start</button>
    </div>
  );
}

function Tweaks({ tweaks, set, onClose }) {
  const Opt = ({ k, v, label }) => (
    <button className={'tweak-opt ' + (tweaks[k] === v ? 'active' : '')} onClick={() => set(k, v)}>{label}</button>
  );
  return (
    <div className="tweaks">
      <h4>
        <span>Tweaks</span>
        <button className="wf-btn sm ghost" style={{padding:'2px 8px'}} onClick={onClose}>✕</button>
      </h4>
      <div className="tweaks-body">
        <div className="tweak-group">
          <div className="wf-label">Nav pattern (renderer)</div>
          <div className="opts">
            <Opt k="navPattern" v="toc" label="Sticky ToC" />
            <Opt k="navPattern" v="scrollspy" label="Scroll-spy" />
            <Opt k="navPattern" v="paginated" label="Paginated" />
            <Opt k="navPattern" v="drawer" label="Drawer" />
            <Opt k="navPattern" v="book" label="Book mode" />
          </div>
        </div>
        <div className="tweak-group">
          <div className="wf-label">Section rhythm</div>
          <div className="opts">
            <Opt k="rhythm" v="editorial" label="Editorial" />
            <Opt k="rhythm" v="centered" label="Centered" />
            <Opt k="rhythm" v="split" label="Split" />
            <Opt k="rhythm" v="fullbleed" label="Full-bleed" />
          </div>
        </div>
        <div className="tweak-group">
          <div className="wf-label">Chat placement</div>
          <div className="opts">
            <Opt k="chatMode" v="slideover" label="Slide-over" />
            <Opt k="chatMode" v="inline" label="Inline (preview only)" />
          </div>
        </div>
        <div className="tweak-group">
          <div className="wf-label">Quick links</div>
          <div className="opts">
            <button className="tweak-opt" onClick={() => window.location.hash = '/client/storyguide'}>→ Renderer</button>
            <button className="tweak-opt" onClick={() => window.location.hash = '/manager/projects/c1/edit'}>→ Wizard</button>
            <button className="tweak-opt" onClick={() => window.location.hash = '/admin'}>→ Admin</button>
          </div>
        </div>
        <p className="muted" style={{fontSize: 11, margin: 0}}>Toggle via the Tweaks button in the top toolbar.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
