import { describe, it, expect } from 'vitest';
import worker from '../index.js';

const env = {
  OPENAI_API_KEY: 'sk-test',
  OPENAI_BASE_URL: 'https://api.example.com/v1',
  OPENAI_MODEL: 'deepseek-chat'
};

describe('worker fetch 集成冒烟', () => {
  it('OPTIONS 预检请求返回 CORS 头（cors: true 生效）', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/copilotkit', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:5173' }
      }),
      env
    );
    expect(res).toBeInstanceOf(Response);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  it('POST /api/copilotkit 不抛异常并返回 Response（装配正确）', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/copilotkit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
        body: JSON.stringify({})
      }),
      env
    );
    expect(res).toBeInstanceOf(Response);
  });
});
