import { auth } from './firebaseClient';

const passwordResetUrl = (import.meta.env.VITE_SEND_PASSWORD_RESET_URL || '').trim();
const accessInviteUrl = (import.meta.env.VITE_SEND_ACCESS_INVITE_URL || '').trim();

export const customAuthEmailApiReady = Boolean(passwordResetUrl && accessInviteUrl);

type EmailPayload = {
  email: string;
};

async function postEmailAction(url: string, payload: EmailPayload, requireAuth = false) {
  if (!customAuthEmailApiReady) {
    throw new Error('La API de correos transaccionales aun no esta configurada.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const user = auth?.currentUser;
    if (!user) throw new Error('Debes iniciar sesion para enviar accesos a otros usuarios.');
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo completar el envio del correo.');
  }

  return data.message || 'Correo enviado correctamente.';
}

export async function enviarCorreoAccesoPerfilApi(email: string) {
  return postEmailAction(accessInviteUrl, { email }, true);
}

export async function enviarRecuperacionPasswordApi(email: string) {
  return postEmailAction(passwordResetUrl, { email });
}
