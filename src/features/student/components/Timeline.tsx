import type { TimelineEntry } from '../../../shared/api/applicationApi';

const PRIMARY = '#8b1a1a';

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-gray-400">No timeline entries yet.</p>;

  return (
    <ol className="list-none p-0 m-0">
      {entries.map((e, i) => (
        <li key={e.id} className="flex gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: i === entries.length - 1 ? PRIMARY : '#93c5fd' }}
            />
            {i < entries.length - 1 && (
              <div className="w-0.5 flex-1 bg-blue-200 mt-0.5" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">
              {e.fromStatus ? `${e.fromStatus} → ` : ''}{e.toStatus}
            </div>
            {e.note && <div className="text-xs text-gray-600 mt-0.5">{e.note}</div>}
            <div className="text-xs text-gray-400 mt-0.5">
              {new Date(e.changedAt).toLocaleString()} · {e.actorEmail}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
