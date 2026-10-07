// POST /api/login/  { email, password }  →  abre la sesión del panel.
import { configurado, credencialesCorrectas, crearCookie, leerCuerpo } from "./_sesion.js";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  if (!configurado()) {
    return res.status(503).json({ error: "El panel todavía no está configurado." });
  }
  const { email, password } = leerCuerpo(req);
  if (!credencialesCorrectas(email, password)) {
    await esperar(1500); // frena los intentos a ciegas
    return res.status(401).json({ error: "El email o la contraseña no son correctos." });
  }
  res.setHeader("Set-Cookie", crearCookie());
  return res.status(200).json({ ok: true });
}
