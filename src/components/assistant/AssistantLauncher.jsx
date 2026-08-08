import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CopilotChat } from '@copilotkit/react-core/v2';

const FAB_SIZE = 56;
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 725;
const HALF_HIDE = -FAB_SIZE / 2; // 半遮面：露出一半

const centerY = () =>
  typeof window !== 'undefined' ? Math.max(8, (window.innerHeight - FAB_SIZE) / 2) : 200;

/** 内联 puppy SVG（不用 <img>，避免图片选中/拖拽干扰） */
const PuppyIcon = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <g transform="translate(-10 -22) rotate(10 60 72)">
      <path d="M30 45 L15 70 L45 70 Z" fill="#424242" />
      <path d="M90 45 L75 70 L105 70 Z" fill="#424242" />
      <rect x="30" y="55" width="60" height="45" rx="12" fill="#424242" />
      <circle cx="45" cy="75" r="4" fill="#ffffff" />
      <circle cx="75" cy="75" r="4" fill="#ffffff" />
      <path d="M55 85 L65 85 L60 92 Z" fill="#ffffff" opacity="0.95" />
    </g>
  </svg>
);

/**
 * 圆形 puppy 助手按钮 + 对话面板。
 *
 * 拖拽状态机（单一 dragRef）：
 *   - pointerdown 启动拖拽（记录起点 + 原点）
 *   - document pointermove 更新位置
 *   - document pointerup / window blur 结束拖拽（监听绝不残留）
 *   - 位移 > 3px 记为"拖动"，否则视为"点击"
 *
 * 规则：
 *   - 对话框【关闭】时 FAB 可拖动
 *   - 对话框【打开】时 FAB 锁定（不可拖动）
 *   - 点 FAB（非拖动）→ 展开/收起对话框
 *   - 面板 header 可拖动；× 关闭
 */
const AssistantLauncher = ({ labels = {}, panelAnchorRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fabPos, setFabPos] = useState(() => ({ x: HALF_HIDE, y: centerY() }));
  const [panelPos, setPanelPos] = useState(null);

  const dragRef = useRef(null); // { type, startX, startY, originX, originY, moved }
  const fabMoved = useRef(false);

  // 默认面板位置：覆盖代码区（panelAnchorRef 指向代码区容器）
  const defaultPanelPos = useCallback(() => {
    const el = panelAnchorRef?.current;
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top };
    }
    return { x: fabPos.x + FAB_SIZE + 8, y: 8 };
  }, [panelAnchorRef, fabPos]);

  const startDrag = useCallback(
    (type, e) => {
      if (type === 'fab' && isOpen) return; // 对话框打开时 FAB 锁定
      const origin = type === 'fab' ? fabPos : panelPos || defaultPanelPos();
      dragRef.current = {
        type,
        startX: e.clientX,
        startY: e.clientY,
        originX: origin.x,
        originY: origin.y,
        moved: false
      };
    },
    [isOpen, fabPos, panelPos, defaultPanelPos]
  );

  // 全局拖拽监听（只绑一次）
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      const pos = { x: d.originX + dx, y: d.originY + dy };
      if (d.type === 'fab') setFabPos(pos);
      else setPanelPos(pos);
    };
    const onUp = () => {
      if (dragRef.current?.type === 'fab') fabMoved.current = dragRef.current.moved;
      dragRef.current = null;
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    window.addEventListener('blur', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onUp);
    };
  }, []);

  // mount 后校准垂直居中
  useEffect(() => {
    setFabPos((p) => ({ ...p, y: centerY() }));
  }, []);

  const onFabPointerDown = useCallback((e) => startDrag('fab', e), [startDrag]);

  const onFabClick = useCallback(() => {
    if (fabMoved.current) {
      fabMoved.current = false;
      return;
    }
    setIsOpen((v) => !v);
  }, []);

  const close = useCallback((e) => {
    e?.stopPropagation();
    setIsOpen(false);
  }, []);

  const onHeaderPointerDown = useCallback(
    (e) => {
      if (e.target.closest('[data-close-btn]')) return; // 点 × 不启动拖拽
      startDrag('panel', e);
    },
    [startDrag]
  );

  const panelLeft = panelPos ? panelPos.x : defaultPanelPos().x;
  const panelTop = panelPos ? panelPos.y : defaultPanelPos().y;

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
                <PuppyIcon size={28} />
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
          cursor: isOpen ? 'default' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserDrag: 'none'
        }}
        title="GGBPuppy 助手"
      >
        <PuppyIcon size={FAB_SIZE} />
      </button>
    </>
  );
};

export default AssistantLauncher;