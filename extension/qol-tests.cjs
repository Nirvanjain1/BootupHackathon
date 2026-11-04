// New panel settings and page-feedback regression checks.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');process.chdir(__dirname);
(async()=>{
const {PinchGate}=await import('./pinch-gate.mjs');const ids=[...fs.readFileSync('controller.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);const els={};
for(const id of ids)els[id]={value:'',checked:false,textContent:'',dataset:{},type:['sound','pointer','dwell'].includes(id)?'checkbox':'text',add(){},append(){},addEventListener(){},setAttribute(k,v){this[k]=String(v)}};
els.pointer.checked=true;els.smooth.value='.24';els.hold.value='700';els.size.value='60';
const writes=[];const saved={size:'48',sound:true,dwell:true,preset:'steady',smooth:'.12',hold:'1100',preview:true,tutorialDone:true};
const context={PinchGate,GestureRecognizer:{},FilesetResolver:{},chrome:{windows:{getCurrent:async()=>({id:1})},storage:{local:{get:async()=>saved,set:o=>writes.push(o)}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})}},document:{getElementById:id=>els[id],createElement:()=>({add(){},append(){}}),querySelectorAll:()=>[]},window:{addEventListener(){}},Option:function(){},MutationObserver:class{observe(){}},queueMicrotask:fn=>fn(),cancelAnimationFrame(){}};
const source=fs.readFileSync('controller.js','utf8').replace(/^import .*;\r?\n/gm,'');
await vm.runInNewContext('(async()=>{'+source+';return {clickMethod,renderState}})()',context);
assert.equal(els.size.value,'48');assert.equal(els.sound.checked,true);assert.equal(els.preview.open,true);assert.equal(els.dwellMode['aria-pressed'],'true');assert.equal(els.practice.textContent,'Practise again');
els.pinchMode.onclick();assert.equal(els.dwell.checked,false);assert.equal(els.pinchMode['aria-pressed'],'true');assert.match(els.methodHint.textContent,/pinch briefly/);
els.preset.value='responsive';els.preset.onchange();assert.equal(+els.smooth.value,.4);assert.equal(+els.hold.value,500);assert.ok(writes.some(w=>w.preset==='responsive'));
assert.equal(els.stateLabel.textContent,'Camera off');console.log('PASS: panel initialisation, saved settings, click-method selection, comfort presets, preview preference and status.');
})().catch(e=>{console.error(e);process.exitCode=1});
