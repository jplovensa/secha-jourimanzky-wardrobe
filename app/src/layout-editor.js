import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
const round=value=>Math.round(value*1000)/1000;
export function validateRevision(data,ids){
 if(data?.version!==1||data.units!=='mm'||JSON.stringify(data.roomMM)!=='[2022,2157,2610]'||!Array.isArray(data.furniture)||data.furniture.length!==ids.length)throw new Error('Choose a Jourimanzky revision for the 2022 × 2157 × 2610 mm room.');
 const seen=new Set();
 for(const entry of data.furniture){
  if(!ids.includes(entry.id)||seen.has(entry.id)||!Array.isArray(entry.position)||entry.position.length!==3||!entry.position.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=5000)||typeof entry.rotation!=='number'||!Number.isFinite(entry.rotation)||Math.abs(entry.rotation)>3600)throw new Error('Revision has unknown furniture or invalid millimetre positions.');
  seen.add(entry.id);
 }
 return data.furniture;
}
export function createLayoutEditor({camera,renderer,scene,controls,items,invalidate,onEnter,onExit}){
 const panel=document.querySelector('#layout-editor'),select=document.querySelector('#furniture-select'),message=document.querySelector('#revision-status');
 const hint=document.querySelector('.viewer-bottom > div'),originalHint=hint.innerHTML;
 const fields=['x','y','z','rotation'].map(axis=>document.querySelector(`#layout-${axis}`));
 const gizmo=new TransformControls(camera,renderer.domElement);gizmo.setSize(.8);gizmo.setTranslationSnap(.025);gizmo.setRotationSnap(THREE.MathUtils.degToRad(15));
 const helper=gizmo.getHelper();scene.add(helper);helper.visible=false;
 const outline=new THREE.BoxHelper(items[0].object,'#91a177');outline.visible=false;scene.add(outline);
 let active=false,selected=items.find(item=>item.id==='chest')||items[0],history=[],future=[],dragStart=null,gesture=null,nativeCamera=null,cancellingHandle=false;
 // Position fields use the structural assembly, excluding movable styling props.
 const bounds=item=>{
  item.object.updateWorldMatrix(true,true);const result=new THREE.Box3(),part=new THREE.Box3();
  item.object.traverse(object=>{if(!object.isMesh||!object.geometry)return;for(let p=object;p&&p!==item.object.parent;p=p.parent)if(p.userData.styling)return;
   if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();part.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);result.union(part);
  });return result;
 };
 const snapshot=()=>items.map(item=>({id:item.id,position:item.object.position.toArray(),rotation:item.object.rotation.y}));
 const baseline=snapshot();
 const state=()=>items.map(item=>{const b=bounds(item);return {id:item.id,label:item.label,position:b.min.toArray().map(v=>round(v*1000)),rotation:round(THREE.MathUtils.radToDeg(item.object.rotation.y))};});
 function refresh(){
  if(!selected)return;if(active)outline.setFromObject(selected.object);const entry=state().find(item=>item.id===selected.id);
  fields.forEach((field,i)=>{field.value=i===3?entry.rotation:entry.position[i];});
  document.querySelector('#layout-undo').disabled=history.length===0;document.querySelector('#layout-redo').disabled=future.length===0;
  invalidate();
 }
 function applySnapshot(data){for(const entry of data){const item=items.find(i=>i.id===entry.id);item.object.position.fromArray(entry.position);item.object.rotation.set(0,entry.rotation,0);}scene.updateMatrixWorld(true);refresh();}
 function record(before){if(JSON.stringify(before)===JSON.stringify(snapshot()))return;history.push(before);if(history.length>50)history.shift();future=[];refresh();}
 function choose(id){selected=items.find(i=>i.id===id)||items[0];select.value=selected.id;if(active)gizmo.attach(selected.object);refresh();}
 for(const item of items){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;select.append(option);}
 select.onchange=()=>choose(select.value);
 for(const field of fields)field.onchange=()=>{
  const values=fields.map(f=>Number(f.value));
  if(fields.some(f=>f.value.trim()==='')||values.some(v=>!Number.isFinite(v)||Math.abs(v)>5000)){message.textContent='Use finite positions between −5000 and 5000 mm.';refresh();return;}
  const before=snapshot();selected.object.rotation.y=THREE.MathUtils.degToRad(values[3]);selected.object.updateWorldMatrix(true,true);
  const b=bounds(selected);selected.object.position.add(new THREE.Vector3(values[0]/1000-b.min.x,values[1]/1000-b.min.y,values[2]/1000-b.min.z));
  selected.object.updateWorldMatrix(true,true);record(before);message.textContent='Position updated. Export a revision to keep these changes.';
 };
 gizmo.addEventListener('dragging-changed',event=>{if(active)controls.enabled=!event.value;});
 gizmo.addEventListener('mouseDown',()=>{if(active)dragStart=snapshot();});
 gizmo.addEventListener('mouseUp',()=>{if(active&&dragStart){if(!cancellingHandle){record(dragStart);message.textContent='Furniture moved. Export a revision to keep it.';}dragStart=null;}restoreCamera(nativeCamera);nativeCamera=null;});
 gizmo.addEventListener('objectChange',refresh);
 document.querySelectorAll('[data-transform]').forEach(button=>button.onclick=()=>{
  gizmo.setMode(button.dataset.transform);const rotate=button.dataset.transform==='rotate';gizmo.showX=!rotate;gizmo.showY=true;gizmo.showZ=!rotate;
  document.querySelectorAll('[data-transform]').forEach(b=>b.classList.toggle('active',b===button));
 });
 document.querySelector('#layout-snap').onchange=event=>{gizmo.setTranslationSnap(event.target.checked?.025:null);gizmo.setRotationSnap(event.target.checked?THREE.MathUtils.degToRad(15):null);};
 document.querySelector('#layout-undo').onclick=()=>{if(!history.length)return;future.push(snapshot());applySnapshot(history.pop());message.textContent='Last edit undone.';};
 document.querySelector('#layout-redo').onclick=()=>{if(!future.length)return;history.push(snapshot());applySnapshot(future.pop());message.textContent='Edit restored.';};
 document.querySelector('#layout-reset').onclick=()=>{const before=snapshot();applySnapshot(baseline);record(before);message.textContent='Furniture returned to the measured floorplan.';};
 document.querySelector('#layout-export').onclick=()=>{
  const data={version:1,units:'mm',roomMM:[2022,2157,2610],furniture:state().map(({id,position,rotation})=>({id,position,rotation}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='jourimanzky-layout-revision.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='Revision exported. Import this JSON to continue editing later.';
 };
 const file=document.querySelector('#revision-file');document.querySelector('#layout-import').onclick=()=>file.click();
 file.onchange=async()=>{try{
  const selectedFile=file.files[0];if(!selectedFile)return;if(selectedFile.size>262144)throw new Error('Revision file must be smaller than 256 KB.');
  const entries=validateRevision(JSON.parse(await selectedFile.text()),items.map(i=>i.id)),before=snapshot();
  for(const entry of entries){const item=items.find(i=>i.id===entry.id);item.object.rotation.y=THREE.MathUtils.degToRad(entry.rotation);item.object.updateWorldMatrix(true,true);const b=bounds(item);item.object.position.add(new THREE.Vector3(...entry.position).multiplyScalar(.001).sub(b.min));item.object.updateWorldMatrix(true,true);}
  record(before);refresh();message.textContent='Revision imported. You can undo this import.';
 }catch(error){message.textContent=error.message;}finally{file.value='';}};
 const canvas=renderer.domElement,ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function setRay(event){
  const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
  camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);return pointer;
 }
 function freezeCamera(){
  // OrbitControls.update() still applies inertia when enabled=false. Clear that
  // inertia without changing the visible camera before calculating the drag ray.
  const saved={damping:controls.enableDamping},position=camera.position.clone(),target=controls.target.clone();
  controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(target);controls.update();controls.enabled=false;camera.updateMatrixWorld(true);return saved;
 }
 function restoreCamera(saved){if(!saved)return;controls.enableDamping=saved.damping;controls.enabled=active;}
 function finishBody(cancelled=false){
  if(!gesture)return;const drag=gesture;gesture=null;
  if(cancelled){applySnapshot(drag.before);message.textContent='Drag cancelled. Furniture returned to its previous position.';}
  else if(drag.moved){record(drag.before);message.textContent='Furniture placed. Undo reverses this drag; export a revision to save it.';}
  restoreCamera(drag.camera);gizmo.enabled=true;canvas.style.cursor=active?'grab':'';
  if(canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);refresh();
 }
 function cancelHandle(){
  if(!gizmo.dragging)return;const before=dragStart;cancellingHandle=true;gizmo.pointerUp({button:0});cancellingHandle=false;
  // Native TransformControls registers a temporary pointermove listener per drag.
  // Reconnect after cancellation so a lost touch cannot leave that listener live.
  gizmo.disconnect();gizmo.connect(canvas);if(before)applySnapshot(before);restoreCamera(nativeCamera);nativeCamera=null;
 }
 canvas.addEventListener('pointerdown',event=>{
  if(!active||event.button!==0)return;
  if(gesture){event.preventDefault();event.stopImmediatePropagation();return;}
  setRay(event);
  gizmo.pointerHover({x:pointer.x,y:pointer.y,button:0});
  if(gizmo.axis!==null){nativeCamera=freezeCamera();return;}
  const hit=ray.intersectObjects(items.map(item=>item.object),true)[0];if(!hit)return;
  let object=hit.object;while(object&&!object.userData.furnitureId)object=object.parent;if(!object)return;
  choose(object.userData.furnitureId);
  const saved=freezeCamera();setRay(event);
  const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-hit.point.y),start=ray.ray.intersectPlane(plane,new THREE.Vector3());
  if(!start){restoreCamera(saved);return;}
  gesture={id:event.pointerId,clientX:event.clientX,clientY:event.clientY,before:snapshot(),object:selected.object,plane,start,origin:selected.object.getWorldPosition(new THREE.Vector3()),edges:bounds(selected),camera:saved,moved:false};
  gizmo.enabled=false;canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';
  event.preventDefault();event.stopImmediatePropagation();
 },{capture:true});
 canvas.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.id)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!gesture.moved&&Math.hypot(event.clientX-gesture.clientX,event.clientY-gesture.clientY)<4)return;
  setRay(event);const point=ray.ray.intersectPlane(gesture.plane,new THREE.Vector3());if(!point)return;
  const step=document.querySelector('#layout-snap').checked?.025:0,delta=point.sub(gesture.start);
  if(step){delta.x=Math.round(delta.x/step)*step;delta.z=Math.round(delta.z/step)*step;}
  delta.x=THREE.MathUtils.clamp(delta.x,-5-gesture.edges.min.x,5-gesture.edges.min.x);delta.z=THREE.MathUtils.clamp(delta.z,-5-gesture.edges.min.z,5-gesture.edges.min.z);
  const world=gesture.origin.clone().add(new THREE.Vector3(delta.x,0,delta.z));
  gesture.object.position.copy(gesture.object.parent.worldToLocal(world));gesture.object.updateWorldMatrix(true,true);gesture.moved=true;
  refresh();
 },{capture:true});
 canvas.addEventListener('pointerup',event=>{
  if(!gesture||event.pointerId!==gesture.id)return;event.preventDefault();event.stopImmediatePropagation();finishBody();
 },{capture:true});
 canvas.addEventListener('pointercancel',event=>{if(gesture&&event.pointerId===gesture.id){event.stopImmediatePropagation();finishBody(true);}else if(active)cancelHandle();},{capture:true});
 canvas.addEventListener('lostpointercapture',event=>{if(gesture&&event.pointerId===gesture.id)finishBody(true);else if(active)cancelHandle();});
 document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){if(gesture){event.preventDefault();finishBody(true);}else cancelHandle();}});
 window.addEventListener('blur',()=>{if(gesture)finishBody(true);if(active)cancelHandle();});
 function stop(){if(!active)return;if(gesture)finishBody(true);cancelHandle();active=false;canvas.style.cursor='';hint.innerHTML=originalHint;gizmo.detach();helper.visible=false;outline.visible=false;panel.hidden=true;controls.enabled=true;invalidate();}
 function start(){onEnter();active=true;panel.hidden=false;panel.classList.remove('minimized');document.querySelector('#layout-collapse').textContent='Minimise panel';helper.visible=true;outline.visible=true;canvas.style.cursor='grab';hint.textContent='Drag furniture to move · Drag empty space to orbit';controls.enabled=true;gizmo.setMode('translate');document.querySelectorAll('[data-transform]').forEach(button=>button.classList.toggle('active',button.dataset.transform==='translate'));gizmo.showX=gizmo.showY=gizmo.showZ=true;choose(selected.id);message.textContent='Drag furniture to place it across the floor. Use handles for height or rotation; Escape cancels a drag.';}
 document.querySelector('#layout-collapse').onclick=()=>{const small=panel.classList.toggle('minimized');document.querySelector('#layout-collapse').textContent=small?'Show position fields':'Minimise panel';};
 document.querySelector('#layout-done').onclick=()=>{stop();onExit();document.querySelector('#edit-layout').focus();};
 refresh();
 return {handleScreen:axis=>{
  helper.updateMatrixWorld(true);camera.updateMatrixWorld(true);const candidates=[];
  helper.traverse(object=>{if(!object.isMesh||object.name!==axis)return;for(let p=object;p&&p!==helper.parent;p=p.parent)if(!p.visible)return;const point=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());candidates.push(point);});
  candidates.sort((a,b)=>b.y-a.y);if(!candidates.length)return null;const p=candidates[0].project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};
 },screenPoint:id=>{const item=items.find(i=>i.id===id),b=bounds(item);const p=new THREE.Vector3(b.min.x+(b.max.x-b.min.x)*.2,b.min.y+(b.max.y-b.min.y)*.68,b.max.z+.001);camera.updateMatrixWorld(true);p.project(camera);const r=renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};},start,stop,get active(){return active;},getState:()=>({active,selected:selected.id,furniture:state(),canUndo:history.length>0,canRedo:future.length>0})};
}
