import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { CategoryBadge, DPStatusBadge, IshtabhritiStatusBadge } from '../components/Badge';
import Modal from '../components/Modal';
import CategoryPickerModal from '../components/CategoryPickerModal';
import CategoryChangePromptModal, { getCategoryChangeTrigger } from '../components/CategoryChangePromptModal';
import { VISIT_OUTCOMES, SUKS } from '../constants';
import {
  Phone, MapPin, ArrowLeft, Edit, Trash2, ExternalLink, Home, CalendarPlus,
  IndianRupee, CheckCircle2, Clock, RotateCcw, RefreshCw, History
} from 'lucide-react';
import IshtabhritiTimeline from '../components/IshtabhritiTimeline';
import AuditLog from '../components/AuditLog';

// ── Category Journey Stepper ───────────────────────────────────────────────────
const STEPS = [
  { key: 'PROSPECT',            short: 'Prospect',    num: 1 },
  { key: 'DEFAULTER',           short: 'Defaulter',   num: 2 },
  { key: 'SUPER_NEW',           short: 'Super New',   num: 3 },
  { key: 'SEMI_ACTIVE',         short: 'Semi-Active', num: 4 },
  { key: 'REGULAR_CONTRIBUTOR', short: 'Regular',     num: 5 },
  { key: 'ACTIVE_DP_WORKER',    short: 'Active DP',   num: 6 },
];

const STEP_STYLE = {
  PROSPECT:            { activeBg: 'bg-purple-500', activeRing: 'ring-purple-200', activeText: 'text-purple-700', activeDot: 'bg-purple-100' },
  DEFAULTER:           { activeBg: 'bg-red-500',    activeRing: 'ring-red-200',    activeText: 'text-red-700',    activeDot: 'bg-red-100'    },
  SUPER_NEW:           { activeBg: 'bg-teal-500',   activeRing: 'ring-teal-200',   activeText: 'text-teal-600',   activeDot: 'bg-teal-100'   },
  SEMI_ACTIVE:         { activeBg: 'bg-sky-500',  activeRing: 'ring-sky-200',  activeText: 'text-sky-700',  activeDot: 'bg-sky-100'  },
  REGULAR_CONTRIBUTOR: { activeBg: 'bg-blue-500',   activeRing: 'ring-blue-200',   activeText: 'text-blue-700',   activeDot: 'bg-blue-100'   },
  ACTIVE_DP_WORKER:    { activeBg: 'bg-green-500',  activeRing: 'ring-green-200',  activeText: 'text-green-700',  activeDot: 'bg-green-100'  },
};

