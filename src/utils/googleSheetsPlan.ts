import { differenceInCalendarDays, parseISO } from 'date-fns';
import { EstadoTarea, Fase, Tarea } from '../types';

export type GoogleSheetPlanRow = {
  fase?: string;
  tipo?: string;
  hito?: string;
  tarea?: string;
  inicio?: string;
  fin?: string;
  duracion?: string | number;
  responsable?: string;
  x?: string;
  estado?: string;
  realizado?: string;
  observacion?: string;
};

export type GoogleSheetPlanPayload = {
  source?: string;
  updatedAt?: string;
  rows?: GoogleSheetPlanRow[];
};

export type ImportedPlan = {
  fases: Fase[];
  tareas: Tarea[];
  fechaInicio: string;
  fechaFin: string;
  skipped: Array<{ row: number; reason: string; value: GoogleSheetPlanRow }>;
  correctedDates: Array<{ row: number; field: 'inicio' | 'fin'; from: string; to: string; value: GoogleSheetPlanRow }>;
};

const estadoMap: Record<string, EstadoTarea> = {
  pendiente: 'pendiente',
  'en proceso': 'en_proceso',
  en_proceso: 'en_proceso',
  completada: 'completada',
  completo: 'completada',
  concluido: 'completada',
  concluida: 'completada',
  realizada: 'completada',
  realizado: 'completada',
  si: 'completada',
  sí: 'completada',
  bloqueada: 'bloqueada',
  bloqueado: 'bloqueada',
  cancelada: 'cancelada',
  cancelado: 'cancelada',
};

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

const normalizeDate = (value?: string) => {
  const clean = String(value ?? '').trim();
  if (!clean) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const slashMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
};

const normalizeEstado = (value?: string): EstadoTarea => {
  const key = String(value ?? 'pendiente').trim().toLowerCase();
  return estadoMap[key] ?? 'pendiente';
};

const inferDominantYear = (rows: GoogleSheetPlanRow[]) => {
  const counts = new Map<number, number>();
  rows.forEach((row) => {
    [row.inicio, row.fin].forEach((rawDate) => {
      const normalized = normalizeDate(rawDate);
      if (!normalized) return;
      const year = Number(normalized.slice(0, 4));
      counts.set(year, (counts.get(year) ?? 0) + 1);
    });
  });

  let dominantYear: number | null = null;
  let dominantCount = 0;
  counts.forEach((count, year) => {
    if (count > dominantCount) {
      dominantYear = year;
      dominantCount = count;
    }
  });

  return { dominantYear, counts };
};

const maybeCorrectOutlierYear = (
  normalizedDate: string | null,
  dominantYear: number | null,
  counts: Map<number, number>,
) => {
  if (!normalizedDate || !dominantYear) return normalizedDate;
  const year = Number(normalizedDate.slice(0, 4));
  if (year === dominantYear) return normalizedDate;

  const dominantCount = counts.get(dominantYear) ?? 0;
  const currentCount = counts.get(year) ?? 0;
  const isLikelyOutlier = dominantCount >= 4 && currentCount <= 2 && Math.abs(year - dominantYear) === 1;
  if (!isLikelyOutlier) return normalizedDate;

  return `${dominantYear}${normalizedDate.slice(4)}`;
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

const codeForPhase = (name: string, index: number) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();
  return `${initials || 'F'}${index + 1}`;
};

const getDuration = (inicio: string, fin: string, duracion?: string | number) => {
  const explicit = Number(duracion);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  return Math.max(0, differenceInCalendarDays(parseISO(fin), parseISO(inicio)));
};

