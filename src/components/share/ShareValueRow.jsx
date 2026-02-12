import CopyButton from './CopyButton';

const ShareValueRow = ({ value, textClassName = 'text-sm truncate', onCopy, copied, copyTitle }) => {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-bg-tertiary)'
      }}
    >
      <span
        className={`flex-1 ${textClassName}`}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {value}
      </span>
      <CopyButton onClick={onCopy} copied={copied} title={copyTitle} />
    </div>
  );
};

export default ShareValueRow;

