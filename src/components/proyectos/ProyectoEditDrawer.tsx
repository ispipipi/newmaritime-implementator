import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Proyecto, SistemaOrigen } from '../../types';
import { getClientInfo } from '../../utils/clientInfo';
import { Drawer } from '../ui/Drawer';

type Props = {
  proyecto: Proyecto | null;
  onClose: () => void;
};

const sistemas: SistemaOrigen[] = ['Visma', 'Meta4', 'Talana', 'Workday', 'BUK', 'Otro'];

export function ProyectoEditDrawer({ proyecto, onClose }: Props) {
  const actualizarProyecto = useAppStore((s) => s.actualizarProyecto);
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    razonSocial: '',
    representanteLegal: '',
    direccion: '',
    cajaCompensacion: '',
    mutualidad: '',
    porcentajeCotizacionMutual: 0,
    sistemaOrigen: 'Visma' as SistemaOrigen,
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
      rut: proyecto.rut,
      razonSocial: info.razonSocial,
      representanteLegal: info.representanteLegal,
      direccion: info.direccion,
      cajaCompensacion: info.cajaCompensacion,
      mutualidad: info.mutualidad,
      porcentajeCotizacionMutual: info.porcentajeCotizacionMutual,
      sistemaOrigen: proyecto.sistemaOrigen,
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
            Razon social
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.razonSocial} onChange={(e) => setForm((s) => ({ ...s, razonSocial: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            RUT
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.rut} onChange={(e) => setForm((s) => ({ ...s, rut: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Sistema origen
            <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.sistemaOrigen} onChange={(e) => setForm((s) => ({ ...s, sistemaOrigen: e.target.value as SistemaOrigen }))}>
              {sistemas.map((sistema) => (
                <option key={sistema}>{sistema}</option>
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
            Representante legal
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.representanteLegal} onChange={(e) => setForm((s) => ({ ...s, representanteLegal: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Direccion
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.direccion} onChange={(e) => setForm((s) => ({ ...s, direccion: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Caja de compensacion
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.cajaCompensacion} onChange={(e) => setForm((s) => ({ ...s, cajaCompensacion: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Mutualidad
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.mutualidad} onChange={(e) => setForm((s) => ({ ...s, mutualidad: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            % mutualidad
            <input type="number" step="0.01" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.porcentajeCotizacionMutual} onChange={(e) => setForm((s) => ({ ...s, porcentajeCotizacionMutual: Number(e.target.value) }))} />
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
