const plans = {
  basic:{name:'Básico',price:100,features:['Hasta 500 fotos','QR único','Galería del evento']},
  premium:{name:'Premium',price:250,features:['Fotos ilimitadas','Videos','1 Reel automático con IA','Muro en vivo','QR + galería']},
  elite:{name:'Elite',price:350,features:['Fotos ilimitadas','Videos','Reel automático con IA','Muro en video','Reconocimiento facial','Libro digital automático','QR + galería']}
};
const coupons={LENS5:5,LENS10:10,LENS15:15};
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
