import type { Workbook, Worksheet } from 'exceljs';

export async function addExcelBrandHeader(book: Workbook, sheet: Worksheet, columnCount: number, startColumn = 0) {
  const response = await fetch(new URL('./images/brand-logo.png', document.baseURI));
  if (!response.ok) throw new Error('Logo non disponibile per l’esportazione Excel.');

  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Impossibile leggere il logo.'));
    reader.readAsDataURL(blob);
  });

  for (let row = 0; row < 5; row++) {
    sheet.addRow([]).height = 42;
  }
  sheet.mergeCells(1, 1, 5, columnCount);
  sheet.addImage(book.addImage({ base64, extension: 'png' }), {
    tl: { col: startColumn, row: 0.35 },
    ext: { width: 370, height: 185 },
  });
}
