import type { Speaker } from "./api";

// Synthetic call. The UTR is missing at first, then found after the operator asks.
export const SAMPLE_CALL: { speaker: Speaker; text: string }[] = [
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
