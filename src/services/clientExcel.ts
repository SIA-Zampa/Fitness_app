import { db } from '../database/db';
import { clientAge, clientMeasurements, clientSexLabels, historicalWeeklyMeasurements, measurementChange, monthlyMeasurements } from '../models/clientProfile';
import { downloadExcel, excelFileName } from './excelDownload';

export async function downloadClientExcel(id: string) {
  const client = await db.clients.get(id);
  if (!client) throw new Error('Cliente non trovato.');

  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook();
  book.creator = 'Fitness App';
  const sheet = book.addWorksheet('Anagrafica cliente');
  sheet.columns = [{ width: 26 }, { width: 50 }];
  sheet.addRow(['Anagrafica cliente']).font = { bold: true, size: 14 };
  sheet.mergeCells('A1:B1');
  sheet.addRows([
    ['Nome', client.name],
    ['Data di nascita', client.birthDate ? new Date(`${client.birthDate}T00:00:00Z`) : null],
    ['Età (anni)', clientAge(client)],
    ['Sesso', clientSexLabels[client.sex ?? '']],
    ['Peso (kg)', client.weightKg],
    ['Livello', client.level],
    ['Stato', client.archived ? 'Archiviato' : 'Attivo'],
    ['Eventuali criticità', client.criticalities],
    ['Ulteriori note', client.notes],
  ]);
  sheet.getCell('B3').numFmt = 'dd/mm/yyyy';
  sheet.getRow(9).height = 60;
  sheet.getRow(10).height = 60;
  const months = monthlyMeasurements(client);
  const weeks = historicalWeeklyMeasurements(client);
  sheet.addRow(['Circonferenze per mese (cm)']).font = { bold: true };
  const monthlyHeader = sheet.addRow(['Misura', ...months.map((item) => `Mese ${item.month}`), 'Variazione mensile (cm)']);
  monthlyHeader.font = { bold: true };
  monthlyHeader.height = 30;
  for (let column = 3; column <= Math.max(months.length + 2, weeks.length + 1); column++) {
    sheet.getColumn(column).width = 18;
  }
  sheet.getColumn(months.length + 2).width = months.length ? 25 : 50;
  for (const { key, label } of clientMeasurements) {
    sheet.addRow([label, ...months.map((item) => item.measurementsCm[key] ?? null), measurementChange(months, key) ?? null]);
  }
  if (weeks.length > 0) {
    sheet.addRow([]);
    sheet.addRow(['Storico delle rilevazioni settimanali precedenti (cm)']).font = { bold: true };
    sheet.addRow(['Misura', ...weeks.map((item) => `Settimana ${item.week}`)]).font = { bold: true };
    for (const { key, label } of clientMeasurements) {
      sheet.addRow([label, ...weeks.map((item) => item.measurementsCm[key] ?? null)]);
    }
  }
  sheet.eachRow((row) => row.eachCell((cell) => {
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }));

  await downloadExcel(book, `anagrafica_${excelFileName(client.name, 'cliente')}.xlsx`);
}
