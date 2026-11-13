// POST /api/olvido/  { email }  →  envía por email un enlace para poner una
// contraseña nueva. Responde lo mismo aunque el email no sea el correcto, para
// no dar pistas a quien lo intente.
import { configurado, hayEmailDeRecuperacion, emailAcceso, crearEnlaceRestablecer, enviarEmail, leerCuerpo, esperar, soloPost } from "./_sesion.js";

export default async function handler(req, res) {
  if (!soloPost(req, res)) return;
  if (!configurado()) return res.status(503).json({ error: "El panel todavía no está configurado." });
  if (!hayEmailDeRecuperacion()) return res.status(200).json({ modo: "manual" });
  const { email } = leerCuerpo(req);
  const correcto = String(email || "").trim().toLowerCase() === emailAcceso().toLowerCase();
  try {
    if (correcto) {
      const enlace = await crearEnlaceRestablecer();
      await enviarEmail({
        asunto: "Cambiar la contraseña del panel de tu web",
        html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#222">
<p>Hola:</p>
<p>Alguien (seguramente tú) ha pedido cambiar la contraseña del panel de edición de tu web.</p>
<p><a href="${enlace}" style="display:inline-block;padding:12px 22px;background:#a3192c;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold">Poner una contraseña nueva</a></p>
<p>El enlace vale durante una hora y solo se puede usar una vez.</p>
<p>Si no lo has pedido tú, no hagas nada: tu contraseña sigue igual.</p>
</div>`,
      });
    } else {
      await esperar(800);
    }
  } catch {
    return res.status(503).json({ error: "No se ha podido enviar el email. Inténtalo de nuevo en un momento." });
  }
  return res.status(200).json({ modo: "email" });
}
