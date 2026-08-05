import { defineConfig } from 'vitest/config';

// agent 后端测试配置：node 环境，只测 src/**/*.test.js
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
});
