// OWNER: Vedant/Rudra. Isolated page controls; page content never leaves the browser extension.
(()=>{
if(globalThis.__handwaveV7)return;globalThis.__handwaveV7=true;
document.getElementById('handwave-overlay')?.remove();
const host=document.createElement('div');host.id='handwave-overlay';host.style.cssText='all:initial!important;display:block!important;position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;margin:0!important;padding:0!important;border:0!important;opacity:1!important;visibility:visible!important;pointer-events:none!important;z-index:2147483647!important';document.documentElement.append(host);
const shadow=host.attachShadow({mode:'closed'});const cursor=document.createElement('div');cursor.style.cssText='position:absolute;width:60px;height:60px;border:3px solid #8b9cff;border-radius:50%;background:rgba(139,156,255,.12);box-shadow:0 0 0 2px #0f1218,0 0 24px #8b9cff88,inset 0 0 14px #ffffff22;transform:translate(-50%,-50%);display:none;box-sizing:border-box;pointer-events:none';const dot=document.createElement('i');dot.style.cssText='position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:white;box-shadow:0 0 0 2px #0f1218';cursor.append(dot);shadow.append(cursor);
const highlight=document.createElement('div');highlight.style.cssText='position:absolute;display:none;border:2px solid #4fd8c4;border-radius:10px;background:#4fd8c412;pointer-events:none;box-sizing:border-box';shadow.append(highlight);
const progress=document.createElement('div');progress.style.cssText='position:absolute;inset:-10px;border-radius:50%;pointer-events:none;mask:radial-gradient(farthest-side,transparent calc(100% - 5px),black 0)';cursor.append(progress);
function feedback(e,fraction,clicked){const size=[36,48,60].includes(currentSize)?currentSize:60;cursor.style.width=size+'px';cursor.style.height=size+'px';progress.style.background='conic-gradient(#4fd8c4 '+Math.round(Math.max(0,Math.min(1,fraction))*360)+'deg,transparent 0)';highlight.style.display=e?'block':'none';if(e){const r=e.getBoundingClientRect();Object.assign(highlight.style,{left:(r.left-3)+'px',top:(r.top-3)+'px',width:(r.width+6)+'px',height:(r.height+6)+'px'})}if(clicked&&cursor.animate&&!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches))cursor.animate([{opacity:1},{opacity:.35},{opacity:1}],{duration:220})}
let currentSize=60,practiceCard=null,practiceStep=0,practiceScroll=0;
function endPractice(){practiceCard?.remove();practiceCard=null}
function practice(){endPractice();practiceStep=0;practiceCard=document.createElement('section');practiceCard.id='handwave-practice';practiceCard.style.cssText='position:fixed!important;top:20px!important;left:20px!important;z-index:2147483646!important;background:#171b24!important;color:#eceef3!important;border:2px solid #8b9cff!important;border-radius:16px!important;padding:24px!important;width:300px!important;font:18px/1.5 system-ui!important;box-shadow:0 12px 48px #0008!important';const title=document.createElement('h2'),note=document.createElement('p'),targetButton=document.createElement('button'),close=document.createElement('button');title.textContent='Find your flow';note.textContent='1 / 3 · Move the circle onto the target. Keep your fingers apart.';targetButton.textContent='Select this target';targetButton.style.cssText='display:block!important;width:100%!important;min-height:70px!important;background:#8b9cff!important;color:#0f1218!important;border:0!important;border-radius:10px!important;font:inherit!important';close.textContent='Close practice';close.style.cssText='margin-top:14px!important;color:#eceef3!important;background:#1e2430!important;padding:10px!important;border:1px solid #9aa3b2!important';close.onclick=endPractice;targetButton.onmouseenter=()=>{if(practiceStep===0){practiceStep=1;note.textContent='2 / 3 · Pinch and release, or stay still in dwell mode, to select.'}};targetButton.onclick=()=>{if(practiceStep!==1)return;practiceStep=2;practiceScroll=window.scrollY;note.textContent=document.documentElement.scrollHeight>innerHeight+60?'3 / 3 · Use your scroll gesture to scroll the page.':'For the scroll step, open a longer webpage and restart practice.';targetButton.textContent='Scroll to finish';targetButton.disabled=true};practiceCard.append(title,note,targetButton,close);document.documentElement.append(practiceCard);const scrollCheck=()=>{if(!practiceCard){window.removeEventListener('scroll',scrollCheck);return}if(practiceStep===2&&Math.abs(window.scrollY-practiceScroll)>60){note.textContent='All done! Point, select, scroll. You are ready.';chrome.storage.local.set({tutorialDone:true});practiceStep=3;window.removeEventListener('scroll',scrollCheck)}};window.addEventListener('scroll',scrollCheck)}

const css=document.createElement('style');css.textContent='html.hw-contrast,html.hw-contrast body,html.hw-contrast main,html.hw-contrast section,html.hw-contrast article,html.hw-contrast div,html.hw-contrast p,html.hw-contrast header,html.hw-contrast footer,html.hw-contrast nav,html.hw-contrast aside,html.hw-contrast span{background-color:#000!important;color:#fff!important}html.hw-contrast a{color:#ffeb3b!important}html.hw-contrast button,html.hw-contrast input,html.hw-contrast select{background:#000!important;color:#fff!important;border:2px solid #fff!important}';document.documentElement.append(css);
let x=0,y=0,initial=true,target=null,dwellStart=0,dwellDone=false,timer,dwellX=0,dwellY=0,wasPinched=false,pinchTarget=null,lastClickAt=-Infinity;
const selector='a[href],button,input,textarea,select,[role="button"],[role="link"],[tabindex]';
let hoverTarget=null;
function atPoint(){let e=document.elementFromPoint(x,y);while(e?.shadowRoot){const next=e.shadowRoot.elementFromPoint(x,y);if(!next||next===e)break;e=next}return e}
function parentOf(e){return e.parentElement||e.getRootNode?.().host||null}
function chain(e){const result=[];for(;e;e=parentOf(e))result.push(e);return result}
function hoverEvent(e,type,related,bubbles=true){
 if(!e)return;
 const init={bubbles,cancelable:bubbles,composed:bubbles,view:window,clientX:x,clientY:y,screenX:window.screenX+x,screenY:window.screenY+y,relatedTarget:related,buttons:0};
 if(type.startsWith('pointer')&&typeof PointerEvent==='function')e.dispatchEvent(new PointerEvent(type,{...init,pointerId:1,pointerType:'mouse',isPrimary:true,pressure:0}));
 else if(!type.startsWith('pointer'))e.dispatchEvent(new MouseEvent(type,init));
}
function updateHover(next){
 const previous=hoverTarget;
 if(previous!==next){
  const oldChain=chain(previous),newChain=chain(next);
  hoverEvent(previous,'pointerout',next);hoverEvent(previous,'mouseout',next);
  for(const el of oldChain){if(newChain.includes(el))break;hoverEvent(el,'pointerleave',next,false);hoverEvent(el,'mouseleave',next,false)}
  hoverTarget=next;
  hoverEvent(next,'pointerover',previous);hoverEvent(next,'mouseover',previous);
  const entering=newChain.filter(el=>!oldChain.includes(el)).reverse();
  for(const el of entering){hoverEvent(el,'pointerenter',previous,false);hoverEvent(el,'mouseenter',previous,false)}
 }
 if(next){hoverEvent(next,'pointermove',null);hoverEvent(next,'mousemove',null)}
}
function reset(){feedback(null,0,false);updateHover(null);cursor.style.display='none';target=null;dwellStart=0;dwellDone=false;initial=true;wasPinched=false;pinchTarget=null;clearTimeout(timer)}
function hit(){return atPoint()?.closest(selector)}
function click(e){if(!e||e.disabled||e.matches('input[type="file"],select'))return false;e.focus({preventScroll:true});e.click();return true}
function scroll(amount){let e=document.elementFromPoint(x,y);while(e&&e!==document.body){if(e.scrollHeight>e.clientHeight+2&&/(auto|scroll)/.test(getComputedStyle(e).overflowY)){const old=e.scrollTop;e.scrollTop+=amount;if(e.scrollTop!==old)return}e=e.parentElement}window.scrollBy({top:amount,behavior:'smooth'})}
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(s.id!==chrome.runtime.id)return;
 try{
  if(m.type==='hide'){reset();reply({ok:true});return}
  if(m.type==='frame'){
   globalThis.HandWaveMenu?.sync(m.ui);
   if(!host.isConnected)document.documentElement.append(host);
   if(!m.hand||!m.pointer){reset();reply({ok:true,menuOpen:globalThis.HandWaveMenu?.open,scanning:globalThis.HandWaveMenu?.scanning});return}
   currentSize=Number(m.size)||60;let clicked=false;const h=m.hand,k=Math.max(.08,Math.min(.6,m.smooth||.24));if(initial){x=h.x*(innerWidth-1);y=h.y*(innerHeight-1);initial=false}else if(!h.pinched){x+=(h.x*(innerWidth-1)-x)*k;y+=(h.y*(innerHeight-1)-y)*k}
   cursor.style.display='block';cursor.style.left=x+'px';cursor.style.top=y+'px';clearTimeout(timer);timer=setTimeout(reset,m.test?4000:1500);
   updateHover(atPoint());
   const e=hit(),now=performance.now();if(e!==target||Math.hypot(x-dwellX,y-dwellY)>14){target=e;dwellStart=now;dwellDone=false;dwellX=x;dwellY=y}
   if(h.pinched&&!wasPinched)pinchTarget=e;
   wasPinched=!!h.pinched;
   if(h.click&&!m.dwell&&e&&e===pinchTarget&&now-lastClickAt>=800){clicked=click(e);if(clicked){lastClickAt=now;dwellDone=true}}
   if(m.dwell&&e&&!h.pinched&&!dwellDone&&now-dwellStart>=1200){clicked=click(e);if(clicked){dwellDone=true;lastClickAt=now}}
   feedback(e,m.dwell&&e&&!dwellDone?(now-dwellStart)/1200:(h.progress||0),clicked);
   cursor.style.borderColor=e&&!h.pinched?'#4fd8c4':h.pinched?'#fff':m.dwell&&e&&!dwellDone?'#4fd8c4':'#8b9cff';reply({ok:true,pointerVisible:true,clicked,menuOpen:globalThis.HandWaveMenu?.open,scanning:globalThis.HandWaveMenu?.scanning});return
  }
  if(m.type==='action'){
   switch(m.action){
    case 'scanSelect':globalThis.HandWaveMenu?.select();break;
    case 'practice':practice();break;
    case 'resetAppearance':document.documentElement.classList.remove('hw-contrast');break;
    case 'scrollUp':scroll(-innerHeight*.65);break;case 'scrollDown':scroll(innerHeight*.65);break;
    case 'contrast':document.documentElement.classList.toggle('hw-contrast');break;
    case 'back':history.back();break;case 'forward':history.forward();break;
    case 'media':{const v=document.querySelector('video,audio');if(v){if(v.paused)v.play().catch(()=>{});else v.pause()}break}
    case 'read':{const selection=getSelection()?.toString().trim();const text=selection||(document.querySelector('article,main,[role="main"]')||document.body).innerText;chrome.runtime.sendMessage({type:'speak',text:text.slice(0,12000),lang:document.documentElement.lang||'en-US'}).catch(()=>{});break}
   }reply({ok:true});
  }
 }catch(e){reply({ok:false,error:e.message})}
});
window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
})();
