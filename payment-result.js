(() => {
  const icon = document.querySelector("#statusIcon");
  const title = document.querySelector("#statusTitle");
  const text = document.querySelector("#statusText");
  const content = document.querySelector("#verifiedContent");

  const cfg = window.EVENTOLENS_PAYMENT_CONFIG || {};
  const qs = new URLSearchParams(location.search);

  const paymentId = qs.get("payment_id") || qs.get("collection_id");
  const orderId = qs.get("order_id") || qs.get("external_reference");

  function fail(message) {
    icon.className = "status-icon failure";
    icon.textContent = "×";
    title.textContent = "Pago no aprobado";
    text.textContent = message || "Mercado Pago rechazó o no pudo completar el pago.";
    content.innerHTML =
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn btn-primary" href="index.html#simulador">Intentar otra vez</a>' +
      '<a class="btn btn-secondary" href="index.html">Volver a EventoLens</a>' +
      '</div>';
  }

  function pending(message) {
    icon.className = "status-icon pending";
    icon.textContent = "⌛";
    title.textContent = "Pago pendiente";
    text.textContent = message || "El pago todavía no aparece como aprobado.";
    content.innerHTML =
      '<a class="btn btn-secondary" href="index.html">Volver a EventoLens</a>';
  }

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.eventolensPaymentVerified = (data) => {
    if (!data || !data.ok) {
      return fail(data?.message || "La verificación del pago falló.");
    }

    const status = String(data.status || "").toLowerCase();

    if (status === "pending" || status === "in_process" || status === "authorized") {
      return pending(
        "Mercado Pago reporta el estado: " +
        status +
        (data.statusDetail ? " (" + data.statusDetail + ")." : ".")
      );
    }

    if (status !== "approved") {
      return fail(
        "Mercado Pago reporta el estado: " +
        (status || "rechazado") +
        (data.statusDetail ? " (" + data.statusDetail + ")." : ".")
      );
    }

    icon.className = "status-icon";
    icon.textContent = "✓";
    title.textContent = "¡Anticipo confirmado!";
    text.textContent =
      "Tu QR de demostración está listo. El evento conserva el plan y los extras contratados.";

    const qr =
      "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=" +
      encodeURIComponent(data.qrTarget);

    content.innerHTML =
      `<div class="receipt">
        <div class="receipt-row"><span>Pedido</span><strong>${esc(data.orderId)}</strong></div>
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

  if (!cfg.appsScriptUrl || cfg.appsScriptUrl.includes("PEGAR_URL")) {
    return fail("Falta configurar la URL de Apps Script.");
  }

  if (!paymentId) {
    const status = (qs.get("status") || qs.get("result") || "").toLowerCase();

    if (status === "pending" || status === "in_process") {
      return pending("El pago quedó pendiente.");
    }

    return fail("No recibimos un identificador de pago.");
  }

  const url = new URL(cfg.appsScriptUrl);
  url.searchParams.set("action", "verifyPayment");
  url.searchParams.set("payment_id", paymentId);
  if (orderId) url.searchParams.set("order_id", orderId);
  url.searchParams.set("callback", "eventolensPaymentVerified");
  url.searchParams.set("_", Date.now());

  const s = document.createElement("script");
  s.src = url.toString();
  s.onerror = () => fail("No fue posible contactar el verificador de pagos.");
  document.body.appendChild(s);
})();
