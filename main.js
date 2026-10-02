const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 580,
    height: 700,
    resizable: false,
    title: 'PDF 分割工具',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

let lastOutputDir = null;

function getOutputDir(filePath) {
  const dir = path.dirname(filePath);
  const outDir = path.join(dir, `${baseName(filePath)}_output`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  lastOutputDir = outDir;
  return outDir;
}

function baseName(filePath) {
  return path.parse(filePath).name;
}

// 选择 PDF 文件并读取页数
ipcMain.handle('dialog:selectPdf', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择 PDF 文件',
    filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  try {
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return { filePath, pageCount: doc.getPageCount() };
  } catch (e) {
    return { filePath, error: e.message };
  }
});

// 功能:每 N 页分割成一个文件
ipcMain.handle('pdf:splitEveryN', async (event, filePath, n) => {
  try {
    n = parseInt(n, 10);
    if (!n || n < 1) throw new Error('每份页数必须是大于 0 的整数');
    const outDir = getOutputDir(filePath);
    const src = await PDFDocument.load(fs.readFileSync(filePath), { ignoreEncryption: true });
    const total = src.getPageCount();
    const files = [];
    let seq = 1;
    for (let i = 0; i < total; i += n) {
      const endIdx = Math.min(i + n, total);
      const indices = [];
      for (let k = i; k < endIdx; k++) indices.push(k);
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(src, indices);
      pages.forEach(p => newDoc.addPage(p));
      const outPath = path.join(outDir, `${baseName(filePath)}_${String(seq).padStart(2, '0')}_p${i + 1}-${endIdx}.pdf`);
      fs.writeFileSync(outPath, await newDoc.save());
      files.push(path.basename(outPath));
      seq++;
    }
    return { ok: true, outDir, files };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// 功能:删除指定页码范围(1-based,含两端)
ipcMain.handle('pdf:removePages', async (event, filePath, start, end) => {
  try {
    start = parseInt(start, 10);
    end = parseInt(end, 10);
    const src = await PDFDocument.load(fs.readFileSync(filePath), { ignoreEncryption: true });
    const total = src.getPageCount();
    if (!start || !end || start < 1 || end > total || start > end) {
      throw new Error(`页码范围无效,PDF 共 ${total} 页,请输入 1~${total} 之间的范围`);
    }
    const outDir = getOutputDir(filePath);
    const keepIndices = [];
    for (let i = 0; i < total; i++) {
      if (i < start - 1 || i > end - 1) keepIndices.push(i);
    }
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(src, keepIndices);
    pages.forEach(p => newDoc.addPage(p));
    const outPath = path.join(outDir, `${baseName(filePath)}_removed_p${start}-${end}.pdf`);
    fs.writeFileSync(outPath, await newDoc.save());
    return { ok: true, outDir, files: [path.basename(outPath)] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// 打开输出目录
ipcMain.handle('shell:openOutputDir', async () => {
  if (lastOutputDir) shell.openPath(lastOutputDir);
});
