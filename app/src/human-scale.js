import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM } from './model.js';
export const PERSON_PLACES = Object.freeze({aisle:{x:.75,z:1.20,yaw:0},entrance:{x:.403,z:1.90,yaw:Math.PI},drawers:{x:.65,z:.98,yaw:Math.PI},shoes:{x:.85,z:1.28,yaw:.65}});
export function headroomMM(heightMM){return Math.round(ROOM.height*1000-heightMM);}
export function createHumanScale({scene,furniture,invalidate,onFocus}){
 const root=new THREE.Group();root.name='MakeHuman / clothed scale figure';root.visible=false;scene.add(root);
 const show=document.querySelector('#show-person'),height=document.querySelector('#person-height'),status=document.querySelector('#person-status'),retry=document.querySelector('#person-retry');
 const x=document.querySelector('#person-x'),z=document.querySelector('#person-z'),yaw=document.querySelector('#person-yaw');
 let ready=false,failed=false,view='perspective',model=null,nativeHeight=1,loading=false;
 const box=new THREE.Box3();let fit=null;
 function visible(){root.visible=ready&&show.checked&&!['interior','walkthrough','plan'].includes(view);document.querySelector('#person-scale-tag').hidden=!root.visible;document.querySelector('#person-view-note').hidden=!show.checked||root.visible||!ready;}
 function refreshFit(){
  if(!ready)return;root.updateWorldMatrix(true,true);box.setFromObject(root);
  const collisions=[];
  for(const item of furniture){let overlap=false;item.object.updateWorldMatrix(true,true);item.object.traverse(object=>{
   if(overlap||!object.isMesh||!object.geometry)return;
   if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
   const other=object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld),intersection=box.clone().intersect(other);
   if(!intersection.isEmpty()){const s=intersection.getSize(new THREE.Vector3());if(s.x>.001&&s.y>.001&&s.z>.001)overlap=true;}
  });if(overlap)collisions.push(item.label);}
  const size=box.getSize(new THREE.Vector3());fit={heightMM:Math.round(size.y*1000),headroomMM:Math.round((ROOM.height-box.max.y)*1000),widthMM:Math.round(size.x*1000),leftWallMM:Math.round(box.min.x*1000),rightWallMM:Math.round((ROOM.width-box.max.x)*1000),inside:box.min.x>=-.001&&box.max.x<=ROOM.width+.001&&box.min.z>=-.001&&box.max.z<=ROOM.depth+.001&&box.max.y<=ROOM.height+.001,collisions};
  document.querySelector('#person-scale-tag').textContent=`MakeHuman ${fit.heightMM} mm · headroom ${fit.headroomMM} mm`;
  document.querySelector('#person-fit').textContent=`${fit.heightMM} mm figure · ${fit.headroomMM} mm headroom · ${fit.widthMM} mm overall width. ${!fit.inside?'Figure extends outside the main bay. ':''}${collisions.length?`Approximate overlap: ${collisions.join(', ')}.`:'No furniture overlap detected at this position.'}`;
 }
 function apply(){
  document.querySelector('#person-summary-height').textContent=`${height.value} mm figure`;
  document.querySelector('#person-height-value').textContent=`${height.value} mm`;
  root.position.set(Number(x.value)/1000,0,Number(z.value)/1000);root.rotation.y=THREE.MathUtils.degToRad(Number(yaw.value));
  if(model)model.scale.setScalar(Number(height.value)/1000/nativeHeight);
  visible();refreshFit();invalidate();
 }
 function place(id){const p=PERSON_PLACES[id];x.value=Math.round(p.x*1000);z.value=Math.round(p.z*1000);yaw.value=Math.round(THREE.MathUtils.radToDeg(p.yaw));apply();}
 async function load(){
  if(loading||ready)return;loading=true;failed=false;retry.hidden=true;status.textContent='Loading MakeHuman figure…';
  try{
   const gltf=await new GLTFLoader().loadAsync(new URL('./models/makehuman/person.glb',document.baseURI).href);
   const source=gltf.scene,b=new THREE.Box3().setFromObject(source),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
   nativeHeight=size.y;if(!Number.isFinite(nativeHeight)||nativeHeight<=0)throw new Error('Figure has invalid dimensions');
   source.position.sub(new THREE.Vector3(center.x,b.min.y,center.z));model=new THREE.Group();model.add(source);root.add(model);
   source.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
   ready=true;status.textContent='MakeHuman HM08 · MakeClothes outfit · relaxed standing pose';apply();
  }catch(error){failed=true;status.textContent='The scale figure could not load. The room is still available.';retry.hidden=false;document.querySelector('.person-tools').open=true;console.warn('MakeHuman figure load failed:',error.message);}
  finally{loading=false;}
 }
 show.onchange=()=>{if(show.checked&&!ready)load();apply();};height.oninput=apply;
 for(const field of [x,z,yaw])field.onchange=()=>{
  const value=Number(field.value),max=field===yaw?360:field===x?ROOM.width*1000:ROOM.depth*1000;
  if(!Number.isFinite(value)||value<0||value>max){place('aisle');status.textContent='Choose a figure position inside the measured main bay.';return;}apply();
 };
 document.querySelector('#person-place').onchange=event=>place(event.target.value);
 document.querySelector('#person-focus').onclick=onFocus;retry.onclick=load;
 place('aisle');load();
 return {setView:name=>{view=name;visible();invalidate();},refreshFit,getState:()=>({ready,failed,visible:root.visible,requestedHeightMM:Number(height.value),position:root.position.toArray(),rotation:root.rotation.y,fit,source:'MakeHuman HM08 / MakeClothes MHCLO',meshCount:model?(()=>{let n=0;model.traverse(o=>{if(o.isMesh)n++;});return n;})():0})};
}
