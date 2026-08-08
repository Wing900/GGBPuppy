import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));

vi.mock('@copilotkit/react-core/v2', () => ({
  useFrontendTool: (...args) => registerMock(...args)
}));

import { useAgentTools } from '../useAgentTools';

function registeredTool(name) {
  return registerMock.mock.calls.map((c) => c[0]).find((t) => t.name === name);
}

function baseDeps(overrides = {}) {
  return {
    getGgbApplet: () => null,
    getCode: () => '',
    setCode: vi.fn(),
    ...overrides
  };
}

describe('useAgentTools', () => {
  beforeEach(() => {
    registerMock.mockClear();
  });

  it('注册 5 个前端工具（read/write/run/inspect/search）', () => {
    renderHook(() => useAgentTools(baseDeps()));
    const names = registerMock.mock.calls.map((c) => c[0].name);
    expect(names).toEqual([
      'read_code',
      'write_code',
      'run_code',
      'search_ggb_commands',
      'inspect_construction'
    ]);
  });

  it('read_code 返回编辑器当前代码', async () => {
    renderHook(() => useAgentTools(baseDeps({ getCode: () => 'A=(1,1)' })));
    const res = await registeredTool('read_code').handler({});
    expect(res).toEqual({ ok: true, code: 'A=(1,1)' });
  });

  it('write_code 把代码写入编辑器', async () => {
    const setCode = vi.fn();
    renderHook(() => useAgentTools(baseDeps({ setCode })));
    const res = await registeredTool('write_code').handler({ code: 'B=(2,2)' });
    expect(setCode).toHaveBeenCalledWith('B=(2,2)');
    expect(res).toEqual({ ok: true, codeLength: 7 });
  });

  it('run_code 在 applet 未就绪时返回错误而非崩溃', async () => {
    renderHook(() => useAgentTools(baseDeps()));
    const res = await registeredTool('run_code').handler({});
    expect(res.ok).toBe(false);
    expect(res.error).toContain('未就绪');
  });

  it('run_code 用 executeGgbCode 逐行执行并上报成功/失败', async () => {
    const applet = { evalCommand: vi.fn(() => true) };
    renderHook(() =>
      useAgentTools(baseDeps({ getGgbApplet: () => applet, getCode: () => 'A=(1,1)' }))
    );
    const res = await registeredTool('run_code').handler({});
    expect(applet.evalCommand).toHaveBeenCalledWith('A=(1,1)');
    expect(res).toMatchObject({ ok: true, total: 1, succeeded: 1 });
  });

  it('run_code 支持 reset 先清空画布', async () => {
    const applet = { evalCommand: vi.fn(() => true), reset: vi.fn() };
    renderHook(() =>
      useAgentTools(baseDeps({ getGgbApplet: () => applet, getCode: () => 'A=(1,1)' }))
    );
    await registeredTool('run_code').handler({ reset: true });
    expect(applet.reset).toHaveBeenCalled();
  });

  it('inspect_construction 读取画布对象清单', async () => {
    const applet = {
      getAllObjectNames: () => ['A'],
      getCommandString: () => 'Point(A)',
      getObjectType: () => 'point',
      getVisible: () => true
    };
    renderHook(() => useAgentTools(baseDeps({ getGgbApplet: () => applet })));
    const res = await registeredTool('inspect_construction').handler({});
    expect(res).toMatchObject({
      ready: true,
      objectCount: 1,
      objects: [{ name: 'A', commandString: 'Point(A)', type: 'point', visible: true }]
    });
  });

  it('inspect_construction 在 applet 缺失时返回 ready:false', async () => {
    renderHook(() => useAgentTools(baseDeps()));
    const res = await registeredTool('inspect_construction').handler({});
    expect(res).toMatchObject({ ready: false, objectCount: 0, objects: [] });
  });

  it('search_ggb_commands 加载命令数据并返回匹配结果', async () => {
    // mock fetch 返回 ggb_brain_slim.json 结构
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { n: 'Circle', s: ['Circle( <Point>, <Radius Number> )'] },
        { n: 'Incircle', s: ['Incircle( <Point>, <Point>, <Point> )'] }
      ]
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderHook(() => useAgentTools(baseDeps()));
      const res = await registeredTool('search_ggb_commands').handler({ query: 'circle' });
      expect(res.match).toBe('exact');
      expect(res.results[0].n).toBe('Circle');
      expect(fetchMock).toHaveBeenCalledWith('/ggbcommands/ggb_brain_slim.json');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('search_ggb_commands 在 fetch 失败时返回错误而非崩溃', async () => {
    // 重置模块以清空 loadGgbCommands 的模块级缓存
    vi.resetModules();
    const { useAgentTools: freshUseAgentTools } = await import('../useAgentTools');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    try {
      renderHook(() => freshUseAgentTools(baseDeps()));
      const res = await registeredTool('search_ggb_commands').handler({ query: 'circle' });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('加载 GGB 命令数据失败');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
