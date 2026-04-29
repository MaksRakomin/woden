const { useState, useEffect, useCallback } = React;

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = "inline-flex items-center justify-center gap-2 border-2 rounded-full font-bold uppercase tracking-wide transition-all focus:outline-none focus:shadow-focus shrink-0";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    default: "bg-base text-contrast border-contrast hover:bg-super-light-gray hover:underline",
    primary: "bg-primary text-black border-primary hover:bg-primary-hover hover:border-primary-hover",
    ghost: "bg-transparent text-contrast border-contrast hover:bg-contrast hover:text-white hover:no-underline"
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function Input({ className = '', ...props }) {
  return <input className={`w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus placeholder-ink-faint ${className}`} {...props} />;
}

function Select({ className = '', children, ...props }) {
  return <select className={`w-full px-3.5 py-2.5 pr-8 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus select-arrow cursor-pointer ${className}`} {...props}>{children}</select>;
}

function Label({ children, className = '' }) {
  return <label className={`block font-bold text-xs tracking-widest uppercase text-contrast mb-1.5 ${className}`}>{children}</label>;
}

function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: "bg-base text-contrast border-contrast",
    accent: "bg-primary text-black border-primary",
    soft: "bg-primary-bg-subtle text-secondary border-primary-bg-subtle"
  };
  return <span className={`inline-block px-3 py-1 border rounded-full font-bold text-[11px] tracking-widest uppercase leading-tight ${variants[variant]} ${className}`}>{children}</span>;
}

function Card({ children, className = '', pad = 'p-5' }) {
  return <div className={`bg-base border border-light-gray rounded-[24px] relative transition-all hover:shadow-sm ${pad} ${className}`}>{children}</div>;
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
      <div className="fixed inset-0 bg-black/45 z-[200] grid place-items-center p-3" onClick={onClose}>
        <div className="bg-base border border-light-gray rounded-[24px] w-[480px] max-w-[calc(100vw-24px)] p-5 sm:p-8 shadow-lg" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-bold">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
          {children}
        </div>
      </div>
  );
}

function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>;
}

function Note({ children, className = '' }) {
  return <div className={`font-bold text-primary text-xs uppercase tracking-wider leading-tight ${className}`}>{children}</div>;
}

function Rect({ label, h = 160, className = '' }) {
  return <div className={`bg-super-light-gray border border-light-gray rounded-lg flex items-center justify-center text-ink-faint font-mono text-xs uppercase tracking-widest ${className}`} style={{height: h}}>{label}</div>;
}

function Lines({ n = 4 }) {
  const ws = ['w-[90%]', 'w-[80%]', 'w-[70%]', 'w-[60%]'];
  return (
      <div className="flex flex-col gap-2">
        {Array.from({length: n}).map((_, i) => <div key={i} className={`h-2.5 bg-super-light-gray rounded ${ws[i % ws.length]}`} />)}
      </div>
  );
}

// ─── Toast System ─────────────────────────────────────────────────────────────

const toastListeners = [];
function toast(msg) { toastListeners.forEach(fn => fn(msg)); }

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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[200] pointer-events-none">
        {items.map(t => (
            <div key={t.id} className="bg-contrast text-base px-5 py-3 rounded-full font-bold text-sm tracking-wide shadow-md animate-toast-in">
              ✎ {t.msg}
            </div>
        ))}
      </div>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

function useRole() {
  const [role, setRoleState] = useState(() => localStorage.getItem('wdn-role') || null);
  const setRole = (r) => {
    if (r) localStorage.setItem('wdn-role', r);
    else localStorage.removeItem('wdn-role');
    setRoleState(r);
  };
  return [role, setRole];
}

// ─── Layout Components ────────────────────────────────────────────────────────

