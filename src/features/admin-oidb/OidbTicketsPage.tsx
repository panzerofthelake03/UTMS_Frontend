import { useEffect, useState } from 'react';
import { adminApi, type SupportTicket } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  PENDING:    { background: '#fef9c3', color: '#854d0e' },
  IN_REVIEW:  { background: '#dbeafe', color: '#1d4ed8' },
  RESOLVED:   { background: '#dcfce7', color: '#15803d' },
  CLOSED:     { background: '#f3f4f6', color: '#6b7280' },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING:   'IN_REVIEW',
  IN_REVIEW: 'RESOLVED',
  RESOLVED:  'CLOSED',
};

export default function OidbTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    adminApi.oidbListTickets()
      .then((r) => setTickets(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  async function advanceStatus(ticket: SupportTicket) {
    const next = NEXT_STATUS[ticket.ticketStatus];
    if (!next) return;
    setUpdating(ticket.id);
    try {
      const res = await adminApi.oidbUpdateTicketStatus(ticket.id, next);
      setTickets((prev) => prev.map((t) => t.id === ticket.id ? res.data.data : t));
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === 'ALL' ? tickets : tickets.filter((t) => t.ticketStatus === filter);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Support Tickets</h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
          Messages sent by students to the OIDB office.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['ALL', 'PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map((s) => {
          const count = s === 'ALL' ? tickets.length : tickets.filter((t) => t.ticketStatus === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: '1px solid',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                borderColor: filter === s ? PRIMARY : '#e5e7eb',
                background: filter === s ? PRIMARY : '#fff',
                color: filter === s ? '#fff' : '#374151',
              }}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No tickets found." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((ticket) => {
            const isOpen = expanded === ticket.id;
            const statusStyle = STATUS_STYLES[ticket.ticketStatus] ?? STATUS_STYLES['CLOSED'];
            const nextStatus = NEXT_STATUS[ticket.ticketStatus];

            return (
              <div
                key={ticket.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 18px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpanded(isOpen ? null : ticket.id)}
                >
                  {/* Left: subject + meta */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#111', fontSize: 14, marginBottom: 3 }}>
                      #{ticket.id} — {ticket.subject}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {ticket.studentFullName} · {ticket.studentEmail}
                      <span style={{ marginLeft: 8, background: '#f3f4f6', borderRadius: 4, padding: '1px 7px', fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                        {ticket.category}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Status badge */}
                  <span style={{
                    ...statusStyle,
                    padding: '3px 12px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {ticket.ticketStatus.replace('_', ' ')}
                  </span>

                  {/* Chevron */}
                  <span style={{ color: '#9ca3af', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 18px', background: '#fafafa' }}>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>
                      {ticket.message}
                    </p>
                    {nextStatus && (
                      <button
                        onClick={() => void advanceStatus(ticket)}
                        disabled={updating === ticket.id}
                        style={{
                          padding: '7px 18px',
                          background: PRIMARY,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          opacity: updating === ticket.id ? 0.6 : 1,
                        }}
                      >
                        {updating === ticket.id ? '…' : `Mark as ${nextStatus.replace('_', ' ')}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
