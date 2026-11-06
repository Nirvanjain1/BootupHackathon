import {PinchGate} from './pinch-gate.mjs';
const pinchGate=new PinchGate();
// OWNER: Nirvan. MediaPipe recognition; no camera frames leave this extension page.
import {GestureRecognizer,FilesetResolver} from './vendor/vision_bundle.mjs';
const $=id=>document.getElementById(id),video=$('video');
const defaults={Thumb_Up:'scrollUp',Thumb_Down:'scrollDown',Victory:'next',Open_Palm:'zoomIn',Closed_Fist:'zoomOut',ILoveYou:'read'};
const actions={none:'No action',scrollUp:'Scroll up',scrollDown:'Scroll down',next:'Next tab',previous:'Previous tab',zoomIn:'Magnify',zoomOut:'Reduce magnification',contrast:'Toggle contrast',read:'Read aloud',stopSpeech:'Stop reading',back:'Back',forward:'Forward',media:'Play / pause video'};
let model,stream,raf=0,running=false,paused=false,starting=false,generation=0,map={...defaults},last=null,since=0,fired=false,pinched=false,lastTime=-1,busy=false,lastSend=0;
const panelWindow=await chrome.windows.getCurrent();
let cameraSetup=null;

async function openCameraSetup() {
 const setup={token:crypto.randomUUID(),tabId:null};
 cameraSetup=setup;
 starting=true;
 $('start').disabled=true;
 $('status').textContent='Allow camera access in the HandWave setup tab.';
 setup.onRemoved=id=>{
  if(id!==setup.tabId||cameraSetup!==setup)return;
  chrome.tabs.onRemoved.removeListener(setup.onRemoved);
  cameraSetup=null;
  starting=false;
  $('start').disabled=false;
  $('status').textContent='Camera setup closed. Click Start camera to try again.';
 };
 chrome.tabs.onRemoved.addListener(setup.onRemoved);
 try {
  const tab=await chrome.tabs.create({windowId:panelWindow.id,url:chrome.runtime.getURL('camera-setup.html')+'#'+setup.token});
  setup.tabId=tab.id;
  if(cameraSetup!==setup)await chrome.tabs.remove(tab.id);
 } catch(error) {
  if(cameraSetup!==setup)return;
  stop();
  $('status').textContent='Could not open camera setup: '+error.message;
 }
}
let activeTarget=null;
const saved=await chrome.storage.local.get(['map','pointer','dwell','smooth','hold','size','sound','preset','preview','tutorialDone']);
for(const k of Object.keys(defaults))if(Object.hasOwn(actions,saved.map?.[k]))map[k]=saved.map[k];
for(const key of ['pointer','dwell','sound'])if(typeof saved[key]==='boolean')$(key).checked=saved[key];
for(const key of ['smooth','hold'])if(Number.isFinite(+saved[key]))$(key).value=saved[key];
for(const pose of Object.keys(defaults)){const label=document.createElement('label');label.textContent=pose.replaceAll('_',' ');const select=document.createElement('select');for(const [v,t] of Object.entries(actions))select.add(new Option(t,v));select.value=map[pose];select.onchange=()=>{map[pose]=select.value;chrome.storage.local.set({map})};label.append(select);$('maps').append(label)}
for(const key of ['pointer','dwell','smooth','hold','size','sound','preset'])$(key).onchange=()=>chrome.storage.local.set({[key]:$(key).type==='checkbox'?$(key).checked:$(key).value});
async function message(m){try{const r=await chrome.runtime.sendMessage({...m,windowId:panelWindow.id});if(!r?.ok){$('status').textContent=r?.error||'No response'}else if(r.tabId){if(activeTarget!==r.tabId){activeTarget=r.tabId;last=null;since=0;fired=false;pinchGate.reset()} $('status').textContent=(r.pointerVisible?'Pointer delivered · ':'Connected · ')+(r.title||'current webpage')}if(r?.menuOpen!==undefined)menuOpen=r.menuOpen;if(r?.scanning!==undefined)menuScanning=r.scanning;if(r?.clicked)clickSound();return r}catch(e){$('status').textContent=e.message}}
$('testPointer').onclick=()=>message({type:'frame',hand:{x:.5,y:.5,click:false,pinched:false},pointer:true,test:true,smooth:.24});
let clickAudio;
function clickSound(){if(!$('sound').checked||!clickAudio||clickAudio.state!=='running')return;const o=clickAudio.createOscillator(),g=clickAudio.createGain();o.frequency.value=650;g.gain.setValueAtTime(.025,clickAudio.currentTime);g.gain.exponentialRampToValueAtTime(.001,clickAudio.currentTime+.065);o.connect(g).connect(clickAudio.destination);o.start();o.stop(clickAudio.currentTime+.07)}
let menuOpen=false,menuScanning=false,menuRequest;
function setPaused(value){paused=!!value;reset();renderState();message({type:'stop'});message({type:'frame',hand:null,ui:{map,paused,menuOpen:paused?true:undefined}})}
const action=a=>message({type:'action',action:a});document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));

