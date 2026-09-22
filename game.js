(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('canvasWrap');
  const scoreEl = document.getElementById('score');
  const coinsEl = document.getElementById('coins');
  const bestEl = document.getElementById('best');
  const finalScore = document.getElementById('finalScore');
  const finalScoreBox = document.getElementById('finalScoreBox');
  const finalCoins = document.getElementById('finalCoins');
  const finalCoinsBox = document.getElementById('finalCoinsBox');
  const finalBest = document.getElementById('finalBest');
  const startOverlay = document.getElementById('startOverlay');
  const gameoverOverlay = document.getElementById('gameoverOverlay');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const soundBtn = document.getElementById('soundBtn');
  const adCopy = document.getElementById('adCopy');
  const couponDiscount = document.getElementById('couponDiscount');
  const couponCode = document.getElementById('couponCode');
  const copyCoupon = document.getElementById('copyCoupon');
  const simulatorLink = document.getElementById('simulatorLink');
  const gameToast = document.getElementById('gameToast');

  const ads = [
    'Tu evento visto por todos · Fotos, videos e IA en un solo lugar.',
    'Eventolens Premium · Fotos ilimitadas + videos + Reel automático con IA.',
    'Muro en vivo · Convierte las fotos de tus invitados en parte del show.',
    'Un QR · Todo el evento · Sin instalar ninguna app.',
    'Eventolens Elite · Reconocimiento facial + libro digital automático.'
  ];
  let adIndex = 0;
  setInterval(() => {
    adIndex = (adIndex + 1) % ads.length;
    adCopy.textContent = ads[adIndex];
    adCopy.animate([{opacity:.15,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:260});
  }, 5200);

  let W=1200,H=560,dpr=1,groundY=470;
  let running=false,gameOver=false,raf=0,lastTime=performance.now();
  let score=0,coinCount=0,best=Number(localStorage.getItem('eventolensRunnerBest')||0);
  let speed=7.0,spawnTimer=0,nextSpawn=92,coinTimer=0,nextCoinSpawn=72,soundOn=true;
  const player={x:150,y:0,w:58,h:58,vy:0,gravity:.92,jump:-16.5,grounded:true,rot:0};
  const obstacles=[],coins=[],particles=[],skyline=[];
  let activeCoupon='LENS5';
  bestEl.textContent=String(best).padStart(4,'0');

  function resize(){
    const r=wrap.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(280,r.width); H=Math.max(220,r.height);
    canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);
    canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    groundY=H*.79;
    const scale=Math.max(.72,Math.min(1,W/900,H/500));
    player.w=58*scale;player.h=58*scale;player.x=Math.max(54,W*.12);
    player.gravity=.92*scale;player.jump=-16.5*scale;
    if(!running)player.y=groundY-player.h;
    buildSkyline();draw();
  }
  function buildSkyline(){skyline.length=0;let x=0;while(x<W+120){const w=30+Math.random()*65,h=24+Math.random()*80;skyline.push({x,w,h,glow:Math.random()>.45});x+=w+5}}
  function resetGame(){
    cancelAnimationFrame(raf);obstacles.length=0;coins.length=0;particles.length=0;
    score=0;coinCount=0;speed=7.0;spawnTimer=0;nextSpawn=88;coinTimer=0;nextCoinSpawn=45;
    player.y=groundY-player.h;player.vy=0;player.grounded=true;player.rot=0;
    running=true;gameOver=false;lastTime=performance.now();startOverlay.classList.add('hidden');gameoverOverlay.classList.add('hidden');
    scoreEl.textContent='0000';coinsEl.textContent='0';loop(lastTime);
  }
  function jump(){if(!running){return}if(player.grounded){player.vy=player.jump;player.grounded=false;burst(player.x+player.w*.45,groundY-5,8,'#a36cff');beep(560,.05,.05)}}
  function spawnObstacle(){
    const s=Math.max(.72,Math.min(1,W/900,H/500));
    const types=[['camera',54,62],['gift',58,58],['stand',38,78],['speaker',50,72]];
    const [kind,bw,bh]=types[Math.floor(Math.random()*types.length)];const w=bw*s,h=bh*s;
    obstacles.push({x:W+30,y:groundY-h,w,h,kind,passed:false});nextSpawn=Math.max(54,103-speed*3)+Math.random()*32;
  }
  function spawnCoins(){
    const s=Math.max(.72,Math.min(1,W/900,H/500));
    const count=3+Math.floor(Math.random()*3);const spacing=34*s;const baseY=groundY-(75+Math.random()*95)*s;
    for(let i=0;i<count;i++)coins.push({x:W+40+i*spacing,y:baseY-Math.sin((i/(count-1||1))*Math.PI)*28*s,r:11*s,collected:false,spin:Math.random()*Math.PI*2});
    nextCoinSpawn=72+Math.random()*55;
  }
  function burst(x,y,n,color){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*5,vy:-Math.random()*4-1,life:1,size:2+Math.random()*4,color})}
  function collide(a,b){const pad=Math.max(4,a.w*.12);return a.x+pad<b.x+b.w&&a.x+a.w-pad>b.x&&a.y+pad<b.y+b.h&&a.y+a.h-pad>b.y}
  function coinHit(c){const cx=player.x+player.w/2,cy=player.y+player.h/2;const dx=c.x-cx,dy=c.y-cy;return dx*dx+dy*dy<Math.pow(c.r+player.w*.36,2)}
  function update(dt){
    const step=Math.min(1.7,dt/16.6667);speed+=.00165*step;score+=.16*speed*step;scoreEl.textContent=String(Math.floor(score)).padStart(4,'0');
    player.vy+=player.gravity*step;player.y+=player.vy*step;player.rot=Math.max(-.28,Math.min(.3,player.vy*.018));if(player.y+player.h>=groundY){player.y=groundY-player.h;player.vy=0;player.grounded=true;player.rot=0}
    spawnTimer+=step;if(spawnTimer>=nextSpawn){spawnTimer=0;spawnObstacle()}
    coinTimer+=step;if(coinTimer>=nextCoinSpawn){coinTimer=0;spawnCoins()}
    for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.x-=speed*step;if(!o.passed&&o.x+o.w<player.x){o.passed=true;burst(o.x+o.w*.5,o.y,4,'#51e7e0')}if(collide(player,o)){endGame();return}if(o.x+o.w<-60)obstacles.splice(i,1)}
    for(let i=coins.length-1;i>=0;i--){const c=coins[i];c.x-=speed*step;c.spin+=.13*step;if(!c.collected&&coinHit(c)){c.collected=true;coinCount++;coinsEl.textContent=coinCount;score+=25;burst(c.x,c.y,9,'#ffd45c');beep(920,.045,.045);coins.splice(i,1);continue}if(c.x+c.r<-30)coins.splice(i,1)}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=.2*step;p.life-=.025*step;if(p.life<=0)particles.splice(i,1)}
  }
  function chooseCoupon(s,c){if(c>=25||s>=2500)return{code:'LENS15',pct:15};if(c>=12||s>=1200)return{code:'LENS10',pct:10};return{code:'LENS5',pct:5}}
  function endGame(){
    running=false;gameOver=true;cancelAnimationFrame(raf);burst(player.x+player.w/2,player.y+player.h/2,20,'#ff4ba8');beep(160,.14,.08);setTimeout(()=>beep(110,.16,.06),90);
    const s=Math.floor(score);if(s>best){best=s;localStorage.setItem('eventolensRunnerBest',best)}bestEl.textContent=String(best).padStart(4,'0');
    finalScore.textContent=s;finalScoreBox.textContent=s;finalCoins.textContent=coinCount;finalCoinsBox.textContent=coinCount;finalBest.textContent=best;
    const reward=chooseCoupon(s,coinCount);activeCoupon=reward.code;couponCode.textContent=reward.code;couponDiscount.textContent=`${reward.pct}% DE DESCUENTO`;simulatorLink.href=`index.html?coupon=${encodeURIComponent(reward.code)}#simulador`;localStorage.setItem('eventolensLastCoupon',reward.code);
    setTimeout(()=>gameoverOverlay.classList.remove('hidden'),220);draw();
  }
  function loop(now){if(!running)return;const dt=now-lastTime;lastTime=now;update(dt);draw();raf=requestAnimationFrame(loop)}
  function roundedRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1f102b');g.addColorStop(.55,'#0d1120');g.addColorStop(1,'#082129');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(W*.18,H*.2,10,W*.18,H*.2,W*.43);glow.addColorStop(0,'rgba(255,75,168,.21)');glow.addColorStop(1,'rgba(255,75,168,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=.16;skyline.forEach(b=>{const x=b.x-(score*.11)%(W+120);ctx.fillStyle=b.glow?'#b45fb4':'#5b5775';ctx.fillRect(x,groundY-b.h-35,b.w,b.h);if(x<0)ctx.fillRect(x+W+120,groundY-b.h-35,b.w,b.h)});ctx.globalAlpha=1;
    for(let i=0;i<14;i++){const x=((i*137-score*.55)%(W+80)+W+80)%(W+80)-40,y=35+(i%5)*(H*.095);ctx.fillStyle=i%3===0?'rgba(81,231,224,.16)':'rgba(255,255,255,.08)';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}
  }
  function drawGround(){ctx.fillStyle='#0b0910';ctx.fillRect(0,groundY,W,H-groundY);const gr=ctx.createLinearGradient(0,groundY,0,groundY+40);gr.addColorStop(0,'rgba(163,108,255,.34)');gr.addColorStop(1,'rgba(163,108,255,0)');ctx.fillStyle=gr;ctx.fillRect(0,groundY,W,40);ctx.strokeStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.moveTo(0,groundY+.5);ctx.lineTo(W,groundY+.5);ctx.stroke();for(let x=-((score*2)%48);x<W;x+=48){ctx.fillStyle='rgba(255,255,255,.055)';ctx.fillRect(x,groundY+26,24,3)}}
  function drawPlayer(){const cx=player.x+player.w/2,cy=player.y+player.h/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(player.rot);ctx.shadowColor='rgba(163,108,255,.65)';ctx.shadowBlur=22;const gr=ctx.createConicGradient(0,0,0);gr.addColorStop(0,'#51e7e0');gr.addColorStop(.35,'#a36cff');gr.addColorStop(.68,'#ff4ba8');gr.addColorStop(1,'#51e7e0');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,player.w*.48,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0d0a14';ctx.beginPath();ctx.arc(0,0,player.w*.31,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-player.w*.1,-player.w*.1,player.w*.075,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawObstacle(o){ctx.save();ctx.translate(o.x,o.y);if(o.kind==='camera'){roundedRect(0,o.h*.18,o.w,o.h*.82,o.w*.14,'#202334','rgba(255,255,255,.15)');roundedRect(o.w*.16,0,o.w*.44,o.h*.25,o.w*.08,'#2b2d42');ctx.fillStyle='#a36cff';ctx.beginPath();ctx.arc(o.w*.56,o.h*.57,o.w*.24,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0b0c12';ctx.beginPath();ctx.arc(o.w*.56,o.h*.57,o.w*.13,0,Math.PI*2);ctx.fill()}else if(o.kind==='gift'){roundedRect(0,o.h*.17,o.w,o.h*.83,o.w*.12,'#ba4a83');ctx.fillStyle='#ffcc6d';ctx.fillRect(o.w*.44,o.h*.17,o.w*.12,o.h*.83);ctx.fillRect(0,o.h*.43,o.w,o.h*.12)}else if(o.kind==='stand'){ctx.strokeStyle='#aeb3c4';ctx.lineWidth=Math.max(3,o.w*.16);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(o.w*.5,o.h*.23);ctx.lineTo(o.w*.5,o.h*.62);ctx.moveTo(o.w*.5,o.h*.6);ctx.lineTo(o.w*.1,o.h);ctx.moveTo(o.w*.5,o.h*.6);ctx.lineTo(o.w*.9,o.h);ctx.stroke();roundedRect(o.w*.05,0,o.w*.9,o.h*.27,o.w*.1,'#6c5ce7')}else{roundedRect(0,0,o.w,o.h,o.w*.12,'#272536','rgba(255,255,255,.14)');ctx.fillStyle='#51e7e0';[.28,.64].forEach(v=>{ctx.beginPath();ctx.arc(o.w/2,o.h*v,o.w*.18,0,Math.PI*2);ctx.fill()})}ctx.restore()}
  function drawCoins(){coins.forEach(c=>{ctx.save();ctx.translate(c.x,c.y);ctx.scale(.35+Math.abs(Math.cos(c.spin))*.65,1);ctx.shadowColor='rgba(255,212,92,.7)';ctx.shadowBlur=14;ctx.fillStyle='#ffd45c';ctx.beginPath();ctx.arc(0,0,c.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff0a9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,c.r*.68,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#6f4d12';ctx.font=`800 ${Math.max(8,c.r)}px Manrope`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('E',0,1);ctx.restore()})}
  function drawParticles(){particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1}
  function draw(){ctx.clearRect(0,0,W,H);drawBackground();drawGround();drawCoins();obstacles.forEach(drawObstacle);drawPlayer();drawParticles();const fs=Math.max(28,Math.min(76,W*.065));ctx.fillStyle='rgba(255,255,255,.045)';ctx.font=`800 ${fs}px Manrope`;ctx.textAlign='right';ctx.fillText('EVENTOLENS',W-18,Math.max(48,fs+15));ctx.textAlign='left'}
  let audioCtx;function beep(freq=440,dur=.05,vol=.04){if(!soundOn)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur)}catch(e){}}
  function handleAction(e){if(e?.target?.closest?.('button,a'))return;e?.preventDefault?.();if(running)jump()}
  canvas.addEventListener('pointerdown',handleAction,{passive:false});
  document.addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(running)jump()}});
  startBtn.addEventListener('click',resetGame);restartBtn.addEventListener('click',resetGame);
  soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?'🔊':'🔇';if(soundOn)beep(640,.04,.035)});
  copyCoupon.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(activeCoupon)}catch(e){const t=document.createElement('textarea');t.value=activeCoupon;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}gameToast.classList.add('show');setTimeout(()=>gameToast.classList.remove('show'),1400)});
  window.addEventListener('resize',resize);resize();
})();
