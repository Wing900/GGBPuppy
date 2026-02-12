import { useEffect, useRef, useCallback } from 'react';

const GGBViewer = ({ onReady, enable3D, hideSidebar = false }) => {
  const containerRef = useRef(null);
  const appletRef = useRef(null);
  const isInitializedRef = useRef(false);

  // 处理拖放 .ggb 文件
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.ggb')) {
      alert('请拖入 .ggb 文件');
      return;
    }

    if (!appletRef.current) {
      alert('GeoGebra 未就绪');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const base64 = event.target.result.split(',')[1];
        appletRef.current.setBase64(base64, () => {
          appletRef.current = window.ggbApplet;
          onReady?.(window.ggbApplet);
        });
      } catch (error) {
        console.error('加载 .ggb 文件失败:', error);
        alert('加载文件失败');
      }
    };
    reader.readAsDataURL(file);
  }, [onReady]);

  const applySidebarState = useCallback(() => {
    if (!hideSidebar || !appletRef.current) return;

    try {
      const perspective = enable3D ? 'G3D' : 'G';
      if (appletRef.current.setPerspective) {
        appletRef.current.setPerspective(perspective);
      }
      if (appletRef.current.setShowView) {
        appletRef.current.setShowView(1, false);
        appletRef.current.setShowView(2, false);
      }
      if (appletRef.current.evalCommand) {
        appletRef.current.evalCommand('ShowView(1, false)');
        appletRef.current.evalCommand('ShowView(2, false)');
      }
      if (appletRef.current.setShowAlgebraInput) {
        appletRef.current.setShowAlgebraInput(false);
      }
      if (appletRef.current.setShowToolBar) {
        appletRef.current.setShowToolBar(false);
      }
    } catch (error) {
      console.warn('隐藏侧边栏失败:', error);
    }
  }, [enable3D, hideSidebar]);

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
      showAlgebraInput: !hideSidebar,
      showMenuBar: false,
      showResetIcon: false,
      enable3D,
      enableLabelDrags: true,
      enableShiftDragZoom: true,
      enableRightClick: true,
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
        applySidebarState();
      }
    };


    if (hideSidebar) {
      params.showAlgebraView = false;
    }

    const applet = new window.GGBApplet(params, true);
    applet.inject(containerRef.current);
  }, [enable3D, onReady, applySidebarState]);

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
    applySidebarState();
  }, [applySidebarState]);

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
    <div
      className="flex flex-col h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
      />
    </div>
  );
};

export default GGBViewer;
