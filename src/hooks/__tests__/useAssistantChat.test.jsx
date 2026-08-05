import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useAssistantChat, { createDefaultReplyer } from '../useAssistantChat';

describe('createDefaultReplyer', () => {
  it('返回包含输入内容的回复', async () => {
    const replyer = createDefaultReplyer();
    const reply = await replyer('画一个三角形');
    expect(reply).toContain('画一个三角形');
  });
});

describe('useAssistantChat', () => {
  it('初始为收起状态、无消息', () => {
    const { result } = renderHook(() => useAssistantChat());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('open / close / toggle 切换展开状态', () => {
    const { result } = renderHook(() => useAssistantChat());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it('send 添加用户消息，并在回复器返回后添加助手消息', async () => {
    const replyer = vi.fn(async () => '收到');
    const { result } = renderHook(() => useAssistantChat({ replyer }));

    await act(async () => {
      await result.current.send('画个圆');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: '画个圆'
    });
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: '收到'
    });
    expect(replyer).toHaveBeenCalledWith('画个圆');
  });

  it('空白输入不发送', async () => {
    const replyer = vi.fn(async () => 'x');
    const { result } = renderHook(() => useAssistantChat({ replyer }));

    await act(async () => {
      await result.current.send('   ');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(replyer).not.toHaveBeenCalled();
  });

  it('send 期间 isTyping 为 true，完成后为 false', async () => {
    let resolveReply;
    const replyer = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        })
    );
    const { result } = renderHook(() => useAssistantChat({ replyer }));

    let promise;
    act(() => {
      promise = result.current.send('慢回复');
    });
    expect(result.current.isTyping).toBe(true);

    await act(async () => {
      resolveReply('完成');
      await promise;
    });

    expect(result.current.isTyping).toBe(false);
    await waitFor(() =>
      expect(result.current.messages).toHaveLength(2)
    );
  });

  it('setReplyer 可运行时替换回复器', async () => {
    const first = vi.fn(async () => '一');
    const second = vi.fn(async () => '二');
    const { result } = renderHook(() => useAssistantChat({ replyer: first }));

    act(() => result.current.setReplyer(second));

    await act(async () => {
      await result.current.send('hi');
    });

    expect(second).toHaveBeenCalledWith('hi');
    expect(first).not.toHaveBeenCalled();
  });

  it('回复器抛错时 isTyping 复位且不追加消息', async () => {
    const replyer = vi.fn(async () => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useAssistantChat({ replyer }));

    await act(async () => {
      await result.current.send('hi');
    });

    expect(result.current.isTyping).toBe(false);
    expect(result.current.messages).toHaveLength(1); // 只有 user 消息
  });
});
