# luispardo.com

Nueva web de **Luis Pardo, mentalista**. Sitio estático (HTML + CSS + JavaScript, sin WordPress ni dependencias), con estética oscura y mística: negro abisal, rojo sangre y oro viejo.

Reúne todo el contenido de la web anterior, reorganizado en cuatro secciones claras:

| Menú | Páginas |
| --- | --- |
| **Experiencias** | Cuando el Diablo Piensa · MisterioSants · Sesiones espiritistas · Spirit Club Bcn · Empresas |
| **Luis Pardo** | El Mentalista (bio, premios, récord, Minerva, televisión) · Espectáculos anteriores · Libros · Galería |
| **Tu mente** | La Alquimia de la Mente (+ El Clan Secreto y PsiqueMagia) · Masterclass CNV · Masterclass Inteligencia Emocional · MPM · MPMA · Dejar de fumar |
| **Universo** | Luna-iAE · BSO «Dos contra el mundo» · Voy a entrar en tu mente |

Además: **Entradas** (`/comprar_entradas/`) como página central de reservas, páginas legales, 404 y las páginas privadas de los rituales con QR (`/los-7-pecados/`, `/sobre-666/`, `/regala-anos-de-vida/`), que mantienen la misma URL para que los QR impresos sigan funcionando.

## Ver la web en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Estructura

```
index.html                  Inicio
<sección>/index.html        Cada página en su carpeta (URLs limpias, iguales a las antiguas)
assets/css/main.css         Todos los estilos (variables de color y tipografía al principio)
assets/js/main.js           Interacciones (menú, animaciones, carruseles, vídeos, reproductor, truco…)
assets/img/                 Imágenes optimizadas en WebP
assets/media/               Vídeos (MP4 H.264, recomprimidos para web, máx. ~60 MB)
assets/audio/               Banda sonora (bso/) y audios de muestra del MPM y el MPMA
assets/docs/                Dossier «Dejar de fumar en 21 días» (PDF)
partials/                   Piezas comunes: head, cabecera (menú) y pie
tools/layout.mjs            Copia las piezas comunes en todas las páginas
.vercel.json / .vercelignore  Configuración de Vercel: redirecciones de las URLs antiguas, barra final, caché
.htaccess                   Lo mismo para un hosting Apache (SiteGround), por si algún día se usa
```

### Editar el menú, la cabecera o el pie

1. Edita `partials/header.html`, `partials/footer.html` o `partials/head.html`.
2. Ejecuta `node tools/layout.mjs`.

El script reemplaza el bloque entre `<!-- HEADER:START -->` y `<!-- HEADER:END -->` (y los equivalentes de HEAD y FOOTER) en todas las páginas, ajusta las rutas relativas y marca la página activa del menú.

### Añadir una página

Copia una página existente a una carpeta nueva (`mi-pagina/index.html`), cambia el título, la descripción y el contenido de `<main>`, y ejecuta `node tools/layout.mjs`.

## Efectos dinámicos

- Animación de entrada (un ojo que se abre) en la primera visita.
- Hero con «linterna» que sigue al cursor y brasas flotando.
- Palabras que se «descifran» (telepatía, predicción, hipnosis…).
- Apariciones al hacer scroll, contadores animados, tarjetas tipo tarot con inclinación 3D.
- **Truco interactivo de mentalismo** «Déjame leerte la mente» (inicio y *Voy a entrar en tu mente*).
- Carteles de espectáculos que se giran para contar su historia.
- Reproductor propio para las 21 canciones de la BSO.
- Galería con visor a pantalla completa (teclado y gestos).
- Cuenta atrás real de 666 segundos en *Regala años de vida*.
- Botón flotante de WhatsApp y barra fija de reserva en móvil.

Todo respeta `prefers-reduced-motion` y el contenido sigue visible sin JavaScript.

## Pendientes

