import { FileText } from 'lucide-react';
import { Tarea } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  tarea: Tarea;
  onEdit: (tarea: Tarea) => void;
};

export function TareaRow({ tarea, onEdit }: Props) {
  return (
    <tr className="border-b border-white/8 last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-white">{tarea.nombre}</div>
        {tarea.esMilestone ? <div className="mt-1 text-xs text-amber-300">Milestone</div> : null}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">{tarea.responsable}</td>
      <td className="px-4 py-3">
        <StatusBadge estado={tarea.estado} ping={tarea.estado === 'bloqueada'} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">{tarea.fechaInicioPlan}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{tarea.fechaFinPlan}</td>
      <td className="px-4 py-3 text-right">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/8"
          onClick={() => onEdit(tarea)}
          title="Abrir ficha de tarea"
        >
          <FileText className="h-4 w-4" />
          Ficha
        </button>
      </td>
    </tr>
  );
}
