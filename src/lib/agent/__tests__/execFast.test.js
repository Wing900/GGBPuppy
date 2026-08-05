import { describe, it, expect } from 'vitest';
import { execFast } from '../execFast';

/**
 * 构造一个可控的 fake ggbApplet。
 * @param {object} opts
 * @param {Record<string, boolean>} [opts.results] - 每条指令预期的 evalCommand 返回值
 * @param {string} [opts.error] - getError 返回值
 */
function makeFakeApplet({ results = {}, error = null } = {}) {
  const calls = [];
  return {
    calls,
    evalCommand: (cmd) => {
      calls.push(cmd);
      return results[cmd] ?? true;
    },
    getError: () => error
  };
}

describe('execFast', () => {
  it('空代码返回 ok，total=0', () => {
    const applet = makeFakeApplet();
    const res = execFast(applet, '');
    expect(res).toMatchObject({ ok: true, total: 0, succeeded: 0, failed: [] });
  });

  it('忽略注释与空行', () => {
    const applet = makeFakeApplet();
    const res = execFast(applet, '\n// 注释\nA=(0,0)\n\n');
    expect(res.total).toBe(1);
    expect(res.succeeded).toBe(1);
    expect(applet.calls).toEqual(['A=(0,0)']);
  });

  it('全部成功时 ok=true', () => {
    const applet = makeFakeApplet({ results: { 'A=(0,0)': true, 'B=(4,0)': true } });
    const res = execFast(applet, 'A=(0,0)\nB=(4,0)');
    expect(res).toMatchObject({ ok: true, total: 2, succeeded: 2, failed: [] });
    expect(res.executed.map((e) => e.command)).toEqual(['A=(0,0)', 'B=(4,0)']);
  });

  it('失败不中断，记录 failed 与 error', () => {
    const applet = makeFakeApplet({
      results: { 'A=(0,0)': true, 'BadCmd()': false },
      error: 'Unknown command'
    });
    const res = execFast(applet, 'A=(0,0)\nBadCmd()');
    expect(res.ok).toBe(false);
    expect(res.total).toBe(2);
    expect(res.succeeded).toBe(1);
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0]).toMatchObject({ line: 2, index: 1, command: 'BadCmd()', error: 'Unknown command' });
    expect(res.executed).toHaveLength(2);
  });

  it('evalCommand 抛异常时记为失败，不中断', () => {
    const applet = {
      evalCommand: (cmd) => {
        if (cmd === 'Crash()') throw new Error('boom');
        return true;
      },
      getError: () => null
    };
    const res = execFast(applet, 'A=(0,0)\nCrash()\nB=(1,1)');
    expect(res.succeeded).toBe(2);
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0].command).toBe('Crash()');
  });

  it('getError 无返回值时用兜底文案', () => {
    const applet = makeFakeApplet({ results: { 'X()': false }, error: null });
    const res = execFast(applet, 'X()');
    expect(res.failed[0].error).toBe('evalCommand failed');
  });

  it('ggbApplet 为 null 时不崩溃，全部记为失败', () => {
    const res = execFast(null, 'A=(0,0)');
    expect(res.ok).toBe(false);
    expect(res.failed).toHaveLength(1);
  });
});
