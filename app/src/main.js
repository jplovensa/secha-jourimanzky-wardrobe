import { showFailure, showReady } from './startup.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROOM, SHOE_RACK, QUESTS, clampAsset } from './model.js';

const $ = s => document.querySelector(s);
const completed = new Set();
$('#quests').innerHTML = QUESTS.map((q,i)=>`<div class="quest" data-quest="${i}"><span>${i+1}</span>${q}</div>`).join('');
function complete(i){completed.add(i);const el=$(`[data-quest="${i}"]`);el.classList.add('done');el.querySelector('span').textContent='✓';$('#progress').style.width=`${completed.size*25}%`;$('#progress-count').textContent=`${completed.size} / 4`;if(completed.size===4)$('#achievement').textContent='✦ Space curator unlocked. Beautifully considered.';}
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
const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;scene.environmentIntensity=.65;
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(1,1.1,1);controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.4;controls.maxDistance=9;
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
function grain(){const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#ad8159';ctx.fillRect(0,0,256,512);let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<2200;i++){const x=random()*256;ctx.strokeStyle=`rgba(${random()>.5?'48,24,9':'240,210,163'},${random()*.16})`;ctx.lineWidth=random()*1.5;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=512;y+=8)ctx.lineTo(x+Math.sin(y*.018+i)*2+Math.sin(y*.05+i)*.8,y);ctx.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const wood=new THREE.MeshStandardMaterial({map:grain(),roughness:.44,color:'#b99577',bumpScale:.006});wood.bumpMap=wood.map;
const wall=mat('#eeeae0',.94), floor=mat('#c9c0ad',.7), black=mat('#252724',.32,.7), brass=mat('#b39969',.26,.85), linen=mat('#e2dbce',.97);
// Floorplan datum: x=0 left wall, z=0 rear wall; no mirrored transform.
const room=new THREE.Group();scene.add(room);
function box(w,h,d,x,y,z,m,parent=room){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function rod(a,b,r=.012,m=black,parent=room){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),m);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;parent.add(o);return o;}
box(2.17,.12,2.30,1.011,-.065,1.078,floor);
// Tile joints and slim perimeter skirting.
for(let x=.5;x<2.1;x+=.5)box(.002,.001,2.157,x,.001,1.078,mat('#afa895'));
for(let z=.5;z<2.2;z+=.5)box(2.022,.001,.002,1.011,.001,z,mat('#afa895'));
box(2.16,2.61,.07,1.011,1.305,-.035,wall);box(.07,2.61,2.157,2.057,1.305,1.078,wall);
box(2.022,.055,.015,1.011,.027,.012,wall);box(.015,.055,2.157,2.01,.027,1.078,wall);
// Full-height left mirror; front and ceiling cut away for the presentation.
const mirror=new Reflector(new THREE.PlaneGeometry(2.157,2.61),{color:0xc6ccc7,textureWidth:512,textureHeight:512,clipBias:.003});mirror.rotation.y=Math.PI/2;mirror.position.set(.006,1.305,1.0785);room.add(mirror);
rod([.008,0,0],[.008,2.61,0],.003,black);rod([.008,0,2.157],[.008,2.61,2.157],.003,black);
const interactables=[],drawers=[],assets=[];
function interactive(group,data){group.userData={...data};interactables.push(group);return group;}
// Chest carcass and four independently moving drawers.
box(.9,.025,.4,.472,.89,.2,wood);box(.025,.88,.4,.034,.44,.2,wood);box(.025,.88,.4,.91,.44,.2,wood);box(.87,.85,.015,.472,.44,.012,wood);
for(let i=0;i<4;i++){const g=new THREE.Group();g.position.set(.472,.12+i*.215,.2);room.add(g);box(.855,.19,.025,0,0,.2,wood,g);box(.80,.025,.34,0,-.075,0,wood,g);box(.016,.14,.34,-.4,0,0,wood,g);box(.016,.14,.34,.4,0,0,wood,g);box(.81,.14,.016,0,0,-.17,wood,g);box(.16,.012,.023,0,.035,.222,brass,g);interactive(g,{kind:'drawer',name:`Drawer ${i+1}`,description:'Rear-left teak chest · 900 × 400 × 900 mm. Click to explore the assumed 350 mm drawer extension.',open:false,baseZ:.2});drawers.push(g);}
for(const y of [1.35,1.75])box(.9,.03,.25,.472,y+.015,.125,wood);
for(const h of [1.05,2]){rod([1.722,h,.3],[1.722,h,1.75]);rod([.972,h,.3],[1.722,h,.3]);for(const z of [.55,1.60])rod([1.722,h,z],[2.022,h,z],.009);rod([1.05,h,.0],[1.05,h,.3],.009);}
box(.35,.032,1.2,1.847,2.216,1.15,wood);box(.3,.025,1.2,1.872,.1125,1.15,wood);
const ledMat=new THREE.MeshStandardMaterial({color:'#ffebc0',emissive:'#ffda95',emissiveIntensity:3});box(.014,.006,1.14,1.69,2.196,1.15,ledMat);
// D: retained five-level shoe rack on the entrance return, not the rear corner.
const shoeRack=new THREE.Group();shoeRack.name='D / entrance return shoe rack';room.add(shoeRack);
shoeRack.position.set(SHOE_RACK.x+SHOE_RACK.width/2,0,SHOE_RACK.z+SHOE_RACK.depth/2);
const panel=.023,shelfThickness=.025;
for(const x of [-SHOE_RACK.width/2+panel/2,SHOE_RACK.width/2-panel/2])
  box(panel,SHOE_RACK.height,SHOE_RACK.depth,x,SHOE_RACK.height/2,0,wood,shoeRack);
