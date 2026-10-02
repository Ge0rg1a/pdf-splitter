const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 5; i++) {
    const page = doc.addPage();
    page.drawText('Page ' + (i + 1), { x: 50, y: 700, size: 30 });
  }
  const bytes = await doc.save();
  const testFile = path.join(__dirname, 'test.pdf');
  fs.writeFileSync(testFile, bytes);
  console.log('[1] created test.pdf, pages:', doc.getPageCount());

  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();
  let seq = 1;
  for (let i = 0; i < total; i += 2) {
    const endIdx = Math.min(i + 2, total);
    const indices = [];
    for (let k = i; k < endIdx; k++) indices.push(k);
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(src, indices);
    pages.forEach(p => newDoc.addPage(p));
    fs.writeFileSync(path.join(__dirname, `split_${seq}.pdf`), await newDoc.save());
    console.log('[2] split_' + seq + ': pages ' + (i + 1) + '-' + endIdx + ', count=' + newDoc.getPageCount());
    seq++;
  }

  const keepIndices = [];
  for (let i = 0; i < total; i++) {
    if (i < 1 || i > 2) keepIndices.push(i);
  }
  const rmDoc = await PDFDocument.create();
  const rmPages = await rmDoc.copyPages(src, keepIndices);
  rmPages.forEach(p => rmDoc.addPage(p));
  fs.writeFileSync(path.join(__dirname, 'removed.pdf'), await rmDoc.save());
  console.log('[3] removed pages 2-3, remaining:', rmDoc.getPageCount());

  for (const f of ['test.pdf', 'split_1.pdf', 'split_2.pdf', 'split_3.pdf', 'removed.pdf']) {
    fs.unlinkSync(path.join(__dirname, f));
  }
  console.log('[OK] ALL TESTS PASSED');
})();
