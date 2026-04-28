// Shared UI atoms + navigation + role switcher + toast
const { useState, useEffect, useRef, useCallback } = React;

// --- toast system ---
const toastListeners = [];
function toast(msg) {
  toastListeners.forEach(fn => fn(msg));
}

function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = (msg) => {
      const id = Math.random().toString(36).slice(2);
      setItems(prev => [...prev, { id, msg }]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 3200);
    };
    toastListeners.push(fn);
    return () => { const i = toastListeners.indexOf(fn); if (i>=0) toastListeners.splice(i,1); };
  }, []);
  return (
    <div className="toast-stack">
      {items.map(t => <div key={t.id} className="toast">✎ {t.msg}</div>)}
    </div>
  );
}

// --- navigation (hash-based) ---
function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/login');
  useEffect(() => {
    const h = () => setRoute(window.location.hash.slice(1) || '/login');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const nav = useCallback((to) => { window.location.hash = to; }, []);
  return [route, nav];
}

// --- current role (localStorage) ---
function useRole() {
  const [role, setRoleState] = useState(() => localStorage.getItem('wdn-role') || null);
  const setRole = (r) => {
    if (r) localStorage.setItem('wdn-role', r);
    else localStorage.removeItem('wdn-role');
    setRoleState(r);
  };
  return [role, setRole];
}

// --- side navigation ---
const NAV_ICONS = {
  dashboard: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  managers:  <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="6" r="2.5"/><path d="M15 11.5c2.4 0 4.5 1.3 5.5 3.5"/></svg>,
  clients:   <svg viewBox="0 0 24 24"><path d="M3 20v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2"/><circle cx="12" cy="7" r="4"/></svg>,
  projects:  <svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  stats:     <svg viewBox="0 0 24 24"><path d="M3 20h18"/><rect x="5" y="11" width="3" height="8"/><rect x="11" y="6" width="3" height="13"/><rect x="17" y="14" width="3" height="5"/></svg>,
  home:      <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>,
  storyguide:<svg viewBox="0 0 24 24"><path d="M4 4h10a4 4 0 0 1 4 4v12"/><path d="M4 4v14a2 2 0 0 0 2 2h12"/><path d="M8 9h6M8 13h6"/></svg>,
  customize: <svg viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M3 6.5h8M16 6.5h5M3 12h1M9 12h12M3 17h11M19.5 17H21"/></svg>,
  team:      <svg viewBox="0 0 24 24"><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 19c.7-2.6 2.8-4 5.5-4s4.8 1.4 5.5 4"/><path d="M16 15c2.7 0 4.8 1.4 5.5 4"/></svg>,
  settings:  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

function SideNav({ role, route, nav, onLogout }) {
  const user = role ? window.WODEN.MOCK_USERS[role] : null;
  const roleLabels = { admin: 'Super-admin', manager: 'Strategist', client: 'Client admin', employee: 'Employee' };
  const navs = {
    admin: [
      { section: 'Operations' },
      ['/admin',          'Dashboard', 'dashboard'],
      ['/admin/managers', 'Managers',  'managers'],
      ['/admin/clients',  'Clients',   'clients'],
      ['/admin/stats',    'Stats',     'stats'],
    ],
    manager: [
      { section: 'Work' },
      ['/manager',          'Dashboard', 'dashboard'],
      // ['/manager/projects', 'Projects',  'projects'],
      ['/manager/clients',  'Clients',   'clients'],
    ],
    client: [
      { section: 'Your workspace' },
      ['/client',           'Home',      'home'],
      ['/client/customize', 'Customize', 'customize'],
      ['/client/settings',  'Settings',  'settings'],
    ],
    employee: [
      { section: 'Brand' },
      ['/employee/storyguide', 'StoryGuide', 'storyguide'],
    ],
  };
  const items = (role && navs[role]) || [];

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-header">
        <a className="app-logo" href="#/" onClick={(e)=>{ e.preventDefault(); nav(role ? ({admin:'/admin',manager:'/manager',client:'/client',employee:'/employee/storyguide'})[role] : '/login'); }}>
          <img src="assets/woden-logo-black.svg" alt="Woden" />
        </a>
      </div>
      <nav className="app-nav">
        {items.map((item, i) => {
          if (item.section) return <div key={'s'+i} className="app-nav-label">{item.section}</div>;
          const [path, label, ico] = item;
          const active = route === path || route.startsWith(path + '/');
          return (
            <a key={path}
               className={active ? 'active' : ''}
               onClick={(e)=>{ e.preventDefault(); nav(path); }}
               href={'#' + path}>
              <span className="nav-ico">{NAV_ICONS[ico]}</span>
              <span className="label">{label}</span>
            </a>
          );
        })}
      </nav>
      {user && (
        <div className="app-sidebar-footer">
          <div className="wf-circle" style={{width: 34, height: 34, fontSize: 12, flexShrink: 0}}>{user.initials}</div>
          <div className="user-mini">
            <div className="name">{user.name}</div>
            <div className="role">{roleLabels[role]}</div>
          </div>
          <button className="wf-btn sm ghost" onClick={onLogout} title="Sign out" style={{padding: '6px 10px'}}>Out</button>
        </div>
      )}
    </aside>
  );
}

// --- sub bar: breadcrumbs + page-level actions slot ---
function SubBar({ route, role }) {
  // Build breadcrumbs from the route.
  const parts = route.split('/').filter(Boolean);
  if (!parts.length) return null;
  const rootLabel = { admin: 'Admin', manager: 'Manager', client: 'Client', employee: 'Employee' }[parts[0]] || parts[0];
  const tail = parts.slice(1).map(p => p.replace(/-/g,' '));
  return (
    <div className="app-subbar">
      <div className="crumbs">
        <span>{rootLabel}</span>
        {tail.map((t, i) => (
          <React.Fragment key={i}>
            <span className="sep">/</span>
            <span className={i === tail.length - 1 ? 'here' : ''}>{t}</span>
          </React.Fragment>
        ))}
        {!tail.length && <><span className="sep">/</span><span className="here">home</span></>}
      </div>
    </div>
  );
}

// --- role switcher ---
function RoleSwitcher({ role, setRole, nav, chatOpen }) {
  const [open, setOpen] = useState(false);
  const user = window.WODEN.MOCK_USERS[role];
  const switchTo = (r) => {
    setRole(r);
    setOpen(false);
    const homes = { admin: '/admin', manager: '/manager', client: '/client', employee: '/employee/storyguide' };
    nav(homes[r]);
    toast(`Switched to ${window.WODEN.MOCK_USERS[r].name}`);
  };
  const roles = [
    ['admin',    'Super-admin (Woden)'],
    ['manager',  'Strategist (Woden)'],
    ['client',   'Client admin'],
    ['employee', 'Client employee'],
  ];
  if (!role) return null;
  return (
    <div className={'role-switcher' + (chatOpen ? ' shifted' : '')}>
      {open && (
        <div className="role-panel">
          <div className="wf-label" style={{marginBottom: 8}}>Demo mode — swap roles</div>
          {roles.map(([r, label]) => {
            const u = window.WODEN.MOCK_USERS[r];
            return (
              <div key={r} className={'role-option' + (r === role ? ' current' : '')} onClick={() => switchTo(r)}>
                <div className="av">{u.initials}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight: 700, fontSize: 14}}>{u.name}</div>
                  <div className="mono" style={{fontSize: 10, color: '#6a6a6a', letterSpacing: '0.05em'}}>{label}</div>
                </div>
                {r === role && <span className="wf-tag accent">You</span>}
              </div>
            );
          })}
        </div>
      )}
      <div className="role-pill" onClick={() => setOpen(o => !o)}>
        <div className="av">{user.initials}</div>
        <div>
          <div>{user.role.replace('_',' ')}</div>
          <span className="tag">tap to swap</span>
        </div>
      </div>
    </div>
  );
}

