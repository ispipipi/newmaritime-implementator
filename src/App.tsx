import { useEffect } from 'react';
import { AjustesView } from './components/ajustes/AjustesView';
import { LoginView } from './components/auth/LoginView';
import { InfoClienteView } from './components/clientes/InfoClienteView';
import { DashboardView } from './components/dashboard/DashboardView';
import { GanttAdminView } from './components/gantt/GanttAdminView';
import { Header } from './components/layout/Header';
import { ProyectoDetail } from './components/proyectos/ProyectoDetail';
import { ProyectosList } from './components/proyectos/ProyectosList';
import { MisTareasView } from './components/tareas/MisTareasView';
import { subscribeWorkspaceState } from './services/remoteState';
import { useAppStore } from './store/useAppStore';
import { TemaApp } from './types';

const temaPorHoraChile = (): TemaApp => {
  const horaChile = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      hourCycle: 'h23',
      timeZone: 'America/Santiago',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'hour')?.value ?? '0',
  );

  return horaChile >= 7 && horaChile < 20 ? 'dia' : 'noche';
};

function App() {
  const { vista, recalcularAlertas, tema, setTema, usuarioActivo, aplicarEstadoCompartido } = useAppStore();

  useEffect(() => {
    recalcularAlertas();
  }, [recalcularAlertas]);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.style.colorScheme = tema === 'dia' ? 'light' : 'dark';
  }, [tema]);

  useEffect(() => {
    const aplicarTemaHorario = () => {
      const temaHorario = temaPorHoraChile();
      if (useAppStore.getState().tema !== temaHorario) {
        setTema(temaHorario);
      }
    };

    aplicarTemaHorario();
    const timer = window.setInterval(aplicarTemaHorario, 60 * 1000);
    const aplicarAlVolver = () => {
      if (!document.hidden) aplicarTemaHorario();
    };

    document.addEventListener('visibilitychange', aplicarAlVolver);
    window.addEventListener('focus', aplicarTemaHorario);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', aplicarAlVolver);
      window.removeEventListener('focus', aplicarTemaHorario);
    };
  }, [setTema]);

  useEffect(() => {
    if (!usuarioActivo) return undefined;
    return subscribeWorkspaceState((estado) => aplicarEstadoCompartido(estado), (error) => console.warn(error));
  }, [aplicarEstadoCompartido, usuarioActivo]);

  return (
    <div className="min-h-screen">
      <LoginView />
      <Header />
      <main className="mx-auto max-w-7xl px-3 pb-24 pt-5 sm:px-6 sm:py-6 lg:px-8">
        {vista === 'dashboard' ? <DashboardView /> : null}
        {vista === 'proyectos' ? <ProyectosList /> : null}
        {vista === 'proyecto' || vista === 'fase' ? <ProyectoDetail /> : null}
        {vista === 'mis_tareas' ? <MisTareasView /> : null}
        {vista === 'info_cliente' ? <InfoClienteView /> : null}
        {vista === 'gantt_admin' ? <GanttAdminView /> : null}
        {vista === 'ajustes' ? <AjustesView /> : null}
      </main>
    </div>
  );
}

export default App;
