// Datos calculados para cada página:
//  root     ruta relativa a la raíz ("./", "../", …), para que la web funcione
//           igual en un dominio o en una subcarpeta
//  pagePath ruta de la página sin la barra inicial, para marcar el menú
//  c        contenido editable de la página (src/_data/paginas/<clave>.json)
import { raizDe, claveDePagina } from "../../lib/contenido.js";

export default {
  root: (data) => raizDe(data.page?.url),
  pagePath: (data) => String(data.page?.url || "/").replace(/^\//, ""),
  c: (data) => data.paginas?.[claveDePagina(data.page?.url)] ?? {},
};
