const $ = (id) => document.getElementById(id);
let currentFile = null;

$('btnSelect').addEventListener('click', async () => {
  const res = await window.pdfTool.selectPdf();
  $('result').textContent = '';
  $('result').className = 'result';
  $('btnOpenDir').classList.add('hidden');
  if (!res) {
    currentFile = null;
    $('fileInfo').textContent = '未选择文件';
    $('pageInfo').textContent = '';
    $('btnRun').disabled = true;
    return;
  }
  if (res.error) {
    currentFile = null;
    $('fileInfo').textContent = res.filePath;
    $('pageInfo').textContent = '读取失败:' + res.error;
    $('btnRun').disabled = true;
    return;
  }
  currentFile = res.filePath;
  $('fileInfo').textContent = res.filePath;
  $('pageInfo').textContent = '共 ' + res.pageCount + ' 页';
  $('btnRun').disabled = false;
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.dataset.mode;
    $('splitPanel').classList.toggle('hidden', mode !== 'split');
    $('removePanel').classList.toggle('hidden', mode !== 'remove');
  });
});

$('btnRun').addEventListener('click', async () => {
  if (!currentFile) return;
  const mode = document.querySelector('.tab.active').dataset.mode;
  $('result').className = 'result';
  $('result').textContent = '处理中…';
  $('btnRun').disabled = true;
  let res;
  if (mode === 'split') {
    res = await window.pdfTool.splitEveryN(currentFile, $('n').value);
  } else {
    res = await window.pdfTool.removePages(currentFile, $('start').value, $('end').value);
  }
  $('btnRun').disabled = false;
  if (res.ok) {
    $('result').className = 'result success';
    $('result').textContent = '完成!已生成 ' + res.files.length + ' 个文件:\n' + res.files.join('\n') + '\n\n输出目录:' + res.outDir;
    $('btnOpenDir').classList.remove('hidden');
  } else {
    $('result').className = 'result error';
    $('result').textContent = '失败:' + res.error;
    $('btnOpenDir').classList.add('hidden');
  }
});

$('btnOpenDir').addEventListener('click', () => {
  window.pdfTool.openOutputDir();
});
