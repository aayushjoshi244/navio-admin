import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▣', end: true },
  { to: '/providers', label: 'Providers', icon: '◫' },
  { to: '/categories', label: 'Categories', icon: '◇' },
  { to: '/users', label: 'Users', icon: '◉' },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const displayName = profile?.full_name || profile?.email || 'Admin';
  
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="admin-shell min-h-screen bg-[#10142a] text-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-[#0d1126] shadow-2xl shadow-black/45 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5 bg-[#090c1c]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-blue-500/25">
            N
          </div>
          <div>
            <div className="text-sm font-black leading-tight text-white tracking-wide">NAVIO ADMIN</div>
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Service directory</div>
          </div>
        </div>

        <div className="border-b border-white/5 px-5 py-4 bg-[#0d1126]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#191e3e] text-sm font-bold text-cyan-400 border border-white/5 shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-200">{displayName}</div>
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Super Admin
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-250',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/95 to-indigo-600/90 text-white shadow-md shadow-blue-500/15 font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                ].join(' ')
              }
            >
              <span className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-white/5 text-xs font-semibold border border-white/5">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 border-t border-white/5 p-4 bg-[#090c1c]/30">
          <div className="rounded-lg bg-[#0a0d1e] p-3 border border-white/5">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Platform health</span>
              <span className="text-cyan-400 font-semibold">Live</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-center text-sm font-medium text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#10142a]/80 shadow-md backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white lg:hidden">
                N
              </div>
              <div className="hidden h-9.5 max-w-md flex-1 items-center gap-2 rounded-lg border border-white/5 bg-[#151936]/80 px-3.5 text-sm text-slate-400 transition-all focus-within:border-blue-500/50 focus-within:bg-[#151936] focus-within:ring-2 focus-within:ring-blue-500/10 sm:flex">
                <span className="text-slate-500 text-base">⌕</span>
                <input
                  type="text"
                  placeholder="Type to search..."
                  className="w-full bg-transparent text-slate-200 placeholder-slate-500 border-none outline-none focus:ring-0 p-0 text-sm"
                  style={{ border: 'none', background: 'transparent', padding: 0 }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="hidden items-center gap-1.5 text-slate-400 md:flex">
                <span className="text-xs">🕒</span>
                <span className="font-mono text-slate-300">
                  {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <span className="hidden h-4 w-px bg-white/10 md:block" />
              <span className="hidden text-slate-300 hover:text-slate-100 transition cursor-pointer md:inline">English</span>
              <span className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 font-bold text-white shadow-md shadow-blue-500/20 border border-white/10">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] overflow-auto bg-[#10142a] p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
