# 开发规范（必读）

> 本文件是 GGBPuppy 协作开发时共同遵守的硬性约定。

## 小步提交（Git Commit）原则

**每次做完一个小点，就立即 `git commit` 一次。严禁大步 commit。**

### 为什么

- 小步 commit 让每次变更可独立回滚，出错能精确定位到某一个「点」。
- 代码评审、二分定位、历史追溯都依赖清晰的粒度。
- 避免一个 commit 塞几十个改动，出问题无法拆解。

### 什么是「一个小点」

一个点 = 一个逻辑上独立、可验证、可自包含的改动。例如：

| ✅ 合适的小点 | ❌ 太大步 |
| --- | --- |
| 新增一个纯函数模块 + 它的单测 | 一次性塞进 5 个模块 + 测试 + 改构建 |
| 新增一个 UI 组件 + 接入页面 | 改布局 + 加逻辑 + 改样式 + 改配置全在一个 commit |
| 改一个 bug | 一个 commit 修 3 个不相关 bug |
| 更新一段文档 | 文档 + 代码 + 配置混在一起 |

### 规范

1. 粒度优先：**能拆就拆，一个 commit 只做一件事**。
2. 每个 commit 都应能独立通过构建 / 测试（或至少不破坏现有构建）。
3. Commit message 用动词开头，一句话说明「做了什么」，必要时补一句 why。
4. 代码 + 该代码的测试放同一个 commit（功能与验证不分离）。
5. 文档类改动单独 commit，不夹带代码。
6. 不要 `git add .` 无脑全加；按改动域精确 `git add`。

### 命令示例

```bash
git add src/lib/agent/execFast.js src/lib/agent/__tests__/execFast.test.js
git commit -m "feat(agent): add execFast pure function for non-delay GGB execution with tests"
```
