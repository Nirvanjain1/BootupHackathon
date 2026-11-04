const assert=require('node:assert/strict');
(async()=>{
 const {PinchGate}=await import('./pinch-gate.mjs');const p=new PinchGate();let count=0;
 const step=(r,t)=>{const v=p.update(r,t);if(v.click)count++;return v};
 step(.1,0);step(.1,200);assert.equal(count,0,'starting closed must not click');
 step(.8,300);step(.8,520);step(.2,550);step(.8,580);assert.equal(count,0,'brief noisy pinch must not click');
 step(.8,800);step(.2,850);step(.2,950);step(.2,1040);assert.equal(count,1,'steady pinch clicks once');
 for(let t=1100;t<1800;t+=100)step(.2,t);assert.equal(count,1,'held pinch cannot repeat');
 step(.8,1800);step(.8,2020);step(.2,2050);step(.2,2250);assert.equal(count,2,'full release rearms');
 p.reset();step(.2,2300);step(.2,2500);assert.equal(count,2,'hand loss requires fresh release');
 step(.8,2600);step(.8,2820);step(.2,2900);step(.2,3300);assert.equal(count,2,'tracking gaps cannot complete pinch');
 console.log('PASS: closed startup, jitter rejection, deliberate click, no repeat, release rearming, tracking loss and frame gaps');
})().catch(e=>{console.error(e);process.exitCode=1});
