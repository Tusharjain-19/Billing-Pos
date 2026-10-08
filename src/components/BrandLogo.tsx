import React, { useState } from 'react';
import officialLogoImg from '../assets/logo.png';

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
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: 42,
    md: 52,
    lg: 66,
  };

  const textSizes = {
    sm: { title: '15.5px', sub: '10.5px' },
    md: { title: '18.5px', sub: '11px' },
    lg: { title: '23px', sub: '12.5px' },
  };

  const s = iconSizes[size];
  const t = textSizes[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? '10px' : '12px', userSelect: 'none' }}>
      {/* Official Billing Pro Logo (Prominent, High-Res, Transparent) */}
      <div
        style={{
          width: `${s}px`,
          height: `${s}px`,
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={!imgError ? officialLogoImg : './logo.png'}
          alt="Billing Pro Logo"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.06))',
          }}
        />
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
