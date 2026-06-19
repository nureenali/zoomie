const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const moodLabel = document.getElementById('mood-label');
const btnDN  = document.getElementById('btn-daynight');
const btnSnd = document.getElementById('btn-sound');

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initCity(); });

function lerp(a,b,t){ return a+(b-a)*t; }


let isDay = false, dayT = 0;
btnDN.addEventListener('click', () => { isDay = !isDay; btnDN.textContent = isDay ? '\uD83C\uDF05' : '\uD83C\uDF19'; });

let soundOn = false, audioCtx = null;
btnSnd.addEventListener('click', () => { soundOn = !soundOn; btnSnd.textContent = soundOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'; if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); });
function playMeow() {
  if(!soundOn||!audioCtx) return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);o.type='sine';
  const t=audioCtx.currentTime;
  o.frequency.setValueAtTime(800,t);o.frequency.linearRampToValueAtTime(1200,t+0.1);o.frequency.linearRampToValueAtTime(700,t+0.3);
  g.gain.setValueAtTime(0.18,t);g.gain.linearRampToValueAtTime(0,t+0.35);o.start(t);o.stop(t+0.4);
}
function playPurr() {
  if(!soundOn||!audioCtx) return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);o.type='sawtooth';o.frequency.value=25;
  g.gain.setValueAtTime(0.04,audioCtx.currentTime);g.gain.linearRampToValueAtTime(0,audioCtx.currentTime+1.5);
  o.start();o.stop(audioCtx.currentTime+1.5);
}

const gW=()=>canvas.width, gH=()=>canvas.height;
const wX=()=>gW()*0.18, wY=()=>gH()*0.04, wW=()=>gW()*0.62, wH=()=>gH()*0.72, wBY=()=>wY()+wH();

class RainDrop {
  constructor(){ this.reset(true); }
  reset(init){ this.x=Math.random()*gW(); this.y=init?Math.random()*gH():-20; this.len=12+Math.random()*20; this.speed=10+Math.random()*8; this.alpha=0.08+Math.random()*0.22; }
  update(){ this.x+=1.8; this.y+=this.speed; if(this.y>gH()+20) this.reset(false); }
  draw(){
    ctx.save(); ctx.globalAlpha=this.alpha; ctx.strokeStyle='#a8c8e8'; ctx.lineWidth=0.8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(this.x,this.y); ctx.lineTo(this.x+2,this.y+this.len); ctx.stroke(); ctx.restore();
  }
}

