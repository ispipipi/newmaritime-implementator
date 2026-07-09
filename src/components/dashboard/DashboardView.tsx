import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Clock3, FolderKanban, Gauge, ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePermisos, useProyectosVisibles } from '../../hooks/usePermisos';
import {
  useAppStore,
  calcCumplimientoGanttFase,
  calcCumplimientoGanttProyecto,
  calcPctFase,
  calcPctPlanificadoFase,
  calcPctPlanificadoProyecto,
  calcPctProyecto,
  semaforoCumplimientoFase,
  semaforoCumplimientoProyecto,
} from '../../store/useAppStore';
import { Alerta, EstadoSemaforo, Fase, FiltroTareasVista, OrdenTareasVista, Proyecto, Tarea } from '../../types';
import { alertaVisibleParaUsuario } from '../../utils/assignee';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { ProgressRing } from '../ui/ProgressRing';
import { StatusBadge } from '../ui/StatusBadge';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';
import { AlertPanel } from '../layout/AlertPanel';
import { TareaEditDrawer } from '../proyectos/TareaEditDrawer';
import { TaskStatusGroups } from '../proyectos/TareasDrilldown';

type KpiDetalle = 'proyectos' | 'completadas' | 'en_proceso' | 'alertas' | 'avance' | 'semaforo';

type KpiStat = {
  id: KpiDetalle;
  label: string;
  value: number;
  icon: typeof FolderKanban;
};

const kpiTitles: Record<KpiDetalle, string> = {
  proyectos: 'Proyectos activos',
  completadas: 'Tareas completadas',
  en_proceso: 'Tareas en proceso',
  alertas: 'Alertas abiertas',
  avance: 'Avance promedio',
  semaforo: 'Semaforo operacional',
};

const kpiDescriptions: Record<KpiDetalle, string> = {
  proyectos: 'Drill down de proyectos activos hacia fases y tareas.',
  completadas: 'Tareas terminadas agrupadas por proyecto y fase.',
  en_proceso: 'Tareas actualmente en ejecucion agrupadas por proyecto y fase.',
  alertas: 'Alertas abiertas agrupadas por proyecto, fase y tarea asociada.',
  avance: 'Avance del portafolio por proyecto, fase y tarea.',
  semaforo: 'Lectura de criticidad por proyecto, fase y tareas agrupadas por estado.',
};

const sortFases = (a: Fase, b: Fase) => a.orden - b.orden;
const sortTareas = (a: Tarea, b: Tarea) => a.fechaInicioPlan.localeCompare(b.fechaInicioPlan);
const semaforoPrioridad: Record<EstadoSemaforo, number> = { rojo: 0, amarillo: 1, verde: 2 };
const semaforoText: Record<EstadoSemaforo, string> = { rojo: 'Critico', amarillo: 'Atencion', verde: 'En control' };

