import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CopilotChat } from '@copilotkit/react-core/v2';

const FAB_SIZE = 56;
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 725;
const HALF_HIDE = -FAB_SIZE / 2; // 半遮面：露出一半

/**
 * 圆形 puppy 浮动按钮（可拖动，平时藏在左侧半遮面）+ 可拖动对话面板。
 * 拖拽用 Pointer Events + setPointerCapture：
 *   - 按住即拖（pointerdown 起算）
 *   - 松开即停（pointerup 立刻释放捕获，绝不"粘起来"）
 *   - 拖动位移 > 3px 视为拖动，否则视为点击（展开/收起）
 */
const AssistantLauncher = ({ labels = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fabPos, setFabPos] = useState(() => ({
    x: HALF_HIDE,
    y: typeof window !== 'undefined' ? Math.max(8, (window.innerHeight - FAB_SIZE) / 2) : 200
  }));
  const [panelPos, setPanelPos] = useState(null);

  const fabDrag = useRef({ dragging: false, startX: 0, startY: 0, moved: false });
  const panelDrag = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  // mount 后再次校准垂直居中（处理 SSR / 初始 window 尺寸不准）
  useEffect(() => {
    setFabPos((p) => ({ ...p, y: Math.max(8, (window.innerHeight - FAB_SIZE) / 2) }));
  }, []);

  // FAB 拖拽
  const onFabPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    fabDrag.current = { dragging: true, startX: e.clientX, startY: e.clientY, moved: false };
  }, []);

  const onFabPointerMove = useCallback((e) => {
    if (!fabDrag.current.dragging) return;
    const dx = e.clientX - fabDrag.current.startX;
    const dy = e.clientY - fabDrag.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fabDrag.current.moved = true;
    setFabPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    fabDrag.current.startX = e.clientX;
    fabDrag.current.startY = e.clientY;
  }, []);

  const onFabPointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    fabDrag.current.dragging = false;
  }, []);

  const onFabClick = useCallback(() => {
    if (fabDrag.current.moved) return; // 拖动不触发点击
    setIsOpen((v) => !v);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // 面板拖拽（header）
  const onHeaderPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const origin = panelPos || {
      x: fabPos.x + FAB_SIZE + 8,
      y: Math.max(8, fabPos.y - 100)
    };
    panelDrag.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: origin.x, originY: origin.y };
  }, [panelPos, fabPos]);

  const onHeaderPointerMove = useCallback((e) => {
    if (!panelDrag.current.dragging) return;
    const dx = e.clientX - panelDrag.current.startX;
    const dy = e.clientY - panelDrag.current.startY;
    setPanelPos({ x: panelDrag.current.originX + dx, y: panelDrag.current.originY + dy });
  }, []);

  const onHeaderPointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    panelDrag.current.dragging = false;
  }, []);

  const panelLeft = panelPos ? panelPos.x : fabPos.x + FAB_SIZE + 8;
  const panelTop = panelPos ? panelPos.y : Math.max(8, fabPos.y - 100);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col overflow-hidden"
            style={{
              position: 'fixed',
              left: panelLeft,
              top: panelTop,
              zIndex: 50,
              width: PANEL_WIDTH,
              maxWidth: 'calc(100vw - 16px)',
              height: PANEL_HEIGHT,
              maxHeight: 'calc(100vh - 16px)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.16)'
            }}
          >
            <div
              onPointerDown={onHeaderPointerDown}
              onPointerMove={onHeaderPointerMove}
              onPointerUp={onHeaderPointerUp}
              className="flex items-center justify-between px-4 py-3 border-b shrink-0 cursor-move"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <img src="/puppy.svg" alt="GGBPuppy" className="w-7 h-7" />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {labels.title || 'GGBPuppy 助手'}
                </span>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-none hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <CopilotChat
                labels={{
                  title: labels.title || 'GGBPuppy 助手',
                  placeholder: labels.placeholder || '输入想构造的几何图形…',
                  welcomeMessageText: '',
                  chatDisclaimerText: ''
                }}
                attachments={{ enabled: true, accept: 'image/*' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onClick={onFabClick}
        className="overflow-hidden rounded-full"
        style={{
          position: 'fixed',
          left: fabPos.x,
          top: fabPos.y,
          width: FAB_SIZE,
          height: FAB_SIZE,
          zIndex: 50,
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          cursor: 'grab',
          touchAction: 'none'
        }}
        title="GGBPuppy 助手"
      >
        <img src="/puppy.svg" alt="GGBPuppy 助手" className="w-full h-full object-cover" />
      </button>
    </>
  );
};

export default AssistantLauncher;