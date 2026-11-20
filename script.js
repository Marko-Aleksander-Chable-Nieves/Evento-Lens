(() => {
  const plans = {
    basic:{label:'Básico',price:100,reserve:'basic',features:'Hasta 500 fotos · QR único · Galería del evento'},
    premium:{label:'Premium',price:250,reserve:'premium',features:'Fotos ilimitadas · Videos · 1 Reel automático con IA · Muro en vivo · QR + galería'},
    elite:{label:'Elite',price:350,reserve:'elite',features:'Fotos y videos ilimitados · Reel automático · Muro en vivo · Reconocimiento facial · Libro digital'}
  };
  let selectedPlan='premium', discount=0;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const eventType=$('#eventType'), guests=$('#guests'), guestsLabel=$('#guestsLabel');
  const estimateBadge=$('#estimateBadge'), estimateTitle=$('#estimateTitle'), estimateLines=$('#estimateLines'), estimateTotal=$('#estimateTotal'), estimateIncludes=$('#estimateIncludes');
  const directPay=$('#directPay'), modalDirectPay=$('#modalDirectPay');
  const planSurvey = $('#surveyForm select[name="plan"]');

  function extras(){return $$('[data-extra]:checked').map(x=>({name:x.dataset.extraName,price:Number(x.dataset.extra)}));}
  function reserveHref(){return `reservar.html?plan=${plans[selectedPlan].reserve}`;}
  function refresh(){
    const p=plans[selectedPlan], ex=extras(), subtotal=p.price+ex.reduce((a,b)=>a+b.price,0), total=Math.round(subtotal*(1-discount));
    guestsLabel.textContent=`${guests.value} personas`;
    estimateBadge.textContent=p.label.toUpperCase();
    estimateTitle.textContent=`${eventType.value} · ${guests.value} invitados`;
    estimateLines.innerHTML=`<div class="estimate-line"><span>Plan ${p.label}</span><strong>$${p.price}</strong></div>`+ex.map(e=>`<div class="estimate-line"><span>${e.name}</span><strong>+$${e.price}</strong></div>`).join('');
    estimateTotal.textContent=`$${total}`;
    estimateIncludes.textContent=`Incluye: ${p.features}`;
    directPay.href=reserveHref(); modalDirectPay.href=reserveHref();
    if(planSurvey) planSurvey.value=p.label;
    $$('[data-sim-plan]').forEach(b=>b.classList.toggle('active',b.dataset.simPlan===selectedPlan));
  }
  guests?.addEventListener('input',refresh); eventType?.addEventListener('change',refresh); $$('[data-extra]').forEach(x=>x.addEventListener('change',refresh));
  $$('[data-sim-plan]').forEach(b=>b.addEventListener('click',()=>{selectedPlan=b.dataset.simPlan;refresh()}));
  $$('[data-plan]').forEach(b=>b.addEventListener('click',()=>{selectedPlan=b.dataset.plan;document.querySelector('#simulador')?.scrollIntoView({behavior:'smooth'});refresh()}));
  $('#recommendPlan')?.addEventListener('click',()=>{const n=Number(guests.value);selectedPlan=n<=80?'basic':n<=250?'premium':'elite';refresh()});
  $('#applyCoupon')?.addEventListener('click',()=>{const c=$('#coupon').value.trim().toUpperCase();const msg=$('#couponMsg');if(c==='LENS5'){discount=.05;msg.textContent='Cupón LENS5 aplicado: 5% de descuento.'}else if(c==='LANZA20'){discount=.20;msg.textContent='Cupón LANZA20 aplicado: 20% de descuento.'}else{discount=0;msg.textContent='Cupón no válido.'}refresh()});
  $('#copyEstimate')?.addEventListener('click',async()=>{const ex=extras();const text=`EventoLens · ${eventType.value} · ${guests.value} invitados · Plan ${plans[selectedPlan].label} · Total estimado ${estimateTotal.textContent} USD${ex.length?' · Extras: '+ex.map(e=>e.name).join(', '):''}`;try{await navigator.clipboard.writeText(text);$('#copyEstimate').textContent='¡Cotización copiada!';setTimeout(()=>$('#copyEstimate').textContent='Copiar cotización',1600)}catch{alert(text)}});

  const modal=$('#interestModal');
  function openModal(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('body-modal-open');refresh()}
  function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('body-modal-open')}
  $('#openInterest')?.addEventListener('click',openModal); $$('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal)); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  $('#showSurvey')?.addEventListener('click',()=>{const f=$('#surveyForm');f.hidden=false;$('#showSurvey').hidden=true;f.scrollIntoView({behavior:'smooth',block:'start'})});

  $('#surveyForm')?.addEventListener('submit',async e=>{
    e.preventDefault(); const status=$('#surveyStatus'); const fd=new FormData(e.currentTarget); fd.set('invitados',guests.value); fd.set('tipo_evento',eventType.value); fd.set('plan',plans[selectedPlan].label); fd.set('precio_estimado',plans[selectedPlan].price); fd.set('fecha_hora',new Date().toLocaleString('es-MX'));
    status.textContent='Guardando respuesta…';
    const cfg=window.EVENTOLENS_EXPERIMENT_CONFIG||{}; const endpoint=cfg.endpoint||cfg.appsScriptUrl||'';
    if(endpoint){
      try{await fetch(endpoint,{method:'POST',mode:'no-cors',body:new URLSearchParams([...fd.entries()])});status.textContent='¡Gracias! Tu respuesta fue registrada.';e.currentTarget.reset()}catch{status.textContent='No pudimos enviar la respuesta. Intenta nuevamente.'}
    } else {status.textContent='¡Gracias! Encuesta completada en modo demostración.';}
  });
  refresh();
})();
