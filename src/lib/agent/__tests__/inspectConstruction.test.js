import { describe, it, expect } from 'vitest';
import { inspectConstruction } from '../inspectConstruction';

describe('inspectConstruction', () => {
  it('ggbApplet 为 null 返回 ready=false', () => {
    const res = inspectConstruction(null);
    expect(res).toMatchObject({ ready: false, objectCount: 0, objects: [] });
  });

  it('读取对象清单与定义串', () => {
    const applet = {
      getAllObjectNames: () => ['A', 'B', 'c'],
      getCommandString: (name) => `${name} = Point`,
      getObjectType: (name) => (name === 'c' ? 'circle' : 'point'),
      getVisible: (name) => name !== 'c'
    };
    const res = inspectConstruction(applet);
    expect(res.ready).toBe(true);
    expect(res.objectCount).toBe(3);
    expect(res.objects[0]).toMatchObject({
      name: 'A',
      commandString: 'A = Point',
      type: 'point',
      visible: true
    });
    expect(res.objects[2]).toMatchObject({ name: 'c', type: 'circle', visible: false });
  });

  it('部分方法缺失时对应字段为 null，不崩溃', () => {
    const applet = {
      getAllObjectNames: () => ['A'],
      getCommandString: undefined,
      getObjectType: () => 'point',
      getVisible: () => true
    };
    const res = inspectConstruction(applet);
    expect(res.objects[0]).toMatchObject({ name: 'A', commandString: null, type: 'point', visible: true });
  });

  it('getAllObjectNames 抛错时返回 error 字段', () => {
    const applet = {
      getAllObjectNames: () => {
        throw new Error('boom');
      }
    };
    const res = inspectConstruction(applet);
    expect(res).toMatchObject({ ready: true, objectCount: 0, objects: [], error: 'getAllObjectNames failed' });
  });
});
