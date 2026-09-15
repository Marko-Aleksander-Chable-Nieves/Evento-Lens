const plans = {
  basic: {
    name: 'Básico', price: 100,
    features: ['Hasta 500 fotos', 'QR único', 'Galería del evento']
  },
  premium: {
    name: 'Premium', price: 250,
    features: ['Fotos ilimitadas', 'Videos', '1 Reel automático con IA', 'Muro en vivo', 'QR + galería']
  },
  elite: {
    name: 'Elite', price: 350,
    features: ['Fotos ilimitadas', 'Videos', 'Reel automático con IA', 'Muro en video', 'Reconocimiento facial', 'Libro digital automático', 'QR + galería']
  }
};

let selectedPlan = 'premium';
const guests = document.getElementById('guests');
const guestValue = document.getElementById('guestValue');
const eventType = document.getElementById('eventType');
const extras = [...document.querySelectorAll('.extra input')];
const planButtons = [...document.querySelectorAll('.plan-option')];

function formatUSD(value) { return `$${value.toLocaleString('en-US')}`; }

function setPlan(key, scroll = false) {
  selectedPlan = key;
  planButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.plan === key));
  document.getElementById('recommendation').classList.remove('show');
  updateQuote();
  if (scroll) document.getElementById('simulador').scrollIntoView({behavior:'smooth'});
}

function updateQuote() {
  guestValue.textContent = Number(guests.value).toLocaleString('es-MX');
  const plan = plans[selectedPlan];
  const activeExtras = extras.filter(x => x.checked);
  const extrasTotal = activeExtras.reduce((sum, item) => sum + Number(item.dataset.price), 0);
  const total = plan.price + extrasTotal;

  document.getElementById('quoteEvent').textContent = `${eventType.value} · ${Number(guests.value).toLocaleString('es-MX')} invitados`;
  document.getElementById('quotePlan').textContent = plan.name;
  document.getElementById('quotePlanBadge').textContent = plan.name.toUpperCase();
  document.getElementById('basePrice').textContent = formatUSD(plan.price);
  document.getElementById('totalPrice').textContent = formatUSD(total);
  document.getElementById('includedFeatures').innerHTML = `<span><b>Incluye:</b> ${plan.features.join(' · ')}</span>`;

  const labels = {
    highlight:'Resumen automático de 1 minuto',
    emotional:'Video emocional de 5 minutos',
    voices:'Cápsula de mensajes de voz',
    branding:'Personalización visual avanzada'
  };
  document.getElementById('extrasSummary').innerHTML = activeExtras.map(item =>
    `<div class="extra-summary-line"><span>${labels[item.dataset.extra]}</span><strong>+${formatUSD(Number(item.dataset.price))}</strong></div>`
  ).join('');
}

function recommendPlan() {
  const count = Number(guests.value);
  let key = 'basic';
  let reason = 'Por el tamaño de tu evento, el plan Básico cubre una experiencia sencilla de fotos + QR + galería.';
  if (count >= 90) {
    key = 'premium';
    reason = 'Por el número de invitados, Premium aprovecha mejor la participación: fotos ilimitadas, video, reel IA y muro en vivo.';
  }
  if (count >= 260) {
    key = 'elite';
    reason = 'Para un evento de esta escala, Elite suma reconocimiento facial y libro digital automático, útiles cuando habrá mucho contenido.';
  }
  selectedPlan = key;
  planButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.plan === key));
  const box = document.getElementById('recommendation');
  box.textContent = `Recomendación: ${plans[key].name}. ${reason}`;
  box.classList.add('show');
  updateQuote();
  box.classList.add('show');
}

planButtons.forEach(btn => btn.addEventListener('click', () => setPlan(btn.dataset.plan)));
guests.addEventListener('input', updateQuote);
eventType.addEventListener('change', updateQuote);
extras.forEach(x => x.addEventListener('change', updateQuote));
document.getElementById('recommendBtn').addEventListener('click', recommendPlan);

document.querySelectorAll('[data-plan-jump]').forEach(card => {
  card.querySelector('a').addEventListener('click', () => setPlan(card.dataset.planJump));
});

document.getElementById('copyQuote').addEventListener('click', async () => {
  const plan = plans[selectedPlan];
  const activeExtras = extras.filter(x => x.checked);
  const total = plan.price + activeExtras.reduce((sum, item) => sum + Number(item.dataset.price), 0);
  const extraText = activeExtras.length ? activeExtras.map(x => `+ ${x.closest('.extra').querySelector('b').textContent} (${formatUSD(Number(x.dataset.price))})`).join('\n') : 'Sin extras';
  const text = `Cotización Eventolens\nEvento: ${eventType.value}\nInvitados: ${guests.value}\nPlan: ${plan.name} (${formatUSD(plan.price)} USD)\n${extraText}\nTotal estimado: ${formatUSD(total)} USD`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  const toast = document.getElementById('toast');
  toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800);
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.getElementById('menuBtn').addEventListener('click', () => {
  const header = document.querySelector('.topbar');
  const open = header.classList.toggle('menu-open');
  document.getElementById('menuBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
});
document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click',()=>document.querySelector('.topbar').classList.remove('menu-open')));

document.getElementById('year').textContent = new Date().getFullYear();
updateQuote();


const promoVideo = document.getElementById('promoVideo');
const soundHint = document.getElementById('soundHint');

async function keepVideoPlaying(){ if(!promoVideo) return; try{ await promoVideo.play(); }catch(e){} }
keepVideoPlaying();
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && promoVideo && promoVideo.paused) keepVideoPlaying(); });
window.addEventListener('focus', keepVideoPlaying);

if(soundHint && promoVideo){
  soundHint.addEventListener('click', async ()=>{
    promoVideo.muted = false;
    promoVideo.volume = 1;
    try{ await promoVideo.play(); soundHint.classList.add('hidden'); }
    catch(e){ soundHint.textContent = 'Toca play o el volumen para escuchar audio'; }
  });

  const tryEnableAudio = async ()=>{
    if(!promoVideo.muted) return;
    promoVideo.muted = false;
    try{ await promoVideo.play(); soundHint.classList.add('hidden'); }
    catch(e){ promoVideo.muted = true; }
  };

  window.addEventListener('pointerdown', tryEnableAudio);
  window.addEventListener('keydown', tryEnableAudio);

  promoVideo.addEventListener('volumechange', ()=>{
    soundHint.classList.toggle('hidden', !promoVideo.muted);
  });
}
