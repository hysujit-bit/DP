import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../data/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dp_session');
    return saved ? JSON.parse(saved) : null;
  });

  // ── SUK selection ──────────────────────────────────────────────────────────
  const [currentSukId, setCurrentSukId] = useState(() => {
    return localStorage.getItem('dp_current_suk') || 'bngg';
  });

  // ── Data state ─────────────────────────────────────────────────────────────
  const [allMembers,  setAllMembers]  = useState([]);
  const [allWorkers,  setAllWorkers]  = useState([]);
  const [visits,      setVisits]      = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [allDrives,   setAllDrives]   = useState([]);

  // ── Loading / error ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Derived — filtered to active SUK ──────────────────────────────────────
  const members = useMemo(
    () => allMembers.filter(m => m.sukId === currentSukId),
    [allMembers, currentSukId]
  );
  const workers = useMemo(
    () => allWorkers.filter(w => w.sukIds?.includes(currentSukId)),
    [allWorkers, currentSukId]
  );
  const drives = useMemo(
    () => allDrives.filter(d => d.sukId === currentSukId),
    [allDrives, currentSukId]
  );

  // ── Refresh — re-fetch everything from the API ─────────────────────────────
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [m, w, v, p, d] = await Promise.all([
        api.getMembers(currentSukId, true), // include removed so restore works
        api.getWorkers(),
        api.getVisits(currentSukId),
        api.getPayments(currentSukId),
        api.getDrives(currentSukId),
      ]);
      setAllMembers(m);
      setAllWorkers(w);
      setVisits(v);
      setPayments(p);
      setAllDrives(d);
    } catch (e) {
      console.error('refresh failed', e);
      setError(e.message);
    }
  }, [user, currentSukId]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  // ── SUK switch ─────────────────────────────────────────────────────────────
  const switchSuk = (sukId) => {
    localStorage.setItem('dp_current_suk', sukId);
    setCurrentSukId(sukId);
  };

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setLoading(true);
      const userData = await api.login(email, password);
      const session  = { id: userData.id, email: userData.email, role: userData.role, name: userData.name };
      localStorage.setItem('dp_session', JSON.stringify(session));
      setUser(session);

      // Non-admin: lock to their first SUK
      if (userData.role !== 'ADMIN') {
        const workers = await api.getWorkers();
        const me = workers.find(w => w.id === userData.workerId);
        const defaultSuk = me?.sukIds?.[0] || 'bngg';
        localStorage.setItem('dp_current_suk', defaultSuk);
        setCurrentSukId(defaultSuk);
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Invalid email or password' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('dp_session');
    setUser(null);
    setAllMembers([]);
    setVisits([]);
    setPayments([]);
    setAllDrives([]);
  };

  // ── Members ────────────────────────────────────────────────────────────────
  const createMember = (data) => {
    api.createMember({ sukId: currentSukId, ...data }).then(refresh).catch(e => setError(e.message));
  };
  const editMember = (id, data) => {
    api.updateMember(id, data).then(refresh).catch(e => setError(e.message));
  };
  const deleteMember = (id, reason) => {
    api.removeMember(id, reason).then(refresh).catch(e => setError(e.message));
  };
  const bringBack = (id) => {
    api.restoreMember(id).then(refresh).catch(e => setError(e.message));
  };

  // ── Visits ─────────────────────────────────────────────────────────────────
  const logVisit = (data) => {
    api.addVisit(data).then(refresh).catch(e => setError(e.message));
  };
  const editVisit = (id, patch) => {
    api.updateVisit(id, patch).then(refresh).catch(e => setError(e.message));
  };

  // ── Payments ───────────────────────────────────────────────────────────────
  const recordPayment = (data) => {
    api.addPayment(data).then(refresh).catch(e => setError(e.message));
  };

  // ── Workers ────────────────────────────────────────────────────────────────
  const createWorker = (data) => {
    api.createWorker(data).then(refresh).catch(e => setError(e.message));
  };
  const editWorker = (id, data) => {
    api.updateWorker(id, data).then(refresh).catch(e => setError(e.message));
  };

  // ── Drives ─────────────────────────────────────────────────────────────────
  const createDrive = (data) => {
    api.addDrive({ sukId: currentSukId, ...data }).then(refresh).catch(e => setError(e.message));
  };
  const editDrive = (id, data) => {
    api.updateDrive(id, data).then(refresh).catch(e => setError(e.message));
  };
  const removeDrive = (id) => {
    api.deleteDrive(id).then(refresh).catch(e => setError(e.message));
  };

  return (
    <AppContext.Provider value={{
      user, login, logout,
      currentSukId, switchSuk,
      members, workers, visits, payments, drives,
      loading, error,
      createMember, editMember, deleteMember, bringBack,
      logVisit, editVisit, recordPayment,
      createWorker, editWorker,
      createDrive, editDrive, removeDrive,
      refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
