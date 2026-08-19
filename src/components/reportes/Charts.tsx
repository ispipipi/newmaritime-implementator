import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EstadoTarea, Proyecto, Tarea } from '../../types';
import { calcPctProyecto } from '../../store/useAppStore';
import { useAppStore } from '../../store/useAppStore';
import { translate, Idioma, DictKey } from '../../i18n/translations';
import { useT } from '../../i18n/useT';
import { GlassCard } from '../ui/GlassCard';

const estadoLabelKeys: Record<EstadoTarea, DictKey> = {
  pendiente: 'estado_pendiente',
  en_proceso: 'estado_en_proceso',
  completada: 'estado_completada',
  bloqueada: 'estado_bloqueada',
  cancelada: 'estado_cancelada',
};

const colors: Record<EstadoTarea, string> = {
  pendiente: '#64748b',
  en_proceso: '#3b82f6',
  completada: '#22c55e',
  bloqueada: '#ef4444',
  cancelada: '#71717a',
};

export function Charts({ proyectos, tareas }: { proyectos: Proyecto[]; tareas: Tarea[] }) {
  const idioma = useAppStore((s) => s.idioma) as Idioma;
  const t = useT();
  const estados = Object.keys(estadoLabelKeys).map((estado) => ({
    name: translate(estadoLabelKeys[estado as EstadoTarea], idioma),
    value: tareas.filter((t) => t.estado === estado).length,
    estado: estado as EstadoTarea,
  }));

  const avance = proyectos.map((p) => ({
    name: p.nombre,
    avance: calcPctProyecto(p.id, tareas),
    pendiente: tareas.filter((t) => t.proyectoId === p.id && t.estado === 'pendiente').length,
    proceso: tareas.filter((t) => t.proyectoId === p.id && t.estado === 'en_proceso').length,
    completada: tareas.filter((t) => t.proyectoId === p.id && t.estado === 'completada').length,
  }));

  const linea = proyectos.map((p) => ({
    name: p.fechaGoLive,
    avance: calcPctProyecto(p.id, tareas),
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <GlassCard className="p-5 xl:col-span-2">
        <h3 className="mb-4 font-semibold text-white">{t('charts_progress_by_project')}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avance}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
              <Bar dataKey="completada" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
              <Bar dataKey="proceso" stackId="a" fill="#3b82f6" />
              <Bar dataKey="pendiente" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 font-semibold text-white">{t('charts_task_status')}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={estados} innerRadius={68} outerRadius={96} paddingAngle={3} dataKey="value">
                {estados.map((entry) => (
                  <Cell key={entry.estado} fill={colors[entry.estado]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-5 xl:col-span-3">
        <h3 className="mb-4 font-semibold text-white">{t('charts_curve_to_golive')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={linea}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="avance" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
