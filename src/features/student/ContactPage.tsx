import { useState } from 'react';
import { supportApi } from '../../shared/api/supportApi';

const PRIMARY = '#8b1a1a';
const MAX_SUBJECT = 100;
const MAX_MESSAGE = 1000;
const CATEGORIES = ['Transfer', 'Exam', 'Technical', 'Documents', 'Other'];

const OFFICES = [
  {
    title: "Registrar's Office (ÖİDB)",
    items: [
      { icon: '📞', label: 'Phone', value: '+90 (312) 555 1234' },
      { icon: '✉', label: 'Email', value: 'registrar@university.edu.tr' },
      { icon: '📍', label: 'Office Location', value: 'Main Building, 2nd Floor, Room 201' },
      { icon: '🕐', label: 'Working Hours', value: 'Monday – Friday: 09:00 – 17:00' },
    ],
  },
  {
    title: 'School of Foreign Languages (YDYO)',
    items: [
      { icon: '📞', label: 'Phone', value: '+90 (312) 555 5678' },
      { icon: '✉', label: 'Email', value: 'ydyo@university.edu.tr' },
      { icon: '📍', label: 'Office Location', value: 'Foreign Languages Building, 1st Floor' },
    ],
  },
];

export default function ContactPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    if (!subject.trim()) { setError('Subject is required.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (!message.trim()) { setError('Message is required.'); return; }
    setLoading(true);
    try {
      const res = await supportApi.createTicket({ subject, category, message });
      setSuccess(`Your message has been sent. Ticket ID: #${res.data.data.id}`);
      setSubject(''); setCategory(''); setMessage('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } }; status?: number } };
      if (e.response?.status === 429) {
        setError('You can only send one message every 2 minutes. Please wait before trying again.');
      } else {
        setError(e.response?.data?.error?.message ?? 'Your message could not be sent. Please try again later.');
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact &amp; Support</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Office info */}
        <div className="flex flex-col gap-5 lg:w-1/2">
          {OFFICES.map((office) => (
            <div key={office.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#8b1a1a] mb-4">{office.title}</h3>
              <div className="space-y-3">
                {office.items.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-lg text-[#8b1a1a] w-5 shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-gray-700 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Message form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:w-1/2">
          <h3 className="text-sm font-bold text-gray-900 mb-5">Send a Message to ÖİDB</h3>

          {success && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{success}</div>
          )}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
              <input
                type="text"
                placeholder="Enter subject..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
                value={subject}
                maxLength={MAX_SUBJECT}
                onChange={(e) => setSubject(e.target.value)}
              />
              <p className="text-right text-[10px] text-gray-400 mt-1">{subject.length}/{MAX_SUBJECT}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
              <textarea
                placeholder="Type your message here..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition resize-none"
                rows={6}
                value={message}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-right text-[10px] text-gray-400 mt-1">Character Limit: {message.length}/{MAX_MESSAGE}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: PRIMARY }}
              className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              ✈ {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
