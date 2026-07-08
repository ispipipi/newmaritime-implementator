import { Proyecto } from '../types';

export const getClientInfo = (proyecto: Proyecto) => ({
  razonSocial: proyecto.razonSocial || proyecto.nombre,
  rut: proyecto.rut,
  representanteLegal: proyecto.representanteLegal || 'Pendiente de registrar',
  direccion: proyecto.direccion || 'Pendiente de registrar',
  cajaCompensacion: proyecto.cajaCompensacion || 'Pendiente de registrar',
  mutualidad: proyecto.mutualidad || 'Pendiente de registrar',
  porcentajeCotizacionMutual: proyecto.porcentajeCotizacionMutual ?? 0,
});
