import { FOOT, bodyBox, weaponPose, terrainHeight, createPlatforms } from './world.js?v=2';

const skins={fox:['#ed852f','#ffe3ad'],raccoon:['#888588','#e5dbd1'],rabbit:['#f5e4c7','#fff1d6'],owl:['#ad794e','#f3dcb0'],bear:['#b47843','#f3bf7a'],cat:['#a299b6','#f1e0dc']};
const frames={fox:[149,3,326,495,338],raccoon:[592,42,337,456,793],rabbit:[1110,2,277,502,1270],owl:[149,524,295,467,318],bear:[637,533,290,461,782],cat:[1094,524,339,469,1267]};
const sprites=new Map();
let assetPromise;
export function keyAtlasPixels(data) {
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],excess=Math.min(r,b)-g;
    if(excess>65 && r>110 && b>100){
      const coverage=Math.max(0,Math.min(1,(excess-65)/90));
      data[i+3]=Math.round(data[i+3]*(1-coverage));
      if(coverage<1){data[i]=Math.min(r,g+35);data[i+2]=Math.min(b,g+35);}
    }
  }
  return data;
}
// Key and crop the immutable production atlas once, never during a frame.
export function loadRetroAssets(){
  if(assetPromise)return assetPromise;
  assetPromise=new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const atlas=document.createElement('canvas');atlas.width=img.width;atlas.height=img.height;
        const ac=atlas.getContext('2d',{willReadFrequently:true});ac.drawImage(img,0,0);
        const pixels=ac.getImageData(0,0,img.width,img.height);keyAtlasPixels(pixels.data);ac.putImageData(pixels,0,0);
        for(const [id,[x,y,w,h,anchor]] of Object.entries(frames)){
          const sprite=document.createElement('canvas');sprite.width=Math.ceil(w/h*144);sprite.height=144;
          const sc=sprite.getContext('2d');sc.imageSmoothingQuality='high';sc.drawImage(atlas,x,y,w,h,0,0,sprite.width,144);
          sprites.set(id,{image:sprite,width:w/h*72,anchor:(anchor-x)/h*72});
        }
        resolve();
      }catch(error){reject(error);}
    };
    img.onerror=()=>reject(new Error('Karakter görselleri yüklenemedi.'));
    img.src=new URL('./assets/pets-flash-v3.png',import.meta.url).href;
  });
  return assetPromise;
}
export const palettes={
  sunset:{sky:['#94cddc','#f6deb0'],far:'#b3c5a0',near:'#8ca786',leaf:'#8db34e',light:'#c5d779',earth:'#b38558',rock:'#94714e',ink:'#514333',accent:'#efc66d'},
  mushroom:{sky:['#91b8b8','#d2dfbd'],far:'#9abaad',near:'#749a86',leaf:'#89ad65',light:'#c6d997',earth:'#aa8261',rock:'#82654f',ink:'#4a483a',accent:'#d99789'},
  aurora:{sky:['#889fbe','#d6e1df'],far:'#adbfc9',near:'#829eae',leaf:'#c5dfe0',light:'#f0eee0',earth:'#97a9ae',rock:'#788b96',ink:'#465562',accent:'#e6ce89'}
};
const ink='#442c1c';
function ellipse(c,color,x,y,rx,ry,outline=null,line=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=line;c.stroke();}}
function round(c,color,x,y,w,h,r=5,outline=null,line=2){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=line;c.stroke();}}
function path(c,color,points,outline=null,line=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=line;c.stroke();}}
export function drawBackdrop(c,arena,w=1280,h=720){
  const p=palettes[arena]||palettes.sunset;c.save();c.scale(w/1280,h/720);
  const sky=c.createLinearGradient(0,0,0,650);sky.addColorStop(0,p.sky[0]);sky.addColorStop(1,p.sky[1]);c.fillStyle=sky;c.fillRect(0,0,1280,720);
  ellipse(c,'#fff0ba',987,101,43,43);ellipse(c,'#ffedb155',987,101,53,53);
  c.globalAlpha=.6;
  for(const [x,y,s] of [[105,95,1],[373,164,.7],[725,66,.8],[1135,210,.6]]){
    c.save();c.translate(x,y);c.scale(s,s);ellipse(c,'#fff6df',0,0,58,16);ellipse(c,'#fff6df',-20,-12,29,23);ellipse(c,'#fff6df',20,-16,33,28);c.restore();
  }
  c.globalAlpha=1;
  for(let layer=0;layer<2;layer++){
    c.beginPath();c.moveTo(0,720);
    for(let x=0;x<=1280;x+=8)c.lineTo(x,440+layer*58-Math.sin(x*.005+layer)*45-Math.sin(x*.012)*22);
    c.lineTo(1280,720);c.closePath();c.fillStyle=layer?p.near:p.far;c.fill();
  }
  for(const [x,y,s] of [[54,454,1.1],[175,465,.7],[1118,471,.8],[1235,442,1.2]]){
    c.save();c.translate(x,y);c.scale(s,s);
    if(arena==='mushroom'){
      round(c,'#d1c5a2',-10,-79,21,83,7,p.near,3);ellipse(c,'#b78987',0,-83,53,23,p.near,3);ellipse(c,'#e3c6a5',-22,-88,8,6);ellipse(c,'#e3c6a5',17,-90,10,7);
    }else if(arena==='aurora'){
      round(c,'#738c99',-7,-102,14,105,4);path(c,'#b8cdca',[[-46,-28],[0,-136],[46,-28]],'#829d9e',3);path(c,'#e1e8dc',[[-21,-88],[0,-136],[21,-88],[4,-96],[-8,-86]]);
    }else{
      round(c,'#a39471',-8,-102,16,108,5);ellipse(c,'#96b58a',-22,-92,36,38);ellipse(c,'#96b58a',24,-99,38,37);ellipse(c,'#a6c194',0,-124,39,40);
    }
    c.restore();
  }
  c.restore();
}
export function drawGround(c,arena,heightAt,w,h){
  const p=palettes[arena];c.save();
  // The contour comes from the collision surface, including explosion craters.
  c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=2)c.lineTo(x,heightAt(x));c.lineTo(w,h);c.closePath();
  c.fillStyle=p.earth;c.fill();c.clip();
  for(let y=360;y<h;y+=36)for(let x=0;x<w;x+=47){const dx=x+(y%72?19:0),noise=(x*13+y*7)%17;ellipse(c,noise<8?p.rock:'#c5a07b',dx,y,4+noise%5,2+noise%3);}
  for(let x=0;x<w;x+=16){const y=heightAt(x);ellipse(c,p.ink,x,y+7,14,12);ellipse(c,p.leaf,x,y+5,14,11);}
  c.beginPath();for(let x=0;x<=w;x+=2)x?c.lineTo(x,heightAt(x)+3):c.moveTo(x,heightAt(x)+3);c.strokeStyle=p.light;c.lineWidth=6;c.lineJoin='round';c.stroke();
  c.restore();c.beginPath();for(let x=0;x<=w;x+=2)x?c.lineTo(x,heightAt(x)):c.moveTo(x,heightAt(x));c.lineWidth=2;c.strokeStyle=p.ink;c.stroke();
  for(let x=38;x<w;x+=91){const y=heightAt(x);c.strokeStyle=p.leaf;c.lineWidth=2;c.beginPath();c.moveTo(x-4,y-1);c.quadraticCurveTo(x-7,y-9,x-10,y-8);c.moveTo(x,y);c.quadraticCurveTo(x,y-10,x+4,y-9);c.stroke();}
}
export function drawPlatform(c,t,arena){
  const p=palettes[arena],left=t.x-t.width/2;
  round(c,p.rock,left,t.y,t.width,19,6,p.ink,2);round(c,p.earth,left+2,t.y+4,t.width-4,11,4);
  for(let x=left+20;x<left+t.width-10;x+=25){c.strokeStyle=p.rock;c.lineWidth=2;c.beginPath();c.moveTo(x,t.y+6);c.lineTo(x-3,t.y+16);c.stroke();}
  round(c,p.leaf,left,t.y,t.width,7,3);c.fillStyle=p.light;c.fillRect(left+3,t.y,t.width-6,3);
  for(let i=0;i<4;i++)ellipse(c,i<t.hp?p.light:p.rock,t.x-12+i*8,t.y+27,2,2);
}
export function drawWeapon(c,id,color,length=48){
  c.save();c.lineJoin='round';c.lineCap='round';
  const throwable=['bomba','yapiskan','mayin','buz','meteor','seken','zehir','isinla'].includes(id);
  if(throwable){
    if(id==='mayin'){ellipse(c,'#73864d',18,2,11,6,ink,2);ellipse(c,'#e7ad63',18,-3,4,3,ink,1.5);}
    else if(id==='buz'){path(c,'#b3d9df',[[10,-4],[18,-11],[26,-3],[24,8],[13,8]],ink,2);}
    else {ellipse(c,id==='bomba'?'#59656a':color,18,0,9,10,ink,2.5);ellipse(c,'#ffffff70',15,-4,3,4);round(c,'#a7a68b',15,-13,6,5,2,ink,1.5);c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(18,-13);c.quadraticCurveTo(22,-20,27,-14);c.stroke();}
    c.restore();return;
  }
  round(c,'#986444',-1,2,10,17,3,ink,2.5);
  const launcher=['roket','ucleyen','agir','delici'].includes(id);
  round(c,launcher?'#899267':'#798f96',-8,-8,length+8,16,7,ink,2.5);
  round(c,color,4,-6,length-12,5,3);round(c,'#e7dfb3',-6,-10,7,20,2,ink,2);
  round(c,'#53636a',length-6,-10,8,20,3,ink,2);ellipse(c,'#2f3435',length-1,0,2,6);
  c.strokeStyle='#ffffff77';c.lineWidth=2;c.beginPath();c.moveTo(5,-4);c.lineTo(length-12,-4);c.stroke();
  if(id==='seri'||id==='ucleyen')round(c,'#795e47',length-14,-14,8,5,2,ink,1.5);
  c.restore();
}
export function drawFighter(c,p,index,active,angle,color,debug=false){
  const [fur,light]=skins[p.fighter]||skins.fox,foot=p.y+FOOT;
  if(p.hp<=0){ellipse(c,'#7e8972',p.x,foot-5,20,7);round(c,'#c7c3aa',p.x-10,foot-24,20,23,7,ink,2);return;}
  const sprite=sprites.get(p.fighter),stride=Math.sin(p.walkPhase||0)*(p.walk||0);
  c.save();c.translate(p.x,foot);c.scale(p.facing,1);
  if(sprite){
    // Feet stay on the shared baseline during the restrained walking squash.
    c.scale(1,p.airborne?1.015:1-Math.abs(stride)*.018);
    c.drawImage(sprite.image,-sprite.anchor,-72,sprite.width,72);
  }else{
    ellipse(c,fur,0,-22,15,20,ink,2);ellipse(c,fur,0,-49,20,21,ink,2);ellipse(c,light,7,-47,9,10);ellipse(c,ink,10,-50,3,4);ellipse(c,fur,-10,-4,10,4,ink);ellipse(c,fur,10,-4,10,4,ink);
  }
  c.restore();
  const pose=weaponPose(p,angle),recoil=(p.recoil||0)*3;
  pose.pivot.x-=p.facing*Math.cos(pose.angle)*recoil;pose.pivot.y-=Math.sin(pose.angle)*recoil;
  c.save();c.translate(pose.pivot.x,pose.pivot.y);c.scale(p.facing,1);c.rotate(pose.angle);drawWeapon(c,p.equipped,color,pose.length);c.restore();
  // Hands share the weapon's local transform, including rotation and facing.
  for(const [sx,d] of [[-8,4],[10,pose.length>30?25:16]]){
    const hand={x:pose.pivot.x+p.facing*(Math.cos(pose.angle)*d-Math.sin(pose.angle)*5),y:pose.pivot.y+Math.sin(pose.angle)*d+Math.cos(pose.angle)*5};
    const shoulder={x:p.x+sx*p.facing,y:foot-28};
    c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(shoulder.x,shoulder.y);c.quadraticCurveTo((shoulder.x+hand.x)/2,Math.max(shoulder.y,hand.y)+8,hand.x,hand.y);c.strokeStyle=ink;c.lineWidth=9;c.stroke();c.strokeStyle=fur;c.lineWidth=5.5;c.stroke();ellipse(c,light,hand.x,hand.y,4,4,ink,1.5);c.restore();
  }
  if(p.muzzleFlash>0)path(c,'#ffe297',[[pose.muzzle.x-7,pose.muzzle.y],[pose.muzzle.x,pose.muzzle.y-10],[pose.muzzle.x+9,pose.muzzle.y],[pose.muzzle.x,pose.muzzle.y+7]]);
  if(p.shield>0)ellipse(c,'#b7e0e42b',p.x,foot-37,30,42,'#92cbd0',2);
  if(active)path(c,'#f3ce6c',[[p.x-7,foot-101],[p.x+7,foot-101],[p.x,foot-93]],ink,1.5);
  if(p.name){c.font='bold 12px Trebuchet MS, sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#fff5df';c.strokeText(p.name.slice(0,16),p.x,foot-81);c.fillStyle='#493c30';c.fillText(p.name.slice(0,16),p.x,foot-81);}
  round(c,ink,p.x-23,foot+6,46,7,3);round(c,index%2?'#81b4b5':'#dda261',p.x-21,foot+8,42*Math.max(0,Math.min(1,p.hp/(p.maxHp||100))),3,1);
  if(debug){const b=bodyBox(p);c.strokeStyle='#e7405a';c.lineWidth=1;c.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);ellipse(c,'#fff',pose.muzzle.x,pose.muzzle.y,2,2);}
}
function preview(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'));return canvas.toDataURL();}
export function updateHeroPreview(arena='sunset'){
  const el=document.querySelector('.hero-backdrop');if(!el)return;
  el.src=preview(1280,720,c=>{
    drawBackdrop(c,arena);drawGround(c,arena,x=>terrainHeight(arena,x,[]),1280,720);
    for(const t of createPlatforms(arena))drawPlatform(c,t,arena);
    for(const [x,id,facing] of [[190,'fox',1],[1080,'raccoon',-1]]){
      c.save();c.translate(x,terrainHeight(arena,x,[]));c.scale(2.2,2.2);
      drawFighter(c,{x:0,y:-FOOT,facing,fighter:id,equipped:'roket',hp:100,name:''},facing===1?0:1,false,25,'#aa9f66');c.restore();
    }
  });
}
export function installRetroPreviews(fighters,weapons){
  for(const el of document.querySelectorAll('.fighter-portrait')){
    const id=Object.keys(fighters).find(id=>el.classList.contains(id));
    el.style.backgroundImage=`url(${preview(100,92,c=>drawFighter(c,{x:39,y:53,facing:1,fighter:id,equipped:'roket',hp:100,name:''},0,false,15,'#9da672'))})`;
    el.style.backgroundSize='contain';el.style.backgroundPosition='center';
  }
  for(const el of document.querySelectorAll('.weapon span')){const id=el.closest('.weapon').dataset.weapon;el.style.backgroundImage=`url(${preview(64,36,c=>{c.translate(10,19);drawWeapon(c,id,weapons[id].color,42);})})`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';}
  for(const el of document.querySelectorAll('.arena-choice'))el.style.backgroundImage=`url(${preview(320,180,c=>{drawBackdrop(c,el.dataset.arena,320,180);c.save();c.scale(.25,.25);drawPlatform(c,{x:640,y:470,width:320,hp:4},el.dataset.arena);c.restore();})})`;
  updateHeroPreview(document.querySelector('.arena-choice.selected')?.dataset.arena||'sunset');document.querySelector('.hero-fighters')?.remove();
}
