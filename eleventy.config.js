// Configuración de Eleventy: genera la web estática en _site/ a partir de src/.
import fs from "node:fs";
import path from "node:path";
import contenido from "./lib/contenido.js";

const OUTPUT = "_site";

// Copia (o enlaza, si el sistema lo permite) assets/ en _site/assets/.
// Son casi 1 GB de vídeo y audio: con enlaces la publicación tarda segundos.
function linkTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      linkTree(src, dest);
      continue;
    }
    fs.rmSync(dest, { force: true });
    try {
      fs.linkSync(src, dest);
    } catch {
      fs.copyFileSync(src, dest);
    }
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(contenido);

  if (process.env.ELEVENTY_RUN_MODE === "build") {
    eleventyConfig.on("eleventy.after", () => {
      fs.rmSync(path.join(OUTPUT, "assets"), { recursive: true, force: true });
      linkTree("assets", path.join(OUTPUT, "assets"));
    });
  } else {
    // En `npm run dev` el servidor sirve assets/ directamente, sin copiar.
    eleventyConfig.addPassthroughCopy({ assets: "assets" });
  }

  // Editor del panel (Sveltia CMS), con la versión fijada en package.json.
  eleventyConfig.addPassthroughCopy({ "node_modules/@sveltia/cms/dist/sveltia-cms.js": "admin/sveltia-cms.js" });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: OUTPUT },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
