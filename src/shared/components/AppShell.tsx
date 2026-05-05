import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../../store/authSlice';
import { notificationApi } from '../api/notificationApi';
import NotificationPanel from '../../features/notifications/NotificationPanel';
import iyteLogo from '../../assets/iyte-logo.png';

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          background: '#1d3c6e',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          height: 56,
          gap: 16,
        }}
      >
        <Link to="/" style={brandLink}>
          <img src={iyteLogo} alt="IYTE logo" style={brandLogo} />
          <span>UTMS</span>
        </Link>
        <span style={{ flex: 1 }} />
        {user && (
          <span style={{ fontSize: 13 }}>
            {user.firstName} {user.lastName}
          </span>
        )}
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              position: 'relative',
            }}
            aria-label="Notifications"
          >
            🔔
            {unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: 10,
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {unread}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              onRead={() => setUnread((n) => Math.max(0, n - 1))}
            />
          )}
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff',
            borderRadius: 4,
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <nav
          style={{
            width: 220,
            background: '#f3f4f6',
            borderRight: '1px solid #e5e7eb',
            padding: '1rem 0',
            flexShrink: 0,
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 1.5rem',
                color: isActive ? '#1d3c6e' : '#374151',
                background: isActive ? '#dbeafe' : 'none',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                fontSize: 14,
                borderLeft: isActive ? '3px solid #1d3c6e' : '3px solid transparent',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '1.5rem', background: '#fff' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function buildNavLinks(role: string): { to: string; label: string }[] {
  switch (role) {
    case 'ROLE_STUDENT':
      return [
        { to: '/student/dashboard', label: 'Dashboard' },
        { to: '/student/profile', label: 'My Profile' },
        { to: '/student/applications', label: 'My Applications' },
      ];
    case 'ROLE_OIDB':
      return [{ to: '/admin/oidb/applications', label: 'Applications Inbox' }];
    case 'ROLE_YDYO':
      return [{ to: '/admin/ydyo/applications', label: 'English Review Queue' }];
    case 'ROLE_YGK':
      return [{ to: '/admin/ygk/applications', label: 'Evaluation Queue' }];
    case 'ROLE_INTIBAK':
      return [{ to: '/admin/intibak/applications', label: 'Intibak Queue' }];
    case 'ROLE_ADMIN':
      return [
        { to: '/admin/oidb/applications', label: 'OIDB Inbox' },
        { to: '/admin/ydyo/applications', label: 'YDYO Queue' },
        { to: '/admin/ygk/applications', label: 'YGK Queue' },
        { to: '/admin/intibak/applications', label: 'Intibak Queue' },
      ];
    default:
      return [];
  }
}

const brandLink: React.CSSProperties = {
  color: '#fff',
  fontWeight: 700,
  fontSize: 18,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
};

const brandLogo: React.CSSProperties = {
  width: 30,
  height: 30,
  objectFit: 'contain',
  borderRadius: '50%',
  background: '#fff',
};
