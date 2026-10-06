// Rutas relativas a la raíz ("./", "../", …) para que la web funcione igual
// en la raíz de un dominio o en una subcarpeta, y la ruta de la página actual
// (sin la barra inicial) para marcar el menú.
export default {
  root: (data) => {
    const url = data.page?.url || "/";
    if (url === "/404.html") return "/";
    const depth = url.split("/").filter(Boolean).length;
    return depth === 0 ? "./" : "../".repeat(depth);
  },
  pagePath: (data) => (data.page?.url || "/").replace(/^\//, ""),
};
