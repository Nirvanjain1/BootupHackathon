export const WORDS_EN =
  "water house green happy school friend mother father table chair light music night phone money apple bread river smile dream world sunny paper pencil market garden window morning family doctor yellow orange purple simple listen speak clear slowly thank please hello today tomorrow coffee butter flower animal summer winter number letter button pocket basket travel ticket train bridge bottle candle circle planet answer change early every great never often quick right small sound still think voice write bright calm".split(
    " ",
  );
export const WORDS_HI =
  "मैं तुम हम आप यह वह है हैं था थी और या लेकिन घर पानी खाना किताब स्कूल दोस्त परिवार काम समय आज कल अच्छा बड़ा छोटा नया पुराना साफ़ बोलो सुनो देखो चलो आओ जाओ पढ़ो लिखो खेलो".split(
    " ",
  );
export const SENT_EN = [
  "Hello, how are you today?",
  "I would like a glass of water please.",
  "Can you help me find the station?",
  "Thank you very much for your help.",
  "Nice to meet you.",
  "Please speak slowly and clearly.",
  "What time does the shop open?",
  "I am learning to speak every day.",
];
export const SENT_HI = [
  "नमस्ते, आप कैसे हैं?",
  "मुझे एक गिलास पानी चाहिए।",
  "क्या आप मेरी मदद कर सकते हैं?",
  "आपकी मदद के लिए बहुत धन्यवाद।",
  "कृपया धीरे और साफ़ बोलिए।",
  "दुकान कितने बजे खुलती है?",
  "मैं रोज़ बोलना सीख रहा हूँ।",
];
export const SPM = {
  en: {
    idle: "Press the button, then say the highlighted word.",
    listening: "Listening… say the highlighted word.",
    quiet:
      "I can't hear much. Try speaking a little louder or closer to the microphone.",
    heard: "I heard",
    nosr: "This browser can't listen for speech yet. Please open HandWave in Chrome or Edge.",
    blocked:
      "The microphone is blocked. Allow it in the address bar and try again. If you opened this as a local file, run it from localhost or https instead.",
    nomic: "I couldn't find a microphone. Please plug one in and try again.",
    net: "Speech recognition needs an internet connection. Please check it and try again.",
    lang: "Your browser can't recognise this language for speech.",
    restart: "The speech service keeps stopping. Please try again in a moment.",
    r0: "No worries. Give it another go.",
    rb: "A new personal best!",
    r9: "Lovely, clear speaking!",
    r6: "Nice work, it's getting clearer!",
    r3: "Good effort. Every try helps.",
    result: "Last sessions",
    acc: "accuracy",
    said: "words said",
  },
  hi: {
    idle: "बटन दबाएँ, फिर चमकता हुआ शब्द बोलें।",
    listening: "सुन रहा हूँ… चमकता हुआ शब्द बोलें।",
    quiet: "आवाज़ कम आ रही है। थोड़ा ज़ोर से या माइक के पास बोलें।",
    heard: "मैंने सुना",
    nosr: "यह ब्राउज़र अभी बोली नहीं सुन सकता। कृपया Chrome या Edge में खोलें।",
    blocked:
      "माइक्रोफ़ोन बंद है। एड्रेस बार में उसे अनुमति दें और फिर कोशिश करें।",
    nomic: "माइक्रोफ़ोन नहीं मिला। कृपया लगाकर फिर कोशिश करें।",
    net: "बोली पहचानने के लिए इंटरनेट चाहिए। कृपया जाँचकर फिर कोशिश करें।",
    lang: "आपका ब्राउज़र इस भाषा की बोली नहीं पहचान सकता।",
    restart: "स्पीच सेवा बार-बार रुक रही है। थोड़ी देर बाद फिर कोशिश करें।",
    r0: "कोई बात नहीं, एक बार फिर कोशिश करें।",
    rb: "नया रिकॉर्ड!",
    r9: "बहुत बढ़िया, साफ़ बोले!",
    r6: "अच्छा काम, और साफ़ हो रहा है!",
    r3: "अच्छी कोशिश, हर बार बेहतर होगा।",
    result: "पिछले सत्र",
    acc: "सटीकता",
    said: "शब्द बोले",
  },
};

