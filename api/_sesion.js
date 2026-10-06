// Sesión del panel de edición: una cookie firmada (HMAC) que dura 30 días.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   ADMIN_EMAIL     email con el que entra el cliente
//   ADMIN_PASSWORD  su contraseña
//   GITHUB_TOKEN    token de GitHub con permiso de escritura en el repositorio
//
// La clave de firma sale de esas tres variables: si cambias la contraseña o
// el token, todas las sesiones abiertas se cierran.
import crypto from "node:crypto";

const COOKIE = "lp_panel";
const DIAS = 30;

const entorno = () => ({
  email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || "",
  token: (process.env.GITHUB_TOKEN || "").trim(),
});

export const configurado = () => {
  const { email, password, token } = entorno();
  return Boolean(email && password && token);
};

export const tokenGitHub = () => entorno().token;

const clave = () => {
  const { email, password, token } = entorno();
  return crypto.createHash("sha256").update(`panel\n${email}\n${password}\n${token}`).digest();
};
const firmar = (datos) => crypto.createHmac("sha256", clave()).update(datos).digest("base64url");

// Comparación en tiempo constante (evita adivinar por lo que tarda la respuesta).
const iguales = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function credencialesCorrectas(email, password) {
  const e = entorno();
  const okEmail = iguales(String(email || "").trim().toLowerCase(), e.email);
  const okPassword = iguales(String(password || ""), e.password);
  return okEmail && okPassword;
}

export function crearCookie() {
  const datos = Buffer.from(JSON.stringify({ exp: Date.now() + DIAS * 86400e3 })).toString("base64url");
  const valor = `${datos}.${firmar(datos)}`;
  return `${COOKIE}=${valor}; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DIAS * 86400}`;
}

export const borrarCookie = () => `${COOKIE}=; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function sesionValida(req) {
  const cabecera = req.headers?.cookie || "";
  const valor = cabecera
    .split(/;\s*/)
    .find((c) => c.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!valor || !configurado()) return false;
  const [datos, firma] = valor.split(".");
  if (!datos || !firma || !iguales(firma, firmar(datos))) return false;
  try {
    return JSON.parse(Buffer.from(datos, "base64url").toString()).exp > Date.now();
  } catch {
    return false;
  }
}

export function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}
