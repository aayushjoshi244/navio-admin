import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

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

// Clean sparkline
function Sparkline({ values, color = '#3b82f6' }) {
  if (!values || !values.length) return <div className="h-8 w-24" />;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * 100;
      const y = 24 - (value / max) * 20;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 26" className="h-8 w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Area chart with subtle gradients
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
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pendingArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#334155" strokeWidth="0.5" />
      ))}
      <polygon points={`0,70 ${approvedPoints} 100,70`} fill="url(#approvedArea)" />
      <polygon points={`0,70 ${pendingPoints} 100,70`} fill="url(#pendingArea)" />
      <polyline points={approvedPoints} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pendingPoints} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {monthLabels.map((label, idx) => (
        <text key={label} x={(idx / 11) * 100} y="76" fill="#64748b" fontSize="3.5" textAnchor="middle">
          {label}
        </text>
      ))}
    </svg>
  );
}

// Donut chart – subtle, no heavy gradients
function DonutChart({ approved, pending }) {
  const total = approved + pending || 1;
  const approvedPercent = (approved / total) * 100;
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#1e293b" strokeWidth="5" />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="transparent"
          stroke="#10b981"
          strokeDasharray={`${approvedPercent} ${100 - approvedPercent}`}
          strokeLinecap="round"
          strokeWidth="5"
        />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="transparent"
          stroke="#f59e0b"
          strokeDasharray={`${100 - approvedPercent} ${approvedPercent}`}
          strokeDashoffset={-approvedPercent}
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-semibold text-white">{Math.round((approved / total) * 100)}%</div>
        <div className="text-xs uppercase tracking-wide text-slate-400">approved</div>
      </div>
    </div>
  );
}

// Simple bar chart
function BarChart({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex h-48 items-end gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-36 w-full items-end rounded bg-slate-800">
            <div
              className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
              style={{ height: `${Math.max((item.value / max) * 100, item.value ? 6 : 2)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <div className="max-w-[60px] truncate text-xs text-slate-400">{item.label}</div>
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
        const [usersResult, providersResult, categoriesResult, tagsResult] = await Promise.all([
          supabase.from('profiles').select('id, full_name, user_type, created_at'),
          supabase
            .from('providers')
            .select('id, business_name, owner_name, categories, category, is_approved, spoken_languages, city, province, created_at')
            .order('created_at', { ascending: false }),
          supabase.from('categories').select('id, name, image_url, is_active, created_at'),
          supabase.from('tags').select('id, name, category_id'),
        ]);
        const failed = [usersResult, providersResult, categoriesResult, tagsResult].find((res) => res.error);
        if (failed) {
          console.error('Fetch error:', failed.error);
          setError(failed.error.message);
        } else {
          setRows({
            users: usersResult.data || [],
            providers: providersResult.data || [],
            categories: categoriesResult.data || [],
            tags: tagsResult.data || [],
          });
        }
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
      spark: [rows.users.length, analytics.providerUsers.length, analytics.adminUsers.length, rows.providers.length],
    },
    {
      label: 'Service Providers',
      value: rows.providers.length,
      delta: `${analytics.approvedProviders.length} approved`,
      color: '#8b5cf6',
      spark: analytics.approvedByMonth,
    },
    {
      label: 'Categories',
      value: rows.categories.length,
      delta: `${rows.tags.length} tags`,
      color: '#10b981',
      spark: [rows.categories.length, rows.tags.length, analytics.topCategories.length, rows.providers.length],
    },
    {
      label: 'Pending Review',
      value: analytics.pendingProviders.length,
      delta: `${rows.providers.length ? Math.round((analytics.pendingProviders.length / rows.providers.length) * 100) : 0}% queue`,
      color: '#f59e0b',
      spark: analytics.pendingByMonth,
    },
  ];

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400">Loading dashboard…</div>;
  if (error)
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        <p className="font-medium">Dashboard error</p>
        <p className="text-sm">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="text-sm font-medium text-slate-400">Dashboard</div>
          <h1 className="mt-1 text-2xl font-semibold text-white">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Key metrics and platform activity</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-sm text-slate-400">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold text-white">{formatNumber(card.value)}</div>
                <div className="mt-1 text-xs text-emerald-400">{card.delta}</div>
              </div>
              <div className="w-20">
                <Sparkline values={card.spark} color={card.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Approval Balance</h2>
            <span className="text-xs text-slate-500">{rows.providers.length} total</span>
          </div>
          <DonutChart approved={analytics.approvedProviders.length} pending={analytics.pendingProviders.length} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-slate-800 p-3">
              <div className="text-slate-500">Approved</div>
              <div className="text-xl font-semibold text-emerald-400">{analytics.approvedProviders.length}</div>
            </div>
            <div className="rounded-md bg-slate-800 p-3">
              <div className="text-slate-500">Pending</div>
              <div className="text-xl font-semibold text-amber-400">{analytics.pendingProviders.length}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Provider Growth</h2>
              <p className="text-xs text-slate-500">Monthly signups (approved vs pending)</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-blue-400">Approved</span>
              <span className="text-amber-400">Pending</span>
            </div>
          </div>
          <AreaChart approved={analytics.approvedByMonth} pending={analytics.pendingByMonth} />
        </div>
      </div>

      {/* Insights */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-white">Top Categories</h2>
          <div className="space-y-3">
            {analytics.topCategories.length ? (
              analytics.topCategories.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-slate-500">{item.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                      style={{ width: `${(item.value / Math.max(...analytics.topCategories.map((c) => c.value), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No data</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Provider Locations</h2>
            <span className="text-xs text-slate-500">Top cities</span>
          </div>
          <BarChart items={analytics.topCities.length ? analytics.topCities : [{ label: 'None', value: 0 }]} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-white">Languages</h2>
          <div className="space-y-3">
            {analytics.languages.length ? (
              analytics.languages.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-md bg-slate-800 p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">Listings</div>
                  </div>
                  <div className="text-xl font-light text-blue-400">{item.value}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent providers */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Recent Providers</h2>
          <span className="text-xs text-slate-500">Latest entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-2 text-left text-xs font-medium text-slate-500">Business</th>
                <th className="py-2 text-left text-xs font-medium text-slate-500">Owner</th>
                <th className="py-2 text-left text-xs font-medium text-slate-500">Category</th>
                <th className="py-2 text-left text-xs font-medium text-slate-500">City</th>
                <th className="py-2 text-left text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.providers.slice(0, 8).map((provider) => (
                <tr key={provider.id} className="border-b border-slate-800/50">
                  <td className="py-2 text-sm text-white">{provider.business_name || 'Untitled'}</td>
                  <td className="py-2 text-sm text-slate-300">{provider.owner_name || '-'}</td>
                  <td className="py-2 text-sm text-slate-300">
                    {(provider.categories || [provider.category].filter(Boolean)).join(', ') || '-'}
                  </td>
                  <td className="py-2 text-sm text-slate-300">{provider.city || provider.province || '-'}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        provider.is_approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {provider.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.providers.length && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-slate-500">
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