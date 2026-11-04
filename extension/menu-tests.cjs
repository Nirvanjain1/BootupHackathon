const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');process.chdir(__dirname);
const nodes=[],sent=[];let tick;
function element(){const e={children:[],style:{},hidden:false,textContent:'',classList:{add(){},remove(){}},setAttribute(k,v){this[k]=v},append(...items){this.children.push(...items)},replaceChildren(...items){this.children=[...items]},click(){this.onclick?.()}};nodes.push(e);return e}
const context={document:{createElement:element,documentElement:{append(){}}},chrome:{runtime:{sendMessage:async m=>{sent.push(m);return {ok:true}}}},setInterval:fn=>{tick=fn;return 1},clearInterval(){},window:{addEventListener(){}}};
vm.runInNewContext(fs.readFileSync('page-menu.js','utf8'),context);
const menu=context.HandWaveMenu;assert.equal(menu.open,false);menu.sync({map:{Thumb_Up:'scrollDown'},paused:false,menuOpen:true});assert.equal(menu.open,true);assert.ok(nodes.some(e=>e.textContent==='👍 Thumbs up → Scroll down'));
const pause=nodes.find(e=>e.textContent==='Pause');pause.click();assert.equal(sent.at(-1).command,'pause');assert.equal(sent.at(-1).value,true);
menu.sync({map:{Thumb_Up:'scrollDown'},paused:true});assert.equal(pause.textContent,'Resume');pause.click();assert.equal(sent.at(-1).value,false);
nodes.find(e=>e.textContent==='Scanning: off').click();assert.equal(menu.scanning,true);tick();menu.select();assert.equal(sent.at(-1).command,'action');
menu.toggle(false);assert.equal(menu.scanning,false);assert.equal(menu.open,false);
console.log('PASS: menu open/close, guide reflects saved assignments, pause/resume messages, scanning selection.');
