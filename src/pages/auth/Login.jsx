import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {login} from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { session } = await login(email, password);
      localStorage.setItem('admin_token', session.access_token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally{
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10142a] px-4 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 text-lg font-black text-white">
              N
            </div>
            <div>
              <div className="text-xl font-black text-white">Navio Admin</div>
              <div className="text-sm text-slate-400">Thailand service-directory control panel</div>
            </div>
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-white md:text-5xl">
            Manage providers, categories, users, and platform growth from one cockpit.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400">
            Secure Supabase-powered operations for the Navio mobile app, with approvals and content updates reflected in real time.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {['Providers', 'Categories', 'Users'].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-blue-300">Manage</div>
                <div className="mt-1 font-bold text-white">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleLogin} className="rounded-2xl border border-white/10 bg-[#171b38] p-6 shadow-2xl shadow-black/30">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white">Admin Login</h2>
            <p className="mt-1 text-sm text-slate-400">Use your Supabase admin account.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <label className="mb-2 block text-sm font-bold text-slate-300">Email</label>
          <input
            type="email"
            placeholder="admin@navio.app"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-[#171c3e] p-3 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            required
          />

          <label className="mb-2 block text-sm font-bold text-slate-300">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mb-5 w-full rounded-lg border border-white/10 bg-[#171c3e] p-3 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 p-3 font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}