const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  SUBMITTED: '#3b82f6',
  UNDER_OIDB_REVIEW: '#f59e0b',
  FROM_YGK: '#ef4444',
  UNDER_YDYO_REVIEW: '#f59e0b',
  WAITING_EXAM_RESULT: '#8b5cf6',
  UNDER_YGK_REVIEW: '#f59e0b',
  PENDING_DEAN_APPROVAL: '#0ea5e9',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  EXAM_REQUIRED: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SUBMITTED: 'Gönderildi',
  UNDER_OIDB_REVIEW: 'OİDB İncelemesinde',
  FROM_YGK: 'YGK\'dan Döndü',
  UNDER_YDYO_REVIEW: 'YDYO İncelemesinde',
  WAITING_EXAM_RESULT: 'Sınav Bekleniyor',
  UNDER_YGK_REVIEW: 'YGK İncelemesinde',
  PENDING_DEAN_APPROVAL: 'Dekanlık Onayında',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
};

export default function ApplicationStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        background: color,
        letterSpacing: '0.03em',
      }}
    >
      {label}
    </span>
  );
}
