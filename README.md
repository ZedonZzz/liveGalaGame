# LiveGalaGame

直播用 Galgame 风格对话系统，支持 OBS 场景捕捉，实时编辑对话内容。

## 功能特性

- **显示窗口** (`/`) - 用于 OBS 窗口捕捉的对话显示界面
- **控制面板** (`/control`) - 控制对话流程、实时编辑、绿幕设置
- **脚本编辑器** (`/editor`) - 可视化编辑对话脚本，支持列表/树形视图
- **跨标签页同步** - 控制面板与显示窗口实时同步
- **打字机效果** - 模拟 Galgame 逐字显示
- **分支选项** - 支持多选项对话分支

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用方式

1. 启动项目后打开两个浏览器窗口
2. 窗口1：`http://localhost:5173/` (显示窗口) - 添加到 OBS
3. 窗口2：`http://localhost:5173/control` (控制面板) - 用于操控

### OBS 设置

1. 添加"浏览器"源，URL 填写显示窗口地址
2. 开启绿幕模式后，在 OBS 添加"色度键"滤镜抠除背景

## 脚本格式

```json
{
  "characters": {
    "char_id": {
      "name": "角色名",
      "color": "#FFD700"
    }
  },
  "nodes": {
    "node_id": {
      "character": "char_id",
      "text": "对话内容",
      "next": "next_node_id"
    },
    "choice_node": {
      "character": "char_id",
      "text": "请选择",
      "choices": [
        { "text": "选项1", "goto": "node_a" },
        { "text": "选项2", "goto": "node_b" }
      ]
    }
  },
  "startNode": "node_id"
}
```

## 技术栈

- Vue 3
- Vite
- Pinia
- Vue Router

## 项目结构

```
src/
├── views/
│   ├── DisplayView.vue   # 显示窗口
│   ├── ControlView.vue   # 控制面板
│   └── EditorView.vue    # 脚本编辑器
├── stores/
│   ├── dialog.js         # 对话状态管理
│   ├── script.js         # 脚本数据管理
│   ├── settings.js       # 设置管理
│   └── sync.js           # 跨标签页同步
└── router/
    └── index.js          # 路由配置
```

## 开发环境

推荐使用 [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 扩展。

## License

MIT
