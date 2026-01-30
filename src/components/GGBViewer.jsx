import { useEffect, useRef, useCallback } from 'react';

const GGBViewer = ({ onReady, enable3D }) => {
  const containerRef = useRef(null);
  const appletRef = useRef(null);
  const isInitializedRef = useRef(false);

  const initGeoGebra = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    if (!window.GGBApplet) {
      console.warn('GeoGebra API 未加载');
      return;
    }

    isInitializedRef.current = true;

    const params = {
      appName: enable3D ? '3d' : 'classic',
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      showResetIcon: false,
      enable3D,
      enableLabelDrags: false,
      enableShiftDragZoom: true,
      enableRightClick: false,
      capturingThreshold: null,
      showToolBarHelp: false,
      errorDialogsActive: false,
      useBrowserForJS: true,
      language: 'zh',
      appletOnLoad: () => {
        appletRef.current = window.ggbApplet;
        onReady?.(window.ggbApplet);
        if (enable3D && window.ggbApplet && window.ggbApplet.executeCommand) {
          window.ggbApplet.executeCommand('ShowView(5, true)');
        }
      }
    };

    const applet = new window.GGBApplet(params, true);
    applet.inject(containerRef.current);
  }, [enable3D, onReady]);

  useEffect(() => {
    const checkAndInit = () => {
      if (window.GGBApplet) {
        initGeoGebra();
      } else {
        setTimeout(checkAndInit, 100);
      }
    };
    checkAndInit();
    return () => { isInitializedRef.current = false; };
  }, [initGeoGebra]);

  useEffect(() => {
    const handleResize = () => {
      if (appletRef.current && containerRef.current) {
        appletRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* GeoGebra */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
      />
    </div>
  );
};

export default GGBViewer;
