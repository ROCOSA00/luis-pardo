// Acceso al panel de edición.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   ADMIN_EMAIL      email con el que entra el cliente
//   ADMIN_PASSWORD   contraseña inicial (y de emergencia, ver abajo)
//   GITHUB_TOKEN     token de GitHub con permiso de escritura en el repositorio
//   BREVO_API_KEY    (opcional) clave de la API de Brevo, para el email de
//                    «He olvidado mi contraseña»
//   BREVO_REMITENTE  (opcional) remitente verificado en Brevo; si no, ADMIN_EMAIL
//
// Contraseña: el cliente la cambia desde la pantalla de acceso. La nueva se
// guarda en panel/acceso.json del repositorio, cifrada con scrypt y mezclada
// con una clave que solo tiene el servidor (sale de GITHUB_TOKEN): aunque
// alguien viera el archivo, no le sirve para nada. Mientras ese archivo no
// exista, vale ADMIN_PASSWORD. Para volver a ADMIN_PASSWORD (si el cliente la
// olvida y no hay Brevo configurado), borra panel/acceso.json en GitHub.
//
// La sesión es una cookie firmada de 30 días. La firma depende de la
// contraseña vigente: al cambiarla se cierran todas las sesiones abiertas.
import crypto from "node:crypto";

const COOKIE = "lp_panel";
const DIAS = 30;
const RUTA = "panel/acceso.json";
const MINIMO = 10;

const entorno = () => ({
  email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || "",
  token: (process.env.GITHUB_TOKEN || "").trim(),
  brevo: (process.env.BREVO_API_KEY || "").trim(),
  remitente: (process.env.BREVO_REMITENTE || process.env.ADMIN_EMAIL || "").trim(),
  // Solo para pruebas locales: servidores simulados.
  apiGitHub: process.env.GITHUB_API || "https://api.github.com",
  apiBrevo: process.env.BREVO_API_URL || "https://api.brevo.com",
});

// Repositorio y rama donde guarda el panel. Vercel los da solos (en una vista
// previa, la rama de esa vista previa); GITHUB_REPO y GITHUB_BRANCH permiten
// fijarlos a mano si hiciera falta.
export function destino() {
  const { GITHUB_REPO, GITHUB_BRANCH, VERCEL_GIT_REPO_OWNER, VERCEL_GIT_REPO_SLUG, VERCEL_GIT_COMMIT_REF } = process.env;
  const repositorio = (GITHUB_REPO || (VERCEL_GIT_REPO_OWNER && VERCEL_GIT_REPO_SLUG ? `${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}` : "")).trim();
  const rama = (GITHUB_BRANCH || VERCEL_GIT_COMMIT_REF || "main").trim();
  return { repositorio, rama };
}

export const configurado = () => {
  const { email, password, token } = entorno();
  return Boolean(email && password && token && destino().repositorio);
};

export const tokenGitHub = () => entorno().token;
export const emailAcceso = () => (process.env.ADMIN_EMAIL || "").trim();
export const hayEmailDeRecuperacion = () => Boolean(entorno().brevo);

const sha256 = (texto) => crypto.createHash("sha256").update(texto).digest("base64url");
const hmac = (clave, datos) => crypto.createHmac("sha256", clave).update(datos).digest("base64url");

// Comparación en tiempo constante (evita adivinar por lo que tarda la respuesta).
const iguales = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Contraseña guardada en el repositorio ----------

const pimienta = () => crypto.createHmac("sha256", entorno().token).update("panel-acceso").digest();
const huella = () => hmac(pimienta(), "huella");
const derivar = (password, sal) => crypto.scryptSync(String(password), Buffer.concat([sal, pimienta()]), 32, { N: 16384, r: 8, p: 1 });

