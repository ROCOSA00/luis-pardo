// POST /api/restablecer/  { codigo, nueva }  →  pone una contraseña nueva con
// el enlace del email de «He olvidado mi contraseña».
import { configurado, enlaceValido, guardarContrasena, validarNueva, crearCookie, leerCuerpo, esperar, soloPost } from "./_sesion.js";

export default async function handler(req, res) {
  if (!soloPost(req, res)) return;
  if (!configurado()) return res.status(503).json({ error: "El panel todavía no está configurado." });
  const { codigo, nueva } = leerCuerpo(req);
  try {
    if (!(await enlaceValido(codigo))) {
      await esperar(800);
      return res.status(400).json({ error: "El enlace ha caducado o ya se ha usado. Pide uno nuevo desde «He olvidado mi contraseña»." });
    }
    const problema = validarNueva(nueva);
    if (problema) return res.status(400).json({ error: problema });
    const credencial = await guardarContrasena(nueva, "poner una contraseña nueva desde el email de recuperación");
    res.setHeader("Set-Cookie", crearCookie(credencial));
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ error: "No se ha podido guardar la contraseña. Inténtalo de nuevo en un momento." });
  }
}
