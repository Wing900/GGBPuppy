import { EditorLayout, EmbedLayout } from './components';
import { useEmbedMode } from './hooks';

function App() {
  const { isEmbed, shareId, isFullscreen, hideSidebar } = useEmbedMode();

  // 如果是 shareId，且是嵌入模式，使用 EmbedLayout，否则在编辑模式下加载 EditorLayout
  if (isEmbed) {
    return (
      <EmbedLayout
        shareId={shareId}
        isFullscreen={isFullscreen}
        hideSidebar={hideSidebar}
      />
    );
  }

  return <EditorLayout shareId={shareId} />;
}

export default App;
