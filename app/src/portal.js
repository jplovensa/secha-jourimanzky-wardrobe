import './portal.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM } from './model.js';
import { CHEST, ENTRANCE, RAIL_HEIGHTS, buildShoeRack } from './wardrobe-geometry.js';
import sharedUpdates from '../work-updates.json';

const $ = (id) => document.getElementById(id);
const rooms = {
  master: ['Kamar utama',['Pengecatan ulang dinding dan plafon.','Pintu baru, kusen, engsel dan kunci.','Pembaruan kusen jendela sesuai kondisi.']],
  bath: ['Kamar mandi',['Cat ulang bidang bercat dan plafon.','Rapikan jalur kabel serta titik sambungan.']],
  kitchen: ['Dapur',['Pengecatan ulang bidang bercat dan plafon.']],
  dining: ['Ruang makan',['Pengecatan ulang dinding dan plafon.']],
  living: ['Ruang keluarga',['Pengecatan ulang dinding dan plafon.','Pembaruan kusen jendela sesuai kondisi.']],
  work: ['Ruang kerja',['Pengecatan ulang dinding dan plafon.','Pembaruan kusen jendela sesuai kondisi.']],
  wic: ['Wardrobe',['Pengecatan ulang dinding dan plafon.','Tambal lokal plafon yang rusak.','Pasang H01 gantungan L, C01 kabinet empat laci dan S01 rak sepatu terbuka.']],
};
const emptyPlan = {
  source:'WIC · shop drawing SD-01 · muat denah proyek untuk melihat seluruh apartemen.',
  zones:[{id:'wic',points:[[0,0],[ROOM.width,0],[ROOM.width,ROOM.depth],[0,ROOM.depth]]}],
  walls:[[0,0,ROOM.width,0],[0,0,0,ROOM.depth],[ROOM.width,0,ROOM.width,ROOM.depth],[0,ROOM.depth,ROOM.width-ENTRANCE.width,ROOM.depth]],
  wardrobe:{x:0,z:0,rotation:0},
};
const storageKey='secha-jouri-work-drafts-v1';
let drafts=[];
try { const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))drafts=saved; } catch {}
let selected='wic', plan=emptyPlan;
const origin = new THREE.Vector3();
let renderer, camera, controls, scene, model, hitTargets=[], view='orbit';
const host=$('scene');
function element(tag,content){const e=document.createElement(tag);e.textContent=content;return e;}
function select(id){
 selected=id;
 $('scope').replaceChildren(...rooms[id][1].map(line=>element('li',line)));
 $('post-room').value=id;
 for(const b of $('areas').children)b.setAttribute('aria-pressed',String(b.dataset.room===id));
 for(const mesh of hitTargets)mesh.material.color.set(mesh.userData.room===id?'#a9bb95':mesh.userData.baseColor);
 const entries=[...drafts.map(row=>({...row,draft:true})),...sharedUpdates].filter(row=>row.room===id);
 $('posts').replaceChildren(...(entries.length?entries.map(row=>{
   const article=document.createElement('article');
   article.append(element('small',[row.date,row.status,row.draft?'Draf lokal':'Pembaruan bersama'].filter(Boolean).join(' · ')),element('p',row.title),element('p',row.detail));
   article.children[1].style.fontWeight='650';
   return article;
 }):[element('p','Belum ada perubahan tercatat untuk area ini.')]));
}
for(const [id,[name]] of Object.entries(rooms)){
 const b=element('button',name);b.dataset.room=id;b.onclick=()=>select(id);$('areas').append(b);
 const option=element('option',name);option.value=id;$('post-room').append(option);
}
function box(w,h,d,x,y,z,material,parent=model){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function display(planData){
 plan=planData;$('source').textContent=plan.source;
 if(!renderer)return;
 if(model){
   const materials=new Set();
   model.traverse(obj=>{obj.geometry?.dispose();if(obj.material)materials.add(obj.material);});
   materials.forEach(material=>material.dispose());scene.remove(model);
 }
 model=new THREE.Group();scene.add(model);hitTargets=[];
 const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.88});
 const wall=mat('#f3eee1'),wood=mat('#9a6b47'),dark=mat('#393935');
 for(const {id,points} of plan.zones){
   const shape=new THREE.Shape();
   points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
   shape.closePath();
   const baseColor=['master','work'].includes(id)?'#c1ab8e':'#e2daca';
   const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(baseColor));
   floor.rotation.x=-Math.PI/2;floor.userData={room:id,baseColor};model.add(floor);hitTargets.push(floor);
 }
 for(const [a,b,c,d] of plan.walls){
   const wallMesh=box(Math.hypot(c-a,d-b),.67,.13,(a+c)/2,.335,(b+d)/2,wall);
   wallMesh.rotation.y=-Math.atan2(d-b,c-a);
 }
 if(plan.wardrobe){
   const {x,z,rotation}=plan.wardrobe;
   const furniture=new THREE.Group();furniture.position.set(x,0,z);furniture.rotation.y=rotation;model.add(furniture);
   const place=(...args)=>box(...args,furniture);
   buildShoeRack(place,wood);
   place(CHEST.width,.9,.4,CHEST.x,.45,.2,wood);
   for(let i=0;i<4;i++)place(.85,.012,.022,CHEST.x,.115+i*.2,.403,dark);
   for(const y of RAIL_HEIGHTS){place(.026,.026,1.45,.3,y,1.025,dark);place(.75,.026,.026,.675,y,.3,dark);}
 }
 const bounds=new THREE.Box3().setFromObject(model);bounds.getCenter(origin);origin.y=0;
 select(plan.zones.some(z=>z.id===selected)?selected:plan.zones[0].id);
 setView(view);
}
function setView(mode){
 view=mode;$('orbit').setAttribute('aria-pressed',String(mode==='orbit'));$('top').setAttribute('aria-pressed',String(mode==='top'));
 if(!renderer)return;
 const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
 const span=Math.max(size.x,size.z)*(host.clientWidth/host.clientHeight<1?1.55:1);
 controls.target.copy(origin);
 camera.position.copy(origin).addScaledVector(mode==='top'?new THREE.Vector3(0,1.45,.001):new THREE.Vector3(.64,1.18,1.02),span);
 camera.lookAt(origin);controls.update();
}
function valid(data){
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<100);
 return data&&typeof data.source==='string'&&Array.isArray(data.zones)&&data.zones.length>0&&data.zones.length<=7&&new Set(data.zones.map(z=>z?.id)).size===data.zones.length&&
  data.zones.every(z=>z&&Object.hasOwn(rooms,z.id)&&Array.isArray(z.points)&&z.points.length>=3&&z.points.length<=32&&z.points.every(point))&&
  Array.isArray(data.walls)&&data.walls.length<100&&data.walls.every(w=>Array.isArray(w)&&w.length===4&&point(w.slice(0,2))&&point(w.slice(2)))&&
  (!data.wardrobe||point([data.wardrobe.x,data.wardrobe.z])&&Number.isFinite(data.wardrobe.rotation));
}
$('orbit').onclick=()=>setView('orbit');$('top').onclick=()=>setView('top');
$('plan-file').onchange=async(event)=>{
 try{
   const file=event.target.files[0];if(!file)return;if(file.size>40000)throw Error();
   const data=JSON.parse(await file.text());if(!valid(data))throw Error();
   display(data);$('notice').textContent='Denah dimuat di perangkat ini.'; 
 }catch{$('notice').textContent='File denah tidak dapat dibaca. Pilih JSON denah proyek.';}
 finally{event.target.value='';}
};
$('compose').onsubmit=(event)=>{
 event.preventDefault();
 const values=new FormData(event.currentTarget);
 const title=String(values.get('title')).trim(), detail=String(values.get('detail')).trim(),room=$('post-room').value;
 if(!title||!detail)return;
 const post={id:crypto.randomUUID(),room,title,detail,status:values.get('status'),date:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta'}).format(new Date())};
 const next=[post,...drafts];
 try{localStorage.setItem(storageKey,JSON.stringify(next));drafts=next;$('notice').textContent='Draf tersimpan di perangkat ini.';}
 catch{drafts=next;$('notice').textContent='Penyimpanan browser tidak tersedia. Ekspor draf sebelum menutup portal.';}
 event.currentTarget.reset();select(room);
};
$('download').onclick=()=>{
 const byId=new Map([...sharedUpdates,...drafts].map(row=>[row.id,row]));
 const url=URL.createObjectURL(new Blob([JSON.stringify([...byId.values()],null,2)+'\n'],{type:'application/json'}));
 const a=element('a','');a.href=url;a.download='work-updates.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
try{
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setClearColor('#e8e8de');host.append(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(39,1,.05,150);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;
 scene.add(new THREE.HemisphereLight('#fff8e7','#869184',2.25));
 const key=new THREE.DirectionalLight('#fff4df',2);key.position.set(-4,12,4);scene.add(key);
 const resize=()=>{const {clientWidth:w,clientHeight:h}=host;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
 new ResizeObserver(resize).observe(host);resize();display(plan);
 let down;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{
   if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
   const r=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();
   ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);
   const hit=ray.intersectObjects(hitTargets)[0];if(hit)select(hit.object.userData.room);
 });
 renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
}catch{host.textContent='Tampilan 3D memerlukan WebGL. Daftar ruang dan log tetap tersedia.';}
 select(selected);
