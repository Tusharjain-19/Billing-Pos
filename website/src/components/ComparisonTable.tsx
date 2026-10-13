import React from 'react';

export const ComparisonTable: React.FC = () => {
  return (
    <section id="specs" className="section">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Simple Comparison</span>
          </div>
          <h2 className="section-title">Billing Pro POS vs Paid Cloud Billing Apps</h2>
          <p className="section-description">
            See why shopkeepers and restaurant owners choose Billing Pro over expensive monthly subscription software.
          </p>
        </div>

        <div className="table-wrap">
          <table className="table-industrial">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Feature</th>
                <th style={{ width: '36%' }}>Billing Pro POS</th>
                <th style={{ width: '36%' }}>Typical Paid Cloud Billing Apps</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Internet Requirement</b></td>
                <td className="cell-highlight">Works 100% Offline (Zero internet needed)</td>
                <td className="cell-negative">Must have 24/7 internet (Stops when Wi-Fi cuts)</td>
              </tr>
              <tr>
                <td><b>Monthly Cost</b></td>
                <td className="cell-highlight">&#8377;0 / month (100% Free &amp; Open Source Forever)</td>
                <td className="cell-negative">&#8377;1,500 &ndash; &#8377;5,000 every month per counter</td>
              </tr>
              <tr>
                <td><b>Billing &amp; Print Speed</b></td>
                <td className="cell-highlight">Instant print in &lt;1 second directly to printer</td>
                <td className="cell-negative">Slow browser popup window and cloud loading lag</td>
              </tr>
              <tr>
                <td><b>Where Data is Kept</b></td>
                <td className="cell-highlight">Saved safely on your own computer or phone</td>
                <td className="cell-negative">Uploaded to third-party cloud servers</td>
              </tr>
              <tr>
                <td><b>UPI QR on Receipts</b></td>
                <td className="cell-highlight">Free built-in UPI QR (PhonePe, GPay, Paytm)</td>
                <td className="cell-negative">Often charged as a costly extra add-on</td>
              </tr>
              <tr>
                <td><b>Hidden Renewal Fees</b></td>
                <td className="cell-highlight">Zero renewal fees, zero license expiration</td>
                <td className="cell-negative">Annual AMC renewals and locked data if unpaid</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};