- **Vídeos que faltan**: estos cinco vídeos ya no existían en el servidor del WordPress (daban error 404), así que no se han podido recuperar. La web muestra un aviso elegante en su lugar. Para recuperarlos, sube el archivo con **exactamente** este nombre:
  - `assets/media/masterclass-cnv-2.mp4` — ejercicio de la masterclass de Comunicación No Verbal
  - `assets/media/masterclass-ie-1.mp4` y `assets/media/masterclass-ie-2.mp4` — los dos vídeos de la masterclass de Inteligencia Emocional
  - `assets/media/mpm.mp4` — vídeo de la página de MPM personalizados
  - `assets/media/voy-a-entrar-en-tu-mente.mp4` — vídeo de «Voy a entrar en tu mente»
- **Canción 19 «iA» de la BSO**: en el WordPress apuntaba por error a una copia de «La Inquisición». Aparece como «no disponible»; sube el audio correcto como `assets/audio/bso/19-ia.mp3` y añade `data-src="../assets/audio/bso/19-ia.mp3"` a su `<li>` en `dos-contra-el-mundo/index.html` (y quítale `class="is-missing"` y `disabled`).
- **Chat de Luna-iAE**: en WordPress funcionaba con el plugin *AI Engine*. Una web estática no puede ejecutarlo; la página mantiene la historia y las preguntas sugeridas. Si se quiere el chat, hay que conectarlo a un servicio externo.
- **Formularios**: envían directamente a los mismos formularios de **Brevo** que usaba la web anterior (sesiones espiritistas, audios gratuitos, El Clan Secreto, PsiqueMagia, «Te voy a leer la mente»). Conviene hacer una prueba real de cada uno.
- **Regala años de vida**: en la web anterior los botones de 10 a 5 años no tenían enlace. Ahora abren WhatsApp con el mensaje preparado; cámbialos si hay otro sistema de pedido.
- **Textos legales**: la política de privacidad se ha adaptado a lo que hace la nueva web (sin comentarios ni cuentas de WordPress). Revisadla con vuestro asesor.
- **Píxel de Meta / analítica**: la web anterior cargaba el píxel de Meta. No se ha incluido; si lo necesitáis, añadid el código en `partials/head.html` junto con un aviso de cookies.

### Añadir o cambiar un vídeo

Recomprímelo antes de subirlo (GitHub rechaza archivos de más de 100 MB). Con [ffmpeg](https://ffmpeg.org):

```bash
ffmpeg -i original.mov -vf "scale=-2:1280" -c:v libx264 -preset slow -crf 26 -c:a aac -b:a 96k -movflags +faststart assets/media/nombre.mp4
```

## Publicar (Vercel)

La web está desplegada en Vercel (proyecto `luis-pardo`, **https://luis-pardo.vercel.app**). Todo —páginas, imágenes, vídeos, audios y PDF— se sirve desde Vercel; ya no depende del WordPress. Cada cambio que entra en `main` se publica solo. No hace falta paso de compilación: Vercel sirve los archivos tal cual.

`vercel.json` se encarga de:

- **Redirecciones permanentes** de las URLs antiguas de WordPress que se han fusionado en otras páginas (`/television/`, `/el-clan-secreto/`, `/psiquemagia/`, `/dossier-dejar-de-fumar/`, los formularios de audios de muestra…), para no perder visitas ni posicionamiento al cambiar el dominio.
- **Barra final** en todas las URLs (`/galeria` → `/galeria/`), para que cada página tenga una única dirección.
- **Caché** de una semana para imágenes, vídeos, audios y PDF, y cabeceras de seguridad básicas.

`.vercelignore` evita publicar las herramientas internas (`partials/`, `tools/`, `.htaccess`, este README). Las páginas inexistentes muestran `404.html` automáticamente.

Las etiquetas `canonical`, Open Graph, `sitemap.xml` y `robots.txt` usan `https://luis-pardo.vercel.app/`. Si algún día conectas un dominio propio (*Vercel → luis-pardo → Settings → Domains*), cambia esa dirección en todos los archivos:

```bash
grep -rl 'https://luis-pardo.vercel.app/' --include=*.html --include=*.xml --include=*.txt . | xargs sed -i 's#https://luis-pardo.vercel.app/#https://www.luispardo.com/#g'
```

El proyecto `luis-pardo-web` de Vercel despliega el mismo repositorio y ya no hace falta: se puede borrar.