async function github(ruta, opciones = {}) {
  const { apiGitHub, token } = entorno();
  return fetch(`${apiGitHub}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "panel-web",
      ...(opciones.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

async function leerArchivo() {
  const { repositorio, rama } = destino();
  const r = await github(`/repos/${repositorio}/contents/${RUTA}?ref=${encodeURIComponent(rama)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub respondió ${r.status}`);
  const json = await r.json();
  return { sha: json.sha, datos: JSON.parse(Buffer.from(json.content, "base64").toString("utf8")) };
}

// Contraseña guardada por el cliente, o null si no hay (o si se cambió el
// token, porque entonces ya no se puede comprobar: vuelve a valer ADMIN_PASSWORD).
async function leerAcceso() {
  const archivo = await leerArchivo();
  if (!archivo || archivo.datos?.huella !== huella()) return null;
  return archivo.datos;
}

// Lo que identifica la contraseña vigente (para firmar sesiones y enlaces).
async function credencialVigente() {
  const acceso = await leerAcceso();
  return acceso ? `archivo:${acceso.hash}` : `entorno:${sha256(entorno().password)}`;
}

export function validarNueva(password) {
  const p = String(password || "");
  if (p.length < MINIMO) return `La contraseña debe tener al menos ${MINIMO} caracteres.`;
  if (p.trim().toLowerCase() === entorno().email) return "La contraseña no puede ser tu email.";
  return null;
}

// Devuelve la credencial vigente si el email y la contraseña son correctos.
export async function comprobarCredenciales(email, password) {
  const e = entorno();
  const okEmail = iguales(String(email || "").trim().toLowerCase(), e.email);
  const acceso = await leerAcceso();
  let okPassword;
  if (acceso) {
    const calculado = derivar(password, Buffer.from(acceso.sal, "base64"));
    okPassword = crypto.timingSafeEqual(calculado, Buffer.from(acceso.hash, "base64"));
  } else {
    okPassword = iguales(String(password || ""), e.password);
  }
  if (!okEmail || !okPassword) return null;
  return acceso ? `archivo:${acceso.hash}` : `entorno:${sha256(e.password)}`;
}

// Guarda una contraseña nueva y devuelve la nueva credencial vigente.
export async function guardarContrasena(password, motivo) {
  const { repositorio, rama } = destino();
  const sal = crypto.randomBytes(16);
  const hash = derivar(password, sal).toString("base64");
  const datos = { version: 1, sal: sal.toString("base64"), hash, huella: huella(), cambiada: new Date().toISOString() };
  const actual = await leerArchivo();
  const r = await github(`/repos/${repositorio}/contents/${RUTA}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Panel: ${motivo}`,
      content: Buffer.from(JSON.stringify(datos, null, 2) + "\n").toString("base64"),
      branch: rama,
      ...(actual ? { sha: actual.sha } : {}),
    }),
  });
  if (!r.ok) throw new Error(`GitHub respondió ${r.status}`);
  return `archivo:${hash}`;
}

// ---------- Cookie de sesión ----------

const claveSesion = (credencial) => {
  const { email, token } = entorno();
  return crypto.createHash("sha256").update(`panel\n${email}\n${credencial}\n${token}`).digest();
};

export function crearCookie(credencial) {
  const datos = Buffer.from(JSON.stringify({ exp: Date.now() + DIAS * 86400e3 })).toString("base64url");
  const valor = `${datos}.${hmac(claveSesion(credencial), datos)}`;
  return `${COOKIE}=${valor}; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DIAS * 86400}`;
}

export const borrarCookie = () => `${COOKIE}=; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function sesionValida(req) {
  const valor = (req.headers?.cookie || "")
    .split(/;\s*/)
    .find((c) => c.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!valor || !configurado()) return false;
  const [datos, firma] = valor.split(".");
  if (!datos || !firma) return false;
  const credencial = await credencialVigente();
  if (!iguales(firma, hmac(claveSesion(credencial), datos))) return false;
  try {
    return JSON.parse(Buffer.from(datos, "base64url").toString()).exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- «He olvidado mi contraseña» ----------

const claveEnlace = () => {
  const { email, token } = entorno();
  return crypto.createHash("sha256").update(`restablecer\n${email}\n${token}`).digest();
};

// Enlace de un solo uso: caduca en una hora y deja de valer en cuanto la
// contraseña cambia.
export async function crearEnlaceRestablecer() {
  const credencial = await credencialVigente();
  const datos = Buffer.from(JSON.stringify({ exp: Date.now() + 3600e3, c: sha256(credencial).slice(0, 22) })).toString("base64url");
  return `${direccionPublica()}/admin/?restablecer=${datos}.${hmac(claveEnlace(), datos)}`;
}

export async function enlaceValido(codigo) {
  const [datos, firma] = String(codigo || "").split(".");
  if (!datos || !firma || !iguales(firma, hmac(claveEnlace(), datos))) return false;
  try {
    const { exp, c } = JSON.parse(Buffer.from(datos, "base64url").toString());
    return exp > Date.now() && iguales(c, sha256(await credencialVigente()).slice(0, 22));
  } catch {
    return false;
  }
}

// Dirección de la web real (no la de la petición, que se podría falsear).
function direccionPublica() {
  const d = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "luis-pardo-2.vercel.app").trim().toLowerCase().replace(/\/+$/, "");
  if (/^https?:\/\//.test(d)) return d;
  if (d.endsWith(".vercel.app") || d.startsWith("www.")) return `https://${d}`;
  return `https://www.${d}`;
}

export async function enviarEmail({ asunto, html }) {
  const { brevo, remitente, apiBrevo } = entorno();
  const r = await fetch(`${apiBrevo}/v3/smtp/email`, {
    method: "POST",
    headers: { "api-key": brevo, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Web de Luis Pardo", email: remitente }, to: [{ email: emailAcceso() }], subject: asunto, htmlContent: html }),
  });
  if (!r.ok) throw new Error(`Brevo respondió ${r.status}`);
}

export function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

export function soloPost(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") return true;
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Método no permitido." });
  return false;
}
