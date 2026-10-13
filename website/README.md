# Billing Pro POS — Official Marketing Website & Download Portal

> **Industrial Utility Web Portal & Distribution Hub**  
> **Theme**: Light Mode Only | Non-AI Color System | Native OS Typography | 0px Border-Radius  
> **Standard**: Pure Architectural Precision strictly following `DESIGN.md`

---

## 1. Overview & Contents

This folder contains the complete, production-ready React 19 website for Billing Pro POS:

- `index.html`: Web application mount with optimized SEO tags and official branding.
- `src/`: Multi-page React application components (`Hero`, `Features`, `ThermalSimulator`, `Downloads`, `Contact`, `FaqAccordion`, `VideoDemo`).
- `404.html`: Custom error page with quick return links.
- `css/style.css`: Clean, modular stylesheet implementing the exact color tokens, 0px border-radius standard, and mechanical tactile micro-animations from `DESIGN.md`. Zero external Google web fonts or AI gradients.
- `downloads/`:
  - `Billing_Pro_POS_Setup_v1.0.0.exe`: Windows Setup Installer.
  - `Billing_Pro_v1.0.apk`: Universal Android Package.
- `assets/`:
  - `demo/`: Real demonstration video (`billing_pos_demo.mp4`).
  - `brand/`: Official logos and SVGs (`logo.png`, `billing-pro-logo.png`, `favicon.svg`).

---

## 2. Serving Locally

You can serve this static website using any HTTP server:

```bash
# Using Python
cd website
python -m http.server 8080

# Using Node.js (npx serve)
npx serve website -p 8080
```
Then navigate to `http://localhost:8080`.
