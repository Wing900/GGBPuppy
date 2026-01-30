import { useState, useEffect, useCallback } from 'react';

/**
 * 暗黑模式切换 Hook
 * @returns {object} 暗黑模式状态和切换函数
 */
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    // 优先读取本地存储
    const stored = localStorage.getItem('ggbpuppy-dark-mode');
    if (stored !== null) {
      return stored === 'true';
    }
    // 否则跟随系统偏好
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  // 应用暗黑模式到 DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ggbpuppy-dark-mode', String(isDark));
  }, [isDark]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handler = (e) => {
      // 仅当用户没有手动设置时跟随系统
      const stored = localStorage.getItem('ggbpuppy-dark-mode');
      if (stored === null) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  return { isDark, toggle };
};

export default useDarkMode;
