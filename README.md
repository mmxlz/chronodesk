# ChronoDesk

一款多功能桌面时钟应用，集成系统性能监测、番茄钟和便签日历功能。

## 功能特性

### 桌面时钟
- 数字时钟：大字体显示时间（HH:MM:SS），冒号闪烁动画
- 模拟时钟：SVG 绘制的表盘，三根指针实时转动
- 一键切换数字/模拟模式

### 系统性能监测
- 实时 CPU 使用率（环形图 + 历史曲线）
- 内存使用情况（环形图 + 已用/总量显示）
- 磁盘分区使用率（进度条）
- 网络上传/下载速度（实时数据）

### 番茄钟
- 可自定义工作/休息时长
- SVG 圆形倒计时动画
- 系统通知提醒
- 今日完成统计

### 便签日历
- 可拖拽的便签卡片，6 种颜色
- 月历视图，便签可关联到具体日期
- 数据本地持久化

### 主题系统
- 5 套内置主题：暗夜、亮白、霓虹、极简、复古
- 实时切换，CSS 变量驱动

## 技术栈

- **Electron** — 桌面应用框架
- **React 18 + TypeScript** — 前端 UI
- **electron-vite** — 构建工具
- **TailwindCSS** — 样式
- **Zustand** — 状态管理
- **Recharts** — 图表
- **systeminformation** — 系统数据采集
- **electron-store** — 本地持久化

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 打包 Windows 安装包
npm run package:win
```

## 项目结构

```
src/
├── main/              # Electron 主进程
│   ├── index.ts       # 入口
│   ├── window.ts      # 窗口管理
│   ├── tray.ts        # 系统托盘
│   ├── ipc-handlers.ts
│   └── services/      # 系统监控等服务
├── preload/           # 预加载脚本 (contextBridge)
└── renderer/          # React 前端
    ├── features/      # 功能模块
    │   ├── clock/     # 时钟
    │   ├── monitor/   # 性能监测
    │   ├── pomodoro/  # 番茄钟
    │   ├── notes/     # 便签+日历
    │   └── settings/  # 设置
    ├── store/         # Zustand 状态管理
    ├── themes/        # 主题定义
    └── components/    # 通用组件
```

## License

MIT
