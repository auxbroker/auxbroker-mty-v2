import { supabase } from "./supabaseClient.js";

/**
 * Renderiza los botones de contacto y registra el contacto en la tabla "contactos"
 * además de rebajar cupos del miembro autenticado.
 * @param {HTMLElement} tarjeta - El contenedor donde se mostrarán los botones
 * @param {string} telefonoEmisor - Teléfono del asesor emisor (destino)
 * @param {string} pais - Código de país (ej. 52 para México)
 * @param {string} textoInteres - Contenido del mensaje (masdetalle)
 * @param {number} idBolsa - Identificador del registro en la tabla "bolsa"
 */
export async function mostrarOpcionesContacto(tarjeta, telefonoEmisor, pais, textoInteres, idBolsa) {
  // 👇 Validación: mostrar el idBolsa recibido
  console.log("🆔 mostrarOpcionesContacto recibió bolsa_id:", idBolsa);

  // Mostrar teléfono y botones
  const telefonoDiv = document.createElement("div");
  telefonoDiv.innerHTML = `
    <p><strong>Teléfono:</strong> ${telefonoEmisor}</p>
    <a href="tel:${telefonoEmisor}" class="btn-call">📞 Llamar</a>
    <a href="https://wa.me/${pais}${telefonoEmisor}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>
  `;
  tarjeta.appendChild(telefonoDiv); 

  // Recuperar correo del usuario autenticado
  const correoUsuario = localStorage.getItem("correoUsuario");
  if (!correoUsuario) {
    console.error("⚠️ No se encontró correoUsuario en localStorage");
    return;
  }

  // Buscar miembro por correo para obtener teléfono y cupos
  const { data: miembro, error: errorMiembro } = await supabase
    .from("miembros")
    .select("telefono, cupos")
    .eq("correo", correoUsuario)
    .single();

  if (errorMiembro || !miembro) {
    console.error("⚠️ No se encontró miembro con ese correo", errorMiembro);
    return;
  }

  const telefonoOrigen = miembro.telefono;
  const nuevoCupo = miembro.cupos - 1;

  // 1️⃣ Registrar contacto en tabla "contactos" con bolsa_id
  const { error: errorContacto } = await supabase
    .from("contactos")
    .insert([{
      telefono_origen: telefonoOrigen,
      telefono_destino: telefonoEmisor,
      texto_de_interes: textoInteres,
      bolsa_id: idBolsa || null   // 👈 nuevo campo
    }]);

  if (errorContacto) {
    console.error("❌ Error al registrar contacto:", errorContacto.message);
  } else {
    console.log("✅ Contacto registrado correctamente con bolsa_id:", idBolsa);
  }

  // 2️⃣ Rebajar cupos del miembro autenticado
  const { data: actualizado, error: errorUpdate } = await supabase
    .from("miembros")
    .update({ cupos: nuevoCupo })
    .eq("correo", correoUsuario)
    .select("cupos");

  if (errorUpdate) {
    console.error("❌ Error al actualizar cupos:", errorUpdate);
  } else if (actualizado && actualizado.length > 0) {
    const cupoDiv = document.createElement("p");
    cupoDiv.textContent = `✅ Tu nuevo saldo de cupos es: ${actualizado[0].cupos}`;
    tarjeta.appendChild(cupoDiv);
  }
}
