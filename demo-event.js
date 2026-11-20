(() => {
  const qs=new URLSearchParams(location.search);
  const eventId=qs.get("event")||"";
  const cfg=window.EVENTOLENS_PAYMENT_CONFIG||{};
  const code=document.querySelector("#eventCode");
  const pill=document.querySelector("#planPill");
  const grid=document.querySelector("#featureGrid");
  const upload=document.querySelector(".upload-box");

  function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

  function fail(message){
    code.textContent="Evento no disponible";
    pill.textContent="Sin acceso";
    grid.innerHTML=`<div class="feature-box"><strong>${esc(message)}</strong></div>`;
    if(upload) upload.style.display="none";
  }

  window.eventolensEventReady=(data)=>{
    if(!data?.ok) return fail(data?.message||"No pudimos validar este evento.");
    code.textContent=data.eventId;
    pill.textContent="Plan "+data.planName;

    const features=[...(data.planFeatures||[])];
    (data.extras||[]).forEach(x=>features.push(x.name));

    grid.innerHTML=features.map(label=>`<div class="feature-box"><div style="font-size:26px">✓</div><strong>${esc(label)}</strong></div>`).join("");
  };

  if(!eventId) return fail("Falta el identificador del evento.");
  if(!cfg.appsScriptUrl) return fail("No hay conexión con EventoLens.");

  const url=new URL(cfg.appsScriptUrl);
  url.searchParams.set("action","getEvent");
  url.searchParams.set("event_id",eventId);
  url.searchParams.set("callback","eventolensEventReady");
  url.searchParams.set("_",Date.now());

  const s=document.createElement("script");
  s.src=url.toString();
  s.onerror=()=>fail("No fue posible validar el evento.");
  document.body.appendChild(s);

  const input=document.querySelector("#photoInput"),gallery=document.querySelector("#gallery");
  input?.addEventListener("change",()=>{[...input.files].slice(0,8).forEach(file=>{if(!file.type.startsWith("image/"))return;const reader=new FileReader();reader.onload=()=>{const d=document.createElement("div");d.className="gallery-card";d.innerHTML='<img alt="Foto de demostración">';d.querySelector("img").src=reader.result;gallery.prepend(d)};reader.readAsDataURL(file)})});
})();
