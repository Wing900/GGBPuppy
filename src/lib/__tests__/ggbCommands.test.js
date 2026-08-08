import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadGgbCommands } from '../ggbCommands';

describe('loadGgbCommands', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('从 index.json 读目录并并行加载分类文件，合并去重同名命令', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'geometry', file: 'geometry.json' },
          { id: 'algebra', file: 'algebra.json' }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { n: 'Circle', s: ['Circle( <Point>, <Radius> )'] },
          { n: 'Incircle', s: ['Incircle( <P>, <Q>, <R> )'] }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          // Circle 跨分类重复：应在合并中去重并合并签名
          { n: 'Circle', s: ['Circle( <Center>, <Point> )'] },
          { n: 'Distance', s: ['Distance( <A>, <B> )'] }
        ]
      });

    vi.stubGlobal('fetch', fetchMock);

    const { loadGgbCommands: fresh } = await import('../ggbCommands');
    const result = await fresh();

    expect(fetchMock).toHaveBeenCalledWith('/ggbcommands/index.json');
    expect(fetchMock).toHaveBeenCalledWith('/ggbcommands/geometry.json');
    expect(fetchMock).toHaveBeenCalledWith('/ggbcommands/algebra.json');

    // 合并去重后 3 个唯一命令
    expect(result).toHaveLength(3);
    const circle = result.find((c) => c.n === 'Circle');
    // 签名跨分类合并
    expect(circle.s).toContain('Circle( <Point>, <Radius> )');
    expect(circle.s).toContain('Circle( <Center>, <Point> )');
    expect(result.some((c) => c.n === 'Incircle')).toBe(true);
    expect(result.some((c) => c.n === 'Distance')).toBe(true);
  });

  it('模块级缓存：重复调用不重复 fetch', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    const { loadGgbCommands: fresh } = await import('../ggbCommands');
    await fresh();
    await fresh();

    // index.json 只 fetch 一次（缓存命中）
    const indexCalls = fetchMock.mock.calls.filter((c) => c[0] === '/ggbcommands/index.json');
    expect(indexCalls.length).toBe(1);
  });

  it('index.json 加载失败时抛错', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const { loadGgbCommands: fresh } = await import('../ggbCommands');
    await expect(fresh()).rejects.toThrow('加载 GGB 命令目录失败');
  });
});
