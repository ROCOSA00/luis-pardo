// Filtros que convierten el contenido editable (src/_data) en el HTML de la web.
//
// Los textos se guardan en Markdown sencillo, que es lo que produce el editor
// del panel: **negrita**, *cursiva* y [enlaces](https://…). Aquí se traduce a
// las mismas etiquetas y clases que usa el diseño, para que el cliente pueda
// cambiar las palabras sin tocar el aspecto.
import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import nunjucks from "nunjucks";
import { imageSize } from "image-size";
import Image from "@11ty/eleventy-img";

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false, typographer: false });

// Direcciones que se consideran «esta misma web»: el dominio propio y las
// direcciones de Vercel del proyecto (luis-pardo-2.vercel.app, vistas previas…).
const PROPIOS = /^https?:\/\/((www\.)?luispardo\.com|luis-pardo(-[a-z0-9-]+)?\.vercel\.app)(?=\/|$)/i;

// Ruta relativa a la raíz de la web para la página actual ("./", "../", …).
export function raizDe(url) {
  const u = String(url || "/");
  if (u === "/404.html") return "/";
  const depth = u.split("/").filter(Boolean).length;
  return depth === 0 ? "./" : "../".repeat(depth);
}

// Nombre del archivo de contenido de cada página (src/_data/paginas/<clave>.json).
export function claveDePagina(url) {
  const u = String(url || "/");
  return u === "/" ? "inicio" : u === "/404.html" ? "no-encontrada" : u.replace(/^\/|\/$/g, "");
}

// Convierte un enlace del contenido en el href final.
// "/curso/" → "../curso/" (según la página); "https://otra.web" se queda igual.
export function resolverEnlace(href, raiz) {
  let url = String(href ?? "").trim();
  // Un enlace a una página concreta de esta web se hace relativo; el dominio
  // a secas (por ejemplo «www.luispardo.com» en un texto) se deja tal cual.
  if (PROPIOS.test(url) && url.replace(PROPIOS, "").length > 1) url = url.replace(PROPIOS, "");
  if (url.startsWith("/") && !url.startsWith("//")) return raiz + url.slice(1);
  return url;
}

export const esExterno = (href) => /^https?:\/\//i.test(href) && !PROPIOS.test(href);

const escapar = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Atributos de un enlace: href y, si sale de la web, target/rel.
export function atributosEnlace(href, raiz, { nuevaVentana = true } = {}) {
  const final = resolverEnlace(href, raiz);
  let out = `href="${escapar(final)}"`;
  // Otras webs y archivos (PDF, audio…) se abren en una pestaña nueva.
  if (nuevaVentana && (esExterno(final) || /^\/assets\//.test(String(href).trim()))) out += ` target="_blank" rel="noopener"`;
  return out;
}

// Ajusta el HTML que genera markdown-it al del diseño.
//  enlace: clase de los enlaces ("gold" por defecto, "" para ninguna)
//  resalte: clase con la que se pinta la cursiva (en títulos) o null para <em>
//  negrita: "strong", "b" o "gold" (<strong class="gold">)
function adaptar(html, raiz, { enlace = "gold", resalte = null, negrita = "strong", nuevaVentana = true } = {}) {
  html = html.replace(/<br>\n/g, "<br>");
  html = html.replace(/<a href="([^"]*)">/g, (_, href) => {
    const real = href.replace(/&amp;/g, "&");
    const clase = enlace ? `class="${enlace}" ` : "";
    return `<a ${clase}${atributosEnlace(real, raiz, { nuevaVentana: nuevaVentana && enlace !== "" })}>`;
  });
  if (resalte) html = html.replace(/<em>/g, `<span class="${resalte}">`).replace(/<\/em>/g, "</span>");
  if (negrita === "b") html = html.replace(/<strong>/g, "<b>").replace(/<\/strong>/g, "</b>");
  if (negrita === "gold") html = html.replace(/<strong>/g, '<strong class="gold">');
  return html;
}

