import { useEffect, useRef } from 'react';
import { useAgentTools } from './useAgentTools';
import { useAgentStateSync } from './useAgentStateSync';

/**
 * 在 CopilotKitProvider 内注册 agent 前端工具。
 *
 * 用 ref 持最新 ggbApplet / code（applet 因 2D/3D 切换会重建，句柄必须实时同步），
 * 这样工具 handler 始终读到最新句柄，无需因句柄变化频繁重新注册。
 *
 * @param {{
 *   ggbApplet: object | null,
 *   code: string,
 *   setCode: (code: string) => void
 * }} props
 */
export function AgentToolConnector({ ggbApplet, code, setCode }) {
  const appletRef = useRef(ggbApplet);
  const codeRef = useRef(code);

  useEffect(() => {
    appletRef.current = ggbApplet;
  }, [ggbApplet]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useAgentTools({
    getGgbApplet: () => appletRef.current,
    getCode: () => codeRef.current,
    setCode
  });

  // 兜底：agent 用 AGUI 发代码时，提取并写入编辑器
  useAgentStateSync({ setCode });

  return null;
}

export default AgentToolConnector;
