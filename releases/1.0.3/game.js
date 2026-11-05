(function(){
const {Scenery,Bubble3D,Game,Input,W,H,SAFE_R,MAX_R,MIN_R,bird,RIM,POST,rimPoints}=window.BubbleModules;
const rewardImage=new Image();rewardImage.src='rainbow.svg';
const scenery=new Scenery();
const $=s=>document.querySelector(s),c=$('#game'),ctx=c.getContext('2d'),g=new Game(),input=new Input(g);let bubbleMesh=null,meshError='',frameDt=0,meshImpulse=0,best=0,particles=[],coinFlights=[],ringFlights=[],boostGlow=0,last=0,paused=false,shown=false,audio=null,keyFan=false,previousPhase='ready',windTipUntil=0,birdTipUntil=0,birdTipShown=false,popElapsed=0,popX=0,popY=0,popRadius=0;
function useFallback(){if(bubbleMesh){bubbleMesh.dispose();bubbleMesh=null}$('#bubble3d').style.display='none';meshError='';}
try{bubbleMesh=new Bubble3D($('#bubble3d'),{onStatus:({status})=>{if(status==='context-lost'||status==='error'){setTimeout(useFallback,0)}}})}catch(error){useFallback()}

window.BubblePlatform.loadBest().then(value=>{best=Math.max(best,value);$('#best').textContent=String(best)});
function resize(){window.BubblePlatform.fitStage();let d=Math.min(devicePixelRatio||1,1.5);c.width=Math.round(W*d);c.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);cancelInput();last=0}addEventListener('resize',resize);
const ambience=new window.BubbleAmbience();
let flightShots=[],shotBytes=0,lastShotAge=-10;
const shareHero=new Image();shareHero.src='./share-hero.jpg';
function unlock(){if(!audio){try{audio=new(window.AudioContext||window.webkitAudioContext)()}catch(error){}}if(audio && audio.state==='suspended')audio.resume().catch(()=>{});ambience.attach(audio)}
function tone(f=500,d=.14){if(!audio||!$('#sound').checked)return;let o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.55,audio.currentTime+d);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
function point(e){let r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
c.addEventListener('pointerdown',e=>{e.preventDefault();unlock();if(meshError||paused||!$('#panel').hidden||e.button>0)return;const p=point(e);if(input.down(e.pointerId,p.x,p.y)){if(c.setPointerCapture)c.setPointerCapture(e.pointerId);$('#hint').style.opacity=0}});
c.addEventListener('pointermove',e=>{const p=point(e);const prev=g.phase;input.move(e.pointerId,p.x,p.y);if(prev==='inflate'&&g.phase==='float')tone(650)});
c.addEventListener('pointerup',e=>{const prev=g.phase;input.up(e.pointerId);if(prev==='inflate'&&g.phase==='float')tone(650)});
function cancelInput(){input.cancel();keyFan=false}
c.addEventListener('pointercancel',cancelInput);c.addEventListener('lostpointercapture',e=>{if(e.pointerId===input.id)cancelInput()});
function pause(){ambience.quiet();cancelInput();if(g.phase==='float'||g.phase==='inflate'){paused=true;$('#paused').hidden=false}last=0}
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();cancelAnimationFrame(raf);raf=0;if(audio)audio.suspend().catch(()=>{})}else{last=0;if(!raf)raf=requestAnimationFrame(frame)}});
$('#resume').onclick=()=>{paused=false;last=0;$('#paused').hidden=true;unlock()};
$('#settings').onclick=()=>{pause();$('#panel').hidden=false};$('#close-settings').addEventListener('click',()=>{$('#panel').hidden=true;last=0});
function reset(){ambience.reset();flightShots=[];shotBytes=0;lastShotAge=-10;$('#share-status').textContent='';cancelInput();g.reset();if(bubbleMesh)bubbleMesh.reset();particles=[];coinFlights=[];ringFlights=[];boostGlow=0;shown=false;paused=false;$('#paused').hidden=true;$('#result').hidden=true;$('#hint').innerHTML='按住，吹一个泡泡<span>松手放飞 · 别太贪心</span>';$('#hint').style.opacity=1;last=0;previousPhase='ready';windTipUntil=0;birdTipUntil=0;birdTipShown=false;popElapsed=0;$('#bird-advice').hidden=true}
$('#test-bird').addEventListener('click',async function(){
 const status=$('#audio-status');if(!$('#sound').checked){status.textContent='请先打开轻音效';return;}
 unlock();if(!audio){status.textContent='当前环境不支持声音，仍可正常游玩';return;}
 try{if(audio.state!=='running')await audio.resume();status.textContent=ambience.preview()?'正在试听；若无声，请检查媒体音量与静音设置':'声音尚未启用，请再点一次试听';}catch(error){status.textContent='声音未启用，请检查媒体音量后再试';}
});
$('#sound').addEventListener('change',()=>{if(!$('#sound').checked)ambience.quiet()});
$('#again').onclick=()=>{unlock();reset()};
addEventListener('keydown',e=>{if(meshError||!$('#panel').hidden||paused||(document.activeElement && document.activeElement.tagName)==='BUTTON'||(document.activeElement && document.activeElement.tagName)==='INPUT')return;if(['Space','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat&&e.code==='Space')return;unlock();if(e.code==='Space'){if(g.phase==='ready'){input.down('keyboard',195,400);$('#hint').style.opacity=0}else if(g.phase==='float')keyFan=true}if(g.phase==='float'&&e.code.startsWith('Arrow'))g.fanTarget=Math.max(25,Math.min(W-25,g.fanTarget+(e.code==='ArrowLeft'?-24:24)))});
addEventListener('keyup',e=>{if(e.code==='Space'){input.up('keyboard');keyFan=false}});
function popSound(){if(!audio||!$('#sound').checked)return;try{const n=Math.floor(audio.sampleRate*.14),buffer=audio.createBuffer(1,n,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n)**2;const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();filter.type='bandpass';filter.frequency.value=1450;gain.gain.setValueAtTime(.14,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.14);src.buffer=buffer;src.connect(filter);filter.connect(gain);gain.connect(audio.destination);src.start();src.stop(audio.currentTime+.14);tone(850,.12)}catch(error){tone(450,.15)}}
function pop(){ambience.quiet();shown=true;popElapsed=0;popX=g.x;popY=g.y-g.camera;popRadius=g.r;cancelInput();for(let i=0;i<64;i++){let a=i/64*Math.PI*2;particles.push({x:popX+Math.cos(a)*popRadius*.7,y:popY+Math.sin(a)*popRadius*.7,vx:Math.cos(a)*(55+Math.random()*150),vy:Math.sin(a)*(55+Math.random()*150),life:.65+Math.random()*.55,size:2+Math.random()*4,color:`hsla(${i*13},80%,82%,`})}popSound();if(g.coins>best){best=g.coins;window.BubblePlatform.saveBest(best);}$('#best').textContent=String(best);$('#final-count').textContent=String(g.coins);$('#breakdown').textContent=`飞行 ${Math.floor(g.height)} 米`;$('#bird-advice').hidden=g.reason!=='bird';}

function celebrate(e){if(g.coins>best){best=g.coins;window.BubblePlatform.saveBest(best);}tone(950,.22);meshImpulse=e.impulse||0;boostGlow=1;ringFlights.push({x:e.x,y:e.y,half:e.half,age:0});coinFlights.push({x:e.x,y:e.y-g.camera,age:0})}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function draw(){const t=g.time;scenery.draw(ctx,g.camera);
 // Sunlight is atmospheric and never obscures collision edges.
 let sun=ctx.createRadialGradient(15,25,2,15,25,220);sun.addColorStop(0,'rgba(255,255,245,.48)');sun.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sun;ctx.fillRect(0,0,W,250);
 const floating=g.phase==='float';
 if(floating&&boostGlow>0){const by=g.y-g.camera;for(let i=0;i<10;i++){const side=i%2?1:-1,x=g.x+side*(g.r+12+(i%5)*10),y=by+15+((t*240+i*41)%180);ctx.strokeStyle=`rgba(255,250,225,${boostGlow*.65})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+30+boostGlow*35);ctx.stroke()}ctx.save();ctx.globalAlpha=boostGlow*.3;ctx.strokeStyle='#b0e7ed';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(g.x,by+g.r+12,g.r*.8,12,0,0,Math.PI*2);ctx.stroke();ctx.restore()}

 // Continuous concentric color bands follow the entire circumference of the loop.
 for(const q of g.gates){const y=q.y-g.camera;if(y<-100||y>H+100||q.passed)continue;
 ctx.save();const rx=(q.half+RIM)/Math.cos(.45),ry=POST/Math.sin(.45);
 const bands=['rgba(208,115,116,.53)','rgba(229,155,118,.53)','rgba(234,205,145,.53)','rgba(181,204,158,.53)','rgba(137,181,201,.53)','rgba(158,160,205,.53)','rgba(193,158,196,.53)'];ctx.shadowBlur=0;
 ctx.globalAlpha=q.passed ? .35 : .85;for(let k=0;k<bands.length;k++){const offset=7.5-k*2.5;ctx.lineWidth=2.5;ctx.strokeStyle=bands[k];ctx.beginPath();ctx.ellipse(q.x,y,rx+offset,ry+offset,0,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;
 // A moving broad translucent sheen creates a wet, glassy surface.
 ctx.shadowBlur=0;ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(q.x,y-2,rx,ry-1,0,Math.PI*1.07,Math.PI*1.92);ctx.stroke();
 for(let k=0;k<8;k++){let a=t*.5+k*Math.PI*2/8+q.id;let x=q.x+Math.cos(a)*rx,yy=y+Math.sin(a)*ry,shine=.3+.6*(.5+.5*Math.sin(t*4+k*1.7));ctx.fillStyle=`rgba(255,255,255,${shine})`;ctx.fillRect(x-1,yy-4,2,8);ctx.fillRect(x-4,yy-1,8,2)}ctx.restore()}
 for(const q of g.gates){if(q.id>=4&&q.id%3===1){const b=bird(q.id,g.age,q.y),y=b.y-g.camera;if(y<-40||y>H+40)continue;const wing=Math.sin(g.age*9+q.id)*5;ctx.save();ctx.translate(b.x,y);ellipse(0,3,12,7,'#eef6fa');ellipse(-2,0,11,6,'#78a3bd');ellipse(8,-4,6,6,'#98b6c8');ellipse(10,-5,1.3,1.3,'#23394e');ctx.fillStyle='#dfa263';ctx.beginPath();ctx.moveTo(13,-4);ctx.lineTo(18,-2);ctx.lineTo(13,0);ctx.fill();ctx.fillStyle='#dcecf3';ctx.strokeStyle='#78abc6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,1);ctx.quadraticCurveTo(-16,-19+wing,-19,-12+wing);ctx.quadraticCurveTo(-16,-3,-3,1);ctx.fill();ctx.stroke();ctx.restore()}}
 if(floating){const gap=Math.min(g.x-g.r,W-g.x-g.r);if(gap<50){ctx.strokeStyle=`rgba(211,103,65,${(1-gap/50)*.5})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(2,H);ctx.moveTo(W-2,0);ctx.lineTo(W-2,H);ctx.stroke()}}
 // Fixed bottom fan; the world moves, the player's control stays under their thumb.
 const fx=floating?g.fanX:W/2,wind=g.wind;const lane=ctx.createLinearGradient(0,650,0,H);lane.addColorStop(0,'rgba(188,234,255,0.0)');lane.addColorStop(1,'rgba(216,243,255,0.333333)');ctx.fillStyle=lane;ctx.fillRect(0,650,W,130);
 ctx.strokeStyle='rgba(138,162,156,0.333333)';ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(38,674);ctx.lineTo(W-38,674);ctx.stroke();ctx.setLineDash([]);
 if(wind>.02)for(let i=0;i<9;i++){let a=(t*1.1+i*.13)%1,yy=699-a*440;ctx.strokeStyle=`rgba(255,255,239,${wind*(1-a)*.6})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fx+(i-4)*(6+a*18),yy);ctx.quadraticCurveTo(fx+(i-4)*(12+a*17),yy-25,fx+(i-4)*(14+a*20),yy-50);ctx.stroke()}
 ctx.save();ctx.translate(fx,719);let handle=ctx.createLinearGradient(-8,0,8,0);handle.addColorStop(0,'#a1b5bf');handle.addColorStop(.45,'#fbf6e9');handle.addColorStop(1,'#91aabb');ctx.fillStyle=handle;ctx.beginPath();roundRect(ctx,-7,0,14,36,5);ctx.fill();ctx.beginPath();ctx.arc(0,-5,25,0,Math.PI*2);ctx.fillStyle='#f5f0de';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#9aacb5';ctx.stroke();ctx.save();ctx.translate(0,-5);ctx.rotate(t*(wind>0?8:.3));for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);ctx.fillStyle='rgba(171,194,202,0.6)';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(16,-14,18,-5);ctx.quadraticCurveTo(15,2,0,0);ctx.fill()}ctx.restore();ctx.strokeStyle='#a6c7df';ctx.lineWidth=.8;for(let i=0;i<12;i++){let a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(Math.cos(a)*23,Math.sin(a)*23-5);ctx.stroke()}ellipse(0,-5,5,5,'#eaf7ff');ctx.restore();
 if(g.phase==='ready'||g.phase==='inflate'){ctx.strokeStyle='#ab8e59';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(W/2,638);ctx.lineTo(W/2,590);ctx.stroke();ctx.beginPath();ctx.ellipse(W/2,585,19,6,0,0,Math.PI*2);ctx.stroke()}
 // Foreground arc echoes the same layered rainbow as the bubble crosses.
 if(g.phase==='float')for(const q of g.gates){const yy=q.y-g.camera,by=g.y-g.camera;if(!q.passed&&Math.abs(by-yy)<g.r+POST){ctx.save();ctx.globalAlpha=.22;const rx=(q.half+RIM)/Math.cos(.45),ry=POST/Math.sin(.45),bands=['#ff8eaa','#ffc48c','#fff09f','#a1efbe','#80dfff','#b4a8f7','#f0b0f8'];for(let k=0;k<bands.length;k++){ctx.lineWidth=19-k*2.5;ctx.strokeStyle=bands[k];ctx.beginPath();ctx.ellipse(q.x,yy,rx,ry,0,0,Math.PI);ctx.stroke()}ctx.restore()}}
 for(const f of ringFlights){const a=Math.min(1,f.age/.65),ease=1-(1-a)**3,x=f.x+(g.x-f.x)*ease,y=f.y-g.camera+(g.y+g.r+16-f.y)*ease,rx=(f.half+8)*(1-ease)+g.r*.35*ease,ry=44*(1-ease)+5*ease;ctx.save();ctx.globalAlpha=(1-a)*.8;for(let k=0;k<7;k++){ctx.strokeStyle=['#df9e9f','#edba8f','#eee0a2','#b9d2a8','#9dcbd8','#b2b5de','#d3b1d7'][k];ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(x,y,Math.max(2,rx-k*1.4),Math.max(2,ry-k*.6),0,0,Math.PI*2);ctx.stroke()}ctx.restore()}
 for(const p of particles){const r=p.size||1.8;ellipse(p.x,p.y,r,r*.7,p.color+Math.max(0,Math.min(1,p.life))+')')}
 // The same crayon rainbow artwork flies to the matching counter.
 for(const f of coinFlights){const a=Math.min(1,f.age/.7),k=1-(1-a)**3;const x=f.x+(43-f.x)*k,y=f.y+(60-f.y)*k,sz=28*(1-a*.3);if(rewardImage.complete&&(rewardImage.naturalWidth||rewardImage.width))ctx.drawImage(rewardImage,x-sz/2,y-sz/2,sz,sz*.75)}
 // A bright expanding rim makes every kind of collision visibly burst.
 if(g.phase==='pop'&&shown&&popElapsed<.65){const p=popElapsed/.65;ctx.save();ctx.globalAlpha=(1-p)*.9;ctx.lineWidth=2+4*(1-p);ctx.strokeStyle='#fffdf1';ctx.beginPath();ctx.arc(popX,popY,popRadius*(.65+p*.75),0,Math.PI*2);ctx.stroke();ctx.restore()}
 if(!bubbleMesh&&g.phase!=='pop'){const y=g.y-g.camera;let fill=ctx.createRadialGradient(g.x-g.r*.3,y-g.r*.3,1,g.x,y,g.r);fill.addColorStop(0,'rgba(255,255,255,.7)');fill.addColorStop(.7,'rgba(188,218,255,.12)');fill.addColorStop(1,'rgba(230,163,217,.65)');ellipse(g.x,y,g.r,g.r,fill);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.stroke()}if(bubbleMesh){bubbleMesh.render({x:g.x,y:g.y-g.camera,r:g.r,wind:g.wind,forceX:g.phase==='float'?g.forceX:0,forceY:g.phase==='float'?g.forceY:0,impulse:meshImpulse,visible:g.phase!=='pop',time:g.time},frameDt);meshImpulse=0}if(meshError)$('#hint').textContent=meshError;
 captureFlight();
 $('#score').textContent=String(g.coins);$('#best').textContent=String(best);$('#height').textContent=Math.floor(g.height)+' m';$('#readout').textContent=g.phase==='float'&&g.time<birdTipUntil?'松开或吹风，调整速度躲避小鸟':g.phase==='float'&&g.time<windTipUntil?'按住底部吹风':'';
}
let raf=0,slowFrames=0;
function frame(now){raf=0;if(document.hidden)return;if(last&&now-last>45){slowFrames++}else{slowFrames=Math.max(0,slowFrames-1)}if(bubbleMesh&&slowFrames>90){if(!bubbleMesh.lowQuality){bubbleMesh.lowQuality=true;slowFrames=0}else{useFallback();slowFrames=0}}let dt=last?Math.min((now-last)/1000,.1):0;last=now;frameDt=(!paused&&!document.hidden&&$('#panel').hidden)?dt:0;if(!paused&&!document.hidden&&$('#panel').hidden){boostGlow=Math.max(0,boostGlow-dt*.65);g.step(dt,input.fan||keyFan);if(previousPhase!=='float'&&g.phase==='float')windTipUntil=g.time+3;if(g.phase==='float'&&!birdTipShown&&g.gates.some(q=>q.id>=4&&q.id%3===1&&q.y-140-g.camera>-30&&q.y-140-g.camera<H*.55)){birdTipShown=true;birdTipUntil=g.time+3.5}previousPhase=g.phase;for(const e of g.events.splice(0))celebrate(e);for(const f of ringFlights)f.age+=dt;ringFlights=ringFlights.filter(f=>f.age<.65);for(const f of coinFlights)f.age+=dt;coinFlights=coinFlights.filter(f=>f.age<.7);if(g.phase==='pop'&&!shown)pop();if(g.phase==='pop'&&shown){popElapsed+=dt;if(popElapsed>=.85)$('#result').hidden=false}for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}const visibleBirds=g.gates.filter(q=>q.id>=4&&q.id%3===1&&bird(q.id,g.age,q.y).y-g.camera>=-40&&bird(q.id,g.age,q.y).y-g.camera<=H+40).map(q=>q.id);ambience.update(g.wind,!paused&&!document.hidden&&$('#panel').hidden&&g.phase==='float'&&$('#sound').checked,visibleBirds);draw();raf=requestAnimationFrame(frame)}resize();raf=requestAnimationFrame(frame);


function captureFlight(){
 if(g.phase!=='float'||paused||flightShots.length>=2||g.age<.8||g.age-lastShotAge<3)return;
 if(flightShots.length===1&&g.coins===0&&g.age<7)return;
 try{
  // Read the visible WebGL layer immediately after its render, before buffer disposal.
  if(bubbleMesh){ctx.save();ctx.drawImage($('#bubble3d'),0,0,W,H);ctx.restore();}
  const image=c.toDataURL('image/jpeg',.78);
  if(image.length<750000&&shotBytes+image.length<1400000){flightShots.push(image);shotBytes+=image.length;}
  lastShotAge=g.age;
 }catch(error){lastShotAge=g.age;}
}

let sharing=false;
$('#share').addEventListener('click',async function(){
 if(sharing||g.phase!=='pop'||$('#result').hidden)return;
 const mini=window.xhs&&window.xhs.miniTool,status=$('#share-status');
 if(!mini||typeof mini.postNote!=='function'){status.textContent='请在支持分享的小红书 App 中打开';return;}
 sharing=true;$('#share').disabled=true;$('#again').disabled=true;status.textContent='正在生成分享笔记…';ambience.quiet();
 try{
  // Render the share card on the existing on-screen Canvas, then restore it.
  // No extra offscreen canvas, album write, file permission, or silent publish.
  draw();ctx.save();ctx.fillStyle='rgba(255,249,234,.96)';ctx.fillRect(35,230,320,300);ctx.textAlign='center';ctx.fillStyle='#745e55';ctx.font='600 28px sans-serif';ctx.fillText('泡泡上云端',W/2,286);if(rewardImage.complete)ctx.drawImage(rewardImage,154,310,82,62);ctx.font='600 32px sans-serif';ctx.fillText(String(g.coins)+' 道彩虹',W/2,415);ctx.font='20px sans-serif';ctx.fillText('飞行 '+Math.floor(g.height)+' 米',W/2,454);ctx.font='15px sans-serif';ctx.fillText('吹一个泡泡，把心事交给风',W/2,495);ctx.restore();
  const image=c.toDataURL('image/jpeg',.82);draw();
  if(image.length>1400000)throw new Error('share image too large');
  const pictures=flightShots.slice();pictures.push(image);
  let hasHero=false;
  if(shareHero.complete&&shareHero.naturalWidth){const oldW=c.width,oldH=c.height;try{c.width=576;c.height=864;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(shareHero,0,0,576,864);const hero=c.toDataURL('image/jpeg',.82);if(hero.length<1000000){pictures.unshift(hero);hasHero=true;}}catch(error){}finally{c.width=oldW;c.height=oldH;ctx.setTransform(oldW/W,0,0,oldH/H,0,0);draw();}}

  await mini.postNote({title:'回到童年，吹一个肥皂泡飞上天',content:'这次收集了 '+g.coins+' 道彩虹，飞行 '+Math.floor(g.height)+' 米。'+(hasHero?'首图是泡泡主题插画，后附本局画面与成绩。':'')+'\n#小红书小工具 #吹泡泡 #回到童年 #小游戏',pageType:'photo_publish',mediaInfo:{image_resources:pictures.map(url=>({url}))}});
  status.textContent='分享流程已结束';
 }catch(error){draw();status.textContent='未完成分享，可再次点击重试';}
 finally{sharing=false;$('#share').disabled=false;$('#again').disabled=false;}
});
function roundRect(ctx,x,y,w,h,r){ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

})();