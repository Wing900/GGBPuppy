import { useState, useRef, useCallback } from 'react';

/**
 * 慢动作执行 GeoGebra 指令的 Hook
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @returns {object} 执行状态和控制函数
 */
const useGGBRunner = (ggbApplet) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [progress, setProgress] = useState(null);

  const abortRef = useRef(false);

  /**
   * 执行代码
   * @param {string} code - GeoGebra 指令代码
   * @param {number} interval - 执行间隔（秒）
   */
  const run = useCallback(async (code, interval) => {
    if (!ggbApplet || isRunning) return;

    // 解析指令行（过滤空行和注释）
    const commands = code
      .split('\n')
      .map((line, index) => {
        const commentIndex = line.indexOf('//');
        const trimmed = (commentIndex === -1 ? line : line.slice(0, commentIndex)).trim();
        return { line: trimmed, index };
      })
      .filter(({ line }) => line !== '');

    if (commands.length === 0) return;

    // 重置状态
    abortRef.current = false;
    setIsRunning(true);
    setProgress({ current: 0, total: commands.length });

    // 重置画布
    try {
      ggbApplet.reset();
    } catch (e) {
      console.warn('重置画布失败:', e);
    }

    // 逐行执行
    for (let i = 0; i < commands.length; i++) {
      if (abortRef.current) break;

      const { line, index } = commands[i];
      setCurrentLine(index);
      setProgress({ current: i + 1, total: commands.length });

      try {
        ggbApplet.evalCommand(line);
      } catch (e) {
        console.warn(`执行指令失败 [行 ${index + 1}]:`, line, e);
      }

      // 等待间隔
      if (i < commands.length - 1) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
      }
    }

    // 执行完毕
    setIsRunning(false);
    setCurrentLine(-1);
    setProgress(null);
  }, [ggbApplet, isRunning]);

  /**
   * 停止执行
   */
  const stop = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    setCurrentLine(-1);
    setProgress(null);
  }, []);

  /**
   * 重置画布
   */
  const reset = useCallback(() => {
    if (ggbApplet && !isRunning) {
      try {
        ggbApplet.reset();
      } catch (e) {
        console.warn('重置画布失败:', e);
      }
    }
  }, [ggbApplet, isRunning]);

  return {
    isRunning,
    currentLine,
    progress,
    run,
    stop,
    reset
  };
};

export default useGGBRunner;

