import { useEffect, useState } from 'react';
import { History, User, ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';

// ── Label helpers ─────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  PROSPECT: 'Prospect', DEFAULTER: 'Defaulter', SUPER_NEW: 'Super New',
  SEMI_ACTIVE: 'Semi Active', REGULAR_CONTRIBUTOR: 'Regular Contributor',
  ACTIVE_DP_WORKER: 'Active DP Worker',
};
const ISHTA_LABELS = {
  UNKNOWN: 'Unknown', NEW: 'New', IRREGULAR: 'Irregular',
  REGULAR: 'Regular', INACTIVE: 'Inactive', NOT_APPLICABLE: 'N/A',
};
const DP_STATUS_LABELS = {
  FW_PENDING: 'FW Pending', FW_SENT: 'FW Sent', FW_RECEIVED: 'FW Received',
  COMPLETED: 'Completed',
};

function friendlyValue(field, raw) {
  if (raw === null || raw === '' || raw === 'null') return '—';
  if (field === 'Member Category') return CATEGORY_LABELS[raw] || raw;
  if (field === 'Ishtabhrity Status') return ISHTA_LABELS[raw] || raw;
  if (field === 'DP Status') return DP_STATUS_LABELS[raw] || raw;
  if (raw === 'true') return 'Yes';
  if (raw === 'false') return 'No';
  return raw;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fullDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Event colour coding ───────────────────────────────────────────────────────
function eventStyle(entry) {
  if (entry.event === 'member_created') return { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' };
  if (entry.event === 'member_removed') return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' };
  if (entry.field === 'Member Category') return { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700' };
  if (entry.field === 'Ishtabhrity Status') return { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700' };
  return { dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600' };
}

// ── Single entry row ──────────────────────────────────────────────────────────
function AuditEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const style = eventStyle(entry);

  let title = '';
  if (entry.event === 'member_created') title = 'Member added';
  else if (entry.event === 'member_removed') title = 'Member removed';
  else title = entry.field;

  return (
    <div
      className="flex gap-3 cursor-pointer group"
      onClick={() => setExpanded(e => !e)}
    >
      {/* timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>

      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${style.badge}`}>
              {title}
            </span>

            {/* value change */}
            {entry.event === 'field_changed' && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700 flex-wrap">
                <span className="line-through text-gray-400 text-xs">
                  {friendlyValue(entry.field, entry.oldValue)}
                </span>
                <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                <span className="font-medium">
                  {friendlyValue(entry.field, entry.newValue)}
                </span>
              </div>
            )}
            {entry.event === 'member_created' && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Plus size={11} /> Added to system
              </div>
            )}
            {entry.event === 'member_removed' && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <Trash2 size={11} /> Removed from active list
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5" title={fullDate(entry.changedAt)}>
            {timeAgo(entry.changedAt)}
          </span>
        </div>

        {/* worker name */}
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <User size={10} />
          <span>{entry.changedByName}</span>
        </div>

        {/* expanded: full date */}
        {expanded && (
          <div className="mt-1.5 text-xs text-gray-400">{fullDate(entry.changedAt)}</div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AuditLog({ memberId, fetchAuditLog, compact = false }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    fetchAuditLog(memberId)
      .then(data => { setLog(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [memberId]);

  if (loading) return (
    <div className="flex items-center gap-2 py-6 justify-center text-gray-400">
      <Loader2 size={16} className="animate-spin" />
      <span className="text-sm">Loading history…</span>
    </div>
  );

  if (error) return (
    <div className="text-sm text-red-500 py-4 text-center">{error}</div>
  );

  if (!log || log.length === 0) return (
    <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
      <History size={28} strokeWidth={1.5} />
      <p className="text-sm">No changes recorded yet</p>
      <p className="text-xs text-center text-gray-300">Changes will appear here after the first edit</p>
    </div>
  );

  // In compact mode (edit page sidebar), show only last 20 entries
  const entries = compact ? log.slice(0, 20) : log;

  return (
    <div className={compact ? '' : 'space-y-0'}>
      {entries.map(entry => (
        <AuditEntry key={entry.id} entry={entry} />
      ))}
      {compact && log.length > 20 && (
        <p className="text-xs text-gray-400 text-center pt-1">
          +{log.length - 20} older entries — view in member profile
        </p>
      )}
    </div>
  );
}
