import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../../store/authSlice';
import { notificationApi } from '../api/notificationApi';
import NotificationPanel from '../../features/notifications/NotificationPanel';
import iyteLogo from '../../assets/iyte-logo.png';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

export default function AppShell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [unread, setUnread] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useSessionTimeout();

  useEffect(() => {
    notificationApi.unreadCount().then((r) => setUnread(r.data.data.unreadCount)).catch(() => {});
  }, []);

  function handleLogout() { dispatch(logout()); navigate('/login'); }

  const navLinks = buildNavLinks(user?.role ?? '');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 md:z-auto flex flex-col
        w-60 h-full bg-[#8b1a1a] shrink-0
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <img src={iyteLogo} alt="IYTE" className="w-9 h-9 rounded-full object-contain bg-white p-0.5 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold leading-tight truncate">UTMS</p>
            <p className="text-white/60 text-[10px] leading-tight truncate">Transfer Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span className="text-base w-5 text-center shrink-0">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/10 py-2">
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 text-sm transition rounded-lg"
            >
              <span className="text-base w-5 text-center">🔔</span>
              <span className="flex-1 text-left">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 py-0.5 min-w-[18px]">
                  {unread}
                </span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', bottom: '110%', left: '100%', marginLeft: 8, zIndex: 999, width: 340 }}>
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                  onRead={() => setUnread((n) => Math.max(0, n - 1))}
                />
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-3 w-full px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 text-sm transition rounded-lg"
          >
            <span className="text-base w-5 text-center">⚙️</span>
            <span>Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 text-sm transition rounded-lg"
          >
            <span className="text-base w-5 text-center">→</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#8b1a1a] text-white shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-xl">☰</button>
          <span className="font-bold text-sm">UTMS</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function buildNavLinks(role: string): { to: string; label: string; icon: string }[] {
  switch (role) {
    case 'ROLE_STUDENT':
      return [
        { to: '/student/dashboard',       label: 'Dashboard',                   icon: '⊞' },
        { to: '/student/applications/new',label: 'Document Upload',              icon: '📤' },
        { to: '/student/status',          label: 'Application Status Tracking',  icon: '↗' },
        { to: '/student/results',         label: 'View Results',                 icon: '🏆' },
        { to: '/student/contact',         label: 'Contact & Support',            icon: '🎧' },
      ];
    case 'ROLE_OIDB':
      return [
        { to: '/admin/oidb/applications',      label: 'Applications Inbox',  icon: '📥' },
        { to: '/admin/oidb/secondary-review',  label: 'Secondary Review',  icon: '🔍' },
        { to: '/admin/oidb/results',           label: 'Results',           icon: '📋' },
      ];
    case 'ROLE_YDYO':
      return [{ to: '/admin/ydyo/applications', label: 'Students', icon: '📝' }];
    case 'ROLE_YGK':
      return [
        { to: '/admin/ygk/applications', label: 'Evaluation Queue',    icon: '⚖️' },
        { to: '/admin/ygk/placement',    label: 'Placement List', icon: '📊' },
      ];
    case 'ROLE_INTIBAK':
      return [{ to: '/admin/intibak/applications', label: 'Intibak Queue', icon: '📋' }];
    case 'ROLE_ADMIN':
      return [
        { to: '/admin/oidb/applications',     label: 'OIDB Inbox',          icon: '📥' },
        { to: '/admin/oidb/secondary-review', label: 'Secondary Review',  icon: '🔍' },
        { to: '/admin/ydyo/applications',     label: 'YDYO Queue',          icon: '📝' },
        { to: '/admin/ygk/applications',      label: 'YGK Queue',           icon: '⚖️' },
        { to: '/admin/ygk/placement',         label: 'Placement List',    icon: '📊' },
        { to: '/admin/intibak/applications',  label: 'Intibak Queue',       icon: '📋' },
      ];
    default:
      return [];
  }
}
