import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOM,clampAsset,QUESTS} from '../app/src/model.js';
test('room matches revision 07 main bay and ceiling',()=>{assert.deepEqual(ROOM,{width:2.022,depth:2.157,height:2.61});assert.equal((ROOM.width*ROOM.depth).toFixed(2),'4.36');});
test('movable floor assets remain inside the room',()=>{assert.deepEqual(clampAsset(-4,20),{x:.15,z:1.95});assert.deepEqual(clampAsset(.8,1.2),{x:.8,z:1.2});});
test('four distinct exploration objectives',()=>{assert.equal(new Set(QUESTS).size,4);});

import {WALK_STOPS,WALK_DURATION,sampleWalkthrough} from '../app/src/walkthrough.js';
test('walkthrough enters through the left opening and stays inside the clear aisle',()=>{
 for(let t=0;t<=WALK_DURATION;t+=.1){
  const {position:p}=sampleWalkthrough(t);
  assert.equal(p[1],1.6);
  assert.ok(p[0]>.15&&p[0]<1.472);
  assert.ok(p[2]>.75&&p[2]<=2.9);
  if(p[2]>1.807)assert.ok(p[0]<.806,'camera must avoid the entrance-return rack');
 }
 assert.deepEqual(sampleWalkthrough(0).position,WALK_STOPS[0].position);
 assert.deepEqual(sampleWalkthrough(2.9).position,WALK_STOPS[0].position);
 assert.deepEqual(sampleWalkthrough(100).position,WALK_STOPS.at(-1).position);
});
