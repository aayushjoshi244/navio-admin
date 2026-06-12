import { useEffect, useMemo, useState } from 'react';
import { getUsers, getProviders, getCategories } from '../lib/api';
import { Users, BriefcaseBusiness, Tags, Clock3 } from 'lucide-react';
import StatCard from '../components/StatCard';
import ApprovalDonut from '../components/ApprovalDonut';
import GrowthChart from '../components/GrowthChart';
import CityChart from '../components/CityChart';
import CategoryBars from '../components/CategoryBars';

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

    // Monthly data for growth chart
    const approvedByMonth = new Array(12).fill(0);
    const pendingByMonth = new Array(12).fill(0);
    rows.providers.forEach((p) => {
      const month = p.created_at ? new Date(p.created_at).getMonth() : 0;
      if (p.is_approved) approvedByMonth[month]++;
      else pendingByMonth[month]++;
    });

    // For the GrowthChart we need an array of objects: { month, approved, pending }
    const growthData = monthLabels.map((month, idx) => ({
      month,
      approved: approvedByMonth[idx],
      pending: pendingByMonth[idx],
    }));

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
      approvedProviders: approvedProviders.length,
      pendingProviders: pendingProviders.length,
      adminUsers: adminUsers.length,
      providerUsers: providerUsers.length,
      growthData,
      topCategories,
      topCities,
      languages,
    };
  }, [rows]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400">Loading dashboard…</div>;
  if (error)
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        <p className="font-bold">Dashboard error</p>
        <p className="text-sm mt-1 text-red-400">{error}</p>
      </div>
    );

  const totalPending = analytics.pendingProviders;
  const totalProviders = rows.providers.length;
  const pendingPercent = totalProviders ? Math.round((totalPending / totalProviders) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">System Dashboard</div>
          <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p className="mt-0.5 text-sm text-slate-400">Key metrics, provider locations, and signup trajectories</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-1.5 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={formatNumber(rows.users.length)}
          subtitle={`${analytics.adminUsers} admins`}
          trend="+12%"
          trendUp={true}
          icon={Users}
        />
        <StatCard
          title="Service Providers"
          value={formatNumber(rows.providers.length)}
          subtitle={`${analytics.approvedProviders} approved`}
          trend="+24%"
          trendUp={true}
          icon={BriefcaseBusiness}
        />
        <StatCard
          title="Categories"
          value={formatNumber(rows.categories.length)}
          subtitle={`${rows.tags.length} sub-tags`}
          trend="+4%"
          trendUp={true}
          icon={Tags}
        />
        <StatCard
          title="Pending Review"
          value={formatNumber(analytics.pendingProviders)}
          subtitle={`${pendingPercent}% of total`}
          trend="-8%"
          trendUp={false}
          icon={Clock3}
        />
      </div>

      {/* Charts - Donut & Growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Approval Balance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribution of service provider states</p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/15">
              {totalProviders} total
            </span>
          </div>
          <ApprovalDonut approved={analytics.approvedProviders} pending={analytics.pendingProviders} />
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3.5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{analytics.approvedProviders}</div>
            </div>
            <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3.5 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{analytics.pendingProviders}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Provider Growth</h2>
              <p className="text-xs text-slate-500 mt-0.5">Monthly signups (approved vs pending)</p>
            </div>
          </div>
          <GrowthChart data={analytics.growthData} />
        </div>
      </div>

      {/* Insights: Categories, Locations, Languages */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-sm font-bold text-white tracking-wide uppercase border-b border-slate-800 pb-3">Top Categories</h2>
          <CategoryBars items={analytics.topCategories.length ? analytics.topCategories : [{ label: 'No data', value: 0 }]} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Provider Locations</h2>
            <span className="text-xs font-semibold text-slate-500">Top cities</span>
          </div>
          <CityChart data={analytics.topCities.length ? analytics.topCities : [{ label: 'None', value: 0 }]} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-sm font-bold text-white tracking-wide uppercase border-b border-slate-800 pb-3">Languages</h2>
          <div className="space-y-3">
            {analytics.languages.length ? (
              analytics.languages.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-800/30 border border-slate-700 p-3.5 hover:bg-slate-800/50 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Listings</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{item.value}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">No language data registered</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent providers */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Recent Providers</h2>
          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-700">
            Latest entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rows.providers.slice(0, 8).map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 text-sm font-medium text-white">{provider.business_name || 'Untitled'}</td>
                  <td className="py-3 text-sm text-slate-300">{provider.owner_name || '-'}</td>
                  <td className="py-3 text-sm text-slate-300">
                    {(provider.categories || [provider.category].filter(Boolean)).join(', ') || '-'}
                  </td>
                  <td className="py-3 text-sm text-slate-400">{provider.city || provider.province || '-'}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
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
                  <td colSpan="5" className="py-6 text-center text-slate-500">
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