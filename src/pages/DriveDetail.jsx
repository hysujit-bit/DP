import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES } from '../constants';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, MessageCircle,
  Users, Calendar, Trash2, ChevronDown, ChevronUp, Edit3, AlarmClock, MapPin, ExternalLink
} from 'lucide-react';

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const DRIVE_TYPE_META = {
  PROSPECT_VISIT:      { label: 'Prospect Visit',          badge: 'bg-purple-100 text-purple-700' },
  DEFAULTER_FOLLOWUP:  { label: 'Defaulter Follow-up',     badge: 'bg-red-100 text-red-700'        },
  SUPER_NEW_CARE:      { label: 'Super New Care',           badge: 'bg-teal-100 text-teal-700'      },
  SEMI_ACTIVE_NUDGE:   { label: 'Semi-Active Nudge',        badge: 'bg-sky-100 text-sky-700'    },
  MIXED:               { label: 'Mixed Drive',              badge: 'bg-blue-100 text-blue-700'      },
  ARGHYA_COLLECTION:   { label: 'Arghya Collection Drive',  badge: 'bg-sky-100 text-sky-700'  },
  UTSAV_INVITATION:    { label: 'Utsav Invitation Drive',   badge: 'bg-pink-100 text-pink-700'      },
  CUSTOM:              { label: 'Custom',                   badge: 'bg-gray-100 text-gray-700'      },
};

const CAT_COLORS = {
  PROSPECT:            'bg-purple-100 text-purple-700',
  DEFAULTER:           'bg-red-100 text-red-700',
  SUPER_NEW:           'bg-teal-100 text-teal-700',
  SEMI_ACTIVE:         'bg-sky-100 text-sky-700',
  REGULAR_CONTRIBUTOR: 'bg-blue-100 text-blue-700',
  ACTIVE_DP_WORKER:    'bg-green-100 text-green-700',
};

const OUTCOMES = [
  { key: 'POSITIVE',  label: 'Positive',  color: 'text-green-600 bg-green-50 border-green-200'  },
  { key: 'NEUTRAL',   label: 'Neutral',   color: 'text-gray-600 bg-gray-50 border-gray-200'     },
  { key: 'NEGATIVE',  label: 'Negative',  color: 'text-red-600 bg-red-50 border-red-200'        },
];

