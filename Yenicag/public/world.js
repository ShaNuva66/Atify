// One coordinate system for drawing, walking, landing, blast damage and bullets.
// player.y is the legacy origin; the soles are always y + FOOT.
export const FOOT = 29;
export const BODY = { halfWidth: 21, height: 72 };
export const JUMP_SPEED = 300;
export const profiles = {
  sunset: [[0,542],[120,542],[230,542],[300,494],[365,494],[415,548],[480,548],[555,458],[635,458],[705,548],[800,548],[870,494],[950,494],[1050,542],[1280,542]],
  mushroom: [[0,550],[230,550],[305,490],[390,490],[465,555],[535,555],[600,476],[690,476],[755,555],[850,555],[915,490],[990,490],[1050,550],[1280,550]],
  aurora: [[0,536],[230,536],[285,475],[370,475],[445,558],[520,558],[590,492],[680,492],[755,558],[840,558],[910,475],[990,475],[1050,536],[1280,536]]
};
export function terrainHeight(arena, x, craters = []) {
  const points = profiles[arena] || profiles.sunset;
  x = Math.max(0, Math.min(1280, x));
  let y = points.at(-1)[1];
  for (let i = 1; i < points.length; i++) if (x <= points[i][0]) {
    const [a,b] = [points[i-1], points[i]];
    y = a[1] + (b[1]-a[1]) * (x-a[0])/(b[0]-a[0]); break;
  }
  for (const c of craters) { const dx = Math.abs(x-c.x); if (dx < c.radius) y += c.depth * Math.sqrt(1-dx*dx/(c.radius*c.radius)); }
  return Math.min(645,y);
}
export function createPlatforms(arena) {
  const layouts = {
    sunset: [[285,411,112],[455,365,116],[650,322,156],[840,365,116],[1000,411,112]],
    mushroom: [[285,412,110],[445,350,128],[640,300,144],[820,350,128],[1005,412,110]],
    aurora: [[285,415,112],[460,350,116],[640,304,140],[820,350,116],[1000,415,112]]
  };
  return (layouts[arena] || layouts.sunset).map(([x,y,width],id)=>({id,x,y,width,hp:4}));
}
export function bodyBox(p) { return {left:p.x-BODY.halfWidth,right:p.x+BODY.halfWidth,top:p.y+FOOT-BODY.height,bottom:p.y+FOOT}; }
export function distanceToBody(x,y,p) { const b=bodyBox(p); return Math.hypot(Math.max(b.left-x,0,x-b.right),Math.max(b.top-y,0,y-b.bottom)); }
export function overlapsPlayers(p,x,others) {
  const a=bodyBox({...p,x});
  return others.some(o=>o!==p && o.hp>0 && (()=>{const b=bodyBox(o);return a.left<b.right && a.right>b.left && a.top<b.bottom-2 && a.bottom>b.top+2;})());
}
export function supportHeight(x, heightAt) { return Math.min(heightAt(x-13),heightAt(x),heightAt(x+13)); }
export function moveBody(p,x,heightAt,platforms,others=[]) {
  if (overlapsPlayers(p,x,others)) return false;
  const oldFoot=p.y+FOOT, floor=supportHeight(x,heightAt);
  const platform=platforms.find(t=>t.id===p.platformId && t.hp>0 && Math.abs(x-t.x)<=t.width/2+10);
  if (p.airborne) { if (floor<oldFoot-8) return false; }
  else if (!platform && floor<oldFoot-Math.max(8,Math.abs(x-p.x)*1.7)) return false;
  p.x=x;
  if (!p.airborne) {
    if (platform) p.y=platform.y-FOOT;
    else if (floor>oldFoot+8) {p.airborne=true;p.platformId=null;p.vy=0;}
    else {p.y=floor-FOOT;p.platformId=null;}
  }
  return true;
}
export function stepBody(p,dt,gravity,heightAt,platforms) {
  if (!p.airborne) {
    const platform=platforms.find(t=>t.id===p.platformId && t.hp>0 && Math.abs(p.x-t.x)<=t.width/2+10);
    const floor=platform ? platform.y : supportHeight(p.x,heightAt);
    if (floor>p.y+FOOT+2) {p.airborne=true;p.platformId=null;p.vy=0;} else {p.y=floor-FOOT;return;}
  }
  const previousFeet=p.y+FOOT;
  p.y += p.vy*dt + .5*gravity*dt*dt; p.vy += gravity*dt;
  if (p.vy<0) return;
  let floor=supportHeight(p.x,heightAt), platformId=null;
  for (const t of platforms) if (t.hp>0 && Math.abs(p.x-t.x)<=t.width/2+10 && previousFeet<=t.y+.01 && p.y+FOOT>=t.y && t.y<floor) {floor=t.y;platformId=t.id;}
  if (p.y+FOOT>=floor) {p.y=floor-FOOT;p.vy=0;p.airborne=false;p.platformId=platformId;}
}
export function weaponPose(p,angle=45) {
  const radians=angle*Math.PI/180;
  const pivot={x:p.x+p.facing*16,y:p.y+FOOT-32};
  const length=['bomba','yapiskan','mayin','buz','meteor','seken','zehir','isinla'].includes(p.equipped)?27:48;
  return {pivot,angle:-radians,rotation:p.facing===1?-radians:Math.PI+radians,length,muzzle:{x:pivot.x+p.facing*Math.cos(radians)*length,y:pivot.y-Math.sin(radians)*length}};
}
export function segmentBox(a,b,box,radius=0) {
  let lo=0,hi=1;
  for (const [key,min,max] of [['x',box.left-radius,box.right+radius],['y',box.top-radius,box.bottom+radius]]) {
    const d=b[key]-a[key];
    if (Math.abs(d)<1e-9) {if(a[key]<min||a[key]>max)return null;continue;}
    let t0=(min-a[key])/d,t1=(max-a[key])/d;if(t0>t1)[t0,t1]=[t1,t0];
    lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return null;
  }
  return lo;
}
export function sweepProjectile(a,b,players,platforms,heightAt,owner,age,radius=4) {
  let best=null;
  const offer=(t,type,target)=>{if(t!==null&&(!best||t<best.t))best={t,type,target,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};};
  players.forEach((p,i)=>{if(p.hp>0&&!(i===owner&&age<.18))offer(segmentBox(a,b,bodyBox(p),radius),'player',p);});
  for(const p of platforms)if(p.hp>0)offer(segmentBox(a,b,{left:p.x-p.width/2,right:p.x+p.width/2,top:p.y,bottom:p.y+16},radius),'platform',p);
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));
  for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>=0&&x<=1280&&y+radius>=heightAt(x)){offer(t,'ground',null);break;}}
  return best;
}
