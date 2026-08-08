import { useEffect, useRef } from 'react';
import { useAgent } from '@copilotkit/react-core/v2';

/**
 * 前端兜底：监听 agent 消息，提取工具调用里的 GGB 代码写入编辑器。
 *
 * 背景：qwen3.7-plus 等模型在长对话中可能不调用 write_code，而改用
 * CopilotKit 的 AGUISendStateSnapshot（AGUI）工具发代码。AGUI 状态前端
 * 默认不处理，导致代码不执行（"罢工"）。本 hook 兜底：无论 agent 用
 * write_code 还是 AGUISendStateSnapshot，只要工具参数里带 code，就写入编辑器。
 *
 * @param {{ setCode: (code: string) => void }} deps
 */
export function useAgentStateSync({ setCode }) {
  const { agent } = useAgent({ agentId: 'default' });
  const setCodeRef = useRef(setCode);
  const lastCodeRef = useRef('');

  useEffect(() => {
    setCodeRef.current = setCode;
  }, [setCode]);

  useEffect(() => {
    if (!agent) return;
    const sub = agent.subscribe({
      onMessagesChanged: () => {
        const msgs = agent.messages || [];
        for (const m of msgs) {
          const calls = m.toolCalls || [];
          for (const call of calls) {
            const name = call.function?.name;
            // 只处理 write_code 和 AGUI 状态工具
            if (name !== 'write_code' && name !== 'AGUISendStateSnapshot' && name !== 'AGUISendStateDelta') continue;
            const argsStr = call.function?.arguments;
            if (!argsStr) continue;
            let args;
            try {
              args = JSON.parse(argsStr);
            } catch {
              continue; // 参数还在流式拼接中，未完整
            }
            // 提取 code：write_code 直接有 code；AGUI 的 snapshot 里可能含 code
            const code = args.code ?? args.snapshot?.code ?? args.snapshot?.geoGebraState?.code;
            if (typeof code === 'string' && code.trim() && code !== lastCodeRef.current) {
              lastCodeRef.current = code;
              setCodeRef.current(code);
            }
          }
        }
      }
    });
    return () => sub.unsubscribe();
  }, [agent]);

  return null;
}

export default useAgentStateSync;