function reset(){last=null;since=0;fired=false;pinched=false;pinchGate.reset();$('gesture').textContent='No hand'}
function stop(){if(cameraSetup){const setup=cameraSetup;cameraSetup=null;chrome.tabs.onRemoved.removeListener(setup.onRemoved);if(setup.tabId!==null)chrome.tabs.remove(setup.tabId).catch(()=>{})}generation++;running=false;starting=false;cancelAnimationFrame(raf);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;if(model)model.close();model=null;reset();$('start').disabled=false;$('pause').disabled=true;$('status').textContent='Camera off';$('tracking').textContent='Tracking stopped';message({type:'stop'})}
$('stop').onclick=stop;window.addEventListener('pagehide',stop);
$('pause').onclick=()=>setPaused(!paused);
$('start').onclick=()=>startCamera();
async function startCamera(allowSetup=true){
 if(running||starting)return;starting=true;$('start').disabled=true;const gen=++generation;
 try{clickAudio ||= new AudioContext();clickAudio.resume().catch(()=>{})}catch{}
 try{
  $('status').textContent='Requesting camera access…';
  try {
   const acquired=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
   if(gen!==generation){acquired.getTracks().forEach(t=>t.stop());return}
   stream=acquired;
  } catch(error) {
   if(gen!==generation)return;
   if(allowSetup&&error.name==='NotAllowedError'&&/dismissed/i.test(error.message)){
    await openCameraSetup();
    return;
   }
   throw error;
  }
  $('status').textContent='Loading local hand model…';const fs=await FilesetResolver.forVisionTasks(chrome.runtime.getURL('vendor'));
  const created=await GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:chrome.runtime.getURL('vendor/gesture_recognizer.task')},runningMode:'VIDEO',numHands:1});
  if(gen!==generation){created.close();return}model=created;
  video.srcObject=stream;await video.play();if(gen!==generation)return;
  running=true;starting=false;paused=false;lastTime=-1;$('pause').disabled=false;$('pause').textContent='Pause gestures';$('status').textContent='Camera on. Move your hand over the webpage beside this panel.';
  const loop=async()=>{
   if(!running||gen!==generation)return;
   try{if(video.readyState>=2&&lastTime!==video.currentTime){lastTime=video.currentTime;const now=performance.now(),r=model.recognizeForVideo(video,now),L=r.landmarks[0];
    if(!L){$('tracking').textContent='Camera running · no hand detected. Show your open hand.';reset();if(now-lastSend>100){lastSend=now;await message({type:'frame',hand:null,ui:{map,paused,menuOpen:menuRequest}});menuRequest=undefined}}
    else{
     $('tracking').textContent='Hand detected · '+($('pointer').checked?'air mouse enabled':'air mouse is switched OFF');
     const d=(a,b)=>Math.hypot(L[a].x-L[b].x,L[a].y-L[b].y),ratio=d(4,8)/(d(0,9)||1);const pinch=pinchGate.update(ratio,now);const click=pinch.click&&!paused&&!menuScanning;pinched=pinch.pinched;
     if(now-lastSend>40||click){lastSend=now;await message({type:'frame',hand:{x:Math.max(0,Math.min(1,(1-L[8].x-.2)/.6)),y:Math.max(0,Math.min(1,(L[8].y-.15)/.6)),click,pinched,progress:pinch.progress||0},ui:{map,paused,pinched:pinched||last==='Scan_Select',menuOpen:menuRequest},pointer:$('pointer').checked&&!paused,dwell:$('dwell').checked,smooth:+$('smooth').value,size:+$('size').value})}
     menuRequest=undefined;
 const candidate=r.gestures[0]?.[0];const up=(tip,pip)=>d(tip,0)>d(pip,0)*1.1;
 const menuPose=up(20,18)&&!up(8,6)&&!up(12,10)&&!up(16,14)&&d(4,5)/(d(0,9)||1)>.6;
 const raw=!pinched&&candidate?.score>.6?candidate.categoryName:null;
 const g=menuPose?'HandWave_Menu':paused?(raw==='Open_Palm'?'Wake':null):candidate?.categoryName==='Closed_Fist'&&candidate.score>.6&&menuScanning?'Scan_Select':menuOpen?(raw&&['scrollUp','scrollDown'].includes(map[raw])?raw:null):(raw&&map[raw]?raw:null);
     if(g!==last){last=g;since=now;fired=false}const hold=g==='Wake'?1200:Math.max(600,Math.min(3000,+$('hold').value||700));
     $('gesture').textContent=g?g.replaceAll('_',' ')+' '+Math.min(100,Math.round((now-since)/hold*100))+'%':'Point / pinch';
     if(g&&!fired&&now-since>=hold){fired=true;if(g==='HandWave_Menu'){menuOpen=!menuOpen;menuRequest=menuOpen}else if(g==='Wake'){setPaused(false)}else if(g==='Scan_Select'){await message({type:'action',action:'scanSelect'})}else if(map[g]!=='none')await action(map[g])}
    }
   }}catch(e){stop();$('status').textContent=e.message;return}raf=requestAnimationFrame(loop);
  };raf=requestAnimationFrame(loop);
 }catch(e){if(gen===generation){stop();$('status').textContent='Could not start camera: '+e.message}}
}

