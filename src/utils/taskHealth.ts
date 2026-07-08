import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Tarea } from '../types';

export const diasParaVencimiento = (tarea: Tarea) => {
  if (tarea.estado === 'completada' || tarea.estado === 'cancelada') return null;
  return differenceInCalendarDays(parseISO(tarea.fechaFinPlan), new Date());
};

export const diasVencida = (tarea: Tarea) => {
  const dias = diasParaVencimiento(tarea);
  return dias !== null && dias < 0 ? Math.abs(dias) : 0;
};

export const tareaEstaVencida = (tarea: Tarea) => diasVencida(tarea) > 0;

export const tareaVenceHoy = (tarea: Tarea) => diasParaVencimiento(tarea) === 0;

export const tareaVencePronto = (tarea: Tarea, maxDias = 2) => {
  const dias = diasParaVencimiento(tarea);
  return dias !== null && dias > 0 && dias <= maxDias;
};
