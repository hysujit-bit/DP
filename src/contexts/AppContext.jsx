import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../data/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dp_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentSukId, setCurrentSukId] = useState(() => {
    return localStorage.getItem('dp_current_suk') || 'bngg';
  });
  const [allMembers,  setAllMembers]  = useState([]);
  const [allWorkers,  setAllWorkers]  = useState([]);
  const [visits,      setVisits]      = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [allDrives,   setAllDrives]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

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

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [m, w, v, p, d] = await Promise.all([
        api.getMembers(currentSukId, true),
        api.getWorkers(),
        api.getVisits(currentSukId),
        api.getPayments(currentSukId),
        api.getDrives(currentSukId),
      ]);
      setAllMembers(m);
      setAllWorkers(w);
      setVisits(v);
      setPayments(p);
      setAllDrives(d.map(dr => ({ ...dr, name: dr.name ?? dr.title })));
    } catch (e) {
      console.error('refresh failed', e);
      setError(e.message);
    }
  }, [user, currentSukId]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const switchSuk = (sukId) => {
    localStorage.setItem('dp_current_suk', sukId);
    setCurrentSukId(sukId);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const userData = await api.login(email, password);
      const session  = {
        id:       userData.id,
        email:    userData.email,
        role:     userData.role,
        name:     userData.name,
        workerId: userData.workerId,
        sukId:    userData.sukId,
      };
      localStorage.setItem('dp_session', JSON.stringify(session));
      setUser(session);
      if (userData.role === 'suk_admin' && userData.sukId) {
        localStorage.setItem('dp_current_suk', userData.sukId);
        setCurrentSukId(userData.sukId);
      } else if (userData.role === 'dp_worker') {
        const allWorkers = await api.getWorkers();
        const me = allWorkers.find(w => w.id === userData.workerId);
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

  const createMember = async (data) => {
    const member = await api.createMember({ sukId: currentSukId, ...data, changedBy: user?.workerId || null });
    refresh().catch(e => setError(e.message));
    return member;
  };
  const editMember = async (id, data) => {
    await api.updateMember(id, { ...data, changedBy: user?.workerId || null });
    refresh().catch(e => setError(e.message));
  };
  const deleteMember = (id, reason) => {
    api.removeMember(id, reason, user?.workerId || null).then(refresh).catch(e => setError(e.message));
  };
  const fetchAuditLog = (memberId) => api.getAuditLog(memberId);
  const fetchWorkerAuditLog = (workerId) => api.getWorkerAuditLog(workerId);
  const fetchSukAuditLog = (sukId) => api.getSukAuditLog(sukId);
  const bringBack = (id) => {
    api.restoreMember(id).then(refresh).catch(e => setError(e.message));
  };

  const logVisit = async (data) => {
    const visit = await api.addVisit(data);
    refresh().catch(e => setError(e.message));
    return visit;
  };
  const editVisit = (id, patch) => {
    api.updateVisit(id, patch).then(refresh).catch(e => setError(e.message));
  };

  const recordPayment = (data) => {
    api.addPayment(data).then(refresh).catch(e => setError(e.message));
  };
  const deletePayment = (id) => {
    api.deletePayment(id).then(refresh).catch(e => setError(e.message));
  };

  const createWorker = (data) => {
    api.createWorker(data).then(refresh).catch(e => setError(e.message));
  };
  const editWorker = (id, data) => {
    api.updateWorker(id, data).then(() => {
      if (id === user?.workerId && data.name) {
        const updated = { ...user, name: data.name };
        localStorage.setItem('dp_session', JSON.stringify(updated));
        setUser(updated);
      }
      return refresh();
    }).catch(e => setError(e.message));
  };
  const deleteWorker = async (id) => {
    await api.deleteWorker(id);
    await refresh();
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.changePassword(currentPassword, newPassword);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const createDrive = async (data) => {
    const drive = await api.addDrive({ sukId: currentSukId, ...data });
    refresh().catch(e => setError(e.message));
    return { ...drive, name: drive.name ?? drive.title };
  };
  const editDrive = (id, data) => {
    api.updateDrive(id, data).then(refresh).catch(e => setError(e.message));
  };
  const removeDrive = (id) => {
    api.deleteDrive(id).then(refresh).catch(e => setError(e.message));
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isSukAdmin   = user?.role === 'suk_admin';
  const isAnyAdmin   = isSuperAdmin || isSukAdmin;

  return (
    <AppContext.Provider value={{
      user, login, logout,
      isSuperAdmin, isSukAdmin, isAnyAdmin,
      currentSukId, switchSuk,
      members, workers, visits, payments, drives,
      loading, error,
      createMember, editMember, deleteMember, bringBack, fetchAuditLog, fetchWorkerAuditLog, fetchSukAuditLog,
      logVisit, editVisit, recordPayment, deletePayment,
      createWorker, editWorker, deleteWorker, changePassword,
      createDrive, editDrive, removeDrive,
      refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
