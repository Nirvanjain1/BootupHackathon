// OWNER: Nirvan. Shared hand-gesture engine used by every page (reader, games, later the extension).
// Usage: GestureEngine.onGesture(name => ...)   fires once after a gesture is held for holdMs
//        GestureEngine.onFrame((name, heldMs) => ...)   every video frame (name is null if no hand)
//        GestureEngine.onLandmarks(L => ...)   every frame: array of 21 {x,y,z} points (0-1) or null
//        await GestureEngine.start(videoEl, canvasEl)
// Gesture names: Closed_Fist Open_Palm Pointing_Up Thumb_Down Thumb_Up Victory ILoveYou
import {GestureRecognizer,FilesetResolver,DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
const B="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL="https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const fr=[],gc=[],lm=[];let cur=null,since=0,fired=false,seen=0,lastT=-1;
const E=window.GestureEngine={holdMs:600,minScore:0.6,onFrame:f=>fr.push(f),onLandmarks:f=>lm.push(f),onGesture:f=>gc.push(f),
async start(v,c){
 const fs=await FilesetResolver.forVisionTasks(B+"/wasm");
 const gr=await GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:MODEL},runningMode:"VIDEO",numHands:1});
 v.srcObject=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});
 await new Promise(r=>v.onloadeddata=r);c.width=v.videoWidth;c.height=v.videoHeight;
 const ctx=c.getContext("2d"),du=new DrawingUtils(ctx);
 (function loop(){requestAnimationFrame(loop);
  if(v.currentTime===lastT)return;lastT=v.currentTime;
  const now=performance.now(),r=gr.recognizeForVideo(v,now);ctx.clearRect(0,0,c.width,c.height);let g=null;
  lm.forEach(f=>f(r.landmarks.length?r.landmarks[0]:null));
  if(r.landmarks.length){du.drawConnectors(r.landmarks[0],GestureRecognizer.HAND_CONNECTIONS,{color:"#3dd6c3",lineWidth:3});
   du.drawLandmarks(r.landmarks[0],{color:"#ffc233",radius:3});
   const x=r.gestures[0]&&r.gestures[0][0];if(x&&x.score>E.minScore&&x.categoryName!=="None")g=x.categoryName}
  if(g)seen=now;
  if(g!==cur&&!(g===null&&now-seen<250)){cur=g;since=now;fired=false}
  fr.forEach(f=>f(cur,cur?now-since:0));
  if(cur&&!fired&&now-since>E.holdMs){fired=true;gc.forEach(f=>f(cur))}
 })()}};
