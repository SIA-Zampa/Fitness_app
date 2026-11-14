import { db } from '../database/db';
import { clientAge, clientMeasurements, clientSexLabels, historicalWeeklyMeasurements, measurementChange, monthlyMeasurements, monthlyWeight } from '../models/clientProfile';
import { downloadExcel, excelFileName } from './excelDownload';
import { addExcelBrandHeader } from './excelBrand';
import type { MonthlyStrengthProgress } from '../database/db';
import { calendarWeekLabel, formatCalendarDate, formatCalendarMonth, weightForCalendarWeek } from '../models/calendar';

function strengthChart(rows: MonthlyStrengthProgress[], exerciseName: string) {
  const width = Math.max(900, rows.length * 90 + 140);
  const height = 360;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Impossibile creare il grafico delle progressioni.');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#10294D';
  context.font = 'bold 20px Arial, sans-serif';
  context.fillText(`Progressione carico · ${exerciseName}`, 85, 30);

  const left = 85;
  const right = width - 40;
  const top = 55;
  const bottom = 285;
  const max = Math.max(1, Math.ceil(Math.max(...rows.map((row) => row.weightKg)) * 1.1));
  context.font = '14px Arial, sans-serif';
  context.textAlign = 'right';
  for (let tick = 0; tick <= 4; tick++) {
    const value = max * tick / 4;
    const y = bottom - (bottom - top) * tick / 4;
    context.strokeStyle = '#D7E4F3';
    context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.stroke();
    context.fillStyle = '#526783';
    context.fillText(Number(value.toFixed(1)).toLocaleString('it-IT'), left - 10, y + 5);
  }
  context.strokeStyle = '#0B397A';
  context.beginPath(); context.moveTo(left, top); context.lineTo(left, bottom); context.lineTo(right, bottom); context.stroke();
  context.save();
  context.translate(24, (top + bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.fillStyle = '#10294D';
  context.font = 'bold 15px Arial, sans-serif';
  context.fillText('Carico (kg)', 0, 0);
  context.restore();

  const points = rows.map((row, index) => ({
    x: rows.length === 1 ? (left + right) / 2 : left + (right - left) * index / (rows.length - 1),
    y: bottom - row.weightKg / max * (bottom - top),
    row,
  }));
  context.strokeStyle = '#1554A4';
  context.lineWidth = 3;
  context.beginPath();
  points.forEach(({ x, y }, index) => index === 0 ? context.moveTo(x, y) : context.lineTo(x, y));
  context.stroke();
  context.textAlign = 'center';
  context.font = '13px Arial, sans-serif';
  for (const { x, y, row } of points) {
    context.fillStyle = '#0B397A';
    context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#526783';
    context.fillText(row.month, x, bottom + 22);
  }
  context.fillStyle = '#10294D';
  context.font = 'bold 15px Arial, sans-serif';
  context.fillText('Mese', (left + right) / 2, height - 18);
  return { image: canvas.toDataURL('image/png'), width };
}

export async function downloadClientExcel(id: string) {
  const client = await db.clients.get(id);
  if (!client) throw new Error('Cliente non trovato.');

  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook();
  book.creator = 'Fitness App';
  const sheet = book.addWorksheet('Anagrafica cliente');
  sheet.columns = [{ width: 26 }, { width: 50 }];
  const months = monthlyMeasurements(client);
  const weeks = historicalWeeklyMeasurements(client);
  const columnCount = Math.max(2, months.length + 2, weeks.length + 1);
  await addExcelBrandHeader(book, sheet, columnCount);
  const titleRow = sheet.addRow(['Anagrafica cliente']);
  titleRow.font = { bold: true, size: 14 };
  sheet.mergeCells(titleRow.number, 1, titleRow.number, columnCount);
  const detailsStartRow = titleRow.number + 1;
  const detailRows = sheet.addRows([
    ['Nome', client.name],
    ['Data di nascita', client.birthDate ? new Date(`${client.birthDate}T00:00:00Z`) : null],
    ['Età (anni)', clientAge(client)],
    ['Sesso', clientSexLabels[client.sex ?? '']],
    ['Peso (kg)', client.weightKg],
    ['Livello', client.level],
    ['Stato', client.archived ? 'Archiviato' : 'Attivo'],
    ['Eventuali criticità', client.criticalities],
    ['Ulteriori note', client.notes],
    ['Obiettivi personali', client.goals],
    ['Ore di sonno', client.sleepHours],
    ['Patologie/problematiche', client.pathologies],
    ['Stile di vita e abitudini', client.lifestyle],
    ['Giorni allenamento', (client.trainingDays ?? []).map((day) => ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][day - 1]).join(', ')],
  ]);
  sheet.getCell(detailsStartRow + 1, 2).numFmt = 'dd/mm/yyyy';
  for (const row of detailRows.slice(7)) row.height = 60;
  sheet.addRow(['Peso e circonferenze per mese']).font = { bold: true };
  const monthlyHeader = sheet.addRow(['Misura', ...months.map((item) => formatCalendarMonth(item.calendarMonth) || `Data da assegnare (${item.month})`), 'Variazione mensile']);
  monthlyHeader.font = { bold: true };
  monthlyHeader.height = 30;
  for (let column = 3; column <= Math.max(months.length + 2, weeks.length + 1); column++) {
    sheet.getColumn(column).width = 18;
  }
  sheet.getColumn(months.length + 2).width = months.length ? 25 : 50;
  const monthlyWeights = months.map((item) => monthlyWeight(client, item)).filter((value): value is number => value !== undefined);
  const weightChange = monthlyWeights.length > 1 ? monthlyWeights[monthlyWeights.length - 1] - monthlyWeights[monthlyWeights.length - 2] : null;
  sheet.addRow(['Peso corporeo (kg)', ...months.map((item) => monthlyWeight(client, item) ?? null), weightChange]);
  for (const { key, label } of clientMeasurements) {
    sheet.addRow([label, ...months.map((item) => item.measurementsCm[key] ?? null), measurementChange(months, key) ?? null]);
  }
  if (weeks.length > 0) {
    sheet.addRow([]);
    sheet.addRow(['Storico delle rilevazioni precedenti (cm)']).font = { bold: true };
    sheet.addRow(['Misura', ...weeks.map((item) => formatCalendarDate(item.date) || 'Data da assegnare')]).font = { bold: true };
    for (const { key, label } of clientMeasurements) {
      sheet.addRow([label, ...weeks.map((item) => item.measurementsCm[key] ?? null)]);
    }
  }
  if (client.weightHistory?.length) {
    sheet.addRow([]);
    sheet.addRow(['Peso corporeo nel tempo']).font = { bold: true };
    sheet.addRow(['Data rilevazione', 'Peso corporeo (kg)']).font = { bold: true };
    for (const entry of [...client.weightHistory].sort((a, b) => a.date.localeCompare(b.date))) {
      sheet.addRow([formatCalendarDate(entry.date), entry.weightKg]);
    }
  }
  sheet.eachRow((row) => row.eachCell((cell) => {
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }));

  const [exercises, assignments, days, plans] = await Promise.all([
    db.exercises.toArray(),
    db.workoutExercises.toArray(),
    db.workoutDays.toArray(),
    db.workoutPlans.toArray(),
  ]);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
  const monthlyByExercise = new Map<string, MonthlyStrengthProgress[]>();
  for (const progress of client.monthlyStrength ?? []) {
    monthlyByExercise.set(progress.exerciseId, [...(monthlyByExercise.get(progress.exerciseId) ?? []), progress]);
  }
  let progressIndex = 0;
  for (const [exerciseId, entries] of monthlyByExercise) {
    const name = exerciseById.get(exerciseId) ?? 'Esercizio non disponibile';
    const sheetName = `${++progressIndex} ${name}`.replace(/[\\/*?:\[\]]/g, ' ').slice(0, 31).replace(/'$/, '');
    const progressSheet = book.addWorksheet(sheetName);
    progressSheet.columns = [{ width: 18 }, { width: 16 }, { width: 18 }, { width: 54 }];
    const title = progressSheet.addRow([`Progressi mensili · ${name}`]);
    title.font = { bold: true, color: { argb: 'FF0B397A' }, size: 15 };
    title.height = 32;
    progressSheet.mergeCells(title.number, 1, title.number, 4);
    progressSheet.addRow([]);
    const header = progressSheet.addRow(['Mese', 'Carico (kg)', 'Ripetizioni', 'Note']);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B397A' } };
    header.height = 28;
    const sorted = [...entries].sort((a, b) => a.month.localeCompare(b.month));
    for (const [index, entry] of sorted.entries()) {
      const row = progressSheet.addRow([entry.month, entry.weightKg, entry.repetitions, entry.notes ?? '']);
      row.height = 26;
      if (index % 2) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2FC' } }; });
    }
    progressSheet.eachRow((row) => row.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }));
    const { image, width } = strengthChart(sorted, name);
    const chartStart = progressSheet.rowCount + 2;
    progressSheet.addImage(book.addImage({ base64: image, extension: 'png' }), {
      tl: { col: 0, row: chartStart }, ext: { width, height: 360 },
    });
    for (let index = 0; index < 20; index++) progressSheet.addRow([]).height = 18;
  }

  if (client.weeklyProgressions?.length) {
    const weeklySheet = book.addWorksheet('Progressioni settimanali', { views: [{ state: 'frozen', ySplit: 2 }] });
    weeklySheet.columns = [30, 20, 30, 28, 42, 19, 18, 18, 18, 40].map((width) => ({ width }));
    const title = weeklySheet.addRow(['Progressioni settimanali']);
    title.font = { bold: true, color: { argb: 'FF0B397A' }, size: 15 };
    title.height = 32;
    weeklySheet.mergeCells(title.number, 1, title.number, 10);
    const header = weeklySheet.addRow(['Scheda', 'Giorno', 'Esercizio', 'Periodo calendario', 'Programmazione', 'Peso corporeo (kg)', 'Ripetizioni', '% carico', 'Carico esercizio (kg)', 'Note']);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B397A' } };
    header.height = 30;
    const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
    const dayById = new Map(days.map((day) => [day.id, day]));
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    for (const [index, entry] of client.weeklyProgressions.entries()) {
      const assignment = assignmentById.get(entry.workoutExerciseId);
      const day = assignment ? dayById.get(assignment.workoutDayId) : undefined;
      const plan = day ? planById.get(day.planId) : undefined;
      const row = weeklySheet.addRow([plan?.name ?? 'Scheda non disponibile', day?.name ?? '', assignment ? exerciseById.get(assignment.exerciseId) ?? 'Esercizio non disponibile' : 'Esercizio non disponibile', calendarWeekLabel(plan?.startDate, entry.week), assignment?.weeklyInstructions?.[entry.week - 1] ?? '', weightForCalendarWeek(client.weightHistory, plan?.startDate, entry.week) ?? null, entry.repetitions ?? null, entry.loadPercent ?? null, entry.weightKg ?? null, entry.notes ?? '']);
      row.height = 45;
      if (index % 2) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2FC' } }; });
    }
    weeklySheet.eachRow((row) => row.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }));
  }

  await downloadExcel(book, `anagrafica_${excelFileName(client.name, 'cliente')}.xlsx`);
}
