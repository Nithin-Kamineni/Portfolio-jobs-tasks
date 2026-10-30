// Builds a small, valid PDF with the given text lines (Helvetica, one line per row), so the PDF e-mail tests
// need no binary fixtures. Names and addresses in the tests are fictional (*.example domains).
export function makePdf(pages: string[][]): Buffer {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const objs: string[] = [];
  const pageIds: number[] = [];
  // 1: catalog, 2: pages, 3: font; then per page: page + content stream
  let next = 4;
  const pageObjs: [number, string][] = [];
  for (const lines of pages) {
    const pageId = next++; const contentId = next++;
    pageIds.push(pageId);
    const stream = ['BT', '/F1 11 Tf', '14 TL', '56 760 Td', ...lines.map((l) => `(${esc(l)}) Tj T*`), 'ET'].join('\n');
    pageObjs.push([pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`]);
    pageObjs.push([contentId, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`]);
  }
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  for (const [id, body] of pageObjs) objs[id] = body;
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = Buffer.byteLength(out, 'latin1');
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
