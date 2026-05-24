import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

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
    try {
      const result = await login(email, password);
      if (result?.ok) navigate('/');
      else { setError(result?.error || 'Login failed'); setLoading(false); }
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const ist = formatIST(now);

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">

      {/* ── Left panel — geometric blue ── */}
      <div className="relative hidden md:flex md:w-3/5 flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #075985 0%, #0369a1 35%, #0284c7 65%, #0ea5e9 100%)' }}>

        {/* Geometric polygon facets */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 900"
          preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 280,0 120,180"          fill="rgba(255,255,255,0.06)" />
          <polygon points="280,0 700,0 700,200 460,120" fill="rgba(255,255,255,0.05)" />
          <polygon points="120,180 280,0 460,120 300,320" fill="rgba(0,0,0,0.08)" />
          <polygon points="0,0 120,180 0,380"           fill="rgba(0,0,0,0.10)" />
          <polygon points="700,0 700,200 460,120"       fill="rgba(255,255,255,0.09)" />
          <polygon points="460,120 700,200 700,480 520,380" fill="rgba(0,0,0,0.07)" />
          <polygon points="300,320 460,120 520,380 340,520" fill="rgba(255,255,255,0.05)" />
          <polygon points="0,380 120,180 300,320 180,520" fill="rgba(255,255,255,0.04)" />
          <polygon points="180,520 300,320 340,520 200,700" fill="rgba(0,0,0,0.09)" />
          <polygon points="340,520 520,380 700,480 600,680" fill="rgba(255,255,255,0.06)" />
          <polygon points="200,700 340,520 600,680 420,880" fill="rgba(0,0,0,0.08)" />
          <polygon points="0,380 180,520 200,700 0,900"  fill="rgba(255,255,255,0.04)" />
          <polygon points="600,680 700,480 700,900 500,900" fill="rgba(0,0,0,0.10)" />
          <polygon points="420,880 600,680 500,900"      fill="rgba(255,255,255,0.05)" />
          <polygon points="0,900 200,700 420,880 500,900 700,900" fill="rgba(0,0,0,0.06)" />
        </svg>

        {/* Left panel content */}
        <div className="relative z-10 text-center px-12">
          <div className="text-8xl mb-6" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.25))' }}>
            🙏
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            DP Work App
          </h1>
          <p className="text-sky-100 text-base font-medium leading-relaxed max-w-xs mx-auto"
             style={{ textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>
            Bengaluru Satsang — SUK-wise DP Activity & Member Tracker
          </p>

          {/* Clock */}
          <div className="mt-10 inline-flex flex-col items-center bg-white/10 backdrop-blur-sm
                          border border-white/20 rounded-2xl px-8 py-4">
            <div className="flex items-end gap-1 leading-none">
              <span className="font-black text-white tabular-nums"
                    style={{ fontSize: '2.4rem', letterSpacing: '-2px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {ist.h}:{ist.m}
              </span>
              <span className="font-bold text-sky-200 tabular-nums pb-1"
                    style={{ fontSize: '1.4rem', letterSpacing: '-1px' }}>
                :{ist.s}
              </span>
              <span className="text-sm font-bold text-sky-200 pb-1 ml-1">{ist.ampm}</span>
              <span className="text-xs font-semibold text-sky-300 pb-1 ml-0.5">IST</span>
            </div>
            <p className="text-sky-200 text-xs font-semibold mt-1 tracking-wide uppercase">
              {ist.day}, {ist.date} {ist.month} {ist.year}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">

        {/* Mobile-only header */}
        <div className="md:hidden text-center mb-8">
          <div className="text-5xl mb-3">🙏</div>
          <h1 className="text-2xl font-black text-gray-900">DP Work App</h1>
          <p className="text-gray-400 text-sm mt-1">Bengaluru Satsang — SUK-wise DP Activity & Member Tracker</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">Welcome back</h2>
            <p className="text-gray-400 text-sm mt-1">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm
                             bg-gray-50 focus:bg-white focus:outline-none focus:border-sky-400
                             transition-colors placeholder-gray-300"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm
                             bg-gray-50 focus:bg-white focus:outline-none focus:border-sky-400
                             transition-colors placeholder-gray-300"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50
                              border border-red-100 px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-widest
                         uppercase transition-all disabled:opacity-60"
              style={{
                background: loading
                  ? '#7dd3fc'
                  : 'linear-gradient(135deg, #0369a1 0%, #0284c7 60%, #0ea5e9 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(3,105,161,0.35)',
              }}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
