const ShareSection = ({ icon, title, children }) => {
  return (
    <div>
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      {children}
    </div>
  );
};

export default ShareSection;

