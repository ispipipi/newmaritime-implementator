import { ChevronRight, Home } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function Breadcrumb() {
  const { vista, proyectos, fases, proyectoActivoId, faseActivaId, setVista } = useAppStore();
  const proyecto = proyectos.find((p) => p.id === proyectoActivoId);
  const fase = fases.find((f) => f.id === faseActivaId);

  const items = [
    { label: 'Dashboard', onClick: () => setVista('dashboard') },
    vista === 'proyectos' ? { label: 'Proyectos', onClick: () => setVista('proyectos') } : null,
    proyecto ? { label: proyecto.nombre, onClick: () => setVista('proyecto', proyecto.id) } : null,
    fase ? { label: fase.codigo, onClick: () => setVista('fase', proyecto?.id, fase.id) } : null,
    vista === 'mis_tareas' ? { label: 'Mis tareas', onClick: () => setVista('mis_tareas') } : null,
    vista === 'info_cliente' ? { label: 'Info cliente', onClick: () => setVista('info_cliente', proyecto?.id) } : null,
    vista === 'gantt_admin' ? { label: 'Gantt admin', onClick: () => setVista('gantt_admin') } : null,
    vista === 'ajustes' ? { label: 'Ajustes', onClick: () => setVista('ajustes') } : null,
  ].filter(Boolean) as Array<{ label: string; onClick: () => void }>;

  return (
    <nav className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
      <Home className="h-4 w-4 shrink-0 text-slate-500" />
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
          {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" /> : null}
          <button className="truncate hover:text-white" onClick={item.onClick}>
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
