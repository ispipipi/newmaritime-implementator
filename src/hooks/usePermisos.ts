import { useAppStore } from '../store/useAppStore';

export const usePermisos = () => {
  const { usuarioActivo, perfilesAcceso } = useAppStore();
  const perfil = usuarioActivo?.perfil;
  const perfilAcceso = perfilesAcceso.find((item) => item.id === perfil);
  const accesos = perfilAcceso?.accesos;
  const esCliente = accesos?.esCliente ?? perfil === 'cliente';
  const soloLectura = accesos?.soloLectura ?? perfil === 'comercial';
  const esRexPlus = perfil === 'rex_plus';

  return {
    puedeEditarTareas: !!usuarioActivo && !soloLectura,
    puedeEditarDatosTarea: accesos?.puedeEditarDatosTarea ?? perfil === 'artbpo_admin',
    puedeCambiarEstadoTarea: !!usuarioActivo && !soloLectura && (accesos?.puedeCambiarEstadoTarea ?? perfil !== 'comercial'),
    puedeEditarProyectos: accesos?.puedeEditarProyectos ?? perfil === 'artbpo_admin',
    puedeAdministrar: accesos?.puedeAdministrar ?? perfil === 'artbpo_admin',
    puedeGestionarUsuarios: accesos?.puedeGestionarUsuarios ?? perfil === 'artbpo_admin',
    puedeVerGanttAdmin: accesos?.puedeVerGanttAdmin ?? perfil === 'artbpo_admin',
    esAdmin: accesos?.puedeAdministrar ?? perfil === 'artbpo_admin',
    esEjecutivo: perfil === 'artbpo_ejecutivo',
    esTMF: perfil === 'tmf',
    esCliente,
    esComercial: perfil === 'comercial' || soloLectura,
    esRexPlus,
    soloLectura,
  };
};

export const useProyectosVisibles = () => {
  const { proyectos, usuarioActivo, perfilesAcceso } = useAppStore();
  if (!usuarioActivo) return [];
  const perfilAcceso = perfilesAcceso.find((item) => item.id === usuarioActivo.perfil);
  const proyectoIds = usuarioActivo.proyectoIds?.filter(Boolean) ?? [];
  if (proyectoIds.length) {
    return proyectos.filter((proyecto) => proyectoIds.includes(proyecto.id));
  }
  if ((perfilAcceso?.accesos.esCliente ?? usuarioActivo.perfil === 'cliente') && usuarioActivo.proyectoClienteId) {
    return proyectos.filter((proyecto) => proyecto.id === usuarioActivo.proyectoClienteId);
  }
  return proyectos;
};
