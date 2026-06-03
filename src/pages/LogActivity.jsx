import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES, VISIT_OUTCOMES } from '../constants';
import CategoryChangePromptModal from '../components/CategoryChangePromptModal';
import {
  Zap, Phone, MapPin, ExternalLink, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlarmClock, Calendar, ClipboardList,
  ChevronRight, User, Navigation, PencilLine, Save, X
} from 'lucide-react';

const CAT_COLORS = {
  PROSPECT:            'bg-purple-100 text-purple-700',
  DEFAULTER:           'bg-red-100 text-red-700',
  SUPER_NEW:           'bg-teal-100 text-teal-700',
  SEMI_ACTIVE:         'bg-sky-100 text-sky-700',
  REGULAR_CONTRIBUTOR: 'bg-blue-100 text-blue-700',
  ACTIVE_DP_WORKER:    'bg-green-100 text-green-700',
};


function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function MemberCard({ member, retro = {}, onUpdate, onSaveMember, onCategoryPrompt }) {
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState(retro);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locForm, setLocForm] = useState({
    area: member.area || '',
    presentAddress: member.presentAddress || '',
    geoLocation: member.geoLocation || '',
  });
  const [locSaved, setLocSaved] = useState(false);

  const save = (patch) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onUpdate(updated);
  };

  const saveLocation = () => {
    onSaveMember(member.id, locForm);
    setEditingLocation(false);
    setLocSaved(true);
    setTimeout(() => setLocSaved(false), 2000);
  };

  const hasLocation = member.geoLocation || locForm.geoLocation;
  const hasAddress  = member.presentAddress || member.area || locForm.presentAddress || locForm.area;
  const missingLocationInfo = !member.geoLocation && !member.presentAddress && !member.area;

  const metSet    = local.met === true;
  const notMetSet = local.met === false;
  const catLabel  = MEMBER_CATEGORIES[member.memberCategory]?.label || member.memberCategory;

  // Live values (after save, use locForm until next render)
  const displayArea    = member.area || locForm.area;
  const displayAddress = member.presentAddress || locForm.presentAddress;
  const displayGeo     = member.geoLocation || locForm.geoLocation;

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      metSet    ? 'border-green-200 bg-green-50/40' :
      notMetSet ? 'border-red-100 bg-red-50/20' :
                  'border-gray-100 bg-white'
    }`}>
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
            metSet ? 'bg-green-500 text-white' : notMetSet ? 'bg-red-100 text-red-500' : 'bg-sky-100 text-sky-700'
          }`}>
            {metSet ? <CheckCircle2 size={18} /> : notMetSet ? <XCircle size={18} /> : member.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{member.name}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${CAT_COLORS[member.memberCategory] || 'bg-gray-100 text-gray-600'}`}>
                {catLabel}
              </span>
            </div>

            {/* Phone */}
            {member.contactNo && (
              <a href={`tel:${member.contactNo}`}
                className="inline-flex items-center gap-1 text-xs text-sky-700 font-medium hover:underline mt-1"
              >
                <Phone size={11} /> {member.contactNo}
              </a>
            )}

            {/* Location info — shown if available */}
            {(displayArea || displayAddress || displayGeo) && !editingLocation && (
              <div className="mt-2 space-y-1.5">
                {displayArea && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                    <span>{displayArea}</span>
                  </div>
                )}
                {displayAddress && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{displayAddress}</span>
                  </div>
                )}
                {displayGeo && (
                  <a href={displayGeo} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <Navigation size={11} /> Navigate to Location
                  </a>
                )}
                {/* Edit location link */}
                <button
                  onClick={() => { setLocForm({ area: member.area || '', presentAddress: member.presentAddress || '', geoLocation: member.geoLocation || '' }); setEditingLocation(true); }}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <PencilLine size={10} /> Update location
                </button>
              </div>
            )}

            {/* Missing location — prompt to add */}
            {missingLocationInfo && !editingLocation && (
              <button
                onClick={() => setEditingLocation(true)}
                className="mt-2 flex items-center gap-1.5 text-xs border border-dashed border-sky-300 bg-sky-50 text-sky-700 font-medium px-3 py-1.5 rounded-xl hover:bg-sky-100 transition-colors w-full justify-center"
              >
                <MapPin size={11} /> Add address &amp; location
              </button>
            )}
          </div>
        </div>

        {/* Inline location editor */}
        {editingLocation && (
          <div className="mt-3 border border-blue-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-blue-50 px-3 py-2">
              <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                <MapPin size={12} /> Add / Update Location
              </span>
              <button onClick={() => setEditingLocation(false)}>
                <X size={14} className="text-blue-400 hover:text-blue-700" />
              </button>
            </div>
            <div className="p-3 bg-white space-y-2">
              <input
                value={locForm.area}
                onChange={e => setLocForm(f => ({ ...f, area: e.target.value }))}
                placeholder="Area / Locality (e.g. Hulimavu)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={locForm.presentAddress}
                onChange={e => setLocForm(f => ({ ...f, presentAddress: e.target.value }))}
                placeholder="Present address"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <input
                value={locForm.geoLocation}
                onChange={e => setLocForm(f => ({ ...f, geoLocation: e.target.value }))}
                placeholder="Paste Google Maps link"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={saveLocation}
                disabled={!locForm.area && !locForm.presentAddress && !locForm.geoLocation}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                <Save size={12} /> Save Location
              </button>
            </div>
          </div>
        )}

        {locSaved && (
          <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> Location saved!
          </div>
        )}

        {/* Met / Not Met / Cancel */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { save({ met: true }); setExpanded(true); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              metSet
                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600'
            }`}
          >
            <CheckCircle2 size={13} /> Met
          </button>
          <button
            onClick={() => { save({ met: false }); setExpanded(true); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              notMetSet
                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-600'
            }`}
          >
            <XCircle size={13} /> Not Met
          </button>
          {/* Cancel — shown when either button was pressed, resets the selection */}
          {(metSet || notMetSet) && (
            <button
              onClick={() => { save({ met: undefined, outcome: '', notes: '', tookDikhya: false }); setExpanded(false); }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
              title="Undo selection"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded log area — shown for both Met and Not Met */}
      {expanded && (metSet || notMetSet) && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

          {/* Outcome dropdown — same options as the manual visit log */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
              Outcome
            </label>
            <select
              value={local.outcome || ''}
              onChange={e => save({ outcome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
            >
              <option value="">Select outcome…</option>
              {VISIT_OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Dikhya checkbox — only for Prospects when Met */}
          {metSet && member.memberCategory === 'PROSPECT' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!local.tookDikhya}
                onChange={e => {
                  save({ tookDikhya: e.target.checked, outcome: e.target.checked ? 'Dikhya taken' : (local.outcome || '') });
                  if (e.target.checked && onCategoryPrompt) onCategoryPrompt(member, 'DIKHYA');
                }}
                className="w-4 h-4 rounded accent-sky-600"
              />
              <span className="text-sm text-gray-700 font-medium">🙏 Took Dikhya on this visit</span>
            </label>
          )}

          {/* Notes */}
          <textarea
            value={local.notes || ''}
            onChange={e => save({ notes: e.target.value })}
            rows={2}
            placeholder="Quick notes from the visit…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />
        </div>
      )}
    </div>
  );
}


export default function LogActivity() {
  const { drives, members, user, editDrive, editMember, logVisit, editVisit } = useApp();
  const [catPrompt, setCatPrompt] = useState(null); // { member, triggerKey }
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Active drives = upcoming + not cancelled/done, sorted nearest first
  const activeDrives = useMemo(() =>
    drives
      .filter(d => d.status !== 'DONE' && d.status !== 'CANCELLED')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [drives]
  );

  const [selectedDriveId, setSelectedDriveId] = useState(() => {
    // Auto-select today's drive first, otherwise nearest upcoming
    const todayDrive = activeDrives.find(d => d.date === today);
    return todayDrive?.id || activeDrives[0]?.id || null;
  });

  const drive = drives.find(d => d.id === selectedDriveId);

  const driveMembers = useMemo(() => {
    if (!drive?.memberIds) return [];
    return drive.memberIds.map(id => members.find(m => m.id === id)).filter(Boolean);
  }, [drive, members]);

  const retroKeys = Object.keys(drive?.retrospect || {});
  const metCount  = retroKeys.filter(k => drive?.retrospect[k]?.met === true).length;

  const handleRetroUpdate = async (memberId, retroData) => {
    const existing = drive.retrospect?.[memberId] || {};
    let updatedRetro = { ...retroData };

    if (retroData.met === true) {
      const outcomeLabel = retroData.outcome || '';
      if (!existing.visitId) {
        // First time marked as met — create a visit record
        const visit = await logVisit({
          personId:   memberId,
          visitDate:  drive.date,
          visitedBy:  user?.workerId,
          driveId:    drive.id,
          notes:      retroData.notes || '',
          outcome:    outcomeLabel,
        });
        updatedRetro.visitId = visit.id;
      } else {
        // Already created — update notes/outcome in the visit record
        editVisit(existing.visitId, {
          notes:   retroData.notes || '',
          outcome: outcomeLabel,
        });
      }
    }

    const newRetro = { ...(drive.retrospect || {}), [memberId]: updatedRetro };
    editDrive(drive.id, { retrospect: newRetro });
  };

  const markDone = () => {
    editDrive(drive.id, { status: 'DONE' });
  };

  // No drives at all
  if (activeDrives.length === 0) {
    return (
      <div className="max-w-lg space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Zap size={20} className="text-sky-500" /> Log Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your visits during a drive</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center">
            <ClipboardList size={26} className="text-sky-300" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium text-sm">No active drives planned</p>
            <p className="text-gray-400 text-xs mt-1">Plan a drive first, then come back here to log your visits</p>
          </div>
          <button
            onClick={() => navigate('/dp-work/new')}
            className="mt-1 flex items-center gap-1.5 bg-sky-500 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Plan a Drive
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap size={20} className="text-sky-500" /> Log Activity
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Visit, log, and track during your drive</p>
        </div>
      </div>

      {/* Drive selector — if multiple active drives */}
      {activeDrives.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Select Drive</p>
          </div>
          <div className="divide-y divide-gray-50">
            {activeDrives.map(d => {
              const isSelected = d.id === selectedDriveId;
              const dDate = d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDriveId(d.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                    isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-sky-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{d.name}</div>
                    <div className="text-xs text-gray-400">{dDate}{d.time ? ` · ${formatTime(d.time)}` : ''}</div>
                  </div>
                  {isSelected && <ChevronRight size={14} className="text-sky-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active drive info card */}
      {drive && (
        <div className="bg-sky-500 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sky-200 text-xs font-semibold uppercase tracking-wide mb-1">Active Drive</p>
              <h2 className="font-bold text-base leading-snug">{drive.name}</h2>
              <div className="flex items-center gap-3 mt-2 text-sky-100 text-xs flex-wrap">
                {drive.date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(drive.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                )}
                {drive.time && (
                  <span className="flex items-center gap-1"><AlarmClock size={11} /> {formatTime(drive.time)}</span>
                )}
                {drive.meetingPlace && (
                  <span className="flex items-center gap-1"><MapPin size={11} /> {drive.meetingPlace}</span>
                )}
              </div>
              {drive.meetingLocation && (
                <a href={drive.meetingLocation} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg transition-colors">
                  <ExternalLink size={11} /> Open Meeting Location
                </a>
              )}
            </div>
            {/* Progress */}
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold">{metCount}/{driveMembers.length}</div>
              <div className="text-sky-200 text-xs">met</div>
            </div>
          </div>

          {drive.targetArea && (
            <div className="mt-2.5 text-xs text-sky-100 bg-white/10 rounded-lg px-3 py-1.5">
              🎯 {drive.targetArea}
            </div>
          )}
        </div>
      )}

      {/* Member cards */}
      {driveMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center">
          <User size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No members in this drive</p>
          <button
            onClick={() => navigate(`/dp-work/${drive?.id}`)}
            className="mt-3 text-xs text-sky-700 hover:underline"
          >
            Edit drive to add members →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Members to visit ({driveMembers.length})
            </p>
            <button
              onClick={() => navigate(`/dp-work/${drive?.id}`)}
              className="text-xs text-sky-700 hover:underline flex items-center gap-0.5"
            >
              Full detail <ChevronRight size={11} />
            </button>
          </div>
          {driveMembers.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              retro={drive?.retrospect?.[m.id] || {}}
              onUpdate={(data) => handleRetroUpdate(m.id, data)}
              onSaveMember={(id, data) => editMember(id, data)}
              onCategoryPrompt={(member, triggerKey) => setCatPrompt({ member, triggerKey })}
            />
          ))}
        </div>
      )}

      {/* Mark drive done */}
      {drive && driveMembers.length > 0 && metCount === driveMembers.length && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-green-800">All members visited! 🎉</p>
            <p className="text-xs text-green-600 mt-0.5">Ready to mark this drive as done?</p>
          </div>
          <button
            onClick={markDone}
            className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Mark Done
          </button>
        </div>
      )}

      {/* Category change prompt — auto-triggered when Dikhya checkbox ticked */}
      <CategoryChangePromptModal
        open={!!catPrompt}
        onClose={() => setCatPrompt(null)}
        member={catPrompt?.member}
        triggerKey={catPrompt?.triggerKey}
        onSelect={(key) => {
          if (catPrompt?.member) editMember(catPrompt.member.id, { memberCategory: key });
        }}
      />
    </div>
  );
}
