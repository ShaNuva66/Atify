import test from 'node:test';
import assert from 'node:assert/strict';
import { keyAtlasPixels } from '../public/cartoon.js';

test('atlas key removes its dedicated background without erasing pet colors',()=>{
  const pixels=new Uint8ClampedArray([255,0,255,255,249,4,248,255,237,133,47,255,162,153,182,255,245,228,199,255,68,44,28,255]);
  keyAtlasPixels(pixels);
  assert.equal(pixels[3],0);assert.equal(pixels[7],0);
  assert.deepEqual(Array.from(pixels.slice(8)),[237,133,47,255,162,153,182,255,245,228,199,255,68,44,28,255]);
});
test('atlas key preserves existing alpha and softly suppresses magenta fringes',()=>{
  const pixels=new Uint8ClampedArray([170,50,170,200,68,44,28,0]);
  keyAtlasPixels(pixels);
  assert.ok(pixels[3]>0&&pixels[3]<200);assert.ok(pixels[0]<=85);assert.equal(pixels[7],0);
});
