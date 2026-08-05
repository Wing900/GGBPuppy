/**
 * 读取当前画布的对象清单与定义串，供 agent 「看」画布状态。
 * 纯函数：只依赖传入的 ggbApplet 实例，便于单元测试。
 *
 * @param {object} ggbApplet - GeoGebra applet 实例（可为 null）
 * @returns {{
 *   ready: boolean,
 *   objectCount: number,
 *   objects: Array<{ name: string, commandString: string, type: string, visible: boolean }>,
 *   error?: string
 * }}
 */
export function inspectConstruction(ggbApplet) {
  if (!ggbApplet) {
    return { ready: false, objectCount: 0, objects: [] };
  }

  let names;
  try {
    names = ggbApplet.getAllObjectNames?.() || [];
  } catch (e) {
    return {
      ready: true,
      objectCount: 0,
      objects: [],
      error: 'getAllObjectNames failed'
    };
  }

  const objects = names.map((name) => ({
    name,
    commandString: safeGet(() => ggbApplet.getCommandString?.(name, false)),
    type: safeGet(() => ggbApplet.getObjectType?.(name)),
    visible: safeGet(() => ggbApplet.getVisible?.(name))
  }));

  return { ready: true, objectCount: names.length, objects };
}

function safeGet(fn) {
  try {
    const value = fn();
    return value ?? null;
  } catch {
    return null;
  }
}
