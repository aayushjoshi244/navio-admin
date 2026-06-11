import { useEffect, useMemo, useState } from 'react';
import { getUsers, getProviders, getCategories } from '../lib/api';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const languageLabels = {
  th: 'Thai',
  en: 'English',
  hi: 'Hindi',
  zh: 'Chinese',
  ja: 'Japanese',
  km: 'Khmer',
};

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);

// Clean sparkline with gradient fill area
function Sparkline({ values, color = '#3b82f6', id }) {
  if (!values || !values.length) return <div className="h-8 w-24" />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values
    .map((value, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * 100;
      const y = 22 - ((value - min) / range) * 16;
      return `${x},${y}`;
    })
    .join(' ');
  const fillPoints = `0,24 ${points} 100,24`;
  const gradId = `sparklineGrad-${id}`;

  return (
    <svg viewBox="0 0 100 24" className="h-8 w-full overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Area chart with cyber neon gradients
function AreaChart({ approved, pending }) {
  const max = Math.max(...approved, ...pending, 1);
  const makePoints = (values) =>
    values
      .map((val, idx) => {
        const x = (idx / Math.max(values.length - 1, 1)) * 100;
        const y = 70 - (val / max) * 60;
        return `${x},${y}`;
      })
      .join(' ');
  const approvedPoints = makePoints(approved);
  const pendingPoints = makePoints(pending);

  return (
    <svg viewBox="0 0 100 80" className="h-56 w-full">
      <defs>
        <linearGradient id="approvedArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pendingArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[15, 30, 45, 60].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3 3" />
      ))}
      <polygon points={`0,70 ${approvedPoints} 100,70`} fill="url(#approvedArea)" />
      <polygon points={`0,70 ${pendingPoints} 100,70`} fill="url(#pendingArea)" />
      <polyline points={approvedPoints} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pendingPoints} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {monthLabels.map((label, idx) => (
        <text key={label} x={(idx / 11) * 100} y="77" fill="#64748b" fontSize="3.2" fontWeight="600" textAnchor="middle">
          {label}
        </text>
      ))}
    </svg>
  );
}

// Donut chart with cyber gradient and glowing ring
function DonutChart({ approved, pending }) {
  const total = approved + pending || 1;
  const approvedPercent = (approved / total) * 100;
  const radius = 15.9;
  const circumference = 2 * Math.PI * radius; // ~100
  const strokeDashoffset = circumference - (approvedPercent / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="donutGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#171b38" strokeWidth="3.8" />
        {/* Glowing layer */}
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="transparent"
          stroke="url(#donutGradient)"
          strokeWidth="3.8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="opacity-20 blur-[1px]"
        />
        {/* Main progress segment */}
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="transparent"
          stroke="url(#donutGradient)"
          strokeWidth="3.8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-black tracking-tight text-white">{Math.round(approvedPercent)}%</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Approved</div>
      </div>
    </div>
  );
}

