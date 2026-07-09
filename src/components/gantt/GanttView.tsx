import Gantt, { GanttTask } from 'frappe-gantt';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Fase, Tarea } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../i18n/useT';
import { GlassCard } from '../ui/GlassCard';

type Props = {
  fases: Fase[];
  tareas: Tarea[];
};

const progressByState = {
  pendiente: 0,
  en_proceso: 45,
  completada: 100,
  bloqueada: 20,
  cancelada: 0,
};

const FASE_PREFIX = 'fase-row__';

export function GanttView({ fases, tareas }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const actualizarFechasGantt = useAppStore((s) => s.actualizarFechasGantt);
  const idioma = useAppStore((s) => s.idioma);
  const t = useT();
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const fasesConTareas = useMemo(
    () =>
      [...fases]
        .sort((a, b) => a.orden - b.orden)
        .map((fase) => ({ fase, tareasFase: tareas.filter((t) => t.faseId === fase.id) }))
        .filter((grupo) => grupo.tareasFase.length > 0),
    [fases, tareas],
  );

  const toggleFase = (faseId: string) => {
    setExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(faseId)) next.delete(faseId);
      else next.add(faseId);
      return next;
    });
  };

  const ganttTasks = useMemo<GanttTask[]>(() => {
    const rows: GanttTask[] = [];

    fasesConTareas.forEach(({ fase, tareasFase }) => {
      const abierta = expandidas.has(fase.id);
      const inicios = tareasFase.map((t) => t.fechaInicioPlan).sort();
      const fines = tareasFase.map((t) => t.fechaFinPlan).sort();
      const progresoProm = Math.round(tareasFase.reduce((sum, t) => sum + progressByState[t.estado], 0) / tareasFase.length);

      rows.push({
        id: `${FASE_PREFIX}${fase.id}`,
        name: `${abierta ? '▾' : '▸'} ${fase.codigo} · ${fase.nombre} (${tareasFase.length})`,
        start: inicios[0],
        end: fines[fines.length - 1],
        progress: progresoProm,
        dependencies: '',
        custom_class: 'fase-row',
      });

      if (abierta) {
        tareasFase.forEach((t) => {
          rows.push({
            id: t.id,
            name: t.nombre,
            start: t.fechaInicioPlan,
            end: t.fechaFinPlan,
            progress: progressByState[t.estado],
            dependencies: '',
            custom_class: `task-${t.estado.replace('_', '-')} ${t.esMilestone ? 'milestone' : ''}`,
          });
        });
      }
    });

    return rows;
  }, [fasesConTareas, expandidas]);

  useEffect(() => {
    if (!containerRef.current || !ganttTasks.length) return;
    containerRef.current.innerHTML = '';
    ganttRef.current = new Gantt(containerRef.current, ganttTasks, {
      view_mode: 'Week',
      language: idioma === 'en' ? 'en' : 'es',
      on_date_change: (task, start, end) => {
        if (task.id.startsWith(FASE_PREFIX)) return;
        actualizarFechasGantt(task.id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
      },
      on_click: (task) => {
        if (task.id.startsWith(FASE_PREFIX)) {
          toggleFase(task.id.slice(FASE_PREFIX.length));
        }
      },
      custom_popup_html: (task) => `
        <div class="p-3">
          <strong>${task.name}</strong>
          <p>${task.start} / ${task.end}</p>
          <p>Avance: ${task.progress ?? 0}%</p>
        </div>
      `,
    });
  }, [actualizarFechasGantt, ganttTasks, idioma]);

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{t('gantt_title')}</h3>
          <p className="text-sm text-slate-500">{t('gantt_subtitle')}</p>
        </div>
        <div className="flex gap-2 text-xs text-slate-400">
          <span>{t('gantt_semana')}</span>
          <span className="text-slate-600">·</span>
          <span>{tareas.length} {t('gantt_tareas')} · {fasesConTareas.length} {t('gantt_fases')}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {fasesConTareas.map(({ fase, tareasFase }) => {
          const abierta = expandidas.has(fase.id);
          return (
            <button
              key={fase.id}
              type="button"
              onClick={() => toggleFase(fase.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                abierta
                  ? 'border-emerald-300/40 bg-emerald-400/12 text-emerald-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/8'
              }`}
            >
              {abierta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {fase.codigo} · {fase.nombre}
              <span className="text-slate-500">({tareasFase.length})</span>
            </button>
          );
        })}
      </div>

      <div ref={containerRef} className="gantt-container min-h-[360px] overflow-x-auto rounded-lg border border-white/10 bg-[#11141d] p-2 scrollbar-thin" />
    </GlassCard>
  );
}
