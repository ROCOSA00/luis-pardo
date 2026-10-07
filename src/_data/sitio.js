// Datos generales del sitio.
//
// En Vercel, el repositorio y la rama salen solos de la compilación: así el
// panel de una vista previa guarda en su propia rama (y no toca la web real)
// y, si el repositorio cambia de dueño, el panel lo sigue sin tocar nada.
const { VERCEL_GIT_REPO_OWNER: dueno, VERCEL_GIT_REPO_SLUG: nombre, VERCEL_GIT_COMMIT_REF: rama } = process.env;

export default {
  // Dirección pública de la web (canonical, Open Graph, sitemap y robots).
  url: "https://luis-pardo-2.vercel.app",
  repositorio: dueno && nombre ? `${dueno}/${nombre}` : "ROCOSA00/luis-pardo",
  rama: rama || "main",
};
