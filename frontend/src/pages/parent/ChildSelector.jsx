/**
 * ChildSelector — compact switcher bar rendered at the top of per-child pages.
 * Receives children[] and activeId/setActiveId from parent page state.
 */
export default function ChildSelector({ children, activeId, onChange }) {
  if (!children || children.length <= 1) return null;

  return (
    <div className="pp-switcher">
      <span className="pp-switcher-label">Viewing:</span>
      {children.map((child) => (
        <button
          key={child.id}
          className={`pp-switcher-tab${activeId === child.id ? ' pp-switcher-tab--active' : ''}`}
          onClick={() => onChange(child.id)}
        >
          {activeId === child.id && <span className="pp-switcher-dot" />}
          {child.first_name} {child.last_name}
          {child.class_name && (
            <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>
              &nbsp;· {child.class_name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
