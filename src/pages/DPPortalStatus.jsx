import { useEffect, useState, useRef } from 'react';
import { Sparkles, Wrench } from 'lucide-react';
import FloralBg from '../components/FloralBg';

const FEATURES = [
  'Online Member Portal',
  'Self-service Ishtabhrity Payments',
  'Member Communication Hub',
  'Digital Drive Check-ins',
  'Satsang Event Notifications',
  'Member Dashboard & History',
];

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

export default function DPPortalStatus() {
  const [now,      setNow]      = useState(() => getIST());
  const [visible,  setVisible]  = useState(0);
  const [dots,     setDots]     = useState('');
  const [angle,    setAngle]    = useState(0);
  const rafRef  = useRef(null);
  const lastRef = useRef(null);

  /* Live clock */
  useEffect(() => {
    const id = setInterval(() => setNow(getIST()), 1000);
    return () => clearInterval(id);
  }, []);

  /* UFO orbit via RAF */
  useEffect(() => {
    lastRef.current = performance.now();
    const step = (ts) => {
      const dt = ts - lastRef.current;
      lastRef.current = ts;
      setAngle(a => (a + dt * 0.04) % 360);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* Feature cycling */
  useEffect(() => {
    const id = setInterval(() => setVisible(v => (v + 1) % FEATURES.length), 2200);
    return () => clearInterval(id);
  }, []);

  /* WIP dots */
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  const ist = formatIST(now);
  const toRad = d => d * Math.PI / 180;
  const ufoR  = 54;
  const ux = 80 + ufoR * Math.cos(toRad(angle));
  const uy = 80 + ufoR * Math.sin(toRad(angle));

  return (
    <div
      className="relative flex flex-col items-center justify-start px-4 py-8 overflow-hidden"
      style={{ minHeight: '80vh', background: 'linear-gradient(160deg, #f0f9ff 0%, #f8fbff 40%, #e0f2fe 100%)' }}
    >
      {/* Floral background */}
      <FloralBg />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">

        {/* ════ IST CLOCK CARD ════ */}
        <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-xl"
             style={{ border: '1.5px solid rgba(2,132,199,0.25)' }}>
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-sky-600 to-sky-400" />
          <div
            className="px-5 py-5 text-center"
            style={{ background: 'linear-gradient(160deg,rgba(255,255,255,0.97) 0%,rgba(240,249,255,0.97) 100%)' }}
          >
            <p className="text-xs font-bold text-sky-400 uppercase tracking-[0.18em] mb-1">
              {ist.day}
            </p>
            <p className="text-sm font-semibold text-gray-400 mb-3">
              {ist.date}&nbsp;{ist.month}&nbsp;{ist.year}
            </p>
            <div className="flex items-end justify-center gap-0.5 leading-none mb-3">
              <span className="font-black text-gray-900 tabular-nums"
                    style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
                {ist.h}:{ist.m}
              </span>
              <span className="font-bold text-sky-400 tabular-nums pb-0.5"
                    style={{ fontSize: '1.9rem', letterSpacing: '-1px' }}>
                :{ist.s}
              </span>
              <span className="text-base font-bold text-sky-500 pb-1 ml-1">{ist.ampm}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-sky-500 text-white
                             text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white"
                    style={{ animation: 'dpPulse 1.4s ease-in-out infinite' }} />
              India Standard Time (IST)
            </span>
          </div>
        </div>

        {/* ════ UFO orbit ════ */}
        <div className="relative mb-6 select-none" style={{ width: 160, height: 160 }}>
          <div className="absolute inset-0 rounded-full"
               style={{
                 background: 'radial-gradient(circle,rgba(2,132,199,0.18) 0%,transparent 70%)',
                 animation: 'dpPulse 2.4s ease-in-out infinite',
               }} />
          <svg width="160" height="160" className="absolute inset-0" overflow="visible">
            <circle cx="80" cy="80" r={ufoR}
              fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="4 6" />
            {[0, 120, 240].map((a, i) => (
              <circle key={i}
                cx={80 + ufoR * Math.cos(toRad(a))}
                cy={80 + ufoR * Math.sin(toRad(a))}
                r="2.5" fill="#38bdf8" opacity="0.4" />
            ))}
          </svg>
          <div className="absolute text-lg select-none"
               style={{ left: ux - 10, top: uy - 10, transform: `rotate(${angle + 90}deg)` }}>
            🛸
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-700
                            rounded-2xl flex items-center justify-center shadow-lg"
                 style={{ animation: 'dpFloat 3s ease-in-out infinite' }}>
              <Wrench size={32} className="text-white"
                      style={{ animation: 'dpSpin 7s linear infinite' }} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight text-center">
          DP Portal
        </h1>
        <p className="text-sky-500 font-semibold text-sm mt-1 tracking-wide uppercase">
          Work in Progress{dots}
        </p>

        <p className="text-gray-500 text-sm text-center max-w-xs mt-3 leading-relaxed">
          We're building an online portal so members can manage their own profiles,
          payments and stay connected — all from their phones.
        </p>

        {/* Feature pill */}
        <div className="mt-7 w-full">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-3">
            Coming soon
          </p>
          <div className="relative h-11 overflow-hidden">
            {FEATURES.map((feat, i) => (
              <div key={feat}
                   className="absolute inset-x-0 flex items-center justify-center transition-all duration-500"
                   style={{
                     opacity:   visible === i ? 1 : 0,
                     transform: visible === i ? 'translateY(0)' : 'translateY(14px)',
                   }}>
                <span className="inline-flex items-center gap-2 bg-white/80 border border-sky-200
                                 text-sky-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm backdrop-blur-sm">
                  <Sparkles size={13} />
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Development progress</span>
            <span className="font-semibold text-sky-500">Planning phase</span>
          </div>
          <div className="h-2.5 bg-white/60 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
                 style={{ width: '12%', animation: 'dpProgress 2.2s ease-in-out infinite' }} />
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center max-w-[270px]">
          This section will be activated once the portal is ready for members.
        </p>
      </div>

      <style>{`
        @keyframes dpFloat    { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-7px)} }
        @keyframes dpSpin     { from{transform:rotate(0deg)}         to{transform:rotate(360deg)}   }
        @keyframes dpPulse    { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes dpProgress { 0%,100%{opacity:1}                   50%{opacity:.5}                }
      `}</style>
    </div>
  );
}
