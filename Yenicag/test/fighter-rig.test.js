import test from 'node:test';
import assert from 'node:assert/strict';
import { fighterRig, bendJoint } from '../public/fighter-rig.js';
import { bodyBox, weaponPose } from '../public/world.js';

const pet={x:280,y:380,facing:1,equipped:'roket',hp:100,animTime:0,walk:0,walkPhase:0};
test('walking exchanges feet, lifts a foot and moves the head independently',()=>{
  const a=fighterRig({...pet,walk:1,walkPhase:0}),b=fighterRig({...pet,walk:1,walkPhase:Math.PI/2});
  assert.notEqual(a.legs[0].end.y,a.legs[1].end.y);
  assert.notEqual(a.legs[0].end.x,b.legs[0].end.x);
  assert.notEqual(a.head.rotation,b.head.rotation);
  assert.notEqual(a.head.y,b.head.y);
});
test('idle breath, aim, jump, landing and recoil have distinct articulated poses',()=>{
  const idle=fighterRig(pet),breath=fighterRig({...pet,animTime:.5});
  assert.notEqual(idle.head.y,breath.head.y);
  assert.notEqual(fighterRig(pet,10).head.rotation,fighterRig(pet,80).head.rotation);
  const jump=fighterRig({...pet,airborne:true,vy:-200});
  assert.ok(jump.legs.every(l=>l.end.y<idle.legs[0].end.y));
  assert.ok(fighterRig({...pet,landAnim:1}).body.y>idle.body.y);
  assert.notEqual(fighterRig({...pet,recoil:1}).head.rotation,idle.head.rotation);
  assert.notEqual(fighterRig({...pet,hurtAnim:1}).body.rotation,idle.body.rotation);
});
test('cosmetic posing does not mutate physics, facing or ballistic muzzle',()=>{
  const p={...pet,walk:1,walkPhase:2,landAnim:.6,recoil:.5},before=structuredClone(p),box=bodyBox(p),muzzle=weaponPose(p,45);
  fighterRig(p,45);assert.deepEqual(p,before);assert.deepEqual(bodyBox(p),box);assert.deepEqual(weaponPose(p,45),muzzle);
});
test('two-bone elbow lengths and mirrored grips are stable even at vertical aim',()=>{
  const a={x:0,y:0},b={x:24,y:-10},joint=bendJoint(a,b,19,22);
  assert.ok(Math.abs(Math.hypot(joint.x,joint.y)-19)<1e-6);
  assert.ok(Math.abs(Math.hypot(joint.x-b.x,joint.y-b.y)-22)<1e-6);
  const mirrored=bendJoint(a,{x:-24,y:-10},19,22,-1);
  assert.ok(Math.abs(mirrored.x+joint.x)<1e-6);assert.ok(Math.abs(mirrored.y-joint.y)<1e-6);
  for(const x of [0,10,100])assert.ok(Object.values(bendJoint(a,{x,y:0},19,22)).every(Number.isFinite));
});
