// GET /api/sesion/  →  si la sesión es válida, devuelve el token con el que
// el editor guarda los cambios en el repositorio de la web y el email con el
// que se ha entrado (es lo que el panel muestra como cuenta).
import { configurado, sesionValida, tokenGitHub } from "./_sesion.js";

// Repositorio y rama donde guarda el panel. Vercel los da solos (en una vista
// previa, la rama de esa vista previa); GITHUB_REPO y GITHUB_BRANCH permiten
// fijarlos a mano si hiciera falta.
function destino() {
  const { GITHUB_REPO, GITHUB_BRANCH, VERCEL_GIT_REPO_OWNER, VERCEL_GIT_REPO_SLUG, VERCEL_GIT_COMMIT_REF } = process.env;
  const repositorio = (GITHUB_REPO || (VERCEL_GIT_REPO_OWNER && VERCEL_GIT_REPO_SLUG ? `${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}` : "")).trim();
  const rama = (GITHUB_BRANCH || VERCEL_GIT_COMMIT_REF || "main").trim();
  return { repositorio, rama };
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { repositorio, rama } = destino();
  if (!configurado() || !repositorio) return res.status(503).json({ error: "El panel todavía no está configurado." });
  if (!sesionValida(req)) return res.status(401).json({ error: "Sesión cerrada." });
  return res.status(200).json({ token: tokenGitHub(), email: (process.env.ADMIN_EMAIL || "").trim(), repositorio, rama });
}
