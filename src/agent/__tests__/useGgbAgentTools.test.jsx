import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));

vi.mock('@copilotkit/react-core/v2', () => ({
  useFrontendTool: (...args) => registerMock(...args)
}));

import { useGgbAgentTools } from '../useGgbAgentTools';

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

describe('useGgbAgentTools', () => {
  beforeEach(() => {
    registerMock.mockClear();
  });

  it('注册 4 个前端工具（read/write/run/inspect）', () => {
    renderHook(() => useGgbAgentTools(baseDeps()));
    const names = registerMock.mock.calls.map((c) => c[0].name);
    expect(names).toEqual([
      'read_code',
      'write_code',
      'run_code',
      'inspect_construction'
    ]);
  });

  it('read_code 返回编辑器当前代码', async () => {
    renderHook(() => useGgbAgentTools(baseDeps({ getCode: () => 'A=(1,1)' })));
    const res = await registeredTool('read_code').handler({});
    expect(res).toEqual({ ok: true, code: 'A=(1,1)' });
  });

  it('write_code 把代码写入编辑器', async () => {
    const setCode = vi.fn();
    renderHook(() => useGgbAgentTools(baseDeps({ setCode })));
    const res = await registeredTool('write_code').handler({ code: 'B=(2,2)' });
    expect(setCode).toHaveBeenCalledWith('B=(2,2)');
    expect(res).toEqual({ ok: true, codeLength: 7 });
  });

  it('run_code 在 applet 未就绪时返回错误而非崩溃', async () => {
    renderHook(() => useGgbAgentTools(baseDeps()));
    const res = await registeredTool('run_code').handler({});
    expect(res.ok).toBe(false);
    expect(res.error).toContain('未就绪');
  });

  it('run_code 用 execFast 逐行执行并上报成功/失败', async () => {
    const applet = { evalCommand: vi.fn(() => true) };
    renderHook(() =>
      useGgbAgentTools(baseDeps({ getGgbApplet: () => applet, getCode: () => 'A=(1,1)' }))
    );
    const res = await registeredTool('run_code').handler({});
    expect(applet.evalCommand).toHaveBeenCalledWith('A=(1,1)');
    expect(res).toMatchObject({ ok: true, total: 1, succeeded: 1 });
  });

  it('run_code 支持 reset 先清空画布', async () => {
    const applet = { evalCommand: vi.fn(() => true), reset: vi.fn() };
    renderHook(() =>
      useGgbAgentTools(baseDeps({ getGgbApplet: () => applet, getCode: () => 'A=(1,1)' }))
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
    renderHook(() => useGgbAgentTools(baseDeps({ getGgbApplet: () => applet })));
    const res = await registeredTool('inspect_construction').handler({});
    expect(res).toMatchObject({
      ready: true,
      objectCount: 1,
      objects: [{ name: 'A', commandString: 'Point(A)', type: 'point', visible: true }]
    });
  });

  it('inspect_construction 在 applet 缺失时返回 ready:false', async () => {
    renderHook(() => useGgbAgentTools(baseDeps()));
    const res = await registeredTool('inspect_construction').handler({});
    expect(res).toMatchObject({ ready: false, objectCount: 0, objects: [] });
  });
});
