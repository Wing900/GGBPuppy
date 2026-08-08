import puppeteer from 'puppeteer-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
const btn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.title === '设置'));
if (btn) await btn.click();
await new Promise(r => setTimeout(r, 1500));
const r = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('[class*="px-8"], [class*="p-8"]'));
  return els.slice(0,4).map(e => {
    const s = getComputedStyle(e);
    return { cls: e.className.slice(0,40), pad: `${s.paddingTop}|${s.paddingLeft}` };
  });
});
console.log(JSON.stringify(r,null,2));
try { await browser.close(); } catch(e){}
