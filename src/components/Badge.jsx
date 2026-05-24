import { MEMBER_CATEGORIES, DP_STATUSES, ISHTABHRITY_STATUSES } from '../constants';

export function CategoryBadge({ category }) {
  const c = MEMBER_CATEGORIES[category];
  if (!c) return null;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

export function DPStatusBadge({ status }) {
  const s = DP_STATUSES[status];
  if (!s) return null;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

export function IshtabhritiStatusBadge({ status }) {
  const s = ISHTABHRITY_STATUSES[status];
  if (!s) return null;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', cls: 'bg-purple-100 text-purple-800' },
  suk_admin:   { label: 'SUK Admin',   cls: 'bg-amber-100 text-amber-800'  },
  dp_worker:   { label: 'DP Worker',   cls: 'bg-sky-100 text-sky-800'      },
  // legacy fallbacks
  ADMIN:       { label: 'Admin',       cls: 'bg-purple-100 text-purple-800' },
  SATSANGEE:   { label: 'DP Worker',   cls: 'bg-sky-100 text-sky-800'      },
};

export function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || { label: role || 'Worker', cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
