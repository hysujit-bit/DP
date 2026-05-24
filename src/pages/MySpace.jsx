import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES, SUKS } from '../constants';
import IshtabhritiTimeline from '../components/IshtabhritiTimeline';
import {
  Bell, BellOff, CheckCircle2, Clock, AlertTriangle, XCircle,
  Phone, ChevronRight, ChevronDown, Users, IndianRupee,
  Activity, Calendar, UserCheck, KeyRound, Eye, EyeOff,
} from 'lucide-react';

// ── Date helpers (same as IshtabhritiTracker) ─────────────────────────────────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr()           { return localDateStr(new Date()); }
function addDays(dateStr, n)  {
  const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + n); return localDateStr(d);
}
function daysSince(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const d   = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((now - d) / 86400000);
}
function fmtShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtFull(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Ishtabhrity status logic ──────────────────────────────────────────────────
function calcStatus(lastDate) {
  if (!lastDate) return 'RED';
  const days = daysSince(lastDate);
  if (days <= 30) return 'GREEN';
  if (days <= 60) return 'YELLOW';
  if (days <= 90) return 'ORANGE';
  return 'RED';
}
const STATUS = {
  GREEN:  { label: 'Up to date',   badge: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-400',  bar: 'bg-green-400',  Icon: CheckCircle2, leftBorder: 'border-l-green-400'  },
  YELLOW: { label: 'Reminder due', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400', bar: 'bg-yellow-400', Icon: Clock,         leftBorder: 'border-l-yellow-400' },
  ORANGE: { label: '2 months due', badge: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500', bar: 'bg-sky-400', Icon: AlertTriangle,  leftBorder: 'border-l-sky-400' },
  RED:    { label: '3+ months',    badge: 'bg-red-100 text-red-700 border-red-200',           dot: 'bg-red-500',    bar: 'bg-red-400',    Icon: XCircle,       leftBorder: 'border-l-red-400'    },
};
const STATUS_ORDER = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 };

// ── Notification severity config ──────────────────────────────────────────────
const NOTIF_STYLE = {
  high:   { bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-700',    icon: '🔴' },
  medium: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-700', icon: '🟠' },
  low:    { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', icon: '🟡' },
  info:   { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   icon: '🔵' },
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MySpace() {
  const { members, workers, visits, payments, recordPayment, user, currentSukId, changePassword } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section  = searchParams.get('section'); // 'notifications' | 'members' | 'ishtabhrity' | null (all)
  const today    = todayStr();
  const tomorrow = addDays(today, 1);

  const [notifOpen,    setNotifOpen]    = useState(true);
  const [ishTab,       setIshTab]       = useState('today');
  const [justMarked,   setJustMarked]   = useState(new Set());
  const [justNotSent,  setJustNotSent]  = useState(new Set());
  const [ishExpanded,  setIshExpanded]  = useState(null);

  // Change password state
  const [pwdOpen,      setPwdOpen]      = useState(false);
  const [pwdForm,      setPwdForm]      = useState({ current: '', next: '', confirm: '' });
  const [pwdShow,      setPwdShow]      = useState({ current: false, next: false });
  const [pwdStatus,    setPwdStatus]    = useState(null); // null | 'saving' | 'ok' | string(error)
  const setPwd = k => e => setPwdForm(f => ({ ...f, [k]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) { setPwdStatus('New passwords do not match'); return; }
    if (pwdForm.next.length < 6) { setPwdStatus('New password must be at least 6 characters'); return; }
    setPwdStatus('saving');
    const result = await changePassword(pwdForm.current, pwdForm.next);
    if (result.ok) {
      setPwdStatus('ok');
      setPwdForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setPwdOpen(false); setPwdStatus(null); }, 2000);
    } else {
      setPwdStatus(result.error || 'Failed to change password');
    }
  };

  const currentSuk = SUKS.find(s => s.id === currentSukId)?.name || '';

  // My assigned members (all categories)
  const myMembers = useMemo(() =>
    members.filter(m => !m.isRemoved && m.assignedTo === user?.id),
  [members, user]);

  // Category breakdown for planning metrics
  const categoryBreakdown = useMemo(() => {
    const counts = {};
    myMembers.forEach(m => {
      counts[m.memberCategory] = (counts[m.memberCategory] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({ key, count, ...MEMBER_CATEGORIES[key] }))
      .sort((a, b) => b.count - a.count);
  }, [myMembers]);

  // Ishtabhrity-eligible subset of my members
  const eligible = useMemo(() =>
    myMembers.filter(m =>
      m.memberCategory !== 'PROSPECT' &&
      m.memberCategory !== 'DEFAULTER' &&
      m.ishtabhritiStatus !== 'NOT_APPLICABLE' &&
      m.ishtabhritiStatus !== 'INACTIVE',
    ),
  [myMembers]);

  // Enrich with cycle data
  const enriched = useMemo(() => eligible.map(m => {
    const history = payments
      .filter(p => p.personId === m.id && (!p.status || p.status === 'SENT'))
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const lastDate     = history[0]?.paymentDate || null;
    const nextDue      = lastDate ? addDays(lastDate, 30) : null;
    const status       = calcStatus(lastDate);
    const sentToday    = justMarked.has(m.id) || (history[0]?.paymentDate === today);
    const cycleProgress = lastDate ? Math.min(Math.round((daysSince(lastDate) / 30) * 100), 100) : 0;
    return { ...m, lastDate, nextDue, status, sentToday, cycleProgress };
  }), [eligible, payments, justMarked, today]);

  // ── Live notifications ──────────────────────────────────────────────────────
  const notifications = useMemo(() => {
    const alerts = [];
    const myMemberIds = new Set(myMembers.map(m => m.id));

    // Ishtabhrity overdue / due for my eligible members
    enriched.forEach(m => {
      if (!m.sentToday) {
        if (m.status === 'RED')    alerts.push({ id: `ish-${m.id}`, severity: 'high',   member: m, message: `${m.name}'s Ishtabhrity is 3+ months overdue`, type: 'ISHTA' });
        else if (m.status === 'ORANGE') alerts.push({ id: `ish-${m.id}`, severity: 'medium', member: m, message: `${m.name}'s Ishtabhrity is 2 months overdue`, type: 'ISHTA' });
        else if (m.status === 'YELLOW' && m.nextDue <= today) alerts.push({ id: `ish-${m.id}`, severity: 'low', member: m, message: `${m.name}'s Ishtabhrity reminder is due today`, type: 'ISHTA' });
      }
    });

    // Recent visits by other gurubhais on my members (last 14 days)
    const cutoff = addDays(today, -14);
    visits
      .filter(v => myMemberIds.has(v.personId) && v.visitedBy && v.visitedBy !== user?.id && v.visitDate >= cutoff)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
      .slice(0, 10)
      .forEach(v => {
        const member = myMembers.find(m => m.id === v.personId);
        const worker = workers.find(w => w.id === v.visitedBy);
        if (member && worker) {
          alerts.push({
            id: `visit-${v.id}`, severity: 'info', type: 'VISIT',
            member, worker, visit: v,
            message: `${worker.name} visited ${member.name} on ${fmtShort(v.visitDate)}${v.outcome ? ` — ${v.outcome}` : ''}`,
          });
        }
      });

    // Sort: high → medium → low → info
    const order = { high: 0, medium: 1, low: 2, info: 3 };
    return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [enriched, myMembers, visits, workers, user, today]);

  // ── Ishtabhrity tabs ────────────────────────────────────────────────────────
  const dueToday    = useMemo(() => enriched.filter(m => !m.sentToday && !justNotSent.has(m.id) && (m.nextDue === today || m.nextDue < today || !m.nextDue)).sort((a,b) => STATUS_ORDER[b.status]-STATUS_ORDER[a.status]), [enriched, today, justNotSent]);
  const dueTomorrow = useMemo(() => enriched.filter(m => !m.sentToday && m.nextDue === tomorrow), [enriched, tomorrow]);
  const confirmedToday = useMemo(() => enriched.filter(m => m.sentToday), [enriched]);
  const notSentToday   = useMemo(() => enriched.filter(m => justNotSent.has(m.id)), [enriched, justNotSent]);

  const handleMarkSent = (member) => {
    recordPayment({ personId: member.id, familyCode: member.familyCode, paymentDate: today, status: 'SENT', monthCovered: today.slice(0,7), recordedBy: user?.id });
    setJustMarked(prev => new Set([...prev, member.id]));
    setJustNotSent(prev => { const s = new Set(prev); s.delete(member.id); return s; });
  };
  const handleMarkNotSent = (member) => {
    recordPayment({ personId: member.id, familyCode: member.familyCode, paymentDate: today, status: 'NOT_SENT', monthCovered: today.slice(0,7), recordedBy: user?.id });
    setJustNotSent(prev => new Set([...prev, member.id]));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Space</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} · {currentSuk} SUK · {fmtFull(today)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <Users size={13} className="text-sky-500" />
          <span><strong className="text-gray-900">{myMembers.length}</strong> assigned</span>
        </div>
      </div>

      {/* ── CATEGORY BREAKDOWN ────────────────────────────────────────────── */}
      {myMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">My Responsibilities by Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categoryBreakdown.map(({ key, count, label, bg, text, border }) => (
              <button
                key={key}
                onClick={() => navigate(`/members?cat=${key}`)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${bg} ${border} hover:opacity-80 transition-opacity`}
              >
                <span className={`text-xs font-semibold leading-tight text-left ${text}`}>{label}</span>
                <span className={`text-2xl font-bold ml-2 flex-shrink-0 ${text}`}>{count}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Tap any category to view those members</p>
        </div>
      )}

      {/* ── NOTIFICATIONS ─────────────────────────────────────────────────── */}
      {(!section || section === 'notifications') && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {notifications.length > 0
              ? <Bell size={16} className="text-sky-500" />
              : <BellOff size={16} className="text-gray-400" />}
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            {notifications.length > 0 && (
              <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          {notifOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
        </button>

        {notifOpen && (
          <div className="border-t border-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                <CheckCircle2 size={28} className="text-green-400" />
                <p className="text-sm font-medium text-gray-500">All clear — no alerts right now 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => {
                  const style = NOTIF_STYLE[n.severity];
                  return (
                    <button
                      key={n.id}
                      onClick={() => navigate(`/members/${n.member.id}`)}
                      className={`w-full text-left flex items-start gap-3 px-5 py-3 ${style.bg} hover:brightness-95 transition-all`}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${style.text} leading-snug`}>{n.message}</p>
                        {n.type === 'VISIT' && n.visit.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">"{n.visit.notes}"</p>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>}

      {/* ── MY MEMBERS ────────────────────────────────────────────────────── */}
      {(!section || section === 'members') && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-blue-500" />
            <span className="font-semibold text-gray-900 text-sm">My Members</span>
            <span className="text-xs text-gray-400">{myMembers.length} assigned</span>
          </div>
        </div>

        {myMembers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
            <Users size={28} className="text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">No members assigned to you yet</p>
            <p className="text-xs text-gray-400">Ask your admin to assign members in the Admin Panel</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myMembers.map(m => {
              const cat = MEMBER_CATEGORIES[m.memberCategory];
              const lastVisit = visits
                .filter(v => v.personId === m.id)
                .sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0];
              const lastVisitWorker = lastVisit ? workers.find(w => w.id === lastVisit.visitedBy) : null;

              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${cat?.bg || 'bg-gray-100'} ${cat?.text || 'text-gray-700'}`}>
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${cat?.bg} ${cat?.text}`}>{cat?.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      {m.area && <span>{m.area}</span>}
                      {lastVisit && (
                        <span className="text-blue-500">
                          Last visit: {fmtShort(lastVisit.visitDate)}{lastVisitWorker ? ` by ${lastVisitWorker.name.split(' ')[0]}` : ''}
                        </span>
                      )}
                      {!lastVisit && <span className="text-gray-300">No visits yet</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>}

      {/* ── CHANGE PASSWORD ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setPwdOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-900 text-sm">Change Password</span>
          </div>
          {pwdOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
        </button>

        {pwdOpen && (
          <form onSubmit={handleChangePassword} className="border-t border-gray-50 px-5 py-4 space-y-3">
            {/* Current password */}
            <div>
              <label className="label text-xs text-gray-600">Current Password</label>
              <div className="relative">
                <input type={pwdShow.current ? 'text' : 'password'} value={pwdForm.current} onChange={setPwd('current')} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 pr-10"
                  placeholder="Your current password" />
                <button type="button" onClick={() => setPwdShow(s => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {pwdShow.current ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* New password */}
            <div>
              <label className="label text-xs text-gray-600">New Password</label>
              <div className="relative">
                <input type={pwdShow.next ? 'text' : 'password'} value={pwdForm.next} onChange={setPwd('next')} required minLength={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 pr-10"
                  placeholder="At least 6 characters" />
                <button type="button" onClick={() => setPwdShow(s => ({ ...s, next: !s.next }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {pwdShow.next ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* Confirm */}
            <div>
              <label className="label text-xs text-gray-600">Confirm New Password</label>
              <input type="password" value={pwdForm.confirm} onChange={setPwd('confirm')} required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Re-enter new password" />
            </div>

            {/* Status messages */}
            {pwdStatus && pwdStatus !== 'saving' && pwdStatus !== 'ok' && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{pwdStatus}</p>
            )}
            {pwdStatus === 'ok' && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Password changed successfully!
              </p>
            )}

            <button type="submit" disabled={pwdStatus === 'saving'}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
              {pwdStatus === 'saving' ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      {/* ── ISHTABHRITY TRACKER ───────────────────────────────────────────── */}
      {(!section || section === 'ishtabhrity') && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
          <IndianRupee size={16} className="text-green-500" />
          <span className="font-semibold text-gray-900 text-sm">Ishtabhrity Tracker</span>
          <span className="text-xs text-gray-400">{eligible.length} active members</span>
        </div>

        {eligible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
            <IndianRupee size={28} className="text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">No Ishtabhrity members assigned to you</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {[
                { key: 'today',    label: 'Today',       badge: dueToday.length   },
                { key: 'tomorrow', label: 'Tomorrow',    badge: dueTomorrow.length },
                { key: 'all',      label: 'All',         badge: null              },
              ].map(t => (
                <button key={t.key} onClick={() => setIshTab(t.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    ishTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {t.label}
                  {t.badge > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      ishTab === t.key ? 'bg-sky-100 text-sky-700' : 'bg-gray-200 text-gray-500'
                    }`}>{t.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Today tab */}
            {ishTab === 'today' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs font-medium text-gray-500">{fmtFull(today)}</p>
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-1 rounded-full">{dueToday.length} need reminder</span>
                    <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded-full">{confirmedToday.length} confirmed</span>
                  </div>
                </div>
                {dueToday.map(m => <IshMemberRow key={m.id} m={m} showMark onMark={handleMarkSent} onMarkNotSent={handleMarkNotSent} navigate={navigate} />)}
                {confirmedToday.map(m => <IshMemberRow key={m.id} m={{ ...m, status: 'GREEN' }} navigate={navigate} confirmed />)}
                {notSentToday.map(m => <IshMemberRow key={m.id} m={{ ...m, status: 'RED' }} navigate={navigate} markedNotSent />)}
                {dueToday.length === 0 && confirmedToday.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">🎉 All clear for today!</div>
                )}
              </div>
            )}

            {/* Tomorrow tab */}
            {ishTab === 'tomorrow' && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500">{fmtFull(tomorrow)}</p>
                {dueTomorrow.length > 0
                  ? dueTomorrow.map(m => <IshMemberRow key={m.id} m={m} navigate={navigate} showLastDate />)
                  : <div className="text-center py-8 text-gray-400 text-sm">📅 Nothing due tomorrow</div>}
              </div>
            )}

            {/* All tab */}
            {ishTab === 'all' && (
              <div className="space-y-2">
                {enriched
                  .sort((a,b) => STATUS_ORDER[b.status] - STATUS_ORDER[a.status])
                  .map(m => {
                    const isOpen = ishExpanded === m.id;
                    const memberPays = payments.filter(p => p.personId === m.id);
                    return (
                      <div key={m.id} className="rounded-xl overflow-hidden border border-gray-100">
                        <div className="flex items-center bg-white">
                          <div className="flex-1">
                            <IshMemberRow m={m} navigate={navigate} showProgress showLastDate noWrapper />
                          </div>
                          <button onClick={() => setIshExpanded(isOpen ? null : m.id)}
                            className="px-3 py-4 text-gray-300 hover:text-sky-500 border-l border-gray-50 flex-shrink-0">
                            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        </div>
                        {isOpen && (
                          <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">30-day cycle</p>
                            <IshtabhritiTimeline memberId={m.id} memberPayments={memberPays} startDate={m.ishtabhritiStartDate || null} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>}
    </div>
  );
}

// ── Ishtabhrity member row (shared sub-component) ─────────────────────────────
function IshMemberRow({ m, showMark, onMark, onMarkNotSent, navigate, confirmed, markedNotSent, showProgress, showLastDate, noWrapper }) {
  const cfg = STATUS[m.status] || STATUS.RED;
  const { Icon } = cfg;

  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3 ${noWrapper ? '' : `bg-white rounded-xl border border-l-4 ${cfg.leftBorder} shadow-sm`}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        confirmed ? 'bg-green-100 text-green-700' : markedNotSent ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700'
      }`}>
        {confirmed ? <CheckCircle2 size={16} className="text-green-500" /> : markedNotSent ? '✕' : m.name.charAt(0)}
      </div>

      <button onClick={() => navigate(`/members/${m.id}`)} className="flex-1 text-left min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{m.name}</div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
          {m.area && <span>{m.area}</span>}
          {confirmed && <span className="text-green-600 font-medium">Confirmed today ✓</span>}
          {markedNotSent && <span className="text-red-500 font-medium">Not sent — logged</span>}
          {!confirmed && !markedNotSent && m.nextDue && (
            <span className={m.nextDue <= todayStr() ? 'text-sky-500 font-medium' : 'text-gray-400'}>
              Next due: {fmtShort(m.nextDue)}
            </span>
          )}
          {!confirmed && !markedNotSent && !m.lastDate && <span className="text-red-500 font-medium">Never sent</span>}
        </div>
        {showProgress && m.lastDate && !confirmed && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${m.cycleProgress}%` }} />
            </div>
          </div>
        )}
      </button>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!confirmed && !markedNotSent && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${cfg.badge}`}>
            <Icon size={10} />{cfg.label}
          </span>
        )}
        {m.contactNo && (
          <a href={`tel:${m.contactNo}`} onClick={e => e.stopPropagation()}
            className="text-gray-300 hover:text-sky-500 transition-colors p-1">
            <Phone size={14} />
          </a>
        )}
        {showMark && !confirmed && (
          <div className="flex flex-col gap-1">
            <button onClick={() => onMark(m)}
              className="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-green-200 flex items-center gap-1 whitespace-nowrap">✓ Sent
              </button>
              <button onClick={() => onMarkNotSent(m)}
                className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 flex items-center gap-1 whitespace-nowrap">
                ✕ Not Sent
              </button>
            </div>
          )}
        </div>
      </div>
    );

  if (noWrapper) return inner;
  return inner;
}
