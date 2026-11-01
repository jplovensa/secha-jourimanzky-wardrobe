// Click-only discovery stations. No timeline, autoplay, or scripted camera motion.
// Metres: x=0 left wall, z=0 rear, +z toward the entrance.
export const WALK_STOPS = [
  {id:'entrance',title:'Entrance',badge:'Wayfinder',task:'At the entrance, which wall has the full-height mirror?',event:'orientation',position:[.403,1.60,2.90],target:[.95,1.40,.45],anchor:[.403,1.45,2.05]},
  {id:'hanging',title:'A+B · Hanging',badge:'Rail scout',task:'Click a hanging garment to inspect the two-tier L rails.',event:'garment',position:[.86,1.60,1.08],target:[1.722,1.62,.90],anchor:[1.48,1.65,1.05]},
  {id:'drawers',title:'C · Drawers',badge:'Detail finder',task:'Click a drawer front to open it and inspect the joinery.',event:'drawerOpen',position:[.86,1.60,1.05],target:[.472,.65,.20],anchor:[.472,1.00,.42]},
  {id:'mirror',title:'M · Mirror',badge:'Reflection seeker',task:'Click the mirror surface to discover the full left-wall reflection.',event:'mirror',position:[.80,1.60,1.15],target:[.006,1.55,1.15],anchor:[.025,1.60,1.20]},
  {id:'shoes',title:'D · Shoes',badge:'Space stylist',task:'Click a pair of shoes, then use a move arrow to style the rack.',event:'shoeMoved',position:[.80,1.60,1.12],target:[1.414,1.08,1.982],anchor:[1.414,1.55,1.78]},
];
export function awardDiscovery(current,event){
  const result=new Set(current);
  const station=WALK_STOPS.find(s=>s.event===event);
  if(station)result.add(station.id);
  return result;
}
export function createWalkthrough({camera,controls,invalidate,onStart,onExit,onComplete,onRestart,project,resolve=station=>station}){
  const panel=document.querySelector('#walkthrough-panel');
  const nav=document.querySelector('#walk-stations');
  const pins=document.querySelector('#walk-hotspots');
  let active=false,index=0,completed=new Set();
  const focusStart=()=>document.querySelector('#start-walkthrough').focus();
  const buttons=WALK_STOPS.map((station,i)=>{
    const button=document.createElement('button');button.type='button';button.onclick=()=>visit(i);button.setAttribute('aria-label',`Visit ${station.title}`);nav.append(button);
    const pin=document.createElement('button');pin.type='button';pin.className='discovery-pin';pin.textContent=String(i+1);pin.setAttribute('aria-label',`Go to ${station.title}`);pin.onclick=()=>visit(i);pins.append(pin);
    return {button,pin,station};
  });
  function render(){
    const station=WALK_STOPS[index];
    document.querySelector('#walk-chapter').textContent=station.title;
    document.querySelector('#walk-task').textContent=completed.has(station.id)?`✓ ${station.badge} badge collected. Choose another hotspot to explore.`:station.task;
    document.querySelector('#walk-answers').hidden=index!==0||completed.has('entrance');
    document.querySelector('#walk-score').textContent=`${completed.size*20} XP · ${completed.size} / ${WALK_STOPS.length} badges`;
    document.querySelector('#walk-reward').hidden=completed.size!==WALK_STOPS.length;
    buttons.forEach(({button,pin,station:s},i)=>{
      button.textContent=`${completed.has(s.id)?'✓':i+1} ${s.title}`;
      button.classList.toggle('active',i===index);button.setAttribute('aria-pressed',String(i===index));
      pin.classList.toggle('collected',completed.has(s.id));
    });
    invalidate();
  }
  function visit(i){
    index=i;const station=resolve(WALK_STOPS[index]);
    camera.position.fromArray(station.position);controls.target.fromArray(station.target);controls.update();camera.updateMatrixWorld(true);
    document.querySelector('#walk-feedback').textContent='';render();
  }
  function observe(event){
    if(!active)return;
    const next=awardDiscovery(completed,event);
    if(next.size>completed.size){
      completed=next;const found=WALK_STOPS.find(s=>s.event===event);
      onComplete(WALK_STOPS.indexOf(found));
      render();document.querySelector('#walk-feedback').textContent=`+20 XP · ${found.badge} badge collected!`;
    }
  }
  function stop(){active=false;panel.hidden=true;pins.hidden=true;controls.enabled=true;controls.enableDamping=true;invalidate();}
  function exit(){stop();onExit();focusStart();}
  function start(){controls.enableDamping=false;controls.update();controls.enabled=false;active=true;panel.hidden=false;pins.hidden=false;onStart();visit(0);buttons[0].button.focus();}
  document.querySelectorAll('[data-mirror-answer]').forEach(button=>button.onclick=()=>{
    if(button.dataset.mirrorAnswer==='left')observe('orientation');
    else document.querySelector('#walk-feedback').textContent='Try again: use the entrance direction in the floorplan. No XP lost.';
  });
  document.querySelector('#walk-exit').onclick=exit;
  document.querySelector('#walk-restart').onclick=()=>{completed=new Set();onRestart();visit(0);};
  document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'&&!document.querySelector('#film-dialog').open)exit();});
  return {
    start,stop,observe,
    get active(){return active;},
    updateHotspots(){if(!active)return;buttons.forEach(({pin,station},i)=>{const p=project(resolve(station).anchor);pin.hidden=i===index||!p.visible;pin.style.left=`${p.x}%`;pin.style.top=`${p.y}%`;});},
    getState:()=>({active,index,station:WALK_STOPS[index].id,completed:[...completed],xp:completed.size*20,position:[...WALK_STOPS[index].position]}),
  };
}
