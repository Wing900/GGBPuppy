import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: 'D:/projects/ggbpuppy/ollama_shot.png' });
console.log('shot saved');
try { await browser.close(); } catch (e) { console.log('close warn:', e.message); }
