import { supabase } from "./supabaseClient.js";
import { loadPartial } from "./utils.js";

// Cargar partials reutilizables
loadPartial("inmuebleBox", "../public/partials/inmueble.html");
loadPartial("municipioBox", "../public/partials/municipio.html");

console.log("✅ ofrecimiento.js cargado correctamente");

document.getElementById("form-ofrecimiento").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Captura de valores
  const operacion = document.getElementById("operacion").value;
  const inmueble = document.getElementById("inmueble").value;
  const municipio = document.getElementById("municipio").value;
  const masdetalle = document.getElementById("descripcion").value.trim();
  const precioUnico = document.getElementById("precio").value.trim();
  const contenidoPrivado = document.getElementById("contenidoPrivado")?.value.trim() || "";

  // Validaciones
  if (!operacion || !inmueble || !municipio || !masdetalle || !precioUnico) {
    alert("Completa todos los campos obligatorios.");
    return;
  }

  if (municipio.toLowerCase() === "na" || municipio.toLowerCase() === "n/a") {
    alert("❌ Para un ofrecimiento debes especificar un municipio válido.");
    return;
  }

  const telefono = localStorage.getItem("telefonoAsesor") || "5544704692";
  const fechaHoy = new Date().toISOString().split("T")[0];

  // Payload principal
  const payloadBolsa = {
    fuente: "2",
    pais: "52",
    telefono,
    requerimiento: "ofrecimiento",
    operacion,
    inmueble,
    municipio,
    masdetalle,
    preciomin: String(parseInt(precioUnico, 10)),
    preciomax: String(parseInt(precioUnico, 10)),
    estado: "activa",
    fecha_alta: fechaHoy,
    publicado_desde: fechaHoy,
    veces_republicado: 0
  };

  try {
    // Paso 1: Insertar en bolsa
    const { data: bolsa, error: errorBolsa } = await supabase
      .from("bolsa")
      .insert([payloadBolsa])
      .select()
      .single();

    if (errorBolsa) throw new Error("Error al registrar ofrecimiento: " + errorBolsa.message);

    // Paso 2: Insertar en datosprivados si aplica
    if (contenidoPrivado) {
      const payloadPrivado = { bolsa_id: bolsa.id, contenido: contenidoPrivado };
      const { error: errorPrivado } = await supabase.from("datosprivados").insert([payloadPrivado]);

      if (errorPrivado) {
        await supabase.from("bolsa").delete().eq("id", bolsa.id); // rollback
        throw new Error("Error al guardar información privada: " + errorPrivado.message);
      }
    }

    // Paso 3: Insertar alarma (contrapartida solicitud)
    const preciomin = (parseInt(precioUnico, 10) * 0.9).toFixed(0);
    const preciomax = (parseInt(precioUnico, 10) * 1.1).toFixed(0);

    const payloadAlarma = {
      telefono,
      bolsa_id: bolsa.id,
      requerimiento: "solicitud",
      operacion,
      inmueble,
      municipio,
      preciomin,
      preciomax,
      ultimo_bolsa_id: 0,
      fecha: fechaHoy,
      visto: "no"
    };

    const { error: errorAlarma } = await supabase
      .from("alarmas")
      .insert([payloadAlarma])
      .select()
      .single();

    if (errorAlarma) {
      await supabase.from("datosprivados").delete().eq("bolsa_id", bolsa.id);
      await supabase.from("bolsa").delete().eq("id", bolsa.id);
      throw new Error("Error al registrar alarma: " + errorAlarma.message);
    }

    alert("✅ Ofrecimiento registrado con éxito, alarma generada y datos privados guardados");
    document.getElementById("form-ofrecimiento").reset();

  } catch (err) {
    alert("❌ Alta cancelada: " + err.message);
    console.error(err);
  }
});
