const plans = {
  basic:{name:'Básico',price:100,features:['Hasta 500 fotos','QR único','Galería del evento']},
  premium:{name:'Premium',price:250,features:['Fotos ilimitadas','Videos','1 Reel automático con IA','Muro en vivo','QR + galería']},
  elite:{name:'Elite',price:350,features:['Fotos ilimitadas','Videos','Reel automático con IA','Muro en video','Reconocimiento facial','Libro digital automático','QR + galería']}
};
const coupons={LENS5:5,LENS10:10,LENS15:15,LANZA20:20};
let selectedPlan='premium';
let appliedCoupon=null;

const guests=document.getElementById('guests');
const guestValue=document.getElementById('guestValue');
const eventType=document.getElementById('eventType');
const extras=[...document.querySelectorAll('.extra input')];
const planButtons=[...document.querySelectorAll('.plan-option')];
const couponInput=document.getElementById('couponInput');
const applyCouponBtn=document.getElementById('applyCoupon');
const couponStatus=document.getElementById('couponStatus');
const discountLine=document.getElementById('discountLine');
const discountCode=document.getElementById('discountCode');
const discountAmount=document.getElementById('discountAmount');

function formatUSD(value){return `$${Math.round(value).toLocaleString('en-US')}`}
function getActiveExtras(){return extras.filter(x=>x.checked)}
function getSubtotal(){const plan=plans[selectedPlan];return plan.price+getActiveExtras().reduce((sum,item)=>sum+Number(item.dataset.price),0)}
function getDiscount(){if(!appliedCoupon)return 0;return getSubtotal()*(coupons[appliedCoupon]/100)}
function getFinalTotal(){return Math.max(0,getSubtotal()-getDiscount())}

function setPlan(key,scroll=false){selectedPlan=key;planButtons.forEach(btn=>btn.classList.toggle('active',btn.dataset.plan===key));document.getElementById('recommendation').classList.remove('show');updateQuote();if(scroll)document.getElementById('simulador').scrollIntoView({behavior:'smooth'})}

function updateQuote(){
  guestValue.textContent=Number(guests.value).toLocaleString('es-MX');
  const plan=plans[selectedPlan];
  const activeExtras=getActiveExtras();
  document.getElementById('quoteEvent').textContent=`${eventType.value} · ${Number(guests.value).toLocaleString('es-MX')} invitados`;
  document.getElementById('quotePlan').textContent=plan.name;
  document.getElementById('quotePlanBadge').textContent=plan.name.toUpperCase();
  document.getElementById('basePrice').textContent=formatUSD(plan.price);
  document.getElementById('includedFeatures').innerHTML=`<span><b>Incluye:</b> ${plan.features.join(' · ')}</span>`;
  const labels={highlight:'Resumen automático de 1 minuto',emotional:'Video emocional de 5 minutos',voices:'Cápsula de mensajes de voz',branding:'Personalización visual avanzada'};
  document.getElementById('extrasSummary').innerHTML=activeExtras.map(item=>`<div class="extra-summary-line"><span>${labels[item.dataset.extra]}</span><strong>+${formatUSD(Number(item.dataset.price))}</strong></div>`).join('');
  if(appliedCoupon){
    const pct=coupons[appliedCoupon];
    const amount=getDiscount();
    discountCode.textContent=`${appliedCoupon} · ${pct}%`;
    discountAmount.textContent=`−${formatUSD(amount)}`;
    discountLine.classList.remove('hidden');
  }else{discountLine.classList.add('hidden')}
  document.getElementById('totalPrice').textContent=formatUSD(getFinalTotal());
}

