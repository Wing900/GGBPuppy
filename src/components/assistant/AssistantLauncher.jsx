import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CopilotChat } from '@copilotkit/react-core/v2';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const FAB_SIZE = 56;
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 725;
const HALF_HIDE = -FAB_SIZE / 2; // 半遮面：露出一半

/**
 * 圆形 puppy 浮动按钮（可拖动，平时藏在左侧半遮面）+ 可拖动对话面板。
 * - 点 FAB（非拖动）展开/收起面板
 * - 拖 FAB header 移动面板位置
 * - 面板支持图片附件
 */
const AssistantLauncher = ({ labels = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  // FAB 位置（初始左侧半遮面，垂直居中）
  const [fabPos, setFabPos] = useState(() => ({
    x: HALF_HIDE,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - FAB_SIZE / 2 : 200
  }));
  // 面板位置（null = 跟随 FAB 右侧）
  const [panelPos, setPanelPos] = useState(null);

  const fabDrag = useRef({ dragging: false, startX: 0, startY: 0, moved: false });
  const panelDrag = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  // FAB 拖拽（mouse + touch）
  useEffect(() => {
    const onMove = (clientX, clientY) => {
      if (!fabDrag.current.dragging) return;
      const dx = clientX - fabDrag.current.startX;
      const dy = clientY - fabDrag.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fabDrag.current.moved = true;
      setFabPos((p) => ({ x: p.x + dx, y: p.y + dy }));
      fabDrag.current.startX = clientX;
      fabDrag.current.startY = clientY;
    };
    const onMouseMove = (e) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onUp = () => { fabDrag.current.dragging = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const onFabPointerDown = useCallback((e) => {
    fabDrag.current = {
      dragging: true,
      startX: e.clientX || e.touches?.[0]?.clientX || 0,
      startY: e.clientY || e.touches?.[0]?.clientY || 0,
      moved: false
    };
  }, []);

  const onFabClick = useCallback(() => {
    if (fabDrag.current.moved) return; // 拖动不触发点击
    setIsOpen((v) => !v);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // 面板拖拽（通过 header）
  const onHeaderPointerDown = useCallback((e) => {
    const px = e.clientX || e.touches?.[0]?.clientX || 0;
    const py = e.clientY || e.touches?.[0]?.clientY || 0;
    const origin = panelPos || {
      x: fabPos.x + FAB_SIZE + 8,
      y: Math.max(8, fabPos.y - 100)
    };
    panelDrag.current = { dragging: true, startX: px, startY: py, originX: origin.x, originY: origin.y };
  }, [panelPos, fabPos]);

  useEffect(() => {
    const onMove = (clientX, clientY) => {
      if (!panelDrag.current.dragging) return;
      const dx = clientX - panelDrag.current.startX;
      const dy = clientY - panelDrag.current.startY;
      setPanelPos({ x: panelDrag.current.originX + dx, y: panelDrag.current.originY + dy });
    };
    const onMouseMove = (e) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onUp = () => { panelDrag.current.dragging = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // 面板位置：跟随 FAB 或独立
  const panelLeft = panelPos ? panelPos.x : fabPos.x + FAB_SIZE + 8;
  const panelTop = panelPos ? panelPos.y : Math.max(8, fabPos.y - 100);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
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
            {/* Header（可拖动） */}
            <div
              onMouseDown={onHeaderPointerDown}
              onTouchStart={onHeaderPointerDown}
              className="flex items-center justify-between px-4 py-3 border-b shrink-0 cursor-move"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <img src="/puppy.svg" alt="GGBPuppy" className="w-7 h-7" />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {labels.title || 'GGBPuppy 助手'}
                </span>
              </div>
              <MotionButton
                onClick={close}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-none hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </MotionButton>
            </div>

            {/* CopilotChat（支持图片附件） */}
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
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* 圆形 puppy FAB — 可拖动，平时左侧半遮面 */}
      <MotionButton
        onMouseDown={onFabPointerDown}
        onTouchStart={onFabPointerDown}
        onClick={onFabClick}
        whileTap={{ scale: 0.92 }}
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
          cursor: 'grab'
        }}
        title="GGBPuppy 助手"
      >
        <img
          src="/puppy.svg"
          alt="GGBPuppy 助手"
          className="w-full h-full object-cover"
        />
      </MotionButton>
    </>
  );
};

export default AssistantLauncher;