import { useMemo } from 'react';

// ── date helpers ──────────────────────────────────────────────────────────────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr() {
  return localDateStr(new Date());
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}
function absDaysDiff(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.abs(Math.round((db - da) / 86400000));
}
function fmtLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── node builder ──────────────────────────────────────────────────────────────
// Walks the 30-day cycle from ishtabhritiStartDate forward.
// For each slot, looks for a payment within ±10 days.
// Returns last 5 history nodes + up to 2 upcoming nodes.

function buildNodes(paymentDates, startDate, today) {
  const sorted = [...paymentDates].sort();
  const showUntil = addDays(today, 62);
  const nodes = [];
  let cursor = startDate;
  let payIdx = 0;

  while (cursor <= showUntil) {
    // Look for a payment within ±10 days of cursor
    let matched = null;
    for (let i = payIdx; i < sorted.length; i++) {
      if (absDaysDiff(sorted[i], cursor) <= 10) {
        matched = sorted[i];
        payIdx = i + 1;
        break;
      }
      // Payment is more than 10 days past cursor – stop looking
      const p = new Date(sorted[i] + 'T00:00:00');
      const c = new Date(cursor + 'T00:00:00');
      if (p - c > 10 * 86400000) break;
    }

    let kind;
    if (matched) {
      kind = 'PAID';
    } else if (cursor < today) {
      kind = 'MISSED';
    } else if (cursor === today) {
      kind = 'DUE_TODAY';
    } else {
      kind = 'UPCOMING';
    }

    nodes.push({
      scheduledDate: cursor,
      actualDate: matched || cursor, // use actual payment date for label
      kind,
      isPayment: !!matched,
    });

    cursor = addDays(cursor, 30);
  }

  // Show last 5 non-upcoming + up to 2 upcoming
  const history = nodes.filter(n => n.kind !== 'UPCOMING');
  const future  = nodes.filter(n => n.kind === 'UPCOMING');
  return [...history.slice(-5), ...future.slice(0, 2)];
}

// ── visual config ─────────────────────────────────────────────────────────────
const NODE = {
  PAID:      {
    outerCls:  'border-green-400 bg-white shadow-md',
    innerCls:  'bg-sky-400',
    dashCls:   'border-sky-300',
    labelCls:  'text-green-600 font-semibold',
    label:     'Sent ✓',
    segCls:    'bg-green-400',
  },
  MISSED:    {
    outerCls:  'border-red-400 bg-white shadow-sm',
    innerCls:  'bg-red-400',
    dashCls:   'border-red-300',
    labelCls:  'text-red-500',
    label:     'Missed',
    segCls:    'bg-red-300',
  },
  DUE_TODAY: {
    outerCls:  'border-sky-600 bg-sky-50 shadow-md ring-2 ring-sky-200',
    innerCls:  'bg-sky-600',
    dashCls:   'border-sky-400',
    labelCls:  'text-sky-700 font-bold',
    label:     'Due Today',
    segCls:    'bg-sky-300',
  },
  UPCOMING:  {
    outerCls:  'border-gray-300 bg-white shadow-sm',
    innerCls:  'bg-gray-300',
    dashCls:   'border-gray-200',
    labelCls:  'text-gray-400',
    label:     'Upcoming',
    segCls:    'bg-gray-200',
  },
};

function segmentColor(fromKind, toKind) {
  if (toKind === 'UPCOMING')  return 'bg-gray-200';
  if (fromKind === 'PAID')    return 'bg-green-400';
  if (fromKind === 'MISSED')  return 'bg-red-300';
  if (fromKind === 'DUE_TODAY') return 'bg-sky-300';
  return 'bg-gray-200';
}

// ── component ─────────────────────────────────────────────────────────────────
export default function IshtabhritiTimeline({ memberId, memberPayments, startDate }) {
  const today = todayStr();

  const nodes = useMemo(() => {
    if (!startDate) return [];
    // Only SENT records (or legacy records without a status) define the timeline dots
    const dates = memberPayments
      .filter(p => !p.status || p.status === 'SENT')
      .map(p => p.paymentDate);
    return buildNodes(dates, startDate, today);
  }, [memberId, memberPayments, startDate, today]);

  if (!startDate) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 text-sm text-gray-400 italic">
        <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
        Ishtabhrity start date not set — edit member to add it
      </div>
    );
  }

  if (nodes.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <div className="inline-flex items-center px-3 py-1" style={{ minWidth: 'max-content' }}>
        {nodes.map((node, i) => {
          const cfg = NODE[node.kind];
          const prevKind = i > 0 ? nodes[i - 1].kind : null;
          const segCls = prevKind ? segmentColor(prevKind, node.kind) : '';

          return (
            <div key={i} className="inline-flex items-center">
              {/* Connecting line segment */}
              {i > 0 && (
                <div
                  className={`h-1.5 rounded-full ${segCls} transition-all duration-500`}
                  style={{ width: 36 }}
                />
              )}

              {/* Node column: date above | circle | status below */}
              <div className="flex flex-col items-center" style={{ width: 68 }}>

                {/* ── TOP: date label + dashed pointer ── */}
                <div className="flex flex-col items-center" style={{ height: 36 }}>
                  <span className="text-xs font-bold text-gray-600 whitespace-nowrap leading-none">
                    {fmtLabel(node.actualDate)}
                  </span>
                  {/* dashed vertical line going down to circle */}
                  <div
                    className={`mt-1 border-l-2 border-dashed ${cfg.dashCls} flex-1`}
                    style={{ width: 0 }}
                  />
                </div>

                {/* ── MIDDLE: circle ── */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${cfg.outerCls} transition-all duration-300`}
                >
                  <div className={`w-3 h-3 rounded-full ${cfg.innerCls} transition-colors duration-300`} />
                </div>

                {/* ── BOTTOM: dashed pointer + status label ── */}
                <div className="flex flex-col items-center" style={{ height: 32 }}>
                  <div
                    className="border-l border-dashed border-gray-200"
                    style={{ width: 0, height: 8 }}
                  />
                  <span className={`text-xs whitespace-nowrap leading-tight mt-0.5 ${cfg.labelCls}`}>
                    {cfg.label}
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
