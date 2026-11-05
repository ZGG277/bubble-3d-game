(function(){
// Pure camera-relative scenery: no clock drift, no gameplay mutations.
const SKY_RATE=.28,TERRAIN_RATE=.56;
const CLOUD_LAYERS=[{rate:.44,spacing:360,size:.72,alpha:.27},{rate:.88,spacing:470,size:1.05,alpha:.42}];
const positiveModulo=(x,m)=>((x%m)+m)%m;
function skyTiles(camera,height=780){const period=height*2,offset=positiveModulo(Math.max(0,-camera)*SKY_RATE,period);return[offset-period,offset]}
function cloudPlacements(camera,layer,height=780){const p=CLOUD_LAYERS[layer],shift=Math.max(0,-camera)*p.rate,start=Math.floor((-180-shift)/p.spacing),end=Math.ceil((height+180-shift)/p.spacing),out=[];for(let id=start;id<=end;id++){const seed=Math.sin(id*31.17+layer*19.4)*43758.5453,v=seed-Math.floor(seed);out.push({id,x:id%2===0?22+v*75:285+v*65,y:id*p.spacing+shift,scale:p.size*(.83+.28*v),alpha:p.alpha})}return out}
class Scenery{
 constructor(){this.ready=false;this.tile=new Image();this.plate=new Image();this.cloud=new Image();this.tile.src='./tile.webp';this.plate.src='./plate.png';this.cloud.src='./cloud.png';}
 prepare(){this.ready=[this.tile,this.plate,this.cloud].every(im=>im.complete&&im.naturalWidth>0);return this.ready;}
 draw(ctx,camera){ctx.save();const grad=ctx.createLinearGradient(0,0,0,780);grad.addColorStop(0,'#a3cbe4');grad.addColorStop(1,'#dce8ed');ctx.fillStyle=grad;ctx.fillRect(0,0,390,780);if(!this.ready&&!this.prepare()){ctx.restore();return;}
 // Mirrored sky texture joins at identical source rows, with no exposed canvas.
 for(const y of skyTiles(camera))ctx.drawImage(this.tile,0,y,390,1560);
 // The village/hill scene leaves once. It never repeats above the clouds.
 const groundY=Math.max(0,-camera)*TERRAIN_RATE;if(groundY<780)ctx.drawImage(this.plate,0,groundY);
 for(let l=0;l<CLOUD_LAYERS.length;l++)for(const p of cloudPlacements(camera,l)){ctx.globalAlpha=p.alpha;ctx.drawImage(this.cloud,p.x-110*p.scale,p.y-50*p.scale,220*p.scale,100*p.scale)}ctx.restore();}
}

window.BubbleModules=Object.assign(window.BubbleModules||{}, {Scenery,skyTiles,cloudPlacements});
})();
