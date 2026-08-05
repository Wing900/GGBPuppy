import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// 独立于 vite.config.js 的测试配置：
// - jsdom 环境（hook / 组件测试需要 DOM）
// - globals 开启（describe/it/expect 免 import）
// - 测试文件约定：src/**/*.test.{js,jsx}
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}']
  }
});
