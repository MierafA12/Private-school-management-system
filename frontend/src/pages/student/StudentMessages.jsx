import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const INITIAL_THREADS = [
  {
    id: 1,
    teacher: 'Mr. Samuel',
    subject: 'Mathematics',
    initials: 'MS',
    preview: 'Keep practicing the algebra exercises...',
    time: '2h ago',
    unread: 1,
    messages: [
      { from: 'Mr. Samuel', text: 'Hi John, I noticed you struggled with the last quiz on quadratic equations. I recommend spending extra time on the practice problems in Chapter 5.', time: 'Jul 24, 9:10 AM', isTeacher: true },
      { from: 'You', text: 'Thank you Mr. Samuel. I will work through those problems this weekend.', time: 'Jul 24, 5:30 PM', isTeacher: false },
      { from: 'Mr. Samuel', text: 'Keep practicing the algebra exercises. Feel free to visit me during office hours if you need help.', time: 'Jul 25, 8:00 AM', isTeacher: true },
    ],
  },
  {
    id: 2,
    teacher: 'Mrs. Hana',
    subject: 'English',
    initials: 'MH',
    preview: 'Your essay was excellent! Well done.',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { from: 'Mrs. Hana', text: 'John, I have reviewed your essay submission. Your essay was excellent! Well done. Your argument structure and vocabulary have improved significantly.', time: 'Jul 23, 11:00 AM', isTeacher: true },
      { from: 'You', text: 'Thank you so much Mrs. Hana! I worked really hard on it.', time: 'Jul 23, 4:00 PM', isTeacher: false },
    ],
  },
  {
    id: 3,
    teacher: 'Ms. Liya',
    subject: 'Chemistry',
    initials: 'ML',
    preview: 'Please review your lab report...',
    time: 'Jul 22',
    unread: 0,
    messages: [
      { from: 'Ms. Liya', text: 'John, please review your lab report on the titration experiment. There are some calculation errors in the conclusion section.', time: 'Jul 22, 10:00 AM', isTeacher: true },
    ],
  },
];

export default function StudentMessages() {
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [activeId, setActiveId] = useState(1);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const activeThread = threads.find(t => t.id === activeId) || threads[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg = {
      from: 'You',
      text: trimmed,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isTeacher: false,
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeId) {
        return {
          ...t,
          preview: trimmed,
          time: 'Just now',
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    }));

    setInput('');
  };

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Messages</h1>
        <p className="sp-page-sub">Direct communication with your teachers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '1rem', minHeight: '520px' }}>

        {/* Thread list */}
        <div className="sp-card" style={{ overflow: 'hidden' }}>
          <div className="sp-card-header">
            <span className="sp-card-title">Conversations</span>
          </div>
          <div>
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: activeThread.id === t.id ? 'rgba(30, 58, 95, 0.08)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: activeThread.id === t.id ? 'var(--primary)' : '#6B7280',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {t.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{t.teacher}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.time}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.2rem', fontWeight: 600 }}>{t.subject}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.preview}
                  </div>
                </div>
                {t.unread > 0 && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {t.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active thread */}
        <div className="sp-card" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Thread header */}
          <div className="sp-card-header">
            <div>
              <div className="sp-card-title">{activeThread.teacher}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{activeThread.subject}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeThread.messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: m.isTeacher ? 'row' : 'row-reverse',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: m.isTeacher ? 'var(--primary)' : '#2563EB',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {m.isTeacher ? activeThread.initials : 'ST'}
                </div>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    background: m.isTeacher ? 'var(--bg-muted, #F1F5F9)' : 'rgba(37, 99, 235, 0.12)',
                    border: `1px solid ${m.isTeacher ? 'var(--border-color)' : 'rgba(37, 99, 235, 0.25)'}`,
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>{m.from}</div>
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-main)' }}>{m.text}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: m.isTeacher ? 'left' : 'right' }}>
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
            <input
              className="msg-input"
              placeholder={`Message ${activeThread.teacher}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="msg-send-btn" onClick={handleSend}>
              <Send size={15} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

