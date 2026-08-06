import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { execFast } from '../lib/agent/execFast';
import { inspectConstruction } from '../lib/agent/inspectConstruction';

/**
 * 注册 4 个前端工具，让 CopilotKit agent 能读写/执行/查看 GeoGebra 画布。
 * 纯接线层：不持有 ggbApplet / 编辑器状态，副作用全部通过注入的回调访问，
 * 便于解耦、测试与复用。
 *
 * 工具契约：
 * - read_code            读取当前编辑器脚本
 * - write_code           把脚本写入编辑器（不执行）
 * - run_code             在画布上执行脚本（可先 reset，收集逐行失败）
 * - inspect_construction 读取画布对象清单
 *
 * @param {{
 *   getGgbApplet: () => object | null,
 *   getCode: () => string,
 *   setCode: (code: string) => void
 * }} deps 注入的运行环境访问器
 */
export function useGgbAgentTools({ getGgbApplet, getCode, setCode }) {
  useFrontendTool({
    name: 'read_code',
    description:
      '读取当前编辑器中的 GeoGebra 脚本代码。无参数。返回 { ok, code }。',
    parameters: z.object({}),
    handler: async () => {
      try {
        return { ok: true, code: getCode() };
      } catch (error) {
        return { ok: false, error: String(error?.message || error) };
      }
    }
  });

  useFrontendTool({
    name: 'write_code',
    description:
      '把 GeoGebra 脚本代码写入编辑器（只写不执行）。参数 code：要写入的完整脚本字符串。返回 { ok, codeLength }。',
    parameters: z.object({ code: z.string() }),
    handler: async ({ code }) => {
      try {
        setCode(code);
        return { ok: true, codeLength: code.length };
      } catch (error) {
        return { ok: false, error: String(error?.message || error) };
      }
    }
  });

  useFrontendTool({
    name: 'run_code',
    description:
      '在 GeoGebra 画布上执行脚本代码，逐行执行并收集失败（不中断）。可选参数 code（缺省用编辑器当前代码）、reset（是否先清空画布）。返回 { ok, total, succeeded, failed }。',
    parameters: z.object({
      code: z.string().optional(),
      reset: z.boolean().optional()
    }),
    handler: async ({ code, reset }) => {
      const applet = getGgbApplet();
      if (!applet || typeof applet.evalCommand !== 'function') {
        return { ok: false, error: 'GeoGebra applet 未就绪' };
      }
      try {
        if (reset) {
          applet.reset();
        }
        const result = execFast(applet, code ?? getCode());
        return {
          ok: result.ok,
          total: result.total,
          succeeded: result.succeeded,
          failed: result.failed
        };
      } catch (error) {
        return { ok: false, error: String(error?.message || error) };
      }
    }
  });

  useFrontendTool({
    name: 'inspect_construction',
    description:
      '读取当前 GeoGebra 画布上所有对象的清单（名称、定义串、类型、可见性）。无参数。返回 { ready, objectCount, objects }。',
    parameters: z.object({}),
    handler: async () => {
      const applet = getGgbApplet();
      if (!applet) {
        return { ready: false, objectCount: 0, objects: [] };
      }
      try {
        return inspectConstruction(applet);
      } catch (error) {
        return { ok: false, error: String(error?.message || error) };
      }
    }
  });
}
