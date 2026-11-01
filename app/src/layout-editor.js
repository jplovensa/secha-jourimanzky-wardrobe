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
 const fields=['x','y','z','rotation'].map(axis=>document.querySelector(`#layout-${axis}`));
 const gizmo=new TransformControls(camera,renderer.domElement);gizmo.setSize(.8);gizmo.setTranslationSnap(.025);gizmo.setRotationSnap(THREE.MathUtils.degToRad(15));
 const helper=gizmo.getHelper();scene.add(helper);helper.visible=false;
 const outline=new THREE.BoxHelper(items[0].object,'#91a177');outline.visible=false;scene.add(outline);
 let active=false,selected=items.find(item=>item.id==='chest')||items[0],history=[],future=[],dragStart=null,down=null;
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
 gizmo.addEventListener('mouseUp',()=>{if(active&&dragStart){record(dragStart);dragStart=null;message.textContent='Furniture moved. Export a revision to keep it.';}});
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
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',event=>{if(active&&!gizmo.dragging)down={x:event.clientX,y:event.clientY};});
 renderer.domElement.addEventListener('pointerup',event=>{
  if(!active||!down||gizmo.dragging)return;const start=down;down=null;if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>5)return;
  const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObjects(items.map(i=>i.object),true)[0];if(!hit)return;let object=hit.object;while(object&&!object.userData.furnitureId)object=object.parent;if(object)choose(object.userData.furnitureId);
 });
 function stop(){if(!active)return;active=false;gizmo.detach();helper.visible=false;outline.visible=false;panel.hidden=true;controls.enabled=true;invalidate();}
 function start(){onEnter();active=true;panel.hidden=false;panel.classList.remove('minimized');document.querySelector('#layout-collapse').textContent='Minimise panel';helper.visible=true;outline.visible=true;controls.enabled=true;gizmo.setMode('translate');document.querySelectorAll('[data-transform]').forEach(button=>button.classList.toggle('active',button.dataset.transform==='translate'));gizmo.showX=gizmo.showY=gizmo.showZ=true;choose(selected.id);message.textContent='Select furniture, drag the handles, or enter edge positions in millimetres.';}
 document.querySelector('#layout-collapse').onclick=()=>{const small=panel.classList.toggle('minimized');document.querySelector('#layout-collapse').textContent=small?'Show position fields':'Minimise panel';};
 document.querySelector('#layout-done').onclick=()=>{stop();onExit();document.querySelector('#edit-layout').focus();};
 refresh();
 return {start,stop,get active(){return active;},getState:()=>({active,selected:selected.id,furniture:state(),canUndo:history.length>0,canRedo:future.length>0})};
}
