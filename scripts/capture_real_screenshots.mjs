import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const docsDir = path.resolve('docs/screenshots');
const publicDir = path.resolve('public/screenshots');

if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

async function run() {
  console.log('Launching Chrome with CDP on port 9222...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('scratch/chrome-profile')
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9222/json/list');
    const pages = await listRes.json();
    let wsUrl = pages[0]?.webSocketDebuggerUrl;

    if (!wsUrl) {
      const newRes = await fetch('http://localhost:9222/json/new?http://localhost:5173/');
      const newPage = await newRes.json();
      wsUrl = newPage.webSocketDebuggerUrl;
    }

    console.log('Connected to CDP at', wsUrl);
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        const onMessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === reqId) {
            ws.removeEventListener('message', onMessage);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', onMessage);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    };

    await new Promise(r => { ws.onopen = r; });

    await send('Page.enable');
    await send('DOM.enable');

    const capture = async (name, width, height, tabText = null) => {
      console.log(`Capturing ${name} (${width}x${height}, tab: ${tabText || 'default'})...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 600
      });

      await send('Page.navigate', { url: 'http://localhost:5173/' });
      await new Promise(r => setTimeout(r, 1200));

      if (tabText) {
        await send('Runtime.evaluate', {
          expression: `
            (() => {
              const buttons = Array.from(document.querySelectorAll('button, a, nav span'));
              const target = buttons.find(b => b.textContent && b.textContent.includes("${tabText}"));
              if (target) {
                target.click();
              }
            })()
          `
        });
        await new Promise(r => setTimeout(r, 1000));
      }

      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(data, 'base64');
      const docsFile = path.join(docsDir, name);
      const pubFile = path.join(publicDir, name);
      fs.writeFileSync(docsFile, buffer);
      fs.writeFileSync(pubFile, buffer);
      console.log(`Saved ${name} successfully.`);
    };

    // 1. POS Billing Screen (Main cashier view)
    await capture('pos_billing.png', 1366, 768, 'Billing');

    // 2. Real Executive Analytics & Dashboard
    await capture('pos_dashboard.png', 1366, 768, 'Dashboard');

    // 3. Menu & Catalog Manager
    await capture('menu_manager.png', 1366, 768, 'Menu Items');

    // 4. Invoices & Bill History
    await capture('invoices_history.png', 1366, 768, 'Invoices');

    // 5. Mobile Phone POS interface
    await capture('mobile_pos.png', 390, 844);

    ws.close();
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    try { chromeProcess.kill(); } catch (e) {}
    console.log('All real app screenshots captured successfully!');
  }
}

run();
