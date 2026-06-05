import { useState } from 'react';
import { supportApi } from '../../shared/api/supportApi';

const PRIMARY = '#8b1a1a';
const MAX_SUBJECT = 100;
const MAX_MESSAGE = 1000;
const CATEGORIES = ['Transfer', 'Exam', 'Technical', 'Documents', 'Other'];

export default function ContactPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subject.trim()) { setError('Subject is required.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (!message.trim()) { setError('Message is required.'); return; }

    setLoading(true);
    try {
      const res = await supportApi.createTicket({ subject, category, message });
      setSuccess(`Your message has been sent. Ticket ID: #${res.data.data.id}`);
      setSubject('');
      setCategory('');
      setMessage('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } }; status?: number } };
      if (e.response?.status === 429) {
        setError('You can only send one message every 2 minutes. Please wait before trying again.');
      } else {
        setError(e.response?.data?.error?.message ?? 'Your message could not be sent due to a system error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={s.pageTitle}>Contact &amp; Support</h2>
      <div style={s.layout}>
        {/* Left column: contact info panels */}
        <div style={s.leftCol}>
          <ContactInfoCard
            title="Registrar's Office (ÖİDB)"
            items={[
              { icon: '📞', label: 'Phone', value: '+90 (312) 555 1234' },
              { icon: '✉', label: 'Email', value: 'registrar@university.edu.tr' },
              { icon: '📍', label: 'Office Location', value: 'Main Building, 2nd Floor, Room 201' },
              { icon: '🕐', label: 'Working Hours', value: 'Monday – Friday: 09:00 – 17:00' },
            ]}
          />
          <ContactInfoCard
            title="School of Foreign Languages (YDYO)"
            items={[
              { icon: '📞', label: 'Phone', value: '+90 (312) 555 5678' },
              { icon: '✉', label: 'Email', value: 'ydyo@university.edu.tr' },
              { icon: '📍', label: 'Office Location', value: 'Foreign Languages Building, 1st Floor' },
            ]}
          />
        </div>

        {/* Right column: message form */}
        <div style={s.rightCol}>
          <h3 style={{ ...s.cardTitle, marginBottom: 16 }}>Send a Message to ÖİDB</h3>
          {success && <div style={s.successBox}>{success}</div>}
          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={s.label}>Subject</label>
              <input
                type="text"
                style={s.input}
                placeholder="Enter subject..."
                value={subject}
                maxLength={MAX_SUBJECT}
                onChange={(e) => setSubject(e.target.value)}
              />
              <div style={s.charCount}>{subject.length}/{MAX_SUBJECT}</div>
            </div>
            <div>
              <label style={s.label}>Category</label>
              <select style={s.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select a category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Message</label>
              <textarea
                style={{ ...s.input, resize: 'vertical', minHeight: 150 }}
                placeholder="Type your message here..."
                value={message}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={s.charCount}>Character Limit: {message.length}/{MAX_MESSAGE}</div>
            </div>
            <button type="submit" disabled={loading} style={s.sendBtn}>
              ✈ {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContactInfoCard({ title, items }: {
  title: string;
  items: { icon: string; label: string; value: string }[];
}) {
  return (
    <div style={s.infoCard}>
      <h3 style={{ ...s.cardTitle, color: PRIMARY, marginBottom: 14 }}>{title}</h3>
      {items.map((item) => (
        <div key={item.label} style={s.infoRow}>
          <span style={s.infoIcon}>{item.icon}</span>
          <div>
            <div style={s.infoLabel}>{item.label}</div>
            <div style={s.infoValue}>{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 20px' } as React.CSSProperties,
  layout: { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' } as React.CSSProperties,
  leftCol: { display: 'flex', flexDirection: 'column', gap: 16, flex: '1 1 280px', minWidth: 260 } as React.CSSProperties,
  rightCol: {
    flex: '1 1 360px', minWidth: 300, background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 10, padding: '20px 24px',
  } as React.CSSProperties,
  infoCard: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px',
  } as React.CSSProperties,
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 } as React.CSSProperties,
  infoRow: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 } as React.CSSProperties,
  infoIcon: { fontSize: 16, color: PRIMARY, width: 20, flexShrink: 0 } as React.CSSProperties,
  infoLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: 500 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const,
  },
  charCount: { fontSize: 11, color: '#9ca3af', textAlign: 'right' as const, marginTop: 4 },
  sendBtn: {
    padding: '11px', background: PRIMARY, color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  } as React.CSSProperties,
  successBox: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6,
    padding: '10px 14px', fontSize: 13, color: '#15803d', marginBottom: 14,
  } as React.CSSProperties,
  errorBox: {
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
    padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 14,
  } as React.CSSProperties,
};