// Thin rounded-pill bar chart
function BarChart({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex h-48 items-end gap-3 px-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative flex h-36 w-full items-end rounded-full bg-[#171b38] border border-white/[0.02]">
            <div
              className="w-full rounded-full bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
              style={{ height: `${Math.max((item.value / max) * 100, item.value ? 10 : 4)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <div className="w-full truncate text-[10px] font-bold text-center text-slate-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState({
    users: [],
    providers: [],
    categories: [],
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [users, providers, categories] = await Promise.all([
          getUsers(),
          getProviders(),
          getCategories(),
        ]);
        // Flatten tags from categories
        const tags = categories.flatMap(cat => cat.tags || []);
        setRows({ users, providers, categories, tags });
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unexpected error');
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  const analytics = useMemo(() => {
    const approvedProviders = rows.providers.filter((p) => p.is_approved);
    const pendingProviders = rows.providers.filter((p) => !p.is_approved);
    const adminUsers = rows.users.filter((u) => u.user_type === 'admin');
    const providerUsers = rows.users.filter((u) => u.user_type === 'provider');

    const approvedByMonth = new Array(12).fill(0);
    const pendingByMonth = new Array(12).fill(0);
    rows.providers.forEach((p) => {
      const month = p.created_at ? new Date(p.created_at).getMonth() : 0;
      if (p.is_approved) approvedByMonth[month]++;
      else pendingByMonth[month]++;
    });

    const categoryCounts = {};
    rows.providers.forEach((p) => {
      const names = p.categories?.length ? p.categories : [p.category].filter(Boolean);
      names.forEach((name) => (categoryCounts[name] = (categoryCounts[name] || 0) + 1));
    });
    const topCategories = Object.entries(categoryCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const cityCounts = {};
    rows.providers.forEach((p) => {
      const city = p.city || p.province || 'Unspecified';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    const topCities = Object.entries(cityCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const langCounts = {};
    rows.providers.forEach((p) => {
      (p.spoken_languages || []).forEach((lang) => {
        const label = languageLabels[lang] || lang.toUpperCase();
        langCounts[label] = (langCounts[label] || 0) + 1;
      });
    });
    const languages = Object.entries(langCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    return {
      approvedProviders,
      pendingProviders,
      adminUsers,
      providerUsers,
      approvedByMonth,
      pendingByMonth,
      topCategories,
      topCities,
      languages,
    };
  }, [rows]);

  const statCards = [
    {
      label: 'Total Users',
      value: rows.users.length,
      delta: `${analytics.adminUsers.length} admins`,
      color: '#3b82f6',
      icon: '👥',
      trend: '+12%',
      trendUp: true,
      spark: [rows.users.length, analytics.providerUsers.length, analytics.adminUsers.length, rows.providers.length, rows.users.length + 5, rows.users.length],
    },
    {
      label: 'Service Providers',
      value: rows.providers.length,
      delta: `${analytics.approvedProviders.length} approved`,
      color: '#8b5cf6',
      icon: '💼',
      trend: '+24%',
      trendUp: true,
      spark: analytics.approvedByMonth,
    },
    {
      label: 'Categories',
      value: rows.categories.length,
      delta: `${rows.tags.length} sub-tags`,
      color: '#10b981',
      icon: '🏷️',
      trend: '+4%',
      trendUp: true,
      spark: [rows.categories.length, rows.tags.length, analytics.topCategories.length, rows.providers.length],
    },
    {
      label: 'Pending Review',
      value: analytics.pendingProviders.length,
      delta: `${rows.providers.length ? Math.round((analytics.pendingProviders.length / rows.providers.length) * 100) : 0}% queue`,
      color: '#f59e0b',
      icon: '⏳',
      trend: '-8%',
      trendUp: false,
      spark: analytics.pendingByMonth,
    },
  ];

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400 font-medium">Loading dashboard…</div>;
  if (error)
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-300 shadow-lg shadow-red-950/20">
        <p className="font-bold">Dashboard error</p>
        <p className="text-sm mt-1 text-red-400">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">System Dashboard</div>
          <h1 className="mt-1 text-2xl font-black text-white tracking-tight">Overview</h1>
          <p className="mt-0.5 text-sm text-slate-400">Key metrics, provider locations, and signup trajectories</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#171b38]/50 px-3.5 py-1.5 text-xs font-semibold text-slate-400 flex items-center gap-1.5 shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div key={card.label} className="premium-hover-card rounded-xl border border-white/5 bg-[#171b38]/50 p-5 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</div>
              <span className="text-lg" title={card.label}>{card.icon}</span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight text-white">{formatNumber(card.value)}</div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <span className={`font-semibold ${card.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {card.trend} {card.trendUp ? '↑' : '↓'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-medium">{card.delta}</span>
                </div>
              </div>
              <div className="w-20">
                <Sparkline values={card.spark} color={card.color} id={idx} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#171b38]/40 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Approval Balance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribution of service provider states</p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/15">
              {rows.providers.length} total
            </span>
          </div>
          <DonutChart approved={analytics.approvedProviders.length} pending={analytics.pendingProviders.length} />
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-[#141833] border border-white/5 p-3.5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{analytics.approvedProviders.length}</div>
            </div>
            <div className="rounded-lg bg-[#141833] border border-white/5 p-3.5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{analytics.pendingProviders.length}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#171b38]/40 p-6 shadow-xl shadow-black/10">
          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Provider Growth</h2>
              <p className="text-xs text-slate-500 mt-0.5">Monthly signups (approved vs pending)</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Approved
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Pending
              </span>
            </div>
          </div>
          <AreaChart approved={analytics.approvedByMonth} pending={analytics.pendingByMonth} />
        </div>
      </div>

      {/* Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#171b38]/40 p-6 shadow-xl shadow-black/10">
          <h2 className="mb-4 text-sm font-bold text-white tracking-wide uppercase border-b border-white/5 pb-3">Top Categories</h2>
          <div className="space-y-4">
            {analytics.topCategories.length ? (
              analytics.topCategories.map((item) => (
                <div key={item.label} className="premium-hover-card p-1 rounded-md">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-slate-400">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#171b38] overflow-hidden border border-white/[0.02]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                      style={{ width: `${(item.value / Math.max(...analytics.topCategories.map((c) => c.value), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">No categories registered</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#171b38]/40 p-6 shadow-xl shadow-black/10">
          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Provider Locations</h2>
            <span className="text-xs font-semibold text-slate-500">Top cities</span>
          </div>
          <BarChart items={analytics.topCities.length ? analytics.topCities : [{ label: 'None', value: 0 }]} />
        </div>

        <div className="rounded-xl border border-white/5 bg-[#171b38]/40 p-6 shadow-xl shadow-black/10">
          <h2 className="mb-4 text-sm font-bold text-white tracking-wide uppercase border-b border-white/5 pb-3">Languages</h2>
          <div className="space-y-3">
            {analytics.languages.length ? (
              analytics.languages.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-[#141833] border border-white/5 p-3.5 hover:bg-[#1a1f42] transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Registered Listings</div>
                  </div>
                  <div className="text-2xl font-black text-cyan-400">{item.value}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">No language data registered</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent providers */}
      <div className="rounded-xl border border-white/5 bg-[#171b38]/40 p-6 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Recent Providers</h2>
          <span className="rounded-md bg-[#141833] px-2.5 py-1 text-xs font-semibold text-slate-400 border border-white/5">
            Latest entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {rows.providers.slice(0, 8).map((provider) => (
                <tr key={provider.id} className="hover:bg-blue-500/[0.02] transition-colors">
                  <td className="py-3 text-sm font-bold text-white">{provider.business_name || 'Untitled'}</td>
                  <td className="py-3 text-sm text-slate-300 font-semibold">{provider.owner_name || '-'}</td>
                  <td className="py-3 text-sm text-slate-300">
                    {(provider.categories || [provider.category].filter(Boolean)).join(', ') || '-'}
                  </td>
                  <td className="py-3 text-sm text-slate-400">{provider.city || provider.province || '-'}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        provider.is_approved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                      }`}
                    >
                      {provider.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.providers.length && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500 font-medium">
                    No providers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}