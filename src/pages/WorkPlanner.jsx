import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Plus, Calendar, Users, ChevronRight, ClipboardList, CheckCircle2, Clock, AlarmClock } from 'lucide-react';

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const DRIVE_TYPE_META = {
  PROSPECT_VISIT:      { label: 'Prospect Visit',           color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
  DEFAULTER_FOLLOWUP:  { label: 'Defaulter Follow-up',      color: 'bg-red-100 text-red-700',         dot: 'bg-red-500'    },
  SUPER_NEW_CARE:      { label: 'Super New Care',            color: 'bg-teal-100 text-teal-700',       dot: 'bg-teal-500'   },
  SEMI_ACTIVE_NUDGE:   { label: 'Semi-Active Nudge',         color: 'bg-sky-100 text-sky-700',     dot: 'bg-sky-500'  },
  MIXED:               { label: 'Mixed Drive',               color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'   },
  ARGHYA_COLLECTION:   { label: 'Arghya Collection Drive',   color: 'bg-sky-100 text-sky-700',   dot: 'bg-sky-500' },
  UTSAV_INVITATION:    { label: 'Utsav Invitation Drive',    color: 'bg-pink-100 text-pink-700',       dot: 'bg-pink-500'   },
  CUSTOM:              { label: 'Custom',                    color: 'bg-gray-100 text-gray-700',       dot: 'bg-gray-500'   },
};

function DriveCard({ drive, members }) {
  const navigate = useNavigate();
  const meta = DRIVE_TYPE_META[drive.driveType] || DRIVE_TYPE_META.CUSTOM;
  const memberCount = drive.memberIds?.length || 0;
  const retroKeys = Object.keys(drive.retrospect || {});
  const metCount = retroKeys.filter(k => drive.retrospect[k]?.met).length;
  const isDone = drive.status === 'DONE';
  const isCancelled = drive.status === 'CANCELLED';
  const today = new Date().toISOString().split('T')[0];
  const isPast = drive.date < today && !isDone && !isCancelled;

  return (
    <button
      onClick={() => navigate(`/dp-work/${drive.id}`)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all p-4 flex items-start gap-4"
    >
      {/* Date badge */}
      <div className="flex-shrink-0 w-12 text-center">
        <div className="text-2xl font-bold text-gray-900 leading-none">
          {drive.date ? new Date(drive.date + 'T00:00:00').getDate() : '—'}
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">
          {drive.date ? new Date(drive.date + 'T00:00:00').toLocaleString('en-IN', { month: 'short' }) : ''}
        </div>
        <div className="text-xs text-gray-400">
          {drive.date ? new Date(drive.date + 'T00:00:00').getFullYear() : ''}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.label}
          </span>
          {isDone && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle2 size={10} /> Done
            </span>
          )}
          {isPast && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-1">
              <Clock size={10} /> Needs Retrospect
            </span>
          )}
          {isCancelled && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              ✕ Cancelled
            </span>
          )}
        </div>
        <div className="font-semibold text-gray-900 text-sm leading-snug">{drive.name}</div>
        {drive.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{drive.notes}</p>}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {drive.time && <span className="flex items-center gap-1"><AlarmClock size={11} /> {formatTime(drive.time)}</span>}
          <span className="flex items-center gap-1"><Users size={11} /> {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          {isDone && memberCount > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={11} /> {metCount}/{memberCount} met
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
    </button>
  );
}

export default function WorkPlanner() {
  const { drives, members } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');

  const today = new Date().toISOString().split('T')[0];

  const upcoming = useMemo(
    () => drives
      .filter(d => d.date >= today && d.status !== 'DONE')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [drives, today]
  );

  const past = useMemo(
    () => drives
      .filter(d => d.date < today || d.status === 'DONE' || d.status === 'CANCELLED')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [drives, today]
  );

  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DP Work Planner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan weekend drives &amp; track retrospects</p>
        </div>
        <button
          onClick={() => navigate('/dp-work/new')}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} /> New Drive
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{upcoming.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Upcoming</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            {drives.filter(d => d.status === 'DONE').length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-sky-700">
            {past.filter(d => d.status !== 'DONE').length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 leading-tight">Needs<br className="sm:hidden" /> Retrospect</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[['upcoming', 'Upcoming', upcoming.length], ['past', 'Past', past.length]].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === key ? 'bg-sky-100 text-sky-700' : 'bg-gray-200 text-gray-500'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Drive list */}
      {shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map(drive => (
            <DriveCard key={drive.id} drive={drive} members={members} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center">
            <ClipboardList size={26} className="text-sky-400" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium text-sm">
              {tab === 'upcoming' ? 'No upcoming drives' : 'No past drives'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {tab === 'upcoming' ? 'Plan your next weekend drive to get started' : 'Completed drives will appear here'}
            </p>
          </div>
          {tab === 'upcoming' && (
            <button
              onClick={() => navigate('/dp-work/new')}
              className="mt-1 flex items-center gap-1.5 bg-sky-500 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} /> Plan a Drive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
