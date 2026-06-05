import { useEffect } from 'react';

interface Props {
  title: string;
  url: string;
  onClose: () => void;
}

export default function PdfViewerModal({ title, url, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full max-w-5xl"
           style={{ height: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-red-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <span className="text-sm font-semibold text-gray-800 truncate">{title}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={url}
              download={title}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              İndir
            </a>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 text-lg font-bold transition-colors"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <iframe
          src={url}
          className="flex-1 w-full rounded-b-xl"
          title={title}
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}
