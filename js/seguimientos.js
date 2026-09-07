import { supabase } from "./supabaseClient.js";

// console.log("✅ seguimientos.js cargado correctamente");

document.addEventListener("DOMContentLoaded", cargarSeguimientos);

async function cargarSeguimientos() {
  const correoUsuario = localStorage.getItem("correoUsuario");
  if (!correoUsuario) {
    console.error("⚠️ No se encontró correoUsuario en localStorage");
    return;
  }

  // Recuperar teléfono del miembro autenticado
  const { data: miembro, error: errorMiembro } = await supabase
    .from("miembros")
    .select("telefono")
    .eq("correo", correoUsuario)
    .single();

  if (errorMiembro || !miembro) {
    console.error("❌ Error al recuperar miembro:", errorMiembro);
    return;
  }

  const telefonoOrigen = miembro.telefono;

  // Buscar contactos pendientes por documentar
  const { data: contactos, error } = await supabase
    .from("contactos")
    .select("*")
    .eq("telefono_origen", telefonoOrigen)
    .eq("estado_seguimiento", "contactado")
    .order("fecha_contacto", { ascending: false });

  if (error) {
    console.error("❌ Error al cargar seguimientos:", error);
    return;
  }

  const contenedor = document.getElementById("seguimientosContainer");
  contenedor.innerHTML = "";

  if (!contactos || contactos.length === 0) {
    contenedor.innerHTML = "<p>No tienes contactos pendientes por documentar.</p>";
    return;
  }

  contactos.forEach((item) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "seguimiento-card";

    tarjeta.innerHTML = `
      <p><strong>Interés:</strong> ${item.texto_de_interes}</p>
      <div class="seguimiento-linea">
        <span><strong>Teléfono destino:</strong> ${item.telefono_destino}</span>
        <span><strong>Fecha contacto:</strong> ${new Date(item.fecha_contacto).toLocaleString()}</span>
        <button class="btn-documentar">📌 Documentar</button>
      </div>
    `;

    tarjeta.querySelector(".btn-documentar").addEventListener("click", () => {
      abrirFormularioDocumentar(item.id_contacto ?? item.id, item.telefono_destino);
    });

    contenedor.appendChild(tarjeta);
  });
}

function abrirFormularioDocumentar(idContacto, telefonoDestino) {
  // console.log("📌 Abriendo modal para contacto:", idContacto, telefonoDestino);

  // Asignar idContacto al campo oculto
  document.getElementById("idContacto").value = idContacto;

  // Mostrar teléfono destino en el título del modal
  const tituloModal = document.getElementById("tituloDocumentar");
  tituloModal.textContent = `📌 Documentar Contacto ${telefonoDestino}`;

  // Mostrar modal (asegúrate que en CSS .modal tenga display:flex)
  document.getElementById("documentarModal").style.display = "flex";
}

function cerrarModal() {
  const modal = document.getElementById("documentarModal");
  modal.style.display = "none";
  cargarSeguimientos(); // refrescar lista al cancelar también
}

document.getElementById("formDocumentar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const idContacto = document.getElementById("idContacto").value;
  const estadoSeguimiento = document.getElementById("estadoSeguimiento").value;
  const notas = document.getElementById("notas").value;
  const proximoSeguimiento = document.getElementById("proximoSeguimiento").value;

  console.log("💾 Guardando contacto:", { idContacto, estadoSeguimiento, notas, proximoSeguimiento });

  const { error } = await supabase
    .from("contactos")
    .update({
      estado_seguimiento: estadoSeguimiento,
      notas: notas,
      proximo_seguimiento: proximoSeguimiento || null,
    })
    .eq("id_contacto", idContacto);

  if (error) {
    alert("❌ Error al actualizar contacto: " + error.message);
    console.error(error);
  } else {
    alert("✅ Contacto documentado correctamente.");
    cerrarModal();
    cargarSeguimientos(); // refrescar lista
  }
});
