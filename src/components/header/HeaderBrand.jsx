const HeaderBrand = () => {
  return (
    <div className="flex items-center gap-3 mb-3">
      <img src="/logo.svg" alt="GGBPuppy Logo" className="w-14 h-14" />
      <h1
        className="text-3xl font-normal tracking-wider"
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans)'
        }}
      >
        GGBPuppy
      </h1>
    </div>
  );
};

export default HeaderBrand;

