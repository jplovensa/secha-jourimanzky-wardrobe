"""Build the website's clothed MakeHuman figure with Blender (background mode).
Usage: blender -b --python scripts/build-human.py -- --makehuman /path/to/makehuman
       --assets /path/to/makehuman-assets --output app/public/models/makehuman/person.glb
Uses CC0 HM08 mesh, rig weights and MakeClothes barycentric garment definitions.
No MakeHuman program logic is redistributed; this script implements the asset math.
"""
import argparse,json,math,re,sys
from pathlib import Path
import bpy,numpy as np
p=argparse.ArgumentParser();p.add_argument('--makehuman',required=True);p.add_argument('--assets',required=True);p.add_argument('--output',required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);core=Path(a.makehuman)/'makehuman/data';assets=Path(a.assets)/'base';out=Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True)
def obj(path):
 vertices=[];uv=[];faces=[];group=''
 for line in Path(path).read_text().splitlines():
  s=line.split()
  if not s:continue
  if s[0]=='v':vertices.append(list(map(float,s[1:4])))
  elif s[0]=='vt':uv.append(list(map(float,s[1:3])))
  elif s[0]=='g':group=' '.join(s[1:])
  elif s[0]=='f':
   refs=[x.split('/')for x in s[1:]];faces.append(([int(x[0])-1 for x in refs],[int(x[1])-1 if len(x)>1 and x[1] else 0 for x in refs],group))
 return {'v':np.array(vertices),'uv':uv,'faces':faces}
base=obj(core/'3dobjs/base.obj');original=base['v'];rig=json.loads((core/'rigs/default.mhskel').read_text());weights=json.loads((core/'rigs/default_weights.mhw').read_text())['weights']
# Relax both arms using the original MakeHuman rig's graded vertex influences.
boneNames=list(weights);boneWeights=np.zeros((len(boneNames),len(original)))
for row,bone in enumerate(boneNames):
 for index,value in weights[bone]:boneWeights[row,index]=value
boneWeights/=np.maximum(boneWeights.sum(axis=0),1e-9)
armWeights=[];armRows=[];pivots=[];rotations=[]
for side,angle in [('L',-34),('R',34)]:
 root='upperarm01.'+side
 def below(name):
  while name:
   if name==root:return True
   name=rig['bones'][name]['parent']
  return False
 rows=[i for i,bone in enumerate(boneNames)if below(bone)];armRows.append(rows)
 armWeights.append(boneWeights[rows].sum(axis=0));pivots.append(original[rig['joints'][rig['bones'][root]['head']]].mean(axis=0))
 t=math.radians(angle);rotations.append(np.array([[math.cos(t),-math.sin(t),0],[math.sin(t),math.cos(t),0],[0,0,1]]))
def pose(vertices,influences):
 result=vertices.copy()
 for w,pivot,rotation in zip(influences,pivots,rotations):result+=((vertices-pivot)@rotation.T+pivot-vertices)*w[:,None]
 return result
mask=set();parts=[]
def fit(path,name):
 path=Path(path);meta=path.read_text().splitlines();rows=[];scales=np.ones(3);inside=False;deleting=False
 for line in meta:
  s=line.split()
  if not s or s[0].startswith('#'):continue
  if s[0] in ['x_scale','y_scale','z_scale']:
   i='xyz'.index(s[0][0]);scales[i]=abs(original[int(s[1]),i]-original[int(s[2]),i])/float(s[3])
  elif s[0]=='verts':inside=True
  elif s[0]=='delete_verts':inside=False;deleting=True
  elif inside:
   if not s[0][0].isdigit():inside=False;continue
   if len(s)==1:rows.append(([int(s[0]),0,0],[1,0,0],[0,0,0]))
   elif len(s)>=9:rows.append((list(map(int,s[:3])),list(map(float,s[3:6])),list(map(float,s[6:9]))))
  elif deleting:
   for lo,hi,single in re.findall(r'(\d+)\s*-\s*(\d+)|(\d+)',line):mask.update(range(int(lo),int(hi)+1) if lo else [int(single)])
 mesh=obj(path.with_suffix('.obj'));refs=np.array([r[0]for r in rows]);bary=np.array([r[1]for r in rows]);offset=np.array([r[2]for r in rows]);assert len(rows)==len(mesh['v']),(name,len(rows),len(mesh['v']))
 # Assign whole connected garment islands, not a horizontal per-face colour cut.
 if 'shirt' in name:
  parents=list(range(len(mesh['v'])))
  def component(i):
   while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
   return i
  for face in mesh['faces']:
   for vertex in face[0]:parents[component(vertex)]=component(face[0][0])
  islands={}
  for i in range(len(parents)):islands.setdefault(component(i),[]).append(i)
  roles={key:0 if mesh['v'][indices,1].mean()>0 else 1 for key,indices in islands.items()}
  mesh['materialIndices']=[roles[component(face[0][0])]for face in mesh['faces']]
 fitted=(original[refs]*bary[:,:,None]).sum(axis=1)+offset*scales
 mapped=np.maximum((boneWeights[:,refs]*bary[None,:,:]).sum(axis=2),0)
 mapped/=np.maximum(mapped.sum(axis=0),1e-9)
 influence=[mapped[rows].sum(axis=0)for rows in armRows]
 mesh['v']=pose(fitted,influence);mesh['name']=name;parts.append(mesh)
