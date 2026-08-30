import { useState, useEffect, useRef } from 'react';
import { Send, Plus } from 'lucide-react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '';

const initials = (first, last) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

export default function ParentMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [thread,        setThread]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [threadLoad,    setThreadLoad]    = useState(false);
  const [error,         setError]         = useState(null);
  const [reply,         setReply]         = useState('');
  const [sending,       setSending]       = useState(false);

  // New conversation modal
  const [showNew,       setShowNew]       = useState(false);
  const [newForm,       setNewForm]       = useState({ teacher_user_id: '', student_id: '', subject: '', message: '' });
  const [children,      setChildren]      = useState([]);
  const [newError,      setNewError]      = useState(null);
  const [newLoading,    setNewLoading]    = useState(false);

  const bottomRef = useRef(null);

  const loadConvs = async () => {
    try {
      setLoading(true); setError(null);
      setConversations(await parentApi.getMessages());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadConvs();
    parentApi.getChildren().then(setChildren).catch(() => {});
  }, []); // eslint-disable-line

  const openThread = async (conv) => {
    setActiveConv(conv.id);
    try {
      setThreadLoad(true);
      setThread(await parentApi.getConversation(conv.id));
    } catch (_) {}
    finally { setThreadLoad(false); }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeConv) return;
    try {
      setSending(true);
      const msg = await parentApi.sendMessage(activeConv, reply.trim());
      setThread(t => ({ ...t, messages: [...(t?.messages || []), msg] }));
      setReply('');
    } catch (_) {}
    finally { setSending(false); }
  };

  const startConversation = async (e) => {
    e.preventDefault();
    try {
      setNewLoading(true); setNewError(null);
      const { conversation_id } = await parentApi.startConversation(newForm);
      setShowNew(false);
      await loadConvs();
      // open the new thread
      const conv = { id: conversation_id };
      openThread(conv);
    } catch (err) {
      setNewError(err.message);
    } finally {
      setNewLoading(false);
    }
  };

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Messages</h1>
          <p className="sp-page-sub">Direct communication with your children's teachers</p>
        </div>
        <button
          className="sp-badge sp-badge--yellow"
          style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none' }}
          onClick={() => setShowNew(true)}
        >
          <Plus size={14} /> New Message
        </button>
      </div>

      <div className="sp-two-col" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {/* Conversation list */}
        <div className="sp-card" style={{ overflowY: 'auto' }}>
          <div className="sp-card-header">
            <span className="sp-card-title">Conversations</span>
            <span className="sp-badge sp-badge--blue">{conversations.length}</span>
          </div>
          {loading ? <LoadingSpinner message="" /> :
           error   ? <ErrorBanner message={error} onRetry={loadConvs} /> :
           conversations.length === 0 ? (
            <div className="sp-empty"><div className="sp-empty-icon">💬</div>No conversations yet.<br/>Click "New Message" to start one.</div>
           ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => openThread(conv)}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer',
                  background: activeConv === conv.id ? '#FFFBEB' : 'white',
                  borderLeft: activeConv === conv.id ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{conv.teacher_name}</div>
                  {parseInt(conv.unread_count) > 0 && (
                    <span className="sp-badge sp-badge--red" style={{ fontSize: '0.65rem' }}>{conv.unread_count}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Re: {conv.student_name}</div>
                {conv.last_message && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.last_message}
                  </div>
                )}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {fmtTime(conv.last_message_at)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Thread */}
        <div className="sp-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sp-card-header" style={{ flexShrink: 0 }}>
            <span className="sp-card-title">
              {thread ? `${thread.teacher_name} · Re: ${thread.student_name}` : 'Select a conversation'}
            </span>
          </div>

          {!activeConv ? (
            <div className="sp-empty"><div className="sp-empty-icon">👈</div>Select a conversation</div>
          ) : threadLoad ? (
            <LoadingSpinner message="Loading thread…" />
          ) : !thread ? (
            <div className="sp-empty">Could not load thread</div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }} className="msg-list">
                {thread.messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className="msg-item" style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <div className="msg-avatar" style={{ background: isMe ? 'var(--accent)' : 'var(--primary)' }}>
                        {initials(msg.sender_first, msg.sender_last)}
                      </div>
                      <div className="msg-bubble" style={{ background: isMe ? '#FFFBEB' : 'var(--bg-color)', textAlign: isMe ? 'right' : 'left' }}>
                        <div>
                          <span className="msg-sender">{isMe ? 'You' : `${msg.sender_first} ${msg.sender_last}`}</span>
                          <span className="msg-time">{fmtTime(msg.created_at)}</span>
                        </div>
                        <div className="msg-text">{msg.body}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {thread.status === 'OPEN' && (
                <form onSubmit={sendReply} className="msg-compose" style={{ flexShrink: 0 }}>
                  <input
                    className="msg-input"
                    placeholder="Write a message…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" className="msg-send-btn" disabled={sending || !reply.trim()}>
                    <Send size={16} /> Send
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {showNew && (
        <div className="pp-modal-overlay">
          <div className="pp-modal">
            <div className="pp-modal-title">New Message</div>
            <div className="pp-modal-sub">Start a conversation with a teacher</div>

            {newError && (
              <div className="auth-error" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem' }}>
                {newError}
              </div>
            )}

            <form onSubmit={startConversation} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="pp-form-group">
                <label>Child (Student)</label>
                <select value={newForm.student_id} onChange={e => setNewForm(f => ({ ...f, student_id: e.target.value }))} required>
                  <option value="">Select child…</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="pp-form-group">
                <label>Teacher User ID</label>
                <input
                  type="text"
                  placeholder="Teacher's user UUID"
                  value={newForm.teacher_user_id}
                  onChange={e => setNewForm(f => ({ ...f, teacher_user_id: e.target.value }))}
                  required
                />
              </div>
              <div className="pp-form-group">
                <label>Subject (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Regarding attendance"
                  value={newForm.subject}
                  onChange={e => setNewForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="pp-form-group">
                <label>Message</label>
                <textarea
                  rows={3}
                  placeholder="Write your message…"
                  value={newForm.message}
                  onChange={e => setNewForm(f => ({ ...f, message: e.target.value }))}
                  required
                  style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical', outline: 'none' }}
                />
              </div>
              <div className="pp-modal-actions">
                <button type="button" className="pp-btn-cancel" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="pp-btn-pay" disabled={newLoading}>{newLoading ? 'Sending…' : 'Send'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
