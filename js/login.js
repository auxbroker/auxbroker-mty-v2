import { supabase } from "./supabaseClient.js";

console.log("✅ login.js cargado correctamente");

const form = document.getElementById("form-login");
if (!form) {
  console.error("❌ No se encontró el formulario con id=form-login");
} else {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // console.log("📩 Evento submit disparado");

    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value.trim();

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });

    if (error) {
      alert("❌ Credenciales inválidas");
      console.error("Detalles del error:", error);
      return;
    }

    // Validar que exista sesión activa
    if (!data.session) {
      alert("❌ No se encontró sesión activa");
      console.error("Detalles:", data);
      return;
    }

    // console.log("🔎 Usuario autenticado:", data.user);

    const correoAuth = data.user.email;

    // Guardar correo en localStorage para todo el flujo
    localStorage.setItem("correoUsuario", correoAuth);
    // console.log("✅ correoUsuario guardado en localStorage:", correoAuth);

    // Confirmar sesión antes de continuar
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      alert("❌ No se encontró sesión activa después del login");
      return;
    }

    // Buscar en tabla miembros
    const { data: miembro, error: errorMiembro } = await supabase
      .from("miembros")
      .select("telefono, nombre, plan, cupos, estado")
      .eq("correo", correoAuth)
      .single();

    if (errorMiembro) {
      console.error("❌ Error al buscar miembro:", errorMiembro);
      alert("Error al validar miembro");
      return;
    }

    if (!miembro) {
      console.warn("⚠️ No existe miembro con ese correo, redirigiendo a alta.");
      window.location.href = "alta-miembro.html";
    } else {
      if (miembro.estado === "inactivo") {
        alert("⚠️ Comuníquese con AUXBROKER, su usuario aún permanece inactivo.");
        return;
      }

      // Usuario existente → guardar datos básicos y pasar a funcionalidades
      localStorage.setItem("telefonoAsesor", miembro.telefono); // 👈 clave global
      localStorage.setItem("nombreAsesor", miembro.nombre);
      localStorage.setItem("planAsesor", miembro.plan);
      localStorage.setItem("cuposAsesor", miembro.cupos);

      // console.log("✅ Datos de miembro guardados en localStorage:", miembro);

      // Redirigir al dashboard solo si la sesión está confirmada
      window.location.href = "dashboard.html";
    }
  });
}

