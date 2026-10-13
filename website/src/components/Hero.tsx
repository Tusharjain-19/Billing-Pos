import React, { useState, useEffect } from 'react';

interface HeroProps {
  onDownloadTrigger: (filename: string) => void;
  onNavigatePage: (page: string) => void;
}

interface CartItem {
  id: string;
  name: string;
  rate: number;
  qty: number;
}

export const Hero: React.FC<HeroProps> = ({ onDownloadTrigger, onNavigatePage }) => {
  const [stationMode, setStationMode] = useState<'pc' | 'mobile'>('pc');
  const [activeCategory, setActiveCategory] = useState<'all' | 'meals' | 'fastfood' | 'beverages'>('all');
  const [typingIndex, setTypingIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [settledNotice, setSettledNotice] = useState<string | null>(null);

  // Live Interactive Cart Items inside Hero
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Paneer Tikka Roll', rate: 180, qty: 1 },
    { id: '2', name: 'Butter Naan (2 pcs)', rate: 70, qty: 2 },
    { id: '3', name: 'Cold Coffee Frappe', rate: 80, qty: 1 },
  ]);

  const allDishes = [
    { name: 'Masala Dosa', rate: 90, cat: 'fastfood' },
    { name: 'Paneer Tikka Roll', rate: 180, cat: 'fastfood' },
    { name: 'Special Veg Thali', rate: 250, cat: 'meals' },
    { name: 'Cold Coffee Frappe', rate: 80, cat: 'beverages' },
    { name: 'Butter Naan (2 pcs)', rate: 70, cat: 'meals' },
    { name: 'Gulab Jamun (2 pcs)', rate: 60, cat: 'beverages' },
  ];

  const filteredDishes = activeCategory === 'all'
    ? allDishes
    : allDishes.filter((d) => d.cat === activeCategory);

  const handleAddDish = (dish: { name: string; rate: number }) => {
    setSettledNotice(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.name === dish.name);
      if (existing) {
        return prev.map((item) =>
          item.name === dish.name ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: Date.now().toString(), name: dish.name, rate: dish.rate, qty: 1 }];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setSettledNotice(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveDish = (id: string) => {
    setSettledNotice(null);
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSettle = (mode: 'cash' | 'upi') => {
    if (cart.length === 0) return;
    const billTotal = netTotal.toFixed(2);
    setSettledNotice(`Bill #1043 Settled via ${mode === 'cash' ? 'Cash' : 'Bharat UPI'} (₹${billTotal}) & Printed!`);
    setTimeout(() => {
      setCart([
        { id: '1', name: 'Masala Dosa', rate: 90, qty: 1 },
        { id: '2', name: 'Cold Coffee Frappe', rate: 80, qty: 1 },
      ]);
      setSettledNotice(null);
    }, 2800);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.rate * item.qty, 0);
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const netTotal = Math.round((subtotal + gst) * 100) / 100;

  const phrases = [
    'FAST 5-SECOND COUNTER BILLING',
    'WORKS 100% OFFLINE',
    'ANY THERMAL RECEIPT PRINTER',
    '100% FREE FOREVER'
  ];

  useEffect(() => {
    const currentPhrase = phrases[typingIndex];
    const typingSpeed = isDeleting ? 30 : 65;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setTypedText(currentPhrase.substring(0, typedText.length + 1));
        if (typedText.length + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        setTypedText(currentPhrase.substring(0, typedText.length - 1));
        if (typedText.length - 1 === 0) {
          setIsDeleting(false);
          setTypingIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, typingIndex]);

  return (
    <section id="overview" className="hero-section" style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', padding: '56px 0 44px' }}>
      
      {/* Top Architectural Badge */}
      <div className="container" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div className="hero-pill-badge" style={{ margin: 0, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontWeight: 800 }}>100% FREE &amp; OPEN SOURCE POS &bull; </span>
            <span className="typing-text-wrap" style={{ color: '#1E293B', fontWeight: 700 }}>{typedText}</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#475569', fontWeight: 600 }}>
            <span className="pulse-dot" style={{ width: '7px', height: '7px', backgroundColor: '#22C55E' }}></span>
            <span>100% OFFLINE &bull; ZERO INTERNET NEEDED &bull; INDIAN RUPEE (&#8377;)</span>
          </div>
        </div>
      </div>

      <div className="container hero-grid">
        
        {/* Left Hero Column */}
        <div className="hero-text-block">
          
          <h1 className="hero-headline" style={{ fontSize: '40px', fontWeight: 900, lineHeight: 1.15, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: '16px' }}>
            Fast, Simple Billing Software for Restaurants, Cafes &amp; Retail Shops.
          </h1>

          <p className="hero-subheadline" style={{ fontSize: '15px', lineHeight: 1.65, color: '#475569', marginBottom: '28px', maxWidth: '620px' }}>
            Make and print bills in under 5 seconds, accept instant dynamic Bharat UPI QR payments, and print on any 2&quot; or 3&quot; thermal receipt printer. Completely offline, super easy to operate, and 100% free forever with zero monthly charges.
          </p>

          {/* 2 High-Contrast Hardware Download Stations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            
            {/* Tile 1: Windows Setup */}
            <a
              href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe"
              className="download-tile"
              download
              onClick={() => onDownloadTrigger('Billing_Pro_POS_Setup_v1.0.0.exe')}
              style={{
                backgroundColor: '#0F172A',
                border: '2px solid #1E293B',
                color: '#FFFFFF',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textDecoration: 'none',
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)',
              }}
            >
              <div style={{ width: '40px', height: '40px', backgroundColor: '#1E293B', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#38BDF8' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Download Windows PC (.EXE)
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94A3B8', marginTop: '2px' }}>
                  1-Click Setup &bull; 215 MB &bull; Windows 10 &amp; 11
                </span>
              </div>
            </a>

            {/* Tile 2: Android APK */}
            <a
              href="downloads/Billing_Pro_v1.0.apk"
              className="download-tile"
              download
              onClick={() => onDownloadTrigger('Billing_Pro_v1.0.apk')}
              style={{
                backgroundColor: '#15803D',
                border: '2px solid #166534',
                color: '#FFFFFF',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textDecoration: 'none',
                boxShadow: '0 6px 16px rgba(21, 128, 61, 0.14)',
              }}
            >
              <div style={{ width: '40px', height: '40px', backgroundColor: '#166534', border: '1px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#86EFAC' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.551 0 .9992.4476.9992.9993s-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.5511 0 .9993.4476.9993.9993s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.996-3.4565c.0836-.1446.0341-.3291-.1105-.4127-.1446-.0836-.3291-.0341-.4127.1105l-2.025 3.5068c-1.3789-.6286-2.9161-.9796-4.5293-.9796-1.6133 0-3.1504.351-4.5293.9796l-2.025-3.5068c-.0836-.1446-.2681-.1941-.4127-.1105-.1446.0836-.1941.2681-.1105.4127l1.996 3.4565c-3.1706 1.728-5.3262 5.0342-5.4678 8.8719h18.6882c-.1416-3.8377-2.2972-7.1439-5.4677-8.8719"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Download Android App (.APK)
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#DCFCE7', marginTop: '2px' }}>
                  Simple App &bull; 12.5 MB &bull; Phones &amp; Sunmi POS
                </span>
              </div>
            </a>

          </div>

          {/* Clean Secondary Navigation Buttons (NO BROWSER DEMO, NO EMOJIS) */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => onNavigatePage('features')}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '9px 16px' }}
            >
              <span>Explore Features &amp; Workflow</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage('printer')}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '9px 16px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Test Receipt Printing</span>
            </button>

            <a
              href="https://www.tusharjain.in/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '9px 16px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Contact Developer (tusharjain.in)</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>

          {/* 4 Enhanced Metric Highlights with Dedicated Pure SVG Icons */}
          <div className="hero-highlights-strip" style={{ backgroundColor: '#FFFFFF', padding: '16px', border: '1px solid #CBD5E1' }}>
            
            <div className="highlight-box" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#15803D' }}>
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
                <span className="highlight-value" style={{ fontSize: '18px', color: '#0F172A' }}>100% Offline</span>
              </div>
              <div className="highlight-label">No Internet Needed</div>
            </div>

            <div className="highlight-box" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#2563EB' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span className="highlight-value" style={{ fontSize: '18px', color: '#0F172A' }}>&lt; 5 Seconds</span>
              </div>
              <div className="highlight-label">Fast Counter Billing</div>
            </div>

            <div className="highlight-box" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#475569' }}>
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span className="highlight-value" style={{ fontSize: '18px', color: '#0F172A' }}>2&quot; &amp; 3&quot; Rolls</span>
              </div>
              <div className="highlight-label">Any Thermal Printer</div>
            </div>

            <div className="highlight-box" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#15803D' }}>
                  <path d="M6 3h12"/>
                  <path d="M6 8h12"/>
                  <path d="M6 13l8.5 8"/>
                  <path d="M6 13h3a4 4 0 0 0 0-8"/>
                </svg>
                <span className="highlight-value" style={{ fontSize: '18px', color: '#15803D' }}>&#8377;0 Forever</span>
              </div>
              <div className="highlight-label">100% Free &amp; Open Source</div>
            </div>

          </div>

        </div>

        {/* Right Hero Visual: Live Interactive POS Counter Terminal */}
        <div className="hero-terminal-container">
          <div className="hero-terminal-card" style={{ backgroundColor: '#FFFFFF', border: '2px solid #0F172A', boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)' }}>
            
            {/* Terminal Top Hardware Bezel */}
            <div className="terminal-header-bar" style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="terminal-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#22C55E', display: 'inline-block' }}></span>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#38BDF8', display: 'inline-block' }}></span>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', display: 'inline-block' }}></span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', color: '#F8FAFC' }}>
                  {stationMode === 'pc' ? 'BILLING PRO STATION #01 (TAP DISHES TO TEST)' : 'MOBILE SMART POS (TABLE-SIDE PREVIEW)'}
                </span>
              </div>

              {/* Station Perspective Switcher */}
              <div className="terminal-switcher" role="tablist" style={{ border: '1px solid #334155' }}>
                <button
                  type="button"
                  className={`terminal-switch-btn ${stationMode === 'pc' ? 'active' : ''}`}
                  onClick={() => setStationMode('pc')}
                  style={{
                    backgroundColor: stationMode === 'pc' ? '#2563EB' : '#1E293B',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  PC Counter
                </button>
                <button
                  type="button"
                  className={`terminal-switch-btn ${stationMode === 'mobile' ? 'active' : ''}`}
                  onClick={() => setStationMode('mobile')}
                  style={{
                    backgroundColor: stationMode === 'mobile' ? '#2563EB' : '#1E293B',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Mobile POS
                </button>
              </div>
            </div>

            {/* Interactive Mockup Body */}
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC' }}>
              
              {stationMode === 'pc' ? (
                <div>
                  
                  {/* Category Filter Tabs */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {[
                      { id: 'all', label: 'All Items' },
                      { id: 'fastfood', label: 'Fast Food' },
                      { id: 'meals', label: 'Meals' },
                      { id: 'beverages', label: 'Beverages' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id as any)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: activeCategory === cat.id ? '#0F172A' : '#FFFFFF',
                          color: activeCategory === cat.id ? '#FFFFFF' : '#475569',
                          border: '1px solid #CBD5E1',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* 6 Quick Dish Selection Buttons */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                      {filteredDishes.map((dish, dIdx) => (
                        <button
                          key={dIdx}
                          type="button"
                          onClick={() => handleAddDish(dish)}
                          style={{
                            padding: '8px 10px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#0F172A',
                            transition: 'all 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#2563EB';
                            e.currentTarget.style.backgroundColor = '#EFF6FF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#22C55E' }}></span>
                            {dish.name}
                          </span>
                          <span style={{ color: '#15803D', fontWeight: 800 }}>+&#8377;{dish.rate}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Bill Docket */}
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '12px', marginBottom: '12px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>INVOICE #BP-1043</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', border: '1px solid #86EFAC' }}>
                        TABLE 04 (DINE IN)
                      </span>
                    </div>

                    {/* Interactive Item Rows */}
                    <div style={{ maxHeight: '115px', overflowY: 'auto' }}>
                      {cart.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                          Cart is empty. Tap any dish above to add to bill!
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '5px', paddingBottom: '4px', borderBottom: '1px dashed #F1F5F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.name}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Quantity Stepper */}
                              <div style={{ display: 'inline-flex', border: '1px solid #CBD5E1' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.id, -1)}
                                  style={{ padding: '2px 6px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                                  title="Reduce quantity"
                                >
                                  -
                                </button>
                                <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 700, backgroundColor: '#FFFFFF' }}>
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.id, 1)}
                                  style={{ padding: '2px 6px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              <span style={{ fontWeight: 800, color: '#0F172A', minWidth: '45px', textAlign: 'right' }}>
                                &#8377;{item.qty * item.rate}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveDish(item.id)}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '14px', padding: '0 4px', fontWeight: 700 }}
                                title="Remove item"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bill Totals Breakdown */}
                    <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: '8px', marginTop: '6px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: '2px' }}>
                        <span>Subtotal:</span>
                        <span>&#8377;{subtotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: '4px' }}>
                        <span>CGST + SGST (5%):</span>
                        <span>&#8377;{gst.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, color: '#15803D', borderTop: '1px solid #E2E8F0', paddingTop: '4px' }}>
                        <span>TOTAL PAYABLE:</span>
                        <span>&#8377;{netTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Settlement Notification Banner */}
                  {settledNotice && (
                    <div style={{ padding: '8px 12px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontSize: '11px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>{settledNotice}</span>
                    </div>
                  )}

                  {/* Interactive Settlement Buttons (PURE SVG - NO EMOJIS) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleSettle('cash')}
                      disabled={cart.length === 0}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#15803D',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: cart.length === 0 ? 0.6 : 1,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="2" y="6" width="20" height="12" rx="0"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                        <path d="M6 12h.01M18 12h.01"></path>
                      </svg>
                      <span>CASH SETTLE (F12)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSettle('upi')}
                      disabled={cart.length === 0}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: cart.length === 0 ? 0.6 : 1,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      <span>DYNAMIC BHARAT UPI QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Mobile POS View (Pure Vector HTML - NO EMOJIS) */
                <div style={{ maxWidth: '290px', margin: '0 auto', backgroundColor: '#FFFFFF', border: '2px solid #0F172A', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em' }}>
                      HANDHELD ANDROID TERMINAL
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '1px 6px' }}>
                      BLUETOOTH LINKED
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '11px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>1 &times; Paneer Tikka Roll</span>
                      <b>&#8377;180.00</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>2 &times; Cold Coffee Frappe</span>
                      <b>&#8377;160.00</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>1 &times; Masala Dosa</span>
                      <b>&#8377;90.00</b>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#166534', display: 'block', fontWeight: 700 }}>TOTAL AMOUNT DUE (₹)</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#15803D' }}>&#8377;430.00</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSettle('cash')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#15803D',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    <span>PRINT BLUETOOTH RECEIPT</span>
                  </button>
                </div>
              )}

            </div>

            {/* Hotspots Footer with Pure SVG Checkmarks */}
            <div className="hero-hotspots" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div className="hotspot-tag" style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#15803D' }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Instant 1-Click Billing</span>
              </div>
              <div className="hotspot-tag" style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#2563EB' }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Dynamic Bharat UPI QR</span>
              </div>
              <div className="hotspot-tag" style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#15803D' }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Any Thermal Printer</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
