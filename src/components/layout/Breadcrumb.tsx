import { ChevronRight, Home } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../i18n/useT';

export function Breadcrumb() {
  const { vista, proyectos, fases, proyectoActivoId, faseActivaId, setVista } = useAppStore();
  const t = useT();
  const proyecto = proyectos.find((p) => p.id === proyectoActivoId);
  const fase = fases.find((f) => f.id === faseActivaId);

  const items = [
    { label: t('breadcrumb_dashboard'), onClick: () => setVista('dashboard') },
    vista === 'proyectos' ? { label: t('nav_proyectos'), onClick: () => setVista('proyectos') } : null,
    proyecto ? { label: proyecto.nombre, onClick: () => setVista('proyecto', proyecto.id) } : null,
    fase ? { label: fase.codigo, onClick: () => setVista('fase', proyecto?.id, fase.id) } : null,
    vista === 'mis_tareas' ? { label: t('nav_mis_tareas'), onClick: () => setVista('mis_tareas') } : null,
    vista === 'info_cliente' ? { label: t('nav_info_cliente'), onClick: () => setVista('info_cliente', proyecto?.id) } : null,
    vista === 'gantt_admin' ? { label: t('nav_gantt_admin'), onClick: () => setVista('gantt_admin') } : null,
    vista === 'ajustes' ? { label: t('nav_ajustes'), onClick: () => setVista('ajustes') } : null,
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
