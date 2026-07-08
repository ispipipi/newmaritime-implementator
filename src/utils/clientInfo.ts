import { Proyecto } from '../types';

export const getClientInfo = (proyecto: Proyecto) => ({
  cliente: proyecto.cliente || proyecto.nombre,
  contactoPrincipal: proyecto.contactoPrincipal || 'Pendiente de registrar',
  repositorio: proyecto.repositorio || 'Pendiente de registrar',
  urlProyecto: proyecto.urlProyecto || 'Pendiente de registrar',
  stackTecnico: proyecto.stackTecnico || 'Pendiente de registrar',
});
