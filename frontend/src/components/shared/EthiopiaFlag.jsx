/**
 * EthiopiaFlag Component
 * Renders an official SVG of the Ethiopian tricolor flag with central emblem.
 * Resolves the issue where Windows emojis render as two letters "ET" instead of a graphic flag.
 */
export default function EthiopiaFlag({ width = 20, height = 14, className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 24"
      width={width}
      height={height}
      className={className}
      style={{
        borderRadius: 2,
        flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      aria-label="Ethiopia Flag"
    >
      {/* Green Stripe */}
      <rect width="36" height="8" fill="#078930" />
      {/* Yellow Stripe */}
      <rect y="8" width="36" height="8" fill="#FCDD09" />
      {/* Red Stripe */}
      <rect y="16" width="36" height="8" fill="#DA121A" />
      {/* Central Blue Disc */}
      <circle cx="18" cy="12" r="5.2" fill="#0F47AF" />
      {/* Radiating Rays */}
      <g fill="none" stroke="#FCDD09" strokeWidth="0.75" strokeLinecap="round">
        <line x1="18" y1="12" x2="18" y2="7.4" />
        <line x1="18" y1="12" x2="22.4" y2="10.6" />
        <line x1="18" y1="12" x2="20.7" y2="15.8" />
        <line x1="18" y1="12" x2="15.3" y2="15.8" />
        <line x1="18" y1="12" x2="13.6" y2="10.6" />
      </g>
      {/* Central Star */}
      <polygon
        points="18,8.2 19.2,11.8 22.8,11.8 19.9,14 21,17.4 18,15.2 15,17.4 16.1,14 13.2,11.8 16.8,11.8"
        fill="#FCDD09"
      />
    </svg>
  );
}
