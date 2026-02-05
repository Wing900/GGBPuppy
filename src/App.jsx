import { EditorLayout, EmbedLayout } from './components';
import { useEmbedMode } from './hooks';

function App() {
  const { isEmbed, shareId } = useEmbedMode();

  // 如果有 shareId，在嵌入模式下使用 EmbedLayout，否则在编辑模式下加载到 EditorLayout
  if (isEmbed) {
    return <EmbedLayout shareId={shareId} />;
  }

  return <EditorLayout shareId={shareId} />;
}

export default App;

