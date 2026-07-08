import { PLANTILLA_FASES } from '../../data/plantillaFases';
import { GlassCard } from '../ui/GlassCard';

export function MantenedorPlantilla() {
  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">Plantilla de implementación</h2>
      <div className="grid gap-3">
        {PLANTILLA_FASES.map((fase) => (
          <div key={fase.codigo} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-white">{fase.codigo} · {fase.nombre}</h3>
              <span className="text-sm text-slate-500">{fase.tareas.length} tareas</span>
            </div>
            <div className="mt-3 grid gap-1 text-sm text-slate-400">
              {fase.tareas.map((tarea) => (
                <p key={tarea.nombre}>{tarea.nombre} · {tarea.duracionDias} día(s)</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
