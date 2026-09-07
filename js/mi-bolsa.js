import { supabase } from "./supabaseClient.js";
import { mostrarOpcionesContacto } from "./contact-utils.js";
console.log("✅ mi-bolsa.js cargado correctamente");
let conjuntoAlarmas=[];
async function cargarBolsa(){
  const telefono=localStorage.getItem("telefonoAsesor");
  if(!telefono){alert("No se encontró sesión activa.");window.location.href="login.html";return;}
  const {data:registros,error}=await supabase.from("bolsa").select("*").eq("telefono",telefono).in("estado",["activa","suspendida"]).eq("fuente","2");
  if(error){alert("Error al cargar registros");return;}
  const registrosFiltrados=registros.filter(r=>r.fuente&&r.fuente.trim()==="2");
  const contenedor=document.getElementById("miBolsaContainer");contenedor.innerHTML="";document.getElementById("filtroAlarmas").style.display="none";
  if(!registrosFiltrados||registrosFiltrados.length===0){contenedor.innerHTML="<p>No tienes requerimientos activos o suspendidos.</p>";return;}
  for(const req of registrosFiltrados){
    const {data:privado}=await supabase.from("datosprivados").select("contenido").eq("bolsa_id",req.id).single();
    const tarjeta=document.createElement("div");tarjeta.className="card";
    tarjeta.innerHTML=`<div class="card-header"><span><strong>${req.requerimiento.toUpperCase()}</strong></span> · <span>${req.operacion}</span> · <span>${req.inmueble}</span> · <span>${req.municipio}</span> · <span><strong>Estado:</strong> ${req.estado.toUpperCase()}</span></div>
    <div class="card-body"><p><strong>Precio:</strong> ${req.requerimiento==="ofrecimiento"?req.preciomin:`${req.preciomin} - ${req.preciomax}`}</p><p><strong>Detalle:</strong> ${req.masdetalle||""}</p>
    <div class="contenido-linea"><button class="btn-guardar" data-bolsa-id="${req.id}">Guardar</button><textarea class="contenidoPrivado" data-bolsa-id="${req.id}" rows="2">${privado?.contenido||""}</textarea></div>
    <div class="actions"><button class="btn-estado">${req.estado==="activa"?"Suspender":"Activar"}</button><button class="btn-eliminar">Eliminar</button><div class="btn-group"><button class="btn-inicio">Buscar Opciones ya vistas</button><button class="btn-continuar">Buscar opciones nuevas(no vistas)</button></div></div></div>`;
    tarjeta.querySelector(".btn-guardar").onclick=async(e)=>{const bolsaId=e.target.dataset.bolsaId;const nuevoContenido=tarjeta.querySelector(`textarea[data-bolsa-id="${bolsaId}"]`).value.trim();await supabase.from("datosprivados").update({contenido:nuevoContenido}).eq("bolsa_id",bolsaId);};
    tarjeta.querySelector(".btn-estado").onclick=async()=>{const nuevoEstado=req.estado==="activa"?"suspendida":"activa";await supabase.from("bolsa").update({estado:nuevoEstado}).eq("id",req.id);cargarBolsa();};
    tarjeta.querySelector(".btn-eliminar").onclick=async()=>{await supabase.from("bolsa").update({estado:"inactiva"}).eq("id",req.id);cargarBolsa();};
    tarjeta.querySelector(".btn-inicio").onclick=async()=>{await buscarAlarmas(req,telefono,true);};
    tarjeta.querySelector(".btn-continuar").onclick=async()=>{await buscarAlarmas(req,telefono,false);};
    contenedor.appendChild(tarjeta);
  }
}
async function buscarAlarmas(registro,telefono,desdeInicio){
  const tipoContrario=registro.requerimiento==="ofrecimiento"?"solicitud":"ofrecimiento";
  let ultimoId=0;
  if(!desdeInicio){let {data:alarma}=await supabase.from("alarmas").select("ultimo_bolsa_id").eq("bolsa_id",registro.id).single();ultimoId=alarma?.ultimo_bolsa_id||0;}
  const {data:candidatos,error}=await supabase.from("bolsa").select("*").eq("operacion",registro.operacion).eq("inmueble",registro.inmueble).eq("municipio",registro.municipio).eq("requerimiento",tipoContrario).neq("telefono",telefono).gt("id",ultimoId).order("id",{ascending:true});
  if(error){alert("Error al buscar alarmas");return;}
  if(registro.requerimiento==="ofrecimiento"){
    const base=parseInt(registro.preciomin,10);const rangoMin=base-(base*0.1);const rangoMax=base+(base*0.1);
    conjuntoAlarmas=candidatos.filter(c=>{const cmin=parseInt(c.preciomin,10);const cmax=parseInt(c.preciomax,10);return((cmin>=rangoMin&&cmax<=rangoMax)||(c.preciomin==="1111"));});
  }else{
    const min=parseInt(registro.preciomin,10);const max=parseInt(registro.preciomax,10);
    conjuntoAlarmas=candidatos.filter(c=>{const precio=parseInt(c.preciomin,10);return(precio>=min&&precio<=max);});
  }
  renderizarAlarmas(registro);
}
function renderizarAlarmas(registro,lista=conjuntoAlarmas){
  const contenedor=document.getElementById("miBolsaContainer");contenedor.innerHTML="<h2>Posibles alianzas</h2>";document.getElementById("filtroAlarmas").style.display="flex";
  if(!lista||lista.length===0){contenedor.innerHTML+="<p>No se encontraron coincidencias.</p>";return;}
  lista.forEach(item=>{
    const tarjeta=document.createElement("div");tarjeta.className="card";
    tarjeta.innerHTML=`<div class="card-header"><span><strong>${item.requerimiento.toUpperCase()}</strong></span> · <span>${item.operacion}</span> · <span>${item.inmueble}</span> · <span>${item.municipio}</span> · <span><strong>Estado:</strong> ${item.estado.toUpperCase()}</span></div>
    <div class="card-body"><p><strong>Precio:</strong> ${item.requerimiento==="ofrecimiento"?item.preciomin:`${item.preciomin} - ${item.preciomax}`}</p><p><strong>Detalle:</strong> ${item.masdetalle||""}</p></div>`;
    const btnContactar=document.createElement("button");btnContactar.className="btn-contactar";btnContactar.textContent="Contactar";btnContactar.onclick=()=>{mostrarOpcionesContacto(tarjeta,item.telefono,item.pais,item.masdetalle);};
    const btnRegresar=document.createElement("button");btnRegresar.className="btn-regresar";btnRegresar.textContent="Regresar";btnRegresar.onclick=()=>{cargarBolsa();};
    tarjeta.appendChild(btnContactar);tarjeta.appendChild(btnRegresar);contenedor.appendChild(tarjeta);
  });
  const ultimoId=Math.max(...lista.map(i=>i.id));
  const acciones=document.createElement("div");acciones.className="actions";acciones.innerHTML=`<button id="btnSigoLeyendo">Sigo Buscando desde aquí</button>`;contenedor.appendChild(acciones);
  document.getElementById("btnSigoLeyendo").onclick=async()=>{await supabase.from("alarmas").update({ultimo_bolsa_id:ultimoId}).eq("bolsa_id",registro.id);};
  const btnFiltrar=document.getElementById("btnFiltrar");const btnReset=document.getElementById("btnReset");const btnVolver=document.getElementById("btnVolver");
  if(btnFiltrar&&btnReset&&btnVolver){btnFiltrar.onclick=filtrarAlarmas;btnReset.onclick=resetAlarmas;btnVolver.onclick=()=>{document.getElementById("filtroAlarmas").style.display="none";cargarBolsa();};}
}
function filtrarAlarmas(){const claveInput=document.getElementById("palabraClave");if(!claveInput)return;const clave=claveInput.value.trim().toLowerCase();if(!clave){renderizarAlarmas(null,conjuntoAlarmas);return;}const filtrados=conjuntoAlarmas.filter(item=>item.masdetalle&&item.masdetalle.toLowerCase().includes(clave));renderizarAlarmas(null,filtrados);}
function resetAlarmas(){const claveInput=document.getElementById("palabraClave");if(claveInput)claveInput.value="";renderizarAlarmas(null,conjuntoAlarmas);}
cargarBolsa();
