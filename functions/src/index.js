import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { Resend } from 'resend';

initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'https://ispipipi.github.io/newmaritime-implementator/';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Implementator <noreply@npr.cl>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const normalizeEmail = (value = '') => value.trim().toLowerCase();

const temporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 24 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const actionCodeSettings = {
  url: APP_PUBLIC_URL,
  handleCodeInApp: false,
};

const sendJson = (response, status, payload) => {
  response.set(corsHeaders);
  response.status(status).json(payload);
};

const buildResetHtml = ({ email, link, title, lead, buttonLabel }) => `
  <div style="margin:0;padding:32px;background:#f3f6fb;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f0;border-radius:18px;overflow:hidden;">
      <div style="padding:28px 32px;border-bottom:1px solid #e5edf5;background:#0f172a;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#7dd3fc;">Implementator</div>
        <h1 style="margin:14px 0 0;font-size:28px;line-height:1.1;">${title}</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola${email ? `, ${email}` : ''}.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">${lead}</p>
        <a href="${link}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">
          ${buttonLabel}
        </a>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#64748b;">
          Si el boton no abre correctamente, copia y pega este enlace en tu navegador:
        </p>
        <p style="margin:10px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#0f766e;">
          ${link}
        </p>
      </div>
    </div>
  </div>
`;

const buildResetText = ({ lead, link }) => `${lead}\n\n${link}\n`;

async function sendEmail({ to, subject, html, text }) {
  const resend = new Resend(RESEND_API_KEY.value());
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || 'Resend no pudo enviar el correo.');
  }
}

async function requireAdminCaller(request) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('Falta autenticacion para enviar accesos.');

  const decoded = await getAuth().verifyIdToken(token);
  const callerEmail = normalizeEmail(decoded.email);
  if (!callerEmail) throw new Error('La sesion actual no tiene email valido.');

  const workspaceDoc = await getFirestore().doc('implementator/workspace').get();
  const data = workspaceDoc.data() || {};
  const perfiles = Array.isArray(data.perfiles) ? data.perfiles : [];
  const perfilesAcceso = Array.isArray(data.perfilesAcceso) ? data.perfilesAcceso : [];

  const perfil = perfiles.find((item) => normalizeEmail(item.email) === callerEmail && item.activo !== false);
  const perfilAcceso = perfilesAcceso.find((item) => item.id === perfil?.perfil);
  const accesos = perfilAcceso?.accesos || {};

  if (!accesos.puedeAdministrar && !accesos.puedeGestionarUsuarios) {
    throw new Error('Tu usuario no tiene permisos para enviar accesos.');
  }

  return callerEmail;
}

export const sendPasswordReset = onRequest({ secrets: [RESEND_API_KEY] }, async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.set(corsHeaders);
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { message: 'Metodo no permitido.' });
    return;
  }

  const email = normalizeEmail(request.body?.email);
  if (!email) {
    sendJson(response, 400, { message: 'Debes indicar un email.' });
    return;
  }

  try {
    const link = await getAuth().generatePasswordResetLink(email, actionCodeSettings);
    const lead = 'Recibimos una solicitud para crear o restablecer tu contrasena de Implementator.';

    await sendEmail({
      to: email,
      subject: 'Crea o restablece tu contrasena de Implementator',
      html: buildResetHtml({
        email,
        link,
        title: 'Acceso a Implementator',
        lead,
        buttonLabel: 'Crear nueva contrasena',
      }),
      text: buildResetText({ lead, link }),
    });

    sendJson(response, 200, { message: 'Te enviamos un correo para crear una nueva contrasena.' });
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      sendJson(response, 200, { message: 'Si el email existe, recibira un correo para crear una nueva contrasena.' });
      return;
    }

    sendJson(response, 500, { message: error instanceof Error ? error.message : 'No se pudo enviar el correo.' });
  }
});

export const sendAccessInvite = onRequest({ secrets: [RESEND_API_KEY] }, async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.set(corsHeaders);
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { message: 'Metodo no permitido.' });
    return;
  }

  const email = normalizeEmail(request.body?.email);
  if (!email) {
    sendJson(response, 400, { message: 'Debes indicar un email.' });
    return;
  }

  try {
    await requireAdminCaller(request);

    let created = false;
    try {
      await getAuth().getUserByEmail(email);
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
      await getAuth().createUser({ email, password: temporaryPassword(), emailVerified: false });
      created = true;
    }

    const link = await getAuth().generatePasswordResetLink(email, actionCodeSettings);
    const lead = created
      ? 'Tu usuario fue creado en Implementator. Usa este enlace para definir tu contrasena inicial.'
      : 'Tu acceso a Implementator fue actualizado. Usa este enlace para definir una nueva contrasena.';

    await sendEmail({
      to: email,
      subject: created ? 'Activa tu acceso a Implementator' : 'Actualiza tu acceso a Implementator',
      html: buildResetHtml({
        email,
        link,
        title: created ? 'Bienvenido a Implementator' : 'Actualizacion de acceso',
        lead,
        buttonLabel: created ? 'Crear contrasena' : 'Actualizar contrasena',
      }),
      text: buildResetText({ lead, link }),
    });

    sendJson(response, 200, {
      message: created
        ? 'Usuario creado en Firebase y correo enviado desde Resend.'
        : 'Correo enviado desde Resend para definir una nueva contrasena.',
    });
  } catch (error) {
    sendJson(response, 500, { message: error instanceof Error ? error.message : 'No se pudo enviar el correo.' });
  }
});
