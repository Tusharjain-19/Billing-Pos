import React from 'react';

export const Features: React.FC = () => {
  return (
    <section id="features" className="section section-alt">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span>Everything Your Shop Needs</span>
          </div>
          <h2 className="section-title">Built for Busy Counters &amp; Peak Rush Hours</h2>
          <p className="section-description">
            Cloud billing apps slow down or freeze when internet cuts. Billing Pro runs completely on your own computer or mobile, keeping your billing lines moving fast.
          </p>
        </div>

        <div className="features-grid">
          
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
            </div>
            <h3 className="feature-title">Works 100% Offline (No Internet Needed)</h3>
            <p className="feature-body">
              Never worry about broadband cuts or Wi-Fi drops. All your menu items, customer bills, and daily sales records stay safe on your computer with zero cloud dependency.
            </p>
            <div className="feature-meta-tag">
              <span>WORKS WITHOUT INTERNET &bull; SAFE LOCAL DATA</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </div>
            <h3 className="feature-title">Prints on Any Thermal Receipt Printer</h3>
            <p className="feature-body">
              Instant printing on 2-inch (58mm) and 3-inch (80mm) thermal printers via USB or Bluetooth. Prints shop name, GSTIN, items, totals in &#8377;, and automatically cuts the paper.
            </p>
            <div className="feature-meta-tag">
              <span>SUPPORTS 2&quot; &amp; 3&quot; ROLL PRINTERS &bull; USB / BLUETOOTH</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <h3 className="feature-title">Instant Bharat UPI QR Payments</h3>
            <p className="feature-body">
              Generates an exact-amount UPI QR code on the billing screen and prints it directly on the paper receipt. Customers scan with PhonePe, Google Pay, or Paytm and pay in seconds.
            </p>
            <div className="feature-meta-tag">
              <span>PHONEPE &bull; GPAY &bull; PAYTM &bull; ZERO TRANSACTION FEES</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="0"></rect>
                <line x1="6" y1="8" x2="8" y2="8"></line>
                <line x1="10" y1="8" x2="12" y2="8"></line>
                <line x1="14" y1="8" x2="16" y2="8"></line>
                <line x1="18" y1="8" x2="18" y2="8"></line>
                <line x1="6" y1="12" x2="8" y2="12"></line>
                <line x1="10" y1="12" x2="14" y2="12"></line>
                <line x1="16" y1="12" x2="18" y2="12"></line>
              </svg>
            </div>
            <h3 className="feature-title">Super Fast Counter Billing (&lt;5 Sec)</h3>
            <p className="feature-body">
              Touch dish buttons or use fast keyboard shortcut keys to punch orders, calculate totals, and print receipts without touching the mouse. Clear customers in rush hours with ease.
            </p>
            <div className="feature-meta-tag">
              <span>ONE-TOUCH DISH BUTTONS &bull; FAST SHORTCUT KEYS</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">GST Invoices &amp; Bill History</h3>
            <p className="feature-body">
              Automatic calculation of CGST and SGST taxes in &#8377;. View any past invoice, reprint duplicate bills with one click, or export reports to Excel and PDF for your accountant.
            </p>
            <div className="feature-meta-tag">
              <span>GST TAX CALCULATION &bull; 1-CLICK EXCEL EXPORT</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3 className="feature-title">Daily Cash, UPI &amp; Profit Reports in &#8377;</h3>
            <p className="feature-body">
              Close your register with complete peace of mind. Instant reports show total daily collection, cash in the drawer, UPI money received, and your top-selling food items in Rupees.
            </p>
            <div className="feature-meta-tag">
              <span>DAILY SALES &bull; CASH IN DRAWER &bull; TOP DISHES</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
