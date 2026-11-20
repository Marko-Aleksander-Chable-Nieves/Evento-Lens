(() => {
  const BUTTON_TEXT = 'Pagar para reservar evento';

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function createReserveButton() {
    const a = document.createElement('a');
    a.href = 'reservar.html';
    a.textContent = BUTTON_TEXT;
    a.setAttribute('data-eventolens-direct-reserve', '1');
    a.setAttribute('aria-label', 'Pagar para reservar evento sin responder la encuesta');
    a.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'width:100%',
      'box-sizing:border-box',
      'margin-top:12px',
      'padding:16px 20px',
      'border-radius:14px',
      'text-decoration:none',
      'font-weight:800',
      'font-size:16px',
      'line-height:1.2',
      'color:#ffffff',
      'background:linear-gradient(90deg,#7c3aed,#db2777)',
      'border:1px solid rgba(255,255,255,.22)',
      'box-shadow:0 10px 30px rgba(124,58,237,.25)',
      'cursor:pointer'
    ].join(';');
    return a;
  }

  function createHelperText() {
    const p = document.createElement('div');
    p.setAttribute('data-eventolens-direct-reserve-note', '1');
    p.textContent = 'O reserva directamente sin responder la encuesta.';
    p.style.cssText = [
      'margin-top:8px',
      'text-align:center',
      'font-size:12px',
      'line-height:1.35',
      'color:rgba(255,255,255,.55)'
    ].join(';');
    return p;
  }

  function findSurveyButton(root = document) {
    const candidates = [...root.querySelectorAll('a,button')];
    const exact = candidates.find(el => {
      const t = normalize(el.textContent);
      return t.includes('responder y obtener mi 20%') ||
             t.includes('responder y obtener') ||
             t.includes('obtener mi 20%');
    });
    if (exact) return exact;

    // Fallback: locate the visible reservation modal and choose its main CTA.
    const all = [...root.querySelectorAll('div,section,article')];
    const modal = all.find(el => {
      const t = normalize(el.textContent);
      return t.includes('gracias por querer reservar eventolens') &&
             t.includes('20% de descuento');
    });
    if (!modal) return null;

    const buttons = [...modal.querySelectorAll('a,button')]
      .filter(el => normalize(el.textContent) && normalize(el.textContent) !== 'x');
    return buttons.find(el => normalize(el.textContent).includes('responder')) || buttons[0] || null;
  }

  function injectIntoModal() {
    // If the current modal already has the direct button, nothing to do.
    const surveyButton = findSurveyButton();
    if (!surveyButton) return false;

    const parent = surveyButton.parentElement || surveyButton.closest('div');
    if (!parent) return false;

    if (parent.querySelector('[data-eventolens-direct-reserve="1"]')) return true;

    const direct = createReserveButton();
    const note = createHelperText();
    surveyButton.insertAdjacentElement('afterend', direct);
    direct.insertAdjacentElement('afterend', note);
    return true;
  }

  function watch() {
    injectIntoModal();

    const observer = new MutationObserver(() => {
      injectIntoModal();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch, { once: true });
  } else {
    watch();
  }
})();
