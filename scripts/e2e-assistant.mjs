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
    if (msg.type() === 'error') console.log('[console.error]', msg.text().slice(0, 300));
  });

  // 抓所有非 2xx 响应
  page.on('response', (res) => {
    const s = res.status();
    if (s >= 300) {
      res.text().then((t) => console.log(`[http ${s}] ${res.url().slice(0,80)} => ${t.slice(0,200)}`)).catch(()=>{});
    }
  });

  console.log('loading', FRONT_URL);
  await page.goto(FRONT_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. 点击圆形 logo FAB
  await page.waitForSelector('button[title="GGBPuppy 助手"]', { timeout: 15000 });
  await page.click('button[title="GGBPuppy 助手"]');
  console.log('FAB clicked, waiting for panel...');
  await new Promise((r) => setTimeout(r, 1500));

  // 2. 找 CopilotChat 的输入框（面板后渲染，选最后一个 textarea；避免选到代码编辑器）
  const handles = await page.$$('textarea');
  console.log('textarea count:', handles.length);
  if (!handles.length) {
    console.log('NO textarea found - dumping body');
    console.log(await page.evaluate(() => document.body.innerText.slice(-500)));
  }
  const target = handles[handles.length - 1];
  await target.click();
  await target.type('Reply with exactly the single word HELLO', { delay: 5 });

  // 3. 发送（Enter）
  await page.keyboard.press('Enter');
  console.log('sent, waiting for reply (up to 90s)...');

  // 4. 轮询等待回复出现或错误出现
  let found = '';
  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    if (bodyText.toLowerCase().includes('non-uint8array') || bodyText.toLowerCase().includes('agent execution failed')) {
      found = 'ERROR: ' + bodyText.slice(-400);
      break;
    }
    if (bodyText.toLowerCase().includes('hello') || bodyText.toLowerCase().includes('circumcircle')) {
      found = 'REPLY: ' + bodyText.slice(-400);
      break;
    }
  }

  // 截图 + 输出页面文本
  await page.screenshot({ path: '/tmp/e2e_chat.png' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== PAGE TEXT FULL ===');
  console.log(text);
  console.log('=== RESULT:', found || 'NO REPLY / NO ERROR (timeout)');
  console.log('HELLO in body:', text.toLowerCase().includes('hello'));
} finally {
  await browser.close();
}
