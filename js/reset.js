import { supabase } from "./supabaseClient.js";

document.getElementById("form-reset").addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = document.getElementById("correo").value.trim();
  if (!correo) {
    alert("Ingrese un correo válido.");
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: "login.html"
    });

    if (error) {
      alert("❌ Error al enviar enlace: " + error.message);
      return;
    }

    alert("✅ Se ha enviado un enlace de recuperación a su correo. Revise su bandeja de entrada.");
    document.getElementById("form-reset").reset();
  } catch (err) {
    alert("❌ Error inesperado: " + err.message);
    console.error(err);
  }
});
