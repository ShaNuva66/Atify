// Cosmetic pose only. Collision and launch origin remain in world.js.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function bendJoint(start,end,a,b,side=1){
  const dx=end.x-start.x,dy=end.y-start.y,d=Math.max(.001,Math.hypot(dx,dy));
  // Stretch only when needed to keep a hand attached to its weapon grip.
  const stretch=Math.max(1,d/(a+b-.001));a*=stretch;b*=stretch;
  const along=clamp((a*a-b*b+d*d)/(2*d),-a,a),across=Math.sqrt(Math.max(0,a*a-along*along));
  return {x:start.x+dx/d*along-dy/d*across*side,y:start.y+dy/d*along+dx/d*across*side};
}
export function fighterRig(p,angle=35,index=0){
  const t=(p.animTime||0)+index*.73,walk=clamp(p.walk||0,0,1),phase=p.walkPhase||0;
  const land=clamp(p.landAnim||0,0,1),hurt=clamp(p.hurtAnim||0,0,1),recoil=clamp(p.recoil||0,0,1);
  const stride=Math.sin(phase)*walk;
  const bob=p.airborne?-1.3:Math.sin(t*2.8)*.5-Math.abs(Math.cos(phase))*walk*1.2+land*3.5;
  const lean=walk*1.8-recoil*2.8-hurt*2;
  const hip={x:lean*.35,y:-19+bob};
  const body={x:lean,y:-30+bob,rotation:walk*.045-recoil*.1+hurt*.08};
  const head={x:lean,y:-37+bob,rotation:clamp((35-angle)*.0025,-.12,.12)+stride*.055+recoil*.14-hurt*.12+Math.sin(t*2.8)*.016};
  const legs=[-1,1].map((side,i)=>{
    const wave=Math.sin(phase+i*Math.PI),lift=Math.max(0,Math.cos(phase+i*Math.PI))*walk;
    const start={x:hip.x+side*6,y:hip.y};
    const end=p.airborne?{x:side*10+(p.vy<0?-3:3),y:-7-(p.vy<0?5:1)+(i?2:0)}:{x:side*6+wave*8*walk,y:-3-lift*6};
    return {start,end,knee:bendJoint(start,end,10,10,-1),rotation:p.airborne?side*.18:-wave*walk*.2};
  });
  return {body,head,legs,tail:Math.sin(t*3+phase*.5)*.17+stride*.1,shoulders:[{x:lean-7,y:-31+bob},{x:lean+8,y:-30+bob}]};
}
