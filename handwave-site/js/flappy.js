// OWNER: Dashrath. Flappy-bird style game. Open your palm (after a fist) to flap. Space/click also work.
// Easy-mode numbers are at the top: change GAP, SPEED, GRAVITY, FLAP to tune difficulty.
Settings.init();
const GAP=170,SPEED=2,GRAVITY=0.35,FLAP=-6.2;
const $=s=>document.querySelector(s),cv=$("#game"),x=cv.getContext("2d"),W=cv.width,H=cv.height;
let bird,pipes,score,t,state="idle";
function reset(){bird={y:H/2,v:0};pipes=[];score=0;t=0;state="play";$("#score").textContent=0}
function flap(){if(state!=="play")reset();bird.v=FLAP}
function over(){state="over"}
function step(){if(state!=="play")return;
 bird.v+=GRAVITY;bird.y+=bird.v;t++;
 if(t%110===1)pipes.push({x:W,top:60+Math.random()*(H-120-GAP),s:0});
 pipes.forEach(p=>{p.x-=SPEED;
  if(!p.s&&p.x+60<80){p.s=1;score++;$("#score").textContent=score}
  if(94>p.x&&66<p.x+60&&(bird.y-14<p.top||bird.y+14>p.top+GAP))over()});
 pipes=pipes.filter(p=>p.x>-70);
 if(bird.y<0||bird.y>H)over()}
function draw(){x.fillStyle="#101820";x.fillRect(0,0,W,H);
 x.fillStyle="#3dd6c3";pipes&&pipes.forEach(p=>{x.fillRect(p.x,0,60,p.top);x.fillRect(p.x,p.top+GAP,60,H)});
 if(bird){x.fillStyle="#ffc233";x.beginPath();x.arc(80,bird.y,14,0,7);x.fill()}
 x.fillStyle="#f2f5f7";x.font="20px sans-serif";x.textAlign="center";
 if(state!=="play")x.fillText(Settings.t("start"),W/2,H/2,W-40)}
(function loop(){requestAnimationFrame(loop);step();draw()})();
addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();flap()}});
cv.onclick=flap;
let prev=null;
GestureEngine.onFrame(g=>{$("#gesture").textContent=g?g.replace("_"," "):"-";
 if(g==="Open_Palm"&&prev!=="Open_Palm")flap();prev=g});
$("#camBtn").onclick=async e=>{e.target.disabled=true;
 try{await GestureEngine.start($("#v"),$("#c"))}catch(err){alert("Camera or model failed: "+err.message);e.target.disabled=false}};