// OWNER: Vedant. Compact interface state, presets and persistent preferences.
if(['36','48','60'].includes(String(saved.size)))$('size').value=saved.size;
if(['responsive','balanced','steady','custom'].includes(saved.preset))$('preset').value=saved.preset;
$('preview').open=saved.preview===true;$('preview').ontoggle=()=>chrome.storage.local.set({preview:$('preview').open});
function clickMethod(dwell){$('dwell').checked=dwell;$('pinchMode').setAttribute('aria-pressed',!dwell);$('dwellMode').setAttribute('aria-pressed',dwell);$('methodHint').textContent=dwell?'Rest inside one target for 1.2 seconds. Moving cancels the timer.':'Open thumb and index, pinch briefly, then release. One pinch, one click.';chrome.storage.local.set({dwell});reset()}
$('pinchMode').onclick=()=>clickMethod(false);$('dwellMode').onclick=()=>clickMethod(true);clickMethod($('dwell').checked);
const presets={responsive:[.4,500],balanced:[.24,700],steady:[.12,1100]};
$('preset').onchange=()=>{chrome.storage.local.set({preset:$('preset').value});const v=presets[$('preset').value];if(v){$('smooth').value=v[0];$('hold').value=v[1];chrome.storage.local.set({smooth:v[0],hold:v[1],preset:$('preset').value})}};
for(const id of ['smooth','hold'])$(id).addEventListener('change',()=>{$('preset').value='custom';chrome.storage.local.set({preset:'custom'})});
if(saved.tutorialDone)$('practice').textContent='Practise again';
function renderState(){const text=$('tracking').textContent;const error=/could not|cannot|restrict|no response|error|reopen/i.test($('status').textContent);const state=error?'help':starting?'loading':!running?'off':paused?'paused':text.startsWith('Hand detected')?'ready':'searching';const labels={help:'Needs attention',loading:'Starting…',off:'Camera off',paused:'Paused',ready:'Ready',searching:'Looking for your hand'};$('stateLabel').textContent=labels[state];$('stateDot').dataset.state=state;$('pause').textContent=paused?'Resume':'Pause'}
new MutationObserver(renderState).observe($('tracking'),{childList:true});new MutationObserver(renderState).observe($('status'),{childList:true});
for(const id of ['start','pause','stop'])$(id).addEventListener('click',()=>queueMicrotask(renderState));renderState();

// Commands originate from this window's active webpage through the service worker.
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m.type==='cameraSetupGranted'){
  const setup=cameraSetup;
  if(!setup||sender.id!==chrome.runtime.id||sender.tab?.windowId!==panelWindow.id||sender.url!==chrome.runtime.getURL('camera-setup.html')+'#'+setup.token||m.token!==setup.token)return;
  chrome.tabs.onRemoved.removeListener(setup.onRemoved);
  cameraSetup=null;
  const gen=generation;
  chrome.tabs.remove(sender.tab.id).catch(()=>{}).then(()=>{
   if(gen===generation){starting=false;startCamera(false)}
  });
  reply({ok:true});
  return;
 }
 if(sender.id!==chrome.runtime.id||m.type!=='panelControl'||m.sourceWindowId!==panelWindow.id)return;
 (async()=>{if(m.command==='pause'){setPaused(m.value)}
 else if(m.command==='action'){if(!Object.hasOwn(actions,m.value)&&!['practice','resetAppearance'].includes(m.value))throw Error('Unsupported action');return await action(m.value)}
 else if(m.command==='dwell'){clickMethod(!!m.value)}
 else if(m.command==='size'){if(![36,48,60].includes(m.value))throw Error('Unsupported size');$('size').value=m.value;await chrome.storage.local.set({size:m.value})}
 else if(m.command==='preset'){if(!presets[m.value])throw Error('Unknown preset');$('preset').value=m.value;$('preset').onchange()}
 else if(m.command==='sound'){$('sound').checked=!!m.value;await chrome.storage.local.set({sound:!!m.value})}
 return {ok:true};})().then(reply,e=>reply({ok:false,error:e.message}));return true;
});
