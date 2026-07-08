import { FirebaseError, initializeApp, getApps } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth, firebaseApp } from './firebaseClient';
import {
  customAuthEmailApiReady,
  enviarCorreoAccesoPerfilApi,
  enviarRecuperacionPasswordApi,
} from './customAuthEmailApi';

const SECONDARY_APP_NAME = 'implementator-user-provisioning';
const DEFAULT_PUBLIC_URL = 'https://ispipipi.github.io/implementator/';

const normalizarEmail = (email: string) => email.trim().toLowerCase();

const actionCodeSettings = () => {
  const publicUrl = import.meta.env.VITE_APP_PUBLIC_URL || DEFAULT_PUBLIC_URL;

  return {
    url: publicUrl,
    handleCodeInApp: false,
  };
};

const prepararAuthParaEmail = (targetAuth: ReturnType<typeof getAuth>) => {
  targetAuth.languageCode = 'es';
};

const generarPasswordTemporal = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(24);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
};

const getProvisioningAuth = () => {
  if (!firebaseApp) return null;
  const app =
    getApps().find((candidate) => candidate.name === SECONDARY_APP_NAME) ??
    initializeApp(firebaseApp.options, SECONDARY_APP_NAME);

  return getAuth(app);
};

const mensajeFirebase = (error: unknown) => {
  if (!(error instanceof FirebaseError)) return 'No se pudo enviar el correo de acceso.';

  if (error.code === 'auth/invalid-email') return 'El email ingresado no es valido.';
  if (error.code === 'auth/user-not-found') return 'Ese email aun no tiene usuario creado en Firebase. Pide al administrador que cree el perfil y envie el correo de acceso.';
  if (error.code === 'auth/operation-not-allowed') return 'Email/contrasena no esta habilitado en Firebase Auth.';
  if (error.code === 'auth/too-many-requests') return 'Firebase bloqueo temporalmente el envio por muchos intentos. Prueba nuevamente en unos minutos.';
  if (error.code === 'auth/network-request-failed') return 'No hay conexion con Firebase para enviar el correo.';
  if (error.code === 'auth/unauthorized-continue-uri') return 'El dominio de retorno no esta autorizado en Firebase Auth.';

  return 'No se pudo enviar el correo de acceso. Revisa que el usuario exista y que Firebase Auth este activo.';
};

export async function enviarCorreoAccesoPerfil(email: string) {
  const emailNormalizado = normalizarEmail(email);

  if (customAuthEmailApiReady) {
    return enviarCorreoAccesoPerfilApi(emailNormalizado);
  }

  const provisioningAuth = getProvisioningAuth();

  if (!emailNormalizado) throw new Error('Ingresa un email para enviar el correo de acceso.');
  if (!provisioningAuth) throw new Error('Firebase Auth no esta configurado.');

  prepararAuthParaEmail(provisioningAuth);

  let usuarioCreado = false;

  try {
    await createUserWithEmailAndPassword(provisioningAuth, emailNormalizado, generarPasswordTemporal());
    usuarioCreado = true;
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== 'auth/email-already-in-use') {
      throw new Error(mensajeFirebase(error));
    }
  }

  try {
    await sendPasswordResetEmail(provisioningAuth, emailNormalizado, actionCodeSettings());
    await signOut(provisioningAuth);
    return usuarioCreado
      ? 'Usuario creado en Firebase y correo enviado para definir contrasena.'
      : 'Correo enviado para definir una nueva contrasena.';
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/unauthorized-continue-uri') {
      await sendPasswordResetEmail(provisioningAuth, emailNormalizado);
      await signOut(provisioningAuth);
      return usuarioCreado
        ? 'Usuario creado en Firebase y correo enviado para definir contrasena.'
        : 'Correo enviado para definir o recuperar contrasena.';
    }

    await signOut(provisioningAuth);
    throw new Error(
      usuarioCreado
        ? `El usuario fue creado, pero no se pudo enviar el correo. ${mensajeFirebase(error)}`
        : mensajeFirebase(error),
    );
  }
}

export async function enviarRecuperacionPassword(email: string) {
  const emailNormalizado = normalizarEmail(email);

  if (!emailNormalizado) throw new Error('Ingresa tu email para crear una nueva contrasena.');

  if (customAuthEmailApiReady) {
    await enviarRecuperacionPasswordApi(emailNormalizado);
    return;
  }

  if (!auth) throw new Error('Firebase Auth no esta configurado.');

  prepararAuthParaEmail(auth);

  try {
    await sendPasswordResetEmail(auth, emailNormalizado, actionCodeSettings());
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/unauthorized-continue-uri') {
      await sendPasswordResetEmail(auth, emailNormalizado);
      return;
    }

    throw new Error(mensajeFirebase(error));
  }
}
