import { motion } from 'framer-motion';

const MotionAnchor = motion.a;
const MotionButton = motion.button;

const IconButton = ({ onClick, title, children, active = false, isDark = false, href, target, rel }) => {
  const style = {
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    backgroundColor: active
      ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
      : 'transparent'
  };

  if (href) {
    return (
      <MotionAnchor
        href={href}
        target={target}
        rel={rel}
        whileTap={{ scale: 0.95 }}
        className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={style}
        title={title}
      >
        {children}
      </MotionAnchor>
    );
  }

  return (
    <MotionButton
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      style={style}
      title={title}
    >
      {children}
    </MotionButton>
  );
};

export default IconButton;
