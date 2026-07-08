import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AppState } from '../types';
import { db } from './firebaseClient';

type SharedState = Pick<
  AppState,
  'perfiles' | 'perfilesAcceso' | 'ejecutivos' | 'proyectos' | 'fases' | 'tareas' | 'alertas' | 'expedientes' | 'diasAnticipacionAlerta' | 'fuenteGoogleSheetsUrl'
>;

const workspaceRef = () => {
  if (!db) return null;
  return doc(db, 'implementator', 'workspace');
};

const removeUndefined = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : removeUndefined(item))) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefined(item)]),
    ) as T;
  }

  return value;
};

export function toSharedState(state: AppState): SharedState {
  return {
    perfiles: state.perfiles,
    perfilesAcceso: state.perfilesAcceso,
    ejecutivos: state.ejecutivos,
    proyectos: state.proyectos,
    fases: state.fases,
    tareas: state.tareas,
    alertas: state.alertas,
    expedientes: state.expedientes,
    diasAnticipacionAlerta: state.diasAnticipacionAlerta,
    fuenteGoogleSheetsUrl: state.fuenteGoogleSheetsUrl,
  };
}

export async function ensureWorkspaceState(state: AppState) {
  const ref = workspaceRef();
  if (!ref) return;
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      ...toSharedState(state),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: state.usuarioActivo?.email ?? state.usuarioActivo?.nombre ?? 'Sistema',
    });
  }
}

export async function loadWorkspaceState() {
  const ref = workspaceRef();
  if (!ref) return null;
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Partial<SharedState>;
}

export async function saveWorkspaceState(state: AppState, motivo: string) {
  const ref = workspaceRef();
  if (!ref) return;
  const sharedState = removeUndefined(toSharedState(state));
  await setDoc(
    ref,
    {
      ...sharedState,
      updatedAt: serverTimestamp(),
      updatedBy: state.usuarioActivo?.email ?? state.usuarioActivo?.nombre ?? 'Sistema',
      motivo,
    },
    { merge: true },
  );
}

export function subscribeWorkspaceState(
  onState: (state: Partial<SharedState>) => void,
  onError?: (error: Error) => void,
) {
  const ref = workspaceRef();
  if (!ref) return () => undefined;

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) return;
      onState(snapshot.data() as Partial<SharedState>);
    },
    (error) => onError?.(error),
  );
}
