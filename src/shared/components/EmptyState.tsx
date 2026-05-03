interface Props { message?: string }
export default function EmptyState({ message = 'No items found.' }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
      <div style={{ fontSize: 40 }}>📭</div>
      <p style={{ marginTop: 8 }}>{message}</p>
    </div>
  );
}
