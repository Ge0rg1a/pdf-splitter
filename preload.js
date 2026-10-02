const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pdfTool', {
  selectPdf: () => ipcRenderer.invoke('dialog:selectPdf'),
  splitEveryN: (filePath, n) => ipcRenderer.invoke('pdf:splitEveryN', filePath, n),
  removePages: (filePath, start, end) => ipcRenderer.invoke('pdf:removePages', filePath, start, end),
  openOutputDir: () => ipcRenderer.invoke('shell:openOutputDir')
});
