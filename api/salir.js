// GET /api/salir/  →  cierra la sesión y vuelve a la pantalla de acceso.
import { borrarCookie } from "./_sesion.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", borrarCookie());
  res.setHeader("Location", "/admin/?salir");
  return res.status(302).end();
}
