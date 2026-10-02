#!/usr/bin/env node
/**
 * Sincroniza las piezas comunes (head, cabecera y pie) en todas las páginas.
 *
 *   node tools/layout.mjs
 *
 * Cada página contiene marcadores:
 *   <!-- HEAD:START --><!-- HEAD:END -->
 *   <!-- HEADER:START --><!-- HEADER:END -->
 *   <!-- FOOTER:START --><!-- FOOTER:END -->
 * El contenido entre marcadores se reemplaza por el de /partials.
 * {{root}} se sustituye por la ruta relativa a la raíz ("./", "../", …),
 * así la web funciona igual en la raíz del dominio que en una subcarpeta.
 * Además marca como activo el enlace del menú de la página actual.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["partials", "node_modules", ".git", "tools", "assets"]);
const partial = (name) => readFileSync(join(ROOT, "partials", name), "utf8").trim();
const parts = { HEAD: partial("head.html"), HEADER: partial("header.html"), FOOTER: partial("footer.html") };

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

function markCurrent(html, pagePath) {
  if (!pagePath) return html;
  const needle = `data-path="${pagePath}"`;
  html = html.split(needle).join(`${needle} aria-current="page"`);
  // Marca el desplegable que contiene la página actual.
  return html.replace(/<div class="nav-item has-dropdown">([\s\S]*?)<\/div>\s*<\/div>/g, (block) =>
    block.includes(`${needle} aria-current`) ? block.replace('class="nav-item has-dropdown"', 'class="nav-item has-dropdown is-current"') : block
  );
}

let count = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const depth = rel.split(sep).length - 1;
  const is404 = rel === "404.html";
  const root = is404 ? "/" : depth === 0 ? "./" : "../".repeat(depth);
  const pagePath = depth === 0 ? "" : rel.split(sep).slice(0, -1).join("/") + "/";
  let html = readFileSync(file, "utf8");
  const before = html;

  for (const [key, content] of Object.entries(parts)) {
    const re = new RegExp(`<!-- ${key}:START -->[\\s\\S]*?<!-- ${key}:END -->`);
    if (!re.test(html)) continue;
    let block = content.replaceAll("{{root}}", root);
    if (key === "HEADER") block = markCurrent(block, pagePath);
    html = html.replace(re, `<!-- ${key}:START -->\n${block}\n<!-- ${key}:END -->`);
  }
  html = html.replaceAll("{{root}}", root);

  if (html !== before) {
    writeFileSync(file, html);
    count++;
  }
}
console.log(`Layout sincronizado en ${count} página(s).`);
