(function(){
'use strict';
// Short CC0 field recordings are bundled as bounded PCM samples, not media URLs.
function Ambience(){this.audio=null;this.wind=null;this.bus=null;this.birdsBus=null;this.buffers={};this.seen={};this.nextBirdAt=0;this.lastBirdAt=-10;this.lastVariant=-1;this.duckUntil=0;this.playing=[];this.previewUntil=0;}
Ambience.prototype.attach=function(audio){
 if(this.audio||!audio)return;
 try{this.audio=audio;this.bus=audio.createGain();this.bus.gain.value=0;this.bus.connect(audio.destination);this.birdsBus=audio.createGain();this.birdsBus.gain.value=.55;this.birdsBus.connect(this.bus);
 const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*2),audio.sampleRate),data=buffer.getChannelData(0);let smooth=0;
 for(let i=0;i<data.length;i++){smooth=(smooth+.07*(Math.random()*2-1))/1.07;data[i]=smooth*3;}
 const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=350;gain.gain.value=0;src.connect(filter);filter.connect(gain);gain.connect(this.bus);src.start();this.wind={src,filter,gain};
 }catch(error){this.audio=null;this.wind=null;}
};
Ambience.prototype.quiet=function(){this.previewUntil=0;if(this.audio&&this.bus){const t=this.audio.currentTime;this.bus.gain.cancelScheduledValues(t);this.bus.gain.setValueAtTime(0,t);this.playing.slice().forEach(src=>{try{src.stop()}catch(error){}});this.playing=[];this.seen={};this.nextBirdAt=0;}};
Ambience.prototype.reset=function(){this.quiet();this.lastBirdAt=-10;this.lastVariant=-1;};
Ambience.prototype.getBuffer=function(index){
 if(this.buffers[index])return this.buffers[index];
 const sample=window.BubbleBirdSamples&&window.BubbleBirdSamples[index];if(!sample)return null;
 const raw=atob(sample.pcm16),n=raw.length/2,buffer=this.audio.createBuffer(1,n,sample.rate),out=buffer.getChannelData(0);
 for(let i=0;i<n;i++){let value=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);if(value>32767)value-=65536;out[i]=value/32768;}
 this.buffers[index]=buffer;return buffer;
};
Ambience.prototype.chirp=function(){
 const a=this.audio,bank=window.BubbleBirdSamples;if(!a||a.state!=='running'||!this.birdsBus)return false;
 try{let index=-1;
 if(bank&&bank.length){index=Math.floor(Math.random()*bank.length);if(index===this.lastVariant&&bank.length>1)index=(index+1+Math.floor(Math.random()*(bank.length-1)))%bank.length;}
 let buffer=null;try{buffer=index>=0?this.getBuffer(index):null;}catch(error){buffer=null;}
 if(buffer){const src=a.createBufferSource();src.buffer=buffer;src.connect(this.birdsBus);this.playing.push(src);src.onended=()=>{src.disconnect();this.playing=this.playing.filter(s=>s!==src)};src.start();this.duckUntil=a.currentTime+buffer.duration;this.lastVariant=index;}
 else{ // Capability/data fallback: louder varied warble, not a network request.
  for(let i=0;i<4;i++){const t=a.currentTime+i*.14,o=a.createOscillator(),v=a.createGain();o.type='sine';o.frequency.setValueAtTime(1500+i*220,t);o.frequency.exponentialRampToValueAtTime(2700-i*120,t+.06);o.frequency.exponentialRampToValueAtTime(1400+i*130,t+.13);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(.12,t+.025);v.gain.exponentialRampToValueAtTime(.0001,t+.13);o.connect(v);v.connect(this.birdsBus);o.onended=()=>{o.disconnect();v.disconnect();this.playing=this.playing.filter(s=>s!==o)};o.start(t);o.stop(t+.14);this.playing.push(o);}this.duckUntil=a.currentTime+.6;
 }
 this.lastBirdAt=a.currentTime;return true;
 }catch(error){return false;}
};
Ambience.prototype.preview=function(){if(!this.audio||this.audio.state!=='running')return false;this.bus.gain.setValueAtTime(1,this.audio.currentTime);this.wind.gain.gain.setValueAtTime(0,this.audio.currentTime);const played=this.chirp();this.previewUntil=this.audio.currentTime+2.2;return played;};
Ambience.prototype.update=function(wind,active,visibleBirds){
 const a=this.audio;if(!a||!this.wind)return;
 try{const t=a.currentTime,level=Math.max(0,Math.min(1,wind));
 if(!active&&t<this.previewUntil&&a.state==='running')return;
 if(!active||a.state!=='running'){this.quiet();return;}
 this.bus.gain.setTargetAtTime(1,t,.025);this.wind.gain.gain.setTargetAtTime(level*(t<this.duckUntil ? .07 : .28),t,.08);this.wind.filter.frequency.setTargetAtTime(300+level*1500,t,.12);
 if(!visibleBirds.length){this.seen={};this.nextBirdAt=0;return;}
 const fresh=visibleBirds.some(id=>!this.seen[id]);
 if((fresh||t>=this.nextBirdAt)&&t-this.lastBirdAt>=1.2){if(this.chirp()){const next={};visibleBirds.forEach(id=>{next[id]=true});this.seen=next;this.nextBirdAt=t+3.2+Math.random()*2.3;}}
 }catch(error){this.quiet();}
};
window.BubbleAmbience=Ambience;
})();