fit(assets/'clothes/male_casualsuit02/male_casualsuit02.mhclo','MakeClothes casual shirt and trousers')
fit(assets/'clothes/shoes01/shoes01.mhclo','MakeClothes shoes')
fit(assets/'hair/short01/short01.mhclo','MakeHuman short hair')
fit(assets/'eyebrows/eyebrow001/eyebrow001.mhclo','MakeHuman eyebrows')
fit(core/'eyes/low-poly/low-poly.mhclo','MakeHuman brown eyes')
body={**base,'v':pose(original,armWeights),'name':'MakeHuman HM08 body','faces':[face for face in base['faces']if face[2]=='body' and not any(i in mask for i in face[0])]};parts.insert(0,body)
# Normalize the clothed head-to-sole bounds to 1.700 m; omit helper/joint geometry.
allv=np.concatenate([part['v'][np.unique([i for face in part['faces']for i in face[0]])]for part in parts]);low=allv.min(axis=0);high=allv.max(axis=0);scale=1.7/(high[1]-low[1]);center=(low+high)/2;center[1]=low[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,roughness=.7):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=roughness;return m
skin=material('MakeHuman skin / local PBR material',(.48,.28,.19),.58);skin.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=.08
shirt=material('MakeClothes warm cotton',(.64,.59,.50),.95);trousers=material('MakeClothes charcoal trousers',(.045,.049,.048),.9);shoes=material('MakeClothes brown shoes',(.07,.035,.018),.58);hair=material('MakeHuman hair / local PBR material',(.029,.018,.012),.8)
eye=material('MakeHuman brown eyes',(.8,.8,.8),.28);image=bpy.data.images.load(str(core/'eyes/materials/brown_eye.png'));image.scale(512,512);image.pack();tex=eye.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;eye.node_tree.links.new(tex.outputs['Color'],eye.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
for part in parts:
 points=(part['v']-center)*scale
 # Blender is Z-up; exporter maps this back to glTF X/Y/Z = MH X/Y/Z.
 coords=[(float(v[0]),float(-v[2]),float(v[1]))for v in points];faces=[face[0]for face in part['faces']]
 mesh=bpy.data.meshes.new(part['name']);mesh.from_pydata(coords,[],faces);mesh.update();obj3=bpy.data.objects.new(part['name'],mesh);bpy.context.collection.objects.link(obj3)
 uv=mesh.uv_layers.new(name='MakeHuman UV')
 for polygon,source in zip(mesh.polygons,part['faces']):
  for loop_idx,texidx in zip(polygon.loop_indices,source[1]):uv.data[loop_idx].uv=part['uv'][texidx]if part['uv']else(0,0)
 if part['name'].startswith('MakeHuman HM08'):mats=[skin]
 elif 'shirt' in part['name']:mats=[shirt,trousers]
 elif 'shoes' in part['name']:mats=[shoes]
 elif 'eyes' in part['name']:mats=[eye]
 else:mats=[hair]
 for mat in mats:mesh.materials.append(mat)
 for poly_idx,(polygon,source) in enumerate(zip(mesh.polygons,part['faces'])):
  polygon.use_smooth=True
  if len(mats)>1:polygon.material_index=part['materialIndices'][poly_idx]
 if 'hair' not in part['name']and 'eyebrows' not in part['name']:
  modifier=obj3.modifiers.new('Surface smoothing','SUBSURF');modifier.levels=1;modifier.render_levels=1
 obj3['asset_source']='MakeHuman HM08 / MakeClothes MHCLO';obj3['license']='CC0-1.0'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_animations=False)
print('CLOTHED FIGURE EXPORTED',out,out.stat().st_size,'bytes; source scale',scale)
