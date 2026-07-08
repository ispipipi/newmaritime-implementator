import { Alerta, EstadoSemaforo, Tarea } from '../types';

const hoyChile = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const tareasActivas = (tareas: Tarea[]) => tareas.filter((task) => task.estado !== 'cancelada');
const tareasVencidas = (tareas: Tarea[]) => {
  const hoy = hoyChile();
  return tareasActivas(tareas).filter((task) => task.estado !== 'completada' && task.fechaFinPlan < hoy);
};
const tareasSinInicioPlan = (tareas: Tarea[]) => {
  const hoy = hoyChile();
  return tareasActivas(tareas).filter((task) => task.estado === 'pendiente' && task.fechaInicioPlan < hoy);
};
const tareasBloqueadas = (tareas: Tarea[]) => tareasActivas(tareas).filter((task) => task.estado === 'bloqueada');

export const calcPctFase = (faseId: string, tareas: Tarea[]) => {
  const t = tareas.filter((task) => task.faseId === faseId);
  if (!t.length) return 0;
  return Math.round((t.filter((task) => task.estado === 'completada').length / t.length) * 100);
};

export const calcPctProyecto = (proyectoId: string, tareas: Tarea[]) => {
  const t = tareas.filter((task) => task.proyectoId === proyectoId);
  if (!t.length) return 0;
  return Math.round((t.filter((task) => task.estado === 'completada').length / t.length) * 100);
};

export const calcPctPlanificadoProyecto = (proyectoId: string, tareas: Tarea[]) => {
  const hoy = hoyChile();
  const t = tareasActivas(tareas.filter((task) => task.proyectoId === proyectoId));
  if (!t.length) return 0;
  return Math.round((t.filter((task) => task.fechaFinPlan <= hoy).length / t.length) * 100);
};

export const calcPctPlanificadoFase = (faseId: string, tareas: Tarea[]) => {
  const hoy = hoyChile();
  const t = tareasActivas(tareas.filter((task) => task.faseId === faseId));
  if (!t.length) return 0;
  return Math.round((t.filter((task) => task.fechaFinPlan <= hoy).length / t.length) * 100);
};

export const calcCumplimientoGanttProyecto = (proyectoId: string, tareas: Tarea[]) => {
  const hoy = hoyChile();
  const vencibles = tareasActivas(tareas.filter((task) => task.proyectoId === proyectoId && task.fechaFinPlan <= hoy));
  if (!vencibles.length) return 100;
  const cumplidas = vencibles.filter((task) => task.estado === 'completada');
  return Math.round((cumplidas.length / vencibles.length) * 100);
};

export const calcCumplimientoGanttFase = (faseId: string, tareas: Tarea[]) => {
  const hoy = hoyChile();
  const vencibles = tareasActivas(tareas.filter((task) => task.faseId === faseId && task.fechaFinPlan <= hoy));
  if (!vencibles.length) return 100;
  const cumplidas = vencibles.filter((task) => task.estado === 'completada');
  return Math.round((cumplidas.length / vencibles.length) * 100);
};

export const semaforoCumplimientoProyecto = (proyectoId: string, tareas: Tarea[]): EstadoSemaforo => {
  const t = tareas.filter((task) => task.proyectoId === proyectoId);
  if (tareasVencidas(t).length) return 'rojo';
  if (tareasBloqueadas(t).length || tareasSinInicioPlan(t).length) return 'amarillo';
  return 'verde';
};

export const semaforoCumplimientoFase = (faseId: string, tareas: Tarea[]): EstadoSemaforo => {
  const t = tareas.filter((task) => task.faseId === faseId);
  if (tareasVencidas(t).length) return 'rojo';
  if (tareasBloqueadas(t).length || tareasSinInicioPlan(t).length) return 'amarillo';
  return 'verde';
};

export const semaforoProyecto = (proyectoId: string, alertas: Alerta[]): EstadoSemaforo => {
  const a = alertas.filter((alerta) => alerta.proyectoId === proyectoId && !alerta.leida);
  if (a.some((alerta) => alerta.tipo === 'vencida')) return 'rojo';
  if (a.some((alerta) => alerta.tipo === 'proxima_vencer' || alerta.tipo === 'bloqueada' || alerta.tipo === 'en_riesgo')) return 'amarillo';
  return 'verde';
};