function showCouponStatus(message,type=''){couponStatus.textContent=message;couponStatus.classList.remove('ok','error');if(type)couponStatus.classList.add(type)}
function applyCoupon(code,{silent=false}={}){
  const normalized=(code||'').trim().toUpperCase();
  couponInput.value=normalized;
  if(!normalized){appliedCoupon=null;showCouponStatus('Escribe un cupón para aplicarlo.','error');updateQuote();return false}
  if(!coupons[normalized]){appliedCoupon=null;showCouponStatus('Ese cupón no es válido. Prueba con el código ganado en EventoLens Runner.','error');updateQuote();return false}
  appliedCoupon=normalized;localStorage.setItem('eventolensLastCoupon',normalized);showCouponStatus(`Cupón aplicado: ${coupons[normalized]}% de descuento sobre esta estimación.`,'ok');updateQuote();
  if(!silent)document.getElementById('simulador').scrollIntoView({behavior:'smooth',block:'start'});
  return true;
}

function recommendPlan(){
  const count=Number(guests.value);let key='basic';let reason='Por el tamaño de tu evento, el plan Básico cubre una experiencia sencilla de fotos + QR + galería.';
  if(count>=90){key='premium';reason='Por el número de invitados, Premium aprovecha mejor la participación: fotos ilimitadas, video, reel IA y muro en vivo.'}
  if(count>=260){key='elite';reason='Para un evento de esta escala, Elite suma reconocimiento facial y libro digital automático, útiles cuando habrá mucho contenido.'}
  selectedPlan=key;planButtons.forEach(btn=>btn.classList.toggle('active',btn.dataset.plan===key));const box=document.getElementById('recommendation');box.textContent=`Recomendación: ${plans[key].name}. ${reason}`;box.classList.add('show');updateQuote();
}

planButtons.forEach(btn=>btn.addEventListener('click',()=>setPlan(btn.dataset.plan)));
guests.addEventListener('input',updateQuote);eventType.addEventListener('change',updateQuote);extras.forEach(x=>x.addEventListener('change',updateQuote));document.getElementById('recommendBtn').addEventListener('click',recommendPlan);
document.querySelectorAll('[data-plan-jump]').forEach(card=>card.querySelector('a').addEventListener('click',()=>setPlan(card.dataset.planJump)));
applyCouponBtn?.addEventListener('click',()=>applyCoupon(couponInput.value));
couponInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyCoupon(couponInput.value)}});

const queryCoupon=new URLSearchParams(window.location.search).get('coupon');
if(queryCoupon){applyCoupon(queryCoupon,{silent:true});setTimeout(()=>document.getElementById('simulador')?.scrollIntoView({block:'start'}),120)}

const copyQuoteBtn=document.getElementById('copyQuote');
copyQuoteBtn?.addEventListener('click',async()=>{
  const plan=plans[selectedPlan];const activeExtras=getActiveExtras();const extraText=activeExtras.length?activeExtras.map(x=>`+ ${x.closest('.extra').querySelector('b').textContent} (${formatUSD(Number(x.dataset.price))})`).join('\n'):'Sin extras';
  const couponText=appliedCoupon?`Cupón: ${appliedCoupon} (${coupons[appliedCoupon]}% descuento)\nDescuento: -${formatUSD(getDiscount())}\n`:'';
  const text=`Cotización Eventolens\nEvento: ${eventType.value}\nInvitados: ${guests.value}\nPlan: ${plan.name} (${formatUSD(plan.price)} USD)\n${extraText}\n${couponText}Total estimado: ${formatUSD(getFinalTotal())} USD`;
  try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
  const toast=document.getElementById('toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);
});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.getElementById('menuBtn').addEventListener('click',()=>{const header=document.querySelector('.topbar');const open=header.classList.toggle('menu-open');document.getElementById('menuBtn').setAttribute('aria-expanded',open?'true':'false')});document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.topbar').classList.remove('menu-open')));
document.getElementById('year').textContent=new Date().getFullYear();updateQuote();

const promoVideo=document.getElementById('promoVideo');const soundHint=document.getElementById('soundHint');let promoPausedByUser=false;
async function keepVideoPlaying(){if(!promoVideo||promoPausedByUser)return;try{await promoVideo.play()}catch(e){}}
if(promoVideo){promoVideo.addEventListener('pause',()=>{promoPausedByUser=true});promoVideo.addEventListener('play',()=>{promoPausedByUser=false});keepVideoPlaying();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!promoPausedByUser)keepVideoPlaying()})}
if(soundHint&&promoVideo){soundHint.addEventListener('click',async()=>{promoVideo.muted=false;promoVideo.volume=1;try{await promoVideo.play();soundHint.classList.add('hidden')}catch(e){soundHint.textContent='Toca play o el volumen para escuchar audio'}});const tryEnableAudio=async()=>{if(!promoVideo.muted||promoPausedByUser)return;promoVideo.muted=false;try{await promoVideo.play();soundHint.classList.add('hidden')}catch(e){promoVideo.muted=true}};window.addEventListener('pointerdown',tryEnableAudio);window.addEventListener('keydown',tryEnableAudio);promoVideo.addEventListener('volumechange',()=>{soundHint.classList.toggle('hidden',!promoVideo.muted)})}