for(let i=0;i<SHOE_RACK.levels;i++)
  box(SHOE_RACK.width,shelfThickness,SHOE_RACK.depth,0,shelfThickness/2+i*(SHOE_RACK.height-shelfThickness)/(SHOE_RACK.levels-1),0,wood,shoeRack);
// Low entrance return; cutaway height is for presentation, not construction.
const entranceReturn=box(1.216,1.05,.07,1.414,.525,2.192,wall);
const entranceCap=box(1.216,.03,.13,1.414,1.065,2.16,wood);
const ceiling=box(2.022,.035,2.157,1.011,2.63,1.078,wall);ceiling.visible=false;
const garmentColors=['#ded3bc','#9c9d8a','#b5a69a','#eee7d9','#595e54','#9b846f'];
function garment(x,y,z,angle,color){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;room.add(g);const cloth=mat(color,.95);cloth.side=THREE.DoubleSide;const shape=new THREE.Shape();shape.moveTo(-.075,-.04);shape.lineTo(-.24,-.12);shape.lineTo(-.31,-.29);shape.lineTo(-.20,-.34);shape.lineTo(-.17,-.23);shape.lineTo(-.175,-.76);shape.quadraticCurveTo(0,-.80,.175,-.76);shape.lineTo(.17,-.23);shape.lineTo(.20,-.34);shape.lineTo(.31,-.29);shape.lineTo(.24,-.12);shape.lineTo(.075,-.04);shape.quadraticCurveTo(0,-.11,-.075,-.04);const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:true,bevelSize:.012,bevelThickness:.007,bevelSegments:2,steps:1}),cloth);mesh.castShadow=true;mesh.receiveShadow=false;g.add(mesh);rod([-.21,-.10,0],[0,-.015,0],.004,brass,g);rod([0,-.015,0],[.21,-.10,0],.004,brass,g);rod([0,-.015,0],[0,.015,0],.004,brass,g);for(let i=-2;i<=2;i++)rod([i*.052,-.2,.034],[i*.05,-.73,.034],.0015,mat(color,.99),g);interactive(g,{kind:'garment',name:'Everyday linen',description:'Two-tier hanging at 1050 and 2000 mm AFF. Slide garments along the right-hand rail.',axis:'z',origin:g.position.clone()});assets.push(g);}
for(const h of [1.05,2]){for(let i=0;i<7;i++)garment(1.722,h,.66+i*.143,0,garmentColors[i%6]);for(let i=0;i<3;i++)garment(1.07+i*.18,h,.3,Math.PI/2,garmentColors[(i+2)%6]);}
function shoe(x,y,z,color){const g=new THREE.Group();g.position.set(x,y,z);room.add(g);for(const dx of [-.06,.06]){const upper=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),mat(color,.78));upper.scale.set(.047,.05,.12);upper.position.set(dx,.055,0);upper.castShadow=true;g.add(upper);box(.095,.017,.245,dx,.017,0,mat('#d7cdbc'),g);box(.06,.03,.07,dx,.08,-.05,mat(color),g);}interactive(g,{kind:'asset',name:'The perfect pair',description:'Move this pair around the room with the arrow controls or drag it to style your space.',origin:g.position.clone()});assets.push(g);}
for(let i=0;i<4;i++)for(let j=0;j<3;j++)shoe(.99+j*.36,.025+i*(SHOE_RACK.height-.025)/4,1.982,['#6b5745','#b49b79','#383c35'][j]);
shoe(1.86,.13,.88,'#c3b7a2');
function bag(x,y,z){const g=new THREE.Group();g.position.set(x,y,z);room.add(g);box(.24,.19,.13,0,.105,0,mat('#967452',.65),g);const h=new THREE.Mesh(new THREE.TorusGeometry(.065,.009,8,24,Math.PI),mat('#654b34'));h.position.set(0,.20,0);g.add(h);interactive(g,{kind:'asset',name:'Weekend companion',description:'A leather accent on the rear shelf. Drag or use arrows to find its place.',origin:g.position.clone()});assets.push(g);}
bag(.30,1.78,.125);bag(.67,1.38,.125);
// Styled towel stacks on chest and a movable upholstered stool in the aisle.
for(let i=0;i<3;i++)box(.26,.045,.21,.29,.93+i*.045,.19,linen);
const stool=new THREE.Group();stool.position.set(.83,0,1.2);room.add(stool);stool.visible=false;const cushion=new THREE.Mesh(new THREE.CylinderGeometry(.22,.23,.16,48),linen);cushion.position.y=.40;cushion.castShadow=true;stool.add(cushion);for(const x of [-.13,.13])for(const z of [-.13,.13])rod([x,.03,z],[x*.85,.35,z*.85],.014,wood,stool);interactive(stool,{kind:'asset',name:'A moment of pause',description:'Upholstered dressing stool. Move it through the main aisle to explore the room.',origin:stool.position.clone()});assets.push(stool);
const hemi=new THREE.HemisphereLight('#fff6df','#a19c83',1.8);scene.add(hemi);const sun=new THREE.DirectionalLight('#fff4da',2.5);sun.position.set(-2,5,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=4;sun.shadow.camera.bottom=-4;sun.shadow.normalBias=.025;scene.add(sun);
const strip=new THREE.PointLight('#ffda9c',9,4,2);strip.position.set(1.65,2.1,1.15);scene.add(strip);
// Ground receives shadows beneath the room platform.
const ground=box(200,.025,200,1,-.15,1,mat('#e1dfd4'));ground.castShadow=false;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let selected=null,dragging=false,down=null,dragPlane=new THREE.Plane(),dragOffset=new THREE.Vector3();
const selectionBox=new THREE.BoxHelper(stool,'#b7b78a');selectionBox.visible=false;scene.add(selectionBox);
function select(obj){invalidate();selected=obj;selectionBox.setFromObject(obj);selectionBox.visible=true;$('#selection-name').textContent=obj.userData.name;$('#selection-description').textContent=obj.userData.description;$('#object-actions').hidden=false;$('#activate').hidden=obj.userData.kind!=='drawer';$('#activate').textContent=obj.userData.open?'Close drawer':'Open drawer';$('#move-actions').hidden=obj.userData.kind==='drawer';}
function intersect(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(interactables,true).map(hit=>{let o=hit.object;while(o&&!interactables.includes(o))o=o.parent;return {object:o,point:hit.point};})[0];}
renderer.domElement.addEventListener('pointerdown',e=>{const hit=intersect(e);down={x:e.clientX,y:e.clientY,object:hit?.object};if(hit&&selected===hit.object&&selected.userData.kind!=='drawer'){dragging=true;controls.enabled=false;dragPlane.set(new THREE.Vector3(0,1,0),-selected.position.y);const p=ray.ray.intersectPlane(dragPlane,new THREE.Vector3());if(p)dragOffset.copy(selected.position).sub(room.worldToLocal(p));renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;intersect(e);const p=ray.ray.intersectPlane(dragPlane,new THREE.Vector3());if(p){room.worldToLocal(p).add(dragOffset);moveSelected(p.x,p.z);}});
renderer.domElement.addEventListener('pointerup',e=>{if(dragging){dragging=false;controls.enabled=true;renderer.domElement.releasePointerCapture(e.pointerId);}else if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&down.object){select(down.object);if(selected.userData.kind==='drawer')toggleDrawer();}down=null;});
renderer.domElement.addEventListener('pointercancel',()=>{dragging=false;controls.enabled=true;down=null;});
function moveSelected(x,z){invalidate();if(!selected)return;const p=clampAsset(x,z);if(selected.userData.kind==='garment'){if(Math.abs(selected.rotation.y)<1)selected.position.z=THREE.MathUtils.clamp(z,.57,1.65);else selected.position.x=THREE.MathUtils.clamp(x,.99,1.66);}else{selected.position.x=p.x;selected.position.z=p.z;}selectionBox.setFromObject(selected);complete(2);}
function toggleDrawer(){if(!selected||selected.userData.kind!=='drawer')return;selected.userData.open=!selected.userData.open;$('#activate').textContent=selected.userData.open?'Close drawer':'Open drawer';complete(1);}
$('#activate').onclick=toggleDrawer;
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{if(!selected)return;const d=b.dataset.move;moveSelected(selected.position.x+(d==='left'?-.1:d==='right'?.1:0),selected.position.z+(d==='back'?-.1:d==='forward'?.1:0));});
const views={perspective:{pos:[-3.3,4.1,5.9],target:[1.03,1.12,1.03]},interior:{pos:[.50,1.58,2.88],target:[1.00,1.28,.30]},plan:{pos:[1.01,6.5,1.09],target:[1.011,0,1.078]}};let cameraGoal=null,currentView='perspective';
function view(name,instant=true){currentView=name;camera.fov=name==='interior'?65:(host.clientWidth<500?53:38);camera.updateProjectionMatrix();ceiling.visible=name==='interior';entranceReturn.visible=name==='plan';entranceCap.visible=name==='plan';const v=views[name];cameraGoal={pos:new THREE.Vector3(...v.pos),target:new THREE.Vector3(...v.target)};if(instant){camera.position.copy(cameraGoal.pos);controls.target.copy(cameraGoal.target);cameraGoal=null;}$('#view-label').textContent=name==='plan'?'FLOOR PLAN':name.toUpperCase();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='interior')complete(3);}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));controls.addEventListener('start',()=>cameraGoal=null);view('perspective',true);$('#reset').onclick=()=>view('perspective');
const finishes={teak:{color:'#b99577',label:'Baltimore teak',note:'TH 356 · HPL reference'},oak:{color:'#f1d5a1',label:'Natural oak',note:'Alternative finish · conceptual'},walnut:{color:'#694b37',label:'Smoked walnut',note:'Alternative finish · conceptual'}};
document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{const f=finishes[b.dataset.finish];wood.color.set(f.color);$('#finish-name').innerHTML=`${f.label}<small>${f.note}</small>`;document.querySelectorAll('[data-finish]').forEach(a=>a.classList.toggle('active',a===b));complete(0);});
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{const evening=b.dataset.light==='evening';sun.intensity=evening?.25:2.5;hemi.intensity=evening?.6:1.8;scene.environmentIntensity=evening?.25:.65;renderer.toneMappingExposure=evening?.85:.95;document.querySelectorAll('[data-light]').forEach(a=>a.classList.toggle('active',a===b));});
$('#stool').onchange=e=>{stool.visible=e.target.checked;invalidate();};
$('#led').onchange=e=>{strip.visible=e.target.checked;ledMat.emissiveIntensity=e.target.checked?3:0;};
$('#dimensions').onclick=()=>{const label=$('#dimensions-label');label.hidden=!label.hidden;$('#dimensions').textContent=label.hidden?'＋ Show dimensions':'− Hide dimensions';};
$('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='jourimanzky-design.png';a.href=renderer.domElement.toDataURL('image/png');a.click();toast('Your view has been saved.');};
$('#restore').onclick=()=>{stool.visible=false;$('#stool').checked=false;assets.forEach(a=>a.position.copy(a.userData.origin));drawers.forEach(d=>d.userData.open=false);selected=null;selectionBox.visible=false;$('#object-actions').hidden=true;$('#selection-name').textContent='The considered corner';$('#selection-description').textContent='Select a drawer, garment, shoe or accessory to discover its details.';view('perspective');toast('Assets returned to the original layout.');};
const resize=()=>{invalidate();const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.fov=currentView==='interior'?65:(r.width<500?53:38);camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
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
      renderer.render(scene,camera);dirty=false;frames++;
      if(frames===1){showReady();window.dispatchEvent(new Event('showcase-ready'));}
    }
  } catch(error){
    console.error('Rendering failed:',error);renderer.setAnimationLoop(null);
    window.dispatchEvent(new Event('showcase-failed'));
    showFailure('The scene stopped rendering. Retry the showcase to restore the graphics connection.');
  }
});
// Expose serializable state for presentation QA without coupling tests to scene internals.
window.showcase={getState:()=>({layout:{hangingX:room.localToWorld(new THREE.Vector3(1.722,1,.9)).x,chestX:drawers[0].getWorldPosition(new THREE.Vector3()).x,mirrorX:mirror.getWorldPosition(new THREE.Vector3()).x,shoeRackBounds:(()=>{const b=new THREE.Box3().setFromObject(shoeRack);return {min:b.min.toArray(),max:b.max.toArray(),levels:SHOE_RACK.levels};})()},frames,assets:assets.length,drawers:drawers.length,completed:[...completed],selected:selected?.userData.name,openDrawers:drawers.filter(d=>d.userData.open).length,renderCalls:renderer.info.render.calls}),selectDrawer:()=>select(drawers[0]),selectStool:()=>{stool.visible=true;$('#stool').checked=true;select(stool);},drawerScreen:()=>{room.updateMatrixWorld(true);const p=drawers[1].localToWorld(new THREE.Vector3(0,0,.225)).project(camera);const r=renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}};
}
