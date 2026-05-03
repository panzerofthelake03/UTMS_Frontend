const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  SUBMITTED: '#3b82f6',
  UNDER_OIDB_REVIEW: '#f59e0b',
  UNDER_YDYO_REVIEW: '#f59e0b',
  UNDER_YGK_REVIEW: '#f59e0b',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  EXAM_REQUIRED: '#8b5cf6',
};

export default function ApplicationStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
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
      {status.replace(/_/g, ' ')}
    </span>
  );
}