function MemberRow({ member, retro = {}, onUpdate, isProspect }) {
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState(retro);

  const save = (patch) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onUpdate(updated);
  };

  const metSet = local.met === true;
  const notMetSet = local.met === false;

  return (
    <div className={`border-b border-gray-50 last:border-0 ${metSet ? 'bg-green-50/30' : notMetSet ? 'bg-red-50/20' : ''}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{member.name}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${CAT_COLORS[member.memberCategory] || 'bg-gray-100 text-gray-600'}`}>
              {MEMBER_CATEGORIES[member.memberCategory]?.label}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {member.area && <span>{member.area}</span>}
            {member.area && member.contactNo && <span> · </span>}
            {member.contactNo && <span>{member.contactNo}</span>}
          </div>
        </div>

        {/* Met / Not Met toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => { save({ met: true }); setExpanded(true); }}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              metSet
                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600'
            }`}
          >
            <CheckCircle2 size={13} /> Met
          </button>
          <button
            onClick={() => { save({ met: false }); }}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              notMetSet
                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-600'
            }`}
          >
            <XCircle size={13} /> Not Met
          </button>
        </div>

        {/* Expand for notes */}
        {metSet && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Expanded details (only if met) */}
      {expanded && metSet && (
        <div className="px-4 pb-4 space-y-3">
          {/* Outcome */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">How did it go?</p>
            <div className="flex gap-2">
              {OUTCOMES.map(o => (
                <button
                  key={o.key}
                  onClick={() => save({ outcome: o.key })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    local.outcome === o.key ? o.color + ' shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dikhya flag for prospects */}
          {isProspect && (
            <div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!local.tookDikhya}
                  onChange={e => save({ tookDikhya: e.target.checked })}
                  className="w-4 h-4 rounded accent-sky-600"
                />
                <span className="text-sm text-gray-700 font-medium">🙏 Took Dikhya on this visit</span>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Visit Notes</label>
            <textarea
              value={local.notes || ''}
              onChange={e => save({ notes: e.target.value })}
              rows={2}
              placeholder="What was discussed? Any follow-up needed?"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Follow-up Date</label>
            <input
              type="date"
              value={local.followUpDate || ''}
              onChange={e => save({ followUpDate: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drives, members, editDrive, removeDrive } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const drive = drives.find(d => d.id === id);

  const driveMembers = useMemo(() => {
    if (!drive?.memberIds) return [];
    return drive.memberIds.map(mid => members.find(m => m.id === mid)).filter(Boolean);
  }, [drive, members]);

  if (!drive) {
    return (
      <div className="max-w-xl text-center py-16">
        <p className="text-gray-500">Drive not found.</p>
        <button onClick={() => navigate('/dp-work')} className="mt-3 text-sky-700 hover:underline text-sm">← Back to Planner</button>
      </div>
    );
  }

  const meta = DRIVE_TYPE_META[drive.driveType] || DRIVE_TYPE_META.CUSTOM;
  const today = new Date().toISOString().split('T')[0];
  const isCancelled = drive.status === 'CANCELLED';
  const isUpcoming = drive.date >= today && drive.status !== 'DONE' && !isCancelled;
  const isDone = drive.status === 'DONE';

  const retroKeys = Object.keys(drive.retrospect || {});
  const metCount  = retroKeys.filter(k => drive.retrospect[k]?.met === true).length;
  const dikhyaCount = retroKeys.filter(k => drive.retrospect[k]?.tookDikhya).length;

  const handleRetroUpdate = (memberId, retroData) => {
    const newRetro = { ...(drive.retrospect || {}), [memberId]: retroData };
    editDrive(id, { retrospect: newRetro });
  };

  const markDone = () => {
    editDrive(id, { status: 'DONE' });
  };

  const cancelDrive = () => {
    editDrive(id, { status: 'CANCELLED' });
    setConfirmCancel(false);
  };

  const handleDelete = () => {
    removeDrive(id);
    navigate('/dp-work');
  };

  const dateStr = drive.date
    ? new Date(drive.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="max-w-xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dp-work')}
          className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{drive.name}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
            {isDone && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Done</span>}
            {isUpcoming && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-1"><Clock size={10} /> Upcoming</span>}
            {isCancelled && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">✕ Cancelled</span>}
          </div>
        </div>
        {/* Delete */}
        <button onClick={() => setConfirmDelete(true)}
          className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={15} className="text-gray-400" />
          <span>{dateStr}</span>
        </div>
        {drive.time && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlarmClock size={15} className="text-gray-400" />
            <span>{formatTime(drive.time)}</span>
          </div>
        )}
        {drive.meetingPlace && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={15} className="text-gray-400" />
            <span>{drive.meetingPlace}</span>
          </div>
        )}
        {drive.meetingLocation && (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink size={15} className="text-gray-400 flex-shrink-0" />
            <a
              href={drive.meetingLocation}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              Open location in Maps ↗
            </a>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={15} className="text-gray-400" />
          <span>{driveMembers.length} member{driveMembers.length !== 1 ? 's' : ''} planned</span>
        </div>
        {drive.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
            📝 {drive.notes}
          </div>
        )}

        {/* Retrospect summary (if done or in progress) */}
        {retroKeys.length > 0 && (
          <div className="flex gap-3 pt-1">
            <div className="flex-1 text-center bg-green-50 rounded-xl py-2">
              <div className="text-xl font-bold text-green-700">{metCount}</div>
              <div className="text-xs text-green-600">Met</div>
            </div>
            <div className="flex-1 text-center bg-gray-50 rounded-xl py-2">
              <div className="text-xl font-bold text-gray-700">{driveMembers.length - metCount}</div>
              <div className="text-xs text-gray-500">Not Met</div>
            </div>
            {dikhyaCount > 0 && (
              <div className="flex-1 text-center bg-sky-50 rounded-xl py-2">
                <div className="text-xl font-bold text-sky-700">{dikhyaCount}</div>
                <div className="text-xs text-sky-700">Took Dikhya 🙏</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retrospect section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isDone ? 'Retrospect' : 'Log Visits'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Mark each member as met or not met, and add notes</p>
          </div>
          <Edit3 size={14} className="text-gray-300" />
        </div>

        {driveMembers.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No members in this drive</div>
        ) : (
          driveMembers.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              retro={drive.retrospect?.[m.id] || {}}
              onUpdate={(data) => handleRetroUpdate(m.id, data)}
              isProspect={m.memberCategory === 'PROSPECT'}
            />
          ))
        )}
      </div>

      {/* Mark as Done + Cancel Drive */}
      {!isDone && !isCancelled && (
        <div className="flex gap-3">
          <button
            onClick={markDone}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <CheckCircle2 size={16} /> Mark as Done
          </button>
          <button
            onClick={() => setConfirmCancel(true)}
            className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            Cancel Drive
          </button>
        </div>
      )}

      {/* Restore if cancelled */}
      {isCancelled && (
        <button
          onClick={() => editDrive(id, { status: 'UPCOMING' })}
          className="w-full flex items-center justify-center gap-2 border-2 border-sky-200 text-sky-700 font-semibold py-2.5 rounded-xl hover:bg-sky-50 transition-colors"
        >
          ↩ Restore Drive
        </button>
      )}

      {/* Cancel confirm */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-xs w-full space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Cancel this drive?</h3>
            <p className="text-sm text-gray-500">The drive will be marked as cancelled. All data is kept and you can restore it later if needed.</p>
            <div className="flex gap-2">
              <button
                onClick={cancelDrive}
                className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                Yes, Cancel Drive
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-xs w-full space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Delete this drive?</h3>
            <p className="text-sm text-gray-500">This will permanently remove the drive and all its retrospect data. This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
