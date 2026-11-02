// OWNER: Nirvan. Air mouse: index fingertip = cursor, pinch (thumb + index) = click.
// Optional dwell click (button at bottom-left): hold the cursor still on a button for DWELL_MS to click it.
// Needs GestureEngine.onLandmarks (gesture-engine.js). Tune the numbers below.
const ZONE={x0:0.2,x1:0.8,y0:0.15,y1:0.75}; // part of the camera view that covers the whole screen
const SMOOTH=0.25;      // 0-1, lower = smoother but laggier
const PINCH_ON=0.30, PINCH_OFF=0.45; // pinch distance / hand size (two values stop flicker)
const DWELL_MS=1200;
let dwell=false;try{dwell=localStorage.getItem("hw_dwell")==="1"}catch(e){}
const cur=document.createElement("div");cur.id="am-cursor";document.body.append(cur);
const panel=document.createElement("div");panel.id="am-panel";
const btn=document.createElement("button");const note=document.createElement("p");
note.textContent="Air mouse: move your index finger. Pinch thumb and index to click.";
panel.append(btn,note);document.body.append(panel);
const label=()=>btn.textContent="Dwell click: "+(dwell?"ON":"OFF");label();
btn.onclick=()=>{dwell=!dwell;try{localStorage.setItem("hw_dwell",dwell?"1":"0")}catch(e){}label()};
const clamp=v=>Math.min(1,Math.max(0,v)),SEL="button,a,select,input,textarea,canvas,.card,[onclick]";
let px=innerWidth/2,py=innerHeight/2,pinched=false,hov=null,dT=null,dStart=0,dDone=false;
function click(x,y){const el=document.elementFromPoint(x,y);if(!el)return;
 const t=el.closest(SEL)||el;t.focus&&t.focus();t.click()}
GestureEngine.onLandmarks(L=>{
 if(!L){cur.style.display="none";return}
 cur.style.display="block";
 const tip=L[8],th=L[4],now=performance.now();
 const nx=clamp(((1-tip.x)-ZONE.x0)/(ZONE.x1-ZONE.x0)),ny=clamp((tip.y-ZONE.y0)/(ZONE.y1-ZONE.y0));
 px+=(nx*innerWidth-px)*SMOOTH;py+=(ny*innerHeight-py)*SMOOTH;
 cur.style.transform="translate("+px+"px,"+py+"px)";
 // hover highlight
 cur.style.pointerEvents="none";
 const under=document.elementFromPoint(px,py),t=under&&under.closest(SEL);
 if(t!==hov){hov&&hov.classList.remove("am-hover");hov=t&&!panel.contains(t)?t:null;hov&&hov.classList.add("am-hover")}
 // pinch click
 const size=Math.hypot(L[0].x-L[9].x,L[0].y-L[9].y)||1,d=Math.hypot(tip.x-th.x,tip.y-th.y)/size;
 if(!pinched&&d<PINCH_ON){pinched=true;cur.classList.add("pinched");click(px,py)}
 else if(pinched&&d>PINCH_OFF){pinched=false;cur.classList.remove("pinched")}
 // dwell click
 let prog=0;
 if(dwell&&t&&!pinched){if(t!==dT){dT=t;dStart=now;dDone=false}
  else if(!dDone){prog=(now-dStart)/DWELL_MS;if(prog>=1){click(px,py);dDone=true;prog=0}}}
 else dT=null;
 cur.style.setProperty("--p",prog);
});
