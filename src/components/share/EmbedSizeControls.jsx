const EmbedSizeControls = ({ width, height, onWidthChange, onHeightChange }) => {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="flex items-center gap-2">
        <label
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          宽度
        </label>
        <input
          type="number"
          value={width}
          onChange={onWidthChange}
          className="w-20 px-2 py-1 text-sm rounded"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <label
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          高度
        </label>
        <input
          type="number"
          value={height}
          onChange={onHeightChange}
          className="w-20 px-2 py-1 text-sm rounded"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>
    </div>
  );
};

export default EmbedSizeControls;

