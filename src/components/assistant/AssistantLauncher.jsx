import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CopilotChat } from '@copilotkit/react-core/v2';

const FAB_SIZE = 56;
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 725;
const HALF_HIDE = -FAB_SIZE / 2;

/**
 * 通用拖拽：mousedown/touchstart 时动态绑 document 事件，
 * mouseup/touchend 必触发并立即移除监听 —— 绝不"黏住"。
 */
function startDrag(startClientX, startClientY, origin, setPos, onMoved) {
  let moved = false;
  const onMove = (ev) => {
    const cx = ev.clientX ?? ev.touches?.[0]?.clientX;
    const cy = ev.clientY ?? ev.touches?.[0]?.clientY;
    if (cx == null) return;
    const dx = cx - startClientX;
    const dy = cy - startClientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    setPos({ x: origin.x + dx, y: origin.y + dy });
  };
  const onUp = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    window.removeEventListener('blur', onUp);
    onMoved?.(moved);
  };
  // pointer 事件统一 mouse+touch；绑 document 保证任何位置松开都触发；blur 兜底窗口失焦
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  window.addEventListener('blur', onUp);
}

const AssistantLauncher = ({ labels = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fabPos, setFabPos] = useState(() => ({
    x: HALF_HIDE,
    y: typeof window !== 'undefined' ? Math.max(8, (window.innerHeight - FAB_SIZE) / 2) : 200
  }));
  const [panelPos, setPanelPos] = useState(null);
  const fabMoved = useRef(false);

  useEffect(() => {
    setFabPos((p) => ({ ...p, y: Math.max(8, (window.innerHeight - FAB_SIZE) / 2) }));
  }, []);

  const onFabPointerDown = useCallback((e) => {
    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    fabMoved.current = false;
    startDrag(startX, startY, { ...fabPos }, setFabPos, (m) => { fabMoved.current = m; });
  }, [fabPos]);

  const onFabClick = useCallback(() => {
    if (fabMoved.current) { fabMoved.current = false; return; }
    setIsOpen((v) => !v);
  }, []);

  const close = useCallback((e) => {
    e?.stopPropagation();
    setIsOpen(false);
  }, []);

  const onHeaderPointerDown = useCallback((e) => {
    // 点 × 按钮时不启动拖拽
    if (e.target.closest('[data-close-btn]')) return;
    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const origin = panelPos || {
      x: fabPos.x + FAB_SIZE + 8,
      y: Math.max(8, fabPos.y - 100)
    };
    startDrag(startX, startY, origin, setPanelPos);
  }, [panelPos, fabPos]);

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
                data-close-btn
                onPointerDown={(e) => e.stopPropagation()}
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