import { createMaterials, roundedGeometry, makeGarment, makeShoePair, makeBag, addCountertopStyling } from './realism.js';
import { createLayoutEditor } from './layout-editor.js';
import { createWalkthrough } from './walkthrough.js';
import { showFailure, showReady } from './startup.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROOM, SHOE_RACK, QUESTS, clampAsset } from './model.js';

const $ = s => document.querySelector(s);
const completed = new Set();
$('#quests').innerHTML = QUESTS.map((q,i)=>`<div class="quest" data-quest="${i}"><span>${i+1}</span>${q}</div>`).join('');
function complete(i){completed.add(i);const el=$(`[data-quest="${i}"]`);el.classList.add('done');el.querySelector('span').textContent='✓';$('#progress').style.width=`${completed.size/QUESTS.length*100}%`;$('#progress-count').textContent=`${completed.size} / ${QUESTS.length}`;if(completed.size===QUESTS.length)$('#achievement').textContent='✦ Wardrobe explorer unlocked. Five discoveries, one considered space.';}
let toastTimer;
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
try { init(); } catch(error){console.error(error);window.dispatchEvent(new Event('showcase-failed'));showFailure('The 3D renderer could not start. Enable WebGL 2 / hardware acceleration in a current browser, then retry.');}
function init(){
const host=$('#canvas-host');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;host.appendChild(renderer.domElement);
let dirty=true;
const invalidate=()=>{dirty=true;};
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);window.dispatchEvent(new Event('showcase-failed'));showFailure('The graphics connection was lost. Close other graphics-heavy tabs and retry the showcase.');});
document.addEventListener('click',invalidate);document.addEventListener('change',invalidate);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6e3d9');const camera=new THREE.PerspectiveCamera(38,1,.03,50);
const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;scene.environmentIntensity=.4;
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(1,1.1,1);controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.4;controls.maxDistance=9;
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const materials=createMaterials();
const {wood,wall,floor,linen}=materials;
const black=mat('#252724',.34,.75),brass=mat('#a58d5e',.28,.85);
// Floorplan datum: x=0 left wall, z=0 rear wall; no mirrored transform.
const room=new THREE.Group();scene.add(room);
const furniture=[];
function registerFurniture(object,id,label){object.userData.furnitureId=id;furniture.push({id,label,object,basePosition:object.position.clone()});return object;}
function collectFurniture(start,id,label,pivot){
 const children=room.children.slice(start),group=new THREE.Group();group.position.fromArray(pivot);room.add(group);group.updateMatrixWorld(true);children.forEach(child=>group.attach(child));return registerFurniture(group,id,label);
}
function box(w,h,d,x,y,z,m,parent=room){const mesh=new THREE.Mesh(((m===wood||m===linen)?roundedGeometry(w,h,d,m===linen?.012:.004):new THREE.BoxGeometry(w,h,d)),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function rod(a,b,r=.012,m=black,parent=room){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),m);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;parent.add(o);return o;}
const finishedFloor=box(ROOM.width,.12,ROOM.depth,ROOM.width/2,-.06,ROOM.depth/2,floor);
// Tile joints and slim perimeter skirting.
for(let x=.5;x<2.1;x+=.5)box(.002,.001,2.157,x,.001,1.078,mat('#afa895'));
for(let z=.5;z<2.2;z+=.5)box(2.022,.001,.002,1.011,.001,z,mat('#afa895'));
box(ROOM.width+.14,ROOM.height,.07,ROOM.width/2,ROOM.height/2,-.035,wall);
box(.07,ROOM.height,ROOM.depth,ROOM.width+.035,ROOM.height/2,ROOM.depth/2,wall);
const leftBacking=box(.07,ROOM.height,ROOM.depth,-.035,ROOM.height/2,ROOM.depth/2,wall);leftBacking.visible=false;
box(2.022,.055,.015,1.011,.027,.012,wall);box(.015,.055,2.157,2.01,.027,1.078,wall);
const mirrorStart=room.children.length;
// Full-height left mirror; front and ceiling cut away for the presentation.
const mirror=new Reflector(new THREE.PlaneGeometry(2.157,2.61),{color:0xc6ccc7,textureWidth:1024,textureHeight:1024,clipBias:.003});mirror.rotation.y=Math.PI/2;mirror.position.set(.006,1.305,1.0785);room.add(mirror);
rod([.008,0,0],[.008,2.61,0],.003,black);rod([.008,0,2.157],[.008,2.61,2.157],.003,black);
const mirrorFurniture=collectFurniture(mirrorStart,'mirror','Full left-wall mirror',[.006,ROOM.height/2,ROOM.depth/2]);
const interactables=[],drawers=[],assets=[];
function interactive(group,data){group.userData={...data,styling:['garment','asset'].includes(data.kind)};interactables.push(group);return group;}
interactive(mirror,{kind:'fixed',name:'Full left-wall mirror',description:'Full-height mirror · 2157 × 2610 mm nominal. The measured room orientation is mirror left, hanging right.'});
const chestStart=room.children.length;
// Chest carcass and four independently moving drawers.
box(.9,.025,.4,.472,.8875,.2,wood);box(.025,.88,.4,.034,.44,.2,wood);box(.025,.88,.4,.91,.44,.2,wood);box(.87,.85,.015,.472,.44,.012,wood);
for(let i=0;i<4;i++){const g=new THREE.Group();g.position.set(.472,.12+i*.215,.2);room.add(g);box(.855,.19,.025,0,0,.1875,wood,g);box(.80,.025,.34,0,-.075,0,wood,g);box(.016,.14,.34,-.4,0,0,wood,g);box(.016,.14,.34,.4,0,0,wood,g);box(.81,.14,.016,0,0,-.17,wood,g);box(.16,.012,.023,0,.035,.222,brass,g);interactive(g,{kind:'drawer',name:`Drawer ${i+1}`,description:'Rear-left teak chest · 900 × 400 × 900 mm. Click to explore the assumed 350 mm drawer extension.',open:false,baseZ:.2});drawers.push(g);}
const chestFurniture=collectFurniture(chestStart,'chest','Rear-left drawer chest',[.472,.45,.2]);
for(const d of drawers)d.userData.baseZ=d.position.z;
const rearShelves=[];
for(const [i,y] of [1.35,1.75].entries()){const start=room.children.length;box(.9,.03,.25,.472,y+.015,.125,wood);rearShelves.push(collectFurniture(start,`rear-shelf-${i+1}`,`Rear shelf ${i+1}`,[.472,y,.125]));}
const railsStart=room.children.length;
for(const h of [1.05,2]){rod([1.722,h,.3],[1.722,h,1.75]);rod([.972,h,.3],[1.722,h,.3]);for(const z of [.55,1.60])rod([1.722,h,z],[2.022,h,z],.009);rod([1.05,h,.0],[1.05,h,.3],.009);}
const hangingFurniture=collectFurniture(railsStart,'hanging','Two-tier L hanging rails',[1.722,1.5,1.025]);
let shelfStart=room.children.length;box(.35,.032,1.2,1.847,2.216,1.15,wood);
const upperFurniture=collectFurniture(shelfStart,'right-upper-shelf','Right upper shelf + light',[1.847,2.216,1.15]);
shelfStart=room.children.length;box(.3,.025,1.2,1.872,.1125,1.15,wood);
const lowFurniture=collectFurniture(shelfStart,'right-low-shelf','Right low shoe shelf',[1.872,.1125,1.15]);
const ledMat=new THREE.MeshStandardMaterial({color:'#ffebc0',emissive:'#ffda95',emissiveIntensity:1.5});upperFurniture.attach(box(.014,.006,1.14,1.69,2.196,1.15,ledMat));
// D: retained five-level shoe rack on the entrance return, not the rear corner.
const shoeRack=new THREE.Group();shoeRack.name='D / entrance return shoe rack';room.add(shoeRack);
shoeRack.position.set(SHOE_RACK.x+SHOE_RACK.width/2,SHOE_RACK.height/2,SHOE_RACK.z+SHOE_RACK.depth/2);
const panel=.023,shelfThickness=.025;
for(const x of [-SHOE_RACK.width/2+panel/2,SHOE_RACK.width/2-panel/2])
  box(panel,SHOE_RACK.height,SHOE_RACK.depth,x,0,0,wood,shoeRack);
