// js/utils.js
export async function loadPartial(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const resp = await fetch(file);
    const html = await resp.text();
    el.innerHTML = html;
  } catch (err) {
    console.error(`❌ Error cargando partial ${file}:`, err);
  }
}
