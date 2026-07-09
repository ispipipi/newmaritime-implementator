import { AlertTriangle, Building2, CalendarDays, Edit3, FolderArchive, LayoutGrid, ListChecks, TimerReset } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore, calcCumplimientoGanttProyecto, calcPctProyecto, semaforoCumplimientoProyecto } from '../../store/useAppStore';
import { Proyecto } from '../../types';
import { getClientInfo } from '../../utils/clientInfo';
import { AlertPanel } from '../layout/AlertPanel';
import { GanttView } from '../gantt/GanttView';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';
import { FaseCard } from './FaseCard';
import { ProyectoExpediente } from './ProyectoExpediente';
import { ProyectoEditDrawer } from './ProyectoEditDrawer';
import { TareasList } from './TareasList';

type Tab = 'tareas' | 'fases' | 'gantt' | 'expediente' | 'alertas';

export function ProyectoDetail() {
  const { proyectoActivoId, faseActivaId, proyectos, fases, tareas, setVista } = useAppStore();
  const [tab, setTab] = useState<Tab>('fases');
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const { puedeEditarProyectos } = usePermisos();
  const proyecto = proyectos.find((p) => p.id === proyectoActivoId);
  const fasesProyecto = useMemo(() => fases.filter((f) => f.proyectoId === proyectoActivoId).sort((a, b) => a.orden - b.orden), [fases, proyectoActivoId]);
  const tareasProyecto = tareas.filter((t) => t.proyectoId === proyectoActivoId);
  const faseActiva = fasesProyecto.find((f) => f.id === faseActivaId);
  const tareasFase = faseActiva ? tareasProyecto.filter((t) => t.faseId === faseActiva.id) : tareasProyecto;

  useEffect(() => {
    if (useAppStore.getState().tareaActivaId) {
      setTab('tareas');
    }
  }, [proyectoActivoId, faseActivaId]);

  if (!proyecto) {
    return (
      <GlassCard className="p-6">
        <p className="text-slate-300">Proyecto no encontrado.</p>
        <button className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950" onClick={() => setVista('proyectos')}>
          Volver a proyectos
        </button>
      </GlassCard>
    );
  }

  const pct = calcPctProyecto(proyecto.id, tareas);
  const cumplimiento = calcCumplimientoGanttProyecto(proyecto.id, tareas);
  const estado = semaforoCumplimientoProyecto(proyecto.id, tareas);
  const info = getClientInfo(proyecto);

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_160px] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <TrafficLightOrb estado={estado} size="sm" />
              <p className="text-sm text-slate-400">{info.cliente}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">{proyecto.nombre}</h1>
              {puedeEditarProyectos ? (
                <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/8" onClick={() => setEditing(proyecto)}>
                  <Edit3 className="h-4 w-4" />
                  Editar
                </button>
              ) : null}
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/8" onClick={() => setVista('info_cliente', proyecto.id)}>
                <Building2 className="h-4 w-4" />
                Info cliente
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                {proyecto.fechaInicio} a {proyecto.fechaGoLive}
              </span>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{proyecto.estado}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 justify-self-start text-center lg:justify-self-end">
            <div>
              <ProgressRing value={cumplimiento} size={112} />
              <p className="mt-2 text-xs text-slate-400">Gantt</p>
            </div>
            <div>
              <ProgressRing value={pct} size={112} />
              <p className="mt-2 text-xs text-slate-400">Real</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        {[
          ['fases', LayoutGrid, 'Fases'],
          ['tareas', ListChecks, 'Todas las tareas'],
          ['gantt', TimerReset, 'Gantt'],
          ['expediente', FolderArchive, 'Expediente'],
          ['alertas', AlertTriangle, 'Alertas'],
        ].map(([id, Icon, label]) => (
          <button key={id as string} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${tab === id ? 'border-emerald-300/40 bg-emerald-300/12 text-emerald-100' : 'border-white/10 text-slate-300 hover:bg-white/8'}`} onClick={() => setTab(id as Tab)}>
            <Icon className="h-4 w-4" />
            {label as string}
          </button>
        ))}
      </div>

      {faseActiva ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-300">{faseActiva.codigo}</p>
            <h2 className="text-2xl font-semibold text-white">{faseActiva.nombre}</h2>
          </div>
          <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('proyecto', proyecto.id)}>
            Ver todas las fases
          </button>
        </div>
      ) : null}

      {tab === 'tareas' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <ListChecks className="h-5 w-5 text-emerald-300" />
            {tareasFase.length} tareas {faseActiva ? 'en esta fase' : 'del proyecto'}
          </div>
          <TareasList tareas={tareasFase} />
        </div>
      ) : null}

      {tab === 'fases' && !faseActiva ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fasesProyecto.map((fase) => (
            <FaseCard key={fase.id} fase={fase} tareas={tareasProyecto} />
          ))}
        </div>
      ) : null}

      {tab === 'fases' && faseActiva ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <ListChecks className="h-5 w-5 text-emerald-300" />
            {tareasFase.length} tareas en esta fase
          </div>
          <TareasList tareas={tareasFase} />
        </div>
      ) : null}

      {tab === 'gantt' ? <GanttView fases={faseActiva ? [faseActiva] : fasesProyecto} tareas={tareasFase} /> : null}
      {tab === 'expediente' ? <ProyectoExpediente proyectoId={proyecto.id} /> : null}
      {tab === 'alertas' ? <AlertPanel /> : null}
      <ProyectoEditDrawer proyecto={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
