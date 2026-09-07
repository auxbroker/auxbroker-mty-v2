import { supabase } from "./supabaseClient.js";

document.getElementById("form-suscriptores").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const correo = document.getElementById("correo").value;
  const plan = document.getElementById("plan").value;
  const acepto = document.getElementById("acepto").checked;

  // Validación de términos
  if (!acepto) {
    alert("Debes aceptar los términos y condiciones antes de registrarte.");
    return;
  }

  const { data, error } = await supabase.from("miembros").insert([{
    nombre,
    telefono,
    correo,
    plan,
    estado: "inactivo",                     // Estado inicial
    cupos: 0,                               // Cupos iniciales
    aviso_aceptado: true,                   // Se guarda aceptación
    aviso_aceptado_en: new Date().toISOString(),
    created_at: new Date().toISOString()
  }]);

  if (error) {
    alert("Error al registrar: " + error.message);
    console.error(error);
  } else {
    alert("Suscriptor agregado correctamente en estado INACTIVO con aceptación de términos.");
    console.log(data);
  }
});

