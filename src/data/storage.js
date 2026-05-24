import { MOCK_MEMBERS, MOCK_WORKERS, MOCK_VISITS, MOCK_PAYMENTS } from './mockData';

const KEYS = {
  MEMBERS:  'dp_members',
  WORKERS:  'dp_workers',
  VISITS:   'dp_visits',
  PAYMENTS: 'dp_payments',
  DRIVES:   'dp_drives',
  INITIALIZED: 'dp_initialized_v3', // bump version to reload mock data
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function initializeData() {
  if (!localStorage.getItem(KEYS.INITIALIZED)) {
    localStorage.setItem(KEYS.MEMBERS,  JSON.stringify(MOCK_MEMBERS));
    localStorage.setItem(KEYS.WORKERS,  JSON.stringify(MOCK_WORKERS));
    localStorage.setItem(KEYS.VISITS,   JSON.stringify(MOCK_VISITS));
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(MOCK_PAYMENTS));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  }
}

export function resetData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  initializeData();
}

// ---- Members ----
export function getMembers()          { return JSON.parse(localStorage.getItem(KEYS.MEMBERS)  || '[]'); }
export function getMember(id)         { return getMembers().find(m => m.id === id); }
export function addMember(data) {
  const members = getMembers();
  const member = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0], isRemoved: false };
  members.push(member);
  localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  return member;
}
export function updateMember(id, data) {
  const members = getMembers().map(m => m.id === id ? { ...m, ...data } : m);
  localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  return members.find(m => m.id === id);
}
export function removeMember(id, reason) {
  return updateMember(id, { isRemoved: true, removedAt: new Date().toISOString().split('T')[0], removedReason: reason });
}
export function restoreMember(id) {
  return updateMember(id, { isRemoved: false, removedAt: null, removedReason: null });
}

// ---- Workers ----
export function getWorkers()         { return JSON.parse(localStorage.getItem(KEYS.WORKERS)  || '[]'); }
export function getWorker(id)        { return getWorkers().find(w => w.id === id); }
export function addWorker(data) {
  const workers = getWorkers();
  const worker = { ...data, id: generateId(), isActive: true };
  workers.push(worker);
  localStorage.setItem(KEYS.WORKERS, JSON.stringify(workers));
  return worker;
}
export function updateWorker(id, data) {
  const workers = getWorkers().map(w => w.id === id ? { ...w, ...data } : w);
  localStorage.setItem(KEYS.WORKERS, JSON.stringify(workers));
}

// ---- Visit Logs ----
export function getVisits(personId)  { return JSON.parse(localStorage.getItem(KEYS.VISITS) || '[]').filter(v => v.personId === personId); }
export function getAllVisits()        { return JSON.parse(localStorage.getItem(KEYS.VISITS) || '[]'); }
export function addVisit(data) {
  const visits = JSON.parse(localStorage.getItem(KEYS.VISITS) || '[]');
  const visit = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
  visits.push(visit);
  localStorage.setItem(KEYS.VISITS, JSON.stringify(visits));
  updateMember(data.personId, { lastVisitDate: data.visitDate });
  return visit;
}
export function updateVisit(id, patch) {
  const visits = JSON.parse(localStorage.getItem(KEYS.VISITS) || '[]');
  const idx = visits.findIndex(v => v.id === id);
  if (idx === -1) return null;
  visits[idx] = { ...visits[idx], ...patch };
  localStorage.setItem(KEYS.VISITS, JSON.stringify(visits));
  return visits[idx];
}

// ---- DP Drives ----
export function getDrives()       { return JSON.parse(localStorage.getItem(KEYS.DRIVES) || '[]'); }
export function getDrive(id)      { return getDrives().find(d => d.id === id); }
export function addDrive(data) {
  const drives = getDrives();
  const drive = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0], retrospect: {} };
  drives.push(drive);
  localStorage.setItem(KEYS.DRIVES, JSON.stringify(drives));
  return drive;
}
export function updateDrive(id, data) {
  const drives = getDrives().map(d => d.id === id ? { ...d, ...data } : d);
  localStorage.setItem(KEYS.DRIVES, JSON.stringify(drives));
  return drives.find(d => d.id === id);
}
export function deleteDrive(id) {
  const drives = getDrives().filter(d => d.id !== id);
  localStorage.setItem(KEYS.DRIVES, JSON.stringify(drives));
}

// ---- Ishtabhrity Payments ----
export function getPayments(personId) { return JSON.parse(localStorage.getItem(KEYS.PAYMENTS) || '[]').filter(p => p.personId === personId); }
export function getAllPayments()       { return JSON.parse(localStorage.getItem(KEYS.PAYMENTS) || '[]'); }
export function addPayment(data) {
  const payments = JSON.parse(localStorage.getItem(KEYS.PAYMENTS) || '[]');
  const payment = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
  payments.push(payment);
  localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  return payment;
}
