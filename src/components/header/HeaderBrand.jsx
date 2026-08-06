const HeaderBrand = () => {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.svg" alt="GGBPuppy Logo" className="w-9 h-9 rounded-full" />
      <h1
        className="text-xl font-semibold tracking-tight"
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

