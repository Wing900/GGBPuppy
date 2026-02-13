import { motion } from 'framer-motion';
import { X, Share2 } from 'lucide-react';

const MotionButton = motion.button;

const ShareDialogHeader = ({ onClose }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: 'var(--color-bg-tertiary)' }}
    >
      <div className="flex items-center gap-2">
        <Share2 size={20} style={{ color: 'var(--color-text-secondary)' }} />
        <h2
          className="text-lg font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          分享项目
        </h2>
      </div>
      <MotionButton
        onClick={onClose}
        whileTap={{ scale: 0.9 }}
        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <X size={18} />
      </MotionButton>
    </div>
  );
};

export default ShareDialogHeader;
