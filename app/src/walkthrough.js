// Metres in the floorplan datum: x=0 left, z=0 rear, z=2.157 entrance.
// Only the initial/final approach is outside the measured main bay.
export const WALK_STOPS = [
  { title: 'Entrance · mirror left, hanging right', position: [.403,1.60,2.90], target: [.95,1.40,.45] },
  { title: 'Through the 806 mm entrance opening', position: [.403,1.60,1.98], target: [.98,1.40,.48] },
  { title: 'Inside the 1472 mm nominal aisle', position: [.78,1.60,1.12], target: [1.10,1.35,.45] },
  { title: 'A + B · right-hand L hanging', position: [.90,1.60,1.08], target: [1.722,1.45,.72] },
  { title: 'C · rear-left drawers', position: [.86,1.60,.95], target: [.472,1.10,.20] },
  { title: 'M · full left-wall mirror', position: [.80,1.60,1.15], target: [.006,1.40,1.15] },
  { title: 'D · shoe rack on the entrance return', position: [.80,1.60,1.15], target: [1.414,.95,1.982] },
  { title: 'Back to the entrance', position: [.403,1.60,2.90], target: [.95,1.40,.45] },
];
export const LEG_SECONDS = 4;
export const ENTRANCE_HOLD = 3;
export const WALK_DURATION = ENTRANCE_HOLD + (WALK_STOPS.length - 1) * LEG_SECONDS;
const stopTime = index => index <= 0 ? 0 : Math.min(WALK_DURATION,ENTRANCE_HOLD + index * LEG_SECONDS);
export function sampleWalkthrough(seconds) {
  const time = Math.max(0, Math.min(WALK_DURATION, seconds));
  const travel = Math.max(0,time-ENTRANCE_HOLD);
  const index = Math.min(WALK_STOPS.length - 1, Math.floor(travel / LEG_SECONDS));
  const next = Math.min(index + 1, WALK_STOPS.length - 1);
  const t = (travel - index * LEG_SECONDS) / LEG_SECONDS;
  const ease = t * t * (3 - 2 * t);
  const mix = key => WALK_STOPS[index][key].map((v,i) => v + (WALK_STOPS[next][key][i] - v) * ease);
  return { index, title: WALK_STOPS[index].title, position: mix('position'), target: mix('target'), time };
}
export function createWalkthrough({ camera, controls, invalidate, onStart, onExit }) {
  const panel = document.querySelector('#walkthrough-panel');
  const play = document.querySelector('#walk-play');
  const scrub = document.querySelector('#walk-progress');
  let active = false, playing = false, elapsed = 0, previous = 0;
  const apply = () => {
    const state = sampleWalkthrough(elapsed);
    camera.position.fromArray(state.position);controls.target.fromArray(state.target);
    document.querySelector('#walk-chapter').textContent = `${state.index + 1} / ${WALK_STOPS.length} · ${state.title}`;
    scrub.value = elapsed;
    play.textContent = playing ? 'Pause' : elapsed >= WALK_DURATION ? 'Replay' : 'Play';
    invalidate();
  };
  const pause = () => { playing = false;apply(); };
  const resume = () => { if(elapsed >= WALK_DURATION)elapsed=0;playing=true;previous=performance.now();apply(); };
  const stop = () => {active=false;playing=false;panel.hidden=true;controls.enabled=true;controls.enableDamping=true;invalidate();};
  const start = () => {
    controls.enableDamping=false;controls.update();controls.enabled=false;
    active=true;elapsed=0;panel.hidden=false;onStart();resume();play.focus();
  };
  play.onclick = () => playing ? pause() : resume();
  document.querySelector('#walk-previous').onclick = () => {elapsed=stopTime(sampleWalkthrough(elapsed).index-1);previous=performance.now();apply();};
  document.querySelector('#walk-next').onclick = () => {elapsed=stopTime(sampleWalkthrough(elapsed).index+1);if(elapsed===WALK_DURATION)playing=false;previous=performance.now();apply();};
  document.querySelector('#walk-exit').onclick = () => {stop();onExit();document.querySelector('#start-walkthrough').focus();};
  scrub.max=WALK_DURATION;
  scrub.oninput=() => {elapsed=Number(scrub.value);playing=false;apply();};
  document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'&&!document.querySelector('#film-dialog').open){stop();onExit();document.querySelector('#start-walkthrough').focus();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();});
  return {
    start, stop, pause,
    get active(){return active;},
    tick(now){if(!active||!playing)return false;elapsed=Math.min(WALK_DURATION,elapsed+(now-previous)/1000);previous=now;if(elapsed>=WALK_DURATION)playing=false;apply();return true;},
    getState:()=>({active,playing,...sampleWalkthrough(elapsed)}),
  };
}
