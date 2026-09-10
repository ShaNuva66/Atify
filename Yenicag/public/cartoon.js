import { FOOT, bodyBox, weaponPose, terrainHeight, createPlatforms } from './world.js?v=2';
import { fighterRig, bendJoint } from './fighter-rig.js?v=4';

const skins={fox:['#ce752f','#e4caa0'],raccoon:['#777c7d','#c4c0b6'],rabbit:['#ded7c4','#f0e8d3'],owl:['#997344','#ceaf79'],bear:['#915c34','#c49c63'],cat:['#797c80','#c4c0b6']};
const headIds=['fox','raccoon','rabbit','owl','bear','cat'];
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
        headIds.forEach((id,i)=>{
          const cw=img.width/3,ch=img.height/2,x0=Math.floor(i%3*cw),y0=Math.floor(Math.floor(i/3)*ch);
          let left=x0+cw,top=y0+ch,right=x0,bottom=y0;
          for(let y=y0;y<y0+ch;y++)for(let x=x0;x<x0+cw;x++)if(pixels.data[(y*img.width+x)*4+3]>180){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
          if(right<=left||bottom<=top)throw new Error('Empty head cell: '+id);
          const w=right-left+1,h=bottom-top+1,height=35,width=Math.min(43,w/h*height);
          const sprite=document.createElement('canvas');sprite.width=Math.ceil(width*3);sprite.height=105;
          const sc=sprite.getContext('2d');sc.imageSmoothingQuality='high';sc.drawImage(atlas,left,top,w,h,0,0,sprite.width,105);
          sprites.set(id,{image:sprite,width,height});
        });
        resolve();
      }catch(error){reject(error);}
    };
    img.onerror=()=>reject(new Error('Karakter görselleri yüklenemedi.'));
    img.src=new URL('./assets/heads-flash-v4.png',import.meta.url).href;
  });
  return assetPromise;
}
export const palettes={
  sunset:{sky:['#94cddc','#f6deb0'],far:'#b3c5a0',near:'#8ca786',leaf:'#8db34e',light:'#c5d779',earth:'#b38558',rock:'#94714e',ink:'#514333',accent:'#efc66d'},
  mushroom:{sky:['#91b8b8','#d2dfbd'],far:'#9abaad',near:'#749a86',leaf:'#89ad65',light:'#c6d997',earth:'#aa8261',rock:'#82654f',ink:'#4a483a',accent:'#d99789'},
  aurora:{sky:['#889fbe','#d6e1df'],far:'#adbfc9',near:'#829eae',leaf:'#c5dfe0',light:'#f0eee0',earth:'#97a9ae',rock:'#788b96',ink:'#465562',accent:'#e6ce89'}
};
const ink='#302c26';
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
  const sprite=sprites.get(p.fighter),rig=fighterRig(p,angle,index);
  const limb=(start,joint,end,fill,width)=>{c.beginPath();c.moveTo(start.x,start.y);c.lineTo(joint.x,joint.y);c.lineTo(end.x,end.y);c.lineCap='round';c.lineJoin='round';c.strokeStyle=ink;c.lineWidth=width+3;c.stroke();c.strokeStyle=fill;c.lineWidth=width;c.stroke();};
  c.save();c.translate(p.x,foot);c.scale(p.facing,1);
  if(['fox','raccoon','cat'].includes(p.fighter)){
    c.save();c.translate(-10+rig.body.x,-20+rig.body.y+30);c.rotate(rig.tail);
    c.beginPath();c.moveTo(0,2);c.bezierCurveTo(-20,8,-24,-8,-15,-16);c.bezierCurveTo(-18,-4,-8,-6,0,-5);c.closePath();c.fillStyle=fur;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();c.restore();
  }
  for(const leg of rig.legs){
    limb(leg.start,leg.knee,leg.end,fur,6);
    c.save();c.translate(leg.end.x,leg.end.y);c.rotate(leg.rotation);round(c,'#605442',-6,-2,15,5,2,ink,1.7);c.restore();
  }
  c.save();c.translate(rig.body.x,rig.body.y);c.rotate(rig.body.rotation);
  // Leaner torso and visible trouser/boot shapes, independent of the head sprite.
  c.beginPath();c.moveTo(-10,-7);c.quadraticCurveTo(0,-12,10,-6);c.lineTo(12,11);c.quadraticCurveTo(0,17,-12,10);c.closePath();c.fillStyle=fur;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();
  path(c,index%2?'#596d6b':'#77704e',[[-10,-6],[-3,-8],[-4,10],[-11,9]],ink,1.5);
  path(c,index%2?'#596d6b':'#77704e',[[5,-8],[10,-6],[11,9],[4,10]],ink,1.5);
  round(c,'#68573d',-11,10,23,4,1,ink,1);round(c,'#b5a06e',0,10,4,4,1);c.restore();
  c.save();c.translate(rig.head.x,rig.head.y);c.rotate(rig.head.rotation);
  if(sprite)c.drawImage(sprite.image,-sprite.width*.51,-sprite.height,sprite.width,sprite.height);
  else{ellipse(c,fur,0,-17,18,17,ink,2);path(c,ink,[[1,-19],[13,-15],[12,-12],[2,-16]]);ellipse(c,light,12,-8,8,5,ink,1.5);}
  c.restore();
  c.restore();
  const pose=weaponPose(p,angle),recoil=(p.recoil||0)*3;
  pose.pivot.x-=p.facing*Math.cos(pose.angle)*recoil;pose.pivot.y-=Math.sin(pose.angle)*recoil;
  c.save();c.translate(pose.pivot.x,pose.pivot.y);c.scale(p.facing,1);c.rotate(pose.angle);drawWeapon(c,p.equipped,color,pose.length);c.restore();
  // Hands share the weapon's local transform, including rotation and facing.
  for(const [i,d] of [[0,4],[1,pose.length>30?25:16]]){
    const hand={x:pose.pivot.x+p.facing*(Math.cos(pose.angle)*d-Math.sin(pose.angle)*5),y:pose.pivot.y+Math.sin(pose.angle)*d+Math.cos(pose.angle)*5};
    const shoulder={x:p.x+rig.shoulders[i].x*p.facing,y:foot+rig.shoulders[i].y};
    const elbow=bendJoint(shoulder,hand,16,18,p.facing);
    c.save();limb(shoulder,elbow,hand,fur,5);ellipse(c,light,hand.x,hand.y,3.5,3.5,ink,1.5);c.restore();
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
