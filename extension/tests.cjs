// OWNER: Dashrath. Routing and pointer regression checks, using mocked browser APIs.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');process.chdir(__dirname);
(async()=>{
for(const f of ['background.js','content.js','controller.js']){const r=cp.spawnSync(process.execPath,['--check',f],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
const manifest=JSON.parse(fs.readFileSync('manifest.json'));assert.equal(manifest.side_panel.default_path,'controller.html');assert.ok(manifest.permissions.includes('sidePanel'));
for(const f of ['vision_bundle.mjs','vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm','gesture_recognizer.task'])assert.ok(fs.statSync('vendor/'+f).size>1000);
let handler,zoom=1,active=5,route=[],injected=[],panelBehavior;
const chrome={runtime:{id:'test',getURL:f=>'chrome-extension://test/'+f,onMessage:{addListener:f=>handler=f}},sidePanel:{setPanelBehavior:async b=>{panelBehavior=b}},tabs:{onActivated:{addListener(){}},getZoom:async()=>zoom,setZoom:async(id,z)=>zoom=z,sendMessage:async(id,m)=>{if(!injected.includes(id))throw Error('no receiver');route.push(id);return {ok:true}},query:async q=>q.active?[{id:active,url:active===99?'chrome://settings':'https://example.org',windowId:q.windowId,title:'Test page'}]:[{id:5,url:'https://example.org',index:0,windowId:1},{id:6,url:'https://example.com',index:1,windowId:1}],update:async id=>{active=id}},scripting:{executeScript:async o=>injected.push(o.target.tabId)},tts:{stop(){},speak(){}}};
vm.runInNewContext(fs.readFileSync('background.js','utf8'),{chrome,URL,console});
const call=(m,sender={id:'test',url:'chrome-extension://test/controller.html'})=>new Promise(r=>handler({...m,windowId:1},sender,r));
assert.equal(panelBehavior.openPanelOnActionClick,true);
await call({type:'frame',hand:{x:.5,y:.5}});assert.equal(route.at(-1),5);active=6;await call({type:'frame',hand:{x:.5,y:.5}});assert.equal(route.at(-1),6);assert.deepEqual(injected,[5,6]);
zoom=3;await call({type:'action',action:'zoomIn'});assert.equal(zoom,3);await call({type:'action',action:'resetZoom'});assert.equal(zoom,1);
await call({type:'action',action:'next'});assert.equal(active,5);
active=99;assert.equal((await call({type:'frame'})).ok,false);
assert.equal((await call({type:'action'}, {id:'test',url:'https://example.org'})).ok,false);
// Execute the real page script, then deliver frame and loss messages.
let pageListener;const children=[];const element=()=>({style:{},append(e){children.push(e)},attachShadow(){return {append:e=>children.push(e)}},addEventListener(){}});
const page={documentElement:{append(e){children.push(e)},classList:{toggle(){}}},body:{},createElement:element,getElementById:()=>null,elementFromPoint:()=>null,addEventListener(){}};
vm.runInNewContext(fs.readFileSync('content.js','utf8'),{chrome:{runtime:{id:'test',onMessage:{addListener:f=>pageListener=f}}},document:page,window:{addEventListener(){}},innerWidth:1000,innerHeight:800,performance:{now:()=>100},setTimeout:()=>1,clearTimeout(){}});
const cursor=children.find(e=>String(e.style.cssText).includes('width:60px'));
pageListener({type:'frame',hand:{x:.5,y:.5,pinched:false},pointer:true,smooth:.24},{id:'test'},()=>{});assert.equal(cursor.style.display,'block');assert.equal(cursor.style.left,'499.5px');
pageListener({type:'frame',hand:null},{id:'test'},()=>{});assert.equal(cursor.style.display,'none');
pageListener({type:'frame',hand:{x:.7,y:.3},pointer:true},{id:'test'},()=>{});assert.equal(cursor.style.display,'block');
pageListener({type:'hide'},{id:'test'},()=>{});assert.equal(cursor.style.display,'none');
console.log('PASS: syntax, side panel, bundled assets, active-tab switching/injection, zoom bounds, restricted pages, sender validation, pointer render/loss/recovery/stop.');
})().catch(e=>{console.error(e);process.exitCode=1});

