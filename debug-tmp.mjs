import puppeteer from 'puppeteer-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
const r = await page.evaluate(() => {
  const footer = document.querySelector('footer');
  if (!footer) return { found: false };
  const fs = getComputedStyle(footer);
  const inner = footer.querySelector('div');
  const ins = inner ? getComputedStyle(inner) : null;
  const btn = footer.querySelector('button');
  const bs = btn ? getComputedStyle(btn) : null;
  return {
    footerDisplay: fs.display, footerFlexDir: fs.flexDirection, footerJustify: fs.justifyContent,
    innerDisplay: ins?.display, innerFlexDir: ins?.flexDirection, innerGap: ins?.gap,
    btnDisplay: bs?.display, btnFlexDir: bs?.flexDirection, btnClass: btn?.className.slice(0,50)
  };
});
console.log(JSON.stringify(r,null,2));
await page.screenshot({ path: 'D:/projects/ggbpuppy/debug_shot.png' });
try { await browser.close(); } catch(e){}
