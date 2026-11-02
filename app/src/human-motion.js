import * as THREE from 'three';
import {ROOM} from './model.js';
const UP=new THREE.Vector3(0,1,0),RIGHT=new THREE.Vector3(1,0,0);
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const normal=name=>name.toLowerCase().replace(/[^a-z0-9]/g,'');

// A small floor grid routes the figure around the CURRENT furniture revision.
// Heights are considered so overhead shelves do not block an otherwise clear aisle.
export function findWalkPath(start,goal,obstacles=[],radius=.19){
 const step=.10,valid=p=>p.x>=radius&&p.x<=ROOM.width-radius&&p.z>=radius&&p.z<=ROOM.depth-radius&&!obstacles.some(b=>p.x>b.min.x-radius&&p.x<b.max.x+radius&&p.z>b.min.z-radius&&p.z<b.max.z+radius);
 if(!valid(goal))return null;
 const clear=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.025));for(let i=1;i<=n;i++)if(!valid({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n}))return false;return true;};
 if(clear(start,goal))return [goal];
 const key=(x,z)=>`${x},${z}`,nodes=new Map(),queue=[];
 for(let x=2;x<=18;x++)for(let z=2;z<=19;z++){
  const point={x:x*step,z:z*step};if(valid(point))nodes.set(key(x,z),{...point,xIndex:x,zIndex:z,cost:Infinity,previous:null});
 }
 const seeds=[...nodes.values()].filter(p=>Math.hypot(p.x-start.x,p.z-start.z)<.21&&clear(start,p));
 for(const n of seeds){n.cost=Math.hypot(n.x-start.x,n.z-start.z);queue.push(n);}
 let end=null;
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const n=queue.shift();if(n.visited)continue;n.visited=true;
  if(Math.hypot(n.x-goal.x,n.z-goal.z)<.18&&clear(n,goal)){end=n;break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const next=nodes.get(key(n.xIndex+dx,n.zIndex+dz));if(!next||next.visited||!clear(n,next))continue;const cost=n.cost+step;if(cost<next.cost){next.cost=cost;next.previous=n;queue.push(next);}}
 }
 if(!end)return null;const route=[goal];while(end){route.unshift({x:end.x,z:end.z});end=end.previous;}return route;
}

