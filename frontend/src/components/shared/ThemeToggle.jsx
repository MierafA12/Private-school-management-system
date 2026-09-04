import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '', style = {} }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`sl-icon-btn ${className}`}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? '#FBBF24' : '#64748B',
        background: isDark ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
        border: '1px solid',
        borderColor: isDark ? 'rgba(251, 191, 36, 0.25)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...style,
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
