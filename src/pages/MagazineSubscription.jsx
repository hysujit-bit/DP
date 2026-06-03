import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  BookOpen, Plus, Trash2, Settings, X, Check, ChevronDown,
  Save, Loader2, FileSpreadsheet, FileText, RefreshCw
} from 'lucide-react';
import * as api from '../data/api';

// ── Cycle year helpers ────────────────────────────────────────────────────────
function currentCycleYear() {
  const now = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();
  return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function cycleYearLabel(cy) {
  const [s, e] = cy.split('-');
  return `Year ${s}–${e} (Jun to May)`;
}

function getPastYears(n = 5) {
  const current = currentCycleYear();
  const [startYear] = current.split('-').map(Number);
  const years = [];
  for (let i = 0; i < n; i++) {
    const y = startYear - i;
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

const MONTHS = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
const MONTH_KEYS = ['jun','jul','aug','sep','oct','nov','dec','jan','feb','mar','apr','may'];

// ── Export helpers ────────────────────────────────────────────────────────────
async function exportToExcel(magazines, subscriptions, year) {
  const XLSX = await import('xlsx');
  const headers = ['Member', ...magazines.map(m => `${m.name} (${m.language})`), 'Subscribed', 'Paid', ...MONTHS];
  const data = subscriptions.map(s => {
    const row = { Member: s.memberName };
    magazines.forEach(m => { row[`${m.name} (${m.language})`] = s.magazines.includes(m.id) ? 'Yes' : 'No'; });
    row.Subscribed = s.subscribed ? 'Yes' : 'No';
    row.Paid = s.paid ? 'Yes' : 'No';
    MONTH_KEYS.forEach((k, i) => { row[MONTHS[i]] = s.monthlyReceived?.[k] ? '✓' : ''; });
    return row;
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Subscriptions');
  XLSX.writeFile(wb, `Magazine_Subscription_${year}.xlsx`);
}

async function exportToPDF(magazines, subscriptions, year, sukName) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(13);
  doc.text(`Magazine Subscriptions — ${sukName} SUK`, 14, 16);
  doc.setFontSize(9);
  doc.text(`${cycleYearLabel(year)}   Generated: ${new Date().toLocaleString('en-IN')}`, 14, 22);
  const cols = ['Member', ...magazines.map(m => m.name), 'Sub', 'Paid', ...MONTHS];
  const rows = subscriptions.map(s => [
    s.memberName,
    ...magazines.map(m => s.magazines.includes(m.id) ? '✓' : ''),
    s.subscribed ? 'Yes' : 'No',
    s.paid ? 'Yes' : 'No',
    ...MONTH_KEYS.map(k => s.monthlyReceived?.[k] ? '✓' : ''),
  ]);
  doc.autoTable({ head: [cols], body: rows, startY: 28, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' } });
  doc.save(`Magazine_Subscription_${year}.pdf`);
}

// ── Manage Magazines Modal ────────────────────────────────────────────────────
function ManageMagazinesModal({ open, onClose, sukId, magazines, onRefresh }) {
  const [newName, setNewName] = useState('');
  const [newLang, setNewLang] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLang, setEditLang] = useState('');

  if (!open) return null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await api.addMagazineConfig({ sukId, name: newName.trim(), language: newLang.trim() });
    setNewName(''); setNewLang('');
    await onRefresh();
    setSaving(false);
  };

  const handleUpdate = async (id) => {
    await api.updateMagazineConfig(id, { name: editName, language: editLang });
    setEditId(null);
    await onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this magazine from the list?')) return;
    await api.deleteMagazineConfig(id);
    await onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Manage Magazines</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {magazines.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              {editId === m.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  <input value={editLang} onChange={e => setEditLang(e.target.value)} placeholder="Language" className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  <button onClick={() => handleUpdate(m.id)} className="p-1.5 bg-green-500 text-white rounded-lg"><Check size={14} /></button>
                  <button onClick={() => setEditId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"><X size={14} /></button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                    {m.language && <span className="text-xs text-gray-400 ml-1.5">({m.language})</span>}
                  </div>
                  <button onClick={() => { setEditId(m.id); setEditName(m.name); setEditLang(m.language || ''); }} className="text-xs text-sky-600 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-sky-50">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
                </>
              )}
            </div>
          ))}

          {/* Add new */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Magazine name" className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input value={newLang} onChange={e => setNewLang(e.target.value)} placeholder="Language" className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button onClick={handleAdd} disabled={saving || !newName.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Member Row Modal ──────────────────────────────────────────────────────
function AddMemberModal({ open, onClose, members, existingMemberIds, onAdd }) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  const available = members.filter(m => m.isActive && !existingMemberIds.includes(m.id));
  if (!open) return null;

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    await onAdd(selected);
    setSelected('');
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add Member to Subscription</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            <option value="">— Select a member —</option>
            {available.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {available.length === 0 && <p className="text-xs text-gray-400 text-center">All members in this SUK are already added.</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!selected || saving}
              className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Member
            </button>
            <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subscription Row ──────────────────────────────────────────────────────────
function SubRow({ sub, magazines, onUpdate, onDelete, readOnly, canManage }) {
  const [saving, setSaving] = useState(false);

  const toggle = async (field, value) => {
    if (readOnly) return;
    setSaving(true);
    await onUpdate(sub.id, { [field]: value });
    setSaving(false);
  };

  const toggleMag = async (magId) => {
    if (readOnly) return;
    const current = sub.magazines || [];
    const updated = current.includes(magId) ? current.filter(m => m !== magId) : [...current, magId];
    setSaving(true);
    await onUpdate(sub.id, { magazines: updated });
    setSaving(false);
  };

  const toggleMonth = async (key) => {
    if (readOnly) return;
    const current = sub.monthlyReceived || {};
    const updated = { ...current, [key]: !current[key] };
    setSaving(true);
    await onUpdate(sub.id, { monthlyReceived: updated });
    setSaving(false);
  };

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${saving ? 'opacity-60' : ''}`}>
      {/* Member name */}
      <td className="px-3 py-2 font-medium text-gray-900 text-sm whitespace-nowrap sticky left-0 bg-white border-r border-gray-100 min-w-[140px]">
        {sub.memberName}
        {canManage && (
          <button onClick={() => onDelete(sub.id)} className="ml-2 text-gray-300 hover:text-red-500 transition-colors align-middle">
            <Trash2 size={11} />
          </button>
        )}
      </td>

      {/* Magazine checkboxes */}
      {magazines.map(mag => (
        <td key={mag.id} className="px-2 py-2 text-center">
          <button
            onClick={() => toggleMag(mag.id)}
            disabled={readOnly}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
              sub.magazines?.includes(mag.id)
                ? 'bg-sky-500 border-sky-500 text-white'
                : 'border-gray-300 bg-white hover:border-sky-300'
            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
            {sub.magazines?.includes(mag.id) && <Check size={11} strokeWidth={3} />}
          </button>
        </td>
      ))}

      {/* Subscribed */}
      <td className="px-2 py-2 text-center">
        <button
          onClick={() => toggle('subscribed', !sub.subscribed)}
          disabled={readOnly}
          className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            sub.subscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}>
          {sub.subscribed ? 'Yes' : 'No'}
        </button>
      </td>

      {/* Paid */}
      <td className="px-2 py-2 text-center">
        <button
          onClick={() => toggle('paid', !sub.paid)}
          disabled={readOnly}
          className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            sub.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}>
          {sub.paid ? 'Yes' : 'No'}
        </button>
      </td>

      {/* Monthly received */}
      {MONTH_KEYS.map((key, i) => (
        <td key={key} className="px-1 py-2 text-center">
          <button
            onClick={() => toggleMonth(key)}
            disabled={readOnly}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
              sub.monthlyReceived?.[key]
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-200 bg-white hover:border-green-300'
            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
            {sub.monthlyReceived?.[key] && <Check size={11} strokeWidth={3} />}
          </button>
        </td>
      ))}
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MagazineSubscription() {
  const { members, currentSukId, isSukAdmin, isSuperAdmin, isAnyAdmin } = useApp();
  const readOnly = false;        // All users can mark checkboxes
  const canManage = isSukAdmin || isSuperAdmin; // Only admins can add members / manage magazines

  const [year, setYear] = useState(currentCycleYear());
  const [magazines, setMagazines] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManage, setShowManage] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [exporting, setExporting] = useState(false);

  const sukMembers = members.filter(m => m.sukId === currentSukId && m.isActive);
  const years = getPastYears(5);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [magConfig, subData] = await Promise.all([
        api.getMagazineConfig(currentSukId),
        api.getMagazineSubscriptions(currentSukId, year),
      ]);
      setMagazines(magConfig);
      setSubscriptions(subData.rows || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentSukId, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddMember = async (memberId) => {
    await api.upsertSubscription({ sukId: currentSukId, memberId, cycleYear: year });
    await loadData();
  };

  const handleUpdate = async (id, data) => {
    const updated = await api.updateSubscription(id, data);
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this member from the subscription list?')) return;
    await api.deleteSubscription(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleExcel = async () => {
    setExporting(true);
    const sukName = currentSukId.toUpperCase();
    await exportToExcel(magazines, subscriptions, year);
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    const sukName = currentSukId.toUpperCase();
    await exportToPDF(magazines, subscriptions, year, sukName);
    setExporting(false);
  };

  const subscribed = subscriptions.filter(s => s.subscribed).length;
  const paid = subscriptions.filter(s => s.paid).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-sky-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Magazine Subscriptions</h1>
            <p className="text-sm text-gray-500">{cycleYearLabel(year)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <select value={year} onChange={e => setYear(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            {years.map(y => <option key={y} value={y}>{cycleYearLabel(y)}</option>)}
          </select>

          {/* Manage magazines (Admin only) */}
          {canManage && (
            <button onClick={() => setShowManage(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Settings size={15} /> Magazines
            </button>
          )}

          {/* Export */}
          <button onClick={handleExcel} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl disabled:opacity-50">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={handlePDF} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl disabled:opacity-50">
            <FileText size={14} /> PDF
          </button>

          {/* Refresh */}
          <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-sky-700">{subscriptions.length}</div>
          <div className="text-xs text-sky-600 font-medium mt-0.5">Members</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{subscribed}</div>
          <div className="text-xs text-green-600 font-medium mt-0.5">Subscribed</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{paid}</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Paid</div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                {/* Top header row */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50 border-r border-gray-200 min-w-[140px]">
                    Member Name
                  </th>
                  <th colSpan={magazines.length} className="px-3 py-2 text-center text-xs font-semibold text-gray-500 border-r border-gray-200">
                    Magazines
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">Sub.</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 border-r border-gray-200">Paid</th>
                  <th colSpan={12} className="px-3 py-2 text-center text-xs font-semibold text-amber-700 bg-amber-50">
                    Collected (Book Received)
                  </th>
                </tr>
                {/* Sub-header */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 sticky left-0 bg-gray-50 border-r border-gray-200" />
                  {magazines.map(m => (
                    <th key={m.id} className="px-1 py-2 text-center font-medium text-gray-600 whitespace-nowrap text-[11px]">
                      <div>{m.name}</div>
                      {m.language && <div className="font-normal text-gray-400">({m.language})</div>}
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                  <th className="px-2 py-2 border-r border-gray-200" />
                  {MONTHS.map(mo => (
                    <th key={mo} className="px-1 py-2 text-center font-medium text-amber-600 whitespace-nowrap">{mo}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr><td colSpan={magazines.length + 15} className="text-center py-12 text-gray-400 text-sm">
                    {canManage ? 'No members added yet. Click "+ Add Member" to start.' : 'No subscriptions for this cycle.'}
                  </td></tr>
                ) : (
                  subscriptions.map(sub => (
                    <SubRow
                      key={sub.id} sub={sub} magazines={magazines}
                      onUpdate={handleUpdate} onDelete={handleDelete}
                      readOnly={readOnly} canManage={canManage}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add member button */}
          {canManage && (
            <div className="p-3 border-t border-gray-100">
              <button onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-sky-300 hover:text-sky-600 transition-colors w-full justify-center">
                <Plus size={15} /> Add Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ManageMagazinesModal
        open={showManage}
        onClose={() => setShowManage(false)}
        sukId={currentSukId}
        magazines={magazines}
        onRefresh={async () => {
          const updated = await api.getMagazineConfig(currentSukId);
          setMagazines(updated);
        }}
      />
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        members={sukMembers}
        existingMemberIds={subscriptions.map(s => s.memberId)}
        onAdd={handleAddMember}
      />
    </div>
  );
}
