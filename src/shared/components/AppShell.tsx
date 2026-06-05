import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../../store/authSlice';
import { notificationApi } from '../api/notificationApi';
import NotificationPanel from '../../features/notifications/NotificationPanel';
import iyteLogo from '../../assets/iyte-logo.png';

const PRIMARY = '#8B1A1A';

export default function AppShell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [unread, setUnread] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    notificationApi.unreadCount().then((r) => setUnread(r.data.data.unreadCount)).catch(() => {});
  }, []);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  const navLinks = buildNavLinks(user?.role ?? '');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: PRIMARY,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}>
          <img
            src={iyteLogo}
            alt="IYTE logo"
            style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', padding: 3, objectFit: 'contain', flexShrink: 0 }}
          />
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 18px',
                color: '#fff',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                fontSize: 14,
                borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                transition: 'background 0.15s',
              })}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingBottom: 8 }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              style={bottomBtn}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🔔</span>
              <span style={{ flex: 1 }}>Notifications</span>
              {unread > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', borderRadius: '50%',
                  fontSize: 10, width: 18, height: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>
                  {unread}
                </span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                  onRead={() => setUnread((n) => Math.max(0, n - 1))}
                />
              </div>
            )}
          </div>

          <button style={bottomBtn}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>⚙️</span>
            <span>Settings</span>
          </button>

          <button onClick={handleLogout} style={bottomBtn}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>→</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: '#f5f5f5', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

const bottomBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '11px 18px',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: 14,
  cursor: 'pointer',
  textAlign: 'left',
};

function buildNavLinks(role: string): { to: string; label: string; icon: string }[] {
  switch (role) {
    case 'ROLE_STUDENT':
      return [
        { to: '/student/dashboard', label: 'Dashboard', icon: '⊞' },
        { to: '/student/applications/new', label: 'Document Upload', icon: '📤' },
        { to: '/student/status', label: 'Application Status Tracking', icon: '📊' },
        { to: '/student/results', label: 'View Results', icon: '🏆' },
        { to: '/student/contact', label: 'Contact & Support', icon: '🎧' },
      ];
    case 'ROLE_OIDB':
      return [
        { to: '/admin/oidb/applications', label: 'Başvuru Kutusu', icon: '📥' },
        { to: '/admin/oidb/results',      label: 'Başvuru Sonuçları', icon: '📊' },
      ];
    case 'ROLE_YDYO':
      return [{ to: '/admin/ydyo/applications', label: 'İngilizce Değerlendirme', icon: '📝' }];
    case 'ROLE_YGK':
      return [
        { to: '/admin/ygk/applications', label: 'Değerlendirme Kuyruğu', icon: '⚖️' },
        { to: '/admin/ygk/placement',    label: 'Yerleştirme Listesi',   icon: '🏆' },
      ];
    case 'ROLE_INTIBAK':
      return [{ to: '/admin/intibak/applications', label: 'İntibak Kuyruğu', icon: '📋' }];
    case 'ROLE_DEAN':
      return [{ to: '/admin/dean/applications', label: 'Onay Kuyruğu', icon: '🏛️' }];
    case 'ROLE_ADMIN':
      return [
        { to: '/admin/oidb/applications', label: 'OIDB Kutusu',         icon: '📥' },
        { to: '/admin/oidb/results',      label: 'Başvuru Sonuçları',   icon: '📊' },
        { to: '/admin/ydyo/applications', label: 'YDYO Kuyruğu',        icon: '📝' },
        { to: '/admin/ygk/applications',  label: 'YGK Kuyruğu',         icon: '⚖️' },
        { to: '/admin/ygk/placement',     label: 'Yerleştirme Listesi', icon: '🏆' },
        { to: '/admin/intibak/applications', label: 'İntibak Kuyruğu', icon: '📋' },
        { to: '/admin/dean/applications', label: 'Dekanlık Onayı',      icon: '🏛️' },
      ];
    default:
      return [];
  }
}


