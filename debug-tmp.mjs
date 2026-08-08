import puppeteer from 'puppeteer-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
// 找 FAB（title=GGBPuppy 助手）
const fab = await page.$('button[title="GGBPuppy 助手"]');
if (!fab) { console.log('FAB not found'); process.exit(0); }
// 点击 FAB（无移动）
await fab.click();
await new Promise(r => setTimeout(r, 1200));
// 检查对话框是否展开（含 CopilotChat）
const open = await page.evaluate(() => {
  return !!Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('GGBPuppy 助手') && getComputedStyle(d).position === 'fixed' && parseFloat(getComputedStyle(d).width) > 300);
});
console.log('对话框展开:', open);
// 再点一次关闭
await fab.click();
await new Promise(r => setTimeout(r, 800));
const closed = await page.evaluate(() => {
  return !Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('GGBPuppy 助手') && getComputedStyle(d).position === 'fixed' && parseFloat(getComputedStyle(d).width) > 300);
});
console.log('对话框关闭:', closed);
try { await browser.close(); } catch(e){}
