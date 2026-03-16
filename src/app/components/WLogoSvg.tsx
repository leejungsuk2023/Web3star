interface WLogoSvgProps {
  className?: string;
  isActive?: boolean;
}

export default function WLogoSvg({ className = "", isActive = false }: WLogoSvgProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isActive ? "#ffffff" : "#9ca3af"} />
          <stop offset="50%" stopColor={isActive ? "#dbeafe" : "#6b7280"} />
          <stop offset="100%" stopColor={isActive ? "#a5f3fc" : "#4b5563"} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <text
        x="100"
        y="140"
        fontSize="140"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        fill="url(#wLogoGradient)"
        filter={isActive ? "url(#glow)" : undefined}
      >
        W
      </text>
    </svg>
  );
}
