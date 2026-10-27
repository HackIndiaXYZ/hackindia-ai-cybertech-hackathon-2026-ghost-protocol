import type { Speaker } from "./api";

export interface Scenario {
  id: string;
  title: string;
  language: string;
  scamType: string;
  badgeColor: string;
  loss: string;
  time: string;
  calls: { speaker: Speaker; text: string }[];
}

export const SCENARIO_OLX: { speaker: Speaker; text: string }[] = [
  { speaker: "Operator", text: "Namaste, 1930 cyber crime helpline. Aapka naam bataiye." },
  { speaker: "Victim", text: "Sir mera naam Rakesh Verma hai. Mere saath fraud ho gaya, please jaldi madad karo." },
  { speaker: "Operator", text: "Shaant rahiye, poori baat bataiye." },
  { speaker: "Victim", text: "Maine OLX pe sofa becha tha. Ek aadmi ne bola advance bhej raha hoon, usne mujhe link bheja aur bola PIN daalo tab paise aayenge." },
  { speaker: "Operator", text: "Phir kya hua?" },
  { speaker: "Victim", text: "Maine PIN daala aur mere account se 48 hazaar kat gaye. Ye abhi 20 minute pehle hua." },
  { speaker: "Operator", text: "Aapka bank kaunsa hai aur payment kaise gaya?" },
  { speaker: "Victim", text: "SBI hai sir, UPI se gaya. Account ke last chaar digit 4821 hain." },
  { speaker: "Operator", text: "Jisko paise gaye, uski koi detail hai?" },
  { speaker: "Victim", text: "Uska UPI ID buyer.sofa42@okaxis tha aur phone number 9000011111." },
  { speaker: "Operator", text: "Transaction ID ya UTR number mil sakta hai?" },
  { speaker: "Victim", text: "Sir woh mujhe abhi nahi mil raha, app mein dhundhna padega." },
  { speaker: "Operator", text: "Payment app kholiye, transaction details mein 12 digit ka UTR hota hai." },
  { speaker: "Victim", text: "Haan mil gaya sir. UTR number hai 508812345678." },
];

export const SCENARIO_DIGITAL_ARREST: { speaker: Speaker; text: string }[] = [
  { speaker: "Operator", text: "1930 cyber crime helpline, how can I help you?" },
  { speaker: "Victim", text: "Hello, my name is Meera Iyer. I have been cheated of two and a half lakh rupees. Please help me." },
  { speaker: "Operator", text: "Please stay calm. Tell me what happened." },
  { speaker: "Victim", text: "Yesterday around 7 in the evening I got a video call. The man said he was from the CBI and a parcel in my name had drugs in it. He kept me on the call and said I was under digital arrest." },
  { speaker: "Operator", text: "And the money?" },
  { speaker: "Victim", text: "He forced me to transfer 2.5 lakh rupees through net banking from my ICICI Bank account." },
  { speaker: "Operator", text: "Do you know where the money went?" },
  { speaker: "Victim", text: "The account number he gave was 50100098765432 in HDFC Bank." },
  { speaker: "Operator", text: "Do you have the transaction reference?" },
  { speaker: "Victim", text: "Yes, the UTR is 412398765432. My mobile number is 9000022222." },
  { speaker: "Operator", text: "Do you have any proof?" },
  { speaker: "Victim", text: "I have screenshots of the video call and the bank SMS." },
];

export const SCENARIO_FAKE_JOB: { speaker: Speaker; text: string }[] = [
  { speaker: "Operator", text: "नमस्ते, 1930 साइबर क्राइम हेल्पलाइन। आपका नाम बताइए?" },
  { speaker: "Victim", text: "मेरा नाम सुनीता देवी है। मेरे साथ ठगी हो गई है।" },
  { speaker: "Operator", text: "घबराइए मत, पूरी बात बताइए।" },
  { speaker: "Victim", text: "टेलीग्राम पर पार्ट टाइम जॉब का मैसेज आया था। उन्होंने रजिस्ट्रेशन फीस के नाम पर पैसे मंगवाए।" },
  { speaker: "Operator", text: "कितने पैसे गए और कब?" },
  { speaker: "Victim", text: "पंद्रह हज़ार रुपये गए, लगभग दो घंटे पहले।" },
  { speaker: "Operator", text: "पेमेंट कैसे किया और आपका बैंक कौन सा है?" },
  { speaker: "Victim", text: "यूपीआई से किया, मेरा बैंक पंजाब नेशनल बैंक है।" },
  { speaker: "Operator", text: "जिसे पैसे भेजे उसकी कोई जानकारी है?" },
  { speaker: "Victim", text: "उसका यूपीआई आईडी jobhelp.hr@ybl था।" },
  { speaker: "Operator", text: "ट्रांजैक्शन आईडी या यूटीआर नंबर बता सकती हैं?" },
  { speaker: "Victim", text: "हाँ, यूटीआर 308712345678 है।" },
  { speaker: "Operator", text: "आपका मोबाइल नंबर?" },
  { speaker: "Victim", text: "9000033333" },
];

export const SCENARIOS: Scenario[] = [
  {
    id: "olx",
    title: "OLX UPI Advance Fraud",
    language: "Hinglish",
    scamType: "UPI Refund Scam",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    loss: "₹48,000",
    time: "20 min ago (Golden Hour Active)",
    calls: SCENARIO_OLX,
  },
  {
    id: "digital_arrest",
    title: "Digital Arrest CBI Impersonation",
    language: "English",
    scamType: "Digital Arrest",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    loss: "₹2,50,000",
    time: "Yesterday (High Priority)",
    calls: SCENARIO_DIGITAL_ARREST,
  },
  {
    id: "fake_job",
    title: "Telegram Part-Time Job Scam",
    language: "Hindi (हिन्दी)",
    scamType: "Fake Job / Task Scam",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    loss: "₹15,000",
    time: "2 hours ago",
    calls: SCENARIO_FAKE_JOB,
  },
];

export const SAMPLE_CALL = SCENARIO_OLX;
