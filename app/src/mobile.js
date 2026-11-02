export function setupMobile(){
 const media=matchMedia('(max-width: 650px)'),panel=document.querySelector('.control-panel'),inspector=document.querySelector('.inspector'),scrim=document.querySelector('#mobile-scrim'),dock=document.querySelector('#mobile-dock');
 let previousFocus=null;
 function close(){panel.classList.remove('mobile-open','materials-only');inspector.classList.remove('mobile-human-open');scrim.hidden=true;document.body.classList.remove('sheet-open');dock.querySelectorAll('[data-mobile-tool]').forEach(b=>b.setAttribute('aria-expanded','false'));previousFocus?.focus({preventScroll:true});previousFocus=null;}
 function open(tool,button){const wasOpen=button.getAttribute('aria-expanded')==='true';close();if(wasOpen)return;previousFocus=button;scrim.hidden=false;document.body.classList.add('sheet-open');button.setAttribute('aria-expanded','true');
  const target=tool==='human'?inspector:panel;target.classList.add(tool==='human'?'mobile-human-open':'mobile-open');
  panel.classList.toggle('materials-only',tool==='materials');if(tool==='human')inspector.querySelector('.person-tools').open=true;
  target.querySelector('.mobile-sheet-close').focus({preventScroll:true});
 }
 dock.querySelectorAll('[data-mobile-tool]').forEach(button=>button.onclick=()=>{
  if(button.dataset.mobileTool==='edit'){close();document.querySelector('#edit-layout').click();document.querySelector('#viewer').scrollIntoView({block:'start'});}
  else open(button.dataset.mobileTool,button);
 });
 document.querySelector('#person-focus').addEventListener('click',()=>{if(media.matches){close();document.querySelector('#viewer').scrollIntoView({block:'start'});}});
 document.querySelectorAll('.mobile-sheet-close').forEach(button=>button.onclick=close);scrim.onclick=close;
 panel.querySelectorAll('[data-view],#start-walkthrough,#edit-layout').forEach(button=>button.addEventListener('click',()=>{if(media.matches){close();document.querySelector('#viewer').scrollIntoView({block:'start'});}}));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){close();document.body.classList.remove('immersive');document.querySelector('#expand-view').setAttribute('aria-pressed','false');document.querySelector('#expand-view').setAttribute('aria-label','Expand 3D view');}
  if(event.key==='Tab'&&document.body.classList.contains('sheet-open')){
   const active=inspector.classList.contains('mobile-human-open')?inspector:panel;
   const targets=[...active.querySelectorAll('button,input,select,a,summary')].filter(el=>el.getClientRects().length&&!el.disabled),first=targets[0],last=targets.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 });
 document.querySelector('#expand-view').onclick=event=>{const expanded=document.body.classList.toggle('immersive');event.currentTarget.setAttribute('aria-pressed',String(expanded));event.currentTarget.setAttribute('aria-label',expanded?'Exit expanded 3D view':'Expand 3D view');};
 media.addEventListener('change',()=>{close();document.body.classList.remove('immersive');document.querySelector('#expand-view').setAttribute('aria-pressed','false');document.querySelector('#expand-view').setAttribute('aria-label','Expand 3D view');});
}
