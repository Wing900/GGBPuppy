/**
 * GGB 命令搜索纯函数：三级匹配（精确命令名 → 签名关键词 → 编辑距离）。
 *
 * 不依赖 DOM / fetch，纯输入输出，便于单测。
 *
 * 数据格式：commands = [{ n: 命令名, s: [签名, ...] }]
 * （即 public/ggbcommands/ggb_brain_slim.json 去重后的结构）
 */

/**
 * 计算两个字符串的编辑距离（Levenshtein distance）。
 * 增/删/替换各计 1。经典 DP 实现。
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // 滚动数组：只保留两行
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // 删除
        curr[j - 1] + 1, // 插入
        prev[j - 1] + cost // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * 三级匹配搜索 GGB 命令。
 * @param {Array<{n: string, s: string[]}>} commands 命令数据
 * @param {string} query 搜索关键词（英文）
 * @param {{ fuzzyLimit?: number }} [opts] fuzzyLimit 默认 5
 * @returns {{
 *   match: 'exact' | 'keyword' | 'fuzzy' | 'none',
 *   query: string,
 *   results: Array<{ n: string, s: string[], distance?: number }>
 * }}
 */
export function searchGgbCommands(commands, query, opts = {}) {
  const fuzzyLimit = opts.fuzzyLimit ?? 5;
  const q = String(query || '').trim();
  if (!q) return { match: 'none', query: q, results: [] };

  const qLower = q.toLowerCase();

  // 1. 精确匹配命令名（大小写不敏感）
  const exact = commands.filter((c) => c.n.toLowerCase() === qLower);
  if (exact.length) {
    return { match: 'exact', query: q, results: exact };
  }

  // 2. 签名内关键词匹配（query 出现在某个签名里）
  const keyword = commands.filter((c) =>
    c.s.some((sig) => sig.toLowerCase().includes(qLower))
  );
  if (keyword.length) {
    return { match: 'keyword', query: q, results: keyword };
  }

  // 3. 编辑距离兜底：对每个命令名算距离，取前 fuzzyLimit 个最小的
  const scored = commands
    .map((c) => ({ c, distance: levenshtein(qLower, c.n.toLowerCase()) }))
    .sort((a, b) => a.distance - b.distance || a.c.n.localeCompare(b.c.n))
    .slice(0, fuzzyLimit);

  // 若最小距离 >= query 长度，说明 query 与所有命令名无任何共同字符，视为无命中
  if (scored.length && scored[0].distance < qLower.length) {
    return {
      match: 'fuzzy',
      query: q,
      results: scored.map(({ c, distance }) => ({ n: c.n, s: c.s, distance }))
    };
  }

  return { match: 'none', query: q, results: [] };
}
