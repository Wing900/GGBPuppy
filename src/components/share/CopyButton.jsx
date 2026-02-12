import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const CopyButton = ({ onClick, copied, title, className = 'p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5' }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={className}
      style={{ color: 'var(--color-text-secondary)' }}
      title={title}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </motion.button>
  );
};

export default CopyButton;
