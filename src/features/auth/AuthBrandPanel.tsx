import iyteLogo from '../../assets/iyte-logo.png';

export const AUTH_PRIMARY = '#8B1A1A';

/**
 * The maroon branding panel shown on the left half of the auth screens
 * (Login, Register, Forgot Password, Reset Password). Mirrors the LoginPage layout.
 */
export default function AuthBrandPanel() {
  return (
    <div
      style={{
        flex: 1,
        background: AUTH_PRIMARY,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem',
      }}
    >
      {/* Decorative shapes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, left: -100, width: 380, height: 380, border: '50px solid rgba(255,255,255,0.06)', borderRadius: 50, transform: 'rotate(20deg)' }} />
        <div style={{ position: 'absolute', top: -50, left: -60, width: 280, height: 280, border: '35px solid rgba(255,255,255,0.04)', borderRadius: 36, transform: 'rotate(10deg)' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -80, width: 420, height: 420, border: '55px solid rgba(255,255,255,0.06)', borderRadius: 60, transform: 'rotate(-15deg)' }} />
        <div style={{ position: 'absolute', bottom: -70, right: -50, width: 320, height: 320, border: '40px solid rgba(255,255,255,0.04)', borderRadius: 44, transform: 'rotate(-8deg)' }} />
      </div>
      {/* Branding */}
      <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
        <img
          src={iyteLogo}
          alt="IYTE logo"
          style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', padding: 8, objectFit: 'contain', marginBottom: 24 }}
        />
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>Izmir Institute of Technology</h1>
        <p style={{ margin: '10px 0 6px', fontSize: 14, opacity: 0.85 }}>Undergraduate Transfer Management System</p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.6, letterSpacing: 3 }}>UTMS</p>
      </div>
    </div>
  );
}
