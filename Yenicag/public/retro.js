import { FOOT, bodyBox, weaponPose } from './world.js?v=2';

export const palettes = {
  sunset: {sky:['#272944','#65506b','#bb7b79','#e8b88d'],far:'#71556c',near:'#4b465d',leaf:'#7b9158',light:'#c1c27b',earth:'#715747',rock:'#443c42',ink:'#252735',accent:'#e8bd72'},
  mushroom: {sky:['#252b40','#3f5060','#657978','#a3aaa0'],far:'#455969',near:'#344657',leaf:'#839975',light:'#c6c795',earth:'#5c6152',rock:'#353e45',ink:'#232b36',accent:'#d6948d'},
  aurora: {sky:['#252b49','#475678','#7f91a1','#c0c7b8'],far:'#657690',near:'#465672',leaf:'#abbfb3',light:'#e2d9b5',earth:'#667683',rock:'#3e4c67',ink:'#252d43',accent:'#e1bd84'}
};
const skins={fox:['#c8784d','#edba78'],raccoon:['#8596a4','#d1cbbb'],rabbit:['#c2b8ac','#ede0c2'],owl:['#a88669','#d6bc88'],bear:['#937052','#c7a271'],cat:['#8b8799','#c8b7b7']};
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function poly(c,color,points){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export function drawBackdrop(c,arena,w=1280,h=720) {
  const p=palettes[arena]||palettes.sunset;c.save();c.scale(w/1280,h/720);
  for(let i=0;i<4;i++)rect(c,p.sky[i],0,i*116,1280,116+1);
  rect(c,p.sky[3],0,460,1280,260);
  // Sparse dithering softens the palette bands without blurring the pixel art.
  for(let band=1;band<4;band++)for(let x=0;x<1280;x+=8){rect(c,p.sky[band-1],x,band*116+(x%16?0:4),4,4);}
  // Deliberately stepped silhouettes: the background has no walkable-looking floor.
  for(let i=0;i<65;i++){const x=(i*137+41)%1280,y=(i*53)%220;rect(c,'#e3d8b6',x,y,i%9===0?4:2,2);}
  rect(c,p.accent,900,94,80,64);rect(c,p.accent,908,86,64,80);
  rect(c,p.sky[1],900,126,88,8);rect(c,p.sky[1],900,148,88,5);
  for(const [x,y,width] of [[110,96,148],[380,162,184],[710,64,112],[1070,208,152]]){
    rect(c,p.far,x,y,width,8);rect(c,p.far,x+24,y-8,width-48,8);rect(c,p.sky[2],x+8,y+8,width-16,4);
  }
  for(let layer=0;layer<2;layer++) {
    const base=layer?425:345,step=8;
    c.fillStyle=layer?p.near:p.far;c.beginPath();c.moveTo(0,720);
    for(let x=0;x<=1280;x+=step){const y=Math.round((base-Math.abs(Math.sin(x*.004+layer))*92-Math.abs(Math.sin(x*.011+2))*44)/8)*8;c.lineTo(x,y);c.lineTo(x+step,y);}
    c.lineTo(1280,720);c.fill();
  }
  for(const x of [64,180,1016,1152]) {
    if(arena==='mushroom') {rect(c,p.far,x+16,305,16,128);rect(c,p.near,x-24,300,96,16);rect(c,p.near,x-8,284,64,24);rect(c,p.accent,x+4,290,8,8);}
    else {rect(c,p.far,x,316,32,116);rect(c,p.far,x-8,300,48,20);rect(c,p.near,x+8,340,8,24);rect(c,p.near,x+8,390,8,24);}
  }
  // Foreground silhouettes and broken masonry frame the playable middle.
  for(const x of [12,1232]){
    rect(c,p.ink,x,392,28,200);rect(c,p.near,x+4,396,20,190);
    for(let y=400;y<590;y+=24){rect(c,p.far,x+6,y,8,4);rect(c,p.ink,x,y+20,28,3);}
    rect(c,p.ink,x-8,380,44,14);rect(c,p.far,x-4,382,36,4);
    if(arena==='mushroom'){rect(c,p.leaf,x+24,444,8,60);rect(c,p.accent,x+22,448,12,4);}
  }
  c.restore();
}
export function drawGround(c,arena,heightAt,w,h) {
  const p=palettes[arena];c.clearRect(0,0,w,h);
  for(let x=0;x<w;x+=4){const y=heightAt(x);rect(c,p.ink,x,y,4,h-y);rect(c,p.earth,x,y+8,4,42);rect(c,p.leaf,x,y,4,8);rect(c,p.light,x,y,4,3);}
  for(let x=0;x<w;x+=24) {
    const floor=heightAt(x);
    for(let y=Math.ceil((floor+24)/24)*24;y<h;y+=24){const noise=((x*31+y*17)>>>2)%13;if(noise<6)rect(c,noise<3?p.earth:p.rock,x+4,y+4,noise<3?8:12,noise<3?3:6);}
    if(x%72===0){rect(c,p.leaf,x,floor-7,3,8);rect(c,p.leaf,x+4,floor-11,3,12);}
  }
}
export function drawPlatform(c,t,arena) {
  const p=palettes[arena],left=t.x-t.width/2;
  rect(c,p.ink,left-2,t.y, t.width+4,20);rect(c,p.light,left,t.y,t.width,4);
  rect(c,p.earth,left,t.y+4,t.width,12);
  for(let x=left+4;x<left+t.width-4;x+=16){rect(c,p.accent,x,t.y+5,10,4);rect(c,p.rock,x+8,t.y+11,4,5);}
  rect(c,p.rock,left+8,t.y+20,16,8);rect(c,p.rock,left+t.width-24,t.y+20,16,8);
  for(let i=0;i<4;i++)rect(c,i<t.hp?p.light:p.rock,t.x-13+i*8,t.y+30,5,3);
}
export function drawWeapon(c,id,color,length=48) {
  // Local x axis points at the muzzle; the hands attach to the same grip coordinates.
  const throwable=['bomba','yapiskan','mayin','buz','meteor','seken','zehir','isinla'].includes(id);
  if(throwable){rect(c,'#252735',9,-9,18,18);rect(c,color,12,-6,12,12);rect(c,'#eee0ae',14,-5,4,4);rect(c,'#6c745b',14,-13,7,4);return;}
  rect(c,'#252735',-8,-9,length+10,18);rect(c,'#667378',-5,-6,length+3,12);
  rect(c,color,4,-5,length-7,5);rect(c,'#d9d3ae',6,-5,length-16,3);
  rect(c,'#343847',length-5,-8,7,16);rect(c,'#f0c774',length-2,-4,4,8);
  rect(c,'#343847',0,6,10,12);rect(c,'#96714d',3,8,5,8);
  if(id==='ucleyen'||id==='seri'){rect(c,'#252735',length-8,-13,8,4);rect(c,color,length-7,-12,6,2);}
}
export function drawFighter(c,p,index,active,angle,color,debug=false) {
  const [fur,light]=skins[p.fighter]||skins.fox,foot=p.y+FOOT;
  if(p.hp<=0){rect(c,'#696572',p.x-18,foot-12,36,12);rect(c,'#c4b9a5',p.x-3,foot-27,6,15);return;}
  const stride=Math.round(Math.sin(p.walkPhase||0)*(p.walk||0)*5);
  c.save();c.translate(Math.round(p.x),Math.round(foot));c.scale(p.facing,1);
  const ink='#252735';
  // Small species details are decorative; body and head use the shared 42 x 72 bounds.
  if(p.fighter==='fox'||p.fighter==='cat')poly(c,fur,[[-17,-14],[-34,-24],[-38,-13],[-24,-4],[-12,-4]]);
  rect(c,ink,-18,-34,36,26);rect(c,index%2?'#657c7b':'#8a6c5d',-15,-31,30,23);
  rect(c,index%2?'#91a79c':'#af8a64',-12,-30,8,14);rect(c,ink,5,-25,9,10);rect(c,'#c9ac75',7,-23,5,5);
  rect(c,'#d1b97f',-14,-14,28,4);rect(c,ink,-18,-10,15,10);rect(c,ink,4,-10,17,10);
  rect(c,'#b0a48d',-16+stride,-6,14,6);rect(c,'#b0a48d',5-stride,-6,14,6);
  rect(c,ink,-21,-64,42,32);rect(c,fur,-18,-61,36,26);rect(c,light,0,-49,21,12);
  rect(c,light,-15,-60,17,3);rect(c,ink,-19,-38,10,4);
  if(p.fighter==='rabbit'){rect(c,ink,-17,-72,9,16);rect(c,light,-14,-70,3,12);rect(c,ink,5,-72,9,16);rect(c,light,8,-70,3,12);}
  else if(p.fighter==='bear'||p.fighter==='raccoon'){rect(c,ink,-21,-70,12,12);rect(c,fur,-18,-67,6,6);rect(c,ink,9,-70,12,12);rect(c,fur,12,-67,6,6);}
  else {poly(c,ink,[[-21,-58],[-21,-72],[-6,-62]]);poly(c,fur,[[-18,-60],[-18,-68],[-10,-61]]);poly(c,ink,[[6,-63],[18,-72],[21,-58]]);}
  if(p.fighter==='raccoon')rect(c,'#424654',-16,-56,34,9);
  rect(c,'#f1e1b3',5,-56,10,8);rect(c,ink,11,-55,4,6);rect(c,ink,18,-46,6,4);
  rect(c,index%2?'#91b3b0':'#d9ae69',-19,-35,40,5);rect(c,index%2?'#91b3b0':'#d9ae69',-23,-32,7,14);
  c.restore();
  const pose=weaponPose(p,angle);
  const recoil=(p.recoil||0)*4;
  pose.pivot.x-=p.facing*Math.cos(pose.angle)*recoil;pose.pivot.y-=Math.sin(pose.angle)*recoil;
  c.save();c.translate(pose.pivot.x,pose.pivot.y);c.scale(p.facing,1);c.rotate(pose.angle);
  drawWeapon(c,p.equipped,color,pose.length);c.restore();
  const grip=(d)=>({x:pose.pivot.x+p.facing*Math.cos(-pose.angle)*d,y:pose.pivot.y+Math.sin(pose.angle)*d+6});
  for(const [sx,d] of [[-10,4],[9,pose.length>30?26:16]]){
    const hand=grip(d),shoulder={x:p.x+sx*p.facing,y:foot-34};
    c.strokeStyle='#252735';c.lineWidth=10;c.beginPath();c.moveTo(shoulder.x,shoulder.y);c.lineTo((shoulder.x+hand.x)/2,Math.max(shoulder.y,hand.y)+5);c.lineTo(hand.x,hand.y);c.stroke();
    c.strokeStyle=fur;c.lineWidth=6;c.stroke();rect(c,light,hand.x-4,hand.y-4,8,8);
  }
  if(p.muzzleFlash>0){rect(c,'#f5df9c',pose.muzzle.x-6,pose.muzzle.y-6,12,12);}
  if(p.shield>0){c.strokeStyle='#9cbfbd';c.lineWidth=2;c.strokeRect(p.x-26,foot-78,52,82);}
  if(active){poly(c,'#f0d399',[[p.x-7,foot-104],[p.x+7,foot-104],[p.x,foot-97]]);}
  c.font='bold 12px monospace';c.textAlign='center';c.fillStyle='#f0e0b9';c.fillText(p.name.slice(0,16),p.x,foot-84);
  rect(c,'#252735',p.x-22,foot+7,44,5);rect(c,index%2?'#9ab9aa':'#d9ac67',p.x-21,foot+8,42*Math.min(1,p.hp/(p.maxHp||100)),3);
  if(debug){const b=bodyBox(p);c.strokeStyle='#ff7880';c.lineWidth=1;c.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);rect(c,'#ffffff',pose.muzzle.x-2,pose.muzzle.y-2,4,4);}
}
export function installRetroPreviews(fighters,weapons) {
  const image=(w,h,paint)=>{const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));return c.toDataURL();};
  for(const el of document.querySelectorAll('.fighter-portrait')){
    const id=Object.keys(fighters).find(id=>el.classList.contains(id));
    el.style.backgroundImage=`url(${image(100,92,c=>drawFighter(c,{x:40,y:53,facing:1,fighter:id,equipped:'roket',hp:100,name:'',walk:0},0,false,15,'#c99569'))})`;
    el.style.backgroundSize='contain';el.style.backgroundPosition='center';
  }
  for(const el of document.querySelectorAll('.weapon span')){const id=el.closest('.weapon').dataset.weapon;el.style.backgroundImage=`url(${image(64,30,c=>{c.translate(10,15);drawWeapon(c,id,weapons[id].color,42);})})`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';}
  for(const el of document.querySelectorAll('.arena-choice'))el.style.backgroundImage=`url(${image(320,180,c=>drawBackdrop(c,el.dataset.arena,320,180))})`;
  const hero=document.querySelector('.hero-stage');const backdrop=document.querySelector('.hero-backdrop');
  backdrop.src=image(1280,720,c=>{drawBackdrop(c,'sunset');for(const [x,y,w] of [[0,610,400],[470,510,330],[870,580,410]]){rect(c,'#33333f',x,y,w,720-y);rect(c,'#9fa36a',x,y,w,8);}drawFighter(c,{x:280,y:581,facing:1,fighter:'fox',equipped:'roket',hp:100,name:'KIZIL KAPTAN'},0,true,28,'#dcae70');drawFighter(c,{x:1010,y:551,facing:-1,fighter:'raccoon',equipped:'buz',hp:100,name:'MAVİ MÜHENDİS'},1,false,35,'#9dbfbd');});
  hero.querySelector('.hero-fighters').remove();
}
