import { AlertTriangle, CheckCircle2, FolderKanban, Gauge } from 'lucide-react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore, calcPctProyecto } from '../../store/useAppStore';
import { Charts } from './Charts';
import { KPICard } from './KPICard';

export function ReportesView() {
  const proyectos = useProyectosVisibles();
  const { tareas, alertas } = useAppStore();
  const tareasVisibles = tareas.filter((t) => proyectos.some((p) => p.id === t.proyectoId));
  const avancePromedio = proyectos.length
    ? Math.round(proyectos.reduce((acc, p) => acc + calcPctProyecto(p.id, tareas), 0) / proyectos.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Reportería ejecutiva</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">KPIs de implementación</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Proyectos visibles" value={proyectos.length} icon={FolderKanban} />
        <KPICard label="Avance promedio" value={`${avancePromedio}%`} icon={Gauge} />
        <KPICard label="Tareas completadas" value={tareasVisibles.filter((t) => t.estado === 'completada').length} icon={CheckCircle2} />
        <KPICard label="Alertas abiertas" value={alertas.filter((a) => !a.leida).length} icon={AlertTriangle} />
      </div>

      <Charts proyectos={proyectos} tareas={tareasVisibles} />
    </div>
  );
}
