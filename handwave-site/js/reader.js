// OWNER: Rudra. PDF reader controlled by buttons AND gestures. Edit ACTIONS/SCROLL to remap gestures.
Settings.init();
pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const $=s=>document.querySelector(s);let doc=null,n=1,scale=1.3;
async function render(){if(!doc)return;const p=await doc.getPage(n),vp=p.getViewport({scale}),c=$("#pdf");
 c.width=vp.width;c.height=vp.height;await p.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;
 $("#info").textContent=n+" / "+doc.numPages}
const go=d=>{if(doc&&n+d>=1&&n+d<=doc.numPages){n+=d;$("#view").scrollTop=0;render()}};
const zoom=d=>{scale=Math.min(3,Math.max(0.6,scale+d));render()};
async function read(){if(speechSynthesis.speaking){speechSynthesis.cancel();return}if(!doc)return;
 const tc=await (await doc.getPage(n)).getTextContent(),u=new SpeechSynthesisUtterance(tc.items.map(i=>i.str).join(" "));
 u.lang=Settings.lang==="hi"?"hi-IN":"en-US";speechSynthesis.speak(u)}
$("#open").onclick=()=>$("#file").click();
$("#file").onchange=async e=>{const f=e.target.files[0];if(!f)return;
 doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;n=1;render()};
$("#prev").onclick=()=>go(-1);$("#next").onclick=()=>go(1);
$("#zin").onclick=()=>zoom(0.2);$("#zout").onclick=()=>zoom(-0.2);$("#read").onclick=read;
// gesture -> action (fires once after the hold time)
const ACTIONS={Victory:()=>go(1),Pointing_Up:()=>go(-1),Open_Palm:()=>zoom(0.2),Closed_Fist:()=>zoom(-0.2),ILoveYou:read};
// gesture -> scroll speed in px per frame while held
const SCROLL={Thumb_Up:-12,Thumb_Down:12};
GestureEngine.onGesture(g=>ACTIONS[g]&&ACTIONS[g]());
GestureEngine.onFrame((g,held)=>{$("#gesture").textContent=g?g.replace("_"," "):"-";
 if(SCROLL[g]&&held>150)$("#view").scrollTop+=SCROLL[g]});
$("#camBtn").onclick=async e=>{e.target.disabled=true;
 try{await GestureEngine.start($("#v"),$("#c"))}catch(err){alert("Camera or model failed: "+err.message);e.target.disabled=false}};
