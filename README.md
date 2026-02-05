# GGBPuppy

GGBPuppy 是一个面向 GeoGebra 的指令编辑与演示工具。它提供代码编辑器、自动补全与逐行执行能力，方便把几何构造步骤可视化地演示与回放。

如图所示：

<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/771a25a0-539b-48b6-891a-e396e21d1aa3" />


## 运行方式

克隆项目并在根目录下运行：

```bash
npm install
npm run dev
```

## Cloudflare Pages 部署

启用分享需要 KV 作为存储，请在 Pages 设置中完成：

1. 在 KV 绑定里添加 `GGBPuppy_SHARES`
2. 在环境变量中添加 `VITE_STORAGE_MODE=cfkv`（Production）
3. 保存后重新部署

