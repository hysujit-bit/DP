import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, PlusCircle, Filter, Phone, MapPin, ChevronRight } from 'lucide-react';
import { CategoryBadge, DPStatusBadge, IshtabhritiStatusBadge } from '../components/Badge';
import { MEMBER_CATEGORIES, DP_STATUSES, ISHTABHRITY_STATUSES } from '../constants';
import { SUKS } from '../constants';

export default function MembersList() {
  const { members } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch]       = useState('');
  const [catFilter, setCat]       = useState(() => searchParams.get('cat') || '');
  const [sukFilter, setSuk]       = useState('');
  const [dpFilter, setDp]         = useState('');
  const [ishFilter, setIsh]       = useState('');
  const [showRemoved, setShowRm]  = useState(false);
  const [ivFilter, setIv]         = useState('');
  const [showFilters, setShowF]   = useState(() => !!searchParams.get('cat'));

  // Sync cat filter when sidebar category link changes
  useEffect(() => {
    const cat = searchParams.get('cat') || '';
    setCat(cat);
    if (cat) setShowF(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return members
      .filter(m => showRemoved ? m.isRemoved : !m.isRemoved)
      .filter(m => {
        const q = search.toLowerCase();
        return !q || m.name.toLowerCase().includes(q) || m.contactNo?.includes(q) || m.familyCode?.includes(q) || m.area?.toLowerCase().includes(q);
      })
      .filter(m => !catFilter || m.memberCategory === catFilter)
      .filter(m => !sukFilter || m.sukId === sukFilter)
      .filter(m => !dpFilter  || m.dpStatus === dpFilter)
      .filter(m => !ishFilter || m.ishtabhritiStatus === ishFilter)
      .filter(m => {
        if (!ivFilter) return true;
        if (ivFilter === 'online') return m.ivOnline === true;
        if (ivFilter === 'offline') return m.ivOnline === false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, search, catFilter, sukFilter, dpFilter, ishFilter, ivFilter, showRemoved]);

  const filtersActive = !!(catFilter || sukFilter || dpFilter || ishFilter);

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {members.filter(m => !m.isRemoved).length} members</p>
        </div>
        <button onClick={() => navigate('/members/new')}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <PlusCircle size={16} /> Add
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, area…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <button onClick={() => setShowF(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
            filtersActive ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          <Filter size={15} /> {filtersActive ? 'Filtered' : 'Filter'}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Category',    value: catFilter, set: setCat, opts: Object.entries(MEMBER_CATEGORIES).map(([k,v]) => ({ val: k, label: v.label })) },
            { label: 'SUK',         value: sukFilter, set: setSuk, opts: SUKS.map(s => ({ val: s.id, label: s.name })) },
            { label: 'DP Status',   value: dpFilter,  set: setDp,  opts: Object.entries(DP_STATUSES).map(([k,v]) => ({ val: k, label: v.label })) },
            { label: 'Ishtabhrity', value: ishFilter, set: setIsh, opts: Object.entries(ISHTABHRITY_STATUSES).map(([k,v]) => ({ val: k, label: v.label })) },
            { label: 'IV Status',   value: ivFilter,  set: setIv,  opts: [{ val: 'online', label: 'IV Online' }, { val: 'offline', label: 'IV Offline' }] },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              <select value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400">
                <option value="">All</option>
                {f.opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <div className="col-span-2 md:col-span-5 flex items-center justify-between border-t pt-3 mt-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showRemoved} onChange={e => setShowRm(e.target.checked)} className="rounded" />
              Show removed members
            </label>
            <button onClick={() => { setCat(''); setSuk(''); setDp(''); setIsh(''); setIv(''); setShowRm(false); }}
              className="text-xs text-sky-700 hover:underline px-2 py-2">Clear all</button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-500 text-sm">No members found</p>
            {search && <button onClick={() => setSearch('')} className="text-sky-700 text-sm mt-1 hover:underline">Clear search</button>}
          </div>
        ) : (
          filtered.map(m => (
            <button key={m.id} onClick={() => navigate(`/members/${m.id}`)}
              className={`w-full bg-white border rounded-xl p-4 hover:shadow-md transition-all text-left flex items-center gap-3 ${m.isRemoved ? 'opacity-60 border-dashed' : 'border-gray-100 hover:border-sky-100'}`}>
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0 overflow-hidden">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  m.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                  {m.isRemoved && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Removed</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <CategoryBadge category={m.memberCategory} />
                  {m.memberCategory !== 'PROSPECT' && <DPStatusBadge status={m.dpStatus} />}
                  {m.memberCategory !== 'PROSPECT' && <IshtabhritiStatusBadge status={m.ishtabhritiStatus} />}
                  {m.ivOnline !== undefined && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${m.ivOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {m.ivOnline ? '🟢 IV Online' : '🔴 IV Offline'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {m.contactNo && <span className="flex items-center gap-1"><Phone size={11} />{m.contactNo}</span>}
                  {m.area && <span className="flex items-center gap-1"><MapPin size={11} />{m.area}</span>}
                  {m.sukId && <span className="text-sky-500">{SUKS.find(s => s.id === m.sukId)?.name || m.sukId}</span>}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
