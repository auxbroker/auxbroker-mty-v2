import { supabase } from "./supabaseClient.js";

const reqSelect = document.getElementById("requerimiento");
const precioUnicoBox = document.getElementById("precioUnicoBox");
const precioRangoBox = document.getElementById("precioRangoBox");

// Mostrar/ocultar precio según tipo de requerimiento
reqSelect.addEventListener("change", () => {
  if (reqSelect.value === "solicitud") {
    precioUnicoBox.classList.add("hidden");
    precioRangoBox.classList.remove("hidden");
  } else if (reqSelect.value === "ofrecimiento") {
    precioUnicoBox.classList.remove("hidden");
    precioRangoBox.classList.add("hidden");
  } else {
    precioUnicoBox.classList.add("hidden");
    precioRangoBox.classList.add("hidden");
  }
});

document.getElementById("form-bolsa").addEventListener("submit", async (e) => {
  e.preventDefault();

  const requerimiento = reqSelect.value;
  const operacion = document.getElementById("operacion").value;
  const inmueble = document.getElementById("inmueble").value;
  const municipio = document.getElementById("municipio").value;
  const masdetalle = document.getElementById("masdetalle").value.trim();
  const palabraclave = document.getElementById("palabraclave").value.trim();
  const precioUnico = document.getElementById("precioUnico").value.trim();
  const preciomin = document.getElementById("preciomin").value.trim();
  const preciomax = document.getElementById("preciomax").value.trim();

  // Validaciones
  if (!requerimiento || !operacion || !inmueble || !municipio || !masdetalle) {
    alert("Completa todos los campos obligatorios.");
    return;
  }

  if (requerimiento === "ofrecimiento") {
    if (!precioUnico) {
      alert("Debes capturar un precio válido.");
      return;
    }
  } else if (requerimiento === "solicitud") {
    if (!preciomin || !preciomax) {
      alert("Debes capturar precio mínimo y máximo.");
      return;
    }
    if (parseFloat(preciomax) < parseFloat(preciomin)) {
      alert("El precio máximo debe ser mayor o igual al mínimo.");
      return;
    }
  }

  // Construcción del payload
  const payload = {
    fuente: "2",
    pais: "52",
    requerimiento,
    operacion,
    inmueble,
    municipio,
    masdetalle,
    palabraclave,
    preciomin: requerimiento === "solicitud" ? preciomin : precioUnico,
    preciomax: requerimiento === "solicitud" ? preciomax : precioUnico,
    estado: "activa",
    fecha_alta: new Date().toISOString().split("T")[0],
    publicado_desde: new Date().toISOString().split("T")[0],
    veces_republicado: 0
  };

  // console.log("Payload a insertar:", payload);

  try {
    const { data, error } = await supabase.from("bolsa").insert([payload]);

    if (error) {
      alert("❌ Error al registrar: " + error.message);
      console.error(error);
    } else {
      alert("✅ Requerimiento agregado correctamente en la tabla 'bolsa'.");
      console.log(data);
      document.getElementById("form-bolsa").reset();
      // Reset visual: mostrar solo precio único por defecto
      precioUnicoBox.classList.remove("hidden");
      precioRangoBox.classList.add("hidden");
    }
  } catch (err) {
    alert("❌ Error inesperado: " + err.message);
    console.error(err);
  }
});

