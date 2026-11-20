(() => {
  const plans = {
    basic: {name:"Plan Básico",price:10,features:["Galería colaborativa","QR del evento","Hasta 500 fotos (demo)"]},
    premium: {name:"Plan Premium",price:20,features:["Fotos y videos","Muro en vivo (demo)","Reel automático simulado"]},
    elite: {name:"Plan Elite",price:30,features:["Contenido ilimitado (demo)","Reconocimiento facial simulado","Libro digital simulado"]}
  };
  const params = new URLSearchParams(location.search);
  const id = (params.get("plan") || "basic").toLowerCase();
  const plan = plans[id] || plans.basic;
  document.querySelector("#planInput").value = plans[id] ? id : "basic";
  document.querySelector("#planBadge").textContent = plan.name;
  document.querySelector("#planName").textContent = plan.name;
  document.querySelector("#planPrice").textContent = `$${plan.price.toFixed(2)}`;
  document.querySelector("#planFeatures").innerHTML = plan.features.map(x => `<li>${x}</li>`).join("");
  const form = document.querySelector("#checkoutForm");
  const btn = document.querySelector("#payBtn");
  const cfg = window.EVENTOLENS_PAYMENT_CONFIG || {};
  if (!cfg.appsScriptUrl || cfg.appsScriptUrl.includes("PEGAR_URL")) {
    btn.disabled = true;
    btn.textContent = "Falta configurar Apps Script";
    const note = document.createElement("div");
    note.className = "note";
    note.innerHTML = "Configura <code>assets/payment-config.js</code> con la URL <code>/exec</code> de Apps Script.";
    form.append(note);
    return;
  }
  form.action = cfg.appsScriptUrl;
  form.addEventListener("submit", () => {btn.disabled = true;btn.textContent = "Creando checkout…";});
})();
