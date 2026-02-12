import { motion } from 'framer-motion';

const SettingsTabButton = ({ Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative"
      style={{
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
          style={{ backgroundColor: 'var(--color-text-primary)' }}
        />
      )}
    </button>
  );
};

export default SettingsTabButton;

