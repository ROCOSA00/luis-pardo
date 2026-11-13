// POST /api/login/  { email, password }  →  abre la sesión del panel.
import { configurado, comprobarCredenciales, crearCookie, leerCuerpo, esperar, soloPost } from "./_sesion.js";

export default async function handler(req, res) {
  if (!soloPost(req, res)) return;
  if (!configurado()) return res.status(503).json({ error: "El panel todavía no está configurado." });
  const { email, password } = leerCuerpo(req);
  let credencial;
  try {
    credencial = await comprobarCredenciales(email, password);
  } catch {
    return res.status(503).json({ error: "No se ha podido comprobar la contraseña. Inténtalo de nuevo en un momento." });
  }
  if (!credencial) {
    await esperar(1500); // frena los intentos a ciegas
    return res.status(401).json({ error: "El email o la contraseña no son correctos." });
  }
  res.setHeader("Set-Cookie", crearCookie(credencial));
  return res.status(200).json({ ok: true });
}
