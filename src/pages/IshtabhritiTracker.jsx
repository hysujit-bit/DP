import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, Phone, AlertTriangle, XCircle,
  Bell, Calendar, ChevronRight, ChevronDown,
} from 'lucide-react';
import IshtabhritiTimeline from '../components/IshtabhritiTimeline';

// ── helpers ──────────────────────────────────────────────────────────────────

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
function daysSince(dateStr) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d   = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((now - d) / 86400000);
}
function fmtShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function fmtFull(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── status logic ─────────────────────────────────────────────────────────────
// GREEN  = paid within last 30 days (cycle current)
// YELLOW = overdue 1–30 extra days (1 missed cycle)
// ORANGE = overdue 31–60 extra days (2 missed cycles)
// RED    = overdue 60+ days or never sent (3+ missed)

function calcStatus(lastDate) {
  if (!lastDate) return 'RED';
  const days = daysSince(lastDate);
  if (days <= 30) return 'GREEN';
  if (days <= 60) return 'YELLOW';
  if (days <= 90) return 'ORANGE';
  return 'RED';
}

const STATUS = {
  GREEN:  {
    label: 'Up to date', short: 'OK',
    ring: 'ring-green-200',  bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-400', bar: 'bg-green-400',
    Icon: CheckCircle2, iconCls: 'text-green-500',
    leftBorder: 'border-l-green-400',
  },
  YELLOW: {
    label: 'Reminder due', short: '1 month',
    ring: 'ring-yellow-200', bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-400', bar: 'bg-yellow-400',
    Icon: Clock, iconCls: 'text-yellow-500',
    leftBorder: 'border-l-yellow-400',
  },
  ORANGE: {
    label: '2 months due', short: '2 months',
    ring: 'ring-sky-200', bg: 'bg-sky-50',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500', bar: 'bg-sky-400',
    Icon: AlertTriangle, iconCls: 'text-sky-500',
    leftBorder: 'border-l-sky-400',
  },
  RED: {
    label: '3+ months', short: '3+ months',
    ring: 'ring-red-200',    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500', bar: 'bg-red-400',
    Icon: XCircle, iconCls: 'text-red-500',
    leftBorder: 'border-l-red-400',
  },
};

const STATUS_ORDER = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 };

// ── main component ────────────────────────────────────────────────────────────

