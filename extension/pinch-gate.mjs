// Deliberate pinch: stable release -> stable close -> one click -> release again.
export class PinchGate {
 constructor(){this.reset()}
 reset(){this.armed=false;this.openSince=null;this.closeSince=null;this.lastTime=null;this.lastClick=-Infinity;this.latched=false}
 update(ratio,now){
  if(!Number.isFinite(ratio)){this.reset();return {click:false,pinched:false}}
  if(this.lastTime!==null&&now-this.lastTime>250)this.reset();this.lastTime=now;
  if(ratio>.55){
   this.closeSince=null;
   if(this.openSince===null)this.openSince=now;
   if(now-this.openSince>=220&&now-this.lastClick>=800){this.armed=true;this.latched=false}
   return {click:false,pinched:false};
  }
  this.openSince=null;
  if(this.latched)return {click:false,pinched:true};
  if(!this.armed)return {click:false,pinched:ratio<.30};
  if(ratio<.28){
   if(this.closeSince===null)this.closeSince=now;
   if(now-this.closeSince>=180){this.armed=false;this.latched=true;this.lastClick=now;return {click:true,pinched:true}}
   return {click:false,pinched:true,progress:Math.min(1,(now-this.closeSince)/180)};
  }
  this.closeSince=null;return {click:false,pinched:false};
 }
}
