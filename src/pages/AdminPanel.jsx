import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { RoleBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { SUKS, MEMBER_CATEGORIES } from '../constants';
import { UserPlus, Phone, Shield, Users, ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

const SUK_NAME = Object.fromEntries(SUKS.map(s => [s.id, s.name]));

function AddWorkerModal({ open, onClose, onSave, callerRole, callerSukId }) {
  const blank = { name:'', email:'', contactNo:'', role:'dp_worker', sukId:'bngg', primarySukId:'bngg', tempPassword:'' };
  const [form, setForm] = useState(blank);
  const [showPwd, setShowPwd] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // SUK admin can only add to their own SUK
  const availableSuks = callerRole === 'suk_admin'
    ? SUKS.filter(s => s.id === callerSukId)
    : SUKS;

  const handleSubmit = e => {
    e.preventDefault();
    onSave({
      name:         form.name.trim(),
      email:        form.email.trim(),
      phone:        form.contactNo.trim() || null,
      role:         form.role,
      sukIds:       [form.sukId],
      primarySukId: form.role === 'suk_admin' ? form.sukId : null,
      tempPassword: form.tempPassword,
    });
    onClose();
    setForm(blank);
    setShowPwd(false);
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";

  return (
    <Modal open={open} onClose={onClose} title="Add DP Worker" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Full Name</label>
          <input value={form.name} onChange={set('name')} required className={inp} placeholder="e.g. Anjali Singh" />
        </div>
        <div>
          <label className="label">Email (used to login)</label>
          <input type="email" value={form.email} onChange={set('email')} required className={inp} placeholder="anjali@dp.app" />
        </div>
        <div>
          <label className="label">Contact No.</label>
          <input value={form.contactNo} onChange={set('contactNo')} className={inp} placeholder="9876543210" />
        </div>

        {/* Role — SUK admin can only create dp_worker */}
        {callerRole === 'super_admin' && (
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={set('role')} className={inp}>
              <option value="dp_worker">DP Worker</option>
              <option value="suk_admin">SUK Admin</option>
            </select>
          </div>
        )}

        <div>
          <label className="label">{form.role === 'suk_admin' ? 'SUK (they will admin)' : 'SUK'}</label>
          <select value={form.sukId} onChange={set('sukId')} className={inp}>
            {availableSuks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Temp password */}
        <div>
          <label className="label">Temporary Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.tempPassword}
              onChange={set('tempPassword')}
              required
              minLength={6}
              className={`${inp} pr-10`}
              placeholder="At least 6 characters"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Worker will be prompted to change this in My Space after first login.</p>
        </div>

        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
          Add Worker & Create Login
        </button>
      </form>
    </Modal>
  );
}

function EditWorkerModal({ open, onClose, worker, onSave, callerRole }) {
  const [form, setForm] = useState({});
  const [showPwd, setShowPwd] = useState(false);

  // Correctly reset the form every time the modal opens with a (possibly different) worker
  useEffect(() => {
    if (open && worker) {
      setForm({
        name:        worker.name       || '',
        phone:       worker.phone      || '',
        role:        worker.role       || 'dp_worker',
        sukId:       worker.sukIds?.[0] || 'bngg',
        newPassword: '',
      });
      setShowPwd(false);
    }
  }, [open, worker]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";

  const handleSubmit = e => {
    e.preventDefault();
    const patch = {
      name:     form.name.trim(),
      phone:    form.phone.trim() || null,
      role:     form.role,
      sukIds:   [form.sukId],
    };
    if (form.newPassword && form.newPassword.length >= 6) patch.newPassword = form.newPassword;
    onSave(worker.id, patch);
    onClose();
  };

  if (!worker) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${worker.name}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Full Name</label>
          <input value={form.name || ''} onChange={set('name')} required className={inp} />
        </div>
        <div>
          <label className="label">Contact No.</label>
          <input value={form.phone || ''} onChange={set('phone')} className={inp} placeholder="9876543210" />
        </div>
        {callerRole === 'super_admin' && (
          <div>
            <label className="label">Role</label>
            <select value={form.role || 'dp_worker'} onChange={set('role')} className={inp}>
              <option value="dp_worker">DP Worker</option>
              <option value="suk_admin">SUK Admin</option>
            </select>
          </div>
        )}
        <div>
          <label className="label">Primary SUK</label>
          <select value={form.sukId || 'bngg'} onChange={set('sukId')} className={inp}>
            {SUKS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.newPassword || ''}
              onChange={set('newPassword')}
              minLength={6}
              className={`${inp} pr-10`}
              placeholder="At least 6 characters"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
          Save Changes
        </button>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ open, onClose, worker, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      await onConfirm(worker.id);
      onClose();
    } catch (e) {
      setDeleteErr(e.message || 'Delete failed. Please try again.');
      setDeleting(false);
    }
  };

  if (!worker) return null;
  return (
    <Modal open={open} onClose={() => { setDeleteErr(''); onClose(); }} title="Delete Worker" size="sm">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">⚠️ This action cannot be undone.</p>
          <p>Deleting <strong>{worker.name}</strong> will permanently remove their account and unassign all their members. Their visit history will be preserved.</p>
        </div>
        {deleteErr && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{deleteErr}</p>
        )}
        <div className="flex gap-3">
          <button onClick={() => { setDeleteErr(''); onClose(); }} disabled={deleting}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors">
            {deleting ? 'Deleting…' : 'Delete Worker'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPanel() {
  const { workers, members, user, isSuperAdmin, isSukAdmin, createWorker, editWorker, deleteWorker, editMember } = useApp();
  const [addWorkerOpen, setAddWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [deletingWorker, setDeletingWorker] = useState(null);
  const [assignOpen, setAssignOpen] = useState(true);
  const [assignFilter, setAssignFilter] = useState('ALL'); // ALL | UNASSIGNED | workerId

  const activeMembers = useMemo(() => members.filter(m => !m.isRemoved), [members]);
  const activeWorkers = useMemo(() => workers.filter(w => w.isActive !== false), [workers]);

  const filteredForAssign = useMemo(() => {
    if (assignFilter === 'UNASSIGNED') return activeMembers.filter(m => !m.assignedTo);
    if (assignFilter !== 'ALL') return activeMembers.filter(m => m.assignedTo === assignFilter);
    return activeMembers;
  }, [activeMembers, assignFilter]);

  const activeCount = members.filter(m => !m.isRemoved).length;
  const workerCount = workers.filter(w => w.isActive !== false).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500">Manage workers, SUKs, and application settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: activeCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          ...SUKS.map((s, i) => ({
            label: s.name,
            value: members.filter(m => !m.isRemoved && m.sukId === s.id).length,
            color: ['text-sky-700','text-purple-600','text-teal-600','text-orange-600'][i],
            bg:    ['bg-sky-50','bg-purple-50','bg-teal-50','bg-orange-50'][i],
          })),
          { label: 'DP Workers', value: workerCount, color: 'text-green-600', bg: 'bg-green-50' },
        ].slice(0, 4).map(s => (
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
              <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                {w.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{w.name}</span>
                  <RoleBadge role={w.role} />
                  {w.isActive === false && <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded-full">Inactive</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                  <span>{w.email}</span>
                  {w.phone && <span className="flex items-center gap-1"><Phone size={10}/>{w.phone}</span>}
                  <span>{w.sukIds?.map(id => SUK_NAME[id] || id).join(', ')}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Activate / Deactivate */}
                {w.isActive !== false ? (
                  <button onClick={() => editWorker(w.id, { isActive: false })}
                    title="Deactivate"
                    className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => editWorker(w.id, { isActive: true })}
                    title="Activate"
                    className="text-xs text-green-600 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 whitespace-nowrap">
                    Activate
                  </button>
                )}
                {/* Edit */}
                <button onClick={() => setEditingWorker(w)}
                  title="Edit"
                  className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                {/* Delete — super admin only, can't delete yourself */}
                {isSuperAdmin && w.id !== user?.workerId && (
                  <button onClick={() => setDeletingWorker(w)}
                    title="Delete"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {workers.length === 0 && (
            <div className="text-center py-6 text-sm text-gray-400">No workers in this SUK yet</div>
          )}
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

      {/* Add Worker Modal */}
      <AddWorkerModal
        open={addWorkerOpen}
        onClose={() => setAddWorker(false)}
        onSave={createWorker}
        callerRole={user?.role}
        callerSukId={user?.sukId}
      />

      {/* Edit Worker Modal */}
      <EditWorkerModal
        open={!!editingWorker}
        onClose={() => setEditingWorker(null)}
        worker={editingWorker}
        onSave={editWorker}
        callerRole={user?.role}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deletingWorker}
        onClose={() => setDeletingWorker(null)}
        worker={deletingWorker}
        onConfirm={deleteWorker}
      />
    </div>
  );
}
