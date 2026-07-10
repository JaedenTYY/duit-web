/* eslint-disable no-console */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'demo@duit.app');
  await page.fill('input[type="password"]', 'demo');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000); // wait for redirect
  
  const artifactDir = '/Users/jaedenting/.gemini/antigravity-cli/brain/cf9db0e0-c5c0-444a-9082-266b8eec3742';

  // Dashboard
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_dashboard.png'), fullPage: true });

  // Transactions
  await page.goto('http://localhost:5173/transactions');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_transactions.png'), fullPage: true });

  // Insights
  await page.goto('http://localhost:5173/insights');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_insights.png'), fullPage: true });

  // Anomalies / Alerts (if it exists, maybe it's on dashboard or /anomalies)
  await page.goto('http://localhost:5173/anomalies').catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_anomalies.png'), fullPage: true });

  await browser.close();
  console.log("Screenshots captured successfully");
})();
