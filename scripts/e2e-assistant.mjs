/**
 * 端到端验证：真实浏览器打开前端 → 点圆形 logo → 输入 → 发送 → 读 CopilotChat 回复。
 * 用法：node scripts/e2e-assistant.mjs  （需本地后端 node dev-server.mjs + vite dev 已起）
 */
import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5200/';

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--window-size=1400,900', '--no-sandbox']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 拦截控制台，看前端是否有错误
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[console.error]', msg.text().slice(0, 200));
  });

  console.log('loading', FRONT_URL);
  await page.goto(FRONT_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. 点击圆形 logo FAB
  await page.waitForSelector('button[title="GGBPuppy 助手"]', { timeout: 15000 });
  await page.click('button[title="GGBPuppy 助手"]');
  console.log('FAB clicked, waiting for panel...');
  await new Promise((r) => setTimeout(r, 1500));

  // 2. 找 CopilotChat 的输入框（textarea 或 role=textbox）
  const inputSel = await page.evaluate(() => {
    const els = document.querySelectorAll('textarea, input[type="text"], [role="textbox"]');
    return els.length ? els[els.length - 1].tagName : 'none';
  });
  console.log('input element:', inputSel);

  await page.type('textarea', 'Reply with exactly the single word HELLO', { delay: 10 });

  // 3. 发送（Enter）
  await page.keyboard.press('Enter');
  console.log('sent, waiting for reply (up to 90s)...');

  // 4. 轮询等待回复出现
  let reply = '';
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    if (bodyText.toLowerCase().includes('hello')) {
      reply = bodyText;
      break;
    }
  }

  // 截图 + 输出页面文本
  await page.screenshot({ path: '/tmp/e2e_chat.png' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== PAGE TEXT (tail) ===');
  console.log(text.slice(-1500));
  console.log('=== REPLY FOUND HELLO:', reply.toLowerCase().includes('hello') ? 'YES' : 'NO');
} finally {
  await browser.close();
}
