/**
 * 导出 GeoGebra 画布
 */

import { parseCommands } from '../lib/code';

/**
 * 生成时间戳文件名
 * @returns {string} 格式: ggbpuppy_2024-02-07_143052
 */
const generateFileName = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // 2024-02-07
  const time = now.toTimeString().slice(0, 8).replace(/:/g, ''); // 143052
  return `ggbpuppy_${date}_${time}`;
};

/**
 * 触发文件下载
 * @param {Blob} blob - 文件内容
 * @param {string} filename - 文件名
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 解析代码为命令数组
 * @param {string} code - 源代码
 * @returns {string[]} 命令数组
 */
/**
 * 执行所有命令并等待完成
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @param {string} code - 源代码
 */
const executeAllCommands = async (ggbApplet, code) => {
  const commands = parseCommands(code);

  // 重置画布
  try {
    ggbApplet.reset();
  } catch (e) {
    console.warn('重置画布失败:', e);
  }

  // 执行所有命令
  for (const cmd of commands) {
    try {
      ggbApplet.evalCommand(cmd);
    } catch (e) {
      console.warn('执行命令失败:', cmd, e);
    }
  }

  // 等待一小段时间让 GeoGebra 完成渲染
  await new Promise(resolve => setTimeout(resolve, 500));
};

/**
 * 导出为 .ggb 文件（先执行所有代码）
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @param {object} options - 配置选项
 */
export const exportAsGGB = async (ggbApplet, options = {}) => {
  if (!ggbApplet) {
    throw new Error('GeoGebra 未就绪');
  }

  const { code } = options;

  // 如果有代码，先执行所有命令
  if (code && code.trim()) {
    await executeAllCommands(ggbApplet, code);
  }

  const base64 = ggbApplet.getBase64();
  if (!base64) {
    throw new Error('导出失败：无法获取画布数据');
  }

  // Base64 转 Blob
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/vnd.geogebra.file' });

  const filename = `${generateFileName()}.ggb`;
  downloadBlob(blob, filename);

  return filename;
};

/**
 * 导出为 HTML 文件（嵌入源代码，自动执行）
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @param {object} options - 配置选项
 */
export const exportAsHTML = async (ggbApplet, options = {}) => {
  if (!ggbApplet) {
    throw new Error('GeoGebra 未就绪');
  }

  const { enable3D = false, code = '' } = options;

  // 将代码转换为 JSON 字符串以安全嵌入
  const escapedCode = JSON.stringify(code);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GGBPuppy Export</title>
  <script src="https://www.geogebra.org/apps/deployggb.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #ggb-container { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="ggb-container"></div>
  <script>
    var ggbCode = ${escapedCode};

    function parseCommands(code) {
      return code.split('\\n')
        .map(function(line) {
          var idx = line.indexOf('//');
          return (idx === -1 ? line : line.slice(0, idx)).trim();
        })
        .filter(function(line) { return line !== ''; });
    }

    function executeCommands(applet, commands) {
      commands.forEach(function(cmd) {
        try {
          applet.evalCommand(cmd);
        } catch (e) {
          console.warn('Command failed:', cmd, e);
        }
      });
    }

    var params = {
      appName: "${enable3D ? '3d' : 'classic'}",
      width: window.innerWidth,
      height: window.innerHeight,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      showResetIcon: true,
      enableLabelDrags: true,
      enableShiftDragZoom: true,
      enableRightClick: true,
      showToolBarHelp: false,
      errorDialogsActive: false,
      useBrowserForJS: false,
      language: "zh",
      appletOnLoad: function() {
        var commands = parseCommands(ggbCode);
        executeCommands(window.ggbApplet, commands);
      }
    };

    var applet = new GGBApplet(params, true);
    window.addEventListener('load', function() {
      applet.inject('ggb-container');
    });
    window.addEventListener('resize', function() {
      if (window.ggbApplet) {
        window.ggbApplet.setSize(window.innerWidth, window.innerHeight);
      }
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = `${generateFileName()}.html`;
  downloadBlob(blob, filename);

  return filename;
};

/**
 * 导出为 SVG 矢量图（先执行所有代码）
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @param {object} options - 配置选项
 */
export const exportAsSVG = async (ggbApplet, options = {}) => {
  if (!ggbApplet) {
    throw new Error('GeoGebra 未就绪');
  }

  const { code } = options;

  // 如果有代码，先执行所有命令
  if (code && code.trim()) {
    await executeAllCommands(ggbApplet, code);
  }

  // exportSVG 是异步的，需要用 Promise 包装
  const svgContent = await new Promise((resolve, reject) => {
    try {
      ggbApplet.exportSVG((svg) => {
        if (svg) {
          resolve(svg);
        } else {
          reject(new Error('导出失败：无法获取 SVG 数据'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const filename = `${generateFileName()}.svg`;
  downloadBlob(blob, filename);

  return filename;
};

/**
 * 导出为 PNG 图片（先执行所有代码）
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @param {object} options - 配置选项
 */
export const exportAsPNG = async (ggbApplet, options = {}) => {
  if (!ggbApplet) {
    throw new Error('GeoGebra 未就绪');
  }

  const { code } = options;

  // 如果有代码，先执行所有命令
  if (code && code.trim()) {
    await executeAllCommands(ggbApplet, code);
  }

  // 第二个参数 false = 白色背景（true = 透明背景，在某些查看器中显示为黑色）
  const base64 = ggbApplet.getPNGBase64(1, false, 72);
  if (!base64) {
    throw new Error('导出失败：无法获取图片数据');
  }

  // Base64 转 Blob
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/png' });

  const filename = `${generateFileName()}.png`;
  downloadBlob(blob, filename);

  return filename;
};
