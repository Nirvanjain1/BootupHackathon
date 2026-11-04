// One place to add a language: label, speech tag (recognition + read-aloud), greeting parts.
export const LANGS = {
  en: { label: "English", speech: "en-US", g: ["Good morning", "Good afternoon", "Good evening", ". What would you like to do?"] },
  hi: { label: "हिन्दी", speech: "hi-IN", g: ["सुप्रभात", "नमस्ते", "शुभ संध्या", "। आज आप क्या करना चाहेंगे?"] },
  bn: { label: "বাংলা", speech: "bn-IN", g: ["সুপ্রভাত", "নমস্কার", "শুভ সন্ধ্যা", "। আজ আপনি কী করতে চান?"] },
  ta: { label: "தமிழ்", speech: "ta-IN", g: ["காலை வணக்கம்", "வணக்கம்", "மாலை வணக்கம்", ". இன்று என்ன செய்ய விரும்புகிறீர்கள்?"] },
  te: { label: "తెలుగు", speech: "te-IN", g: ["శుభోదయం", "నమస్కారం", "శుభ సాయంత్రం", ". ఈ రోజు మీరు ఏమి చేయాలనుకుంటున్నారు?"] },
  mr: { label: "मराठी", speech: "mr-IN", g: ["सुप्रभात", "नमस्कार", "शुभ संध्याकाळ", "। आज तुम्हाला काय करायचे आहे?"] },
};
export const speechLang = (c) => (LANGS[c] || LANGS.en).speech;
