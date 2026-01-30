import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import { lineNumbers } from '@codemirror/view';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, placeholder, keymap, drawSelection } from '@codemirror/view';
import { buildGgbExtensions } from './ggbLanguage';

// 动态调整行号区域宽度
const dynamicGutterWidth = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.updateGutterWidth(view);
    }

    update(update) {
      this.updateGutterWidth(update.view);
    }

    updateGutterWidth(view) {
      const lineCount = view.state.doc.lines;
      const digitCount = Math.max(String(lineCount).length, 2);
      const gutterWidth = digitCount * 9 + 20; // 每个数字约9px + 左右各10px padding

      const gutter = view.dom.querySelector('.cm-lineNumbers');
      if (gutter) {
        gutter.style.width = `${gutterWidth}px`;
        gutter.style.minWidth = `${gutterWidth}px`;
      }
    }
  }
);

// 编辑器主题 - 只负责外观，布局交给外部 CSS
const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '13px',
  },
  '.cm-scroller': {
    fontFamily: '"JetBrains Mono", "LXGW WenKai", monospace',
    lineHeight: '1.6',
  },
  '.cm-content': {
    paddingBottom: '200px', // 底部留白，方便输入
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  }
});

const createCurrentLineHighlighter = (lineNumber) =>
  ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = this.buildDecorations(view);
      }

      buildDecorations(view) {
        const builder = new RangeSetBuilder();

        if (lineNumber >= 0) {
          const line = view.state.doc.line(lineNumber + 1);
          builder.add(line.from, line.from, Decoration.line({ class: 'cm-current-line' }));
        }

        return builder.finish();
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
    },
    { decorations: (value) => value.decorations }
  );

const CodeEditor = ({ code, setCode, currentLine, isRunning }) => {
  const [ggbExtensions, setGgbExtensions] = useState(null);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let isActive = true;

    const loadCommands = async () => {
      try {
        const response = await fetch('/ggbcommands/ggb_brain_slim.json');

        if (!response.ok) {
          throw new Error(`Failed to load commands (${response.status})`);
        }

        const data = await response.json();

        if (isActive) {
          setGgbExtensions(buildGgbExtensions(Array.isArray(data) ? data : []));
          setLoadState('ready');
        }
      } catch (error) {
        console.warn('Failed to load GeoGebra command index:', error);
        if (isActive) {
          setLoadState('error');
        }
      }
    };

    loadCommands();

    return () => {
      isActive = false;
    };
  }, []);

  const extensions = useMemo(() => {
    const base = [
      // 基础功能
      keymap.of(defaultKeymap),
      history(),
      keymap.of(historyKeymap),
      drawSelection(),
      // 语法高亮相关的
      bracketMatching(),
      // 行号
      lineNumbers(),
      // 主题
      editorTheme,
      // 占位符
      placeholder('输入 GeoGebra 指令...'),
      // 只读状态
      EditorState.readOnly.of(isRunning),
      EditorView.editable.of(!isRunning),
      // 动态行号宽度
      dynamicGutterWidth
    ];

    if (typeof currentLine === 'number' && currentLine >= 0) {
      base.push(createCurrentLineHighlighter(currentLine));
    }

    if (ggbExtensions) {
      base.push(ggbExtensions.ggbHighlight, ggbExtensions.ggbCompletion);
    }

    return base;
  }, [currentLine, ggbExtensions, isRunning]);

  const statusLabel =
    loadState === 'loading'
      ? '指令库载入中...'
      : loadState === 'error'
        ? '指令库载入失败，已使用基础模式'
        : null;

  return (
    <div className="ggb-editor-container">
      <div className="ggb-editor">
        <CodeMirror
          value={code}
          height="100%"
          extensions={extensions}
          onChange={(value) => setCode(value)}
        />
      </div>
      {statusLabel && (
        <div
          className="absolute top-3 right-4 text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {statusLabel}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
