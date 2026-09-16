import { supabase } from "./supabaseClient.js";

document.getElementById("form-update-password").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevaClave = document.getElementById("newPassword").value.trim();

  if (!nuevaClave) {
    alert("Ingrese una nueva contraseña.");
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: nuevaClave });
    if (error) {
      alert("❌ Error al actualizar contraseña: " + error.message);
      return;
    }
    alert("✅ Contraseña actualizada correctamente. Ahora puede iniciar sesión.");
    window.location.href = "login.html";
  } catch (err) {
    alert("❌ Error inesperado: " + err.message);
    console.error(err);
  }
});
