import { supabase } from "./supabaseClient.js";
import { mostrarOpcionesContacto } from "./contact-utils.js";

// console.log("✅ ultsolicitudes.js cargado correctamente");

document.addEventListener("DOMContentLoaded", cargarSolicitudes);

// Variable global del asesor autenticado
let telefonoAsesorGlobal = localStorage.getItem("telefonoAsesor");

async function cargarSolicitudes() {
  const contenedor = document.getElementById("solicitudesContainer");
  contenedor.innerHTML = "";

  // Calcular fecha límite (hoy - 10 días)
  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() - 10);
  const fechaLimiteISO = limite.toISOString();

  // Consulta en la tabla bolsa, filtrando solo requerimientos tipo "solicitud"
  const { data: solicitudes, error } = await supabase
    .from("bolsa")
    .select("*")
    .eq("requerimiento", "solicitud") // 👈 solo solicitudes
    .neq("telefono", telefonoAsesorGlobal) // 👈 excluir al asesor autenticado
    .gte("fecha_alta", fechaLimiteISO) // 👈 solo solicitudes recientes (<= 10 días)
    .order("fecha_alta", { ascending: false });

  if (error) {
    console.error("❌ Error al cargar solicitudes:", error);
    contenedor.innerHTML = "<p>Error al cargar solicitudes.</p>";
    return;
  }

  if (!solicitudes || solicitudes.length === 0) {
    contenedor.innerHTML = "<p>No hay solicitudes recientes disponibles.</p>";
    return;
  }

  const contador = document.createElement("p");
  contador.textContent = `Solicitudes encontradas: ${solicitudes.length}`;
  contador.style.fontWeight = "bold";
  contenedor.appendChild(contador);

  // Renderizar cada solicitud con estilo unificado
  solicitudes.forEach((item) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "solicitud-card";

    const linea = document.createElement("div");
    linea.className = "solicitud-linea";

    const detalleTexto = item.masdetalle || "Sin detalle";
    const fechaTexto = item.fecha_alta || "Sin fecha";

    const detalle = document.createElement("span");
    detalle.innerHTML = `<strong>Detalle:</strong> ${detalleTexto}`;

    const fecha = document.createElement("span");
    fecha.innerHTML = `<strong>Fecha:</strong> ${fechaTexto}`;

    const btnContactar = document.createElement("button");
    btnContactar.className = "btn-contactar";
    btnContactar.textContent = "Contactar";

    btnContactar.addEventListener("click", () => {
      mostrarOpcionesContacto(tarjeta, item.telefono, item.pais, detalleTexto);

      // Botón para cerrar contacto y regresar a solicitudes
      const btnCerrar = document.createElement("button");
      btnCerrar.className = "btn-cerrar";
      btnCerrar.textContent = "Cerrar contacto";

      btnCerrar.addEventListener("click", () => {
        cargarSolicitudes(); // Regresa a la lista inicial
      });

      tarjeta.appendChild(btnCerrar);
    });

    linea.appendChild(detalle);
    linea.appendChild(fecha);
    linea.appendChild(btnContactar);

    tarjeta.appendChild(linea);
    contenedor.appendChild(tarjeta);
  });
}
