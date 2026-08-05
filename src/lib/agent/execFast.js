import { parseCommandsWithLineIndex } from '../code';

/**
 * 无延时逐行执行 GeoGebra 指令，收集每行成功/失败。
 * 给 agent 的 run_code 工具用（区别于人类慢动作演示的 useGGBRunner.run）。
 *
 * 纯函数：只依赖传入的 ggbApplet 实例，不持有全局状态，便于单元测试。
 *
 * @param {object} ggbApplet - GeoGebra applet 实例（必须已就绪）
 * @param {string} code - GeoGebra 指令文本（可含 // 注释与空行）
 * @returns {{
 *   ok: boolean,
 *   total: number,
 *   succeeded: number,
 *   failed: Array<{ line: number, index: number, command: string, error: string }>,
 *   executed: Array<{ index: number, command: string, error?: string }>
 * }}
 *   - ok: 全部成功为 true
 *   - 失败不中断，继续执行后续行
 *   - 不调用 ggbApplet.reset()（由调用方决定是否先 reset）
 */
export function execFast(ggbApplet, code) {
  const commands = parseCommandsWithLineIndex(code);
  const failed = [];
  const executed = [];
  let succeeded = 0;

  for (const { line, index } of commands) {
    const ok = executeLine(ggbApplet, line);

    if (ok) {
      succeeded += 1;
      executed.push({ index, command: line });
    } else {
      const error = readGgbError(ggbApplet) || 'evalCommand failed';
      failed.push({ line: index + 1, index, command: line, error });
      executed.push({ index, command: line, error });
    }
  }

  return {
    ok: failed.length === 0,
    total: commands.length,
    succeeded,
    failed,
    executed
  };
}

function executeLine(ggbApplet, line) {
  if (!ggbApplet || typeof ggbApplet.evalCommand !== 'function') {
    return false;
  }
  try {
    // evalCommand 返回 boolean（true 成功）；个别实现返回 undefined 视为成功
    return ggbApplet.evalCommand(line) !== false;
  } catch {
    return false;
  }
}

function readGgbError(ggbApplet) {
  if (!ggbApplet || typeof ggbApplet.getError !== 'function') {
    return null;
  }
  try {
    const err = ggbApplet.getError();
    return err ? String(err) : null;
  } catch {
    return null;
  }
}
