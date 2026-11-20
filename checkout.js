(() => {
  const params = new URLSearchParams(location.search);
  const planId = (params.get("plan") || "premium").toLowerCase();
  const extras = (params.get("extras") || "").split(",").map(x => x.trim()).filter(Boolean);
  const coupon = (params.get("coupon") || "").trim().toUpperCase();
  const eventType = params.get("eventType") || "";
  const guests = params.get("guests") || "";

  const cfg = window.EVENTOLENS_PAYMENT_CONFIG || {};
  const reservationForm = document.querySelector("#reservationForm");
  const brickStatus = document.querySelector("#brickStatus");

  document.querySelector("#planInput").value = planId;
  document.querySelector("#extrasInput").value = extras.join(",");
  document.querySelector("#couponInputCheckout").value = coupon;
  document.querySelector("#eventTypeInput").value = eventType;
  document.querySelector("#guestsInput").value = guests;

  const attemptId = "pay_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  let submitting = false;
  let brickController = null;

  function moneyUSD(v) {
    return "$" + Number(v || 0).toFixed(2) + " USD";
  }

  function moneyMXN(v) {
    return "$" + Number(v || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " MXN";
  }

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setStatus(message, type = "") {
    brickStatus.textContent = message;
    brickStatus.classList.remove("ok-note", "error-note");
    if (type === "ok") brickStatus.classList.add("ok-note");
    if (type === "error") brickStatus.classList.add("error-note");
  }

  function fail(message) {
    setStatus(message, "error");
    const wrap = document.querySelector(".brick-wrap");
    if (wrap) wrap.style.display = "none";
  }

  function postPaymentToBackend(formData, additionalData) {
    if (submitting) return;
    submitting = true;

    const post = document.createElement("form");
    post.method = "POST";
    post.action = cfg.appsScriptUrl;
    post.style.display = "none";

    const payload = {
      action: "processOrder",
      attemptId,
      plan: planId,
      extras: extras.join(","),
      coupon,
      eventType,
      guests,
      customerName: document.querySelector("#customerName").value.trim(),
      eventName: document.querySelector("#eventName").value.trim(),
      eventDate: document.querySelector("#eventDate").value || "",
      token: formData.token || "",
      paymentMethodId: formData.payment_method_id || "",
      paymentTypeId: additionalData?.paymentTypeId || "",
      issuerId: formData.issuer_id || "",
      installments: formData.installments || 1,
      payerEmail: formData.payer?.email || "",
      identificationType: formData.payer?.identification?.type || "",
      identificationNumber: formData.payer?.identification?.number || ""
    };

    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value ?? "");
      post.appendChild(input);
    });

    document.body.appendChild(post);
    setStatus("Procesando pago con Mercado Pago…");
    post.submit();
  }

  async function renderBrick(data) {
    if (!data.publicKey) {
      return fail("Falta MP_PUBLIC_KEY en las propiedades de Apps Script.");
    }

    if (typeof MercadoPago === "undefined") {
      return fail("No se pudo cargar el SDK de Mercado Pago.");
    }

    const mp = new MercadoPago(data.publicKey, { locale: "es-MX" });
    const bricksBuilder = mp.bricks();

    const settings = {
      initialization: {
        amount: Number(data.depositMxn)
      },
      customization: {
        paymentMethods: {
          minInstallments: 1,
          maxInstallments: 12
        }
      },
      callbacks: {
        onReady: () => {
          setStatus("Formulario seguro listo. Puedes realizar la prueba.", "ok");
        },

        onSubmit: (formData, additionalData) => {
          return new Promise((resolve, reject) => {
            if (submitting) {
              resolve();
              return;
            }

            if (!reservationForm.reportValidity()) {
              setStatus("Completa primero los datos de la reserva y acepta los términos.", "error");
              reject();
              return;
            }

            if (!formData?.token || !formData?.payment_method_id || !additionalData?.paymentTypeId || !formData?.payer?.email) {
              setStatus("Mercado Pago no entregó todos los datos necesarios del pago.", "error");
              reject();
              return;
            }

            postPaymentToBackend(formData, additionalData);
            resolve();
          });
        },

        onError: (error) => {
          console.error("Mercado Pago Brick:", error);
          setStatus("Mercado Pago reportó un error en el formulario. Revisa los datos e inténtalo otra vez.", "error");
        }
      }
    };

    try {
      brickController = await bricksBuilder.create(
        "cardPayment",
        "cardPaymentBrick_container",
        settings
      );
    } catch (error) {
      console.error(error);
      fail("No fue posible iniciar el formulario de tarjeta de Mercado Pago.");
    }
  }

  window.eventolensQuoteReady = async (data) => {
    if (!data || !data.ok) {
      return fail(data?.message || data?.error || "No pudimos calcular la reserva.");
    }

    document.querySelector("#planBadge").textContent = data.planName;
    document.querySelector("#planName").textContent = "Plan " + data.planName;
    document.querySelector("#serviceTotal").textContent = "$" + Number(data.totalUsd).toFixed(2);

    document.querySelector("#planFeatures").innerHTML =
      (data.planFeatures || []).map(x => `<li>${esc(x)}</li>`).join("");

    const extraBox = document.querySelector("#selectedExtras");

    if (data.extras?.length) {
      extraBox.innerHTML =
        "<strong>Extras contratados:</strong><br>" +
        data.extras
          .map(x => `• ${esc(x.name)} (+$${Number(x.priceUsd).toFixed(2)} USD)`)
          .join("<br>");
    } else {
      extraBox.innerHTML = "<strong>Extras contratados:</strong> Ninguno";
    }

    if (data.coupon) {
      extraBox.innerHTML +=
        `<br><strong>Cupón:</strong> ${esc(data.coupon)} (-${Number(data.discountPercent)}%)`;
    }

    document.querySelector("#quoteTotalUsd").textContent = moneyUSD(data.totalUsd);
    document.querySelector("#depositUsd").textContent = moneyUSD(data.depositUsd);
    document.querySelector("#fxRate").textContent =
      "$" + Number(data.fxRate).toFixed(4) + " MXN por USD";
    document.querySelector("#depositMxn").textContent = moneyMXN(data.depositMxn);
    document.querySelector("#balanceUsd").textContent = moneyUSD(data.balanceUsd);

    await renderBrick(data);
  };

  if (!cfg.appsScriptUrl || cfg.appsScriptUrl.includes("PEGAR_URL")) {
    return fail("Falta configurar Apps Script.");
  }

  const url = new URL(cfg.appsScriptUrl);
  url.searchParams.set("action", "quoteCheckout");
  url.searchParams.set("plan", planId);
  url.searchParams.set("extras", extras.join(","));
  if (coupon) url.searchParams.set("coupon", coupon);
  url.searchParams.set("callback", "eventolensQuoteReady");
  url.searchParams.set("_", Date.now());

  const s = document.createElement("script");
  s.src = url.toString();
  s.onerror = () => fail("No fue posible consultar el cálculo del anticipo.");
  document.body.appendChild(s);

  window.addEventListener("beforeunload", () => {
    try {
      brickController?.unmount?.();
    } catch (_) {}
  });
})();