const NAV_ICONS = {
  dashboard: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  managers:  <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="6" r="2.5"/><path d="M15 11.5c2.4 0 4.5 1.3 5.5 3.5"/></svg>,
  clients:   <svg viewBox="0 0 24 24"><path d="M3 20v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2"/><circle cx="12" cy="7" r="4"/></svg>,
  projects:  <svg viewBox="0 0 24 24"><path d="M3 7l3-3h5l2 2h8v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"/><path d="M3 11h18"/></svg>,
  templates: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  stats:     <svg viewBox="0 0 24 24"><path d="M3 20h18"/><rect x="5" y="11" width="3" height="8"/><rect x="11" y="6" width="3" height="13"/><rect x="17" y="14" width="3" height="5"/></svg>,
  home:      <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>,
  storyguide:<svg viewBox="0 0 24 24"><path d="M4 4h10a4 4 0 0 1 4 4v12"/><path d="M4 4v14a2 2 0 0 0 2 2h12"/><path d="M8 9h6M8 13h6"/></svg>,
  customize: <svg viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M3 6.5h8M16 6.5h5M3 12h1M9 12h12M3 17h11M19.5 17H21"/></svg>,
  settings:  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

function SideNav({ role, route, nav, onLogout, mobileOpen, setMobileOpen }) {
  const user = role ? window.WODEN.MOCK_USERS[role] : null;
  const roleLabels = { admin: 'Super-admin', manager: 'Strategist', client: 'Client admin', employee: 'Employee' };
  const navs = {
    admin: [{ section: 'Operations' }, ['/admin', 'Dashboard', 'dashboard'], ['/admin/managers', 'Managers', 'managers'], ['/admin/clients', 'Clients', 'clients'], ['/admin/projects', 'Projects', 'projects'], ['/admin/templates', 'Templates', 'templates'], ['/admin/stats', 'Stats', 'stats']],
    manager: [{ section: 'Work' }, ['/manager', 'Dashboard', 'dashboard'], ['/manager/projects', 'Projects', 'projects'], ['/manager/clients', 'Clients', 'clients']],
    client: [{ section: 'Your workspace' }, ['/client', 'Home', 'home'], ['/client/customize', 'Customize', 'customize'], ['/client/settings', 'Settings', 'settings']],
    employee: [{ section: 'Brand' }, ['/employee/storyguide', 'StoryGuide', 'storyguide']],
  };
  const items = (role && navs[role]) || [];

  useEffect(() => {
    if (!setMobileOpen) return;
    const h = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setMobileOpen]);

  const closeMobile = () => { if (setMobileOpen) setMobileOpen(false); };

  return (
      <React.Fragment>
        {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/45 z-[140]" onClick={closeMobile} />}
        <aside className={`bg-base border-r border-light-gray flex flex-col h-screen overflow-hidden md:sticky md:top-0 md:translate-x-0 md:w-[248px] md:shrink-0 md:z-20 fixed top-0 bottom-0 left-0 w-[280px] z-[150] transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-5 border-b border-light-gray flex items-center gap-2 relative">
            <a href="#/" onClick={(e)=>{ e.preventDefault(); nav(role ? ({admin:'/admin',manager:'/manager',client:'/client',employee:'/employee/storyguide'})[role] : '/login'); closeMobile(); }} className="font-extrabold text-2xl tracking-tight text-contrast flex items-center gap-2">
              <img src="assets/woden-logo-black.svg" alt="Woden" className="h-6" />
            </a>
            <button onClick={closeMobile} className="md:hidden ml-auto w-8 h-8 flex items-center justify-center text-ink-soft hover:text-contrast rounded-lg" aria-label="Close menu">✕</button>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
            {items.map((item, i) => {
              if (item.section) return <div key={'s'+i} className="font-bold text-[10px] tracking-widest uppercase text-ink-faint px-3 pt-3 pb-1">{item.section}</div>;
              const [path, label, ico] = item;
              const active = route === path || route.startsWith(path + '/');
              return (
                  <a key={path} onClick={(e)=>{ e.preventDefault(); nav(path); closeMobile(); }} href={'#' + path}
                     className={`flex items-center gap-3 px-3.5 py-2.5 font-medium text-sm rounded-lg transition-colors ${active ? 'bg-contrast text-base font-bold' : 'text-contrast hover:bg-super-light-gray'}`}>
                    <span className="w-[18px] h-[18px] shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current [&>svg]:fill-none [&>svg]:stroke-[1.6px]">{NAV_ICONS[ico]}</span>
                    {label}
                  </a>
              );
            })}
          </nav>
          {user && (
              <div className="border-t border-light-gray p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">{user.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{user.name}</div>
                  <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider">{roleLabels[role]}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} className="px-2 py-1">Out</Button>
              </div>
          )}
        </aside>
      </React.Fragment>
  );
}

function SubBar({ route, role, search, onSearch, onMenuClick }) {
  const parts = route.split('/').filter(Boolean);
  if (!parts.length) return null;
  const rootLabel = { admin: 'Admin', manager: 'Manager', client: 'Client', employee: 'Employee' }[parts[0]] || parts[0];
  const tail = parts.slice(1).map(p => p.replace(/-/g,' '));
  return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 px-4 md:px-8 py-3 md:py-3.5 bg-base border-b border-light-gray sticky top-0 z-10">
        <div className="flex items-center gap-2 font-mono text-xs text-ink-soft tracking-wide flex-1 min-w-0">
          {onMenuClick && (
              <button onClick={onMenuClick} className="md:hidden -ml-1 w-9 h-9 flex items-center justify-center text-contrast hover:bg-super-light-gray rounded-lg shrink-0" aria-label="Open menu">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              </button>
          )}
          <span>{rootLabel}</span>
          {tail.map((t, i) => (
              <React.Fragment key={i}>
                <span className="text-gray">/</span>
                <span className={`${i === tail.length - 1 ? 'text-contrast font-bold uppercase' : ''} truncate`}>{t}</span>
              </React.Fragment>
          ))}
          {!tail.length && <><span className="text-gray">/</span><span className="text-contrast font-bold uppercase">home</span></>}
        </div>
        {onSearch != null && (
            <div className="relative flex items-center w-full sm:w-auto">
              <svg className="absolute left-3 w-3.5 h-3.5 text-ink-faint pointer-events-none" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search StoryGuide..." value={search} onChange={e => onSearch(e.target.value)}
                     className="w-full sm:w-56 sm:focus:w-72 transition-all pl-8 pr-3 py-1.5 border border-light-gray rounded-full bg-super-light-gray text-xs font-sans text-contrast focus:outline-none focus:border-contrast focus:bg-base focus:shadow-focus placeholder-ink-faint" />
            </div>
        )}
      </div>
  );
}

function RoleSwitcher({ role, setRole, nav, chatOpen }) {
  const [open, setOpen] = useState(false);
  if (!role) return null;
  const user = window.WODEN.MOCK_USERS[role];
  const roles = [['admin', 'Super-admin (Woden)'], ['manager', 'Strategist (Woden)'], ['client', 'Client admin'], ['employee', 'Client employee']];

  const switchTo = (r) => {
    setRole(r); setOpen(false);
    nav({ admin: '/admin', manager: '/manager', client: '/client', employee: '/employee/storyguide' }[r]);
    toast(`Switched to ${window.WODEN.MOCK_USERS[r].name}`);
  };

  return (
      <div className={`fixed bottom-4 sm:bottom-6 z-[100] transition-all duration-300 ${chatOpen ? 'left-4 sm:left-6 right-auto' : 'right-4 sm:right-6 left-auto'}`}>
        {open && (
            <div className={`absolute bottom-16 w-[min(340px,calc(100vw-32px))] bg-base border border-light-gray rounded-[24px] p-4 shadow-lg ${chatOpen ? 'left-0' : 'right-0'}`}>
              <Label>Demo mode — swap roles</Label>
              <div className="flex flex-col gap-1 mt-2">
                {roles.map(([r, label]) => {
                  const u = window.WODEN.MOCK_USERS[r];
                  return (
                      <div key={r} onClick={() => switchTo(r)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-super-light-gray ${r === role ? 'bg-primary-bg-subtle' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-contrast text-base flex items-center justify-center font-bold text-sm">{u.initials}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{u.name}</div>
                          <div className="font-mono text-[10px] text-ink-faint tracking-wider">{label}</div>
                        </div>
                        {r === role && <Badge variant="accent">You</Badge>}
                      </div>
                  );
                })}
              </div>
            </div>
        )}
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 pl-2 pr-4 py-2 bg-contrast text-base rounded-full border-2 border-contrast shadow-md hover:bg-primary hover:border-primary hover:text-black transition-colors text-left">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm border-2 border-base">{user.initials}</div>
          <div>
            <div className="font-bold text-[11px] leading-none mb-1 uppercase tracking-wider">{user.role.replace('_',' ')}</div>
            <div className="font-mono text-[10px] text-primary-bg-subtle leading-none">tap to swap</div>
          </div>
        </button>
      </div>
  );
}

Object.assign(window, { ToastHost, useRoute, useRole, SideNav, SubBar, RoleSwitcher, Card, Modal, Button, Input, Select, Label, Badge, Field, Note, Rect, Lines, toast });
