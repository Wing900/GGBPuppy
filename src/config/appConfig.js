export const DEMO_CODE = `// --- 棉花糖音乐盒 (Pastel Music Box) ---
// GGBPuppy 可爱配色版

// --- 1. 环境设定：干净的画板 ---
ShowAxes(false)
ShowGrid(false)
SetCoordSystem(-15, 15, -15, 15)


// --- 2. 交互控制：你的专属玩具 ---
R = Slider(8, 12, 0.1, 10)
k = Slider(2, 10, 1, 5)
d = Slider(1, 8, 0.1, 4)
// 时间滑块，转速调慢，更有"音乐盒"的感觉
t = Slider(0, 20 * pi, 0.02)
SetAnimationSpeed(t, 0.2)
StartAnimation(t)


// --- 3. 几何构造：柔和的机械之舞 ---
r = R / k

// 主轨道圆 (淡雅的薰衣草紫)
C_main = Circle((0, 0), R)
SetColor(C_main, 221, 221, 255) // #DDDDFF
SetLineStyle(C_main, 2)
SetLineThickness(C_main, 2) // 稍微加粗，增加存在感

// 滚动的小圆 (清新的天空蓝)
Center_small = ( (R - r) * cos(t), (R - r) * sin(t) )
C_small = Circle(Center_small, r)
SetColor(C_small, 204, 230, 255) // #CCE6FF
SetLineThickness(C_small, 2)

// 连接线也用天空蓝
l = Segment((0,0), Center_small)
SetColor(l, 204, 230, 255)
SetLineStyle(l, 3)
SetLineThickness(l, 1)


// --- 4. 绘图核心：樱花粉的画笔 ---
Pen = Center_small + (d * cos(-(k - 1) * t), d * sin(-(k - 1) * t))
// 画笔本身用可爱的樱花粉
SetColor(Pen, 255, 182, 193) // #FFB6C1
// 把画笔调得更粗，这样轨迹才明显
SetPointSize(Pen, 6)

// 开启轨迹，让樱花粉画出美丽的花纹
SetTrace(Pen, true)`;

export const DEFAULT_INTERVAL = 0.3;

export const DEFAULT_ENABLE_3D = false;

export const INTERVAL_RANGE = {
  min: 0.1,
  max: 3.0,
  step: 0.1
};

export const INTERVAL_PRESETS = [0.2, 0.5, 1.0, 2.0];

export const DEFAULT_SETTINGS_TAB = 'timing';

export const STORAGE_KEYS = {
  code: 'ggbpuppy-code',
  enable3D: 'ggbpuppy-enable3d'
};

export const LAYOUT = {
  pagePadding: '24px 24px 24px 60px',
  headerMarginBottom: '28px',
  editorColumnWidth: '400px',
  mainHeight: 'calc(100vh - 250px)'
};

