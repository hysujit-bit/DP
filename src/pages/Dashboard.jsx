import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES, SUKS } from '../constants';
import { CategoryBadge } from '../components/Badge';
import {
  IndianRupee, Calendar, CheckCircle2, ChevronRight,
  Zap, UserX, Bell, Activity, AlertTriangle, UserCheck, Clock,
} from 'lucide-react';

// ── Date helpers ──────────────────────────────────────────────────────────────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr() { return localDateStr(new Date()); }
function addDays(s, n) {
  const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return localDateStr(d);
}
function daysSince(s) {
  const now = new Date(); now.setHours(0,0,0,0);
  const d   = new Date(s + 'T00:00:00'); d.setHours(0,0,0,0);
  return Math.round((now - d) / 86400000);
}
function fmtShort(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function fmtFull(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function calcIshStatus(lastDate) {
  if (!lastDate) return 'RED';
  const d = daysSince(lastDate);
  if (d <= 30) return 'GREEN';
  if (d <= 60) return 'YELLOW';
  if (d <= 90) return 'ORANGE';
  return 'RED';
}

// Pre-defined bar colours for category breakdown (statically listed so Tailwind includes them)
const CAT_BAR = {
  ACTIVE_DP_WORKER:    'bg-green-400',
  REGULAR_CONTRIBUTOR: 'bg-blue-400',
  SEMI_ACTIVE:         'bg-sky-400',
  DEFAULTER:           'bg-red-400',
  PROSPECT:            'bg-purple-400',
  SUPER_NEW:           'bg-teal-400',
};

const ISH_STATUS = {
  GREEN:  { label: 'Up to date',   dot: 'bg-green-400',  badge: 'bg-green-100 text-green-700'   },
  YELLOW: { label: 'Reminder due', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  ORANGE: { label: '2 months due', dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700' },
  RED:    { label: '3+ months',    dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700'       },
};

// ── Entry point ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useApp();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <WorkerDashboard />;
}


// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function AdminDashboard() {
  const { members, workers, visits, payments, drives, user, currentSukId } = useApp();
  const navigate   = useNavigate();
  const today      = todayStr();
  const weekAgo    = addDays(today, -7);
  const nextWeek   = addDays(today, 7);
  const thisMonth  = today.slice(0, 7);
  const currentSuk = SUKS.find(s => s.id === currentSukId)?.name || '';

  const active = useMemo(() => members.filter(m => !m.isRemoved), [members]);

  // ── Drives & Alerts ─────────────────────────────────────────────────────────
  const upcomingDrives = useMemo(() =>
    drives.filter(d => d.date >= today && d.date <= nextWeek)
      .sort((a, b) => a.date.localeCompare(b.date)),
  [drives, today, nextWeek]);

  const unassigned = useMemo(() => active.filter(m => !m.assignedTo), [active]);

  // ── Visits ───────────────────────────────────────────────────────────────────
  const weekVisits = useMemo(() =>
    visits.filter(v => v.visitDate >= weekAgo),
  [visits, weekAgo]);

  const uniqueVisitedThisWeek = useMemo(() =>
    new Set(weekVisits.map(v => v.personId)).size,
  [weekVisits]);

  const newThisMonth = useMemo(() =>
    active.filter(m => m.createdAt?.startsWith(thisMonth)),
  [active, thisMonth]);

  const recentVisits = useMemo(() =>
    [...visits].sort((a, b) => b.visitDate.localeCompare(a.visitDate)).slice(0, 8),
  [visits]);

  // ── Ishtabhrity ──────────────────────────────────────────────────────────────
  const ishEligible = useMemo(() =>
    active.filter(m =>
      m.memberCategory !== 'PROSPECT' &&
      m.memberCategory !== 'DEFAULTER' &&
      m.ishtabhritiStatus !== 'NOT_APPLICABLE' &&
      m.ishtabhritiStatus !== 'INACTIVE',
    ),
  [active]);

  const enrichedIsh = useMemo(() =>
    ishEligible.map(m => {
      const last = payments
        .filter(p => p.personId === m.id && (!p.status || p.status === 'SENT'))
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
      return { ...m, lastDate: last?.paymentDate || null, status: calcIshStatus(last?.paymentDate || null) };
    }),
  [ishEligible, payments]);

  const ishOverdue = useMemo(() =>
    enrichedIsh
      .filter(m => m.status === 'RED' || m.status === 'ORANGE')
      .sort((a, b) => (a.status === 'RED' ? 0 : 1) - (b.status === 'RED' ? 0 : 1))
      .slice(0, 6),
  [enrichedIsh]);

  const ishAlertCount = useMemo(() =>
    enrichedIsh.filter(m => m.status !== 'GREEN').length,
  [enrichedIsh]);

  // ── Category breakdown ───────────────────────────────────────────────────────
  const catCounts = useMemo(() =>
    Object.keys(MEMBER_CATEGORIES).map(k => ({
      key: k,
      count: active.filter(m => m.memberCategory === k).length,
      ...MEMBER_CATEGORIES[k],
    })).filter(c => c.count > 0),
  [active]);

  // ── Worker activity ──────────────────────────────────────────────────────────
  const activeWorkers = useMemo(() => workers.filter(w => w.isActive !== false), [workers]);

  const workerActivity = useMemo(() =>
    activeWorkers.map(w => ({
      ...w,
      assigned:       active.filter(m => m.assignedTo === w.id).length,
      visitsThisWeek: weekVisits.filter(v => v.visitedBy === w.id).length,
    })).sort((a, b) => b.visitsThisWeek - a.visitsThisWeek),
  [activeWorkers, active, weekVisits]);

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentSuk} SUK · {fmtFull(today)}</p>
        </div>
        <p className="text-sm text-gray-500">
          Welcome back, <span className="font-semibold text-gray-700">{user?.name?.split(' ')[0]}</span> 🙏
        </p>
      </div>

      {/* ── Alert Banners ──────────────────────────────────────────────────── */}
      {(upcomingDrives.length > 0 || unassigned.length > 0) && (
        <div className="space-y-2">
          {upcomingDrives.map(drive => (
            <button key={drive.id} onClick={() => navigate(`/dp-work/${drive.id}`)}
              className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-left hover:bg-blue-100 transition-colors"
            >
              <Calendar size={16} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-blue-800">Upcoming Drive: {drive.name}</span>
                <span className="text-xs text-blue-600 ml-2">
                  {fmtShort(drive.date)}{drive.time ? ` at ${drive.time}` : ''} · {drive.memberIds?.length || 0} members planned
                </span>
              </div>
              <ChevronRight size={14} className="text-blue-400 flex-shrink-0" />
            </button>
          ))}

          {unassigned.length > 0 && (
            <button onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-left hover:bg-sky-100 transition-colors"
            >
              <UserX size={16} className="text-sky-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-sky-800">
                  {unassigned.length} member{unassigned.length > 1 ? 's' : ''} have no DP worker assigned
                </span>
                <span className="text-xs text-sky-700 ml-2">Assign in Admin Panel →</span>
              </div>
              <ChevronRight size={14} className="text-sky-400 flex-shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* ── 4 Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Members',      value: active.length,       color: 'text-blue-600',   bg: 'bg-blue-50',                                             action: () => navigate('/members')      },
          { label: 'Visits This Week',   value: weekVisits.length,   color: 'text-green-600',  bg: 'bg-green-50',                                            action: null                            },
          { label: 'Ishtabhrity Alerts', value: ishAlertCount,       color: ishAlertCount > 0 ? 'text-sky-700' : 'text-gray-400', bg: ishAlertCount > 0 ? 'bg-sky-50' : 'bg-gray-50', action: () => navigate('/ishtabhrity') },
          { label: 'Unassigned Members', value: unassigned.length,   color: unassigned.length > 0 ? 'text-red-600' : 'text-gray-400', bg: unassigned.length > 0 ? 'bg-red-50' : 'bg-gray-50', action: () => navigate('/admin') },
        ].map(s => (
          <button key={s.label} onClick={s.action || undefined}
            className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-left ${s.action ? 'hover:shadow-md transition-shadow' : 'cursor-default'}`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── This Week in DP ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-sky-50 to-sky-50 border border-sky-100 rounded-xl px-5 py-3.5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Activity size={15} className="text-sky-500" />
          <span className="text-sm font-semibold text-sky-800">This Week in DP</span>
        </div>
        <div className="flex gap-5 flex-wrap text-sm">
          <span><strong className="text-gray-900">{weekVisits.length}</strong> <span className="text-gray-500">visits logged</span></span>
          <span><strong className="text-gray-900">{uniqueVisitedThisWeek}</strong> <span className="text-gray-500">members touched</span></span>
          <span><strong className="text-gray-900">{newThisMonth.length}</strong> <span className="text-gray-500">new this month</span></span>
          <span><strong className="text-gray-900">{active.filter(m => m.memberCategory === 'PROSPECT').length}</strong> <span className="text-gray-500">prospects active</span></span>
          <span><strong className="text-gray-900">{active.filter(m => m.memberCategory === 'DEFAULTER').length}</strong> <span className="text-gray-500">defaulters</span></span>
        </div>
      </div>

      {/* ── Category Breakdown + Worker Activity ───────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Members by Category</h2>
            <button onClick={() => navigate('/members')} className="text-xs text-sky-700 hover:underline">View all</button>
          </div>
          <div className="space-y-2.5">
            {catCounts.map(c => (
              <button key={c.key} onClick={() => navigate(`/members?cat=${c.key}`)}
                className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg px-1 py-0.5 transition-colors"
              >
                <div className="w-28 flex-shrink-0">
                  <CategoryBadge category={c.key} />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${CAT_BAR[c.key] || 'bg-gray-400'}`}
                    style={{ width: `${Math.max(4, (c.count / active.length) * 100)}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-5 text-right flex-shrink-0">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Worker Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">DP Worker Activity</h2>
          {workerActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No active workers</p>
          ) : (
            <div className="space-y-3">
              {workerActivity.map(w => (
                <div key={w.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 text-sm font-bold flex-shrink-0">
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{w.name}</div>
                    <div className="text-xs text-gray-400">{w.assigned} assigned</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-sm font-bold ${w.visitsThisWeek > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                      {w.visitsThisWeek}
                    </span>
                    <span className="text-xs text-gray-400">visits</span>
                  </div>
                  {/* Mini activity bar */}
                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (w.visitsThisWeek / Math.max(1, w.assigned)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Feed + Ishtabhrity Alerts ─────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-sky-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Recent Activity</h2>
          </div>
          {recentVisits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No visits logged yet</p>
          ) : (
            <div className="space-y-1">
              {recentVisits.map(v => {
                const member = members.find(m => m.id === v.personId);
                const worker = workers.find(w => w.id === v.visitedBy);
                return (
                  <button key={v.id} onClick={() => member && navigate(`/members/${member.id}`)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                  >
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {member?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{member?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {worker ? `by ${worker.name.split(' ')[0]}` : ''}
                        {v.outcome ? ` · ${v.outcome}` : ''}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{fmtShort(v.visitDate)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ishtabhrity Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-sky-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Ishtabhrity Alerts</h2>
            </div>
            <button onClick={() => navigate('/ishtabhrity')} className="text-xs text-sky-700 hover:underline">View all</button>
          </div>
          {ishOverdue.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle2 size={24} className="text-green-400 mx-auto mb-1" />
              <p className="text-sm text-green-600 font-medium">All up to date 🎉</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {ishOverdue.map(m => {
                const cfg = ISH_STATUS[m.status];
                const worker = workers.find(w => w.id === m.assignedTo);
                return (
                  <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{m.name}</div>
                      <div className="text-xs text-gray-400">{worker ? worker.name.split(' ')[0] : 'Unassigned'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge} flex-shrink-0`}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Unassigned Members ─────────────────────────────────────────────── */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserX size={14} className="text-sky-700" />
              <h2 className="font-semibold text-gray-900 text-sm">
                Unassigned Members
                <span className="text-sky-700 ml-1">({unassigned.length})</span>
              </h2>
            </div>
            <button onClick={() => navigate('/admin')} className="text-xs text-sky-700 hover:underline">
              Assign in Admin →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.slice(0, 12).map(m => (
              <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs hover:bg-sky-50 hover:border-sky-200 transition-colors"
              >
                <span className="font-medium text-gray-700">{m.name}</span>
                <CategoryBadge category={m.memberCategory} />
              </button>
            ))}
            {unassigned.length > 12 && (
              <span className="text-xs text-gray-400 self-center">+{unassigned.length - 12} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
//  WORKER DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function WorkerDashboard() {
  const { members, workers, visits, payments, drives, user, currentSukId } = useApp();
  const navigate   = useNavigate();
  const today      = todayStr();
  const weekAgo    = addDays(today, -7);
  const nextWeek   = addDays(today, 7);
  const currentSuk = SUKS.find(s => s.id === currentSukId)?.name || '';

  // My members
  const myMembers = useMemo(() =>
    members.filter(m => !m.isRemoved && m.assignedTo === user?.id),
  [members, user]);

  // My visits this week
  const myWeekVisits = useMemo(() =>
    visits.filter(v => v.visitedBy === user?.id && v.visitDate >= weekAgo),
  [visits, user, weekAgo]);

  // Upcoming drives (within 7 days)
  const upcomingDrive = useMemo(() =>
    drives
      .filter(d => d.date >= today && d.date <= nextWeek)
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null,
  [drives, today, nextWeek]);

  // ── Priority: Prospects needing follow-up (14+ days no visit) ────────────
  const prospectsNeedVisit = useMemo(() => {
    return myMembers
      .filter(m => m.memberCategory === 'PROSPECT')
      .map(m => {
        const last = visits.filter(v => v.personId === m.id)
          .sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0];
        return { ...m, daysSince: last ? daysSince(last.visitDate) : 999 };
      })
      .filter(m => m.daysSince >= 14)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [myMembers, visits]);

  // ── Priority: My defaulters ───────────────────────────────────────────────
  const myDefaulters = useMemo(() =>
    myMembers.filter(m => m.memberCategory === 'DEFAULTER'),
  [myMembers]);

  // ── Priority: Other members not visited in 30+ days ──────────────────────
  const overdueVisit = useMemo(() => {
    return myMembers
      .filter(m => m.memberCategory !== 'PROSPECT' && m.memberCategory !== 'DEFAULTER')
      .map(m => {
        const last = visits.filter(v => v.personId === m.id)
          .sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0];
        return { ...m, daysSince: last ? daysSince(last.visitDate) : 999 };
      })
      .filter(m => m.daysSince >= 30)
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);
  }, [myMembers, visits]);

  const hasActions = prospectsNeedVisit.length > 0 || myDefaulters.length > 0 || overdueVisit.length > 0;

  // ── Ishtabhrity due (my members, not GREEN) ───────────────────────────────
  const myIshDue = useMemo(() => {
    return myMembers
      .filter(m =>
        m.memberCategory !== 'PROSPECT' &&
        m.memberCategory !== 'DEFAULTER' &&
        m.ishtabhritiStatus !== 'NOT_APPLICABLE' &&
        m.ishtabhritiStatus !== 'INACTIVE',
      )
      .map(m => {
        const last = payments
          .filter(p => p.personId === m.id && (!p.status || p.status === 'SENT'))
          .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
        return { ...m, lastDate: last?.paymentDate || null, status: calcIshStatus(last?.paymentDate || null) };
      })
      .filter(m => m.status !== 'GREEN')
      .sort((a, b) => {
        const order = { RED: 0, ORANGE: 1, YELLOW: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      })
      .slice(0, 4);
  }, [myMembers, payments]);

  // ── My recent visits ──────────────────────────────────────────────────────
  const myRecentVisits = useMemo(() =>
    visits.filter(v => v.visitedBy === user?.id)
      .sort((a,b) => b.visitDate.localeCompare(a.visitDate))
      .slice(0, 5),
  [visits, user]);

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Jayaguru {user?.name?.split(' ')[0]} 🙏
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{currentSuk} SUK · {fmtFull(today)}</p>
      </div>

      {/* ── 3 Personal Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Assigned',         value: myMembers.length,    color: 'text-blue-600',   action: () => navigate('/my-space?section=members')      },
          { label: 'My Visits / Week', value: myWeekVisits.length, color: 'text-green-600',  action: null                                             },
          { label: 'Ishtabhrity Due',  value: myIshDue.length,     color: myIshDue.length > 0 ? 'text-sky-700' : 'text-gray-400', action: () => navigate('/my-space?section=ishtabhrity') },
        ].map(s => (
          <button key={s.label} onClick={s.action || undefined}
            className={`bg-white rounded-xl border border-gray-100 p-3 shadow-sm text-left ${s.action ? 'hover:shadow-md transition-shadow' : 'cursor-default'}`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Upcoming Drive Banner ─────────────────────────────────────────── */}
      {upcomingDrive && (
        <button onClick={() => navigate(`/dp-work/${upcomingDrive.id}`)}
          className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-left hover:bg-blue-100 transition-colors"
        >
          <Calendar size={16} className="text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-blue-800">Upcoming: {upcomingDrive.name}</div>
            <div className="text-xs text-blue-600">
              {fmtShort(upcomingDrive.date)}{upcomingDrive.time ? ` at ${upcomingDrive.time}` : ''} · {upcomingDrive.targetArea || ''}
            </div>
          </div>
          <ChevronRight size={14} className="text-blue-400 flex-shrink-0" />
        </button>
      )}

      {/* ── Priority Actions ──────────────────────────────────────────────── */}
      {hasActions ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
            <Bell size={14} className="text-sky-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Priority Actions</h2>
          </div>

          {/* Prospects needing follow-up */}
          {prospectsNeedVisit.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                Prospects — Follow-up needed ({prospectsNeedVisit.length})
              </p>
              <div className="space-y-1">
                {prospectsNeedVisit.slice(0, 4).map(m => (
                  <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
                    className="w-full flex items-center gap-3 py-1.5 px-2 hover:bg-purple-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{m.name}</div>
                      {m.area && <div className="text-xs text-gray-400">{m.area}</div>}
                    </div>
                    <span className="text-xs text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      {m.daysSince === 999 ? 'Never visited' : `${m.daysSince}d ago`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Defaulters */}
          {myDefaulters.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                Defaulters — Re-engage ({myDefaulters.length})
              </p>
              <div className="space-y-1">
                {myDefaulters.slice(0, 4).map(m => (
                  <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
                    className="w-full flex items-center gap-3 py-1.5 px-2 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{m.name}</span>
                    {m.area && <span className="text-xs text-gray-400 flex-shrink-0">{m.area}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No visit in 30+ days */}
          {overdueVisit.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">
                No Visit in 30+ Days ({overdueVisit.length})
              </p>
              <div className="space-y-1">
                {overdueVisit.map(m => (
                  <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
                    className="w-full flex items-center gap-3 py-1.5 px-2 hover:bg-sky-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{m.name}</div>
                      <CategoryBadge category={m.memberCategory} />
                    </div>
                    <span className="text-xs text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      {m.daysSince === 999 ? 'Never' : `${m.daysSince}d ago`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : myMembers.length > 0 ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-4">
          <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">All caught up! 🎉</p>
            <p className="text-xs text-green-600">No priority actions right now. Great work!</p>
          </div>
        </div>
      ) : null}

      {/* ── Ishtabhrity Due (quick strip) ────────────────────────────────── */}
      {myIshDue.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <IndianRupee size={14} className="text-green-600" />
              <h2 className="font-semibold text-gray-900 text-sm">Ishtabhrity Due</h2>
            </div>
            <button onClick={() => navigate('/my-space?section=ishtabhrity')} className="text-xs text-sky-700 hover:underline">
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {myIshDue.map(m => {
              const cfg = ISH_STATUS[m.status];
              return (
                <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">{m.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge} flex-shrink-0`}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── My Recent Activity ───────────────────────────────────────────── */}
      {myRecentVisits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">My Recent Activity</h2>
          </div>
          <div className="space-y-1">
            {myRecentVisits.map(v => {
              const member = members.find(m => m.id === v.personId);
              return (
                <button key={v.id} onClick={() => member && navigate(`/members/${member.id}`)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {member?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{member?.name || 'Unknown'}</div>
                    {v.outcome && <div className="text-xs text-gray-400 truncate">{v.outcome}</div>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{fmtShort(v.visitDate)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {myMembers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-10 shadow-sm text-center">
          <UserCheck size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No members assigned to you yet</p>
          <p className="text-xs text-gray-400 mt-1">Ask your admin to assign members from the Admin Panel</p>
        </div>
      )}
    </div>
  );
}
