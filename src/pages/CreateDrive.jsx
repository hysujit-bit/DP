import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES, SUKS } from '../constants';
import { ArrowLeft, ArrowRight, Check, Users, MessageCircle, Search, UserPlus, X } from 'lucide-react';

const DRIVE_TYPES = [
  {
    key: 'PROSPECT_VISIT',
    label: 'Prospect Visit',
    icon: '🌱',
    desc: 'Visit people who haven\'t taken Dikhya yet',
    filterCats: ['PROSPECT'],
    color: 'border-purple-200 bg-purple-50',
    activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-400',
    badge: 'bg-purple-100 text-purple-700',
  },
  {
    key: 'DEFAULTER_FOLLOWUP',
    label: 'Defaulter Follow-up',
    icon: '🔄',
    desc: 'Reconnect with initiates who have drifted away',
    filterCats: ['DEFAULTER'],
    color: 'border-red-200 bg-red-50',
    activeColor: 'border-red-500 bg-red-50 ring-2 ring-red-400',
    badge: 'bg-red-100 text-red-700',
  },
  {
    key: 'SUPER_NEW_CARE',
    label: 'Super New Care',
    icon: '✨',
    desc: 'Nurture recently initiated members',
    filterCats: ['SUPER_NEW'],
    color: 'border-teal-200 bg-teal-50',
    activeColor: 'border-teal-500 bg-teal-50 ring-2 ring-teal-400',
    badge: 'bg-teal-100 text-teal-700',
  },
  {
    key: 'SEMI_ACTIVE_NUDGE',
    label: 'Semi-Active Nudge',
    icon: '⚠️',
    desc: 'Re-engage semi-active members before they drift',
    filterCats: ['SEMI_ACTIVE'],
    color: 'border-sky-200 bg-sky-50',
    activeColor: 'border-sky-500 bg-sky-50 ring-2 ring-sky-400',
    badge: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'MIXED',
    label: 'Mixed Drive',
    icon: '🤝',
    desc: 'Visit members from multiple categories',
    filterCats: ['PROSPECT', 'DEFAULTER', 'SUPER_NEW', 'SEMI_ACTIVE'],
    color: 'border-blue-200 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'ARGHYA_COLLECTION',
    label: 'Arghya Collection Drive',
    icon: '🪔',
    desc: 'Collect Arghya from all members of the SUK',
    filterCats: null, // all members
    color: 'border-sky-200 bg-sky-50',
    activeColor: 'border-sky-500 bg-sky-50 ring-2 ring-sky-400',
    badge: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'UTSAV_INVITATION',
    label: 'Utsav Invitation Drive',
    icon: '🎉',
    desc: 'Personally invite all members to the upcoming Utsav',
    filterCats: null, // all members
    color: 'border-pink-200 bg-pink-50',
    activeColor: 'border-pink-500 bg-pink-50 ring-2 ring-pink-400',
    badge: 'bg-pink-100 text-pink-700',
  },
  {
    key: 'CUSTOM',
    label: 'Custom Drive',
    icon: '📋',
    desc: 'Manually pick any members for any purpose',
    filterCats: null, // show all
    color: 'border-gray-200 bg-gray-50',
    activeColor: 'border-gray-500 bg-gray-50 ring-2 ring-gray-400',
    badge: 'bg-gray-100 text-gray-700',
  },
];

const CAT_COLORS = {
  PROSPECT:            'bg-purple-100 text-purple-700',
  DEFAULTER:           'bg-red-100 text-red-700',
  SUPER_NEW:           'bg-teal-100 text-teal-700',
  SEMI_ACTIVE:         'bg-sky-100 text-sky-700',
  REGULAR_CONTRIBUTOR: 'bg-blue-100 text-blue-700',
  ACTIVE_DP_WORKER:    'bg-green-100 text-green-700',
};

