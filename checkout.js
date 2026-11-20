(() => {
  const params = new URLSearchParams(location.search);
  const planId = (params.get("plan") || "premium").toLowerCase();
  const extras = (params.get("extras") || "").split(",").map(x=>x.trim()).filter(Boolean);
  const coupon = (params.get("coupon") || "").trim().toUpperCase();
  const eventType = params.get("eventType") || "";
  const guests = params.get("guests") || "";

  const form = document.querySelector("#checkoutForm");
  const btn = document.querySelector("#payBtn");
  const cfg = window.EVENTOLENS_PAYMENT_CONFIG || {};

  document.querySelector("#planInput").value = planId;
  document.querySelector("#extrasInput").value = extras.join(",");
  document.querySelector("#couponInputCheckout").value = coupon;
  document.querySelector("#eventTypeInput").value = eventType;
  document.querySelector("#guestsInput").value = guests;

  function moneyUSD(v){return "$"+Number(v||0).toFixed(2)+" USD"}
  function moneyMXN(v){return "$"+Number(v||0).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2})+" MXN"}
  function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

  function fail(message){
    btn.disabled=true;
    btn.textContent="No se puede iniciar el pago";
    const note=document.createElement("div");
    note.className="note";
    note.textContent=message;
    form.append(note);
  }

  window.eventolensQuoteReady = (data) => {
    if(!data || !data.ok) return fail(data?.message || data?.error || "No pudimos calcular la reserva.");

    document.querySelector("#planBadge").textContent = data.planName;
    document.querySelector("#planName").textContent = "Plan "+data.planName;
    document.querySelector("#serviceTotal").textContent = "$"+Number(data.totalUsd).toFixed(2);

    const features = (data.planFeatures || []).map(x=>`<li>${esc(x)}</li>`).join("");
    document.querySelector("#planFeatures").innerHTML = features;

    const extraBox=document.querySelector("#selectedExtras");
    if(data.extras?.length){
      extraBox.innerHTML="<strong>Extras contratados:</strong><br>"+data.extras.map(x=>`• ${esc(x.name)} (+$${Number(x.priceUsd).toFixed(2)} USD)`).join("<br>");
    }else{
      extraBox.innerHTML="<strong>Extras contratados:</strong> Ninguno";
    }
    if(data.coupon){
      extraBox.innerHTML += `<br><strong>Cupón:</strong> ${esc(data.coupon)} (-${Number(data.discountPercent)}%)`;
    }

    document.querySelector("#quoteTotalUsd").textContent = moneyUSD(data.totalUsd);
    document.querySelector("#depositUsd").textContent = moneyUSD(data.depositUsd);
    document.querySelector("#fxRate").textContent = "$"+Number(data.fxRate).toFixed(4)+" MXN por USD";
    document.querySelector("#depositMxn").textContent = moneyMXN(data.depositMxn);
    document.querySelector("#balanceUsd").textContent = moneyUSD(data.balanceUsd);

    form.action = cfg.appsScriptUrl;
    btn.disabled=false;
    btn.textContent="Pagar anticipo de "+moneyMXN(data.depositMxn)+" con Mercado Pago";
  };

  if (!cfg.appsScriptUrl || cfg.appsScriptUrl.includes("PEGAR_URL")) {
    return fail("Falta configurar Apps Script.");
  }

  btn.disabled=true;
  btn.textContent="Calculando anticipo…";

  const url=new URL(cfg.appsScriptUrl);
  url.searchParams.set("action","quoteCheckout");
  url.searchParams.set("plan",planId);
  url.searchParams.set("extras",extras.join(","));
  if(coupon) url.searchParams.set("coupon",coupon);
  url.searchParams.set("callback","eventolensQuoteReady");
  url.searchParams.set("_",Date.now());

  const s=document.createElement("script");
  s.src=url.toString();
  s.onerror=()=>fail("No fue posible consultar el cálculo del anticipo.");
  document.body.appendChild(s);

  form.addEventListener("submit",()=>{
    btn.disabled=true;
    btn.textContent="Creando checkout…";
  });
})();
