const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Start server
  const { spawn } = require('child_process');
  const server = spawn('node', ['server.js']);

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log('Testing Home Page...');
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'verify_home.png' });

    console.log('Testing Login UI...');
    await page.goto('http://localhost:3000/login.html');
    await page.screenshot({ path: 'verify_login.png' });

    console.log('Testing Admin Access Protection...');
    await page.goto('http://localhost:3000/admin.html');
    const url = page.url();
    console.log('Admin redirected to:', url);
    if (url.includes('index.html')) {
        console.log('Success: Admin page protected.');
    } else {
        console.log('Failure: Admin page NOT protected!');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    server.kill();
  }
})();