for(let i=0;i<SHOE_RACK.levels;i++)
  box(SHOE_RACK.width,shelfThickness,SHOE_RACK.depth,0,shelfThickness/2+i*(SHOE_RACK.height-shelfThickness)/(SHOE_RACK.levels-1)-SHOE_RACK.height/2,0,wood,shoeRack);
registerFurniture(shoeRack,'shoe-rack','D / Entrance shoe cabinet');
// Full-height entrance return uses the plan's 806 mm opening. Cut away in Explore.
const entranceReturn=box(SHOE_RACK.width,ROOM.height,.07,1.414,ROOM.height/2,ROOM.depth+.035,wall);
const ceiling=box(ROOM.width,.035,ROOM.depth,ROOM.width/2,ROOM.height+.0175,ROOM.depth/2,wall);ceiling.visible=false;
for(const z of [-.50,.50]){
 const trim=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.004,24),black);trim.position.set(-.15,-.0195,z);ceiling.add(trim);
 const disk=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.002,24),new THREE.MeshStandardMaterial({color:'#ffe8bb',emissive:'#ffe2a6',emissiveIntensity:1.3}));disk.position.set(-.15,-.022,z);ceiling.add(disk);
 const light=new THREE.PointLight('#ffe2b0',.65,3,2);light.position.set(-.15,-.08,z);ceiling.add(light);
}
const garmentColors=['#ded3bc','#9c9d8a','#b5a69a','#eee7d9','#595e54','#9b846f'];
function garment(x,y,z,angle,color){const g=makeGarment(color,materials);g.position.set(x,y,z);g.rotation.y=angle;room.add(g);hangingFurniture.attach(g);interactive(g,{kind:'garment',name:'Everyday linen',description:'Soft woven fabric on the two-tier L rails at 1050 / 2000 mm AFF. Select garments to discover the hanging zone.',slide:angle===0?{axis:'z',min:.57-1.025,max:1.65-1.025}:{axis:'x',min:.99-1.722,max:1.66-1.722},origin:g.position.clone()});assets.push(g);}
for(const h of [1.05,2]){for(let i=0;i<7;i++)garment(1.722,h,.66+i*.143,0,garmentColors[i%6]);for(let i=0;i<3;i++)garment(1.07+i*.18,h,.3,Math.PI/2,garmentColors[(i+2)%6]);}
function shoe(x,y,z,color,parent=shoeRack){const g=makeShoePair(color,materials);g.rotation.y=parent===shoeRack?Math.PI:-Math.PI/2;g.position.set(x,y,z);room.add(g);parent.attach(g);interactive(g,{kind:'asset',name:'The perfect pair',description:'Leather uppers, inset lining and rounded soles. Use the move arrows or drag to style this pair.',origin:g.position.clone()});assets.push(g);}
for(let i=0;i<4;i++)for(let j=0;j<3;j++)shoe(.99+j*.36,.025+i*(SHOE_RACK.height-.025)/4,1.982,['#6b5745','#aa8964','#383c35'][j]);
shoe(1.86,.13,.88,'#b3a48b',lowFurniture);
function bag(x,y,z,parent){const g=makeBag(materials);g.position.set(x,y,z);room.add(g);parent.attach(g);interactive(g,{kind:'asset',name:'Weekend companion',description:'Soft leather bag with stitched gussets and brass hardware. Drag or use the move arrows to restyle it.',origin:g.position.clone()});assets.push(g);}
bag(.30,1.78,.125,rearShelves[1]);bag(.67,1.38,.125,rearShelves[0]);
// Styled towel stacks; the measured aisle remains free of furniture.
for(let i=0;i<3;i++){const towel=box(.26,.045,.21,.29,.925+i*.045,.19,linen);towel.userData.styling=true;chestFurniture.attach(towel);}
const decorStart=room.children.length;addCountertopStyling(room);room.children.slice(decorStart).forEach(child=>{child.userData.styling=true;chestFurniture.attach(child);});
const hemi=new THREE.HemisphereLight('#fff3dc','#8a8576',.85);scene.add(hemi);const sun=new THREE.DirectionalLight('#fff2df',2.1);sun.position.set(-2,5,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.target.position.set(1,1,1);scene.add(sun.target);sun.shadow.camera.left=-2.5;sun.shadow.camera.right=2.5;sun.shadow.camera.top=2.5;sun.shadow.camera.bottom=-2.5;sun.shadow.camera.near=.5;sun.shadow.camera.far=12;sun.shadow.bias=-.00015;sun.shadow.normalBias=.003;scene.add(sun);
const strip=new THREE.PointLight('#ffda9c',2.5,3,2);strip.position.set(1.65,2.1,1.15);scene.add(strip);upperFurniture.attach(strip);
// Ground receives shadows beneath the room platform.
const ground=box(200,.025,200,1,-.15,1,mat('#e1dfd4'));ground.castShadow=false;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let selected=null,dragging=false,down=null,dragPlane=new THREE.Plane(),dragOffset=new THREE.Vector3();
const selectionBox=new THREE.BoxHelper(drawers[0],'#b7b78a');selectionBox.visible=false;scene.add(selectionBox);
function select(obj){invalidate();if(obj.userData.kind==='garment')walkthrough.observe('garment');if(obj===mirror)walkthrough.observe('mirror');selected=obj;selectionBox.setFromObject(obj);selectionBox.visible=true;$('#selection-name').textContent=obj.userData.name;$('#selection-description').textContent=obj.userData.description;$('#object-actions').hidden=obj.userData.kind==='fixed';$('#activate').hidden=obj.userData.kind!=='drawer';$('#activate').textContent=obj.userData.open?'Close drawer':'Open drawer';$('#move-actions').hidden=obj.userData.kind==='drawer';}
function intersect(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(interactables,true).map(hit=>{let o=hit.object;while(o&&!interactables.includes(o))o=o.parent;return {object:o,point:hit.point};})[0];}
renderer.domElement.addEventListener('pointerdown',e=>{if(editor.active)return;const hit=intersect(e);down={x:e.clientX,y:e.clientY,object:hit?.object};if(hit&&selected===hit.object&&['garment','asset'].includes(selected.userData.kind)){dragging=true;controls.enabled=false;dragPlane.set(new THREE.Vector3(0,1,0),-selected.getWorldPosition(new THREE.Vector3()).y);const p=ray.ray.intersectPlane(dragPlane,new THREE.Vector3());if(p)dragOffset.copy(selected.position).sub(selected.parent.worldToLocal(p));renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;intersect(e);const p=ray.ray.intersectPlane(dragPlane,new THREE.Vector3());if(p){selected.parent.worldToLocal(p).add(dragOffset);moveSelected(selected.parent.localToWorld(p));}});
renderer.domElement.addEventListener('pointerup',e=>{if(dragging){dragging=false;controls.enabled=!walkthrough.active;renderer.domElement.releasePointerCapture(e.pointerId);}else if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&down.object){select(down.object);if(selected.userData.kind==='drawer')toggleDrawer();}down=null;});
renderer.domElement.addEventListener('pointercancel',()=>{dragging=false;controls.enabled=!walkthrough.active;down=null;});
function moveSelected(world){
 invalidate();if(!selected)return;
 const constrained=clampAsset(world.x,world.z);world.x=constrained.x;world.z=constrained.z;
 const local=selected.parent.worldToLocal(world);
 if(selected.userData.kind==='garment'){const slide=selected.userData.slide;selected.position[slide.axis]=THREE.MathUtils.clamp(local[slide.axis],slide.min,slide.max);}
 else {selected.position.x=local.x;selected.position.z=local.z;}
 selectionBox.setFromObject(selected);
 if(selected.userData.name==='The perfect pair')walkthrough.observe('shoeMoved');
}
function toggleDrawer(){if(!selected||['garment','asset'].includes(selected.userData.kind))return;selected.userData.open=!selected.userData.open;$('#activate').textContent=selected.userData.open?'Close drawer':'Open drawer';if(selected.userData.open)walkthrough.observe('drawerOpen');}
$('#activate').onclick=toggleDrawer;
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{if(!selected)return;const d=b.dataset.move;const p=selected.getWorldPosition(new THREE.Vector3());p.x+=d==='left'?-.1:d==='right'?.1:0;p.z+=d==='back'?-.1:d==='forward'?.1:0;moveSelected(p);});
const views={perspective:{pos:[-3.3,4.1,5.9],target:[1.03,1.12,1.03]},interior:{pos:[.75,1.60,1.55],target:[.95,1.40,.45]},plan:{pos:[1.01,6.5,1.09],target:[1.011,0,1.078]}};
let cameraGoal=null,currentView='perspective';
function setPresentation(name){
  currentView=name;
  const inside=name==='interior'||name==='walkthrough';
  camera.fov=inside?65:(host.clientWidth<500?53:38);camera.updateProjectionMatrix();
  ceiling.visible=inside;leftBacking.visible=inside;
  entranceReturn.visible=inside||name==='plan';
  $('#plan-overlay').hidden=name!=='plan';host.style.visibility=name==='plan'?'hidden':'visible';
  document.querySelector('.scene-caption').hidden=name==='walkthrough'||name==='plan';
  controls.enabled=name!=='plan'&&name!=='walkthrough';
  $('#view-label').textContent=name==='plan'?'FLOOR PLAN':name==='walkthrough'?'CLICK TO EXPLORE':name.toUpperCase();
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  invalidate();
}
const walkthrough=createWalkthrough({camera,controls,invalidate,
  onStart:()=>{editor.stop();cameraGoal=null;drawers.forEach(d=>{d.userData.open=false;d.position.z=d.userData.baseZ;});selectionBox.visible=false;selected=null;$('#object-actions').hidden=true;setPresentation('walkthrough');},
  onExit:()=>view('interior'),
  onComplete:complete,
  resolve:station=>{
    const id={hanging:'hanging',drawers:'chest',mirror:'mirror',shoes:'shoe-rack'}[station.id];const item=furniture.find(f=>f.id===id);if(!item)return station;
    item.object.updateWorldMatrix(true,true);
    const transform=point=>item.object.localToWorld(new THREE.Vector3(...point).sub(item.basePosition)).toArray();
    return {...station,target:transform(station.target),anchor:transform(station.anchor)};
  },
  onRestart:()=>{completed.clear();document.querySelectorAll('.quest').forEach((el,i)=>{el.classList.remove('done');el.querySelector('span').textContent=i+1;});$('#progress').style.width='0%';$('#progress-count').textContent=`0 / ${QUESTS.length}`;$('#achievement').textContent='Enter the discovery trail to collect five badges.';},
  project:(point)=>{camera.updateMatrixWorld();const p=new THREE.Vector3(...point).project(camera);return {x:(p.x+1)*50,y:(1-p.y)*50,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<.94&&p.y>-.25&&p.y<.86};},
});
const editor=createLayoutEditor({camera,renderer,scene,controls,items:furniture,invalidate,
 onEnter:()=>{walkthrough.stop();drawers.forEach(d=>{d.userData.open=false;d.position.z=d.userData.baseZ;});camera.position.fromArray(views.perspective.pos);controls.target.fromArray(views.perspective.target);setPresentation('perspective');selectionBox.visible=false;selected=null;$('#object-actions').hidden=true;},
 onExit:()=>view('perspective'),
});
function view(name,instant=true){
  walkthrough.stop();editor.stop();setPresentation(name);const v=views[name];
  cameraGoal={pos:new THREE.Vector3(...v.pos),target:new THREE.Vector3(...v.target)};
  if(instant){camera.position.copy(cameraGoal.pos);controls.target.copy(cameraGoal.target);cameraGoal=null;}

}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
$('#start-walkthrough').onclick=()=>walkthrough.start();
$('#edit-layout').onclick=()=>editor.start();
controls.addEventListener('start',()=>cameraGoal=null);view('perspective',true);
$('#reset').onclick=()=>view('perspective');
const finishes={teak:{color:'#b99577',label:'Baltimore teak',note:'TH 356 · HPL reference'},oak:{color:'#f1d5a1',label:'Natural oak',note:'Alternative finish · conceptual'},walnut:{color:'#694b37',label:'Smoked walnut',note:'Alternative finish · conceptual'}};
document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{const f=finishes[b.dataset.finish];wood.color.set(f.color);$('#finish-name').innerHTML=`${f.label}<small>${f.note}</small>`;document.querySelectorAll('[data-finish]').forEach(a=>a.classList.toggle('active',a===b));});
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{const evening=b.dataset.light==='evening';sun.intensity=evening?.25:2.1;hemi.intensity=evening?.35:.85;scene.environmentIntensity=evening?.2:.4;renderer.toneMappingExposure=evening?.85:.95;document.querySelectorAll('[data-light]').forEach(a=>a.classList.toggle('active',a===b));});
$('#led').onchange=e=>{strip.visible=e.target.checked;ledMat.emissiveIntensity=e.target.checked?3:0;};
$('#dimensions').onclick=()=>{const label=$('#dimensions-label');label.hidden=!label.hidden;$('#dimensions').textContent=label.hidden?'＋ Show dimensions':'− Hide dimensions';};
$('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='jourimanzky-design.png';a.href=renderer.domElement.toDataURL('image/png');a.click();toast('Your view has been saved.');};
$('#restore').onclick=()=>{assets.forEach(a=>a.position.copy(a.userData.origin));drawers.forEach(d=>d.userData.open=false);selected=null;selectionBox.visible=false;$('#object-actions').hidden=true;$('#selection-name').textContent='The considered corner';$('#selection-description').textContent='Select a drawer, garment, shoe or accessory to discover its details.';view('perspective');toast('Assets returned to the original layout.');};
const resize=()=>{invalidate();const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.fov=(currentView==='interior'||currentView==='walkthrough')?65:(r.width<500?53:38);camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
let last=performance.now(),frames=0;
renderer.setAnimationLoop(now=>{
  const dt=Math.min((now-last)/1000,.05);last=now;
  try {
    let moving=Boolean(cameraGoal);
    if(cameraGoal){camera.position.lerp(cameraGoal.pos,1-Math.exp(-dt*5));controls.target.lerp(cameraGoal.target,1-Math.exp(-dt*5));if(camera.position.distanceTo(cameraGoal.pos)<.005)cameraGoal=null;}
    for(const d of drawers){const target=d.userData.baseZ+(d.userData.open?.35:0);if(Math.abs(d.position.z-target)>.0001){moving=true;d.position.z=THREE.MathUtils.lerp(d.position.z,target,1-Math.exp(-dt*10));}}
    const orbitChanged=controls.update();
    if(dirty||moving||orbitChanged){
      if(selected)selectionBox.setFromObject(selected);
      walkthrough.updateHotspots();renderer.render(scene,camera);dirty=false;frames++;
      if(frames===1){showReady();window.dispatchEvent(new Event('showcase-ready'));}
    }
  } catch(error){
    console.error('Rendering failed:',error);renderer.setAnimationLoop(null);
    window.dispatchEvent(new Event('showcase-failed'));
    showFailure('The scene stopped rendering. Retry the showcase to restore the graphics connection.');
  }
});
// Expose serializable state for presentation QA without coupling tests to scene internals.
window.showcase={getState:()=>({walkthrough:walkthrough.getState(),editor:editor.getState(),camera:camera.position.toArray(),roomSize:{width:finishedFloor.geometry.parameters.width,depth:finishedFloor.geometry.parameters.depth,height:ceiling.position.y-.035/2,entranceOpening:SHOE_RACK.x},layout:{hangingX:assets.find(a=>a.userData.kind==='garment').getWorldPosition(new THREE.Vector3()).x,chestX:drawers[0].getWorldPosition(new THREE.Vector3()).x,mirrorX:mirror.getWorldPosition(new THREE.Vector3()).x,shoeRackBounds:(()=>{const b=new THREE.Box3().setFromObject(shoeRack);return {min:b.min.toArray(),max:b.max.toArray(),levels:SHOE_RACK.levels};})()},frames,assets:assets.length,drawers:drawers.length,completed:[...completed],selected:selected?.userData.name,openDrawers:drawers.filter(d=>d.userData.open).length,renderCalls:renderer.info.render.calls}),furnitureScreen:id=>editor.screenPoint(id),furnitureHandleScreen:axis=>editor.handleScreen(axis),objectScreen:(kind)=>{camera.updateMatrixWorld(true);const obj=kind==='garment'?assets.find(a=>a.userData.kind==='garment'&&a.getWorldPosition(new THREE.Vector3()).y>1.5):kind==='mirror'?mirror:assets.find(a=>a.userData.name==='The perfect pair'&&a.getWorldPosition(new THREE.Vector3()).y>1);const offset=kind==='garment'?new THREE.Vector3(0,-.38,.03):kind==='mirror'?new THREE.Vector3(0,.20,0):new THREE.Vector3(-.06,.065,0);const p=obj.localToWorld(offset).project(camera);const r=renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};},selectDrawer:()=>select(drawers[0]),selectAsset:()=>select(assets.find(a=>a.userData.name==='Weekend companion')),drawerScreen:()=>{camera.updateMatrixWorld(true);room.updateMatrixWorld(true);const p=drawers[3].localToWorld(new THREE.Vector3(0,0,.225)).project(camera);const r=renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}};
}
