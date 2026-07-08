import { Calendar, ChevronRight } from 'lucide-react';
import { Fase, Tarea } from '../../types';
import { useAppStore, calcCumplimientoGanttFase, calcPctFase, calcPctPlanificadoFase, semaforoCumplimientoFase } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';

type Props = {
  fase: Fase;
  tareas: Tarea[];
};

export function FaseCard({ fase, tareas }: Props) {
  const setVista = useAppStore((s) => s.setVista);
  const pct = calcPctFase(fase.id, tareas);
  const cumplimiento = calcCumplimientoGanttFase(fase.id, tareas);
  const planificado = calcPctPlanificadoFase(fase.id, tareas);
  const semaforo = semaforoCumplimientoFase(fase.id, tareas);
  const tareasFase = tareas.filter((t) => t.faseId === fase.id);
  const estado = pct === 100 ? 'completada' : tareasFase.some((t) => t.estado === 'en_proceso') ? 'en_proceso' : 'pendiente';

  return (
    <GlassCard interactive className="p-4">
      <button className="w-full text-left" onClick={() => setVista('fase', fase.proyectoId, fase.id)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-semibold text-emerald-200">{fase.codigo}</span>
            <h3 className="mt-3 text-lg font-semibold text-white">{fase.nombre}</h3>
          </div>
          <div className="flex items-center gap-3">
            <TrafficLightOrb estado={semaforo} size="sm" />
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {fase.fechaInicioPlan} / {fase.fechaFinPlan}
          </span>
          <StatusBadge estado={estado} />
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Cumplimiento Gantt</span>
          <span className="font-semibold text-white">{cumplimiento}%</span>
        </div>
        <ProgressBar value={cumplimiento} tone={semaforo === 'rojo' ? 'red' : semaforo === 'amarillo' ? 'amber' : 'emerald'} />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{tareasFase.length} tareas</span>
          <span>Plan {planificado}% · Avance {pct}%</span>
        </div>
      </button>
    </GlassCard>
  );
}
