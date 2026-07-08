import { Alerta, UsuarioActivo } from '../types';

export const normalizarResponsable = (value?: string) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

export const responsableAsignadoAUsuario = (responsable: string, usuario: UsuarioActivo) => {
  const responsableNormalizado = normalizarResponsable(responsable);
  const nombreNormalizado = normalizarResponsable(usuario.nombre);
  const inicialesNormalizadas = normalizarResponsable(usuario.iniciales);
  const primerNombre = nombreNormalizado.split(' ')[0] ?? '';

  if (!responsableNormalizado || !nombreNormalizado) return false;
  if (responsableNormalizado === nombreNormalizado) return true;
  if (inicialesNormalizadas && responsableNormalizado === inicialesNormalizadas) return true;
  if (primerNombre.length >= 3 && responsableNormalizado === primerNombre) return true;

  return responsableNormalizado.includes(nombreNormalizado) || nombreNormalizado.includes(responsableNormalizado);
};

export const alertaVisibleParaUsuario = (alerta: Alerta, usuario: UsuarioActivo | null) => {
  if (alerta.destinatario) {
    if (!usuario) return false;
    return responsableAsignadoAUsuario(alerta.destinatario, usuario);
  }

  if (alerta.tipo !== 'reasignada') return true;
  return false;
};