// Added languages. Any SPM key missing here falls back to English.
export const WORDS = { en: WORDS_EN, hi: WORDS_HI, bn: [
  "আমি",
  "তুমি",
  "আপনি",
  "এটা",
  "ওটা",
  "বাড়ি",
  "জল",
  "খাবার",
  "বই",
  "স্কুল",
  "বন্ধু",
  "পরিবার",
  "আজ",
  "কাল",
  "ভালো",
  "বড়",
  "ছোট",
  "নতুন"
], ta: [
  "நான்",
  "நீ",
  "நீங்கள்",
  "இது",
  "அது",
  "வீடு",
  "தண்ணீர்",
  "உணவு",
  "புத்தகம்",
  "பள்ளி",
  "நண்பர்",
  "குடும்பம்",
  "இன்று",
  "நாளை",
  "நல்ல",
  "பெரிய",
  "சிறிய",
  "புதிய"
], te: [
  "నేను",
  "నువ్వు",
  "మీరు",
  "ఇది",
  "అది",
  "ఇల్లు",
  "నీరు",
  "భోజనం",
  "పుస్తకం",
  "పాఠశాల",
  "స్నేహితుడు",
  "కుటుంబం",
  "ఈ",
  "రోజు",
  "రేపు",
  "మంచి",
  "పెద్ద",
  "చిన్న",
  "కొత్త"
], mr: [
  "मी",
  "तू",
  "तुम्ही",
  "हे",
  "ते",
  "घर",
  "पाणी",
  "जेवण",
  "पुस्तक",
  "शाळा",
  "मित्र",
  "कुटुंब",
  "आज",
  "उद्या",
  "चांगले",
  "मोठे",
  "लहान",
  "नवीन"
] };
export const SENT = { en: SENT_EN, hi: SENT_HI, bn: [
  "নমস্কার, আপনি কেমন আছেন?",
  "আমাকে এক গ্লাস জল দিন।",
  "আপনার সাহায্যের জন্য অনেক ধন্যবাদ।",
  "দয়া করে ধীরে এবং পরিষ্কার বলুন।"
], ta: [
  "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?",
  "எனக்கு ஒரு கிளாஸ் தண்ணீர் வேண்டும்.",
  "உங்கள் உதவிக்கு மிக்க நன்றி.",
  "தயவுசெய்து மெதுவாகவும் தெளிவாகவும் பேசுங்கள்."
], te: [
  "నమస్కారం, మీరు ఎలా ఉన్నారు?",
  "నాకు ఒక గ్లాసు నీరు కావాలి.",
  "మీ సహాయానికి చాలా ధన్యవాదాలు.",
  "దయచేసి నెమ్మదిగా మరియు స్పష్టంగా మాట్లాడండి."
], mr: [
  "नमस्कार, तुम्ही कसे आहात?",
  "मला एक ग्लास पाणी हवे आहे.",
  "तुमच्या मदतीबद्दल खूप धन्यवाद.",
  "कृपया हळू आणि स्पष्ट बोला."
] };
SPM.bn = {
  "idle": "বোতাম চাপুন, তারপর হাইলাইট করা শব্দটি বলুন।",
  "listening": "শুনছি… হাইলাইট করা শব্দটি বলুন।",
  "heard": "আমি শুনলাম",
  "acc": "নির্ভুলতা",
  "said": "শব্দ বলা হয়েছে"
};
SPM.ta = {
  "idle": "பொத்தானை அழுத்தி, ஒளிரும் சொல்லைச் சொல்லுங்கள்.",
  "listening": "கேட்கிறேன்… ஒளிரும் சொல்லைச் சொல்லுங்கள்.",
  "heard": "நான் கேட்டது",
  "acc": "துல்லியம்",
  "said": "சொன்ன சொற்கள்"
};
SPM.te = {
  "idle": "బటన్ నొక్కి, హైలైట్ చేసిన పదాన్ని చెప్పండి.",
  "listening": "వింటున్నాను… హైలైట్ చేసిన పదాన్ని చెప్పండి.",
  "heard": "నేను విన్నది",
  "acc": "కచ్చితత్వం",
  "said": "చెప్పిన పదాలు"
};
SPM.mr = {
  "idle": "बटण दाबा, मग हायलाइट केलेला शब्द बोला.",
  "listening": "ऐकत आहे… हायलाइट केलेला शब्द बोला.",
  "heard": "मी ऐकले",
  "acc": "अचूकता",
  "said": "बोललेले शब्द"
};
