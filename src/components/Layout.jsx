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

  return (
    <div className="admin-shell min-h-screen bg-[#10142a] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#151936]/95 shadow-2xl shadow-black/30 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 text-sm font-black text-white">
            N
          </div>
          <div>
            <div className="text-sm font-black leading-tight text-white">Navio Admin</div>
            <div className="text-xs text-slate-400">Service directory</div>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#262b55] text-sm font-bold text-cyan-200">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{displayName}</div>
              <div className="text-xs text-emerald-300">Super admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-xs">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 border-t border-white/10 p-4">
          <div className="rounded-lg bg-[#10142a] p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Platform health</span>
              <span className="text-cyan-300">Live</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm font-semibold text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-blue-600 shadow-xl shadow-black/20">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white lg:hidden">
                N
              </div>
              <div className="hidden h-9 max-w-xl flex-1 items-center gap-2 rounded-lg bg-white/15 px-3 text-sm text-blue-50 sm:flex">
                <span>⌕</span>
                <span className="text-blue-100/80">Type to search admin data</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-blue-100 md:inline">English</span>
              <span className="rounded-md bg-white/15 px-2 py-1 font-semibold text-white">
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
