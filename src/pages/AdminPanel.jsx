import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { RoleBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { SUKS, MEMBER_CATEGORIES } from '../constants';
import { UserPlus, RefreshCw, Database, Phone, Shield, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { resetData } from '../data/storage';

function AddWorkerModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name:'', email:'', contactNo:'', role:'SATSANGEE', sukIds:['bngg'], areas:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = e => {
    e.preventDefault();
    onSave({ ...form, sukIds: [form.sukIds].flat(), areas: form.areas.split(',').map(a=>a.trim()).filter(Boolean) });
    onClose();
    setForm({ name:'', email:'', contactNo:'', role:'SATSANGEE', sukIds:['bngg'], areas:'' });
  };
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";
  return (
    <Modal open={open} onClose={onClose} title="Add DP Worker" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><label className="label">Name</label><input value={form.name} onChange={set('name')} required className={inp} /></div>
        <div><label className="label">Email</label><input type="email" value={form.email} onChange={set('email')} required className={inp} /></div>
        <div><label className="label">Contact No.</label><input value={form.contactNo} onChange={set('contactNo')} className={inp} /></div>
        <div><label className="label">Role</label>
          <select value={form.role} onChange={set('role')} className={inp}>
            <option value="SATSANGEE">Satsangee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div><label className="label">SUK</label>
          <select value={form.sukIds} onChange={set('sukIds')} className={inp}>
            {SUKS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label">Areas (comma separated)</label><input value={form.areas} onChange={set('areas')} placeholder="Hulimavu, HSR Layout" className={inp} /></div>
        <p className="text-xs text-sky-700 bg-sky-50 p-2 rounded-lg">💡 Default password: satsangee123</p>
        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-700 text-white font-semibold py-2 rounded-xl">Add Worker</button>
      </form>
    </Modal>
  );
}

export default function AdminPanel() {
  const { workers, members, createWorker, editWorker, editMember, refresh } = useApp();
  const [addWorkerOpen, setAddWorker] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [assignOpen, setAssignOpen] = useState(true);
  const [assignFilter, setAssignFilter] = useState('ALL'); // ALL | UNASSIGNED | workerId

  const activeMembers = useMemo(() => members.filter(m => !m.isRemoved), [members]);
  const activeWorkers = useMemo(() => workers.filter(w => w.isActive !== false), [workers]);

  const filteredForAssign = useMemo(() => {
    if (assignFilter === 'UNASSIGNED') return activeMembers.filter(m => !m.assignedTo);
    if (assignFilter !== 'ALL') return activeMembers.filter(m => m.assignedTo === assignFilter);
    return activeMembers;
  }, [activeMembers, assignFilter]);

  const stats = {
    total: members.filter(m => !m.isRemoved).length,
    removed: members.filter(m => m.isRemoved).length,
    bngg: members.filter(m => !m.isRemoved && m.sukId === 'bngg').length,
    bnas: members.filter(m => !m.isRemoved && m.sukId === 'bnas').length,
  };

  const handleReset = () => {
    resetData();
    refresh();
    setConfirmReset(false);
    alert('Demo data has been reset!');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500">Manage workers, SUKs, and application settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Members',     value: stats.total,   color: 'text-blue-600',   bg: 'bg-blue-50'  },
          { label: 'Bannerghatta',      value: stats.bngg,    color: 'text-sky-700', bg: 'bg-sky-50'},
          { label: 'Banashankari',      value: stats.bnas,    color: 'text-purple-600', bg: 'bg-purple-50'},
          { label: 'DP Workers',        value: workers.filter(w=>w.isActive!==false).length, color: 'text-green-600', bg: 'bg-green-50'},
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Workers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-sky-500" />
            <h2 className="font-semibold text-gray-900">DP Workers</h2>
          </div>
          <button onClick={() => setAddWorker(true)}
            className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <UserPlus size={14} /> Add Worker
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {workers.map(w => (
            <div key={w.id} className={`flex items-center gap-3 px-5 py-3 ${w.isActive === false ? 'opacity-50' : ''}`}>
              <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-sm">
                {w.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{w.name}</span>
                  <RoleBadge role={w.role} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>{w.email}</span>
                  {w.contactNo && <span className="flex items-center gap-1"><Phone size={10}/>{w.contactNo}</span>}
                  <span>{w.sukIds?.map(s => s === 'bngg' ? 'Bannerghatta' : 'Banashankari').join(', ')}</span>
                </div>
              </div>
              {w.isActive !== false && (
                <button onClick={() => editWorker(w.id, { isActive: false })}
                  className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2 py-1 rounded-lg transition-colors">
                  Deactivate
                </button>
              )}
              {w.isActive === false && (
                <button onClick={() => editWorker(w.id, { isActive: true })}
                  className="text-xs text-green-600 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50">
                  Activate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Member Assignments */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setAssignOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900">Member Assignments</h2>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {activeMembers.filter(m => !m.assignedTo).length} unassigned
            </span>
          </div>
          {assignOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </button>

        {assignOpen && (
          <div>
            {/* Filter chips */}
            <div className="flex gap-2 flex-wrap px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              {[
                { key: 'ALL',        label: `All (${activeMembers.length})` },
                { key: 'UNASSIGNED', label: `Unassigned (${activeMembers.filter(m => !m.assignedTo).length})` },
                ...activeWorkers.map(w => ({ key: w.id, label: `${w.name.split(' ')[0]} (${activeMembers.filter(m => m.assignedTo === w.id).length})` })),
              ].map(f => (
                <button key={f.key} onClick={() => setAssignFilter(f.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    assignFilter === f.key
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Member rows */}
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {filteredForAssign.map(m => {
                const cat = MEMBER_CATEGORIES[m.memberCategory];
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate block">{m.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${cat?.bg} ${cat?.text}`}>{cat?.label}</span>
                    </div>
                    <select
                      value={m.assignedTo || ''}
                      onChange={e => editMember(m.id, { assignedTo: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 max-w-[130px]"
                    >
                      <option value="">— Unassigned —</option>
                      {activeWorkers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
              {filteredForAssign.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400">No members match this filter</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-red-50">
          <Database size={16} className="text-red-500" />
          <h2 className="font-semibold text-red-700">Data Management</h2>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">Reset all data back to the original demo dataset. Use this if you want to start fresh with demo data.</p>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)}
              className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm px-4 py-2 rounded-xl transition-colors">
              <RefreshCw size={14} /> Reset to Demo Data
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-700 font-medium">Are you sure? This will erase all changes.</p>
              <div className="flex gap-2">
                <button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg">Yes, Reset</button>
                <button onClick={() => setConfirmReset(false)} className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddWorkerModal open={addWorkerOpen} onClose={() => setAddWorker(false)} onSave={createWorker} />
    </div>
  );
}
