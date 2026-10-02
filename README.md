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

## Antes de publicar: pendientes

- **Vídeos, audios y PDF**: siguen alojados en el WordPress actual (`https://www.luispardo.com/wp-content/uploads/…`). Mientras WordPress siga en marcha funcionan sin problema. **Antes de apuntar el dominio luispardo.com a Vercel** hay que moverlos a otro sitio (un subdominio como `media.luispardo.com`, Vercel Blob, Bunny, etc.) y cambiar esas URLs; si no, dejarán de cargar. Las imágenes ya están incluidas en este repositorio.
- **Dominio y SEO**: las etiquetas `canonical` y Open Graph apuntan ya a `https://www.luispardo.com/`. Es lo correcto para cuando el dominio apunte a Vercel; mientras tanto, `luis-pardo-web.vercel.app` funciona como vista previa.
- **Chat de Luna-iAE**: en WordPress funcionaba con el plugin *AI Engine*. Una web estática no puede ejecutarlo; la página mantiene la historia y las preguntas sugeridas. Si se quiere el chat, hay que conectarlo a un servicio externo.
- **Formularios**: envían directamente a los mismos formularios de **Brevo** que usaba la web anterior (sesiones espiritistas, audios gratuitos, El Clan Secreto, PsiqueMagia, «Te voy a leer la mente»). Conviene hacer una prueba real de cada uno tras publicar.
- **Regala años de vida**: en la web anterior los botones de 10 a 5 años no tenían enlace. Ahora abren WhatsApp con el mensaje preparado; cámbialos si hay otro sistema de pedido.
- **Textos legales**: la política de privacidad se ha adaptado a lo que hace la nueva web (sin comentarios ni cuentas de WordPress). Revisadla con vuestro asesor.
- **Píxel de Meta / analítica**: la web anterior cargaba el píxel de Meta. No se ha incluido; si lo necesitáis, añadid el código en `partials/head.html` junto con un aviso de cookies.

## Publicar (Vercel)

La web está desplegada en Vercel (proyecto `luis-pardo-web`, https://luis-pardo-web.vercel.app). Cada cambio que entra en `main` se publica solo. No hace falta paso de compilación: Vercel sirve los archivos tal cual.

`vercel.json` se encarga de:

- **Redirecciones permanentes** de las URLs antiguas de WordPress que se han fusionado en otras páginas (`/television/`, `/el-clan-secreto/`, `/psiquemagia/`, `/dossier-dejar-de-fumar/`, los formularios de audios de muestra…), para no perder visitas ni posicionamiento al cambiar el dominio.
- **Barra final** en todas las URLs (`/galeria` → `/galeria/`), para que cada página tenga una única dirección.
- **Caché** de una semana para las imágenes y cabeceras de seguridad básicas.

`.vercelignore` evita publicar las herramientas internas (`partials/`, `tools/`, `.htaccess`, este README). Las páginas inexistentes muestran `404.html` automáticamente.

Para usar el dominio propio: *Vercel → luis-pardo-web → Settings → Domains → añadir `luispardo.com` y `www.luispardo.com`*, después de mover los vídeos y audios (ver pendientes).
