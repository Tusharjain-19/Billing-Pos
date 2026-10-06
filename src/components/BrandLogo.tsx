import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  iconOnly = false,
  subtitle = 'by BookMyDine QR',
}) => {
  const [imgErrorCount, setImgErrorCount] = useState(0);

  // Nicely sized, prominent frameless logo icon dimensions
  const iconSizes = {
    sm: 38,
    md: 48,
    lg: 60,
  };

  const textSizes = {
    sm: { title: '15px', sub: '10px' },
    md: { title: '18px', sub: '11px' },
    lg: { title: '22px', sub: '12px' },
  };

  const s = iconSizes[size];
  const t = textSizes[size];

  // Progressive image source fallback list
  const logoSources = [
    '/billing-pro-logo.jpg',
    '/billing-pro-logo.png',
    '/logo.png',
    '/logo.jpg',
    '/favicon.png',
  ];

  const currentSrc = imgErrorCount < logoSources.length ? logoSources[imgErrorCount] : null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? '10px' : '12px', userSelect: 'none' }}>
      {/* Frameless, Clean, Prominent Geometric Logo Emblem (No Box/Border) */}
      <div
        style={{
          width: `${s}px`,
          height: `${s}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {currentSrc ? (
          <img
            src={currentSrc}
            alt="Billing Pro Logo"
            onError={() => setImgErrorCount((prev) => prev + 1)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.08))',
            }}
          />
        ) : (
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Minimalist Geometric POS & Billing Emblem */}
            <path d="M24 16H64C71.732 16 78 22.268 78 30C78 37.732 71.732 44 64 44H24V16Z" fill="#2563EB" />
            <path d="M24 44H68C75.732 44 82 50.268 82 58C82 65.732 75.732 72 68 72H24V44Z" fill="#1D4ED8" />
            <rect x="20" y="16" width="9" height="68" fill="#10B981" />
            <path d="M52 28L70 28M52 35L66 35M52 53L72 53M52 60L64 60" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="38,88 48,74 43,74 48,60 34,76 41,76" fill="#F59E0B" />
          </svg>
        )}
      </div>

      {!iconOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: t.title,
              fontWeight: 850,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
            }}
          >
            Billing <span style={{ color: '#2563EB' }}>Pro</span>
          </span>
          <span
            style={{
              fontSize: t.sub,
              color: '#64748B',
              fontWeight: 600,
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
