// OWNER: Vedant. Language, contrast and text size; injects the top accessibility bar on every page.
// To add text: add a key to BOTH languages below, then use <span data-i18n="key"></span> in HTML.
const T={en:{title:"HandWave",tag:"Use your hands to read and play. No mouse needed.",reader:"Document reader",readerD:"Open a PDF and control it with gestures.",games:"Gesture games",gamesD:"Play simple games with hand gestures.",upload:"Open a PDF",next:"Next page",prev:"Previous page",zoomIn:"Zoom in",zoomOut:"Zoom out",readAloud:"Read aloud",cam:"Start camera",contrast:"High contrast",home:"Home",start:"Open your palm to flap. Press Space or tap to start.",score:"Score",guide:"Gestures: peace sign = next, pointing up = previous, thumbs up/down = scroll, open palm = zoom in, fist = zoom out, I-love-you = read aloud."},
hi:{title:"हैंडवेव",tag:"हाथों के इशारों से पढ़ें और खेलें। माउस की ज़रूरत नहीं।",reader:"दस्तावेज़ रीडर",readerD:"PDF खोलें और इशारों से चलाएँ।",games:"इशारों वाले खेल",gamesD:"हाथ के इशारों से सरल खेल खेलें।",upload:"PDF खोलें",next:"अगला पेज",prev:"पिछला पेज",zoomIn:"बड़ा करें",zoomOut:"छोटा करें",readAloud:"पढ़कर सुनाएँ",cam:"कैमरा शुरू करें",contrast:"ज़्यादा कंट्रास्ट",home:"होम",start:"उड़ने के लिए हथेली खोलें। शुरू करने के लिए Space दबाएँ या टैप करें।",score:"स्कोर",guide:"इशारे: पीस साइन = अगला, ऊपर उँगली = पिछला, अंगूठा ऊपर/नीचे = स्क्रॉल, खुली हथेली = बड़ा, मुट्ठी = छोटा, आई-लव-यू = पढ़कर सुनाएँ।"}};
let S={lang:"en",hc:false,fs:18};
try{S={...S,...JSON.parse(localStorage.getItem("hw_set"))}}catch(e){}
const save=()=>{try{localStorage.setItem("hw_set",JSON.stringify(S))}catch(e){}};
const t=k=>(T[S.lang]&&T[S.lang][k])||T.en[k]||k;
function apply(){document.documentElement.lang=S.lang;document.body.classList.toggle("hc",S.hc);
 document.documentElement.style.setProperty("--fs",S.fs+"px");
 document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n))}
window.Settings={t,get lang(){return S.lang},
init(){const bar=document.createElement("div");bar.id="a11y-bar";
 const add=(tag,fn,key,txt,label)=>{const e=document.createElement(tag);if(key)e.dataset.i18n=key;if(txt)e.textContent=txt;if(label)e.setAttribute("aria-label",label);if(fn)e.onclick=fn;bar.append(e);return e};
 if(!document.body.dataset.home){const a=add("a",null,"home");a.href="index.html";a.className="btn"}
 const s=add("select");s.setAttribute("aria-label","Language");[["en","English"],["hi","हिन्दी"]].forEach(([v,l])=>s.add(new Option(l,v)));
 s.value=S.lang;s.onchange=()=>{S.lang=s.value;save();apply()};
 add("button",()=>{S.hc=!S.hc;save();apply()},"contrast");
 add("button",()=>{S.fs=Math.max(14,S.fs-3);save();apply()},null,"A−","Smaller text");
 add("button",()=>{S.fs=Math.min(36,S.fs+3);save();apply()},null,"A+","Larger text");
 document.body.prepend(bar);apply()}};