export function DashboardView() {
  const proyectos = useProyectosVisibles();
  const { tareas, fases, alertas, setVista, usuarioActivo, setBusquedaTareas, setFiltroTareasVista, setOrdenTareasVista } = useAppStore();
  const { esCliente } = usePermisos();
  const [kpiActivo, setKpiActivo] = useState<KpiDetalle | null>(null);
  const [proyectoDrillId, setProyectoDrillId] = useState<string | null>(null);
  const [faseDrillId, setFaseDrillId] = useState<string | null>(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  if (esCliente) {
    const proyectoCliente = proyectos.find((p) => p.id === usuarioActivo?.proyectoClienteId) ?? proyectos[0];
    if (!proyectoCliente) {
      return (
        <GlassCard className="p-6 text-slate-300">
          No hay un proyecto cliente asociado a este perfil.
        </GlassCard>
      );
    }

    const tareasProyecto = tareas.filter((t) => t.proyectoId === proyectoCliente.id);
    const fasesProyecto = fases.filter((f) => f.proyectoId === proyectoCliente.id).sort((a, b) => a.orden - b.orden);
    const avance = calcPctProyecto(proyectoCliente.id, tareas);
    const cumplimiento = calcCumplimientoGanttProyecto(proyectoCliente.id, tareas);
    const estado = semaforoCumplimientoProyecto(proyectoCliente.id, tareas);

    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_180px] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Vista cliente</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{proyectoCliente.nombre}</h1>
                <p className="mt-3 max-w-2xl text-slate-400">
                  Avance de implementacion de tu empresa y cumplimiento por fase. Puedes entrar a cada fase para revisar las tareas asociadas.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300" onClick={() => setVista('proyecto', proyectoCliente.id)}>
                    Ver ficha del proyecto
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg border border-white/10 px-4 py-2 font-medium text-slate-200 hover:bg-white/8" onClick={() => setVista('mis_tareas')}>
                    Mis tareas
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <TrafficLightOrb estado={estado} size="lg" label={`Gantt ${cumplimiento}%`} />
                <ProgressRing value={avance} size={126} />
                <p className="text-sm text-slate-400">% avance real</p>
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5">
              <BarChart3 className="mb-4 h-5 w-5 text-emerald-300" />
              <p className="text-3xl font-semibold text-white">{avance}%</p>
              <p className="mt-1 text-sm text-slate-400">Avance empresa</p>
            </GlassCard>
            <GlassCard className="p-5">
              <ListChecks className="mb-4 h-5 w-5 text-blue-300" />
              <p className="text-3xl font-semibold text-white">{tareasProyecto.length}</p>
              <p className="mt-1 text-sm text-slate-400">Tareas totales</p>
            </GlassCard>
            <GlassCard className="p-5">
              <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-300" />
              <p className="text-3xl font-semibold text-white">{tareasProyecto.filter((t) => t.estado === 'completada').length}</p>
              <p className="mt-1 text-sm text-slate-400">Tareas completas</p>
            </GlassCard>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Cumplimiento por fase</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Fases de implementacion</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {fasesProyecto.map((fase) => {
                const pct = calcPctFase(fase.id, tareas);
                const tareasFase = tareasProyecto.filter((t) => t.faseId === fase.id);
                return (
                  <GlassCard key={fase.id} interactive className="p-5">
                    <button className="w-full text-left" onClick={() => setVista('proyecto', proyectoCliente.id, fase.id)}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-semibold text-emerald-200">{fase.codigo}</span>
                          <h3 className="mt-3 font-semibold text-white">{fase.nombre}</h3>
                          <p className="mt-1 text-sm text-slate-500">{tareasFase.length} tarea(s)</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="mt-5 mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Cumplimiento</span>
                        <span className="font-semibold text-white">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'blue'} />
                    </button>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </section>

        <AlertPanel />
      </div>
    );
  }

  const tareasVisibles = tareas.filter((t) => proyectos.some((p) => p.id === t.proyectoId));
  const promedio = proyectos.length
    ? Math.round(proyectos.reduce((acc, p) => acc + calcPctProyecto(p.id, tareas), 0) / proyectos.length)
    : 0;
  const cumplimientoPromedio = proyectos.length
    ? Math.round(proyectos.reduce((acc, p) => acc + calcCumplimientoGanttProyecto(p.id, tareas), 0) / proyectos.length)
    : 100;
  const semaforo = proyectos.some((p) => semaforoCumplimientoProyecto(p.id, tareas) === 'rojo')
    ? 'rojo'
    : proyectos.some((p) => semaforoCumplimientoProyecto(p.id, tareas) === 'amarillo')
      ? 'amarillo'
      : 'verde';

  const alertasVisibles = alertas.filter((alerta) => proyectos.some((p) => p.id === alerta.proyectoId) && alertaVisibleParaUsuario(alerta, usuarioActivo));
  const alertasAbiertas = alertasVisibles.filter((a) => !a.leida);
  const proyectosActivos = proyectos.filter((p) => p.estado === 'activo');

  const stats: KpiStat[] = [
    { id: 'proyectos', label: 'Proyectos activos', value: proyectosActivos.length, icon: FolderKanban },
    { id: 'completadas', label: 'Tareas completadas', value: tareasVisibles.filter((t) => t.estado === 'completada').length, icon: CheckCircle2 },
    { id: 'en_proceso', label: 'En proceso', value: tareasVisibles.filter((t) => t.estado === 'en_proceso').length, icon: Clock3 },
    { id: 'alertas', label: 'Alertas abiertas', value: alertasAbiertas.length, icon: AlertTriangle },
  ];

  const abrirKpi = (id: KpiDetalle) => {
    setKpiActivo(id);
    setProyectoDrillId(null);
    setFaseDrillId(null);
    setTareaSeleccionada(null);
  };

  const cerrarKpi = () => {
    setKpiActivo(null);
    setProyectoDrillId(null);
    setFaseDrillId(null);
    setTareaSeleccionada(null);
  };

  const abrirModoAccion = (filtro: FiltroTareasVista, orden: OrdenTareasVista = 'criticas') => {
    setBusquedaTareas('');
    setFiltroTareasVista(filtro);
    setOrdenTareasVista(orden);
    setVista('mis_tareas');
  };

  const abrirProyectos = () => {
    setBusquedaTareas('');
    setFiltroTareasVista('todas');
    setOrdenTareasVista('criticas');
    setVista('proyectos');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        {kpiActivo ? (
          <DashboardKpiDetalle
            alertas={alertasAbiertas}
            fases={fases}
            kpi={kpiActivo}
            onBack={cerrarKpi}
            onOpenProject={(id) => {
              setProyectoDrillId(id);
              setFaseDrillId(null);
            }}
            onOpenTask={setTareaSeleccionada}
            onSelectPhase={setFaseDrillId}
            phaseId={faseDrillId}
            projectId={proyectoDrillId}
            proyectos={proyectos}
            proyectosActivos={proyectosActivos}
            tareas={tareasVisibles}
          />
        ) : (
          <GlassCard className="overflow-hidden p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <h1 className="text-3xl font-semibold tracking-normal text-white sm:text-5xl">IMPLEMENTATOR</h1>
                <p className="mt-2 text-sm text-slate-400">The ultimate project control</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300" onClick={abrirProyectos}>
                    Ver proyectos
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg border border-white/10 px-4 py-2 font-medium text-slate-200 hover:bg-white/8" onClick={() => abrirModoAccion('atencion', 'criticas')}>
                    Ir a pendientes críticos
                  </button>
                </div>
              </div>
              <button className="grid gap-5 rounded-lg p-3 text-center transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-emerald-300/40 sm:grid-cols-2 lg:grid-cols-1" onClick={() => abrirModoAccion('atencion', 'criticas')}>
                <div className="flex flex-col items-center gap-3">
                  <TrafficLightOrb estado={semaforo} size="lg" />
                  <div>
                    <p className="text-2xl font-semibold text-white">{cumplimientoPromedio}%</p>
                    <p className="text-sm text-slate-400">Cumplimiento Gantt</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <ProgressRing value={promedio} size={116} />
                  <p className="text-sm text-slate-400">% avance real</p>
                </div>
              </button>
            </div>
          </GlassCard>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const action =
              stat.id === 'proyectos'
                ? () => abrirProyectos()
                : stat.id === 'completadas'
                  ? () => abrirModoAccion('completadas', 'plan')
                  : stat.id === 'en_proceso'
                    ? () => abrirModoAccion('en_proceso', 'vence')
                    : () => abrirModoAccion('atencion', 'criticas');
            const helper =
              stat.id === 'proyectos'
                ? 'Abrir portafolio'
                : stat.id === 'completadas'
                  ? 'Abrir completadas'
                  : stat.id === 'en_proceso'
                    ? 'Abrir tareas activas'
                    : 'Abrir bandeja crítica';

            return (
            <GlassCard key={stat.label} interactive className={`p-0 ${kpiActivo === stat.id ? 'border-emerald-300/35 bg-emerald-300/10' : ''}`}>
              <button className="h-full w-full p-5 text-left" onClick={action}>
                <stat.icon className={`mb-4 h-5 w-5 ${kpiActivo === stat.id ? 'text-emerald-200' : 'text-slate-400'}`} />
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                <p className="mt-3 text-xs font-medium text-emerald-200">{helper}</p>
              </button>
            </GlassCard>
          )})}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {proyectos.slice(0, 4).map((proyecto) => (
            <GlassCard key={proyecto.id} interactive className="p-5">
              <button className="w-full text-left" onClick={() => setVista('proyecto', proyecto.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{proyecto.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-400">{proyecto.categoria} · Go live {proyecto.fechaGoLive}</p>
                  </div>
                  <TrafficLightOrb estado={semaforoCumplimientoProyecto(proyecto.id, tareas)} size="sm" />
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cumplimiento Gantt</span>
                    <span className="font-semibold text-white">{calcCumplimientoGanttProyecto(proyecto.id, tareas)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">% avance real</span>
                  <span className="font-semibold text-white">{calcPctProyecto(proyecto.id, tareas)}%</span>
                  </div>
                </div>
              </button>
            </GlassCard>
          ))}
        </div>
      </section>

      <AlertPanel />
      <TareaEditDrawer tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
    </div>
  );
}

function DashboardKpiDetalle({
  alertas,
  fases,
  kpi,
  onBack,
  onOpenProject,
  onOpenTask,
  onSelectPhase,
  phaseId,
  projectId,
  proyectos,
  proyectosActivos,
  tareas,
}: {
  alertas: Alerta[];
  fases: Fase[];
  kpi: KpiDetalle;
  onBack: () => void;
  onOpenProject: (id: string | null) => void;
  onOpenTask: (tarea: Tarea) => void;
  onSelectPhase: (id: string | null) => void;
  phaseId: string | null;
  projectId: string | null;
  proyectos: Proyecto[];
  proyectosActivos: Proyecto[];
  tareas: Tarea[];
}) {
  const tareasKpi = useMemo(() => {
    if (kpi === 'completadas') return tareas.filter((tarea) => tarea.estado === 'completada');
    if (kpi === 'en_proceso') return tareas.filter((tarea) => tarea.estado === 'en_proceso');
    return tareas;
  }, [kpi, tareas]);

  const proyectosKpi = useMemo(() => {
    if (kpi === 'semaforo') return proyectos;
    if (kpi === 'proyectos') return proyectosActivos;
    if (kpi === 'alertas') {
      const ids = new Set(alertas.map((alerta) => alerta.proyectoId));
      return proyectos.filter((proyecto) => ids.has(proyecto.id));
    }

    const ids = new Set(tareasKpi.map((tarea) => tarea.proyectoId));
    return proyectos.filter((proyecto) => ids.has(proyecto.id));
  }, [alertas, kpi, proyectos, proyectosActivos, tareasKpi]);

  const proyectosOrdenados = useMemo(() => {
    if (kpi !== 'semaforo') return proyectosKpi;
    return [...proyectosKpi].sort((a, b) => {
      const prioridadA = semaforoPrioridad[semaforoCumplimientoProyecto(a.id, tareas)];
      const prioridadB = semaforoPrioridad[semaforoCumplimientoProyecto(b.id, tareas)];
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      return calcPctProyecto(a.id, tareas) - calcPctProyecto(b.id, tareas);
    });
  }, [kpi, proyectosKpi, tareas]);

  const proyecto = proyectosKpi.find((p) => p.id === projectId) ?? null;
  const fasesProyecto = proyecto
    ? fases.filter((fase) => fase.proyectoId === proyecto.id).sort(sortFases)
    : [];
  const fasesConDatos = fasesProyecto.filter((fase) => {
    if (kpi === 'proyectos' || kpi === 'avance' || kpi === 'semaforo') return true;

    if (kpi === 'alertas') {
      return alertas.some((alerta) => tareas.find((tarea) => tarea.id === alerta.tareaId)?.faseId === fase.id);
    }

    return tareasKpi.some((tarea) => tarea.faseId === fase.id);
  });
  const fase = fasesConDatos.find((item) => item.id === phaseId) ?? null;
  const tareasFase = fase
    ? tareasKpi.filter((tarea) => tarea.faseId === fase.id).sort(sortTareas)
    : [];
  const alertasFase = fase
    ? alertas.filter((alerta) => tareas.find((tarea) => tarea.id === alerta.tareaId)?.faseId === fase.id)
    : [];

  const contadorProyecto = (target: Proyecto) => {
    if (kpi === 'proyectos') return `${fases.filter((faseItem) => faseItem.proyectoId === target.id).length} fase(s)`;
    if (kpi === 'semaforo') return `${alertas.filter((alerta) => alerta.proyectoId === target.id).length} alerta(s)`;
    if (kpi === 'alertas') return `${alertas.filter((alerta) => alerta.proyectoId === target.id).length} alerta(s)`;
    return `${tareasKpi.filter((tarea) => tarea.proyectoId === target.id).length} tarea(s)`;
  };

  const fasesOrdenadas = useMemo(() => {
    if (kpi !== 'semaforo') return fasesConDatos;
    return [...fasesConDatos].sort((a, b) => {
      const prioridadA = semaforoPrioridad[semaforoCumplimientoFase(a.id, tareas)];
      const prioridadB = semaforoPrioridad[semaforoCumplimientoFase(b.id, tareas)];
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      return a.orden - b.orden;
    });
  }, [fasesConDatos, kpi, tareas]);

  return (
    <GlassCard className="min-h-[420px] overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Volver al resumen
          </button>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Detalle KPI</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{kpiTitles[kpi]}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{kpiDescriptions[kpi]}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel actual</p>
          <p className="mt-1 font-semibold text-white">{fase ? 'Tareas' : proyecto ? 'Fases' : 'Proyectos'}</p>
        </div>
      </div>

      {proyecto ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <button className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/8" onClick={() => onOpenProject(null)}>
            Proyectos
          </button>
          <span className="text-slate-600">/</span>
          <button className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/8" onClick={() => onSelectPhase(null)}>
            {proyecto.nombre}
          </button>
          {fase ? (
            <>
              <span className="text-slate-600">/</span>
              <span className="rounded-lg bg-emerald-300/12 px-3 py-2 text-emerald-100">{fase.codigo}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {!proyecto ? (
        <div className="grid gap-3">
          {proyectosOrdenados.length ? (
            proyectosOrdenados.map((item) => {
              const estado = semaforoCumplimientoProyecto(item.id, tareas);
              const cumplimiento = calcCumplimientoGanttProyecto(item.id, tareas);
              const avance = calcPctProyecto(item.id, tareas);
              const planificado = calcPctPlanificadoProyecto(item.id, tareas);
              const alertasProyecto = alertas.filter((alerta) => alerta.proyectoId === item.id);
              const isSemaforo = kpi === 'semaforo';

              return (
                <button key={item.id} className={`rounded-lg border p-4 text-left transition hover:border-emerald-300/35 hover:bg-white/8 ${isSemaforo && estado === 'rojo' ? 'border-red-400/45 bg-red-500/10' : 'border-white/10 bg-white/[0.035]'}`} onClick={() => onOpenProject(item.id)}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        {isSemaforo ? <TrafficLightOrb estado={estado} size="sm" /> : null}
                        <h3 className="truncate font-semibold text-white">{item.nombre}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{item.categoria} · Go live {item.fechaGoLive}</p>
                      {isSemaforo ? <p className={`mt-2 text-xs font-semibold ${estado === 'rojo' ? 'text-red-200' : estado === 'amarillo' ? 'text-amber-200' : 'text-emerald-200'}`}>{semaforoText[estado]}</p> : null}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden min-w-36 sm:block">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-500">Gantt</span>
                          <span className="font-semibold text-white">{cumplimiento}%</span>
                        </div>
                        <ProgressBar value={cumplimiento} tone={estado === 'rojo' ? 'red' : estado === 'amarillo' ? 'amber' : 'emerald'} />
                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                          <span>Plan {planificado}%</span>
                          <span>Avance {avance}%</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm ${isSemaforo && alertasProyecto.length ? 'bg-amber-400/12 text-amber-100' : 'bg-white/8 text-slate-300'}`}>{contadorProyecto(item)}</span>
                      <ArrowRight className="h-5 w-5 text-slate-500" />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <EmptyKpiState text="No hay datos para este KPI." />
          )}
        </div>
      ) : null}

      {proyecto && !fase ? (
        <div className="grid gap-3 md:grid-cols-2">
          {fasesOrdenadas.length ? fasesOrdenadas.map((item) => {
            const alertasFaseItem = alertas.filter((alerta) => tareas.find((tarea) => tarea.id === alerta.tareaId)?.faseId === item.id);
            const tareasFaseItem = tareasKpi.filter((tarea) => tarea.faseId === item.id);
            const count = kpi === 'alertas' ? alertasFaseItem.length : tareasFaseItem.length;
            const pct = calcPctFase(item.id, tareas);
            const estado = semaforoCumplimientoFase(item.id, tareas);
            const cumplimiento = calcCumplimientoGanttFase(item.id, tareas);
            const planificado = calcPctPlanificadoFase(item.id, tareas);
            const isSemaforo = kpi === 'semaforo';

            return (
              <button key={item.id} className={`rounded-lg border p-4 text-left transition hover:border-emerald-300/35 hover:bg-white/8 ${isSemaforo && estado === 'rojo' ? 'border-red-400/45 bg-red-500/10' : 'border-white/10 bg-white/[0.035]'}`} onClick={() => onSelectPhase(item.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      {isSemaforo ? <TrafficLightOrb estado={estado} size="sm" /> : null}
                      <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-semibold text-emerald-200">{item.codigo}</span>
                    </div>
                    <h3 className="mt-3 font-semibold text-white">{item.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-500">{isSemaforo ? `${alertasFaseItem.length} alerta(s) · ${tareasFaseItem.length} tarea(s)` : `${count} ${kpi === 'alertas' ? 'alerta(s)' : 'tarea(s)'}`}</p>
                    {isSemaforo ? <p className={`mt-2 text-xs font-semibold ${estado === 'rojo' ? 'text-red-200' : estado === 'amarillo' ? 'text-amber-200' : 'text-emerald-200'}`}>{semaforoText[estado]}</p> : null}
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500" />
                </div>
                <div className="mt-4 mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-400">{isSemaforo ? 'Cumplimiento Gantt' : 'Cumplimiento fase'}</span>
                  <span className="font-semibold text-white">{isSemaforo ? cumplimiento : pct}%</span>
                </div>
                <ProgressBar value={isSemaforo ? cumplimiento : pct} tone={isSemaforo ? (estado === 'rojo' ? 'red' : estado === 'amarillo' ? 'amber' : 'emerald') : pct === 100 ? 'emerald' : 'blue'} />
                {isSemaforo ? (
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>Plan {planificado}%</span>
                    <span>Avance {pct}%</span>
                  </div>
                ) : null}
              </button>
            );
          }) : (
            <EmptyKpiState text="Este proyecto no tiene fases asociadas al KPI seleccionado." />
          )}
        </div>
      ) : null}

      {proyecto && fase ? (
        <div className="grid gap-3">
          {(kpi === 'alertas' ? alertasFase : tareasFase).length ? (
            kpi === 'alertas' ? (
              alertasFase.map((alerta) => {
                const tarea = tareas.find((item) => item.id === alerta.tareaId);
                return (
                  <button key={alerta.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-emerald-300/35 hover:bg-white/8" onClick={() => tarea && onOpenTask(tarea)}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">{alerta.tipo.replace('_', ' ')}</span>
                        <h3 className="mt-3 font-semibold text-white">{alerta.mensaje}</h3>
                        <p className="mt-1 text-sm text-slate-500">{tarea?.nombre ?? 'Tarea no encontrada'}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-500" />
                    </div>
                  </button>
                );
              })
            ) : (
              <TaskStatusGroups
                tareas={tareasFase}
                scopeId={`dashboard-${fase.id}`}
                renderTask={(tarea) => (
                  <button key={tarea.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-emerald-300/35 hover:bg-white/8" onClick={() => onOpenTask(tarea)}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <StatusBadge estado={tarea.estado} ping={tarea.estado === 'bloqueada'} />
                          {tarea.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
                        </div>
                        <h3 className="font-semibold text-white">{tarea.nombre}</h3>
                        <p className="mt-1 text-sm text-slate-500">Responsable: {tarea.responsable}</p>
                      </div>
                      <div className="text-left text-sm text-slate-400 sm:text-right">
                        <p>Inicio {tarea.fechaInicioPlan}</p>
                        <p>Fin {tarea.fechaFinPlan}</p>
                      </div>
                    </div>
                  </button>
                )}
              />
            )
          ) : (
            <EmptyKpiState text="No hay tareas para esta fase." />
          )}
        </div>
      ) : null}
    </GlassCard>
  );
}

function EmptyKpiState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
      <Gauge className="mx-auto mb-3 h-5 w-5 text-slate-600" />
      {text}
    </div>
  );
}
