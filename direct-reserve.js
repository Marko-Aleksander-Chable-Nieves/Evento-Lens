(() => {
  const BUTTON_TEXT = 'Pagar para reservar evento';
  const TARGET_TEXT = 'Quiero contratar Eventolens';
  let inserted = false;

  function normalize(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function makeButton() {
    const a = document.createElement('a');
    a.href = 'reservar.html';
    a.textContent = BUTTON_TEXT;
    a.setAttribute('data-eventolens-direct-reserve', '1');
    a.style.cssText = [
      'display:flex','align-items:center','justify-content:center','width:100%',
      'margin-top:12px','padding:16px 20px','border-radius:14px',
      'text-decoration:none','font-weight:800','font-size:16px',
      'color:#090b16','background:linear-gradient(90deg,#ffffff,#e9efff)',
      'border:1px solid rgba(255,255,255,.8)','box-shadow:0 10px 30px rgba(0,0,0,.18)'
    ].join(';');
    return a;
  }

  function tryInsert() {
    if (inserted || document.querySelector('[data-eventolens-direct-reserve="1"]')) return true;
    const candidates = [...document.querySelectorAll('a,button')];
    const target = candidates.find(el => normalize(el.textContent).includes(normalize(TARGET_TEXT)));
    if (!target) return false;
    const btn = makeButton();
    target.insertAdjacentElement('afterend', btn);
    inserted = true;
    return true;
  }

  if (!tryInsert()) {
    const obs = new MutationObserver(() => {
      if (tryInsert()) obs.disconnect();
    });
    obs.observe(document.documentElement, {childList:true, subtree:true});
    setTimeout(() => obs.disconnect(), 10000);
  }
})();
