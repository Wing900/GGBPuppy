import puppeteer from 'puppeteer-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
await page.click('button[title="GGBPuppy 助手"]');
await new Promise(r => setTimeout(r, 1500));
// 发一条消息
const ta = await page.$$('textarea');
const target = ta[ta.length - 1];
await target.click();
await target.type('hi', { delay: 5 });
await page.keyboard.press('Enter');
await new Promise(r => setTimeout(r, 12000)); // 等回复
// 查消息 DOM 类名
const info = await page.evaluate(() => {
  const out = [];
  // 找含消息文本的元素
  const all = Array.from(document.querySelectorAll('[data-copilotkit] div, [data-copilotkit] [class*="message"]'));
  const seen = new Set();
  for (const el of all) {
    const cls = el.className;
    if (typeof cls === 'string' && /message|bubble|assistant|user/i.test(cls) && !seen.has(cls)) {
      seen.add(cls);
      out.push(cls.slice(0, 80));
    }
  }
  return out.slice(0, 15);
});
console.log(JSON.stringify(info, null, 2));
try { await browser.close(); } catch(e){}
