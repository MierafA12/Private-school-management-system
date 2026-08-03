/**
 * Reusable loading spinner and error banner for data-fetching pages.
 */

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '30vh', gap: '1rem', color: 'var(--text-muted)',
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid var(--border-color)',
        borderTopColor: 'var(--primary)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: '#FEF2F2', border: '1px solid #FECACA',
      borderRadius: 'var(--radius)', padding: '1.25rem',
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    }}>
      <span style={{ fontSize: '1.25rem' }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
          Something went wrong
        </div>
        <div style={{ fontSize: '0.875rem', color: '#991B1B' }}>{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: '0.75rem', padding: '0.4rem 0.9rem',
              background: 'var(--primary)', color: 'white',
              borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'No data', subtitle = '' }) {
  return (
    <div className="sp-empty">
      <div className="sp-empty-icon">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.8rem' }}>{subtitle}</div>}
    </div>
  );
}
