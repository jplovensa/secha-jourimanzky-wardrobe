import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
function noiseTexture(kind){
  const size=kind==='wood'?512:256,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),pixels=ctx.createImageData(size,size);
  let seed=938;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const n=random()-.5;
    let v=kind==='wood'?225+5*Math.sin(x*2.1+Math.sin(y*.018)*.5)+3*Math.sin(x*.53+y*.001)+n*5:
      kind==='weave'?215+((x%4===0||y%4===0)?-24:0)+n*10:
      kind==='stone'?207+6*Math.sin(x*.035+Math.sin(y*.035)*2)+n*11:220+n*19;
    const i=(y*size+x)*4;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}
export function createMaterials(){
  const grain=noiseTexture('wood'),stone=noiseTexture('stone'),plaster=noiseTexture('plaster'),weave=noiseTexture('weave'),leather=noiseTexture('leather');
  const woodMap=grain.clone();woodMap.colorSpace=THREE.SRGBColorSpace;woodMap.needsUpdate=true;
  const wood=new THREE.MeshPhysicalMaterial({color:'#99613a',map:woodMap,bumpMap:grain,bumpScale:.00035,roughness:.48,clearcoat:.12,clearcoatRoughness:.45});
  const wall=new THREE.MeshStandardMaterial({color:'#e3ddd1',bumpMap:plaster,bumpScale:.00022,roughness:.96});
  stone.repeat.set(4,4);
  const floor=new THREE.MeshStandardMaterial({color:'#b8b0a0',map:stone,bumpMap:stone,bumpScale:.00065,roughness:.78});
  function cloth(color){return new THREE.MeshPhysicalMaterial({color,roughness:.93,bumpMap:weave,bumpScale:.00035,sheen:.65,sheenColor:new THREE.Color(color),sheenRoughness:.9,side:THREE.DoubleSide});}
  function hide(color){return new THREE.MeshPhysicalMaterial({color,roughness:.64,bumpMap:leather,bumpScale:.0003,clearcoat:.035});}
  return {wood,wall,floor,linen:cloth('#c5bba5'),cloth,leather:hide};
}
export function roundedGeometry(w,h,d,r=.004){return new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4));}
function mesh(geometry,material,parent,position=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.position.fromArray(position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function bar(a,b,r,material,parent){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),material,parent,av.add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
export function makeGarment(color,materials){
  const g=new THREE.Group(),fabric=materials.cloth(color),hanger=new THREE.MeshStandardMaterial({color:'#947147',roughness:.56}),metal=new THREE.MeshStandardMaterial({color:'#777269',metalness:.85,roughness:.22});
  for(const side of [1,-1]){
    const geo=new THREE.PlaneGeometry(.36,.64,20,28),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){
      const u=(p.getX(i)+.18)/.36,v=(.32-p.getY(i))/.64;
      const x=(2*u-1)*(.175+.014*Math.sin(v*Math.PI));
      const y=-.13-v*.63-.048*(1-Math.abs(2*u-1))**2*(1-v)**7;
      const z=side*(.026+Math.sin(u*Math.PI*8+v*.7)*(.004+v*.008)+Math.sin(v*Math.PI)*.01);
      p.setXYZ(i,x,y,z);
    }
    if(side===-1){const a=geo.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];}
    geo.computeVertexNormals();mesh(geo,fabric,g);
  }
  const shoulder=new THREE.PlaneGeometry(.35,.052,20,1),sp=shoulder.attributes.position;
  for(let i=0;i<sp.count;i++){const u=(sp.getX(i)+.175)/.35;sp.setXYZ(i,sp.getX(i),-.13-.048*(1-Math.abs(2*u-1))**2,sp.getY(i));}
  const oldIndex=shoulder.index.array,indices=[];for(let i=0;i<oldIndex.length;i+=3){const x=(sp.getX(oldIndex[i])+sp.getX(oldIndex[i+1])+sp.getX(oldIndex[i+2]))/3;if(Math.abs(x)>.035)indices.push(oldIndex[i],oldIndex[i+1],oldIndex[i+2]);}shoulder.setIndex(indices);shoulder.computeVertexNormals();mesh(shoulder,fabric,g);
  for(const sign of [-1,1]){
    const sleeve=new THREE.CylinderGeometry(.064,.035,.48,14,10,true),p=sleeve.attributes.position;
    for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)+.003*Math.sin(p.getY(i)*35+i*.15));sleeve.computeVertexNormals();
    const m=mesh(sleeve,fabric,g,[sign*.205,-.37,0]);m.rotation.z=sign*.12;
    const shape=new THREE.Shape();shape.moveTo(0,-.16);shape.lineTo(sign*.07,-.12);shape.lineTo(sign*.06,-.25);shape.closePath();mesh(new THREE.ShapeGeometry(shape),fabric,g,[0,0,.047]);
  }
  // Merge fabric parts into one draw call per garment, preserving soft fold normals.
  const pieces=g.children.filter(m=>m.material===fabric),geometries=pieces.map(m=>{m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return geo.applyMatrix4(m.matrix);});
  const merged=mergeGeometries(geometries);pieces.forEach(m=>{g.remove(m);m.geometry.dispose();});geometries.forEach(geo=>geo.dispose());
  const body=mesh(merged,fabric,g);body.receiveShadow=false;
  bar([-.21,-.12,0],[0,-.035,0],.007,hanger,g);bar([0,-.035,0],[.21,-.12,0],.007,hanger,g);
  const hook=mesh(new THREE.TorusGeometry(.022,.0022,7,20,Math.PI*1.6),metal,g,[.014,-.005,0]);hook.rotation.z=Math.PI*.4;
  const buttons=new THREE.InstancedMesh(new THREE.SphereGeometry(.003,6,5),new THREE.MeshStandardMaterial({color:'#ddd4bf',roughness:.6}),4);
  const matrix=new THREE.Matrix4();for(let i=0;i<4;i++){matrix.makeTranslation(0,-.28-i*.10,.043);buttons.setMatrixAt(i,matrix);}g.add(buttons);
  return g;
}
export function makeShoePair(color,materials){
  const g=new THREE.Group(),leather=materials.leather(color),sole=new THREE.MeshStandardMaterial({color:'#b9af99',roughness:.84}),lining=new THREE.MeshStandardMaterial({color:'#32291f',roughness:1}),laces=new THREE.MeshStandardMaterial({color:'#cfc1a8',roughness:.9});
  const profile=[[-.118,.027,.055],[-.09,.038,.085],[-.055,.041,.097],[0,.044,.068],[.07,.042,.039],[.112,.025,.026],[.124,.003,.012]];
  const at=z=>{let i=0;while(i<profile.length-2&&z>profile[i+1][0])i++;const a=profile[i],b=profile[i+1],t=(z-a[0])/(b[0]-a[0]);return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];};
  const laceGeometries=[];
  for(const x of [-.06,.06]){
    const shape=new THREE.Shape();shape.moveTo(-.031,-.118);shape.quadraticCurveTo(-.047,-.118,-.045,-.055);shape.quadraticCurveTo(-.043,.005,-.047,.05);shape.quadraticCurveTo(-.047,.123,0,.126);shape.quadraticCurveTo(.047,.123,.047,.05);shape.quadraticCurveTo(.043,.005,.045,-.055);shape.quadraticCurveTo(.047,-.118,.031,-.118);shape.closePath();
    const soleGeo=new THREE.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2,steps:1,curveSegments:16});soleGeo.rotateX(Math.PI/2);mesh(soleGeo,sole,g,[x,.017,0]);
    const vertices=[],uv=[],indices=[],rings=36,sides=24;
    for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
      const z=-.118+i/rings*.242,angle=j/sides*Math.PI*2,[w,h]=at(z);
      vertices.push(Math.sin(angle)*w,.020+Math.max(0,Math.cos(angle))*h,z);uv.push(j/sides,i/rings);
    }
    for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
      const z=-.118+(i+.5)/rings*.242,a=(j+.5)/sides*Math.PI*2,top=Math.min(a,Math.PI*2-a);
      if(z>-.092&&z<-.038&&top<.66)continue;
      const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);
    }
    for(const end of [0,rings]){const center=vertices.length/3;vertices.push(0,.020,end===0?-.118:.124);uv.push(.5,.5);const k=end*(sides+1);for(let j=0;j<sides;j++){if(end===0)indices.push(center,k+j,k+j+1);else indices.push(center,k+j+1,k+j);}}
    const upper=new THREE.BufferGeometry();upper.setAttribute('position' ,new THREE.Float32BufferAttribute(vertices,3));upper.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));upper.setIndex(indices);upper.computeVertexNormals();mesh(upper,leather,g,[x,0,0]);
    const inside=mesh(new THREE.SphereGeometry(1,16,8),lining,g,[x,.073,-.065]);inside.scale.set(.027,.006,.033);
    const rimPoints=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2,px=.024*Math.cos(a),z=-.065+.028*Math.sin(a),[w,h]=at(z);rimPoints.push(new THREE.Vector3(x+px,.020+h*Math.sqrt(Math.max(0,1-(px/w)**2))+.001,z));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints,true),48,.0017,6,true),leather,g);
    for(let i=0;i<4;i++){const z=-.018+i*.014,[w,h]=at(z),curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x-.024,.020+h*Math.sqrt(1-(.024/w)**2)+.002,z),new THREE.Vector3(x,.022+h,z),new THREE.Vector3(x+.024,.020+h*Math.sqrt(1-(.024/w)**2)+.002,z)]);laceGeometries.push(new THREE.TubeGeometry(curve,8,.0012,5,false).toNonIndexed());}
  }
  mesh(mergeGeometries(laceGeometries),laces,g);laceGeometries.forEach(geo=>geo.dispose());return g;
}
export function makeBag(materials){
  const g=new THREE.Group(),leather=materials.leather('#785333'),seam=new THREE.MeshStandardMaterial({color:'#ba936a',roughness:.8}),metal=new THREE.MeshStandardMaterial({color:'#b39969',metalness:.85,roughness:.28});
  mesh(roundedGeometry(.24,.19,.13,.012),leather,g,[0,.105,0]);
  mesh(roundedGeometry(.22,.055,.008,.003),leather,g,[0,.172,.068]);
  const handle=mesh(new THREE.TorusGeometry(.061,.006,8,28,Math.PI),leather,g,[0,.20,0]);
  mesh(roundedGeometry(.018,.018,.009,.003),metal,g,[0,.15,.077]);
  for(const x of [-.108,.108])bar([x,.03,.066],[x,.18,.066],.0008,seam,g);
  return g;
}
export function addCountertopStyling(parent){
  const pottery=new THREE.MeshStandardMaterial({color:'#9b8b71',roughness:.58});
  const points=[[.025,0],[.055,.012],[.075,.05],[.07,.058],[.063,.048],[.046,.013],[.025,.005]].map(p=>new THREE.Vector2(...p));
  mesh(new THREE.LatheGeometry(points,32),pottery,parent,[.72,.90,.18]);
  const bottle=new THREE.MeshPhysicalMaterial({color:'#3b3224',roughness:.25,metalness:.1,clearcoat:.7});
  mesh(new THREE.CylinderGeometry(.022,.025,.065,20),bottle,parent,[.56,.9325,.19]);
  const reed=new THREE.MeshStandardMaterial({color:'#6f5635',roughness:.9});
  for(let i=0;i<5;i++)bar([.56,.965,.19],[.56+(i-2)*.012,1.12,.19+Math.sin(i)*.015],.0008,reed,parent);
}
