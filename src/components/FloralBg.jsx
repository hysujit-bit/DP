/**
 * FloralBg — full-screen background animation
 * Floating flower emojis + faint mandala SVG, inspired by bangaloresuk.github.io/bsuk
 * Drop inside any `relative overflow-hidden` container.
 */

const FLOWERS = [
  { e: '🪷', x: 5,  dur: 14, del: 0,    size: 22 },
  { e: '🌸', x: 12, dur: 18, del: 2.5,  size: 16 },
  { e: '🌺', x: 22, dur: 12, del: 1,    size: 20 },
  { e: '🪷', x: 31, dur: 16, del: 4,    size: 14 },
  { e: '🌸', x: 40, dur: 20, del: 0.5,  size: 24 },
  { e: '🌻', x: 48, dur: 13, del: 6,    size: 18 },
  { e: '🌺', x: 57, dur: 17, del: 3,    size: 14 },
  { e: '🪷', x: 65, dur: 11, del: 7.5,  size: 20 },
  { e: '🌸', x: 73, dur: 19, del: 1.5,  size: 16 },
  { e: '🌺', x: 80, dur: 15, del: 5,    size: 22 },
  { e: '🌸', x: 88, dur: 12, del: 2,    size: 14 },
  { e: '🪷', x: 94, dur: 16, del: 8,    size: 18 },
  { e: '🌻', x: 17, dur: 21, del: 9,    size: 13 },
  { e: '🌺', x: 35, dur: 14, del: 10.5, size: 16 },
  { e: '🌸', x: 53, dur: 18, del: 3.5,  size: 20 },
  { e: '🪷', x: 70, dur: 22, del: 6.5,  size: 12 },
  { e: '🌺', x: 85, dur: 13, del: 11,   size: 18 },
  { e: '🌸', x: 8,  dur: 17, del: 12,   size: 15 },
  { e: '🪷', x: 44, dur: 20, del: 7,    size: 22 },
  { e: '🌻', x: 62, dur: 15, del: 4.5,  size: 16 },
];

/* Mandala SVG — concentric petals + rings, very faint */
function Mandala() {
  const petals = (count, rx, ry, r, opacity) =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360;
      return (
        <ellipse
          key={i}
          cx={Math.cos((angle * Math.PI) / 180) * r}
          cy={Math.sin((angle * Math.PI) / 180) * r}
          rx={rx} ry={ry}
          transform={`rotate(${angle})`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity={opacity}
        />
      );
    });

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 520, height: 520,
        animation: 'mandalaRotate 90s linear infinite',
      }}
    >
      <svg
        viewBox="-260 -260 520 520"
        width="520" height="520"
        className="text-sky-400"
        style={{ opacity: 0.09 }}
      >
        {/* Outer rings */}
        <circle cx="0" cy="0" r="240" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="210" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="0" cy="0" r="180" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="150" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="0" cy="0" r="120" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="90"  fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="0" cy="0" r="60"  fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="30"  fill="none" stroke="currentColor" strokeWidth="0.8" />

        {/* Outer petal ring */}
        {petals(16, 22, 9, 215, 0.7)}
        {/* Mid petal ring */}
        {petals(12, 18, 7, 162, 0.7)}
        {/* Inner petal ring */}
        {petals(8,  14, 6, 108, 0.8)}
        {/* Innermost petals */}
        {petals(6,  10, 4, 68,  0.9)}

        {/* Radiating spokes */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 30}  y1={Math.sin(a) * 30}
              x2={Math.cos(a) * 240} y2={Math.sin(a) * 240}
              stroke="currentColor" strokeWidth="0.4" opacity="0.5"
            />
          );
        })}

        {/* Centre dot */}
        <circle cx="0" cy="0" r="6" fill="currentColor" opacity="0.4" />
        <circle cx="0" cy="0" r="3" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
  );
}

export default function FloralBg() {
  return (
    <>
      {/* Floating flowers */}
      {FLOWERS.map((f, i) => (
        <div
          key={i}
          className="absolute bottom-0 pointer-events-none select-none"
          style={{
            left:            `${f.x}%`,
            fontSize:        f.size,
            animationName:   'floatUp',
            animationDuration:`${f.dur}s`,
            animationDelay:  `${f.del}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
          }}
        >
          {f.e}
        </div>
      ))}

      {/* Mandala */}
      <Mandala />

      {/* Keyframes */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)      rotate(0deg);   opacity: 0;   }
          8%   { opacity: 0.75; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(-105vh) rotate(25deg);  opacity: 0;   }
        }
        @keyframes mandalaRotate {
          from { transform: translateX(-50%) translateY(-50%) rotate(0deg); }
          to   { transform: translateX(-50%) translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </>
  );
}