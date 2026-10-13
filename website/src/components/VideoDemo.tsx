import React, { useRef, useState } from 'react';

export const VideoDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeChapter, setActiveChapter] = useState<number>(0);

  const chapters = [
    { time: 0, label: '0. Industrial POS Intro', desc: 'Welcome to Billing Pro POS • Industrial speed & offline-first architecture' },
    { time: 5.45, label: '1. Rapid Touch Billing', desc: 'Categorized menus, live GST computation & parcel packaging surcharges' },
    { time: 16.25, label: '2. Kitchen Order (KOT)', desc: 'One-tap KOT dispatch with automated table routing & takeaway tags' },
    { time: 23.59, label: '3. Cash, Card & Bharat UPI', desc: 'Exact cash change calculation, card swipe & dynamic on-screen UPI QR' },
    { time: 32.81, label: '4. Bluetooth Thermal Print', desc: 'Sub-second ESC/POS receipt dispatch & sequential tax invoice ledger' },
    { time: 41.38, label: '5. Statutory GST Reports', desc: 'GSTR-1 ready tax breakdown, sales velocity & dining rush heatmaps' },
  ];

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const jumpToTime = (seconds: number, index: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (!isPlaying) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    setActiveChapter(index);
  };

  return (
    <section id="demo-video" className="section" style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Section Header - High Contrast Light Mode */}
        <div className="section-head">
          <div className="section-pretitle" style={{ color: 'var(--accent-green)', backgroundColor: 'var(--accent-green-light)', borderColor: '#86EFAC' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Live Software Demo &amp; Indian English Voiceover</span>
          </div>
          <h2 className="section-title">See How Fast &amp; Simple Industrial Billing Really Is</h2>
          <p className="section-description">
            Watch real dish punching, dynamic Bharat UPI QR settlement, sub-second thermal printing, and offline statutory GST reports in action.
          </p>
        </div>

        {/* Industrial Light Mode Window Frame adhering strictly to DESIGN.md */}
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto 32px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
            borderRadius: '0px',
          }}
        >
          {/* Light Mode Window Chrome Title Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            {/* Window Dots & Monospace Title */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#EF4444', display: 'inline-block' }}></span>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#F59E0B', display: 'inline-block' }}></span>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10B981', display: 'inline-block' }}></span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#111827', marginLeft: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
                BILLING PRO POS &bull; INDUSTRIAL REAL SOFTWARE DEMO
              </span>
            </div>

            {/* Offline & Ready Pill (Light Green) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0FDF4', padding: '3px 8px', border: '1px solid #86EFAC' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: '#15803D' }}></span>
              <span style={{ fontSize: '10px', color: '#15803D', fontWeight: 700 }}>100% OFFLINE READY</span>
            </div>
          </div>

          {/* Video Container in Light Frame */}
          <div style={{ position: 'relative', width: '100%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={videoRef}
              src="assets/demo/billing_pos_demo.mp4?v=2"
              poster="assets/demo/billing_pos_demo.jpg?v=2"
              playsInline
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={() => {
                if (!videoRef.current) return;
                const ct = videoRef.current.currentTime;
                if (ct < 5.45) setActiveChapter(0);
                else if (ct < 16.25) setActiveChapter(1);
                else if (ct < 23.59) setActiveChapter(2);
                else if (ct < 32.81) setActiveChapter(3);
                else if (ct < 41.38) setActiveChapter(4);
                else setActiveChapter(5);
              }}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '560px' }}
            />

            {/* Overlay Play Button when paused */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlayToggle}
                aria-label="Play Product Demo Video"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '76px',
                  height: '76px',
                  backgroundColor: 'rgba(21, 128, 61, 0.95)',
                  border: '2px solid #FFFFFF',
                  color: '#FFFFFF',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  transition: 'transform 0.1s ease',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
            )}
          </div>

          {/* Light Mode Player Controls & Timeline */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handlePlayToggle}
                className="btn btn-sm btn-green"
                style={{ padding: '6px 14px', borderRadius: '0px' }}
              >
                {isPlaying ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span>Play Video</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleMuteToggle}
                className="btn btn-sm"
                style={{ padding: '6px 12px', backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '0px' }}
              >
                {isMuted ? 'Unmute Audio' : 'Mute Audio'}
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
              <span>High Definition 1080p &bull; Light Mode Industrial Architecture</span>
            </div>
          </div>

          {/* Light Mode Chapter Quick Jump Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1px',
              backgroundColor: '#E5E7EB',
              borderTop: '1px solid #E5E7EB',
            }}
          >
            {chapters.map((chap, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => jumpToTime(chap.time, idx)}
                style={{
                  padding: '12px 14px',
                  backgroundColor: activeChapter === idx ? '#F0FDF4' : '#FFFFFF',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  borderBottom: activeChapter === idx ? '3px solid #15803D' : '3px solid transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: activeChapter === idx ? '#15803D' : '#111827', marginBottom: '4px' }}>
                  {chap.label}
                </div>
                <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: 1.4 }}>
                  {chap.desc}
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* 4 Value Highlights Below Video with Pure SVG Icons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Sub-Second Counter Billing</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
              Tap dishes to add, enter quantity, and print. No delays or lags even with lines of customers.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-blue)' }}>
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dynamic Bharat UPI QR</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
              Exact bill amount encoded in QR code. Customers scan &amp; pay via PhonePe, Google Pay, or Paytm.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-green)' }}>
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Any Thermal Printer</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
              Plug and play with any standard 2-inch (58mm) or 3-inch (80mm) printer via USB or Bluetooth.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#059669' }}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Daily Sales &amp; Income in &#8377;</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
              Check daily cash collection, UPI totals, sales count, and tax reports instantly with zero cloud dependence.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
