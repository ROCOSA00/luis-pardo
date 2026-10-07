// GET /api/sesion/  →  si la sesión es válida, devuelve el token con el que
// el editor guarda los cambios en el repositorio de la web.
import { configurado, sesionValida, tokenGitHub } from "./_sesion.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!configurado()) return res.status(503).json({ error: "El panel todavía no está configurado." });
  if (!sesionValida(req)) return res.status(401).json({ error: "Sesión cerrada." });
  return res.status(200).json({ token: tokenGitHub() });
}
