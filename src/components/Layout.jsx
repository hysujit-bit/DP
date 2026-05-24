import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  LayoutDashboard, Users, IndianRupee, Calendar, Settings, LogOut, Menu, X, ChevronDown, ChevronRight, UserPlus, BookOpen, ClipboardList, Zap, Star, Bell, UserCheck, Globe
} from 'lucide-react';
import { useState } from 'react';
import { MEMBER_CATEGORIES, SUKS } from '../constants';
import CategoryPickerModal from './CategoryPickerModal';

const CATEGORY_COLORS = {
  ACTIVE_DP_WORKER:    'bg-green-400',
  REGULAR_CONTRIBUTOR: 'bg-blue-400',
  SEMI_ACTIVE:         'bg-sky-400',
  DEFAULTER:           'bg-red-400',
  PROSPECT:            'bg-purple-400',
  SUPER_NEW:           'bg-teal-400',
};

const navItems = [
  { to: '/dp-portal',    icon: Globe,       label: 'DP Portal Status'     },
  { to: '/definitions',  icon: BookOpen,    label: 'Definitions'          },
];

const MY_SPACE_SECTIONS = [
  { key: 'notifications', icon: Bell,        label: 'Notifications'   },
  { key: 'members',       icon: UserCheck,   label: 'My Members'      },
  { key: 'ishtabhrity',   icon: IndianRupee, label: 'Ishtabhrity'     },
];

export default function Layout() {
  const { user, logout, currentSukId, switchSuk } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(location.pathname.startsWith('/members'));
  const [dpOpen, setDpOpen] = useState(location.pathname.startsWith('/dp-work'));
  const [mySpaceOpen, setMySpaceOpen] = useState(location.pathname.startsWith('/my-space'));
  const [sukOpen, setSukOpen] = useState(false);
  const [addModal, setAddModal] = useState(false);

  const currentSuk = SUKS.find(s => s.id === currentSukId) || SUKS[0];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">🙏</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-sm leading-tight">DP Work App</div>

            {/* SUK selector — dropdown for ADMIN, static label for others */}
            {user?.role === 'ADMIN' ? (
              <div className="relative">
                <button
                  onClick={() => setSukOpen(v => !v)}
                  className="flex items-center gap-0.5 text-xs text-sky-700 hover:text-sky-800 font-medium transition-colors mt-0.5"
                >
                  <span>{currentSuk.name} SUK</span>
                  <ChevronDown size={11} className={`transition-transform ${sukOpen ? 'rotate-180' : ''}`} />
                </button>

                {sukOpen && (
                  <>
                    {/* invisible overlay to close on outside click */}
                    <div className="fixed inset-0 z-40" onClick={() => setSukOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 w-48 overflow-hidden">
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                        Switch SUK
                      </div>
                      {SUKS.map(suk => (
                        <button
                          key={suk.id}
                          onClick={() => { switchSuk(suk.id); setSukOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            currentSukId === suk.id
                              ? 'bg-sky-50 text-sky-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{suk.name} SUK</span>
                          {currentSukId === suk.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-0.5">{currentSuk.name} SUK</div>
            )}
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <NavLink to="/" end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-50 text-sky-700 border border-sky-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          {/* Members + Categories collapsible */}
          <div>
            <div className="flex items-center gap-1">
              <NavLink to="/members"
                className={({ isActive }) =>
                  `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive && !location.search
                      ? 'bg-sky-50 text-sky-700 border border-sky-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <Users size={18} />
                Members
              </NavLink>
              <button
                onClick={() => setCatOpen(v => !v)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                title="Toggle categories"
              >
                {catOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            </div>

            {catOpen && (
              <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                {Object.entries(MEMBER_CATEGORIES).map(([key, cat]) => {
                  const params = new URLSearchParams({ cat: key }).toString();
                  const isActive = location.pathname === '/members' && location.search === `?${params}`;
                  return (
                    <NavLink
                      key={key}
                      to={`/members?cat=${key}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[key]}`} />
                      {cat.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* DP Work Planner — collapsible with sub-items */}
          <div>
            <div className="flex items-center gap-1">
              <NavLink to="/dp-work"
                className={({ isActive }) =>
                  `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive && location.pathname === '/dp-work'
                      ? 'bg-sky-50 text-sky-700 border border-sky-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <Calendar size={18} />
                DP Work Planner
              </NavLink>
              <button
                onClick={() => setDpOpen(v => !v)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {dpOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            </div>

            {dpOpen && (
              <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                <NavLink
                  to="/dp-work"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  <ClipboardList size={13} />
                  Planner
                </NavLink>
                <NavLink
                  to="/dp-work/activity"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  <Zap size={13} />
                  Log Activity
                </NavLink>
              </div>
            )}
          </div>

          {/* My Space — collapsible with 3 sub-sections */}
          <div>
            <div className="flex items-center gap-1">
              <NavLink to="/my-space"
                className={({ isActive }) =>
                  `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <Star size={18} />
                My Space
              </NavLink>
              <button
                onClick={() => setMySpaceOpen(v => !v)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {mySpaceOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            </div>

            {mySpaceOpen && (
              <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                {MY_SPACE_SECTIONS.map(({ key, icon: Icon, label }) => {
                  const isActive = location.pathname === '/my-space' && location.search === `?section=${key}`;
                  return (
                    <NavLink
                      key={key}
                      to={`/my-space?section=${key}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={13} />
                      {label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin-only: Full Ishtabhrity Tracker (all SUK members) */}
          {user?.role === 'ADMIN' && (
            <NavLink to="/ishtabhrity"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <IndianRupee size={18} />
              Ishtabhrity Tracker
            </NavLink>
          )}

          {/* Other nav items (Definitions) */}
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'ADMIN' && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <Settings size={18} />
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — visible on all screen sizes */}
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          {/* Mobile: hamburger + app name */}
          <button onClick={() => setOpen(true)} className="text-gray-600 hover:text-gray-900 lg:hidden">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-lg">🙏</span>
            <span className="font-bold text-gray-900 text-sm">DP Work App</span>
          </div>

          {/* Spacer pushes button to the right on desktop too */}
          <div className="flex-1" />

          {/* Add Member — always visible top-right */}
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors shadow-sm"
          >
            <UserPlus size={15} />
            <span className="hidden sm:inline">Add Member</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Add Member — category picker modal */}
      <CategoryPickerModal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="What category is this member?"
        onSelect={(key) => {
          setAddModal(false);
          navigate(`/members/new?precat=${key}`);
        }}
      />
    </div>
  );
}
