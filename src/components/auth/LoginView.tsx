import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { UsuarioActivo } from '../../types';
import { auth, firebaseMissingMessage, firebaseReady } from '../../services/firebaseClient';
import { ensureWorkspaceState, loadWorkspaceState } from '../../services/remoteState';
import { enviarRecuperacionPassword } from '../../services/userAccess';
import { GlassCard } from '../ui/GlassCard';

const normalizarEmail = (email?: string | null) => (email ?? '').trim().toLowerCase();

const buscarPerfil = (perfiles: UsuarioActivo[], email: string) =>
  perfiles.find((perfil) => normalizarEmail(perfil.email) === email && perfil.activo !== false);

export function LoginView() {
  const { perfiles, usuarioActivo, setUsuarioActivo, aplicarEstadoCompartido } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'error' | 'ok'>('error');
  const [sinPerfil, setSinPerfil] = useState(false);

  useEffect(() => {
    if (!auth) return undefined;

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsuarioActivo(null);
        return;
      }

      setCargando(true);
      setMensaje('');
      setTipoMensaje('error');
      setSinPerfil(false);

      try {
        await ensureWorkspaceState(useAppStore.getState());
        const estadoRemoto = await loadWorkspaceState();
        if (estadoRemoto) aplicarEstadoCompartido(estadoRemoto);

        const emailUsuario = normalizarEmail(firebaseUser.email);
        const perfilesDisponibles = estadoRemoto?.perfiles ?? useAppStore.getState().perfiles;
        const perfil = buscarPerfil(perfilesDisponibles, emailUsuario);

        if (!perfil) {
          setMensaje('Tu usuario existe en Firebase, pero aun no tiene perfil asignado en IMPLEMENTATOR.');
          setSinPerfil(true);
          setUsuarioActivo(null);
          return;
        }

        setUsuarioActivo({ ...perfil, email: emailUsuario });
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : 'No se pudo cargar el perfil.');
        setUsuarioActivo(null);
      } finally {
        setCargando(false);
      }
    });
  }, [aplicarEstadoCompartido, setUsuarioActivo]);

  if (usuarioActivo) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth) return;
    setCargando(true);
    setMensaje('');
    setTipoMensaje('error');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setMensaje('Email o contrasena incorrecta, o el usuario aun no existe en Firebase.');
    } finally {
      setCargando(false);
    }
  };

  const recuperarPassword = async () => {
    setMensaje('');
    setTipoMensaje('error');

    if (!email.trim()) {
      setMensaje('Ingresa tu email y luego presiona crear nueva contrasena.');
      return;
    }

    setRecuperando(true);
    try {
      await enviarRecuperacionPassword(email);
      setTipoMensaje('ok');
      setMensaje('Te enviamos un correo para crear una nueva contrasena. Por seguridad no se puede enviar la contrasena actual.');
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo enviar el correo de recuperacion.');
    } finally {
      setRecuperando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1117]/95 p-4 backdrop-blur-xl">
      <GlassCard className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">IMPLEMENTATOR</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Ingreso seguro</h1>
          <p className="mt-2 text-sm text-slate-400">Accede con tu email y contrasena asignada.</p>
        </div>

        {!firebaseReady ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            {firebaseMissingMessage}
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <label className="block text-sm text-slate-300">
              Email
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-300/50"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-slate-300">
              Contrasena
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-300/50"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {mensaje ? (
              <p
                className={`rounded-lg border p-3 text-sm ${
                  tipoMensaje === 'ok'
                    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                    : 'border-red-400/20 bg-red-500/10 text-red-100'
                }`}
              >
                {mensaje}
              </p>
            ) : null}
            {sinPerfil ? (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
                onClick={() => auth && signOut(auth)}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión e intentar con otro usuario
              </button>
            ) : null}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={cargando}
            >
              <LockKeyhole className="h-4 w-4" />
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={recuperando}
              onClick={recuperarPassword}
            >
              {recuperando ? 'Enviando correo...' : 'Crear nueva contrasena'}
            </button>
          </form>
        )}

      </GlassCard>
    </div>
  );
}
