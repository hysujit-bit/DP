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

export function RoleBadge({ role }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
    role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
  }`}>{role}</span>;
}