// ===== Experimento Fake Door comercial =====
const experimentCfg = window.EVENTOLENS_EXPERIMENT || {endpoint:'', coupon:'LANZA20', discountPercent:20};
const fakeDoorModal = document.getElementById('fakeDoorModal');
const fakeDoorIntro = document.getElementById('fakeDoorIntro');
const experimentForm = document.getElementById('experimentForm');
const surveySuccess = document.getElementById('surveySuccess');
const surveySummary = document.getElementById('surveySummary');
const adminStatus = document.getElementById('adminStatus');

function experimentSnapshot(){
  return {
    event_type:eventType?.value || '',
    guests:Number(guests?.value || 0),
    plan:plans[selectedPlan]?.name || '',
    estimated_total:Math.round(getFinalTotal()),
    coupon_before_survey:appliedCoupon || ''
  };
}

function saveExperimentEvent(type, payload={}){
  const events = JSON.parse(localStorage.getItem('eventolensExperimentEvents') || '[]');
  events.push({type, at:new Date().toISOString(), ...payload});
  localStorage.setItem('eventolensExperimentEvents', JSON.stringify(events.slice(-300)));
}

async function postExperiment(payload){
  if(!experimentCfg.endpoint) return {mode:'local'};

  const sheetPayload = {
    nombre: payload.name || '',
    tipoEvento: payload.event_type || '',
    fechaEvento: payload.event_date || '',
    invitados: payload.guests || '',
    plan: payload.plan || '',
    precioEstimado: payload.estimated_total || '',
    intencionCompra: payload.purchase_intent || '',
    funcionFavorita: payload.favorite_feature || '',
    precioRazonable: payload.expected_budget || '',
    impedimento: payload.objection || '',
    correo: payload.email || '',
    whatsapp: payload.whatsapp || '',
    aceptaContacto: payload.contact_permission || 'No',
    cupon: payload.coupon_before_survey || '',
    fuente: payload.source || 'Landing Page Eventolens - Fake Door'
  };

  try{
    // Envío tradicional de formulario hacia Apps Script.
    // Evita los problemas de CORS/no-cors de fetch en GitHub Pages.
    const targetName = 'eventolens_sheet_' + Date.now();
    const iframe = document.createElement('iframe');
    iframe.name = targetName;
    iframe.title = 'Envío de respuesta Eventolens';
    iframe.style.display = 'none';

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = experimentCfg.endpoint;
    form.target = targetName;
    form.style.display = 'none';

    Object.entries(sheetPayload).forEach(([name,value])=>{
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = String(value ?? '');
      form.appendChild(input);
    });

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();

    // Dejamos tiempo suficiente para que el POST salga antes de limpiar el DOM.
    setTimeout(()=>{
      form.remove();
      iframe.remove();
    }, 8000);

    return {mode:'remote-form'};
  }catch(error){
    console.warn('No se pudo enviar el experimento.', error);
    return {mode:'local-fallback'};
  }
}

