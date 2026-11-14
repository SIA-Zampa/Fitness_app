import { db } from '../database/db';
import { downloadExcel, excelFileName } from './excelDownload';
import { addExcelBrandHeader } from './excelBrand';
import { progressWeekCount } from '../models/workoutOptions';
import { formatCalendarDate } from '../models/calendar';

const headings = ['#', 'Gruppo / area', 'Esercizio', 'Tipo movimento', 'Serie', 'Rip./tempo', 'Recupero', 'RIR / RPE', 'Carico', 'Tecnica intensita', 'Progressione', 'Incremento', 'Note'];
const weekCount = progressWeekCount;

function excelLoad(value?: string): number | string {
  const load = value?.trim() ?? '';
  if (!load) return '';
  const numeric = load.replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  return numeric ? Number(numeric[1]) : load;
}

export async function downloadWorkoutPlanExcel(planId: string, clientId?: string) {
  const { default: ExcelJS } = await import('exceljs');
  const plan = await db.workoutPlans.get(planId);
  if (!plan) throw new Error('Scheda non trovata.');
  const [client, days, assignments, exercises] = await Promise.all([
    clientId ? db.clients.get(clientId) : undefined,
    db.workoutDays.where('planId').equals(planId).sortBy('order'),
    db.workoutExercises.toArray(),
    db.exercises.toArray(),
  ]);
  const totalColumns = headings.length + weekCount;
  const showActivation = plan.sex === 'F';
  const weeklyHeadings = Array.from({ length: weekCount }, (_, index) => `Progressione ${index + 1}`);
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const book = new ExcelJS.Workbook();
  book.creator = 'Fitness App';
  const sheet = book.addWorksheet('Scheda Cliente');
  sheet.columns = [6, 18, 31, 19, 8, 13, 12, 11, 14, 20, 18, 12, 35, ...Array(weekCount).fill(18)].map((width) => ({ width }));
  sheet.pageSetup.orientation = 'landscape';
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = Math.ceil(totalColumns / headings.length);
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.margins = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };

  await addExcelBrandHeader(book, sheet, totalColumns, 3);

  function addColumnHeader() {
    const header = sheet.addRow([...headings, ...weeklyHeadings]);
    header.font = { bold: true, color: { argb: 'FF0B397A' }, size: 9 };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2FC' } };
    header.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    header.height = 30;
  }

  function band(label: string, color = '0B397A') {
    const row = sheet.addRow([label]);
    sheet.mergeCells(row.number, 1, row.number, totalColumns);
    row.height = 24;
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } };
    row.alignment = { vertical: 'middle' };
    return row;
  }

  function clientRow(leftLabel: string, leftValue: string | number, rightLabel: string, rightValue: string | number) {
    const row = sheet.addRow([]);
    const lines = Math.max(Math.ceil(String(leftValue).length / 48), Math.ceil(String(rightValue).length / 40), 1);
    row.height = Math.min(90, Math.max(28, lines * 16 + 12));
    row.getCell(1).value = leftLabel;
    row.getCell(3).value = leftValue;
    row.getCell(6).value = rightLabel;
    row.getCell(8).value = rightValue;
    sheet.mergeCells(row.number, 1, row.number, 2);
    sheet.mergeCells(row.number, 3, row.number, 4);
    sheet.mergeCells(row.number, 6, row.number, 7);
    sheet.mergeCells(row.number, 8, row.number, 10);
    for (const labelColumn of [1, 6]) {
      row.getCell(labelColumn).font = { bold: true, color: { argb: 'FF0B397A' } };
    }
    for (const valueColumn of [3, 8]) {
      row.getCell(valueColumn).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }
    return row;
  }

  const height = [...(client?.measurementsByMonth ?? [])].reverse()
    .find((item) => item.measurementsCm.height !== undefined)?.measurementsCm.height
    ?? client?.measurementsCm?.height;
  band('CLIENTE');
  clientRow('Nome', client?.name ?? '', 'Età', client?.age ?? '');
  clientRow('Obiettivo', client?.goals ?? '', 'Livello', client?.level ?? '');
  clientRow('Sesso', client?.sex ?? '', 'Data nascita', formatCalendarDate(client?.birthDate));
  clientRow('Peso', client?.weightKg === undefined ? '' : `${client.weightKg} kg`,
    'Altezza', height === undefined ? '' : `${height} cm`);

  band('SCHEDA DI ALLENAMENTO');
  const titleRow = sheet.addRow(['Titolo', plan.name]);
  sheet.mergeCells(titleRow.number, 2, titleRow.number, totalColumns);
  titleRow.height = 28;
  titleRow.alignment = { vertical: 'middle' };
  sheet.addRow([]);

  for (const day of days) {
    band(day.name || `Giorno ${day.order}`, '174A88');
    const meta = sheet.addRow(['Focus', day.focus ?? '', '', '', 'Note iniziali', day.initialNotes ?? '']);
    sheet.mergeCells(meta.number, 2, meta.number, 4);
    sheet.mergeCells(meta.number, 6, meta.number, totalColumns);
    meta.height = 30;
    meta.alignment = { vertical: 'middle', wrapText: true };
    const entries = assignments.filter((item) => item.workoutDayId === day.id).sort((a, b) => a.order - b.order);
    const sections: Array<{ key: 'mobility' | 'activation' | 'main'; title: string }> = [
      { key: 'mobility', title: '01  MOBILITA ARTICOLARE' },
      ...(showActivation ? [{ key: 'activation' as const, title: '02  ATTIVAZIONE / PROPRIOCEZIONE GLUTEI' }] : []),
      { key: 'main', title: showActivation ? '03  ALLENAMENTO PRINCIPALE' : '02  ALLENAMENTO PRINCIPALE' },
    ];
    for (const section of sections) {
      band(section.title, 'E4EFFB').font = { bold: true, color: { argb: 'FF0B397A' }, size: 10 };
      addColumnHeader();
      const sectionEntries = entries.filter((entry) => (entry.section ?? 'main') === section.key);
      for (const [index, entry] of sectionEntries.entries()) {
        const exercise = byId.get(entry.exerciseId);
        const stripe = index % 2 === 0 ? 'FFFFFFFF' : 'FFEAF2FC';
        const row = sheet.addRow([index + 1, exercise?.muscleGroup ?? '', exercise?.name ?? 'Esercizio non trovato', entry.movementType ?? '', entry.sets, entry.repetitions, entry.restSeconds, entry.effort ?? '', excelLoad(entry.load), entry.intensityTechnique ?? '', entry.progression ?? '', entry.increment ?? '', entry.notes ?? '']);
        if (exercise?.videoUrl) {
          row.getCell(3).value = { text: exercise.name, hyperlink: exercise.videoUrl, tooltip: 'Apri il video dell’esercizio' };
          row.getCell(3).font = { color: { argb: 'FF1554A4' }, underline: true };
        }
        if (typeof row.getCell(9).value === 'number') {
          row.getCell(9).numFmt = Number.isInteger(row.getCell(9).value as number) ? '0" kg"' : '0.0#" kg"';
        }
        row.height = 32;
        row.alignment = { vertical: 'middle', wrapText: true };
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripe } };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFD7E4F3' } } };
        });
        let weeklyLines = 1;
        for (let week = 1; week <= weekCount; week++) {
          const cell = row.getCell(headings.length + week);
          cell.value = entry.weeklyInstructions?.[week - 1]?.trim() ?? '';
          weeklyLines = Math.max(weeklyLines, String(cell.value).split('\n').reduce((count, line) => count + Math.max(1, Math.ceil(line.length / 16)), 0));
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripe } };
          const edge = { style: 'thin' as const, color: { argb: 'FFB8CAE5' } };
          cell.border = { top: edge, bottom: edge, left: edge, right: edge };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        row.height = Math.min(220, Math.max(32, weeklyLines * 14 + 8));
        // These fields also accept ranges and values with units, stored as text.
        for (const column of [6, 8, 9, 12]) {
          const cell = row.getCell(column);
          if (typeof cell.value === 'string' && /^\s*[+-]?\d/.test(cell.value)) {
            cell.alignment = { ...cell.alignment, horizontal: 'center' };
          }
        }
      }
    }
    const observations = sheet.addRow(['NOTE', day.observations ?? '']);
    sheet.mergeCells(observations.number, 2, observations.number, totalColumns);
    observations.height = 40;
    observations.alignment = { vertical: 'middle', wrapText: true };
    sheet.addRow([]);
  }

  sheet.eachRow((row) => row.eachCell((cell) => {
    if (typeof cell.value === 'number') {
      cell.alignment = { ...cell.alignment, horizontal: 'center' };
    }
  }));

  await downloadExcel(book, `${excelFileName(plan.name, 'scheda')}_v${plan.version}.xlsx`);
}
