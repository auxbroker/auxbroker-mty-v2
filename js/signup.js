import { supabase } from "./supabaseClient.js";

const aceptaTerminos = document.getElementById("aceptaTerminos");
const btnSignup = document.getElementById("btnSignup");
const termsContainer = document.getElementById("termsContainer");

// Alternar visibilidad de la contraseña
document.getElementById("showPassword").addEventListener("change", (e) => {
  const passwordInput = document.getElementById("password");
  passwordInput.type = e.target.checked ? "text" : "password";
});

// 👇 Cargar dinámicamente SOLO el contenido del <body> de terminos.html
async function loadTerms() {
  try {
    const resp = await fetch("terminos.html");
    const html = await resp.text();

    // Crear un DOM temporal para extraer solo el body
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const bodyContent = doc.body.innerHTML;

    termsContainer.innerHTML = bodyContent;
  } catch (err) {
    termsContainer.innerHTML = "<p>Error al cargar términos.</p>";
    console.error(err);
  }
}
loadTerms();

// Detectar scroll dentro del contenedor
termsContainer.addEventListener("scroll", () => {
  const atBottom =
    termsContainer.scrollTop + termsContainer.clientHeight >=
    termsContainer.scrollHeight - 5; // margen de tolerancia
  if (atBottom) {
    aceptaTerminos.disabled = false;
  }
});

// Habilitar botón solo si se marca la casilla
aceptaTerminos.addEventListener("change", (e) => {
  btnSignup.disabled = !e.target.checked;
});

document.getElementById("form-signup").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!nombre || !telefono || !correo || !password) {
    alert("Completa todos los campos.");
    return;
  }

  try {
    const { error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: { nombre, telefono }
      }
    });

    if (error) {
      alert("❌ Error al registrar: " + error.message);
      return;
    }

    alert("✅ Usuario creado. Revisa tu correo y confirma tu cuenta antes de iniciar sesión.");

    localStorage.setItem("correoAsesor", correo);
    localStorage.setItem("nombreAsesor", nombre);
    localStorage.setItem("telefonoAsesor", telefono);

    window.location.href = "suscriptores.html";
  } catch (err) {
    alert("❌ Error inesperado: " + err.message);
    console.error(err);
  }
});