const STEPS = ['Details', 'Drive Type', 'Select Members', 'Review'];

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function buildWhatsAppMessage(drive, selectedMembers, sukName) {
  const dateStr = drive.date
    ? new Date(drive.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBD';
  const timeStr = formatTime(drive.time);
  const lines = [
    `Jayaguru All 🙏`,
    `We will be conducting a DP drive in our ${sukName ? sukName + ' SUK' : 'SUK'} 🙏`,
    ``,
    `🙏 *DP Work Drive — ${drive.name}*`,
    `📅 Date: ${dateStr}`,
    timeStr ? `🕐 Time: ${timeStr}` : null,
    drive.meetingPlace ? `📍 Meet at: ${drive.meetingPlace}` : null,
    drive.meetingLocation ? `🗺️ Map: ${drive.meetingLocation}` : null,
    drive.targetArea ? `🎯 Target Area: ${drive.targetArea}` : null,
    ``,
    `*Members to visit:*`,
    ...selectedMembers.map((m, i) => {
      const area = m.area ? ` (${m.area})` : '';
      const cat = MEMBER_CATEGORIES[m.memberCategory]?.label || m.memberCategory;
      return `${i + 1}. ${m.name}${area} — ${cat}`;
    }),
    ``,
    `Please join us to make this drive successful.`,
    ``,
    `Vande Purushotamam 🙏`,
    drive.notes ? `\n📝 ${drive.notes}` : null,
  ].filter(l => l !== null);
  return lines.join('\n');
}

export default function CreateDrive() {
  const { members, createDrive, createMember, currentSukId } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    meetingPlace: '',
    meetingLocation: '',
    targetArea: '',
    notes: '',
    driveType: '',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickContact, setQuickContact] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  const selectedType = DRIVE_TYPES.find(t => t.key === form.driveType);
  const sukName = SUKS.find(s => s.id === currentSukId)?.name || '';

  // Members eligible for current drive type
  const eligibleMembers = useMemo(() => {
    const cats = selectedType?.filterCats;
    return members
      .filter(m => !m.isRemoved)
      .filter(m => !cats || cats.includes(m.memberCategory))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, selectedType]);

  const filteredEligible = useMemo(() => {
    const q = memberSearch.toLowerCase();
    if (!q) return eligibleMembers;
    return eligibleMembers.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.area || '').toLowerCase().includes(q)
    );
  }, [eligibleMembers, memberSearch]);

  const selectedMembers = useMemo(
    () => selectedIds.map(id => members.find(m => m.id === id)).filter(Boolean),
    [selectedIds, members]
  );

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedIds(filteredEligible.map(m => m.id));
  const clearAll  = () => setSelectedIds([]);

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.date;
    if (step === 1) return !!form.driveType;
    if (step === 2) return true; // selection is optional
    return true;
  };

  const handleQuickAdd = async () => {
    if (!quickName.trim()) return;
    setQuickAdding(true);
    try {
      const newMember = await createMember({
        name: quickName.trim(),
        contactNo: quickContact.trim(),
        memberCategory: 'PROSPECT',
        sukId: currentSukId,
        dpStatus: 'FW_PENDING',
        ishtabhritiStatus: 'IRREGULAR',
      });
      setSelectedIds(prev => [...prev, newMember.id]);
      setQuickName('');
      setQuickContact('');
      setShowQuickAdd(false);
    } finally {
      setQuickAdding(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const drive = await createDrive({
        ...form,
        memberIds: selectedIds,
        status: 'UPCOMING',
      });
      navigate(`/dp-work/${drive.id}`);
    } catch {
      setSaving(false);
    }
  };

  const whatsappMsg = buildWhatsAppMessage(form, selectedMembers, sukName);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsappMsg).then(() => {
      setWhatsappCopied(true);
      setTimeout(() => setWhatsappCopied(false), 2000);
    });
  };

  const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent";

  return (
    <div className="max-w-xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dp-work')}
          className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Plan a Drive</h1>
          <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${
            i < step ? 'bg-sky-500' : i === step ? 'bg-sky-300' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* ── Step 0: Basic Details ── */}
        {step === 0 && (
          <div className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Drive Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Drive Name <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Weekend Drive – June 2026"
                className={inp}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Drive Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className={inp}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className={inp}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gathering / Meeting Place</label>
              <input
                value={form.meetingPlace}
                onChange={e => setForm(f => ({ ...f, meetingPlace: e.target.value }))}
                placeholder="e.g. Sujit bhai's house, Banashankari Temple hall"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Maps Link</label>
              <input
                value={form.meetingLocation}
                onChange={e => setForm(f => ({ ...f, meetingLocation: e.target.value }))}
                placeholder="Paste Google Maps URL here"
                className={inp}
              />
              <p className="text-xs text-gray-400 mt-1">This link will be included in the WhatsApp message so workers can navigate directly</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Area</label>
              <input
                value={form.targetArea}
                onChange={e => setForm(f => ({ ...f, targetArea: e.target.value }))}
                placeholder="e.g. Talaghattapura, Uttarahalli Layout"
                className={inp}
              />
              <p className="text-xs text-gray-400 mt-1">The locality or area the team will be covering</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes / Instructions</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Any special notes for the team..."
                className={`${inp} resize-none`}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Drive Type ── */}
        {step === 1 && (
          <div className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Drive Type</h2>
            <p className="text-xs text-gray-400">Choose the purpose of this drive — it determines which members are shown in the next step.</p>
            <div className="grid grid-cols-1 gap-2.5 mt-2">
              {DRIVE_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, driveType: t.key })); setSelectedIds([]); }}
                  className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all flex items-center gap-3 ${
                    form.driveType === t.key ? t.activeColor : t.color + ' hover:border-opacity-80'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                  </div>
                  {form.driveType === t.key && (
                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Select Members ── */}
        {step === 2 && (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Select Members
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Optional — you can also add members later</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-xs text-sky-700 hover:underline">All</button>
                <span className="text-gray-300">·</span>
                <button onClick={clearAll} className="text-xs text-gray-400 hover:underline">Clear</button>
              </div>
            </div>

            {selectedType && (
              <div className={`text-xs font-medium px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${selectedType.badge}`}>
                <span>{selectedType.icon}</span> {selectedType.label} — {eligibleMembers.length} eligible member{eligibleMembers.length !== 1 ? 's' : ''}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search by name or area…"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Selected count */}
            {selectedIds.length > 0 && (
              <div className="text-xs text-sky-700 font-medium bg-sky-50 px-3 py-2 rounded-lg">
                ✓ {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
              </div>
            )}

            {/* Quick-add prospect */}
            {!showQuickAdd ? (
              <button
                onClick={() => setShowQuickAdd(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-200 rounded-xl py-2.5 text-sm font-medium text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <UserPlus size={15} /> Add New Prospect
              </button>
            ) : (
              <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-purple-50 px-3.5 py-2.5">
                  <span className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                    <UserPlus size={13} /> Quick Add Prospect
                  </span>
                  <button onClick={() => { setShowQuickAdd(false); setQuickName(''); setQuickContact(''); }}>
                    <X size={14} className="text-purple-400 hover:text-purple-700" />
                  </button>
                </div>
                <div className="p-3.5 space-y-2.5 bg-white">
                  <div>
                    <input
                      value={quickName}
                      onChange={e => setQuickName(e.target.value)}
                      placeholder="Full name *"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                      autoFocus
                    />
                  </div>
                  <div>
                    <input
                      value={quickContact}
                      onChange={e => setQuickContact(e.target.value)}
                      placeholder="Contact number (optional)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Will be added as a Prospect. You can fill in more details from their profile later.</p>
                  <button
                    onClick={handleQuickAdd}
                    disabled={!quickName.trim() || quickAdding}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                  >
                    {quickAdding ? 'Adding…' : 'Add & Select'}
                  </button>
                </div>
              </div>
            )}

            {/* Member list */}
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {filteredEligible.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  No members found
                </div>
              ) : filteredEligible.map(m => {
                const checked = selectedIds.includes(m.id);
                const catMeta = MEMBER_CATEGORIES[m.memberCategory];
                return (
                  <label key={m.id} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                    checked ? 'bg-sky-50' : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(m.id)}
                      className="w-4 h-4 rounded accent-sky-600 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{m.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {m.area && <span className="text-xs text-gray-400">{m.area}</span>}
                        {m.area && <span className="text-gray-200">·</span>}
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${CAT_COLORS[m.memberCategory] || 'bg-gray-100 text-gray-600'}`}>
                          {catMeta?.label || m.memberCategory}
                        </span>
                      </div>
                    </div>
                    {m.lastVisitDate && (
                      <span className="text-xs text-gray-300 flex-shrink-0">
                        Last: {m.lastVisitDate}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Review + WhatsApp ── */}
        {step === 3 && (
          <div className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Review & Share</h2>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Name</span>
                <span className="font-medium text-gray-900">{form.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Date</span>
                <span className="font-medium text-gray-900">
                  {form.date ? new Date(form.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
              {form.time && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Time</span>
                  <span className="font-medium text-gray-900">{formatTime(form.time)}</span>
                </div>
              )}
              {form.meetingPlace && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Meet at</span>
                  <span className="font-medium text-gray-900">{form.meetingPlace}</span>
                </div>
              )}
              {form.meetingLocation && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Map</span>
                  <a href={form.meetingLocation} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm truncate">
                    Open in Maps ↗
                  </a>
                </div>
              )}
              {form.targetArea && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Target Area</span>
                  <span className="font-medium text-gray-900">{form.targetArea}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Type</span>
                <span className="font-medium text-gray-900">{selectedType?.label}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Members</span>
                <span className="font-medium text-gray-900">{selectedIds.length} selected</span>
              </div>
              {form.notes && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Notes</span>
                  <span className="text-gray-700">{form.notes}</span>
                </div>
              )}
            </div>

            {/* Member list preview */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Members</p>
              <div className="space-y-1.5">
                {selectedMembers.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                    <span className="font-medium text-gray-900">{m.name}</span>
                    {m.area && <span className="text-gray-400 text-xs">· {m.area}</span>}
                    <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full ${CAT_COLORS[m.memberCategory] || 'bg-gray-100 text-gray-600'}`}>
                      {MEMBER_CATEGORIES[m.memberCategory]?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="border border-green-200 rounded-xl overflow-hidden">
              <div className="bg-green-50 px-4 py-2.5 flex items-center gap-2">
                <MessageCircle size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-green-800">Share on WhatsApp</span>
              </div>
              <div className="p-3 bg-white">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                  {whatsappMsg}
                </pre>
              </div>
              <div className="flex gap-2 px-3 pb-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  <MessageCircle size={14} /> Open WhatsApp
                </a>
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    whatsappCopied
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {whatsappCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <Check size={16} /> Create Drive
          </button>
        )}
        <button
          onClick={() => navigate('/dp-work')}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
