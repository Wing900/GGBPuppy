import { describe, it, expect } from 'vitest';
import { levenshtein, searchGgbCommands } from '../searchGgbCommands';

// 测试数据：模拟 ggb_brain_slim.json 去重后的结构
const commands = [
  { n: 'Circle', s: ['Circle( <Point>, <Radius Number> )', 'Circle( <Point>, <Segment> )'] },
  { n: 'CircumcircularArc', s: ['CircumcircularArc( <Point>, <Point>, <Point> )'] },
  { n: 'CircumcircularSector', s: ['CircumcircularSector( <Point>, <Point>, <Point> )'] },
  { n: 'Incircle', s: ['Incircle( <Point>, <Point>, <Point> )'] },
  { n: 'SetColor', s: ['SetColor( <Object>, <Red>, <Green>, <Blue> )'] },
  { n: 'Midpoint', s: ['Midpoint( <Point>, <Point> )'] },
  { n: 'PerpendicularBisector', s: ['PerpendicularBisector( <Segment> )'] },
  { n: 'Polygon', s: ['Polygon( <Point>, <Point>, <Point> )'] },
  { n: 'Solve', s: ['Solve( <Equation> )'] },
  { n: 'Mean', s: ['Mean( <List of Numbers> )'] }
];

describe('levenshtein', () => {
  it('相同字符串距离 0', () => {
    expect(levenshtein('circle', 'circle')).toBe(0);
  });
  it('空串距离为另一串长度', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });
  it('替换计 1', () => {
    expect(levenshtein('kitten', 'sitten')).toBe(1);
  });
  it('经典 kitten/sitting 距离 3', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });
  it('circumcircle 到 circle 距离 6（删 circum）', () => {
    expect(levenshtein('circumcircle', 'circle')).toBe(6);
  });
});

describe('searchGgbCommands 三级匹配', () => {
  it('空 query 返回 none', () => {
    expect(searchGgbCommands(commands, '  ').match).toBe('none');
  });

  it('精确匹配命令名（大小写不敏感）', () => {
    const r = searchGgbCommands(commands, 'circle');
    expect(r.match).toBe('exact');
    expect(r.results[0].n).toBe('Circle');
  });

  it('签名内关键词匹配', () => {
    const r = searchGgbCommands(commands, 'Radius Number');
    expect(r.match).toBe('keyword');
    expect(r.results.some((x) => x.n === 'Circle')).toBe(true);
  });

  it('编辑距离兜底：circumcircle 命中拼写最近的命令', () => {
    const r = searchGgbCommands(commands, 'circumcircle');
    expect(r.match).toBe('fuzzy');
    // 编辑距离找拼写最近：Incircle（共享 circle 后缀，距离 5）
    // 而非 CircumcircularArc（距离 6）。agent 需看签名判断语义。
    expect(r.results[0].n).toBe('Incircle');
    expect(r.results[0].distance).toBe(5);
    expect(r.results.some((x) => x.n === 'CircumcircularArc')).toBe(true);
    expect(typeof r.results[0].distance).toBe('number');
  });

  it('编辑距离返回前 fuzzyLimit 个', () => {
    const r = searchGgbCommands(commands, 'circumcircle', { fuzzyLimit: 3 });
    expect(r.results.length).toBeLessThanOrEqual(3);
  });

  it('完全无命中返回 none', () => {
    const r = searchGgbCommands(commands, 'zzzzzzzz');
    expect(r.match).toBe('none');
    expect(r.results).toEqual([]);
  });
});
