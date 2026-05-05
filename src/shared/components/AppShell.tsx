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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      {/* Sidebar */}
      <nav
        style={{
          width: 260,
          background: '#8c1515',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          padding: '2rem 1rem',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', borderRadius: '50%', padding: '4px', marginBottom: '1rem', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={iyteLogo} alt="IYTE logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '12px 1rem',
                color: '#fff',
                background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                borderRadius: '8px',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s',
                gap: '12px',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, fontSize: '1.2rem' }}>
                {link.icon || '•'}
              </div>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Bottom Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {/* Notification Bell inside Sidebar optionally */}
          <button
            onClick={() => setShowNotifications((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '12px 1rem',
              background: showNotifications ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              textAlign: 'left',
              gap: '12px',
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, fontSize: '1.1rem', position: 'relative' }}>
                🔔
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -4, background: '#ef4444', color: '#fff',
                    borderRadius: '50%', fontSize: 9, width: 14, height: 14, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {unread}
                  </span>
                )}
             </div>
             Notifications
          </button>
          
          <NavLink
            to="/settings"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '12px 1rem',
              color: '#fff',
              background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.95rem',
              gap: '12px',
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, fontSize: '1.1rem' }}>
              ⚙️
            </div>
            Settings
          </NavLink>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '12px 1rem',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              textAlign: 'left',
              marginTop: '1rem',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, fontSize: '1.1rem' }}>
              [→
            </div>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', background: '#f9f9fa', display: 'flex', flexDirection: 'column' }}>
        {/* User Info Header Placeholder (if needed, otherwise empty) */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Notification Panel Positioning */}
            {showNotifications && (
              <div style={{ position: 'absolute', top: '70px', right: '1.5rem', zIndex: 50 }}>
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                  onRead={() => setUnread((n) => Math.max(0, n - 1))}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: '0 2rem 2rem 2rem', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function buildNavLinks(role: string): { to: string; label: string; icon?: string }[] {
  switch (role) {
    case 'ROLE_STUDENT':
      return [
        { to: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
        { to: '/student/applications/new', label: 'Document Upload', icon: '📄' },
        { to: '/student/applications', label: 'Application Status Tracking', icon: '📈' },
        { to: '/student/results', label: 'View Results', icon: '🏅' },
        { to: '/support', label: 'Contact & Support', icon: '🎧' },
      ];
    case 'ROLE_OIDB':
      return [{ to: '/admin/oidb/applications', label: 'Applications Inbox', icon: '📥' }];
    case 'ROLE_YDYO':
      return [{ to: '/admin/ydyo/applications', label: 'English Review Queue', icon: '📝' }];
    case 'ROLE_YGK':
      return [{ to: '/admin/ygk/applications', label: 'Evaluation Queue', icon: '⚖️' }];
    case 'ROLE_INTIBAK':
      return [{ to: '/admin/intibak/applications', label: 'Intibak Queue', icon: '🔗' }];
    case 'ROLE_ADMIN':
      return [
        { to: '/admin/oidb/applications', label: 'OIDB Inbox', icon: '📥' },
        { to: '/admin/ydyo/applications', label: 'YDYO Queue', icon: '📝' },
        { to: '/admin/ygk/applications', label: 'YGK Queue', icon: '⚖️' },
        { to: '/admin/intibak/applications', label: 'Intibak Queue', icon: '🔗' },
      ];
    default:
      return [];
  }
}
