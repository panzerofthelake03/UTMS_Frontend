import { useEffect, useState } from 'react';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import EmptyState from '../../shared/components/EmptyState';
import Spinner from '../../shared/components/Spinner';

export default function OidbResultsPage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACCEPTED' | 'REJECTED'>('ALL');

  useEffect(() => {
    adminApi.oidbResults().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? apps : apps.filter((a) => a.status === filter);
  const accepted = apps.filter((a) => a.status === 'ACCEPTED').length;
  const rejected = apps.filter((a) => a.status === 'REJECTED').length;

  if (loading) return <Spinner />;

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Application Results</h1>
      <p className="text-sm text-gray-500 mb-5">Summary of accepted and rejected applications.</p>

      {/* Filter chips */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <SummaryChip label="All" count={apps.length} color="gray" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <SummaryChip label="Accepted" count={accepted} color="green" active={filter === 'ACCEPTED'} onClick={() => setFilter('ACCEPTED')} />
        <SummaryChip label="Rejected" count={rejected} color="red" active={filter === 'REJECTED'} onClick={() => setFilter('REJECTED')} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No results in this category." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr>
                  {['Student', 'Student No', 'Department', 'Term', 'Result', 'Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{a.studentFirstName} {a.studentLastName}</div>
                      <div className="text-xs text-gray-400">{a.studentEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.studentNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.department ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.term}</td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {apps.length} applications
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryChipProps {
  label: string; count: number; color: 'gray' | 'green' | 'red'; active: boolean; onClick: () => void;
}

function SummaryChip({ label, count, color, active, onClick }: SummaryChipProps) {
  const colorMap = {
    gray:  { bg: active ? 'bg-gray-700'  : 'bg-white', text: active ? 'text-white' : 'text-gray-700',  border: 'border-gray-200' },
    green: { bg: active ? 'bg-green-600' : 'bg-white', text: active ? 'text-white' : 'text-green-700', border: 'border-green-200' },
    red:   { bg: active ? 'bg-red-600'   : 'bg-white', text: active ? 'text-white' : 'text-red-700',   border: 'border-red-200' },
  };
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all cursor-pointer ${c.bg} ${c.text} ${c.border}`}
    >
      {label}
      <span className={`inline-flex items-center justify-center px-1.5 rounded-full text-xs font-bold ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
        {count}
      </span>
    </button>
  );
}
