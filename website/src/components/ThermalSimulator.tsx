import React, { useState } from 'react';

interface ThermalSimulatorProps {
  onSuccess: (title: string, message: string) => void;
}

interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
}

export const ThermalSimulator: React.FC<ThermalSimulatorProps> = ({ onSuccess }) => {
  const [paperWidth, setPaperWidth] = useState<'80' | '58'>('80');
  const [feedKey, setFeedKey] = useState(0);
  const [isCutActive, setIsCutActive] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', name: 'Masala Chai', qty: 2, rate: 20 },
    { id: '2', name: 'Paneer Tikka Roll', qty: 1, rate: 180 },
    { id: '3', name: 'Cold Coffee Frappe', qty: 1, rate: 90 },
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const cgst = Math.round(subtotal * 0.025 * 100) / 100;
  const sgst = Math.round(subtotal * 0.025 * 100) / 100;
  const netTotal = Math.round((subtotal + cgst + sgst) * 100) / 100;

  const handleSimulateFeed = () => {
    setFeedKey((prev) => prev + 1);
    onSuccess(
      'Paper Feed Test',
      `Fed receipt paper roll (${paperWidth}mm roll size).`
    );
  };

  const handleSimulateCut = () => {
    setFeedKey((prev) => prev + 1);
    setIsCutActive(true);
    setTimeout(() => setIsCutActive(false), 900);
    onSuccess(
      'Automatic Paper Cut',
      'Cut thermal receipt paper.'
    );
  };

  const handleAddItem = () => {
    const extraItems = [
      { name: 'Butter Naan', rate: 35 },
      { name: 'Kadhai Paneer', rate: 220 },
      { name: 'Gulab Jamun (2 pcs)', rate: 60 },
      { name: 'Jeera Rice', rate: 120 }
    ];
    const pick = extraItems[Math.floor(Math.random() * extraItems.length)];
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      name: pick.name,
      qty: 1,
      rate: pick.rate
    };
    setItems((prev) => [...prev, newItem]);
    setFeedKey((prev) => prev + 1);
    onSuccess('Item Added to Docket', `Added ${pick.name} (₹${pick.rate}.00) to live receipt.`);
  };

  const handleResetDocket = () => {
    setItems([
      { id: '1', name: 'Masala Chai', qty: 2, rate: 20 },
      { id: '2', name: 'Paneer Tikka Roll', qty: 1, rate: 180 },
      { id: '3', name: 'Cold Coffee Frappe', qty: 1, rate: 90 },
    ]);
    setFeedKey((prev) => prev + 1);
    onSuccess('Docket Reset', 'Thermal receipt reset to initial default order state.');
  };

  return (
    <section id="simulator" className="section">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Interactive Receipt Printing</span>
          </div>
          <h2 className="section-title">See How Your Bills Print with Bharat UPI QR</h2>
          <p className="section-description">
            Test how bills look on paper. Try switching between 2-inch and 3-inch roll sizes, add items to calculate totals in ₹, and test cutting the paper.
          </p>
        </div>

        <div className="simulator-wrap">
          
          {/* Controls Panel */}
          <div className="simulator-controls-panel">
            
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '6px 10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', backgroundColor: '#22C55E' }}></span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)' }}>
                PRINTER READY &bull; NO SETUP REQUIRED
              </span>
            </div>

            <div className="control-group">
              <label className="control-label">Choose Paper Roll Size</label>
              <div className="segmented-control" role="tablist">
                <button
                  type="button"
                  className={`segmented-tab ${paperWidth === '80' ? 'active' : ''}`}
                  onClick={() => setPaperWidth('80')}
                >
                  3-Inch (80mm) Wide Bill
                </button>
                <button
                  type="button"
                  className={`segmented-tab ${paperWidth === '58' ? 'active' : ''}`}
                  onClick={() => setPaperWidth('58')}
                >
                  2-Inch (58mm) Standard Bill
                </button>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Test Printer Actions</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleSimulateFeed} className="btn btn-primary btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="7 13 12 18 17 13"></polyline>
                    <polyline points="7 6 12 11 17 6"></polyline>
                  </svg>
                  <span>Feed Paper</span>
                </button>
                <button type="button" onClick={handleSimulateCut} className="btn btn-secondary btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                  </svg>
                  <span>Cut Bill Paper</span>
                </button>
                <button type="button" onClick={handleAddItem} className="btn btn-green btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Item (+₹)</span>
                </button>
                {items.length > 3 && (
                  <button type="button" onClick={handleResetDocket} className="btn btn-secondary btn-sm">
                    <span>Reset Docket</span>
                  </button>
                )}
              </div>
            </div>

            {/* Simple Printer Benefits */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="control-label">Printer &amp; Receipt Features</span>
              <ul style={{ listStyle: 'none', fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.8 }}>
                <li>&bull; <b>Universal Printer Support</b>: Works with all USB &amp; Bluetooth thermal printers</li>
                <li>&bull; <b>Shop Details &amp; GST</b>: Prints your store name, address, phone &amp; GSTIN</li>
                <li>&bull; <b>Dynamic Bharat UPI QR</b>: Customer scans and pays exact bill amount in seconds</li>
                <li>&bull; <b>Automatic Cash Drawer</b>: Pops open drawer automatically on cash settlement</li>
                <li>&bull; <b>Currency Localized</b>: Formatted in Indian Rupees (&#8377; INR)</li>
              </ul>
            </div>

          </div>

          {/* Realistic Thermal Paper Stage */}
          <div className="thermal-stage">
            <div style={{ width: '100%' }}>
              <div className="printer-head-slot" title="Thermal Printer Mechanism Slot"></div>
              
              <div
                key={feedKey}
                className="thermal-paper"
                style={{
                  width: paperWidth === '80' ? '320px' : '250px',
                  fontSize: paperWidth === '80' ? '11px' : '10px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                }}
              >
                {/* Store Header */}
                <div className="receipt-header">
                  <div className="receipt-store-name">BILLING PRO CAFE &amp; RESTAURANT</div>
                  <div>GSTIN: 27AABCB1234F1Z8</div>
                  <div>High Street Outlet, Counter #01</div>
                  <div>Tel: +91 98765 43210</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                  <span>INVOICE: #BP-2026-1042</span>
                  <span>13-OCT-2026 16:30</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px' }}>
                  <span>ORDER: T-04 (DINE IN)</span>
                  <span>CASHIER: RAHUL M.</span>
                </div>

                <div className="receipt-divider"></div>

                {/* Items Table */}
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>ITEM</th>
                      <th className="text-center">QTY</th>
                      <th className="text-right">AMT (&#8377;)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-right">&#8377;{(item.qty * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="receipt-divider"></div>

                {/* Totals Breakdown */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SUBTOTAL:</span>
                  <span>&#8377;{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST @ 2.5%:</span>
                  <span>&#8377;{cgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST @ 2.5%:</span>
                  <span>&#8377;{sgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', margin: '6px 0', borderTop: '1px dashed #000000', paddingTop: '4px' }}>
                  <span>NET TOTAL:</span>
                  <span>&#8377;{netTotal.toFixed(2)}</span>
                </div>

                <div className="receipt-divider"></div>

                {/* Payment Mode */}
                <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '4px', fontWeight: 700 }}>
                  PAYMENT MODE: DYNAMIC BHARAT UPI
                </div>

                {/* Realistic Bharat UPI QR Code */}
                <div className="receipt-qr-wrap">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      margin: '0 auto',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #000000',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Realistic High-Density QR Vector Matrix */}
                    <svg
                      width="108"
                      height="108"
                      viewBox="0 0 29 29"
                      fill="#000000"
                      shapeRendering="crispEdges"
                    >
                      {/* Top-Left Finder Pattern (7x7 outer, 5x5 white, 3x3 black) */}
                      <rect x="0" y="0" width="7" height="7" fill="#000" />
                      <rect x="1" y="1" width="5" height="5" fill="#FFF" />
                      <rect x="2" y="2" width="3" height="3" fill="#000" />

                      {/* Top-Right Finder Pattern */}
                      <rect x="22" y="0" width="7" height="7" fill="#000" />
                      <rect x="23" y="1" width="5" height="5" fill="#FFF" />
                      <rect x="24" y="2" width="3" height="3" fill="#000" />

                      {/* Bottom-Left Finder Pattern */}
                      <rect x="0" y="22" width="7" height="7" fill="#000" />
                      <rect x="1" y="23" width="5" height="5" fill="#FFF" />
                      <rect x="2" y="24" width="3" height="3" fill="#000" />

                      {/* Horizontal Timing Pattern */}
                      <rect x="7" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="8" y="6" width="1" height="1" fill="#000" />
                      <rect x="9" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="10" y="6" width="1" height="1" fill="#000" />
                      <rect x="11" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="12" y="6" width="1" height="1" fill="#000" />
                      <rect x="13" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="14" y="6" width="1" height="1" fill="#000" />
                      <rect x="15" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="16" y="6" width="1" height="1" fill="#000" />
                      <rect x="17" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="18" y="6" width="1" height="1" fill="#000" />
                      <rect x="19" y="6" width="1" height="1" fill="#FFF" />
                      <rect x="20" y="6" width="1" height="1" fill="#000" />
                      <rect x="21" y="6" width="1" height="1" fill="#FFF" />

                      {/* Vertical Timing Pattern */}
                      <rect x="6" y="8" width="1" height="1" fill="#000" />
                      <rect x="6" y="10" width="1" height="1" fill="#000" />
                      <rect x="6" y="12" width="1" height="1" fill="#000" />
                      <rect x="6" y="14" width="1" height="1" fill="#000" />
                      <rect x="6" y="16" width="1" height="1" fill="#000" />
                      <rect x="6" y="18" width="1" height="1" fill="#000" />
                      <rect x="6" y="20" width="1" height="1" fill="#000" />

                      {/* Alignment Pattern (around 20,20) */}
                      <rect x="18" y="18" width="5" height="5" fill="#000" />
                      <rect x="19" y="19" width="3" height="3" fill="#FFF" />
                      <rect x="20" y="20" width="1" height="1" fill="#000" />

                      {/* Authentic QR Data Modules */}
                      <rect x="8" y="1" width="2" height="1" fill="#000" />
                      <rect x="11" y="0" width="1" height="2" fill="#000" />
                      <rect x="13" y="1" width="2" height="1" fill="#000" />
                      <rect x="16" y="0" width="1" height="3" fill="#000" />
                      <rect x="18" y="2" width="2" height="1" fill="#000" />

                      <rect x="8" y="3" width="1" height="2" fill="#000" />
                      <rect x="10" y="4" width="3" height="1" fill="#000" />
                      <rect x="14" y="3" width="2" height="2" fill="#000" />
                      <rect x="18" y="4" width="1" height="2" fill="#000" />
                      <rect x="20" y="3" width="1" height="1" fill="#000" />

                      <rect x="0" y="8" width="2" height="1" fill="#000" />
                      <rect x="3" y="8" width="2" height="2" fill="#000" />
                      <rect x="1" y="11" width="3" height="1" fill="#000" />
                      <rect x="4" y="12" width="1" height="3" fill="#000" />
                      <rect x="1" y="15" width="2" height="2" fill="#000" />
                      <rect x="4" y="17" width="2" height="1" fill="#000" />
                      <rect x="2" y="19" width="2" height="2" fill="#000" />

                      <rect x="8" y="8" width="2" height="2" fill="#000" />
                      <rect x="11" y="9" width="3" height="1" fill="#000" />
                      <rect x="15" y="8" width="2" height="1" fill="#000" />
                      <rect x="24" y="8" width="2" height="2" fill="#000" />
                      <rect x="27" y="9" width="1" height="3" fill="#000" />

                      <rect x="8" y="11" width="3" height="1" fill="#000" />
                      <rect x="13" y="11" width="1" height="3" fill="#000" />
                      <rect x="15" y="11" width="2" height="2" fill="#000" />
                      <rect x="22" y="11" width="3" height="1" fill="#000" />

                      {/* Center UPI Badge Overlay */}
                      <rect x="11" y="12" width="7" height="5" fill="#FFF" />
                      <rect x="11.5" y="12.5" width="6" height="4" fill="#000" />
                      <text x="14.5" y="15.8" fill="#FFF" fontSize="3" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                        UPI
                      </text>

                      {/* Lower Data Modules */}
                      <rect x="8" y="15" width="2" height="2" fill="#000" />
                      <rect x="18" y="14" width="2" height="2" fill="#000" />
                      <rect x="24" y="14" width="3" height="1" fill="#000" />
                      <rect x="26" y="16" width="2" height="2" fill="#000" />

                      <rect x="8" y="18" width="1" height="3" fill="#000" />
                      <rect x="10" y="19" width="3" height="1" fill="#000" />
                      <rect x="14" y="18" width="2" height="2" fill="#000" />
                      <rect x="25" y="19" width="2" height="2" fill="#000" />

                      <rect x="8" y="23" width="2" height="1" fill="#000" />
                      <rect x="11" y="22" width="2" height="3" fill="#000" />
                      <rect x="14" y="24" width="3" height="2" fill="#000" />
                      <rect x="18" y="25" width="2" height="1" fill="#000" />
                      <rect x="22" y="24" width="4" height="1" fill="#000" />
                      <rect x="27" y="23" width="1" height="4" fill="#000" />
                    </svg>
                  </div>
                  
                  <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '6px', letterSpacing: '0.04em' }}>
                    SCAN &amp; PAY: &#8377;{netTotal.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '8px', color: '#334155', marginTop: '2px' }}>
                    GPAY &bull; PHONEPE &bull; PAYTM &bull; BHIM
                  </div>
                </div>

                {/* Tear / Cut Line */}
                <div
                  id="receiptCutLine"
                  className="receipt-divider"
                  style={{
                    borderTop: '2px dashed #000000',
                    borderColor: isCutActive ? '#DC2626' : '#000000',
                    transition: 'border-color 0.3s ease',
                    margin: '10px 0'
                  }}
                ></div>
                
                <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600 }}>
                  THANK YOU &bull; VISIT AGAIN!
                </div>
                <div style={{ textAlign: 'center', fontSize: '8px', color: '#64748B', marginTop: '2px' }}>
                  POWERED BY BILLING PRO POS (100% FREE &amp; OPEN SOURCE)
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
