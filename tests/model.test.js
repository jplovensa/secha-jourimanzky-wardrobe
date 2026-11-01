import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOM,clampAsset,QUESTS} from '../src/model.js';
test('room matches revision 07 main bay and ceiling',()=>{assert.deepEqual(ROOM,{width:2.022,depth:2.157,height:2.61});assert.equal((ROOM.width*ROOM.depth).toFixed(2),'4.36');});
test('movable floor assets remain inside the room',()=>{assert.deepEqual(clampAsset(-4,20),{x:.15,z:1.95});assert.deepEqual(clampAsset(.8,1.2),{x:.8,z:1.2});});
test('four distinct exploration objectives',()=>{assert.equal(new Set(QUESTS).size,4);});
