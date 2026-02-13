import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  buildShareUrl,
  buildEmbedUrl,
  buildEmbedHtml,
  buildFullscreenEmbedUrl,
  buildFullscreenEmbedHtml
} from '../lib/url';
import { SHARE_DIALOG } from '../config/shareConfig';
import { ShareDialogHeader, ShareDialogContent } from './share';

const MotionDiv = motion.div;

const ShareDialog = ({ isOpen, onClose, shareId }) => {
  const [copiedType, setCopiedType] = useState(null);
  const [width, setWidth] = useState(SHARE_DIALOG.defaultEmbedWidth);
  const [height, setHeight] = useState(SHARE_DIALOG.defaultEmbedHeight);

  const shareUrl = shareId ? buildShareUrl(shareId) : '';
  const embedUrl = shareId ? buildEmbedUrl(shareId) : '';
  const embedHtml = shareId ? buildEmbedHtml(shareId, { width, height }) : '';
  const fullscreenEmbedUrl = shareId ? buildFullscreenEmbedUrl(shareId) : '';
  const fullscreenEmbedHtml = shareId ? buildFullscreenEmbedHtml(shareId) : '';

  const copyToClipboard = useCallback(async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), SHARE_DIALOG.copyFeedbackMs);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, []);

  const handleWidthChange = useCallback((e) => {
    setWidth(Number(e.target.value) || SHARE_DIALOG.defaultEmbedWidth);
  }, []);

  const handleHeightChange = useCallback((e) => {
    setHeight(Number(e.target.value) || SHARE_DIALOG.defaultEmbedHeight);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
            style={{ width: SHARE_DIALOG.panelWidth, maxWidth: SHARE_DIALOG.panelMaxWidth }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            >
              <ShareDialogHeader onClose={onClose} />

              <ShareDialogContent
                shareUrl={shareUrl}
                embedUrl={embedUrl}
                embedHtml={embedHtml}
                fullscreenEmbedUrl={fullscreenEmbedUrl}
                fullscreenEmbedHtml={fullscreenEmbedHtml}
                width={width}
                height={height}
                onWidthChange={handleWidthChange}
                onHeightChange={handleHeightChange}
                onCopy={copyToClipboard}
                copiedType={copiedType}
              />
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareDialog;
