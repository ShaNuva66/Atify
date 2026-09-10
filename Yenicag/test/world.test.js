import test from 'node:test';
import assert from 'node:assert/strict';
import {FOOT,JUMP_SPEED,bodyBox,distanceToBody,terrainHeight,createPlatforms,moveBody,stepBody,weaponPose,sweepProjectile} from '../public/world.js';
const player=(x=200,feet=540)=>({x,y:feet-FOOT,hp:100,vy:0,airborne:false,platformId:null,facing:1,equipped:'roket'});
test('head, torso and feet receive hits; space above the sprite does not',()=>{
  const p=player(),floor=()=>700;
  for(const y of [470,500,536])assert.equal(sweepProjectile({x:100,y},{x:300,y},[p],[],floor,1,1)?.type,'player');
  assert.equal(sweepProjectile({x:100,y:455},{x:300,y:455},[p],[],floor,1,1),null);
  assert.equal(distanceToBody(200,535,p),0);
  assert.equal(distanceToBody(200,450,p),18);
});
test('fast projectile hits first obstacle along its entire path',()=>{
  const p=player(400),platform={x:250,y:490,width:80,hp:4};
  const hit=sweepProjectile({x:100,y:500},{x:600,y:500},[p],[platform],()=>650,2,1);
  assert.equal(hit.type,'platform');assert.ok(hit.x<250);
  assert.equal(sweepProjectile({x:100,y:500},{x:600,y:500},[{...p,hp:0}],[],()=>650,2,1),null);
});
test('descending feet land on platform even when a frame crosses its thickness',()=>{
  const p=player(250,380);p.airborne=true;p.vy=300;
  stepBody(p,.1,320,()=>550,[{id:3,x:250,y:400,width:100,hp:4}]);
  assert.equal(p.y+FOOT,400);assert.equal(p.platformId,3);assert.equal(p.airborne,false);
});
test('jump passes through platform from below; broken platform releases player',()=>{
  const t={id:1,x:250,y:400,width:100,hp:4},p=player(250,430);p.airborne=true;p.vy=-300;
  stepBody(p,.2,320,()=>550,[t]);assert.ok(p.y+FOOT<400);assert.equal(p.airborne,true);
  p.y=400-FOOT;p.airborne=false;p.platformId=1;t.hp=0;
  stepBody(p,.1,320,()=>550,[t]);assert.equal(p.airborne,true);assert.ok(p.y+FOOT>400);
});
test('walking off a bridge falls; height-separated fighters can pass',()=>{
  const p=player(250,400);p.platformId=1;
  assert.equal(moveBody(p,320,()=>550,[{id:1,x:250,y:400,width:100,hp:4}],[player(320,550)]),true);
  assert.equal(p.airborne,true);assert.equal(p.y+FOOT,400);
  assert.equal(moveBody(player(300),320,()=>540,[],[player(340)]),false);
});
test('every map has reachable first jump and varied terrain',()=>{
  for(const arena of ['sunset','mushroom','aurora']){
    const ground=x=>terrainHeight(arena,x),platforms=createPlatforms(arena),gravity={sunset:380,mushroom:325,aurora:430}[arena]*.82;
    const p=player(205,ground(205));p.airborne=true;p.vy=-JUMP_SPEED;
    let landed=false;
    for(let i=0;i<180;i++){if(p.x<280)moveBody(p,p.x+105/60,ground,platforms);stepBody(p,1/60,gravity,ground,platforms);if(p.platformId===0){landed=true;break;}}
    assert.equal(landed,true,arena+' first platform unreachable');
    assert.ok(Math.max(...Array.from({length:128},(_,i)=>ground(i*10)))-Math.min(...Array.from({length:128},(_,i)=>ground(i*10)))>=70);
  }
});
test('muzzle rotates with grip and mirrors exactly, airborne origin follows feet',()=>{
  const p=player(),right=weaponPose(p,60),left=weaponPose({...p,facing:-1},60);
  assert.equal(Math.round(right.muzzle.x-p.x),Math.round(p.x-left.muzzle.x));assert.equal(right.muzzle.y,left.muzzle.y);
  assert.ok(weaponPose(p,80).muzzle.y<weaponPose(p,10).muzzle.y);
  assert.equal(weaponPose({...p,y:p.y-100},60).muzzle.y,right.muzzle.y-100);
  assert.equal(bodyBox(p).bottom,540);
});