class GlassDrop {
  constructor(){ this.reset(); }
  reset(){ this.x=wX()+Math.random()*wW(); this.y=wY()+Math.random()*wH()*0.3; this.speed=0.25+Math.random()*0.6; this.wander=0; this.alpha=0.25+Math.random()*0.35; this.trail=[{x:this.x,y:this.y}]; }
  update(){ this.wander+=(Math.random()-0.5)*0.15; this.wander*=0.8; this.x+=this.wander; this.y+=this.speed; this.trail.push({x:this.x,y:this.y}); if(this.trail.length>25)this.trail.shift(); if(this.y>wBY())this.reset(); }
  draw(){
    if(this.trail.length<2)return;
    ctx.save(); ctx.lineCap='round';
    for(let i=0; i<this.trail.length-1; i++) {
       ctx.beginPath(); ctx.moveTo(this.trail[i].x, this.trail[i].y); ctx.lineTo(this.trail[i+1].x, this.trail[i+1].y);
       ctx.globalAlpha = this.alpha * (i / this.trail.length) * 0.6;
       ctx.strokeStyle = 'rgba(190,220,255,0.6)';
       ctx.lineWidth = 0.8 + (i / this.trail.length) * 1.2;
       ctx.stroke();
    }
    ctx.globalAlpha = this.alpha * 0.8; ctx.fillStyle='rgba(200,230,255,0.7)';
    ctx.beginPath(); ctx.ellipse(this.x,this.y,1.5,2,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}

let cityBuildings=[], cityWindows=[];
function initCity(){
  cityBuildings=[]; cityWindows=[];
  const wx=wX(),wy=wY(),ww=wW(),wh=wH();
  let bx=wx-10;
  while(bx<wx+ww+10){
    const bw=45+Math.random()*90, bh=70+Math.random()*(wh*0.65), by=wy+wh-bh;
    cityBuildings.push({x:bx,y:by,w:bw,h:bh});
    const cols=Math.floor(bw/14),rows=Math.floor(bh/20);
    for(let r=1;r<rows-1;r++){
      for(let c=0;c<cols;c++){
        if(Math.random()>0.45) cityWindows.push({x:bx+c*14+4,y:by+r*20+5,w:7,h:10,on:Math.random()>0.35,flicker:Math.random()>0.9,lastFlicker:Date.now()+Math.random()*4000,color:Math.random()>0.7?'#ffd080':'#ffbb44'});
      }
    }
    bx+=bw+2+Math.random()*10;
  }
}
initCity();

const rainDrops=Array.from({length:110},()=>new RainDrop());
const glassDrops=Array.from({length:22},()=>new GlassDrop());

function drawBackground(){
  const W=gW(),H=gH();
  const floorY=H*0.87;
  dayT=lerp(dayT,isDay?1:0,0.015);
  const wx=wX(),wy=wY(),ww=wW(),wh=wH(),wby=wBY();

  // Room wall
  const r=Math.round(lerp(20,38,dayT)),g2=Math.round(lerp(26,46,dayT)),b=Math.round(lerp(46,68,dayT));
  ctx.fillStyle=`rgb(${r},${g2},${b})`;
  ctx.fillRect(0,0,W,H);

  // Window sky (clipped)
  ctx.save();
  ctx.beginPath(); ctx.rect(wx,wy,ww,wh); ctx.clip();

  const skyGrd=ctx.createLinearGradient(wx,wy,wx,wy+wh);
  if(dayT<0.5){
    const t=dayT*2;
    skyGrd.addColorStop(0,`rgb(${Math.round(lerp(5,15,t))},${Math.round(lerp(8,20,t))},${Math.round(lerp(25,45,t))})`);
    skyGrd.addColorStop(1,`rgb(${Math.round(lerp(10,25,t))},${Math.round(lerp(15,32,t))},${Math.round(lerp(40,65,t))})`);
  } else {
    const t=(dayT-0.5)*2;
    skyGrd.addColorStop(0,`rgb(${Math.round(lerp(15,60,t))},${Math.round(lerp(20,40,t))},${Math.round(lerp(45,80,t))})`);
    skyGrd.addColorStop(0.5,`rgb(${Math.round(lerp(25,180,t))},${Math.round(lerp(32,100,t))},${Math.round(lerp(60,80,t))})`);
    skyGrd.addColorStop(1,`rgb(${Math.round(lerp(30,220,t))},${Math.round(lerp(38,140,t))},${Math.round(lerp(65,60,t))})`);
  }
  ctx.fillStyle=skyGrd; ctx.fillRect(wx,wy,ww,wh);

  // Clouds at dusk
  if(dayT>0.4){
    const ca=(dayT-0.4)/0.6;
    ctx.globalAlpha=ca*0.35;
    [[0.2,0.25],[0.5,0.15],[0.75,0.30],[0.35,0.40]].forEach(([fx,fy])=>{
      const cg=ctx.createRadialGradient(wx+ww*fx,wy+wh*fy,5,wx+ww*fx,wy+wh*fy,55);
      cg.addColorStop(0,'rgba(255,190,130,0.8)'); cg.addColorStop(1,'rgba(200,140,100,0)');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.ellipse(wx+ww*fx,wy+wh*fy,55,28,0,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
  }

  // Buildings
  const shade=Math.round(lerp(10,38,dayT));
  cityBuildings.forEach(bld=>{
    ctx.fillStyle=`rgb(${shade},${shade+4},${shade+10})`; ctx.fillRect(bld.x,bld.y,bld.w,bld.h);
  });

  // Building windows
  const now=Date.now();
  cityWindows.forEach(cw=>{
    if(cw.flicker&&now>cw.lastFlicker){ cw.on=!cw.on; cw.lastFlicker=now+1500+Math.random()*4000; }
    if(!cw.on) return;
    const al=dayT>0.7?1-(dayT-0.7)/0.3:1;
    ctx.globalAlpha=al*0.85; ctx.fillStyle=cw.color; ctx.fillRect(cw.x,cw.y,cw.w,cw.h);
    const gg=ctx.createRadialGradient(cw.x+3,cw.y+5,0,cw.x+3,cw.y+5,14);
    gg.addColorStop(0,'rgba(255,200,80,0.2)'); gg.addColorStop(1,'rgba(255,200,80,0)');
    ctx.fillStyle=gg; ctx.fillRect(cw.x-8,cw.y-8,cw.w+16,cw.h+16); ctx.globalAlpha=1;
  });

  // Rain behind glass
  rainDrops.forEach(rd=>rd.draw());
  ctx.restore();

  // Glass water trails
  ctx.save(); ctx.beginPath(); ctx.rect(wx,wy,ww,wh); ctx.clip();
  glassDrops.forEach(gd=>gd.draw());
  ctx.restore();

  // Window frame
  const fr=Math.round(lerp(42,62,dayT)),fg=Math.round(lerp(34,50,dayT)),fb=Math.round(lerp(28,40,dayT));
  ctx.strokeStyle=`rgb(${fr},${fg},${fb})`; ctx.lineWidth=14;
  ctx.strokeRect(wx,wy,ww,wh);
  ctx.lineWidth=7;
  ctx.beginPath();
  ctx.moveTo(wx+ww/2,wy); ctx.lineTo(wx+ww/2,wy+wh);
  ctx.moveTo(wx,wy+wh*0.47); ctx.lineTo(wx+ww,wy+wh*0.47);
  ctx.stroke();

  // Window sill
  ctx.fillStyle=`rgb(${fr+8},${fg+8},${fb+5})`; ctx.fillRect(wx-18,wby,ww+36,20);

  // Floor
  for(let i=0;i<8;i++){
    const fy=floorY+i*(H-floorY)/8;
    const br=Math.round(lerp(38,28,i/8)),bg2=Math.round(lerp(28,20,i/8)),bb=Math.round(lerp(22,15,i/8));
    ctx.fillStyle=`rgb(${br},${bg2},${bb})`; ctx.fillRect(0,fy,W,(H-floorY)/8+1);
  }
  // Floor planks
  ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1;
  for(let fx=0;fx<W;fx+=80){
    ctx.beginPath(); ctx.moveTo(fx,floorY); ctx.lineTo(fx,H); ctx.stroke();
  }

  // Lamp glow (left)
  const lx=W*0.07,ly=floorY;
  const lg=ctx.createRadialGradient(lx,ly-60,5,lx,ly-60,180);
  lg.addColorStop(0,'rgba(255,180,60,0.18)'); lg.addColorStop(1,'rgba(255,180,60,0)');
  ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgb(55,42,30)'; ctx.lineWidth=6; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx,ly-110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx,ly-105); ctx.lineTo(lx+35,ly-130); ctx.stroke();
  ctx.fillStyle='#4a3010';
  ctx.beginPath(); ctx.moveTo(lx+5,ly-125); ctx.lineTo(lx+60,ly-125); ctx.lineTo(lx+48,ly-95); ctx.lineTo(lx+17,ly-95); ctx.closePath(); ctx.fill();
  const bulbG=ctx.createRadialGradient(lx+35,ly-92,2,lx+35,ly-92,25);
  bulbG.addColorStop(0,'rgba(255,220,100,0.95)'); bulbG.addColorStop(1,'rgba(255,180,50,0)');
  ctx.fillStyle=bulbG; ctx.beginPath(); ctx.arc(lx+35,ly-92,25,0,Math.PI*2); ctx.fill();

  // Books stack on windowsill
  [[0.30,8,'#8b2020'],[0.30,5,'#205080'],[0.30,4,'#206040'],[0.30,3,'#704010']].reduce((yOff,bk)=>{
    ctx.fillStyle=bk[2]; ctx.fillRect(wx+ww*bk[0]-22,wby-yOff,44,bk[1]); return yOff+bk[1];
  },0);

  // Teacup on sill
  const tcx=wx+ww*0.68,tcy=wby-1;
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.moveTo(tcx-14,tcy); ctx.lineTo(tcx-10,tcy-20); ctx.lineTo(tcx+10,tcy-20); ctx.lineTo(tcx+14,tcy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(180,140,120,0.5)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.ellipse(tcx,tcy-20,10,4,0,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(tcx+14,tcy-12,1,0,Math.PI*2); ctx.stroke();
  // Steam
  [0,4,-3].forEach((ox,i)=>{
    ctx.globalAlpha=0.25+Math.sin(Date.now()*0.002+i)*0.1;
    ctx.strokeStyle='rgba(220,220,240,0.7)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(tcx+ox,tcy-22); ctx.quadraticCurveTo(tcx+ox+4,tcy-30,tcx+ox,tcy-38); ctx.stroke();
  });
  ctx.globalAlpha=1;

  // Small succulent on sill
  const spx=wx+ww*0.10,spy=wby;
  ctx.fillStyle='#3a2510'; ctx.fillRect(spx-8,spy-12,16,12);
  ctx.fillStyle='#2a5520'; ctx.beginPath(); ctx.ellipse(spx,spy-14,9,12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3a7030'; ctx.beginPath(); ctx.ellipse(spx-6,spy-16,5,8,-0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(spx+6,spy-16,5,8,0.4,0,Math.PI*2); ctx.fill();

  // Trailing ivy (left of window)
  ctx.strokeStyle='#2a4a18'; ctx.lineWidth=2;
  [[wx-5,wy+wh*0.15],[wx-15,wy+wh*0.30],[wx-8,wy+wh*0.45],[wx-20,wy+wh*0.60]].forEach(([vx,vy])=>{
    ctx.beginPath(); ctx.moveTo(wx,wy+wh*0.05); ctx.quadraticCurveTo(wx-10,vy-30,vx,vy); ctx.stroke();
    ctx.fillStyle='#3a6a22'; ctx.beginPath(); ctx.ellipse(vx,vy,10,7,Math.random()*0.5,0,Math.PI*2); ctx.fill();
  });

  // Armchair silhouette (right)
  const ax=W*0.90,ay=floorY;
  ctx.fillStyle=`rgb(${Math.round(lerp(40,58,dayT))},${Math.round(lerp(32,48,dayT))},${Math.round(lerp(50,68,dayT))})`;
  ctx.beginPath(); ctx.roundRect(ax-55,ay-70,110,70,8); ctx.fill();
  ctx.beginPath(); ctx.roundRect(ax-55,ay-100,18,50,6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(ax+37,ay-100,18,50,6); ctx.fill();
  ctx.fillStyle=`rgba(${Math.round(lerp(55,75,dayT))},${Math.round(lerp(44,62,dayT))},${Math.round(lerp(65,85,dayT))},0.6)`;
  ctx.beginPath(); ctx.roundRect(ax-50,ay-68,105,20,4); ctx.fill();
  // Blanket drape
  ctx.fillStyle=`rgb(${Math.round(lerp(60,80,dayT))},${Math.round(lerp(48,65,dayT))},${Math.round(lerp(38,52,dayT))})`;
  ctx.beginPath();
  ctx.moveTo(ax-20,ay-100); ctx.quadraticCurveTo(ax+10,ay-80,ax+50,ay-60);
  ctx.lineTo(ax+50,ay-40); ctx.quadraticCurveTo(ax+10,ay-55,ax-20,ay-75); ctx.closePath(); ctx.fill();

  // Zoomie floor glow
  const fg2=ctx.createRadialGradient(zoomie.x,floorY,5,zoomie.x,floorY,70);
  fg2.addColorStop(0,'rgba(120,150,220,0.10)'); fg2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=fg2; ctx.fillRect(0,0,W,H);
}

// Zoomie state
const zoomie = {
  x:canvas.width/2, y:canvas.height*0.82,
  targetX:canvas.width/2, targetY:canvas.height*0.82,
  size:60, speed:0.03,
  mood:'idle', isMoving:false,
  walkCycle:0, walkSpeed:0.15,
  tailCycle:0, tailWagging:false,
  lickCycle:0, facingRight:true,
  lastInteractionTime:Date.now(),
  lastArrivalTime:Date.now(),
  lastMeowTime:0, lastPurrTime:0,
  interactionLog:[]
};

const mouse={x:0,y:0};
window.addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
window.addEventListener('click',e=>{
  if(e.target.closest('#controls')) return;
  zoomie.targetX=e.clientX; zoomie.targetY=e.clientY;
  zoomie.isMoving=true; zoomie.lastInteractionTime=Date.now();
  if(e.clientX>zoomie.x) zoomie.facingRight=true; else zoomie.facingRight=false;
  zoomie.interactionLog.push({time:Date.now(),toX:e.clientX,toY:e.clientY});
  if(zoomie.interactionLog.length>50) zoomie.interactionLog.shift();
  if(Date.now()-zoomie.lastMeowTime>1500){ playMeow(); zoomie.lastMeowTime=Date.now(); }
});

const sprites = {
  walking: new Image(),
  sleeping: new Image(),
  grooming: new Image(),
  happy: new Image()
};
sprites.walking.src = 'assets/spritesheet_walking.png';
sprites.sleeping.src = 'assets/spritesheet_sleeping.png';
sprites.grooming.src = 'assets/grooming.png';
sprites.happy.src = 'assets/happy.png';

const animConfig = {
  walking: { img: sprites.walking, frames: 12, cols: 6, rows: 2, speed: 0.15 },
  sleeping: { img: sprites.sleeping, frames: 7, cols: 7, rows: 1, speed: 0.05 },
  licking: { img: sprites.grooming, frames: 9, cols: 9, rows: 1, speed: 0.1 },
  happy: { img: sprites.happy, frames: 6, cols: 6, rows: 1, speed: 0.12 },
  idle: { img: sprites.grooming, frames: 1, cols: 9, rows: 1, speed: 0 } // Fallback to grooming frame 0 for idle
};

function drawCat(x,y){
  const mood = zoomie.mood;
  
  // Map moods to our spritesheets
  let activeAnimName = mood;
  if (mood === 'sleepy') activeAnimName = 'sleeping'; // sleepy uses sleeping anim
  if (mood === 'curious') activeAnimName = 'happy'; 
  if (!animConfig[activeAnimName]) activeAnimName = 'idle';

  const anim = animConfig[activeAnimName];
  if(!anim.img.complete || anim.img.naturalWidth === 0) return;

  const s = zoomie.size * 1.5; // Scaled up slightly because sprites usually have padding
  
  // Update frame counter
  if (!zoomie.currentFrame) zoomie.currentFrame = 0;
  
  if (mood === 'idle' || mood === 'curious') {
    zoomie.currentFrame = 0; // Static for idle
  } else {
    zoomie.currentFrame += anim.speed;
    if (zoomie.currentFrame >= anim.frames) {
       zoomie.currentFrame = 0; // Loop animation
    }
  }

  const cols = anim.cols || anim.frames;
  const rows = anim.rows || 1;
  const frameW = anim.img.width / cols;
  const frameH = anim.img.height / rows;
  
  const frameIndex = Math.floor(zoomie.currentFrame) % anim.frames;
  const colIndex = frameIndex % cols;
  const rowIndex = Math.floor(frameIndex / cols);

  ctx.save();
  ctx.translate(x, y);

  if(!zoomie.facingRight){ ctx.scale(-1,1); }

  // Draw specific slice of the sprite sheet
  ctx.drawImage(
    anim.img,
    colIndex * frameW, rowIndex * frameH, frameW, frameH, // Source slice
    -s/2, -s, s, s * (frameH/frameW) // Destination
  );

  // Z's for sleeping/sleepy
  if(mood === 'sleeping' || mood === 'sleepy'){
    ctx.globalAlpha=0.8;
    ctx.fillStyle='rgba(180,160,255,0.85)';
    ctx.font=`${s*0.3}px Georgia`; ctx.fillText('z',s*0.2,-s*0.8);
    ctx.font=`${s*0.2}px Georgia`; ctx.fillText('z',s*0.4,-s*1.0);
    ctx.globalAlpha=1;
  }
  
  ctx.restore();

  // Target indicator
  if(zoomie.isMoving){
    ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle='#a8c8ff';
    ctx.beginPath(); ctx.arc(zoomie.targetX,zoomie.targetY,8,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}

const BED_X=()=>canvas.width*0.33;
const BED_Y=()=>canvas.height*0.87;

function update(){
  zoomie.x=lerp(zoomie.x,zoomie.targetX,zoomie.speed);
  zoomie.y=lerp(zoomie.y,zoomie.targetY,zoomie.speed);
  const distTarget=Math.hypot(zoomie.targetX-zoomie.x,zoomie.targetY-zoomie.y);
  const distMouse=Math.hypot(mouse.x-zoomie.x,mouse.y-zoomie.y);
  const now=Date.now();

  if(zoomie.isMoving){
    zoomie.mood='walking'; zoomie.tailWagging=false;
    zoomie.walkCycle+=zoomie.walkSpeed;
    if(zoomie.x>zoomie.targetX) zoomie.facingRight=false; else zoomie.facingRight=true;
    if(distTarget<4){
      zoomie.isMoving=false; zoomie.walkCycle=0;
      zoomie.lastArrivalTime=now; zoomie.mood='idle';
    }
  } else if(distMouse<75){
    zoomie.mood='happy'; zoomie.tailWagging=true; zoomie.lastInteractionTime=now;
  } else if(distMouse<180){
    zoomie.mood='curious'; zoomie.tailWagging=false; zoomie.lastInteractionTime=now;
  } else {
    const idle=now-zoomie.lastInteractionTime;
    if(idle>14000){
      const bx=BED_X(),by=BED_Y();
      if(Math.hypot(zoomie.x-bx,zoomie.y-by)>10){
        zoomie.targetX=bx; zoomie.targetY=by; zoomie.isMoving=true;
      } else {
        zoomie.mood='sleeping'; zoomie.tailWagging=false;
        if(now-zoomie.lastPurrTime>3000){ playPurr(); zoomie.lastPurrTime=now; }
      }
    } else if(idle>7000){
      if(zoomie.mood!=='licking') zoomie.lickCycle=0;
      zoomie.mood='licking'; zoomie.lickCycle+=0.06; zoomie.tailWagging=false;
    } else if(idle>4000){
      zoomie.mood='sleepy'; zoomie.tailWagging=false;
    } else {
      zoomie.mood='idle'; zoomie.tailWagging=false;
    }
  }
  if(zoomie.isMoving&&zoomie.mood==='licking') zoomie.lickCycle=0;

  // Update particles
  rainDrops.forEach(r=>r.update());
  glassDrops.forEach(g=>g.update());

  moodLabel.textContent={
    walking:'🐾 zoomie is walking...',
    happy:'😻 zoomie is happy!!',
    curious:'😺 zoomie is curious',
    idle:'🖤 zoomie is chilling',
    sleepy:'😴 zoomie is sleepy...',
    licking:'🐱 zoomie is grooming',
    sleeping:'💤 zoomie is sleeping~'
  }[zoomie.mood]||'🖤';
}

function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  drawCat(zoomie.x,zoomie.y);
  update();
  requestAnimationFrame(gameLoop);
}

gameLoop();
