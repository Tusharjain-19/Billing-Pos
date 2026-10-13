import React, { useState } from 'react';

interface ContactProps {
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onShowToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    businessType: 'restaurant',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      if (onShowToast) {
        onShowToast('error', 'Required Fields Missing', 'Please provide your name and phone number.');
      }
      return;
    }

    // Save offline inquiry record
    try {
      const existing = JSON.parse(localStorage.getItem('billingpro_inquiries') || '[]');
      existing.push({ ...formData, timestamp: new Date().toISOString() });
      localStorage.setItem('billingpro_inquiries', JSON.stringify(existing));
    } catch {
      // ignore storage errors
    }

    setIsSubmitted(true);
    if (onShowToast) {
      onShowToast(
        'success',
        'Inquiry Submitted',
        `Thank you ${formData.name}! We have received your query for ${formData.businessName || 'your business'}.`
      );
    }
  };

  return (
    <section id="contact" className="section" style={{ backgroundColor: '#F8FAFC', padding: '40px 0 60px' }}>
      <div className="container">
        
        {/* Section Header */}
        <div className="section-head" style={{ marginBottom: '36px' }}>
          <div className="section-pretitle" style={{ color: 'var(--accent-green)', backgroundColor: 'var(--accent-green-light)', borderColor: '#86EFAC' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Direct Developer &amp; Merchant Support</span>
          </div>
          <h2 className="section-title">Get in Touch with Billing Pro POS</h2>
          <p className="section-description">
            Need assistance installing on your shop computer, setting up your restaurant menu, or configuring your thermal receipt printer? Send a message below or contact us directly.
          </p>
        </div>

        {/* 2-Column Industrial Support Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', maxWidth: '1040px', margin: '0 auto' }}>
          
          {/* Left Column: Interactive In-Page Contact Form */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Send a Message to Developer
              </h3>
            </div>

            {isSubmitted ? (
              <div style={{ padding: '24px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#15803D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#15803D', marginBottom: '8px' }}>
                  Message Recorded Successfully!
                </h4>
                <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, marginBottom: '16px' }}>
                  Your inquiry has been stored locally. You can also visit our official web portal directly:
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="https://www.tusharjain.in/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <span>Open Web Contact Portal &rarr;</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: '', businessName: '', phone: '', businessType: 'restaurant', message: '' });
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Full Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '0px',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                      Shop / Outlet Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="e.g. Anand Sweets &amp; Cafe"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '13px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '0px',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                      Phone / WhatsApp <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '13px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '0px',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Business Category
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '0px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <option value="restaurant">Restaurant / Dining Counter</option>
                    <option value="cafe">Cafe &amp; Quick Service (QSR)</option>
                    <option value="dhaba">Dhaba / Fast Food Corner</option>
                    <option value="bakery">Bakery &amp; Sweet Shop</option>
                    <option value="retail">Grocery / Retail Shop</option>
                    <option value="other">Other Commercial Business</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Questions / Hardware Inquiry
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what help you need (e.g. connecting Sunmi Bluetooth printer, menu import, GST invoices)..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '0px',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-green"
                  style={{ width: '100%', padding: '11px', fontWeight: 700, justifyContent: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Direct Developer Links & Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Card 1: Official Portal Link */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderTop: '4px solid var(--primary)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-blue)' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Official Web Contact Portal
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                Submit formal queries, enterprise custom modules, or partnerships via the official web portal:
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
                https://www.tusharjain.in/contact
              </div>
              <a
                href="https://www.tusharjain.in/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Open tusharjain.in/contact &rarr;</span>
              </a>
            </div>

            {/* Card 2: Developer Portfolio */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderTop: '4px solid var(--accent-green)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-green)' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Developer Portfolio
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                Billing Pro POS is engineered and maintained by <strong>Tushar Jain</strong>. View more software works, tools, and open-source packages:
              </p>
              <a
                href="https://www.tusharjain.in"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Visit Developer Portfolio &rarr;</span>
              </a>
            </div>

            {/* Card 3: GitHub Community & Issue Tracker */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderTop: '4px solid #64748B', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0F172A' }}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Open Source Code &amp; Issues
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                Report bugs, request new POS hardware drivers, or contribute code on GitHub:
              </p>
              <a
                href="https://github.com/Tusharjain-19/Billing-Pos"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>View GitHub Repository &rarr;</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
