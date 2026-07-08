import { EstadoTarea } from '../../types';

const labels: Record<EstadoTarea, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completada: 'Completada',
  bloqueada: 'Bloqueada',
  cancelada: 'Cancelada',
};

const colors: Record<EstadoTarea, string> = {
  pendiente: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  en_proceso: 'bg-blue-500/15 text-blue-200 ring-blue-400/20',
  completada: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
  bloqueada: 'bg-red-500/15 text-red-200 ring-red-400/20',
  cancelada: 'bg-zinc-500/15 text-zinc-300 ring-zinc-400/20',
};

const dot: Record<EstadoTarea, string> = {
  pendiente: 'bg-slate-400',
  en_proceso: 'bg-blue-400',
  completada: 'bg-emerald-400',
  bloqueada: 'bg-red-400',
  cancelada: 'bg-zinc-400',
};

export function StatusBadge({ estado, ping = false }: { estado: EstadoTarea; ping?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colors[estado]}`}>
      <span className="relative flex h-2 w-2">
        {ping ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot[estado]}`} /> : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot[estado]}`} />
      </span>
      {labels[estado]}
    </span>
  );
}
