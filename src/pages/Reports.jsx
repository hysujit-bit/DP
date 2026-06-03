import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { MEMBER_CATEGORIES, ISHTABHRITY_STATUSES, SUKS } from '../constants';
import {
  BarChart2, Users, UserCheck, UserX, Calendar, IndianRupee,
  Download, FileSpreadsheet, FileText, Filter, ChevronDown,
  Activity, TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';

// ── Export helpers ──────────────────────────────────────────────────────────
async function exportToExcel(sheets, filename) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

async function exportToPDF(title, columns, rows, filename) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 22);
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save(`${filename}.pdf`);
}

// ── Small UI helpers ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'sky' }) {
  const colors = {
    sky:    'bg-sky-50 border-sky-100 text-sky-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    amber:  'bg-amber-50 border-amber-100 text-amber-700',
    red:    'bg-red-50 border-red-100 text-red-700',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

function ExportBar({ onExcel, onPDF, loading }) {
  return (
    <div className="flex gap-2 justify-end mb-4">
      <button onClick={onExcel} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
        <FileSpreadsheet size={13} /> Excel
      </button>
      <button onClick={onPDF} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
        <FileText size={13} /> PDF
      </button>
    </div>
  );
}

function Table({ columns, rows, emptyMsg = 'No data' }) {
  if (!rows.length) return (
    <div className="text-center py-10 text-gray-400 text-sm">{emptyMsg}</div>
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {columns.map(c => (
              <th key={c} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 text-gray-700 text-xs whitespace-nowrap">{cell ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Utility ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function catLabel(key) { return MEMBER_CATEGORIES[key]?.label || key; }
function ishaLabel(key) { return ISHTABHRITY_STATUSES[key]?.label || key; }
function sukName(id) { return SUKS.find(s => s.id === id)?.name || id; }

const MONTHS_BACK = 6;
function getLast6Months() {
  const months = [];
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// ════════════════════════════════════════════════════════════════════════════
// R1 — DP Worker Activity Report
// ════════════════════════════════════════════════════════════════════════════
function WorkerActivityReport({ workers, members, visits, payments, fetchWorkerAuditLog, scopeWorkerIds, isSuperAdmin, isAnyAdmin, currentUser }) {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [exporting, setExporting] = useState(false);

  const visibleWorkers = scopeWorkerIds
    ? workers.filter(w => scopeWorkerIds.includes(w.id))
    : workers;

  // For DP Worker role: lock to self
  const effectiveWorkerId = (!isAnyAdmin) ? currentUser?.workerId : (selectedWorker || visibleWorkers[0]?.id || '');

  useEffect(() => {
    if (!effectiveWorkerId) return;
    setLoadingAudit(true);
    fetchWorkerAuditLog(effectiveWorkerId)
      .then(data => { setAuditLog(data); setLoadingAudit(false); })
      .catch(() => setLoadingAudit(false));
  }, [effectiveWorkerId]);

  const worker = workers.find(w => w.id === effectiveWorkerId);
  const workerMembers = members.filter(m => m.assignedTo === effectiveWorkerId && m.isActive);
  const workerVisits = visits.filter(v => v.visitedBy === effectiveWorkerId);
  const workerPayments = payments.filter(p => p.recordedBy === effectiveWorkerId);

  const visitsByOutcome = workerVisits.reduce((acc, v) => {
    acc[v.outcome] = (acc[v.outcome] || 0) + 1;
    return acc;
  }, {});

  const membersByCategory = Object.keys(MEMBER_CATEGORIES).map(key => ({
    key, label: catLabel(key),
    count: workerMembers.filter(m => m.memberCategory === key).length,
  })).filter(x => x.count > 0);

  const memberRows = workerMembers.map(m => [
    m.name, catLabel(m.memberCategory), ishaLabel(m.ishtabhritiStatus),
    m.contactNo || '—', m.presentAddress || '—',
  ]);

  const visitRows = workerVisits.map(v => {
    const mem = members.find(m => m.id === v.personId);
    return [mem?.name || '—', v.outcome || '—', fmtDate(v.visitDate), v.notes?.slice(0, 60) || '—'];
  });

  const paymentRows = workerPayments.map(p => {
    const mem = members.find(m => m.id === p.personId);
    return [mem?.name || '—', p.monthCovered || '—', fmtDate(p.paymentDate), p.status || '—'];
  });

  const auditRows = auditLog.map(a => [
    a.memberName, a.event === 'member_created' ? 'Member Added' :
    a.event === 'member_removed' ? 'Member Removed' :
    `${a.field} changed`, a.oldValue || '—', a.newValue || '—', fmtDate(a.changedAt),
  ]);

  const handleExcel = async () => {
    setExporting(true);
    await exportToExcel([
      { name: 'Assigned Members', data: workerMembers.map(m => ({ Name: m.name, Category: catLabel(m.memberCategory), Ishtabhrity: ishaLabel(m.ishtabhritiStatus), Phone: m.contactNo, Address: m.presentAddress })) },
      { name: 'Visits Logged', data: workerVisits.map(v => { const mem = members.find(x => x.id === v.personId); return { Member: mem?.name, Outcome: v.outcome, Date: fmtDate(v.visitDate), Notes: v.notes }; }) },
      { name: 'Ishtabhrity Collected', data: workerPayments.map(p => { const mem = members.find(x => x.id === p.personId); return { Member: mem?.name, Month: p.monthCovered, Date: fmtDate(p.paymentDate), Status: p.status }; }) },
      { name: 'App Activity', data: auditLog.map(a => ({ Member: a.memberName, Action: a.event, Field: a.field, OldValue: a.oldValue, NewValue: a.newValue, Date: fmtDate(a.changedAt) })) },
    ], `Worker_Activity_${worker?.name?.replace(/\s/g,'_')}`);
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    await exportToPDF(
      `DP Worker Activity — ${worker?.name}`,
      ['Member', 'Category', 'Ishtabhrity', 'Phone', 'Address'],
      memberRows,
      `Worker_Activity_${worker?.name?.replace(/\s/g,'_')}`
    );
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Worker selector (admin only) */}
      {isAnyAdmin && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">DP Worker</label>
          <select value={effectiveWorkerId} onChange={e => setSelectedWorker(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            {visibleWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}

      {worker && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{worker.name}</h3>
              <p className="text-sm text-gray-500">Activity summary</p>
            </div>
            <ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Members Assigned" value={workerMembers.length} color="sky" />
            <StatCard label="Visits Logged" value={workerVisits.length} color="purple" />
            <StatCard label="Ishtabhrity Collected" value={workerPayments.length} color="green" />
            <StatCard label="App Actions" value={auditLog.length} color="amber" />
          </div>

          {/* Members by category */}
          {membersByCategory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Members by Category</h4>
              <div className="flex flex-wrap gap-2">
                {membersByCategory.map(({ label, count }) => (
                  <span key={label} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                    {label}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visit outcomes */}
          {Object.keys(visitsByOutcome).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Visit Outcomes</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(visitsByOutcome).map(([outcome, count]) => (
                  <span key={outcome} className="px-3 py-1 bg-sky-50 rounded-full text-xs text-sky-700">
                    {outcome}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned members table */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Assigned Members ({workerMembers.length})</h4>
            <Table columns={['Name', 'Category', 'Ishtabhrity', 'Phone', 'Address']} rows={memberRows} emptyMsg="No members assigned" />
          </div>

          {/* Recent visits */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Visits Logged ({workerVisits.length})</h4>
            <Table columns={['Member', 'Outcome', 'Date', 'Notes']} rows={visitRows.slice(0, 50)} emptyMsg="No visits logged" />
          </div>

          {/* App activity (audit) */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              App Activity — Changes Made {loadingAudit && <span className="text-xs font-normal text-gray-400 ml-2">loading…</span>}
            </h4>
            <Table columns={['Member', 'Action', 'Old Value', 'New Value', 'Date']} rows={auditRows.slice(0, 50)} emptyMsg="No recorded activity yet" />
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// R2 — Member Report by SUK & Category
// ════════════════════════════════════════════════════════════════════════════
function MemberCategoryReport({ members, scopeSukIds, isSuperAdmin }) {
  const [exporting, setExporting] = useState(false);
  const suks = isSuperAdmin ? SUKS : SUKS.filter(s => scopeSukIds?.includes(s.id));

  const data = useMemo(() => {
    return suks.map(suk => {
      const sukMembers = members.filter(m => m.sukId === suk.id && m.isActive);
      const byCategory = Object.keys(MEMBER_CATEGORIES).map(key => ({
        key, label: catLabel(key), count: sukMembers.filter(m => m.memberCategory === key).length,
      }));
      return { suk, total: sukMembers.length, byCategory, removed: members.filter(m => m.sukId === suk.id && !m.isActive).length };
    });
  }, [members, suks]);

  const allRows = members
    .filter(m => (isSuperAdmin || scopeSukIds?.includes(m.sukId)) && m.isActive)
    .map(m => [m.name, sukName(m.sukId), catLabel(m.memberCategory), ishaLabel(m.ishtabhritiStatus), m.contactNo || '—', fmtDate(m.createdAt)]);

  const handleExcel = async () => {
    setExporting(true);
    const sheets = data.map(({ suk, byCategory }) => ({
      name: suk.name,
      data: byCategory.map(c => ({ Category: c.label, Count: c.count })),
    }));
    sheets.push({ name: 'All Members', data: members.filter(m => (isSuperAdmin || scopeSukIds?.includes(m.sukId)) && m.isActive).map(m => ({ Name: m.name, SUK: sukName(m.sukId), Category: catLabel(m.memberCategory), Ishtabhrity: ishaLabel(m.ishtabhritiStatus), Phone: m.contactNo, Since: fmtDate(m.createdAt) })) });
    await exportToExcel(sheets, 'Member_Category_Report');
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    await exportToPDF('Member Report by Category', ['Name', 'SUK', 'Category', 'Ishtabhrity', 'Phone', 'Since'], allRows, 'Member_Category_Report');
    setExporting(false);
  };

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 mr-4">
          <StatCard label="Total Active Members" value={total} color="sky" />
          {data.map(({ suk, total: t }) => <StatCard key={suk.id} label={suk.name + ' SUK'} value={t} color="purple" />)}
        </div>
        <ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} />
      </div>

      {/* Per-SUK category breakdown */}
      {data.map(({ suk, total: t, byCategory, removed }) => (
        <div key={suk.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">{suk.name} SUK — {t} active members</h4>
            {removed > 0 && <span className="text-xs text-red-500">{removed} removed</span>}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {byCategory.map(({ label, count, key }) => (
              <div key={key} className="text-center p-2 rounded-lg bg-gray-50">
                <div className="text-xl font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Full member table */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">All Members ({allRows.length})</h4>
        <Table columns={['Name', 'SUK', 'Category', 'Ishtabhrity', 'Phone', 'Since']} rows={allRows} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// R3 — Member Report by Attributes
// ════════════════════════════════════════════════════════════════════════════
const ATTRIBUTES = [
  { key: 'hasAsthan',          label: 'Has Thakur Asthan'       },
  { key: 'isAdikshita',        label: 'Adikshita'               },
  { key: 'recentlyTookDikhya', label: 'Recently Took Dikhya'    },
  { key: 'playsHarmonium',     label: 'Plays Harmonium'         },
  { key: 'spouseProspect',     label: 'Spouse Prospect'         },
  { key: 'childrenProspect',   label: 'Children Prospect'       },
  { key: 'interestedInSinging',label: 'Interested in Singing'   },
  { key: 'canHelpInDPWork',    label: 'Can Help in DP Work'     },
  { key: 'sharesRoom',         label: 'Shares Room'             },
  { key: 'staysInPG',          label: 'Stays in PG'             },
  { key: 'keepsPrayer',        label: 'Keeps Prayer'            },
  { key: 'comesToSatsang',     label: 'Comes to Satsang'        },
  { key: 'keepsBhadraSatsang', label: 'Keeps Bhadra Satsang'    },
  { key: 'doesDPWork',         label: 'Does DP Work'            },
  { key: 'goesToTemple',       label: 'Goes to Temple'          },
  { key: 'deogharkVisit',      label: 'Deoghark Visit'          },
  { key: 'swastaini',          label: 'Swastaini'               },
  { key: 'newInBengaluru',     label: 'New in Bengaluru'        },
];

function AttributeReport({ members, workers, scopeSukIds, isSuperAdmin }) {
  const [selected, setSelected] = useState([]);
  const [matchAll, setMatchAll] = useState(true);
  const [exporting, setExporting] = useState(false);

  const scopeMembers = isSuperAdmin ? members.filter(m => m.isActive) : members.filter(m => m.isActive && scopeSukIds?.includes(m.sukId));

  const filtered = useMemo(() => {
    if (!selected.length) return scopeMembers;
    return scopeMembers.filter(m =>
      matchAll ? selected.every(attr => m[attr]) : selected.some(attr => m[attr])
    );
  }, [scopeMembers, selected, matchAll]);

  const tableRows = filtered.map(m => {
    const w = workers.find(x => x.id === m.assignedTo);
    return [m.name, sukName(m.sukId), catLabel(m.memberCategory), w?.name || 'Unassigned', m.contactNo || '—', selected.map(a => ATTRIBUTES.find(x => x.key === a)?.label).join(', ') || 'All'];
  });

  const toggle = (key) => setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);

  const handleExcel = async () => {
    setExporting(true);
    await exportToExcel([{ name: 'Attribute Filter', data: filtered.map(m => ({ Name: m.name, SUK: sukName(m.sukId), Category: catLabel(m.memberCategory), Assigned: workers.find(w => w.id === m.assignedTo)?.name || 'Unassigned', Phone: m.contactNo })) }], 'Member_Attribute_Report');
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    await exportToPDF(`Member Attribute Report — ${selected.length ? selected.map(a => ATTRIBUTES.find(x => x.key === a)?.label).join(', ') : 'All Members'}`, ['Name', 'SUK', 'Category', 'Assigned To', 'Phone'], tableRows.map(r => r.slice(0, 5)), 'Member_Attribute_Report');
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Filter by Attributes</h4>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Match:</span>
            <button onClick={() => setMatchAll(true)} className={`px-2 py-1 rounded-lg font-medium transition-colors ${matchAll ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
            <button onClick={() => setMatchAll(false)} className={`px-2 py-1 rounded-lg font-medium transition-colors ${!matchAll ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Any</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ATTRIBUTES.map(({ key, label }) => (
            <button key={key} onClick={() => toggle(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selected.includes(key)
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
              }`}>
              {label}
            </button>
          ))}
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">{filtered.length} member{filtered.length !== 1 ? 's' : ''} match</p>
        <ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} />
      </div>

      <Table columns={['Name', 'SUK', 'Category', 'Assigned To', 'Phone', 'Matched Attributes']} rows={tableRows} emptyMsg="No members match the selected filters" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// R4 — Unassigned Members
// ════════════════════════════════════════════════════════════════════════════
function UnassignedReport({ members, scopeSukIds, isSuperAdmin }) {
  const [exporting, setExporting] = useState(false);
  const unassigned = members.filter(m => m.isActive && !m.assignedTo && (isSuperAdmin || scopeSukIds?.includes(m.sukId)));
  const rows = unassigned.map(m => [m.name, sukName(m.sukId), catLabel(m.memberCategory), m.contactNo || '—', m.presentAddress || '—', fmtDate(m.createdAt)]);

  const handleExcel = async () => {
    setExporting(true);
    await exportToExcel([{ name: 'Unassigned Members', data: unassigned.map(m => ({ Name: m.name, SUK: sukName(m.sukId), Category: catLabel(m.memberCategory), Phone: m.contactNo, Address: m.presentAddress, Since: fmtDate(m.createdAt) })) }], 'Unassigned_Members');
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    await exportToPDF('Unassigned Members Report', ['Name', 'SUK', 'Category', 'Phone', 'Address', 'Since'], rows, 'Unassigned_Members');
    setExporting(false);
  };

  const bySuk = SUKS.filter(s => isSuperAdmin || scopeSukIds?.includes(s.id)).map(s => ({
    suk: s, count: unassigned.filter(m => m.sukId === s.id).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Unassigned" value={unassigned.length} color="red" />
          {bySuk.map(({ suk, count }) => <StatCard key={suk.id} label={suk.name} value={count} color="amber" />)}
        </div>
        <ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} />
      </div>
      <Table columns={['Name', 'SUK', 'Category', 'Phone', 'Address', 'Added On']} rows={rows} emptyMsg="All members are assigned" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// R5 — DP Workers Performance
// ════════════════════════════════════════════════════════════════════════════
function WorkersPerformanceReport({ workers, members, visits, payments, scopeWorkerIds, isAnyAdmin }) {
  const [exporting, setExporting] = useState(false);
  if (!isAnyAdmin) return <div className="text-center py-12 text-gray-400 text-sm">This report is available to Admins only.</div>;

  const visibleWorkers = scopeWorkerIds ? workers.filter(w => scopeWorkerIds.includes(w.id)) : workers;

  const workerStats = visibleWorkers.map(w => {
    const assigned = members.filter(m => m.assignedTo === w.id && m.isActive).length;
    const totalVisits = visits.filter(v => v.visitedBy === w.id).length;
    const totalIshta = payments.filter(p => p.recordedBy === w.id).length;
    const lastVisit = visits.filter(v => v.visitedBy === w.id).sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0];
    const dikhya = visits.filter(v => v.visitedBy === w.id && (v.outcome === 'Dikhya taken' || v.outcome === 'Took Dikhya')).length;
    return { w, assigned, totalVisits, totalIshta, lastVisit: lastVisit?.visitDate, dikhya };
  }).sort((a, b) => b.totalVisits - a.totalVisits);

  const rows = workerStats.map(({ w, assigned, totalVisits, totalIshta, lastVisit, dikhya }) => [
    w.name, assigned, totalVisits, totalIshta, dikhya, fmtDate(lastVisit),
  ]);

  const handleExcel = async () => {
    setExporting(true);
    await exportToExcel([{ name: 'Workers Performance', data: workerStats.map(({ w, assigned, totalVisits, totalIshta, dikhya, lastVisit }) => ({ Worker: w.name, 'Members Assigned': assigned, 'Visits Logged': totalVisits, 'Ishtabhrity Collected': totalIshta, 'Dikhya Facilitated': dikhya, 'Last Visit': fmtDate(lastVisit) })) }], 'Workers_Performance');
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    await exportToPDF('DP Workers Performance Report', ['Worker', 'Members', 'Visits', 'Ishtabhrity', 'Dikhya', 'Last Visit'], rows, 'Workers_Performance');
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} /></div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Worker', 'Members', 'Visits', 'Ishtabhrity', 'Dikhya', 'Last Visit'].map(c => (
                <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workerStats.map(({ w, assigned, totalVisits, totalIshta, dikhya, lastVisit }, i) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{w.name}</div>
                  <div className="text-xs text-gray-400">{w.email}</div>
                </td>
                <td className="px-4 py-3"><span className="font-semibold text-sky-700">{assigned}</span></td>
                <td className="px-4 py-3"><span className="font-semibold text-purple-700">{totalVisits}</span></td>
                <td className="px-4 py-3"><span className="font-semibold text-green-700">{totalIshta}</span></td>
                <td className="px-4 py-3"><span className="font-semibold text-amber-700">{dikhya}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(lastVisit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// R6 — DP Work Planner Report
// ════════════════════════════════════════════════════════════════════════════
function PlannerReport({ drives, members, scopeSukIds, isSuperAdmin }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  const scopeDrives = drives.filter(d => isSuperAdmin || scopeSukIds?.includes(d.sukId));
  const filtered = filterStatus === 'ALL' ? scopeDrives : scopeDrives.filter(d => d.status === filterStatus);

  const done = scopeDrives.filter(d => d.status === 'DONE').length;
  const upcoming = scopeDrives.filter(d => d.status === 'UPCOMING').length;
  const cancelled = scopeDrives.filter(d => d.status === 'CANCELLED').length;

  // Dikhya count
  const dikhyaCount = scopeDrives.reduce((sum, d) => {
    const retro = d.retrospect || {};
    return sum + Object.values(retro).filter(r => r?.tookDikhya).length;
  }, 0);

  // Monthly frequency
  const months = getLast6Months();
  const monthlyData = months.map(mo => ({
    month: mo, count: scopeDrives.filter(d => d.date?.startsWith(mo)).length,
  }));

  const rows = filtered.map(d => {
    const planned = (d.memberIds || []).length;
    const retro = d.retrospect || {};
    const met = Object.values(retro).filter(r => r?.outcome).length;
    const dikhya = Object.values(retro).filter(r => r?.tookDikhya).length;
    return [d.name || d.title || '—', sukName(d.sukId), fmtDate(d.date), d.status, planned, met, dikhya, d.driveType || '—'];
  });

  const handleExcel = async () => {
    setExporting(true);
    await exportToExcel([{
      name: 'Drives', data: filtered.map(d => {
        const retro = d.retrospect || {};
        const met = Object.values(retro).filter(r => r?.outcome).length;
        const dikhya = Object.values(retro).filter(r => r?.tookDikhya).length;
        return { Drive: d.name || d.title, SUK: sukName(d.sukId), Date: fmtDate(d.date), Status: d.status, Planned: (d.memberIds||[]).length, Met: met, Dikhya: dikhya, Type: d.driveType };
      }),
    }], 'DP_Planner_Report');
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    await exportToPDF('DP Work Planner Report', ['Drive', 'SUK', 'Date', 'Status', 'Planned', 'Met', 'Dikhya', 'Type'], rows, 'DP_Planner_Report');
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <StatCard label="Total Drives" value={scopeDrives.length} color="sky" />
          <StatCard label="Completed" value={done} color="green" />
          <StatCard label="Upcoming" value={upcoming} color="amber" />
          <StatCard label="Dikhya Outcomes" value={dikhyaCount} color="purple" />
        </div>
        <ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} />
      </div>

      {/* Monthly frequency */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Drive Frequency (Last 6 Months)</h4>
        <div className="flex items-end gap-3">
          {monthlyData.map(({ month, count }) => {
            const max = Math.max(...monthlyData.map(m => m.count), 1);
            const pct = Math.round((count / max) * 100);
            return (
              <div key={month} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-bold text-gray-700">{count}</span>
                <div className="w-full bg-gray-100 rounded-t-md" style={{ height: 60 }}>
                  <div className="bg-sky-400 rounded-t-md transition-all" style={{ height: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{month.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', 'UPCOMING', 'DONE', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
      </div>

      <Table columns={['Drive', 'SUK', 'Date', 'Status', 'Planned', 'Met', 'Dikhya', 'Type']} rows={rows} emptyMsg="No drives found" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// R7 — Ishtabhrity Tracker Report
// ════════════════════════════════════════════════════════════════════════════
function IshtabhritiReport({ members, payments, workers, scopeSukIds, isSuperAdmin, currentUser, isAnyAdmin }) {
  const [exporting, setExporting] = useState(false);
  const months = getLast6Months();

  const scopeMembers = (() => {
    const active = members.filter(m => m.isActive && m.ishtabhritiStatus !== 'NOT_APPLICABLE' && m.ishtabhritiStatus !== 'INACTIVE');
    if (isSuperAdmin) return active;
    if (isAnyAdmin) return active.filter(m => scopeSukIds?.includes(m.sukId));
    return active.filter(m => m.assignedTo === currentUser?.workerId);
  })();

  const memberRows = scopeMembers.map(m => {
    const mPayments = payments.filter(p => p.personId === m.id);
    const monthData = months.map(mo => {
      const sent = mPayments.some(p => p.monthCovered === mo);
      return sent ? '✓' : '✗';
    });
    const sentCount = months.filter(mo => mPayments.some(p => p.monthCovered === mo)).length;
    const w = workers.find(x => x.id === m.assignedTo);
    return {
      m, w, monthData, sentCount,
      rate: Math.round((sentCount / months.length) * 100),
    };
  }).sort((a, b) => b.sentCount - a.sentCount);

  const totalSent = memberRows.reduce((s, r) => s + r.sentCount, 0);
  const totalPossible = memberRows.length * months.length;
  const overallRate = totalPossible ? Math.round((totalSent / totalPossible) * 100) : 0;

  const handleExcel = async () => {
    setExporting(true);
    const data = memberRows.map(({ m, w, monthData, rate }) => {
      const row = { Name: m.name, SUK: sukName(m.sukId), 'Assigned To': w?.name || 'Unassigned', 'Collection Rate': `${rate}%` };
      months.forEach((mo, i) => { row[mo] = monthData[i]; });
      return row;
    });
    await exportToExcel([{ name: 'Ishtabhrity Report', data }], 'Ishtabhrity_Report');
    setExporting(false);
  };

  const handlePDF = async () => {
    setExporting(true);
    const cols = ['Name', 'Assigned To', ...months, 'Rate'];
    const rows = memberRows.map(({ m, w, monthData, rate }) => [m.name, w?.name || '—', ...monthData, `${rate}%`]);
    await exportToPDF('Ishtabhrity Tracker Report', cols, rows, 'Ishtabhrity_Report');
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Members Tracked" value={scopeMembers.length} color="sky" />
          <StatCard label="Overall Collection Rate" value={`${overallRate}%`} color={overallRate >= 75 ? 'green' : overallRate >= 50 ? 'amber' : 'red'} />
          <StatCard label="Total Sent (6 months)" value={totalSent} color="purple" />
        </div>
        <ExportBar onExcel={handleExcel} onPDF={handlePDF} loading={exporting} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase">Member</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase">Assigned To</th>
              {months.map(mo => <th key={mo} className="px-2 py-2.5 font-semibold text-gray-500 uppercase text-center">{mo.slice(5)}</th>)}
              <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {memberRows.map(({ m, w, monthData, rate }) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{m.name}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{w?.name || '—'}</td>
                {monthData.map((v, i) => (
                  <td key={i} className="px-2 py-2 text-center">
                    <span className={`font-bold ${v === '✓' ? 'text-green-600' : 'text-red-400'}`}>{v}</span>
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <span className={`font-semibold ${rate >= 75 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{rate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN — Reports Page
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'worker-activity',    label: 'Worker Activity',     icon: Activity,    roles: ['super_admin','suk_admin','dp_worker'] },
  { id: 'member-category',   label: 'By Category',         icon: Users,       roles: ['super_admin','suk_admin','dp_worker'] },
  { id: 'member-attributes', label: 'By Attributes',       icon: Filter,      roles: ['super_admin','suk_admin','dp_worker'] },
  { id: 'unassigned',        label: 'Unassigned',          icon: UserX,       roles: ['super_admin','suk_admin'] },
  { id: 'workers-perf',      label: 'Workers Performance', icon: TrendingUp,  roles: ['super_admin','suk_admin'] },
  { id: 'planner',           label: 'Planner',             icon: Calendar,    roles: ['super_admin','suk_admin','dp_worker'] },
  { id: 'ishtabhrity',       label: 'Ishtabhrity',         icon: IndianRupee, roles: ['super_admin','suk_admin','dp_worker'] },
];

export default function Reports() {
  const { user, members, workers, visits, payments, drives, currentSukId, isSuperAdmin, isSukAdmin, isAnyAdmin, fetchWorkerAuditLog } = useApp();
  const role = user?.role || 'dp_worker';

  const visibleTabs = TABS.filter(t => t.roles.includes(role));
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || 'worker-activity');

  // Scope: which SUKs and workers this user can see
  const scopeSukIds = isSuperAdmin ? null : [currentSukId];
  const scopeWorkerIds = isSuperAdmin
    ? null
    : isSukAdmin
      ? workers.filter(w => w.sukIds?.includes(currentSukId)).map(w => w.id)
      : [user?.workerId].filter(Boolean);

  const scopeMembers = isSuperAdmin ? members : members.filter(m => m.sukId === currentSukId);

  return (
    <div className="max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart2 size={22} className="text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">
            {isSuperAdmin ? 'All SUKs' : isSukAdmin ? `${SUKS.find(s => s.id === currentSukId)?.name} SUK` : 'My Activity'}
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto bg-white border border-gray-100 rounded-xl p-1">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === id
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'worker-activity' && (
          <WorkerActivityReport
            workers={workers} members={scopeMembers} visits={visits} payments={payments}
            fetchWorkerAuditLog={fetchWorkerAuditLog}
            scopeWorkerIds={scopeWorkerIds}
            isSuperAdmin={isSuperAdmin} isAnyAdmin={isAnyAdmin}
            currentUser={user}
          />
        )}
        {activeTab === 'member-category' && (
          <MemberCategoryReport
            members={scopeMembers}
            scopeSukIds={scopeSukIds}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === 'member-attributes' && (
          <AttributeReport
            members={scopeMembers} workers={workers}
            scopeSukIds={scopeSukIds} isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === 'unassigned' && (
          <UnassignedReport
            members={scopeMembers}
            scopeSukIds={scopeSukIds} isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === 'workers-perf' && (
          <WorkersPerformanceReport
            workers={workers} members={scopeMembers} visits={visits} payments={payments}
            scopeWorkerIds={scopeWorkerIds} isAnyAdmin={isAnyAdmin}
          />
        )}
        {activeTab === 'planner' && (
          <PlannerReport
            drives={drives} members={scopeMembers}
            scopeSukIds={scopeSukIds} isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === 'ishtabhrity' && (
          <IshtabhritiReport
            members={scopeMembers} payments={payments} workers={workers}
            scopeSukIds={scopeSukIds} isSuperAdmin={isSuperAdmin}
            currentUser={user} isAnyAdmin={isAnyAdmin}
          />
        )}
      </div>
    </div>
  );
}
