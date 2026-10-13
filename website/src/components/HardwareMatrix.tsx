import React from 'react';

export const HardwareMatrix: React.FC = () => {
  return (
    <section id="hardware" className="section section-alt">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="0"></rect>
              <rect x="2" y="14" width="20" height="8" rx="0"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <span>Hardware Compatibility</span>
          </div>
          <h2 className="section-title">Works with the Hardware You Already Own</h2>
          <p className="section-description">
            No need to buy expensive specialized computers or locked machines. Connect your existing receipt printer, cash drawer, and barcode scanner in minutes.
          </p>
        </div>

        <div className="hardware-grid">
          
          <div className="hw-card">
            <div className="hw-category">Receipt Printers</div>
            <div className="hw-title">2-Inch (58mm) &amp; 3-Inch (80mm) Thermal</div>
            <div className="hw-desc">
              Works with TVS, Epson, Everycom, NGX, Retsol, Bluetooth portable printers, and Sunmi/iMin built-in thermal printers.
            </div>
          </div>

          <div className="hw-card">
            <div className="hw-category">Cash Drawers</div>
            <div className="hw-title">Automatic Drawer Opening</div>
            <div className="hw-desc">
              Connects directly to your thermal printer. Automatically pops open the cash drawer whenever a cash bill is settled.
            </div>
          </div>

          <div className="hw-card">
            <div className="hw-category">Barcode Scanners</div>
            <div className="hw-title">USB &amp; Wireless Barcode Scanners</div>
            <div className="hw-desc">
              Plug-and-play USB laser and 2D QR scanners for super-fast retail item lookup and inventory management.
            </div>
          </div>

          <div className="hw-card">
            <div className="hw-category">Computers &amp; Devices</div>
            <div className="hw-title">Windows PC, Laptops &amp; Android Phones</div>
            <div className="hw-desc">
              Runs smoothly on any Windows 10/11 laptop or desktop, touchscreens, standard Android smartphones, and handheld POS machines.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
