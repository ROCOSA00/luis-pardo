// POST /api/clave/  { email, actual, nueva }  →  cambia la contraseña del panel.
import { configurado, comprobarCredenciales, guardarContrasena, validarNueva, crearCookie, leerCuerpo, esperar, soloPost } from "./_sesion.js";

export default async function handler(req, res) {
  if (!soloPost(req, res)) return;
  if (!configurado()) return res.status(503).json({ error: "El panel todavía no está configurado." });
  const { email, actual, nueva } = leerCuerpo(req);
  try {
    if (!(await comprobarCredenciales(email, actual))) {
      await esperar(1500);
      return res.status(401).json({ error: "El email o la contraseña actual no son correctos." });
    }
    const problema = validarNueva(nueva);
    if (problema) return res.status(400).json({ error: problema });
    const credencial = await guardarContrasena(nueva, "cambiar la contraseña de acceso");
    res.setHeader("Set-Cookie", crearCookie(credencial));
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ error: "No se ha podido guardar la contraseña. Inténtalo de nuevo en un momento." });
  }
}
