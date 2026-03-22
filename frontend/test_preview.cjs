const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  console.log('Starting preview server...');
  const server = exec('npm run preview', { cwd: __dirname });
  
  // Wait a bit for server to start
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`BROWSER WARNING: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`PAGE EXCEPTION: ${err.message}`);
  });

  console.log('Navigating to http://localhost:4173 ...');
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    console.log('Page loaded.');
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log('Failed to load page:', err);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
