import { motion } from 'framer-motion';
import { Play, Square, Trash2, Eraser, FileInput } from 'lucide-react';

const MotionButton = motion.button;

const ControlPanel = ({
  isRunning,
  onRun,
  onStop,
  onClear,
  onClearCanvas,
  onDecompile
}) => {
  return (
    <footer
      className="flex items-center justify-end px-6 py-5 shrink-0"
    >
      <div className="flex items-center gap-4">
        <MotionButton
          onClick={onDecompile}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          style={{
            color: 'var(--color-text-primary)'
          }}
        >
          <FileInput size={16} />
          <span>逆向编译</span>
        </MotionButton>

        <MotionButton
          onClick={onClearCanvas}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          style={{
            color: 'var(--color-text-primary)'
          }}
        >
          <Eraser size={16} />
          <span>{'\u6e05\u7a7a\u753b\u5e03'}</span>
        </MotionButton>

        <MotionButton
          onClick={onClear}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          style={{
            color: 'var(--color-text-primary)'
          }}
        >
          <Trash2 size={16} />
          <span>{'\u6e05\u7a7a\u4ee3\u7801'}</span>
        </MotionButton>

        <MotionButton
          onClick={isRunning ? onStop : onRun}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          style={{
            color: 'var(--color-text-primary)'
          }}
        >
          {isRunning ? (
            <>
              <Square size={16} />
              <span>{'\u505c\u6b62\u8fd0\u884c'}</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>{'\u542f\u52a8\u7a0b\u5e8f'}</span>
            </>
          )}
        </MotionButton>
      </div>
    </footer>
  );
};

export default ControlPanel;
