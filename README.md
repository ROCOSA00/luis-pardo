# luispardo.com

Nueva web de **Luis Pardo, mentalista**. Sitio estático generado con [Eleventy](https://www.11ty.dev), con estética oscura y mística (negro abisal, rojo sangre y oro viejo) y un **panel de edición** en `/admin` para que el cliente cambie textos, fotos y enlaces sin tocar código.

Reúne todo el contenido de la web anterior, reorganizado en cuatro secciones claras:

| Menú | Páginas |
| --- | --- |
| **Experiencias** | Cuando el Diablo Piensa · MisterioSants · Sesiones espiritistas · Spirit Club Bcn · Empresas |
| **Luis Pardo** | El Mentalista (bio, premios, récord, Minerva, televisión) · Espectáculos anteriores · Libros · Galería |
| **Tu mente** | La Alquimia de la Mente (+ El Clan Secreto y PsiqueMagia) · Masterclass CNV · Masterclass Inteligencia Emocional · MPM · MPMA · Dejar de fumar |
| **Universo** | Luna-iAE · BSO «Dos contra el mundo» · Voy a entrar en tu mente |

Además: **Entradas** (`/comprar_entradas/`) como página central de reservas, páginas legales, 404 y las páginas privadas de los rituales con QR (`/los-7-pecados/`, `/sobre-666/`, `/regala-anos-de-vida/`), que mantienen la misma URL para que los QR impresos sigan funcionando.

## Panel de edición (`/admin`)

El cliente entra en **`/admin`** con su email y contraseña (una pantalla con la imagen de la web, sin cuentas de GitHub ni nada técnico) y edita cada página con formularios en español. Al pulsar *Guardar*, el cambio se publica solo en 1–2 minutos. Tiene una guía con capturas en **`/admin/guia/`**, enlazada desde la pantalla de acceso.

- **Qué puede cambiar**: todos los textos, fotos y enlaces de las 25 páginas; las listas que crecen (opiniones, fotos de la galería, espectáculos anteriores, apariciones en televisión, canciones de la BSO, cifras y puntos de las listas); y en *Ajustes generales* el email, el WhatsApp, el teléfono, la dirección, las redes y los enlaces de compra de entradas, que se aplican en toda la web.
- **Qué no puede tocar**: el diseño, el menú, los formularios de Brevo, los vídeos ni la estructura de las páginas. Eso queda para ti.
- **Fotos**: al subirlas se convierten a WebP de 1600 px como máximo. Las fotos nuevas de la galería generan su miniatura al publicar.
- **Historial**: cada *Guardar* es un commit en `main` («Panel: editar …»), así que todo se puede deshacer desde GitHub.

### Cómo funciona

1. La pantalla de acceso (`src/admin/index.njk`) envía el email y la contraseña a `api/login.js`, que abre una sesión con una cookie firmada de 30 días.
2. Con la sesión abierta, `api/sesion.js` entrega el token de GitHub del proyecto y la página abre el editor ([Sveltia CMS](https://sveltiacms.app), versión fijada en `package.json` y servida desde la propia web). El editor muestra como cuenta el email de acceso y el emblema de la web, no la cuenta de GitHub dueña del token.
3. El editor guarda los cambios en `src/_data/` mediante la API de GitHub y Vercel vuelve a publicar.

El repositorio y la rama se toman de la compilación de Vercel (`src/_data/sitio.js`). Por eso el panel de una **vista previa** guarda en la rama de esa vista previa, sin tocar la web real.

### Puesta en marcha (una sola vez)

1. **Token de GitHub**: en GitHub, *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
   - Nombre: «Panel web Luis Pardo». Caducidad: *No expiration*.
   - *Repository access → Only select repositories*: `luis-pardo`.
   - *Permissions → Repository permissions → Contents*: **Read and write**. *Metadata* se marca sola como solo lectura.
   - Copia el token (empieza por `github_pat_`).
2. **Variables en Vercel**: en el proyecto `luis-pardo`, *Settings → Environment Variables*. Añade las tres variables para todos los entornos (*Production* y *Preview*):

   | Variable | Valor |
   | --- | --- |
   | `ADMIN_EMAIL` | el email con el que entrará el cliente |
   | `ADMIN_PASSWORD` | su contraseña (larga: es la llave del panel) |
   | `GITHUB_TOKEN` | el token del paso 1 |

3. **Vuelve a publicar** (*Deployments → … → Redeploy*) para que las variables se apliquen.
4. Entrégale al cliente la dirección `/admin`, su email, su contraseña y la guía `/admin/guia/`.

**Cambiar la contraseña del cliente**: cambia `ADMIN_PASSWORD` en Vercel y vuelve a publicar. Todas las sesiones abiertas se cierran.

**Si el repositorio pasa a otra cuenta de GitHub** (por ejemplo, la del cliente): el panel detecta el nuevo repositorio solo. Basta con crear un token nuevo desde esa cuenta y cambiar `GITHUB_TOKEN`.

## Estructura

```
src/
  index.njk, <página>/index.njk   Plantillas de cada página: el diseño (HTML y clases)
  _includes/layouts/base.njk      Esqueleto común de todas las páginas
  _includes/partials/             Head, cabecera (menú) y pie
  _data/paginas/<página>.json     Contenido editable de cada página (lo que cambia el panel)
  _data/ajustes.json              Contacto, redes y enlaces de entradas (toda la web)
  _data/sitio.js                  Dominio público, repositorio y rama
  _data/eleventyComputed.js       Datos calculados: ruta raíz, página actual y contenido
  admin/                          Pantalla de acceso, configuración del panel y guía
  sitemap.njk, robots.njk
lib/contenido.js                  Filtros: Markdown → HTML del diseño, enlaces, imágenes, WhatsApp…
api/                              Funciones de Vercel del acceso al panel (login, sesión, salir)
assets/                           CSS, JavaScript, imágenes, vídeos, audios y PDF
eleventy.config.js                Configuración de Eleventy
vercel.json                       Compilación, redirecciones de las URLs antiguas, caché y cabeceras
```

Las plantillas leen el contenido con `{{ c.<sección>.<campo> }}` (`c` es el JSON de la página) y lo pasan por los filtros de `lib/contenido.js`:

| Filtro | Para qué |
| --- | --- |
| `md` | Texto con **negrita**, *cursiva* y enlaces. Los enlaces salen con la clase `gold` y, si van a otra web, en pestaña nueva |
| `titulo` | Títulos: la cursiva se pinta con `text-gradient` (o la clase que se indique, por ejemplo `titulo("text-blood")`) |
| `mdBloque` | Textos largos con párrafos y listas (políticas, historias de los carteles) |
| `texto` | Texto plano, escapado |
| `enlace` | Atributos `href` (+ `target`/`rel` si sale de la web). Las rutas internas se guardan como `/curso/` |
| `img` | `src`, `width` y `height` leídos de la propia imagen |
| `whatsapp`, `tel`, `cifra`, `youtubeId` | Enlaces de WhatsApp con mensaje, teléfonos, contadores animados y vídeos de YouTube |

### Ver la web en local

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # genera _site/
```

El panel necesita las funciones de `api/`, así que se prueba en Vercel: en una vista previa (rama) o en producción.

### Cambiar el diseño o añadir un texto editable

- **Diseño, menú, cabecera o pie**: edita las plantillas de `src/` o `assets/css/main.css`. El contenido no se toca.
- **Nuevo texto editable**: añade el campo al JSON de la página (`src/_data/paginas/…`), úsalo en la plantilla (`{{ c.seccion.campo | md }}`) y añade su campo al formulario en `src/admin/config.njk`, con el mismo nombre.
- **Nueva página**: crea `src/<ruta>/index.njk` (copia una existente), su JSON en `src/_data/paginas/<ruta>.json`, su entrada en `src/admin/config.njk`, el enlace en el menú y la URL en `src/sitemap.njk`.

### Cambiar al dominio luispardo.com

1. En Vercel, *Settings → Domains*, añade `luispardo.com` y `www.luispardo.com`.
2. En cdmon, cambia **solo** el registro `A` de `@` y el `CNAME` de `www` por los valores que indique Vercel. No toques los registros `MX` ni `TXT`, para que el correo siga funcionando.
3. Cambia `url` en `src/_data/sitio.js` a `https://www.luispardo.com`. Canonical, Open Graph, sitemap y robots se actualizan solos.

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
- **Canción 19 «iA» de la BSO**: en el WordPress apuntaba por error a una copia de «La Inquisición». Aparece como «no disponible»; se puede subir el audio correcto desde el panel (*Universo → BSO → Canciones → 19 → Archivo de audio*).
- **Chat de Luna-iAE**: en WordPress funcionaba con el plugin *AI Engine*. Una web estática no puede ejecutarlo; la página mantiene la historia y las preguntas sugeridas. Si se quiere el chat, hay que conectarlo a un servicio externo.
- **Formularios**: envían directamente a los mismos formularios de **Brevo** que usaba la web anterior (sesiones espiritistas, audios gratuitos, El Clan Secreto, PsiqueMagia, «Te voy a leer la mente»). Conviene hacer una prueba real de cada uno.
- **Regala años de vida**: en la web anterior los botones de 10 a 5 años no tenían enlace. Ahora abren WhatsApp con el mensaje preparado; cámbialos si hay otro sistema de pedido.
- **Textos legales**: la política de privacidad se ha adaptado a lo que hace la nueva web (sin comentarios ni cuentas de WordPress). Revisadla con vuestro asesor.
- **Píxel de Meta / analítica**: la web anterior cargaba el píxel de Meta. No se ha incluido; si lo necesitáis, añadid el código en `src/_includes/partials/head.njk` junto con un aviso de cookies.

### Añadir o cambiar un vídeo

Recomprímelo antes de subirlo (GitHub rechaza archivos de más de 100 MB). Con [ffmpeg](https://ffmpeg.org):

```bash
ffmpeg -i original.mov -vf "scale=-2:1280" -c:v libx264 -preset slow -crf 26 -c:a aac -b:a 96k -movflags +faststart assets/media/nombre.mp4
```

## Publicar (Vercel)

La web está en Vercel (proyecto `luis-pardo`, **https://luis-pardo-2.vercel.app**). Cada cambio que entra en `main` (tuyo o del panel) se compila con `npm run build` y se publica solo. Cada rama tiene su propia vista previa. Compilar tarda menos de un segundo: los vídeos y audios se enlazan en vez de copiarse.

`vercel.json` se encarga de:

- **Redirecciones permanentes** de las URLs antiguas de WordPress que se han fusionado en otras páginas (`/television/`, `/el-clan-secreto/`, `/psiquemagia/`, `/dossier-dejar-de-fumar/`, los formularios de audios de muestra…), para no perder visitas ni posicionamiento al cambiar el dominio.
- **Barra final** en todas las URLs (`/galeria` → `/galeria/`). Las funciones del panel se llaman con barra (`/api/login/`) y una reescritura las lleva a `api/login.js`.
- **Caché** de una semana para imágenes, vídeos, audios y PDF; el panel sin caché y sin indexar; cabeceras de seguridad básicas.