// --- placeholder image rect ---
function Rect({ label, h = 160, style = {} }) {
  return <div className="wf-rect" style={{height: h, ...style}}>{label}</div>;
}

function Lines({ n = 4, widths }) {
  const ws = widths || ['w90', 'w80', 'w70', 'w60'];
  return (
    <div className="wf-lines">
      {Array.from({length: n}).map((_, i) => (
        <div key={i} className={'wf-line ' + (ws[i % ws.length])} />
      ))}
    </div>
  );
}

// --- card helper ---
function Card({ children, style, pad = 20 }) {
  return <div className="wf-box" style={{padding: pad, ...(style||{})}}>{children}</div>;
}

// --- annotation ---
function Note({ children, style }) {
  return <div className="wf-note" style={style}>{children}</div>;
}

// --- modal ---
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="wf-box modal-box" onClick={e => e.stopPropagation()}>
        <div className="row" style={{justifyContent: 'space-between', marginBottom: 20}}>
          <h3>{title}</h3>
          <button className="wf-btn sm ghost" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// --- form fields helper ---
function Field({ label, children }) {
  return <div><label className="wf-label">{label}</label>{children}</div>;
}

Object.assign(window, { ToastHost, useRoute, useRole, SideNav, SubBar, RoleSwitcher, Rect, Lines, Card, Note, toast, Modal, Field });
