# PDF 分割工具

一个简洁的 Windows 桌面 PDF 分割工具,基于 Electron + pdf-lib 开发。

## 功能

- 选择本地 PDF 文件(系统文件对话框)
- 分割:每 N 页生成一个独立 PDF 文件
- 删除页:移除指定页码范围(第 X 到第 Y 页),保留其余页
- 输出到源 PDF 同目录下的 `<文件名>_output` 文件夹
- 处理完成后可一键打开输出文件夹

## 下载使用(普通用户)

1. 前往仓库的 **Releases** 页面,下载 `PDF分割工具 Setup 1.0.0.exe`
2. 双击安装,从开始菜单打开「PDF分割工具」即可

## 开发(开发者)

### 环境要求

- Node.js 18+
- npm

### 安装与运行

```bash
npm install      # 安装依赖
npm start        # 启动应用(开发预览)
npm run dist     # 打包成 Windows exe
```

打包产物位于 `dist/` 目录。

> 国内开发者:`.npmrc` 已配置镜像加速,`npm install` 会自动使用。

### 技术栈

- [Electron](https://www.electronjs.org/) — 桌面 GUI 框架
- [pdf-lib](https://pdf-lib.js.org/) — PDF 处理
- [electron-builder](https://www.electron.build/) — 打包

## 项目结构

```
pdf-splitter/
├── main.js          主进程(窗口、文件对话框、PDF 处理)
├── preload.js       安全通信层(contextBridge)
├── index.html       界面结构
├── styles.css       界面样式
├── renderer.js      界面交互逻辑
├── test-logic.js    核心逻辑测试脚本(可 node 运行)
├── .npmrc           国内镜像加速(可选)
└── package.json     项目与打包配置
```

## 工作流程

1. 主进程(`main.js`)创建窗口、提供文件对话框、执行 PDF 处理
2. 渲染进程(`renderer.js` + `index.html`)负责界面交互
3. `preload.js` 通过 `contextBridge` 安全暴露 API,主/渲染进程通过 IPC 通信

## 输出目录

生成的 PDF 保存在**源 PDF 所在目录**下新建的 `<文件名>_output` 文件夹中。例如选择 `D:\docs\a.pdf`,输出到:

```
D:\docs\a_output\
```

