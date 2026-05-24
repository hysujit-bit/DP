import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import FloralBg from '../components/FloralBg';

/* ─── IST clock helpers ─── */
function getIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}
function formatIST(dt) {
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rawH = dt.getUTCHours();
  const rawM = dt.getUTCMinutes();
  const rawS = dt.getUTCSeconds();
  const ampm = rawH >= 12 ? 'PM' : 'AM';
  const h12  = rawH % 12 || 12;
  return {
    day:   DAYS[dt.getUTCDay()],
    date:  dt.getUTCDate(),
    month: MONTHS[dt.getUTCMonth()],
    year:  dt.getUTCFullYear(),
    h: h12,
    m: String(rawM).padStart(2,'0'),
    s: String(rawS).padStart(2,'0'),
    ampm,
  };
}

export default function Login() {
  const { login }   = useApp();
  const navigate    = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [now,      setNow]      = useState(() => getIST());

  /* Live clock */
  useEffect(() => {
    const id = setInterval(() => setNow(getIST()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = login(email, password);
    if (result.ok) navigate('/');
    else { setError(result.error); setLoading(false); }
  };

  const ist = formatIST(now);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f0f9ff 0%, #f8fbff 40%, #e0f2fe 100%)' }}
    >
      {/* Floral background */}
      <FloralBg />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">

        {/* ── IST Clock strip ── */}
        <div className="mb-5 rounded-2xl overflow-hidden shadow-md"
             style={{ border: '1.5px solid rgba(2,132,199,0.22)' }}>
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-sky-600 to-sky-400" />
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.96) 0%,rgba(240,249,255,0.97) 100%)' }}
          >
            <div>
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest leading-none mb-0.5">
                {ist.day}
              </p>
              <p className="text-sm font-semibold text-gray-500">
                {ist.date} {ist.month} {ist.year}
              </p>
            </div>
            <div className="flex items-end gap-0.5 leading-none">
              <span className="font-black text-gray-900 tabular-nums"
                    style={{ fontSize: '2rem', letterSpacing: '-1.5px' }}>
                {ist.h}:{ist.m}
              </span>
              <span className="font-bold text-sky-400 tabular-nums pb-px"
                    style={{ fontSize: '1.2rem', letterSpacing: '-1px' }}>
                :{ist.s}
              </span>
              <span className="text-xs font-bold text-sky-500 pb-0.5 ml-1">{ist.ampm}</span>
              <span className="text-xs font-semibold text-gray-400 pb-0.5 ml-1">IST</span>
            </div>
          </div>
        </div>

        {/* ── Logo ── */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center
                       text-4xl mx-auto mb-4 shadow-lg shadow-sky-200"
            style={{ animation: 'loginFloat 3.5s ease-in-out infinite' }}
          >
            🙏
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DP Work App</h1>
          <p className="text-gray-500 text-sm mt-1">Bangalore SUK — Member Management</p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-sky-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@dp.app"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-700 text-white font-semibold
                       py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* ── Demo credentials ── */}
        <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-sky-100 text-xs text-sky-800">
          <p className="font-semibold mb-1">Demo Credentials</p>
          <p>Admin: <span className="font-mono">admin@dp.app</span> / <span className="font-mono">admin123</span></p>
          <p>Satsangee: <span className="font-mono">pritosh@dp.app</span> / <span className="font-mono">satsangee123</span></p>
        </div>
      </div>

      <style>{`
        @keyframes loginFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}