export function parseGoogleSheetPlan(payload: GoogleSheetPlanPayload | GoogleSheetPlanRow[], proyectoId: string): ImportedPlan {
  const rows = Array.isArray(payload) ? payload : payload.rows ?? [];
  const phaseByName = new Map<string, Fase>();
  const fases: Fase[] = [];
  const tareas: Tarea[] = [];
  const skipped: ImportedPlan['skipped'] = [];
  const correctedDates: ImportedPlan['correctedDates'] = [];
  const { dominantYear, counts: yearCounts } = inferDominantYear(rows);

  const getPhase = (name: string) => {
    const cleanName = name.trim() || 'Sin fase';
    const existing = phaseByName.get(cleanName);
    if (existing) return existing;

    const fase: Fase = {
      id: `${proyectoId}-sheet-fase-${slug(cleanName) || fases.length}`,
      proyectoId,
      codigo: codeForPhase(cleanName, fases.length),
      nombre: cleanName,
      orden: fases.length,
      fechaInicioPlan: '9999-12-31',
      fechaFinPlan: '0000-01-01',
    };
    phaseByName.set(cleanName, fase);
    fases.push(fase);
    return fase;
  };

  const addItem = (row: GoogleSheetPlanRow, rowIndex: number, fase: Fase, nombre: string, esMilestone: boolean, inicio: string, fin: string) => {
    const duracionDias = getDuration(inicio, fin, row.duracion);
    const tarea: Tarea = {
      id: `${proyectoId}-sheet-${esMilestone ? 'hito' : 'tarea'}-${rowIndex + 1}-${slug(nombre).slice(0, 48)}`,
      faseId: fase.id,
      proyectoId,
      nombre: esMilestone && !nombre.toLowerCase().startsWith('hito:') ? `Hito: ${nombre}` : nombre,
      descripcion: '',
      responsable: String(row.responsable ?? 'Sin asignar').trim() || 'Sin asignar',
      estado: normalizeEstado(row.estado),
      fechaInicioPlan: inicio,
      fechaFinPlan: fin,
      duracionDias,
      esMilestone,
      observacion: String(row.observacion ?? '').trim(),
      actualizadoEn: new Date().toISOString(),
      historial: [],
    };

    if (tarea.estado === 'completada') {
      tarea.fechaInicioReal = inicio;
      tarea.fechaFinReal = fin;
    }

    fase.fechaInicioPlan = fase.fechaInicioPlan < inicio ? fase.fechaInicioPlan : inicio;
    fase.fechaFinPlan = fase.fechaFinPlan > fin ? fase.fechaFinPlan : fin;
    tareas.push(tarea);
  };

  let currentPhase = 'Planificacion';

  rows.forEach((row, index) => {
    const inicioOriginal = normalizeDate(row.inicio);
    const finOriginal = normalizeDate(row.fin) ?? inicioOriginal;
    const inicio = maybeCorrectOutlierYear(inicioOriginal, dominantYear, yearCounts);
    const fin = maybeCorrectOutlierYear(finOriginal, dominantYear, yearCounts) ?? inicio;
    const faseFromRow = String(row.fase ?? '').trim();
    if (faseFromRow) currentPhase = faseFromRow;
    const faseName = currentPhase;
    const tareaName = String(row.tarea ?? '').trim();
    const hitoName = String(row.hito ?? '').trim();
    const tipo = String(row.tipo ?? '').trim().toLowerCase();

    if (inicioOriginal && inicio && inicioOriginal !== inicio) {
      correctedDates.push({ row: index + 2, field: 'inicio', from: inicioOriginal, to: inicio, value: row });
    }
    if (finOriginal && fin && finOriginal !== fin) {
      correctedDates.push({ row: index + 2, field: 'fin', from: finOriginal, to: fin, value: row });
    }

    if (!inicio || !fin) {
      skipped.push({ row: index + 2, reason: 'Fecha inicio/fin inválida o vacía', value: row });
      return;
    }

    if (!faseName) {
      skipped.push({ row: index + 2, reason: 'Fase vacía', value: row });
      return;
    }

    if (!tareaName && !hitoName) {
      skipped.push({ row: index + 2, reason: 'Tarea e hito vacíos', value: row });
      return;
    }

    const fase = getPhase(faseName);
    if (hitoName && (tipo === 'hito' || !tipo || tareaName)) addItem(row, index, fase, hitoName, true, inicio, fin);
    if (tareaName && tipo !== 'hito') addItem(row, index, fase, tareaName, false, inicio, fin);
  });

  const fasesConTareas = fases.filter((fase) => tareas.some((tarea) => tarea.faseId === fase.id));
  fasesConTareas.forEach((fase, index) => {
    fase.orden = index;
    if (fase.fechaInicioPlan === '9999-12-31') fase.fechaInicioPlan = fase.fechaFinPlan;
    if (fase.fechaFinPlan === '0000-01-01') fase.fechaFinPlan = fase.fechaInicioPlan;
  });

  const fechaInicio = tareas.reduce((min, tarea) => (tarea.fechaInicioPlan < min ? tarea.fechaInicioPlan : min), '9999-12-31');
  const fechaFin = tareas.reduce((max, tarea) => (tarea.fechaFinPlan > max ? tarea.fechaFinPlan : max), '0000-01-01');

  return {
    fases: fasesConTareas,
    tareas,
    fechaInicio: fechaInicio === '9999-12-31' ? new Date().toISOString().slice(0, 10) : fechaInicio,
    fechaFin: fechaFin === '0000-01-01' ? new Date().toISOString().slice(0, 10) : fechaFin,
    skipped,
    correctedDates,
  };
}

export function parseGoogleSheetCsv(csvText: string): GoogleSheetPlanRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => {
    const item: Record<string, string> = {};
    headers.forEach((header, index) => {
      item[header] = values[index]?.trim() ?? '';
    });

    return {
      fase: item.fase,
      tipo: item.tipo,
      hito: item.hito,
      tarea: item.tarea,
      inicio: item.inicio,
      fin: item.fin,
      duracion: item.duracion,
      responsable: item.x || item.responsable,
      x: item.x,
      estado: item.estado || item.realizado,
      realizado: item.realizado,
      observacion: item.observacion,
    };
  });
}

export function normalizeGoogleSheetSourceUrl(url: string) {
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return cleanUrl;

  const gid = cleanUrl.match(/[?&#]gid=(\d+)/)?.[1] ?? '0';
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}
