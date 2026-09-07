import { supabase } from "./supabaseClient.js";
import { mostrarOpcionesContacto } from "./contact-utils.js";

// console.log("✅ misalarmas.js cargado correctamente");

document.addEventListener("DOMContentLoaded", cargarAlarmas);

let resultadosBase = [];
let resultadosActuales = [];
let telefonoAsesorGlobal = localStorage.getItem("telefonoAsesor");

// ===============================
// 📌 Cargar alarmas del asesor autenticado
// ===============================
async function cargarAlarmas() {
  const correoUsuario = localStorage.getItem("correoUsuario");
  if (!correoUsuario) {
    console.error("⚠️ No se encontró correoUsuario en localStorage");
    return;
  }

  const { data: miembro, error: errorMiembro } = await supabase
    .from("miembros")
    .select("telefono")
    .eq("correo", correoUsuario)
    .single();

  if (errorMiembro || !miembro) {
    console.error("❌ Error al recuperar miembro:", errorMiembro);
    return;
  }

  telefonoAsesorGlobal = miembro.telefono;

  const { data: alarmasValidas, error: errorAlarmas } = await supabase
    .from("alarmas")
    .select("*")
    .eq("telefono", telefonoAsesorGlobal)
    .order("id", { ascending: false });

  const contenedor = document.getElementById("alarmasContainer");
  contenedor.innerHTML = "";

  if (errorAlarmas) {
    console.error("❌ Error al cargar alarmas:", errorAlarmas);
    contenedor.innerHTML = "<p>Error al cargar alarmas.</p>";
    return;
  }

  if (!alarmasValidas || alarmasValidas.length === 0) {
    contenedor.innerHTML = "<p>No tienes alarmas registradas.</p>";
    return;
  }

  alarmasValidas.forEach((item) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "alarma-card";

    const frase = `Busco quienes ${item.requerimiento === "solicitud" ? "Solicitan" : "Ofrecen"} ${item.inmueble} en ${item.operacion} en ${item.municipio} entre $${item.preciomin} y $${item.preciomax}`;

    tarjeta.innerHTML = `
      <p>${frase}</p>
      <button class="btn-buscar">🔍 Buscar opciones</button>
    `;

    tarjeta.querySelector(".btn-buscar").addEventListener("click", () => {
      buscarOpciones(item);
    });

    contenedor.appendChild(tarjeta);
  });
}

// ===============================
// 🔍 Buscar opciones en bolsa
// ===============================
async function buscarOpciones(alarma) {
  const precioMinAlarma = parseFloat(alarma.preciomin) || 0;
  const precioMaxAlarma = parseFloat(alarma.preciomax) || 0;

  let query = supabase
    .from("bolsa")
    .select("*")
    .eq("estado", "activa")
    .eq("requerimiento", alarma.requerimiento)
    .eq("operacion", alarma.operacion)
    .eq("inmueble", alarma.inmueble)
    .neq("telefono", telefonoAsesorGlobal);

  if (alarma.municipio && alarma.municipio.toLowerCase() !== "na") {
    query = query.eq("municipio", alarma.municipio);
  }

  const { data: resultados, error } = await query.order("id", { ascending: false });

  if (error) {
    console.error("❌ Error al buscar opciones:", error);
    alert("Error al buscar opciones");
    return;
  }

  resultadosBase = resultados.filter((item) => {
    const precioMinBolsa = parseFloat(item.preciomin) || 0;
    const precioMaxBolsa = parseFloat(item.preciomax) || 0;

    const dentroDeRango =
      precioMinBolsa >= precioMinAlarma &&
      (precioMaxBolsa ? precioMaxBolsa <= precioMaxAlarma : true);

    const presupuestoAbierto =
      alarma.requerimiento === "solicitud" &&
      precioMinBolsa === 1111 &&
      precioMaxBolsa === 1111;

    return dentroDeRango || presupuestoAbierto;
  });

  resultadosActuales = [...resultadosBase];
  mostrarResultados(resultadosActuales);
}

// ===============================
// 🧩 Filtrar por palabra clave
// ===============================
function aplicarFiltroPalabra(palabraClave) {
  const clave = palabraClave.trim().toLowerCase();
  if (!clave) {
    resultadosActuales = [...resultadosBase];
  } else {
    resultadosActuales = resultadosActuales.filter((item) =>
      item.masdetalle.toLowerCase().includes(clave)
    );
  }
  mostrarResultados(resultadosActuales);
}

// ===============================
// 🖥️ Mostrar resultados
// ===============================
function mostrarResultados(lista) {
  const contenedor = document.getElementById("alarmasContainer");
  contenedor.innerHTML = "";

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron opciones con los filtros aplicados.</p>";
    return;
  }

  const filtroDiv = document.createElement("div");
  filtroDiv.className = "filtro-palabra";

  const inputClave = document.createElement("input");
  inputClave.type = "text";
  inputClave.placeholder = "Filtrar por palabra clave";
  inputClave.className = "palabraClave";

  const btnFiltrar = document.createElement("button");
  btnFiltrar.textContent = "🔍 Filtrar";
  btnFiltrar.className = "btn-filtrar";

  btnFiltrar.addEventListener("click", () => {
    aplicarFiltroPalabra(inputClave.value);
  });

  filtroDiv.appendChild(inputClave);
  filtroDiv.appendChild(btnFiltrar);
  contenedor.appendChild(filtroDiv);

  lista.forEach((item) => {
    const precioMinBolsa = parseFloat(item.preciomin) || 0;
    const precioMaxBolsa = parseFloat(item.preciomax) || 0;
    const esPresupuestoAbierto = precioMinBolsa === 1111 && precioMaxBolsa === 1111;

    const indicador = esPresupuestoAbierto ? "Presupuesto abierto" : "En el rango";

    const tarjeta = document.createElement("div");
    tarjeta.className = "solicitud-card";

    tarjeta.innerHTML = `
      <p><strong>Detalle:</strong> ${item.masdetalle}</p>
      <p><strong>Fecha:</strong> ${item.fecha_alta || "Sin fecha"}</p>
      <p><em>${indicador}</em></p>
      <button class="btn-contactar">Contactar</button>
      <button class="btn-regresar">⬅️ Regresar</button>
    `;

    tarjeta.querySelector(".btn-contactar").addEventListener("click", () => {
      mostrarOpcionesContacto(tarjeta, item.telefono, item.pais, item.masdetalle);
    });

    // 👈 Nuevo botón para regresar al listado inicial de alarmas
    tarjeta.querySelector(".btn-regresar").addEventListener("click", () => {
      cargarAlarmas();
    });

    contenedor.appendChild(tarjeta);
  });
}

// Inicializar
cargarAlarmas();