export default function IshtabhritiTracker() {
  const { members, payments, recordPayment, user } = useApp();
  const navigate  = useNavigate();
  const [tab, setTab]               = useState('today');
  const [justMarked, setJustMarked] = useState(new Set());
  const [justNotSent, setJustNotSent] = useState(new Set());

  const today    = todayStr();
  const tomorrow = addDays(today, 1);

  // Eligible: active ishtabhrity members
  const eligible = useMemo(() =>
    members.filter(m =>
      !m.isRemoved &&
      m.memberCategory !== 'PROSPECT' &&
      m.memberCategory !== 'DEFAULTER' &&
      m.ishtabhritiStatus !== 'NOT_APPLICABLE' &&
      m.ishtabhritiStatus !== 'INACTIVE'
    ),
  [members]);

  // Enrich each member with cycle data
  const enriched = useMemo(() => {
    return eligible.map(m => {
      // Only SENT records count towards the 30-day cycle
      const history = payments
        .filter(p => p.personId === m.id && (!p.status || p.status === 'SENT'))
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

      const lastDate  = history[0]?.paymentDate || null;
      const nextDue   = lastDate ? addDays(lastDate, 30) : null;
      const status    = calcStatus(lastDate);
      const sentToday = justMarked.has(m.id) ||
        (history[0]?.paymentDate === today);

      // Progress bar: 0–100% through the 30-day cycle (capped at 100 even if overdue)
      let cycleProgress = 0;
      if (lastDate) {
        const elapsed = daysSince(lastDate);
        cycleProgress = Math.min(Math.round((elapsed / 30) * 100), 100);
      }

      return { ...m, lastDate, nextDue, status, sentToday, cycleProgress };
    });
  }, [eligible, payments, justMarked, today]);

  // Tab buckets
  const dueToday    = useMemo(() =>
    enriched
      .filter(m => !m.sentToday && !justNotSent.has(m.id) && (m.nextDue === today || m.nextDue < today || !m.nextDue))
      .sort((a, b) => STATUS_ORDER[b.status] - STATUS_ORDER[a.status]),
  [enriched, today, justNotSent]);

  const confirmedToday = useMemo(() =>
    enriched.filter(m => m.sentToday),
  [enriched]);

  const notSentToday = useMemo(() =>
    enriched.filter(m => justNotSent.has(m.id)),
  [enriched, justNotSent]);

  const dueTomorrow = useMemo(() =>
    enriched.filter(m => !m.sentToday && m.nextDue === tomorrow),
  [enriched, tomorrow]);

  const handleMarkSent = (member) => {
    recordPayment({
      personId:     member.id,
      familyCode:   member.familyCode,
      paymentDate:  today,
      status:       'SENT',
      monthCovered: today.slice(0, 7),
      recordedBy:   user?.id,
    });
    setJustMarked(prev => new Set([...prev, member.id]));
    setJustNotSent(prev => { const s = new Set(prev); s.delete(member.id); return s; });
  };

  const handleMarkNotSent = (member) => {
    recordPayment({
      personId:     member.id,
      familyCode:   member.familyCode,
      paymentDate:  today,
      status:       'NOT_SENT',
      monthCovered: today.slice(0, 7),
      recordedBy:   user?.id,
    });
    setJustNotSent(prev => new Set([...prev, member.id]));
  };

  const tabs = [
    { key: 'today',    label: 'Today',       badge: dueToday.length    },
    { key: 'tomorrow', label: 'Tomorrow',    badge: dueTomorrow.length  },
    { key: 'all',      label: 'All Members', badge: null               },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ishtabhrity Tracker</h1>
        <p className="text-sm text-gray-500">30-day cycle reminders · {eligible.length} active members</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? 'bg-sky-100 text-sky-700' : 'bg-gray-200 text-gray-500'
              }`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'today'    && <TodayView    due={dueToday} confirmed={confirmedToday} notSent={notSentToday} today={today} onMark={handleMarkSent} onMarkNotSent={handleMarkNotSent} navigate={navigate} />}
      {tab === 'tomorrow' && <TomorrowView due={dueTomorrow} tomorrow={tomorrow} navigate={navigate} />}
      {tab === 'all'      && <AllView      members={enriched} payments={payments} navigate={navigate} />}
    </div>
  );
}

// ── Today view ────────────────────────────────────────────────────────────────

function TodayView({ due, confirmed, notSent, today, onMark, onMarkNotSent, navigate }) {
  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium text-gray-500">{fmtFull(today)}</p>
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-1 rounded-full font-medium">
            {due.length} need reminder
          </span>
          <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded-full font-medium">
            {confirmed.length} confirmed
          </span>
          {notSent.length > 0 && (
            <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded-full font-medium">
              {notSent.length} not sent
            </span>
          )}
        </div>
      </div>

      {/* Pending — needs reminder */}
      {due.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Needs reminder today</p>
          {due.map(m => (
            <MemberCard key={m.id} m={m} showMark onMark={onMark} onMarkNotSent={onMarkNotSent} navigate={navigate} />
          ))}
        </div>
      )}

      {/* Confirmed sent */}
      {confirmed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Confirmed sent ✓</p>
          {confirmed.map(m => (
            <MemberCard key={m.id} m={{ ...m, status: 'GREEN' }} navigate={navigate} confirmed />
          ))}
        </div>
      )}

      {/* Marked not sent */}
      {notSent.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Not sent this month</p>
          {notSent.map(m => (
            <MemberCard key={m.id} m={{ ...m, status: 'RED' }} navigate={navigate} markedNotSent />
          ))}
        </div>
      )}

      {due.length === 0 && confirmed.length === 0 && notSent.length === 0 && (
        <EmptyState icon="🎉" title="All clear for today!" sub="No Ishtabhrity reminders due today" />
      )}
    </div>
  );
}

// ── Tomorrow view ─────────────────────────────────────────────────────────────

function TomorrowView({ due, tomorrow, navigate }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-500">{fmtFull(tomorrow)}</p>

      {due.length > 0 ? (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Calendar size={15} className="flex-shrink-0" />
            {due.length} member{due.length > 1 ? 's' : ''} will be due tomorrow — you can send an advance reminder today.
          </div>
          <div className="space-y-2">
            {due.map(m => (
              <MemberCard key={m.id} m={m} navigate={navigate} showLastDate />
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon="📅" title="Nothing due tomorrow" sub="No Ishtabhrity scheduled for tomorrow" />
      )}
    </div>
  );
}

// ── All Members view ──────────────────────────────────────────────────────────

function AllView({ members, payments, navigate }) {
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const groups = {
    GREEN:  members.filter(m => m.status === 'GREEN'),
    YELLOW: members.filter(m => m.status === 'YELLOW'),
    ORANGE: members.filter(m => m.status === 'ORANGE'),
    RED:    members.filter(m => m.status === 'RED'),
  };

  const displayed = filter === 'ALL'
    ? [...groups.RED, ...groups.ORANGE, ...groups.YELLOW, ...groups.GREEN]
    : members.filter(m => m.status === filter);

  const summaryItems = [
    { key: 'GREEN',  label: 'Up to date', bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-400',  count: groups.GREEN.length  },
    { key: 'YELLOW', label: 'Reminder',   bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-400', count: groups.YELLOW.length },
    { key: 'ORANGE', label: '2 months',   bg: 'bg-sky-50', text: 'text-sky-700', bar: 'bg-sky-400', count: groups.ORANGE.length },
    { key: 'RED',    label: '3+ months',  bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-400',    count: groups.RED.length    },
  ];

  const filters = [
    { key: 'ALL',    label: 'All',         count: members.length      },
    { key: 'RED',    label: '🔴 Critical', count: groups.RED.length   },
    { key: 'ORANGE', label: '🟠 2 months', count: groups.ORANGE.length},
    { key: 'YELLOW', label: '🟡 Reminder', count: groups.YELLOW.length},
    { key: 'GREEN',  label: '🟢 OK',       count: groups.GREEN.length },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        {summaryItems.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key === filter ? 'ALL' : s.key)}
            className={`${s.bg} rounded-xl p-3 text-center transition-all ${filter === s.key ? 'ring-2 ring-offset-1 ring-gray-300' : ''}`}>
            <div className={`text-2xl font-bold ${s.text}`}>{s.count}</div>
            <div className={`text-xs ${s.text} mt-0.5 leading-tight`}>{s.label}</div>
            {/* Animated progress bar */}
            <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                style={{ width: members.length > 0 ? `${(s.count / members.length) * 100}%` : '0%' }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              filter === f.key
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {displayed.map(m => {
          const isOpen = expanded === m.id;
          const memberPays = payments.filter(p => p.personId === m.id);
          return (
            <div key={m.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="flex items-center bg-white">
                <div className="flex-1">
                  <MemberCard m={m} navigate={navigate} showProgress showLastDate noWrapper />
                </div>
                <button
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                  className="px-3 py-4 text-gray-300 hover:text-sky-500 transition-colors flex-shrink-0 border-l border-gray-50"
                  title="Show timeline"
                >
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              {isOpen && (
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">30-day cycle</p>
                  <IshtabhritiTimeline
                    memberId={m.id}
                    memberPayments={memberPays}
                    startDate={m.ishtabhritiStartDate || null}
                  />
                </div>
              )}
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400 text-sm">No members in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared MemberCard ─────────────────────────────────────────────────────────

function MemberCard({ m, showMark, onMark, onMarkNotSent, navigate, confirmed, markedNotSent, showProgress, showLastDate, noWrapper }) {
  const cfg = STATUS[m.status] || STATUS.RED;
  const { Icon } = cfg;

  const inner = (
    <>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        confirmed     ? 'bg-green-100 text-green-700' :
        markedNotSent ? 'bg-red-100 text-red-600' :
        'bg-sky-100 text-sky-700'
      }`}>
        {confirmed
          ? <CheckCircle2 size={18} className="text-green-500" />
          : markedNotSent
          ? <span className="text-base">✕</span>
          : m.name.charAt(0)
        }
      </div>

      {/* Info */}
      <button onClick={() => navigate(`/members/${m.id}`)} className="flex-1 text-left min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{m.name}</div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
          {m.area && <span>{m.area}</span>}
          {confirmed     && <span className="text-green-600 font-medium">Confirmed today ✓</span>}
          {markedNotSent && <span className="text-red-500 font-medium">Not sent — logged today</span>}
          {!confirmed && showLastDate && m.lastDate && (
            <span>Last: {fmtShort(m.lastDate)}</span>
          )}
          {!confirmed && m.nextDue && !showProgress && (
            <span className="text-sky-500">Next due: {fmtShort(m.nextDue)}</span>
          )}
          {!confirmed && !m.lastDate && (
            <span className="text-red-500 font-medium">Never sent</span>
          )}
        </div>

        {/* Animated cycle progress bar */}
        {showProgress && m.lastDate && !confirmed && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                style={{ width: `${m.cycleProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 w-24 text-right">
              {m.status === 'GREEN'
                ? `Next: ${fmtShort(m.nextDue)}`
                : `${Math.round(daysSince(m.lastDate) - 30)}d overdue`
              }
            </span>
          </div>
        )}
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status badge (hidden on small, shown on sm+) */}
        {!confirmed && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${cfg.badge}`}>
            <Icon size={10} />
            {cfg.label}
          </span>
        )}
        {m.contactNo && (
          <a href={`tel:${m.contactNo}`}
            className="text-gray-300 hover:text-sky-500 transition-colors p-1"
            onClick={e => e.stopPropagation()}>
            <Phone size={15} />
          </a>
        )}
        {showMark && !confirmed && (
          <div className="flex flex-col gap-1">
            <button onClick={() => onMark(m)}
              className="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap border border-green-200">
              <Bell size={11} /> Sent ✓
            </button>
            <button onClick={() => onMarkNotSent(m)}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap border border-red-100">
              ✕ Not Sent
            </button>
          </div>
        )}
        {!showMark && !confirmed && !noWrapper && (
          <ChevronRight size={15} className="text-gray-300" />
        )}
      </div>
    </>
  );

  if (noWrapper) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 border-l-4 ${cfg.leftBorder} ${
        confirmed ? 'border-green-200' : ''
      }`}>
        {inner}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-l-4 ${cfg.leftBorder} rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm transition-all ${
      confirmed ? 'opacity-80 border-green-200' : 'border-gray-100'
    }`}>
      {inner}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }) {
  return (
    <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-800 font-semibold">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
