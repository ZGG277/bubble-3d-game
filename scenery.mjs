// Pure camera-relative scenery: no clock drift, no gameplay mutations.
export const SKY_RATE=.28,TERRAIN_RATE=.56;
export const CLOUD_LAYERS=[{rate:.44,spacing:360,size:.72,alpha:.27},{rate:.88,spacing:470,size:1.05,alpha:.42}];
const positiveModulo=(x,m)=>((x%m)+m)%m;
export function skyTiles(camera,height=780){const period=height*2,offset=positiveModulo(Math.max(0,-camera)*SKY_RATE,period);return[offset-period,offset]}
export function cloudPlacements(camera,layer,height=780){const p=CLOUD_LAYERS[layer],shift=Math.max(0,-camera)*p.rate,start=Math.floor((-180-shift)/p.spacing),end=Math.ceil((height+180-shift)/p.spacing),out=[];for(let id=start;id<=end;id++){const seed=Math.sin(id*31.17+layer*19.4)*43758.5453,v=seed-Math.floor(seed);out.push({id,x:id%2===0?22+v*75:285+v*65,y:id*p.spacing+shift,scale:p.size*(.83+.28*v),alpha:p.alpha})}return out}
export class Scenery{
 constructor(image,makeCanvas=()=>document.createElement('canvas')){this.image=image;this.makeCanvas=makeCanvas;this.ready=false;}
 prepare(){const im=this.image,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!w||!h||im.complete===false)return false;const tile=this.makeCanvas();tile.width=390;tile.height=1560;const t=tile.getContext('2d');t.drawImage(im,0,0,w,h*.58,0,0,390,780);t.save();t.translate(0,1560);t.scale(1,-1);t.drawImage(im,0,0,w,h*.58,0,0,390,780);t.restore();this.tile=tile;
 const plate=this.makeCanvas();plate.width=390;plate.height=780;const p=plate.getContext('2d');p.drawImage(im,0,0,390,780);p.globalCompositeOperation='destination-in';const fade=p.createLinearGradient(0,0,0,170);fade.addColorStop(0,'#fff0');fade.addColorStop(1,'#ffff');p.fillStyle=fade;p.fillRect(0,0,390,780);this.plate=plate;
 const cloud=this.makeCanvas();cloud.width=220;cloud.height=100;const c=cloud.getContext('2d');for(let j=0;j<4;j++){c.fillStyle=['#cad8e2','#ede6ed','#faf8ed','#fffdf3'][j];c.beginPath();for(const [x,y,r] of [[30,65,24],[62,48,31],[96,34,32],[133,43,35],[171,56,28],[191,69,18]]){c.moveTo(x+r-j,y+j*1.3);c.arc(x,y+j*1.3,r-j,0,Math.PI*2)}c.fill()}c.globalCompositeOperation='destination-in';const edge=c.createLinearGradient(0,40,0,100);edge.addColorStop(0,'#ffff');edge.addColorStop(.8,'rgba(255,255,255,.72)');edge.addColorStop(1,'#fff0');c.fillStyle=edge;c.fillRect(0,0,220,100);this.cloud=cloud;this.ready=true;return true;}
 draw(ctx,camera){ctx.save();const grad=ctx.createLinearGradient(0,0,0,780);grad.addColorStop(0,'#a3cbe4');grad.addColorStop(1,'#dce8ed');ctx.fillStyle=grad;ctx.fillRect(0,0,390,780);if(!this.ready&&!this.prepare()){ctx.restore();return;}
 // Mirrored sky texture joins at identical source rows, with no exposed canvas.
 for(const y of skyTiles(camera))ctx.drawImage(this.tile,0,y,390,1560);
 // The village/hill scene leaves once. It never repeats above the clouds.
 const groundY=Math.max(0,-camera)*TERRAIN_RATE;if(groundY<780)ctx.drawImage(this.plate,0,groundY);
 for(let l=0;l<CLOUD_LAYERS.length;l++)for(const p of cloudPlacements(camera,l)){ctx.globalAlpha=p.alpha;ctx.drawImage(this.cloud,p.x-110*p.scale,p.y-50*p.scale,220*p.scale,100*p.scale)}ctx.restore();}
}
