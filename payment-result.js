(() => {
  const icon=document.querySelector("#statusIcon");
  const title=document.querySelector("#statusTitle");
  const text=document.querySelector("#statusText");
  const content=document.querySelector("#verifiedContent");
  const cfg=window.EVENTOLENS_PAYMENT_CONFIG||{};
  const qs=new URLSearchParams(location.search);
  const mpOrderId=qs.get("mp_order_id");
  const orderId=qs.get("order_id");

  function fail(message){
    icon.className="status-icon failure";
    icon.textContent="×";
    title.textContent="Pago no aprobado";
    text.textContent=message||"Mercado Pago rechazó o no pudo completar el pago.";
    content.innerHTML='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="index.html#simulador">Intentar otra vez</a><a class="btn btn-secondary" href="index.html">Volver a EventoLens</a></div>';
  }

  function pending(message){
    icon.className="status-icon pending";
    icon.textContent="⌛";
    title.textContent="Pago pendiente";
    text.textContent=message||"El pago todavía está siendo procesado.";
    content.innerHTML='<a class="btn btn-secondary" href="index.html">Volver a EventoLens</a>';
  }

  function esc(v){
    return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  window.eventolensOrderVerified=(data)=>{
    if(!data||!data.ok) return fail(data?.message||"La verificación de la order falló.");

    const status=String(data.status||"").toLowerCase();

    if(status==="pending"){
      return pending(
        "Mercado Pago reporta la order como pendiente"+
        (data.statusDetail?" ("+data.statusDetail+").":".")
      );
    }

    if(status!=="approved"){
      return fail(
        "Mercado Pago reporta: "+
        (data.statusDetail||status||"pago rechazado")+
        "."
      );
    }

    icon.className="status-icon";
    icon.textContent="✓";
    title.textContent="¡Anticipo confirmado!";
    text.textContent="Tu QR de demostración está listo. El evento conserva el plan y los extras contratados.";

    const qr="https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data="+encodeURIComponent(data.qrTarget);

    content.innerHTML=`
      <div class="receipt">
        <div class="receipt-row"><span>Pedido</span><strong>${esc(data.orderId)}</strong></div>
        <div class="receipt-row"><span>Order Mercado Pago</span><strong>${esc(data.mpOrderId)}</strong></div>
        <div class="receipt-row"><span>Plan</span><strong>${esc(data.planName)}</strong></div>
        <div class="receipt-row"><span>Anticipo pagado</span><strong>$${Number(data.amount).toFixed(2)} MXN</strong></div>
        <div class="receipt-row"><span>Evento</span><strong>${esc(data.eventId)}</strong></div>
      </div>
      <img class="qr" src="${qr}" alt="QR de EventoLens">
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="${data.qrTarget}">Abrir evento demo</a>
        <a class="btn btn-secondary" href="${qr}" target="_blank">Ver QR</a>
      </div>`;
  };

  if(!cfg.appsScriptUrl||cfg.appsScriptUrl.includes("PEGAR_URL")) return fail("Falta configurar la URL de Apps Script.");
  if(!mpOrderId) return fail("No recibimos el identificador de la order de Mercado Pago.");

  const url=new URL(cfg.appsScriptUrl);
  url.searchParams.set("action","verifyOrder");
  url.searchParams.set("mp_order_id",mpOrderId);
  if(orderId) url.searchParams.set("order_id",orderId);
  url.searchParams.set("callback","eventolensOrderVerified");
  url.searchParams.set("_",Date.now());

  const s=document.createElement("script");
  s.src=url.toString();
  s.onerror=()=>fail("No fue posible contactar el verificador de la order.");
  document.body.appendChild(s);
})();
