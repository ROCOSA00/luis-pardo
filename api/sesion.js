// GET /api/sesion/  →  si la sesión es válida, devuelve lo que necesita el
// editor: el token con el que guarda en el repositorio, el repositorio y la
// rama, y el email de acceso (es lo que el panel muestra como cuenta).
import { configurado, sesionValida, tokenGitHub, destino, emailAcceso } from "./_sesion.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!configurado()) return res.status(503).json({ error: "El panel todavía no está configurado." });
  let valida;
  try {
    valida = await sesionValida(req);
  } catch {
    return res.status(503).json({ error: "No se ha podido comprobar la sesión. Inténtalo de nuevo en un momento." });
  }
  if (!valida) return res.status(401).json({ error: "Sesión cerrada." });
  const { repositorio, rama } = destino();
  return res.status(200).json({ token: tokenGitHub(), email: emailAcceso(), repositorio, rama });
}
