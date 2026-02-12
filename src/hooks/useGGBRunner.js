import { useState, useRef, useCallback } from 'react';
import { parseCommandsWithLineIndex } from '../lib/code';

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
    if (!ggbApplet || isRunning) {
      return;
    }

    const commands = parseCommandsWithLineIndex(code);
    if (commands.length === 0) {
      return;
    }

    abortRef.current = false;
    setIsRunning(true);
    setProgress({ current: 0, total: commands.length });

    try {
      ggbApplet.reset();
    } catch (error) {
      console.warn('重置画布失败:', error);
    }

    for (let i = 0; i < commands.length; i += 1) {
      if (abortRef.current) {
        break;
      }

      const { line, index } = commands[i];
      setCurrentLine(index);
      setProgress({ current: i + 1, total: commands.length });

      try {
        ggbApplet.evalCommand(line);
      } catch (error) {
        console.warn(`执行指令失败 [行 ${index + 1}]:`, line, error);
      }

      if (i < commands.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
      }
    }

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
      } catch (error) {
        console.warn('重置画布失败:', error);
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

