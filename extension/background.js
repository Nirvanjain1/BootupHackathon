// OWNER: Nirvan. Browser-side panel routing. Resolve the active tab on every message.
const own=url=>url?.startsWith(chrome.runtime.getURL(''));
function allowed(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)&&!['chromewebstore.google.com','microsoftedge.microsoft.com'].includes(u.hostname)&&!(u.hostname==='chrome.google.com'&&u.pathname.startsWith('/webstore'))}catch{return false}}
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(console.error);
const injections=new Map();
async function send(id,message){
 try{return await chrome.tabs.sendMessage(id,message)}catch{
  if(!injections.has(id))injections.set(id,chrome.scripting.executeScript({target:{tabId:id},files:['page-menu.js','content.js']}).finally(()=>injections.delete(id)));
  await injections.get(id);return chrome.tabs.sendMessage(id,message);
 }
}
chrome.tabs.onActivated.addListener(()=>chrome.tts.stop());
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(sender.id!==chrome.runtime.id||m.type==='panelControl')return;
 (async()=>{
  if(m.type==='pageControl'&&sender.tab){
 const [active]=await chrome.tabs.query({active:true,windowId:sender.tab.windowId});if(active?.id!==sender.tab.id)throw Error('Select this tab first.');
 if(!['pause','action','dwell','size','preset','sound'].includes(m.command))throw Error('Unknown control');
 const result=await chrome.runtime.sendMessage({type:'panelControl',command:m.command,value:m.value,sourceWindowId:sender.tab.windowId});return result||{ok:false,error:'Start HandWave from the side panel first.'};
 }
 if(m.type==='speak'&&sender.tab){chrome.tts.stop();if(m.text)chrome.tts.speak(String(m.text).slice(0,12000),{lang:m.lang||'en-US',rate:1});return {ok:true}}
  if(sender.url!==chrome.runtime.getURL('controller.html'))throw Error('Unsupported sender');
  if(m.type==='stop'){chrome.tts.stop();const tabs=await chrome.tabs.query({url:['http://*/*','https://*/*']});await Promise.allSettled(tabs.map(t=>chrome.tabs.sendMessage(t.id,{type:'hide'})));return {ok:true}}
  if(m.type==='action'&&m.action==='stopSpeech'){chrome.tts.stop();return {ok:true}}
  if(!Number.isInteger(m.windowId))throw Error('Reopen the HandWave side panel.');
  const [t]=await chrome.tabs.query({active:true,windowId:m.windowId});
  if(!t||!allowed(t.url))throw Error('Open an ordinary webpage. Browser settings, stores and built-in viewers restrict extensions.');
  const id=t.id;
  if(m.type==='action'&&['next','previous'].includes(m.action)){
   const tabs=(await chrome.tabs.query({windowId:t.windowId})).filter(t=>!own(t.url)).sort((a,b)=>a.index-b.index);const i=tabs.findIndex(t=>t.id===id);const next=tabs[(i+(m.action==='next'?1:-1)+tabs.length)%tabs.length];if(next)await chrome.tabs.update(next.id,{active:true});return {ok:true,tabId:id};
  }
  if(m.type==='action'&&m.action==='resetAppearance'){await chrome.tabs.setZoom(id,1);return await send(id,m)}
  if(m.type==='action'&&['zoomIn','zoomOut','resetZoom'].includes(m.action)){
   const z=await chrome.tabs.getZoom(id);await chrome.tabs.setZoom(id,m.action==='resetZoom'?1:Math.min(3,Math.max(.5,z*(m.action==='zoomIn'?1.15:1/1.15))));return {ok:true,tabId:id};
  }
  const result=await send(id,m);return {...result,tabId:id,title:t.title||'Current webpage'};
 })().then(v=>reply(v||{ok:true}),e=>reply({ok:false,error:e.message}));return true;
});
