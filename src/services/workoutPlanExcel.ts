import { db } from '../database/db';

const headings = ['#', 'Gruppo / area', 'Esercizio', 'Tipo movimento', 'Serie', 'Rip./tempo', 'Recupero', 'RIR / RPE', 'Carico', 'Tecnica intensita', 'Progressione', 'Incremento', 'Note'];

function safeName(value: string) {
  return value.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'scheda';
}

function excelLoad(value?: string): number | string {
  const load = value?.trim() ?? '';
  if (!load) return '';
  const numeric = load.replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  return numeric ? Number(numeric[1]) : load;
}

export async function downloadWorkoutPlanExcel(planId: string) {
  const { default: ExcelJS } = await import('exceljs');
  const plan = await db.workoutPlans.get(planId);
  if (!plan) throw new Error('Scheda non trovata.');

  const [client, days, assignments, exercises] = await Promise.all([
    plan.clientId ? db.clients.get(plan.clientId) : undefined,
    db.workoutDays.where('planId').equals(planId).sortBy('order'),
    db.workoutExercises.toArray(),
    db.exercises.toArray(),
  ]);
  const female = (client?.sex ?? plan.sex) === 'F';
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const book = new ExcelJS.Workbook();
  book.creator = 'Fitness App';
  const sheet = book.addWorksheet('Scheda Cliente', { views: [{ state: 'frozen', ySplit: 5 }] });
  sheet.columns = [6, 18, 31, 19, 8, 13, 12, 11, 14, 20, 18, 12, 35].map((width) => ({ width }));
  sheet.pageSetup.orientation = 'landscape';
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.margins = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };

  function band(label: string, color = '17634B') {
    const row = sheet.addRow([label]);
    sheet.mergeCells(row.number, 1, row.number, 13);
    row.height = 24;
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } };
    row.alignment = { vertical: 'middle' };
    return row;
  }

  band('SCHEDA CLIENTE', '143D32');
  sheet.addRow(['Cliente', client?.name ?? '', '', '', 'Data', new Date(plan.updatedAt), 'Settimane', plan.weeks ?? '', 'Trainer', plan.trainer ?? '']);
  sheet.getCell('F2').numFmt = 'dd/mm/yyyy';
  sheet.addRow(['Obiettivo', plan.goal ?? '', '', '', 'Livello', plan.level ?? '', 'Giorni', days.length, 'Sesso', client?.sex ?? plan.sex ?? '', 'RIR / RPE', plan.effortScale ?? 'RIR']);
  const notesRow = sheet.addRow(['Note generali', plan.description ?? '']);
  sheet.mergeCells(notesRow.number, 2, notesRow.number, 13);
  notesRow.height = 36;
  notesRow.alignment = { vertical: 'middle', wrapText: true };
  sheet.addRow([]);

  for (const day of days) {
    band(day.name || `Giorno ${day.order}`, '285E73');
    const meta = sheet.addRow(['Focus', day.focus ?? '', '', '', 'Note iniziali', day.initialNotes ?? '']);
    sheet.mergeCells(meta.number, 2, meta.number, 4);
    sheet.mergeCells(meta.number, 6, meta.number, 13);
    meta.height = 30;
    meta.alignment = { vertical: 'middle', wrapText: true };
    const entries = assignments.filter((item) => item.workoutDayId === day.id).sort((a, b) => a.order - b.order);
    const sections: Array<{ key: 'mobility' | 'activation' | 'main'; title: string }> = [
      { key: 'mobility', title: '01  MOBILITA ARTICOLARE' },
      ...(female ? [{ key: 'activation' as const, title: '02  ATTIVAZIONE / PROPRIOCEZIONE GLUTEI' }] : []),
      { key: 'main', title: female ? '03  ALLENAMENTO PRINCIPALE' : '02  ALLENAMENTO PRINCIPALE' },
    ];
    for (const section of sections) {
      band(section.title, 'DCECE6').font = { bold: true, color: { argb: 'FF143D32' }, size: 10 };
      const header = sheet.addRow(headings);
      header.font = { bold: true, color: { argb: 'FF24483B' }, size: 9 };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F5F2' } };
      header.alignment = { wrapText: true, vertical: 'middle' };
      header.height = 30;
      const sectionEntries = entries.filter((entry) => (entry.section ?? 'main') === section.key);
      for (const [index, entry] of sectionEntries.entries()) {
        const exercise = byId.get(entry.exerciseId);
        const row = sheet.addRow([index + 1, exercise?.muscleGroup ?? '', exercise?.name ?? 'Esercizio non trovato', entry.movementType ?? '', entry.sets, entry.repetitions, entry.restSeconds, entry.effort ?? '', excelLoad(entry.load), entry.intensityTechnique ?? '', entry.progression ?? '', entry.increment ?? '', entry.notes ?? '']);
        if (typeof row.getCell(9).value === 'number') {
          row.getCell(9).numFmt = Number.isInteger(row.getCell(9).value as number) ? '0" kg"' : '0.0#" kg"';
        }
        row.height = 32;
        row.alignment = { vertical: 'middle', wrapText: true };
        row.eachCell((cell) => { cell.border = { bottom: { style: 'hair', color: { argb: 'FFCBD9D1' } } }; });
      }
    }
    const observations = sheet.addRow(['NOTE E OSSERVAZIONI DELLA GIORNATA', day.observations ?? '']);
    sheet.mergeCells(observations.number, 2, observations.number, 13);
    observations.height = 40;
    observations.alignment = { vertical: 'middle', wrapText: true };
    sheet.addRow([]);
  }

  const bytes = await book.xlsx.writeBuffer();
  const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName(plan.name)}_v${plan.version}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
