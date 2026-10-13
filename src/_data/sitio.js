// Datos generales del sitio.
//
// Todo sale de la compilación de Vercel, así que no hay que tocar nada al
// conectar el dominio ni si el repositorio cambia de dueño:
//  - url: el dominio de producción del proyecto en Vercel. Hoy es
//    luis-pardo-2.vercel.app; en cuanto se añade luispardo.com en
//    Vercel → Settings → Domains, la siguiente publicación usa
//    www.luispardo.com (la opción que Vercel recomienda como principal).
//  - repositorio y rama: así el panel de una vista previa guarda en su propia
//    rama (y no toca la web real).
const {
  VERCEL_GIT_REPO_OWNER: dueno,
  VERCEL_GIT_REPO_SLUG: nombre,
  VERCEL_GIT_COMMIT_REF: rama,
  VERCEL_PROJECT_PRODUCTION_URL: dominioVercel,
} = process.env;

const DOMINIO_POR_DEFECTO = "luis-pardo-2.vercel.app";

// Un dominio propio sin www (luispardo.com) se publica con www, que es el
// principal; las direcciones de Vercel se quedan tal cual.
function direccionPublica(dominio) {
  const d = String(dominio || DOMINIO_POR_DEFECTO).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (d.endsWith(".vercel.app") || d.startsWith("www.")) return `https://${d}`;
  return `https://www.${d}`;
}

export default {
  // Dirección pública de la web (canonical, Open Graph, sitemap y robots).
  url: direccionPublica(dominioVercel),
  // Dominio que ha dado Vercel en esta compilación (se muestra en /admin/config.yml para comprobarlo).
  dominioVercel: dominioVercel || "",
  repositorio: dueno && nombre ? `${dueno}/${nombre}` : "ROCOSA00/luis-pardo",
  rama: rama || "main",
};