export function createHumanMotion({root,model,source,furniture,assets,invalidate,onFocus,onChange,onAssetMoved}){
 const bones=new Map(),rest=new Map();source.updateWorldMatrix(true,true);
 source.traverse(b=>{if(b.isBone){bones.set(normal(b.name),b);rest.set(b,{q:b.quaternion.clone(),axis:RIGHT.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert())});}});
 const bone=name=>bones.get(normal(name)),wrist=bone('wrist.R');
 const status=document.querySelector('#human-action-status'),buttons=[...document.querySelectorAll('[data-person-action]')];
 const seat=new THREE.Group();seat.name='Temporary fitting seat / routine only';seat.visible=false;root.parent.add(seat);
 const seatMaterial=new THREE.MeshStandardMaterial({color:'#b6aa91',roughness:.9});
 const frameMaterial=new THREE.MeshStandardMaterial({color:'#3d4738',metalness:.45,roughness:.5});
 function piece(w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;seat.add(mesh);}
 piece(.38,.035,.34,0,.4325,0,seatMaterial);for(const x of [-.15,.15])for(const z of [-.12,.12])piece(.018,.415,.018,x,.2075,z,frameMaterial);
 let phase='idle',routine=null,elapsed=0,path=[],pending=null,walkMode=false,prop=null,startPose=null,holdPoint=null,finalPoint=null,walkDistance=0,completed=0,lastAction=null;
 function say(message){status.textContent=message;}
 function resetPose(){for(const [b,r]of rest)b.quaternion.copy(r.q);root.position.y=0;}
 function rotate(name,angle){const b=bone(name),r=rest.get(b);if(b&&r)b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(r.axis,angle));}
 function updateMatrices(){root.updateMatrixWorld(true);}
 function notify(){onChange();invalidate();}
 function controls(){for(const b of buttons){const active=b.dataset.personAction===routine||(b.dataset.personAction==='walk'&&walkMode);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}}
 function releaseProp(restore=true){if(!prop)return;if(restore){prop.object.position.copy(prop.position);prop.object.quaternion.copy(prop.quaternion);}prop=null;}
 function stop(message='Standing · choose a routine'){
  releaseProp();phase='idle';routine=null;pending=null;path=[];walkMode=false;seat.visible=false;resetPose();controls();say(message);notify();
 }
 function blockers(){
  const result=[];root.updateMatrixWorld(true);const height=Number(document.querySelector('#person-height').value)/1000;
  for(const item of furniture){if(item.id==='mirror')continue;item.object.updateWorldMatrix(true,true);item.object.traverse(o=>{
   if(!o.isMesh)return;for(let p=o;p&&p!==item.object.parent;p=p.parent)if(p.userData.styling)return;
   const bounds=new THREE.Box3().setFromObject(o);if(bounds.max.y>.06&&bounds.min.y<height-.04)result.push(bounds);
  });}return result;
 }
 function prepare(){onFocus();document.querySelector('#show-person').checked=true;onChange();}
 function beginWalk(point,after=null){
  const route=findWalkPath(root.position,point,blockers(),.22*Math.min(1.12,Number(document.querySelector('#person-height').value)/1700));
  if(!route){say('No clear route. Move furniture or choose a clear aisle position.');return false;}
  path=route;pending=after;phase='walking';elapsed=0;startPose=null;notify();return true;
 }
 function walkTo(point){prepare();stop();routine='walk';walkMode=false;if(beginWalk(point)){controls();say('Walking to your point');}else routine=null;controls();}
 function worldPoint(o,offset=new THREE.Vector3()){return o.localToWorld(offset.clone());}
 function chooseAsset(type,selected){
  if(selected&&((type==='clothes'&&selected.userData.kind==='garment')||(type==='shoes'&&selected.userData.name==='The perfect pair')))return selected;
  return assets.filter(a=>{const y=a.getWorldPosition(new THREE.Vector3()).y;return type==='clothes'?a.userData.kind==='garment'&&y<1.2&&a.getWorldPosition(new THREE.Vector3()).x>1.5:a.userData.name==='The perfect pair'&&y>1&&y<1.3;}).sort((a,b)=>Math.abs(a.getWorldPosition(new THREE.Vector3()).z-1.2)-Math.abs(b.getWorldPosition(new THREE.Vector3()).z-1.2))[0];
 }
 function start(action,selected){
  if(action==='stand'&&phase==='seated'){phase='rising';routine='stand';elapsed=0;controls();say('Standing up');invalidate();return;}
  prepare();stop();
  if(action==='stand')return;
  if(action==='walk'){walkMode=true;routine='walk';controls();say('Tap a clear spot on the floor to walk there');notify();return;}
  routine=action;controls();
  if(action==='sit'){
   if(!beginWalk({x:.65,z:1.12},()=>{phase='sitting';elapsed=0;root.rotation.y=0;sitPose(0);seat.visible=true;say('Sitting on the temporary fitting seat');}))routine=null;
  }else{
   const object=chooseAsset(action,selected);if(!object){stop('No suitable item is available');return;}
   object.updateWorldMatrix(true,true);const target=object.getWorldPosition(new THREE.Vector3());
   const approach=action==='shoes'?new THREE.Vector3(0,0,.53).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion())):new THREE.Vector3(-.55,0,0).applyQuaternion(object.parent.getWorldQuaternion(new THREE.Quaternion()));
   // Rear-return garments have their hangers rotated 90°.
   if(action==='clothes'&&object.userData.slide?.axis==='x')approach.set(0,0,.55).applyQuaternion(object.parent.getWorldQuaternion(new THREE.Quaternion()));
   const goal={x:target.x+approach.x,z:target.z+approach.z};
   if(!beginWalk(goal,()=>{
    phase='interacting';elapsed=0;root.rotation.y=Math.atan2(target.x-root.position.x,target.z-root.position.z);
    prop={object,position:object.position.clone(),quaternion:object.quaternion.clone(),origin:target.clone()};
    startPose=target.clone();if(action==='shoes')startPose.y+=.07;
    finalPoint=startPose.clone();
    const shift=action==='shoes'?new THREE.Vector3(.10,0,0).applyQuaternion(object.parent.getWorldQuaternion(new THREE.Quaternion())):new THREE.Vector3(0,0,.06).applyQuaternion(object.parent.getWorldQuaternion(new THREE.Quaternion()));
    finalPoint.add(shift);
    if(action==='clothes'&&object.userData.slide){const axis=object.userData.slide.axis,local=object.position.clone();local[axis]=THREE.MathUtils.clamp(local[axis]+.06,object.userData.slide.min,object.userData.slide.max);finalPoint=worldPoint(object.parent,local);}
    holdPoint=root.localToWorld(new THREE.Vector3(-.18,1.07*model.scale.x,.32));
    say(action==='shoes'?'Picking up and repositioning the shoes':'Taking a garment from the rail');
   })){routine=null;controls();}
  }
 }
 // CCD at the genuine shoulder and elbow joints; the hand and prop share a point.
 function reach(target){
  if(!wrist)return;updateMatrices();
  for(let i=0;i<10;i++)for(const name of ['lowerarm01.R','upperarm01.R']){
   const joint=bone(name);if(!joint)continue;
   const pivot=joint.getWorldPosition(new THREE.Vector3()),end=wrist.getWorldPosition(new THREE.Vector3()),a=end.sub(pivot),b=target.clone().sub(pivot);
   if(a.lengthSq()<1e-8||b.lengthSq()<1e-8)continue;
   const q=new THREE.Quaternion().setFromUnitVectors(a.normalize(),b.normalize()),angle=2*Math.acos(THREE.MathUtils.clamp(q.w,-1,1));
   if(angle>.30)q.slerpQuaternions(new THREE.Quaternion(),q,.30/angle);
   const parentQ=joint.parent.getWorldQuaternion(new THREE.Quaternion());joint.quaternion.premultiply(parentQ.clone().invert().multiply(q).multiply(parentQ));updateMatrices();
  }
 }
 function sitPose(t){
  const p=smooth(t),scale=Number(document.querySelector('#person-height').value)/1700;
  rotate('upperleg01.L',-Math.PI*.48*p);rotate('upperleg01.R',-Math.PI*.48*p);
  rotate('lowerleg01.L',Math.PI*.49*p);rotate('lowerleg01.R',Math.PI*.49*p);
  rotate('upperarm01.L',-.35*p);rotate('upperarm01.R',-.35*p);rotate('lowerarm01.L',-.45*p);rotate('lowerarm01.R',-.45*p);
  root.position.y=-.43*scale*p;updateMatrices();
  seat.position.set(root.position.x,0,root.position.z-.09);seat.scale.y=scale;
 }
 function update(dt){
  if(phase==='idle')return false;
  if(phase==='seated')return false;
  elapsed+=dt;resetPose();
  if(phase==='walking'){
   const next=path[0],distance=Math.hypot(next.x-root.position.x,next.z-root.position.z),step=.55*dt;
   if(distance>0){root.rotation.y=THREE.MathUtils.lerp(root.rotation.y,root.rotation.y+Math.atan2(Math.sin(Math.atan2(next.x-root.position.x,next.z-root.position.z)-root.rotation.y),Math.cos(Math.atan2(next.x-root.position.x,next.z-root.position.z)-root.rotation.y)),Math.min(1,dt*12));const amount=Math.min(step/distance,1);root.position.x+=(next.x-root.position.x)*amount;root.position.z+=(next.z-root.position.z)*amount;walkDistance+=Math.min(step,distance);}
   const gait=Math.sin(walkDistance*18),knee=Math.max(0,Math.cos(walkDistance*18));
   rotate('upperleg01.L',gait*.25);rotate('upperleg01.R',-gait*.25);rotate('lowerleg01.L',knee*.28);rotate('lowerleg01.R',(1-knee)*.28);rotate('upperarm01.L',-gait*.18);rotate('upperarm01.R',gait*.18);
   if(distance<=step){path.shift();if(!path.length){resetPose();if(pending){const fn=pending;pending=null;fn();}else{phase='idle';lastAction='walk';routine=null;completed++;controls();say('Arrived · choose another routine');onChange();}}}
  }else if(phase==='sitting'){
   sitPose(elapsed/1.25);if(elapsed>=1.25){phase='seated';completed++;lastAction='sit';say(`Seated · temporary ${Math.round(.45*seat.scale.y*1000)} mm fitting seat. Tap Stand to get up.`);onChange();}
  }else if(phase==='rising'){
   sitPose(1-elapsed/1.25);if(elapsed>=1.25)stop();
  }else if(phase==='interacting'){
   const t=elapsed;rotate('spine03',.08*Math.sin(Math.min(t/3.6,1)*Math.PI));updateMatrices();
   const resting=wrist.getWorldPosition(new THREE.Vector3());let target;
   if(t<.8)target=resting.lerp(startPose,smooth(t/.8));
   else if(t<1.5)target=startPose.clone().lerp(holdPoint,smooth((t-.8)/.7));
   else if(t<2.1)target=holdPoint.clone();
   else if(t<3.0)target=holdPoint.clone().lerp(finalPoint,smooth((t-2.1)/.9));
   else target=finalPoint.clone().lerp(resting,smooth((t-3)/.6));
   reach(target);
   if(t>=.8&&t<3){const hand=wrist.getWorldPosition(new THREE.Vector3());if(routine==='shoes')hand.y-=.07;prop.object.position.copy(prop.object.parent.worldToLocal(hand));}
   if(t>=3&&prop){const final=finalPoint.clone();if(routine==='shoes')final.y-=.07;prop.object.position.copy(prop.object.parent.worldToLocal(final));}
   if(t>=3.6){const moved=prop.object;prop=null;phase='idle';lastAction=routine;routine=null;completed++;resetPose();controls();say(lastAction==='shoes'?'Shoes moved · choose another routine':'Garment returned to the rail · choose another routine');onAssetMoved?.(moved);onChange();}
  }
  updateMatrices();return true;
 }
 for(const button of buttons){button.disabled=false;button.onclick=()=>start(button.dataset.personAction);}
 return {start,stop,update,walkTo,get walkMode(){return walkMode;},get active(){return phase!=='idle'||walkMode;},getState:()=>({phase,routine,walkMode,completed,lastAction,carrying:!!prop&&elapsed>=.8&&elapsed<3,seatVisible:seat.visible,hand:wrist?.getWorldPosition(new THREE.Vector3()).toArray(),assetPosition:prop?.object.getWorldPosition(new THREE.Vector3()).toArray(),boneCount:bones.size})};
}
