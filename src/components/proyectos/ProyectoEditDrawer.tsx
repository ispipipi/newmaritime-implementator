import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CategoriaProyecto, Proyecto } from '../../types';
import { getClientInfo } from '../../utils/clientInfo';
import { Drawer } from '../ui/Drawer';

type Props = {
  proyecto: Proyecto | null;
  onClose: () => void;
};

const categorias: CategoriaProyecto[] = ['Demo', 'Solución completa', 'Corrección', 'QA / Auditoría', 'Handoff', 'Otro'];

export function ProyectoEditDrawer({ proyecto, onClose }: Props) {
  const actualizarProyecto = useAppStore((s) => s.actualizarProyecto);
  const [form, setForm] = useState({
    nombre: '',
    cliente: '',
    contactoPrincipal: '',
    repositorio: '',
    urlProyecto: '',
    stackTecnico: '',
    categoria: 'Solución completa' as CategoriaProyecto,
    fechaInicio: '',
    fechaGoLive: '',
    estado: 'activo' as Proyecto['estado'],
    observaciones: '',
  });

  useEffect(() => {
    if (!proyecto) return;
    const info = getClientInfo(proyecto);
    setForm({
      nombre: proyecto.nombre,
      cliente: info.cliente,
      contactoPrincipal: info.contactoPrincipal,
      repositorio: info.repositorio,
      urlProyecto: info.urlProyecto,
      stackTecnico: info.stackTecnico,
      categoria: proyecto.categoria,
      fechaInicio: proyecto.fechaInicio,
      fechaGoLive: proyecto.fechaGoLive,
      estado: proyecto.estado,
      observaciones: proyecto.observaciones,
    });
  }, [proyecto]);

  const save = () => {
    if (!proyecto) return;
    actualizarProyecto(proyecto.id, form);
    onClose();
  };

  return (
    <Drawer open={!!proyecto} title="Editar proyecto" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">
            Nombre comercial
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">
            Cliente
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.cliente} onChange={(e) => setForm((s) => ({ ...s, cliente: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Categoría
            <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.categoria} onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value as CategoriaProyecto }))}>
              {categorias.map((categoria) => (
                <option key={categoria}>{categoria}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Inicio
            <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaInicio} onChange={(e) => setForm((s) => ({ ...s, fechaInicio: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Go live
            <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaGoLive} onChange={(e) => setForm((s) => ({ ...s, fechaGoLive: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Contacto principal
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.contactoPrincipal} onChange={(e) => setForm((s) => ({ ...s, contactoPrincipal: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Repositorio
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.repositorio} onChange={(e) => setForm((s) => ({ ...s, repositorio: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            URL del proyecto
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.urlProyecto} onChange={(e) => setForm((s) => ({ ...s, urlProyecto: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Stack técnico
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.stackTecnico} onChange={(e) => setForm((s) => ({ ...s, stackTecnico: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Estado
            <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.estado} onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as Proyecto['estado'] }))}>
              <option value="activo">Activo</option>
              <option value="completado">Completado</option>
              <option value="pausado">Pausado</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm text-slate-300">
          Observaciones
          <textarea className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.observaciones} onChange={(e) => setForm((s) => ({ ...s, observaciones: e.target.value }))} />
        </label>

        <button className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300" onClick={save}>
          Guardar proyecto
        </button>
      </div>
    </Drawer>
  );
}