// Tamaño real de una imagen, leído del archivo.
const cacheTamanos = new Map();
export function tamanoImagen(src) {
  const rel = String(src ?? "").replace(/^\//, "");
  if (!rel || /^https?:/i.test(rel)) return null;
  if (!cacheTamanos.has(rel)) {
    let dims = null;
    try {
      const { width, height } = imageSize(fs.readFileSync(path.resolve(rel)));
      dims = { width, height };
    } catch {
      dims = null;
    }
    cacheTamanos.set(rel, dims);
  }
  return cacheTamanos.get(rel);
}

// Número para WhatsApp/teléfono: solo dígitos, con prefijo de España si falta.
export function soloDigitos(telefono, prefijo = "34") {
  const limpio = String(telefono ?? "").trim();
  const digitos = limpio.replace(/\D/g, "");
  if (limpio.startsWith("+") || limpio.startsWith("00")) return digitos.replace(/^00/, "");
  return digitos.length === 9 ? prefijo + digitos : digitos;
}

// "+2.000" → { count: "2000", prefix: "+" } para el contador animado.
export function datosCifra(texto) {
  const t = String(texto ?? "").trim();
  const prefix = (t.match(/^[^\d]*/) || [""])[0];
  const numero = t.slice(prefix.length).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  return { count: numero, prefix };
}

// El texto del editor puede traer saltos de línea como <br>: se convierten
// en saltos de Markdown para no mostrar la etiqueta.
const preparar = (texto) => String(texto ?? "").replace(/<br\s*\/?>/gi, "\\\n");

// Miniatura de la galería: usa la de assets/…/mini/ si existe; si no (fotos
// subidas desde el panel), la genera al publicar.
async function miniatura(src, raiz) {
  const rel = String(src ?? "").replace(/^\//, "");
  const mini = `${path.posix.dirname(rel)}/mini/${path.posix.basename(rel).replace(/\.[^.]+$/, ".webp")}`;
  if (fs.existsSync(mini)) return { url: "/" + mini, ...tamanoImagen(mini) };
  const meta = await Image(rel, { widths: [600], formats: ["webp"], outputDir: "_site/img/mini/", urlPath: "/img/mini/" });
  const { url, width, height } = meta.webp[0];
  return { url, width, height };
}

export default function (eleventyConfig) {
  const raiz = (ctx) => raizDe(ctx?.page?.url);
  const seguro = (html) => new nunjucks.runtime.SafeString(html);

  // Texto en línea (párrafos, puntos de lista, avisos…).
  eleventyConfig.addFilter("md", function (texto, opciones = {}) {
    return seguro(adaptar(markdown.renderInline(preparar(texto)), raiz(this), opciones));
  });

  // Títulos: la cursiva se pinta con la clase de resalte del diseño.
  eleventyConfig.addFilter("titulo", function (texto, resalte = "text-gradient") {
    return seguro(adaptar(markdown.renderInline(preparar(texto)), raiz(this), { resalte }));
  });

  // Bloques largos con párrafos, subtítulos y listas (textos legales…).
  eleventyConfig.addFilter("mdBloque", function (texto, opciones = {}) {
    return seguro(adaptar(markdown.render(preparar(texto)), raiz(this), { enlace: "", ...opciones }));
  });

  // Atributos de un botón o enlace: href="…" [target rel].
  eleventyConfig.addFilter("enlace", function (href) {
    return seguro(atributosEnlace(href, raiz(this)));
  });

  // Ruta de un archivo de la web relativa a la página.
  eleventyConfig.addFilter("ruta", function (src) {
    return seguro(escapar(resolverEnlace(src, raiz(this))));
  });

  // Atributos de una imagen: src, width y height.
  eleventyConfig.addFilter("img", function (src) {
    const dims = tamanoImagen(src);
    const base = `src="${escapar(resolverEnlace(src, raiz(this)))}"`;
    return seguro(dims ? `${base} width="${dims.width}" height="${dims.height}"` : base);
  });

  // Enlace de WhatsApp con mensaje opcional.
  eleventyConfig.addFilter("whatsapp", function (mensaje, numero) {
    const base = `https://wa.me/${soloDigitos(numero)}`;
    return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
  });

  eleventyConfig.addFilter("tel", (numero) => `tel:+${soloDigitos(numero)}`);

  // Atributos del contador animado de las cifras.
  eleventyConfig.addFilter("cifra", function (texto) {
    const { count, prefix } = datosCifra(texto);
    return seguro(`data-count="${count}"` + (prefix ? ` data-prefix="${escapar(prefix)}"` : ""));
  });

  // Identificador de un vídeo de YouTube a partir del enlace o del propio id.
  eleventyConfig.addFilter("youtubeId", (valor) => {
    const v = String(valor ?? "").trim();
    const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : v;
  });

  eleventyConfig.addFilter("inicial", (nombre) => String(nombre ?? "").trim().charAt(0).toUpperCase());
  eleventyConfig.addFilter("dosCifras", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("texto", (s) => seguro(escapar(s)));
  // Retardo de la animación de entrada de cada elemento de una lista:
  // paso en centésimas de segundo; ciclo para reiniciar cada N elementos.
  eleventyConfig.addNunjucksGlobal("retardo", (i, paso, ciclo) => {
    const c = paso * (ciclo ? i % ciclo : i);
    if (!c) return "";
    const s = c % 10 === 0 ? String(c / 10) : String(c).padStart(2, "0");
    return seguro(` style="--d:.${s}s"`);
  });

  eleventyConfig.addAsyncShortcode("miniatura", async function (src, alt) {
    const m = await miniatura(src, raiz(this));
    return `<img src="${escapar(resolverEnlace(m.url, raiz(this)))}" width="${m.width}" height="${m.height}" alt="${escapar(alt)}" loading="lazy" decoding="async">`;
  });

  eleventyConfig.addFilter("sinFormato", (s) =>
    String(s ?? "").replace(/\\\n/g, " ").replace(/[*_]+/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim()
  );
}
