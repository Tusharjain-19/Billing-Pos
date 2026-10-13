import React, { useState } from 'react';

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Does Billing Pro POS really work without internet?',
      a: 'Yes, 100%. You can punch orders, calculate totals, print thermal bills, and manage your inventory completely offline without any internet connection. All your records stay safely on your computer or mobile.'
    },
    {
      q: 'Is Billing Pro really 100% free forever?',
      a: 'Yes, absolutely. Billing Pro POS is 100% free and open-source software. There are no monthly fees, no annual renewals, no locked features, and no commissions taken on your sales.'
    },
    {
      q: 'How does UPI QR code work if the billing computer has no internet?',
      a: 'The software instantly generates a QR code with your shop UPI ID and the exact bill amount. The customer scans the QR code on the bill or screen with their PhonePe, Google Pay, or Paytm app. Their phone processes the payment directly to your bank account.'
    },
    {
      q: 'Which receipt printers will work with this software?',
      a: 'Any standard 2-inch (58mm) or 3-inch (80mm) thermal printer works effortlessly via USB or Bluetooth. Compatible with TVS, Epson, Everycom, NGX, Retsol, and built-in printers on Sunmi and iMin machines.'
    },
    {
      q: 'How do I install it on my Windows laptop or desktop PC?',
      a: 'Click "Download for Windows PC (.EXE)" in the downloads section. Run the installer file and it will place a ready-to-use shortcut on your desktop. It works smoothly on Windows 10 and Windows 11.'
    },
    {
      q: 'How do I install it on an Android mobile phone or billing terminal?',
      a: 'Download the Android App (.APK) on your phone or tablet and tap it to install. You can immediately start billing and pair with any portable Bluetooth thermal printer.'
    },
    {
      q: 'Can I export daily sales and GST reports for my accountant?',
      a: 'Yes. With one click, you can export your complete daily, weekly, or monthly sales reports to Excel (.xlsx) or PDF, with itemized totals in ₹, CGST/SGST breakdowns, and cash vs UPI totals.'
    }
  ];

  return (
    <section id="faq" className="section section-alt">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Common Questions</span>
          </div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-description">
            Quick answers about offline billing, printer connection, UPI payments, and downloading.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <svg
                    className="faq-chevron"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer">
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
