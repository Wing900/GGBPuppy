// 模块级缓存：GGB 命令数据（从分类文件树加载合并）
let ggbCommandsCache = null;
let ggbCommandsPromise = null;

/**
 * 加载 GeoGebra 命令数据并合并去重。
 *
 * 数据源是 public/ggbcommands/ 下的分类文件树：
 * - index.json：分类目录（id / label / file / commands）
 * - {category}.json：每类一个 [{ n, s }] 命令签名数组
 *
 * 返回扁平数组 [{ n, s }]（去重同名命令、合并签名），与 searchGgbCommands
 * 的输入格式一致。带模块级缓存，避免重复网络请求。
 *
 * @returns {Promise<Array<{ n: string, s: string[] }>>}
 */
export async function loadGgbCommands() {
  if (ggbCommandsCache) return ggbCommandsCache;
  if (!ggbCommandsPromise) {
    ggbCommandsPromise = (async () => {
      const indexRes = await fetch('/ggbcommands/index.json');
      if (!indexRes.ok) {
        throw new Error(`加载 GGB 命令目录失败: ${indexRes.status}`);
      }
      const index = await indexRes.json();

      // 并行加载所有分类文件
      const categories = await Promise.all(
        index.map(async (cat) => {
          const res = await fetch(`/ggbcommands/${cat.file}`);
          if (!res.ok) {
            throw new Error(`加载 GGB 分类文件失败: ${cat.file} (${res.status})`);
          }
          return res.json();
        })
      );

      // 合并去重同名命令
      const byName = new Map();
      for (const cmds of categories) {
        for (const { n, s } of cmds) {
          if (!byName.has(n)) byName.set(n, { n, s: new Set() });
          for (const sig of s) byName.get(n).s.add(sig);
        }
      }
      ggbCommandsCache = [...byName.values()].map((c) => ({ n: c.n, s: [...c.s] }));
      return ggbCommandsCache;
    })();
  }
  return ggbCommandsPromise;
}