function CategoryStepper({ current }) {
  const activeIdx = STEPS.findIndex(s => s.key === current);

  return (
    <div className="px-4 py-4 border-b border-gray-100 bg-white">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Category Journey</p>
      <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex items-start min-w-[340px]">
        {STEPS.map((step, i) => {
          const isActive = step.key === current;
          const style    = STEP_STYLE[step.key];

          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              {/* Node + label column */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Circle */}
                <div className={`
                  relative flex items-center justify-center rounded-full font-bold transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? `w-8 h-8 text-white text-xs ${style.activeBg} ring-4 ${style.activeRing} shadow-md`
                    : 'w-6 h-6 text-gray-400 text-[10px] bg-gray-100 border-2 border-gray-200'
                  }
                `}>
                  {isActive ? (
                    <span className="text-xs font-bold">{step.num}</span>
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                {/* Label */}
                <span className={`
                  mt-1.5 text-center leading-tight font-medium transition-colors
                  ${isActive
                    ? `text-[11px] ${style.activeText}`
                    : 'text-[10px] text-gray-300'
                  }
                `} style={{ wordBreak: 'break-word', maxWidth: 52 }}>
                  {step.short}
                </span>
              </div>

              {/* Connector line — not after last node */}
              {i < STEPS.length - 1 && (
                <div className="flex-shrink-0 mt-3.5 mx-0.5" style={{ width: 10 }}>
                  <div className={`h-0.5 w-full rounded-full ${isActive || activeIdx === i + 1 ? 'bg-gray-300' : 'bg-gray-150'}`}
                    style={{ backgroundColor: '#e5e7eb' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function LogVisitModal({ open, onClose, member, workerId, onSave }) {
  const [form, setForm] = useState({ visitDate: localToday(), notes: '', outcome: '', nextAction: '' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Reset all state every time the modal opens — prevents stale saving/saved/date from previous open
  useEffect(() => {
    if (open) {
      setForm({ visitDate: localToday(), notes: '', outcome: '', nextAction: '' });
      setSaving(false);
      setSaved(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, personId: member.id, visitedBy: workerId });
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Log Visit — ${member?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Visit Date</label>
          <input type="date" value={form.visitDate} onChange={e => setForm({...form, visitDate: e.target.value})}
            className="input" required />
        </div>
        <div>
          <label className="label">Outcome</label>
          <select value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} className="input" required>
            <option value="">Select outcome…</option>
            {VISIT_OUTCOMES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3}
            placeholder="What happened during the visit?" className="input resize-none" />
        </div>
        <div>
          <label className="label">Next Action</label>
          <input type="text" value={form.nextAction} onChange={e => setForm({...form, nextAction: e.target.value})}
            placeholder="What to do next time?" className="input" />
        </div>
        <button type="submit" disabled={saving || saved}
          className={`w-full font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
            saved  ? 'bg-green-500 text-white' :
            saving ? 'bg-sky-300 text-white cursor-not-allowed' :
                     'bg-sky-500 hover:bg-sky-700 text-white'
          }`}>
          {saved ? '✓ Visit Saved!' : saving ? 'Saving…' : 'Save Visit'}
        </button>
      </form>
    </Modal>
  );
}

// Returns today's date in YYYY-MM-DD using LOCAL timezone (avoids UTC off-by-one for IST users)
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function localMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function RecordIshtabhritiModal({ open, onClose, member, workerId, onSave }) {
  const [form, setForm] = useState({ paymentDate: localToday(), monthCovered: localMonth() });

  // Reset to today's date every time the modal opens (avoids stale date from old mount)
  useEffect(() => {
    if (open) {
      setForm({ paymentDate: localToday(), monthCovered: localMonth() });
    }
  }, [open]);

  const handleSave = (status) => {
    onSave({
      paymentDate:  form.paymentDate,
      monthCovered: form.monthCovered,
      status,
      personId:   member.id,
      familyCode: member.familyCode,
      recordedBy: workerId,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Ishtabhrity — ${member?.name}`}>
      <div className="space-y-4">
        <div>
          <label className="label">Month</label>
          <input type="month" value={form.monthCovered}
            onChange={e => setForm({ ...form, monthCovered: e.target.value })}
            className="input" required />
        </div>
        <div>
          <label className="label">Date recorded</label>
          <input type="date" value={form.paymentDate}
            onChange={e => setForm({ ...form, paymentDate: e.target.value })}
            className="input" />
        </div>

        {/* Two big action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleSave('SENT')}
            className="flex flex-col items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors shadow-sm"
          >
            <span className="text-2xl">✅</span>
            <span className="text-sm">Sent</span>
          </button>
          <button
            onClick={() => handleSave('NOT_SENT')}
            className="flex flex-col items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 font-semibold py-4 rounded-xl transition-colors"
          >
            <span className="text-2xl">❌</span>
            <span className="text-sm">Not Sent</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RemoveModal({ open, onClose, member, onRemove }) {
  const [reason, setReason] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onRemove(reason); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="Remove Member" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">Remove <strong>{member?.name}</strong> from active list? Their data will be preserved.</p>
        <div>
          <label className="label">Reason</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Moved to Delhi" className="input" required />
        </div>
        <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl">Remove Member</button>
      </form>
    </Modal>
  );
}

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, workers, visits, payments, user, logVisit, recordPayment, deletePayment, editMember, deleteMember, bringBack, fetchAuditLog } = useApp();

  const member  = members.find(m => m.id === id);
  const worker  = workers.find(w => w.id === member?.assignedTo);
  const sukName = SUKS.find(s => s.id === member?.sukId)?.name || member?.sukId || '—';
  const memberVisits   = visits.filter(v => v.personId === id).sort((a,b) => new Date(b.visitDate) - new Date(a.visitDate));
  const memberPayments = payments.filter(p => p.personId === id).sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  const [tab, setTab]              = useState('info');
  const [showHistory, setShowHistory] = useState(false);
  const [visitModal, setVis]       = useState(false);
  const [ishModal,   setIsh]       = useState(false);
  const [rmModal,    setRm]        = useState(false);
  const [catModal,   setCat]       = useState(false);
  const [catPromptTrigger, setCatPromptTrigger] = useState(null); // auto-trigger after visit

  const handleRemove = (reason) => {
    deleteMember(id, reason);
    navigate('/members');
  };

  // Wrap logVisit to auto-detect category change triggers
  const handleLogVisit = async (data) => {
    await logVisit(data);
    const trigger = getCategoryChangeTrigger(member.memberCategory, data.outcome);
    if (trigger) setCatPromptTrigger(trigger);
  };

  if (!member) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Member not found</p>
      <button onClick={() => navigate('/members')} className="text-sky-700 mt-2 hover:underline text-sm">Back to list</button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-4">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/members')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft size={16} /> Members
        </button>
        <div className="flex gap-2">
          {!member.isRemoved && (
            <>
              <button onClick={() => navigate(`/members/${id}/edit`)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-lg">
                <Edit size={14} /> Edit
              </button>
              {(user?.role === 'super_admin' || user?.role === 'suk_admin') && (
                <button onClick={() => setRm(true)}
                  className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </>
          )}
          {member.isRemoved && (user?.role === 'super_admin' || user?.role === 'suk_admin') && (
            <button onClick={() => bringBack(id)}
              className="flex items-center gap-1.5 border border-green-200 hover:bg-green-50 text-green-700 text-sm px-3 py-1.5 rounded-lg">
              <RotateCcw size={14} /> Restore
            </button>
          )}
        </div>
      </div>

      {/* Member card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-50 to-sky-50 px-5 py-4 flex items-start gap-4">
          <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {member.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
            {member.guardianName && <p className="text-sm text-gray-500 mt-0.5">Guardian: {member.guardianName}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <CategoryBadge category={member.memberCategory} />
              {member.memberCategory !== 'PROSPECT' && <DPStatusBadge status={member.dpStatus} />}
              {member.memberCategory !== 'PROSPECT' && <IshtabhritiStatusBadge status={member.ishtabhritiStatus} />}
            </div>
          </div>
        </div>

        {/* Category journey stepper */}
        <CategoryStepper current={member.memberCategory} />

        {/* Quick info row */}
        <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-4 flex-wrap text-sm text-gray-600">
          {member.contactNo && (
            <a href={`tel:${member.contactNo}`} className="flex items-center gap-1.5 hover:text-sky-700 transition-colors">
              <Phone size={14} className="text-sky-500" />{member.contactNo}
            </a>
          )}
          {member.alternatePhone && (
            <a href={`tel:${member.alternatePhone}`} className="flex items-center gap-1.5 hover:text-sky-700 transition-colors text-gray-500">
              <Phone size={14} className="text-gray-400" />{member.alternatePhone}
            </a>
          )}
          {member.area && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-sky-500" />{member.area}, {sukName}</span>}
          {member.hasAsthan && <span className="flex items-center gap-1.5 text-green-700"><Home size={14} />Has Asthan</span>}
          {member.isAdikshita && <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full text-xs font-medium">Not yet initiated</span>}
        </div>

        {/* Action buttons */}
        {!member.isRemoved && (
          <div className="px-5 py-3 flex gap-2 border-b border-gray-50 flex-wrap">
            <button onClick={() => setVis(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm py-2 rounded-xl transition-colors min-w-[7rem]">
              <CalendarPlus size={15} /> Log Visit
            </button>
            {member.memberCategory !== 'PROSPECT' && (
              <button onClick={() => setIsh(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm py-2 rounded-xl transition-colors min-w-[7rem]">
                <IndianRupee size={15} /> Log Ishtabhrity
              </button>
            )}
            <button onClick={() => setCat(true)}
              className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-sm px-3 py-2 rounded-xl transition-colors"
              title="Change Category">
              <RefreshCw size={15} /> Category
            </button>
            <button onClick={() => setShowHistory(h => !h)}
              className={`flex items-center justify-center gap-2 font-medium text-sm px-3 py-2 rounded-xl transition-colors ${showHistory ? 'bg-amber-500 text-white' : 'bg-amber-50 hover:bg-amber-100 text-amber-700'}`}
              title="Change History">
              <History size={15} /> History
            </button>
            {member.geoLocation && (
              <a href={member.geoLocation} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm px-3 py-2 rounded-xl transition-colors">
                <ExternalLink size={14} /> Map
              </a>
            )}
          </div>
        )}

        {/* Change History Panel */}
        {showHistory && (
          <div className="border-b border-gray-100">
            <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 border-b border-amber-100">
              <History size={14} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Change History</span>
            </div>
            <div className="px-5 py-4">
              <AuditLog memberId={id} fetchAuditLog={fetchAuditLog} />
            </div>
          </div>
        )}

        {/* Ishtabhrity Timeline */}
        {member.ishtabhritiStatus !== 'NOT_APPLICABLE' &&
         member.ishtabhritiStatus !== 'INACTIVE' &&
         member.memberCategory !== 'PROSPECT' &&
         member.memberCategory !== 'DEFAULTER' && (
          <div className="px-5 py-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Ishtabhrity Cycle
              </h3>
              {member.ishtabhritiStartDate && (
                <span className="text-xs text-gray-400">
                  Started {new Date(member.ishtabhritiStartDate + 'T00:00:00')
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <IshtabhritiTimeline
              memberId={member.id}
              memberPayments={memberPayments}
              startDate={member.ishtabhritiStartDate || null}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="px-5 pt-3">
          <div className="flex gap-1 border-b border-gray-100">
            {['info', 'visits', 'payments'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  tab === t ? 'border-sky-500 text-sky-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>{t === 'info' ? 'Details' : t === 'visits' ? `Visits (${memberVisits.length})` : `Payments (${memberPayments.length})`}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-5">
          {tab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: 'Family Code',      value: member.familyCode      },
                { label: 'Alternate Phone',  value: member.alternatePhone  },
                { label: 'Initiation Date',  value: member.initiationDate  },
                { label: 'Profession',       value: member.profession      },
                { label: 'Ritwik Name',      value: member.ritwikName      },
                { label: 'Assigned To',   value: worker?.name         },
                { label: 'PIN Code',      value: member.pinCode       },
                { label: 'Present Address', value: member.presentAddress, full: true },
                { label: 'Permanent Address', value: member.permanentAddress, full: true },
                { label: 'SUK',           value: sukName              },
                { label: 'Member Since',  value: member.createdAt     },
                { label: 'Last Visited',  value: memberVisits.length > 0
                    ? new Date(memberVisits[0].visitDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Never' },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className={f.full ? 'col-span-2' : ''}>
                  <div className="text-xs text-gray-400 mb-0.5">{f.label}</div>
                  <div className="text-gray-900 font-medium">{f.value}</div>
                </div>
              ))}
              {/* Attributes */}
              {(() => {
                const attrs = [
                  { key: 'hasAsthan',          label: 'Has Thakur Asthan'       },
                  { key: 'isAdikshita',         label: 'Adikshita'               },
                  { key: 'recentlyTookDikhya',  label: 'Recently Took Dikhya'    },
                  { key: 'playsHarmonium',      label: 'Plays Harmonium'         },
                  { key: 'spouseProspect',      label: 'Spouse Prospect'         },
                  { key: 'childrenProspect',    label: 'Children Prospect'       },
                  { key: 'interestedInSinging', label: 'Interested in Singing'   },
                  { key: 'canHelpInDPWork',     label: 'Can Help in DP Work'     },
                  { key: 'sharesRoom',          label: 'Shares Room'             },
                  { key: 'staysInPG',           label: 'Stays in PG'             },
                  { key: 'keepsPrayer',         label: 'Keeps Prayer'            },
                  { key: 'comesToSatsang',      label: 'Comes to Satsang'        },
                  { key: 'keepsBhadraSatsang',  label: 'Keeps Bhadra Satsang'    },
                  { key: 'doesDPWork',          label: 'Does DP Work'            },
                  { key: 'goesToTemple',        label: 'Goes to Temple'          },
                  { key: 'deogharkVisit',       label: 'Deoghar Visit'           },
                  { key: 'swastaini',           label: 'Swastaini'               },
                  { key: 'newInBengaluru',      label: 'New in Bengaluru'        },
                ].filter(a => member[a.key]);

                return attrs.length > 0 ? (
                  <div className="col-span-2 mt-1">
                    <div className="text-xs text-gray-400 mb-2">Attributes</div>
                    <div className="flex flex-wrap gap-2">
                      {attrs.map(a => (
                        <span key={a.key} className="text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-full">
                          {a.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {member.isRemoved && (
                <div className="col-span-2 bg-red-50 rounded-lg p-3 border border-red-100">
                  <div className="text-xs text-red-600 font-medium">Removed on {member.removedAt}</div>
                  <div className="text-sm text-red-700 mt-0.5">{member.removedReason}</div>
                </div>
              )}
            </div>
          )}

          {tab === 'visits' && (() => {
            // Sort chronologically for numbering; display newest-first
            const chronological = [...memberVisits].sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
            // Dikhya only confirmed if there's an actual visit with Dikhya outcome (or flag explicitly set)
            const hasDikhya = chronological.some(v => v.outcome === 'Took Dikhya' || v.outcome === 'Dikhya taken')
              || member.recentlyTookDikhya === true;
            const isProspect = member.memberCategory === 'PROSPECT';
            const total = chronological.length;

            const OUTCOME_STYLE = {
              'Responsive & willing':           { dot: 'bg-sky-400', ring: 'ring-sky-200', badge: 'bg-sky-50 text-sky-700', line: 'bg-sky-300' },
              'Not at home':                    { dot: 'bg-gray-400',   ring: 'ring-gray-200',   badge: 'bg-gray-50 text-gray-500',     line: 'bg-gray-200'   },
              'Will resume Ishtabhrity':        { dot: 'bg-blue-400',   ring: 'ring-blue-200',   badge: 'bg-blue-50 text-blue-700',     line: 'bg-blue-200'   },
              'Agreed to start prayer at home': { dot: 'bg-teal-400',   ring: 'ring-teal-200',   badge: 'bg-teal-50 text-teal-700',     line: 'bg-teal-200'   },
              'Not interested currently':       { dot: 'bg-red-400',    ring: 'ring-red-200',    badge: 'bg-red-50 text-red-600',       line: 'bg-red-200'    },
              'Moving soon':                    { dot: 'bg-gray-400',   ring: 'ring-gray-200',   badge: 'bg-gray-50 text-gray-500',     line: 'bg-gray-200'   },
              'Health issues':                  { dot: 'bg-purple-400', ring: 'ring-purple-200', badge: 'bg-purple-50 text-purple-700', line: 'bg-purple-200' },
              'Listened but non-committal':     { dot: 'bg-sky-400',  ring: 'ring-sky-200',  badge: 'bg-sky-50 text-sky-700',   line: 'bg-sky-200'  },
              'Interested':                     { dot: 'bg-sky-400', ring: 'ring-sky-200', badge: 'bg-sky-50 text-sky-700', line: 'bg-sky-300' },
              'Very interested':                { dot: 'bg-sky-500', ring: 'ring-sky-200', badge: 'bg-sky-100 text-sky-700',line: 'bg-sky-400' },
              'Not interested':                 { dot: 'bg-red-400',    ring: 'ring-red-200',    badge: 'bg-red-50 text-red-600',       line: 'bg-red-200'    },
              'Took Dikhya':                    { dot: 'bg-green-500',  ring: 'ring-green-200',  badge: 'bg-green-50 text-green-700',   line: 'bg-green-400'  },
              'Dikhya taken':                   { dot: 'bg-green-500',  ring: 'ring-green-200',  badge: 'bg-green-50 text-green-700',   line: 'bg-green-400'  },
            };
            const defaultStyle = { dot: 'bg-gray-400', ring: 'ring-gray-200', badge: 'bg-gray-50 text-gray-600', line: 'bg-gray-200' };

            if (total === 0) return (
              <div className="text-center py-10 text-gray-400 text-sm">
                <div className="text-3xl mb-2">👣</div>
                No visits logged yet
              </div>
            );

            // Newest first for display
            const displayOrder = [...chronological].reverse();

            return (
              <div className="px-1">
                {/* Summary strip */}
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${hasDikhya ? 'bg-green-500' : 'bg-sky-400'}`}
                      style={{ width: hasDikhya ? '100%' : `${Math.min(95, (total / (total + 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                    {hasDikhya ? `🙏 Dikhya taken in ${total} visit${total !== 1 ? 's' : ''}` : `${total} visit${total !== 1 ? 's' : ''} so far`}
                  </span>
                </div>

                {/* Timeline — newest at top */}
                <div className="relative">

                  {/* TOP node: Dikhya achieved milestone OR prospect goal ghost */}
                  {hasDikhya && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center w-6 flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-green-500 ring-4 ring-green-200 shadow-md flex items-center justify-center text-sm -ml-0.5">
                          🙏
                        </div>
                        <div className="w-0.5 flex-1 mt-1 mb-1 rounded-full min-h-[24px] bg-green-300" />
                      </div>
                      <div className="flex-1 mb-4 rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3">
                        <p className="text-sm font-bold text-green-800">Dikhya Taken 🎉</p>
                        <p className="text-xs text-green-600 mt-0.5">Journey complete after {total} visit{total !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}

                  {!hasDikhya && isProspect && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center w-6 flex-shrink-0">
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-green-300 bg-green-50 flex items-center justify-center">
                          <span className="text-[10px]">🙏</span>
                        </div>
                        <div className="w-0.5 h-6 mt-1 mb-1" style={{ borderLeft: '2px dashed #d1d5db' }} />
                      </div>
                      <div className="flex-1 mb-4 rounded-xl border-2 border-dashed border-green-200 bg-green-50/40 px-4 py-2.5">
                        <p className="text-xs font-semibold text-green-600">Goal: Dikhya 🎯</p>
                      </div>
                    </div>
                  )}

                  {/* Visits — newest first */}
                  {displayOrder.map((v, i) => {
                    const w = workers.find(w => w.id === v.visitedBy);
                    const visitNum = chronological.findIndex(cv => cv.id === v.id) + 1;
                    const isLastInDisplay = i === total - 1; // oldest = last shown
                    const style = OUTCOME_STYLE[v.outcome] || defaultStyle;
                    const isDikhyaVisit = v.outcome === 'Took Dikhya' || v.outcome === 'Dikhya taken';
                    const nodeStyle = isDikhyaVisit
                      ? { dot: 'bg-green-500', ring: 'ring-green-300', badge: 'bg-green-100 text-green-700', line: 'bg-green-300' }
                      : style;

                    return (
                      <div key={v.id} className="flex gap-4 min-h-0">
                        {/* Left: dot + line */}
                        <div className="flex flex-col items-center w-6 flex-shrink-0">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ring-4 z-10
                            ${nodeStyle.dot} ${nodeStyle.ring} shadow-sm
                          `}>
                            {isDikhyaVisit
                              ? <span className="text-white text-[10px]">🙏</span>
                              : <span className="text-white text-[10px] font-bold">{visitNum}</span>
                            }
                          </div>
                          {/* Connector to next (older) visit */}
                          {!isLastInDisplay && (
                            <div className={`w-0.5 flex-1 mt-1 mb-1 rounded-full min-h-[24px] ${nodeStyle.line}`} />
                          )}
                        </div>

                        {/* Right: content card */}
                        <div className={`flex-1 mb-4 rounded-xl border p-3.5 ${
                          isDikhyaVisit ? 'border-green-200 bg-green-50/60' : 'border-gray-100 bg-white'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                            <span className="text-xs font-semibold text-gray-500">
                              {new Date(v.visitDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {v.outcome && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${nodeStyle.badge}`}>
                                {v.outcome}
                              </span>
                            )}
                          </div>
                          {v.notes && <p className="text-sm text-gray-700 leading-relaxed">{v.notes}</p>}
                          {v.nextAction && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                              <Clock size={11} /> Next: {v.nextAction}
                            </div>
                          )}
                          {w && <div className="mt-2 text-xs text-gray-400">Visited by {w.name}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {tab === 'payments' && (
            <div className="space-y-2">
              {memberPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No Ishtabhrity records yet</div>
              ) : memberPayments.map(p => {
                const w    = workers.find(w => w.id === p.recordedBy);
                const sent = !p.status || p.status === 'SENT';
                return (
                  <div key={p.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    sent ? 'border-green-100 bg-green-50/40' : 'border-red-100 bg-red-50/40'
                  }`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {new Date(p.monthCovered + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        Recorded {p.paymentDate}{w?.name ? ` · by ${w.name}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sent ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12} /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                          ✕ Not Sent
                        </span>
                      )}
                      <button
                        onClick={() => { if (window.confirm('Delete this payment record?')) deletePayment(p.id); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LogVisitModal          open={visitModal} onClose={() => setVis(false)} member={member} workerId={user?.workerId} onSave={handleLogVisit} />
      <RecordIshtabhritiModal open={ishModal}   onClose={() => setIsh(false)} member={member} workerId={user?.workerId} onSave={recordPayment} />
      <RemoveModal            open={rmModal}    onClose={() => setRm(false)}  member={member} onRemove={handleRemove} />
      <CategoryPickerModal
        open={catModal}
        onClose={() => setCat(false)}
        currentCategory={member.memberCategory}
        onSelect={(key) => { editMember(id, { memberCategory: key }); setCat(false); }}
      />
      <CategoryChangePromptModal
        open={!!catPromptTrigger}
        onClose={() => setCatPromptTrigger(null)}
        member={member}
        triggerKey={catPromptTrigger}
        onSelect={(key) => { editMember(id, { memberCategory: key }); setCatPromptTrigger(null); }}
      />
    </div>
  );
}
