import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOM,clampAsset,QUESTS} from '../app/src/model.js';
import {WALK_STOPS,awardDiscovery} from '../app/src/walkthrough.js';
import {validateRevision} from '../app/src/layout-editor.js';
test('room matches measured main bay and ceiling',()=>{assert.deepEqual(ROOM,{width:2.022,depth:2.157,height:2.61});assert.equal((ROOM.width*ROOM.depth).toFixed(2),'4.36');});
test('movable props stay inside the room',()=>{assert.deepEqual(clampAsset(-4,20),{x:.15,z:1.95});assert.deepEqual(clampAsset(.8,1.2),{x:.8,z:1.2});});
test('five discoveries require distinct real actions and award only once',()=>{
 assert.equal(QUESTS.length,5);let progress=new Set();
 for(const station of WALK_STOPS)progress=awardDiscovery(progress,station.event);
 assert.equal(progress.size,5);assert.equal(awardDiscovery(progress,'garment').size,5);
 assert.equal(awardDiscovery(progress,'unknown').size,5);assert.equal(awardDiscovery(new Set(),'orientation').size,1);
});
test('discovery viewpoints retain eye height and clear the entrance rack',()=>{
 for(const station of WALK_STOPS){const p=station.position;assert.equal(p[1],1.6);assert.ok(p[0]>.15&&p[0]<1.472);if(p[2]>1.807)assert.ok(p[0]<.806);}
});
test('revision import rejects incompatible rooms, unknown objects and invalid numbers',()=>{
 const data={version:1,units:'mm',roomMM:[2022,2157,2610],furniture:[{id:'chest',position:[22,0,0],rotation:0}]};
 assert.equal(validateRevision(data,['chest']).length,1);
 assert.throws(()=>validateRevision({...data,roomMM:[4000,4000,3000]},['chest']));
 assert.throws(()=>validateRevision({...data,furniture:[{id:'unknown',position:[0,0,0],rotation:0}]},['chest']));
 assert.throws(()=>validateRevision({...data,furniture:[{id:'chest',position:[NaN,0,0],rotation:0}]},['chest']));
});

import {headroomMM,PERSON_PLACES} from '../app/src/human-scale.js';
test('scale figure headroom and named positions use measured room units',()=>{
 assert.equal(headroomMM(1700),910);assert.equal(headroomMM(2000),610);
 for(const place of Object.values(PERSON_PLACES)){assert.ok(place.x>0&&place.x<ROOM.width);assert.ok(place.z>0&&place.z<ROOM.depth);}
});

import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('bundled human has verified CC0 provenance and embedded MakeHuman/MakeClothes geometry',()=>{
 const file=readFileSync(new URL('../app/public/models/makehuman/person.glb',import.meta.url));
 const credits=JSON.parse(readFileSync(new URL('../app/public/models/makehuman/credits.json',import.meta.url)));
 assert.equal(file.subarray(0,4).toString(),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(credits.license,'CC0-1.0');
 assert.equal(createHash('sha256').update(file).digest('hex'),credits.sha256);
 const json=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString());
 assert.ok(json.meshes.some(m=>m.name.includes('HM08')));assert.ok(json.meshes.some(m=>m.name.includes('MakeClothes')));
 assert.ok(json.images.every(i=>i.bufferView!==undefined));
 assert.ok(json.skins.some(s=>s.joints.length>=160));assert.ok(json.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined)));
});

import {findWalkPath} from '../app/src/human-motion.js';
test('human floor navigation routes around furniture and rejects blocked destinations',()=>{
 const barrier={min:{x:0,z:.8},max:{x:.9,z:1.2}};
 const route=findWalkPath({x:.4,z:.4},{x:.4,z:1.8},[barrier]);
 assert.ok(route?.length>2);assert.ok(route.some(p=>p.x>1.08));
 assert.equal(findWalkPath({x:.4,z:.4},{x:.4,z:1.0},[barrier]),null);
 assert.equal(findWalkPath({x:.4,z:.4},{x:.4,z:1.8},[{min:{x:0,z:.8},max:{x:2.022,z:1.2}}]),null);
 assert.equal(findWalkPath({x:.4,z:.4},{x:3,z:1.8}),null);
});
