import { Globe, Link, Code, Maximize2 } from 'lucide-react';
import ShareSection from './ShareSection';
import ShareValueRow from './ShareValueRow';
import EmbedSizeControls from './EmbedSizeControls';

const ShareDialogContent = ({
  shareUrl,
  embedUrl,
  embedHtml,
  fullscreenEmbedUrl,
  fullscreenEmbedHtml,
  width,
  height,
  onWidthChange,
  onHeightChange,
  onCopy,
  copiedType
}) => {
  return (
    <div className="p-6 space-y-6">
      <ShareSection icon={<Globe size={16} />} title="分享链接">
        <ShareValueRow
          value={shareUrl}
          onCopy={() => onCopy(shareUrl, 'url')}
          copied={copiedType === 'url'}
          copyTitle="复制链接"
        />
      </ShareSection>

      <ShareSection icon={<Link size={16} />} title="嵌入链接">
        <ShareValueRow
          value={embedUrl}
          onCopy={() => onCopy(embedUrl, 'embedUrl')}
          copied={copiedType === 'embedUrl'}
          copyTitle="复制嵌入链接"
        />
      </ShareSection>

      <ShareSection icon={<Code size={16} />} title="嵌入代码">
        <EmbedSizeControls
          width={width}
          height={height}
          onWidthChange={onWidthChange}
          onHeightChange={onHeightChange}
        />
        <ShareValueRow
          value={embedHtml}
          textClassName="text-xs font-mono truncate"
          onCopy={() => onCopy(embedHtml, 'html')}
          copied={copiedType === 'html'}
          copyTitle="复制嵌入代码"
        />
      </ShareSection>

      <ShareSection icon={<Maximize2 size={16} />} title="全屏嵌入链接">
        <ShareValueRow
          value={fullscreenEmbedUrl}
          onCopy={() => onCopy(fullscreenEmbedUrl, 'fullscreenUrl')}
          copied={copiedType === 'fullscreenUrl'}
          copyTitle="复制全屏嵌入链接"
        />
      </ShareSection>

      <ShareSection icon={<Code size={16} />} title="全屏嵌入 Frame">
        <ShareValueRow
          value={fullscreenEmbedHtml}
          textClassName="text-xs font-mono truncate"
          onCopy={() => onCopy(fullscreenEmbedHtml, 'fullscreenHtml')}
          copied={copiedType === 'fullscreenHtml'}
          copyTitle="复制全屏嵌入代码"
        />
      </ShareSection>
    </div>
  );
};

export default ShareDialogContent;

