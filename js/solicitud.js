import { supabase } from "./supabaseClient.js";

console.log("✅ solicitud.js cargado correctamente");

document.getElementById("form-solicitud").addEventListener("submit", async (e) => {
  e.preventDefault();

  const operacion = document.getElementById("operacion").value;
  const inmueble = document.getElementById("inmueble").value;
  const municipio = document.getElementById("municipio").value;
  const masdetalle = document.getElementById("descripcion").value.trim();
  const preciomin = document.getElementById("preciomin").value.trim();
  const preciomax = document.getElementById("preciomax").value.trim();
  const contenidoPrivado = document.getElementById("contenidoPrivado")?.value.trim() || "";

  if (!operacion || !inmueble || !municipio || !masdetalle || !preciomin || !preciomax) {
    alert("Completa todos los campos obligatorios.");
    return;
  }

  const telefono = localStorage.getItem("telefonoAsesor") || "5544704692";

  const payloadBolsa = {
    fuente: "2",
    pais: "52",
    telefono,
    requerimiento: "solicitud",
    operacion,
    inmueble,
    municipio,
    masdetalle,
    preciomin,
    preciomax,
    estado: "activa",
    fecha_alta: new Date().toISOString().split("T")[0],
    publicado_desde: new Date().toISOString().split("T")[0],
    veces_republicado: 0
  };

  try {
    // Paso 1: Insertar en bolsa
    const { data: bolsa, error: errorBolsa } = await supabase
      .from("bolsa")
      .insert([payloadBolsa])
      .select()
      .single();

    if (errorBolsa) throw new Error("Error al registrar solicitud: " + errorBolsa.message);

    // Paso 2: Insertar en datosprivados si hay contenido
    if (contenidoPrivado) {
      const payloadPrivado = {
        bolsa_id: bolsa.id,
        contenido: contenidoPrivado
      };

      const { error: errorPrivado } = await supabase
        .from("datosprivados")
        .insert([payloadPrivado]);

      if (errorPrivado) {
        // rollback: eliminar bolsa
        await supabase.from("bolsa").delete().eq("id", bolsa.id);
        throw new Error("Error al guardar información privada: " + errorPrivado.message);
      }
    }

    // Paso 3: Insertar en alarmas (contrapartida ofrecimiento)
    const payloadAlarma = {
      telefono,
      bolsa_id: bolsa.id,
      requerimiento: "ofrecimiento",
      operacion,
      inmueble,
      municipio,
      preciomin,
      preciomax,
      ultimo_bolsa_id: 0,
      fecha: new Date().toISOString().split("T")[0],
      visto: "no"
    };

    const { error: errorAlarma } = await supabase
      .from("alarmas")
      .insert([payloadAlarma])
      .select()
      .single();

    if (errorAlarma) {
      // rollback: eliminar bolsa y datosprivados
      await supabase.from("datosprivados").delete().eq("bolsa_id", bolsa.id);
      await supabase.from("bolsa").delete().eq("id", bolsa.id);
      throw new Error("Error al registrar alarma: " + errorAlarma.message);
    }

    alert("✅ Solicitud registrada con éxito, alarma generada y datos privados guardados");
    document.getElementById("form-solicitud").reset();

  } catch (err) {
    alert("❌ Alta cancelada: " + err.message);
    console.error(err);
  }
});

