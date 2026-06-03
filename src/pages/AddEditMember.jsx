import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES, DP_STATUSES, ISHTABHRITY_STATUSES, SUKS } from '../constants';
import { ArrowLeft, Save } from 'lucide-react';

const BLANK = {
  name: '', contactNo: '', familyCode: '', guardianName: '', ritwikName: '',
  sukId: 'bngg', assignedTo: '',
  memberCategory: 'REGULAR_CONTRIBUTOR', dpStatus: 'FW_PENDING', ishtabhritiStatus: 'IRREGULAR',
  ishtabhritiStartDate: '',
  hasAsthan: false, isAdikshita: false,
  recentlyTookDikhya: false, playsHarmonium: false,
  spouseProspect: false, childrenProspect: false,
  interestedInSinging: false, canHelpInDPWork: false,
  sharesRoom: false, staysInPG: false,
  keepsPrayer: false, comesToSatsang: false,
  keepsBhadraSatsang: false, doesDPWork: false,
  goesToTemple: false, deogharkVisit: false,
  swastaini: false, newInBengaluru: false,
  profession: '',
  area: '', pinCode: '', permanentAddress: '', presentAddress: '', geoLocation: '',
};

const ISHTA_ELIGIBLE_STATUSES = ['REGULAR', 'IRREGULAR', 'NEW'];
const ISHTA_ELIGIBLE_CATEGORIES = ['ACTIVE_DP_WORKER', 'REGULAR_CONTRIBUTOR', 'SEMI_ACTIVE', 'SUPER_NEW'];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AddEditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { members, workers, createMember, editMember, currentSukId } = useApp();
  const existing = id ? members.find(m => m.id === id) : null;
  const isEdit = !!existing;

  // Pre-select category from ?precat= (set by the Add Member picker) or fallback to default
  const precatParam = searchParams.get('precat');
  const [form, setForm] = useState({
    ...BLANK,
    sukId: currentSukId,
    ...(precatParam && MEMBER_CATEGORIES[precatParam] ? { memberCategory: precatParam } : {}),
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'ok'|'err', msg }

  useEffect(() => { if (existing) setForm({ ...BLANK, ...existing }); }, [existing?.id]);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await editMember(id, form);
        showToast('ok', 'Changes saved successfully!');
        setTimeout(() => navigate(`/members/${id}`), 1200);
      } else {
        const m = await createMember(form);
        showToast('ok', `${form.name} added successfully!`);
        setTimeout(() => navigate(`/members/${m.id}`), 1200);
      }
    } catch (err) {
      showToast('err', err.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent";
  const sel = inp;

  return (
    <div className="max-w-2xl space-y-4">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all
          ${toast.type === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(isEdit ? `/members/${id}` : '/members')}
          className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? `Edit — ${existing?.name}` : 'Add New Member'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {/* Personal */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2"><Field label="Full Name" required><input value={form.name} onChange={set('name')} required placeholder="e.g. Ramesh Kumar" className={inp} /></Field></div>
            <Field label="Contact Number" required><input value={form.contactNo} onChange={set('contactNo')} required placeholder="9876543210" className={inp} /></Field>
            <Field label="Family Code"><input value={form.familyCode} onChange={set('familyCode')} placeholder="e.g. 022321293091" className={inp} /></Field>
            <Field label="Guardian Name"><input value={form.guardianName} onChange={set('guardianName')} placeholder="Father / Husband name" className={inp} /></Field>
            <Field label="Ritwik Name"><input value={form.ritwikName} onChange={set('ritwikName')} placeholder="Assigned Ritwik" className={inp} /></Field>
          </div>
        </div>

        {/* Classification */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SUK" required>
              <select value={form.sukId} onChange={set('sukId')} className={sel} required>
                {SUKS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Assigned To">
              <select value={form.assignedTo} onChange={set('assignedTo')} className={sel}>
                <option value="">Not assigned</option>
                {workers.filter(w => w.isActive !== false).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Member Category" required>
              <select value={form.memberCategory} onChange={set('memberCategory')} className={sel} required>
                {Object.entries(MEMBER_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="DP Status">
              <select value={form.dpStatus} onChange={set('dpStatus')} className={sel}>
                {Object.entries(DP_STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Ishtabhrity Status">
              <select value={form.ishtabhritiStatus} onChange={set('ishtabhritiStatus')} className={sel}>
                {Object.entries(ISHTABHRITY_STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            {ISHTA_ELIGIBLE_STATUSES.includes(form.ishtabhritiStatus) &&
             ISHTA_ELIGIBLE_CATEGORIES.includes(form.memberCategory) && (
              <Field label="Log Ishtabhriti Date">
                <input
                  type="date"
                  value={form.ishtabhritiStartDate || ''}
                  onChange={set('ishtabhritiStartDate')}
                  className={inp}
                  placeholder="Date of first Ishtabhrity"
                />
                <p className="text-xs text-gray-400 mt-1">The date they first sent Ishtabhrity — used to track the 30-day cycle</p>
              </Field>
            )}
          <Field label="Profession">
            <select value={form.profession} onChange={set('profession')} className={sel}>
              <option value="">— Select profession —</option>
              <option value="Govt Employee">Govt Employee</option>
              <option value="Private Employee">Private Employee</option>
              <option value="House Wife">House Wife</option>
              <option value="Cook">Cook</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Own Business">Own Business</option>
              <option value="Driver">Driver</option>
              <option value="Daily Wage Worker">Daily Wage Worker</option>
              <option value="Student">Student</option>
              <option value="Retired">Retired</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          </div>
          {/* Attributes checklist — 2-column grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Attributes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                { key: 'hasAsthan',           label: 'Has Thakur Asthan at home'  },
                { key: 'isAdikshita',          label: 'Adikshita (not yet initiated)' },
                { key: 'recentlyTookDikhya',   label: 'Recently Taken Dikhya'     },
                { key: 'playsHarmonium',       label: 'Plays Harmonium'            },
                { key: 'spouseProspect',       label: 'Spouse Prospect'            },
                { key: 'childrenProspect',     label: 'Children Prospect'          },
                { key: 'interestedInSinging',  label: 'Interested in Singing'      },
                { key: 'canHelpInDPWork',      label: 'Can help in DP Work'        },
                { key: 'sharesRoom',           label: 'Shares room with others'    },
                { key: 'staysInPG',            label: 'Stays in PG'                },
                { key: 'keepsPrayer',          label: 'Keeps Prayer'               },
                { key: 'comesToSatsang',       label: 'Comes to Satsang'           },
                { key: 'keepsBhadraSatsang',   label: 'Keeps Bhadra Satsang'       },
                { key: 'doesDPWork',           label: 'Does DP Work'               },
                { key: 'goesToTemple',         label: 'Goes to Temple'             },
                { key: 'deogharkVisit',        label: 'Deoghar Visit'              },
                { key: 'swastaini',            label: 'Swastaini'                  },
                { key: 'newInBengaluru',       label: 'New in Bengaluru'           },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={set(key)}
                    className="w-4 h-4 rounded accent-sky-600 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Area / Locality"><input value={form.area} onChange={set('area')} placeholder="e.g. Hulimavu" className={inp} /></Field>
            <Field label="PIN Code"><input value={form.pinCode} onChange={set('pinCode')} placeholder="560076" className={inp} /></Field>
            <div className="col-span-1 sm:col-span-2"><Field label="Present Address"><textarea value={form.presentAddress} onChange={set('presentAddress')} rows={2} placeholder="Current residential address" className={`${inp} resize-none`} /></Field></div>
            <div className="col-span-1 sm:col-span-2"><Field label="Permanent / Hometown Address"><textarea value={form.permanentAddress} onChange={set('permanentAddress')} rows={2} placeholder="Hometown or native address" className={`${inp} resize-none`} /></Field></div>
            <div className="col-span-1 sm:col-span-2"><Field label="Google Maps Location URL"><input value={form.geoLocation} onChange={set('geoLocation')} placeholder="Paste Google Maps link here" className={inp} /></Field></div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-5 flex gap-3">
          <button type="submit" disabled={saving || toast?.type === 'ok'}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {saving && !toast ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : <Save size={16} />}
            {saving && !toast ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
          </button>
          <button type="button" onClick={() => navigate(isEdit ? `/members/${id}` : '/members')}
            className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}