function openFakeDoor(origin='cta'){
  const snap=experimentSnapshot();
  saveExperimentEvent('fake_door_open',{origin,...snap});
  fakeDoorIntro.classList.remove('hidden');
  experimentForm.classList.add('hidden');
  surveySuccess.classList.add('hidden');
  surveySummary.innerHTML=`<b>${snap.event_type}</b><span>${snap.guests.toLocaleString('es-MX')} invitados · Plan ${snap.plan} · Estimado ${formatUSD(snap.estimated_total)} USD</span>`;
  document.getElementById('formEventType').value=snap.event_type;
  document.getElementById('formGuests').value=snap.guests;
  document.getElementById('formPlan').value=snap.plan;
  document.getElementById('formTotal').value=snap.estimated_total;
  document.getElementById('formCoupon').value=snap.coupon_before_survey;
  fakeDoorModal.classList.add('open');
  fakeDoorModal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}

function closeFakeDoor(){
  fakeDoorModal.classList.remove('open');
  fakeDoorModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}

document.getElementById('reserveEvent')?.addEventListener('click',()=>openFakeDoor('simulator'));
document.querySelectorAll('.fake-door-trigger').forEach(btn=>btn.addEventListener('click',()=>openFakeDoor('final_cta')));
document.querySelectorAll('[data-close-fake-door]').forEach(el=>el.addEventListener('click',closeFakeDoor));
document.addEventListener('keydown',e=>{if(e.key==='Escape' && fakeDoorModal?.classList.contains('open')) closeFakeDoor()});

document.getElementById('startSurvey')?.addEventListener('click',()=>{
  saveExperimentEvent('survey_start',experimentSnapshot());
  fakeDoorIntro.classList.add('hidden');
  experimentForm.classList.remove('hidden');
  experimentForm.querySelector('input,select,textarea')?.focus();
});

experimentForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const submitBtn=document.getElementById('submitSurvey');
  submitBtn.disabled=true;
  submitBtn.innerHTML='Enviando…';
  const fd=new FormData(experimentForm);
  const response=Object.fromEntries(fd.entries());
  response.submitted_at=new Date().toISOString();
  response.page_url=location.href;
  response.user_agent=navigator.userAgent;
  saveExperimentEvent('survey_submit',response);
  localStorage.setItem('eventolensLastSurveyResponse',JSON.stringify(response));
  const result=await postExperiment(response);
  experimentForm.classList.add('hidden');
  surveySuccess.classList.remove('hidden');
  submitBtn.disabled=false;
  submitBtn.innerHTML='Enviar respuestas y obtener mi 20% <span>→</span>';
  saveExperimentEvent('survey_success',{storage:result.mode});
});

document.getElementById('launchCode')?.addEventListener('click',async()=>{
  const code=experimentCfg.coupon || 'LANZA20';
  try{await navigator.clipboard.writeText(code)}catch(e){}
  const btn=document.getElementById('launchCode');
  btn.textContent='COPIADO ✓';
  setTimeout(()=>btn.textContent=code,1200);
});

document.getElementById('applyLaunchCoupon')?.addEventListener('click',()=>{
  const code=experimentCfg.coupon || 'LANZA20';
  applyCoupon(code,{silent:true});
  closeFakeDoor();
  document.getElementById('simulador')?.scrollIntoView({behavior:'smooth',block:'start'});
  saveExperimentEvent('launch_coupon_applied',{coupon:code,...experimentSnapshot()});
});

// Modo de administración local: agrega ?admin=1 a la URL para comprobar la conexión.
if(new URLSearchParams(location.search).get('admin')==='1' && adminStatus){
  adminStatus.hidden=false;
  adminStatus.textContent=experimentCfg.endpoint ? 'Captura de respuestas: CONECTADA' : 'Captura de respuestas: MODO PRUEBA (solo este navegador)';
}
