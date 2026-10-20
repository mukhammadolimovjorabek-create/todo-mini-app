export interface GrammarQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  category: string;
  level: 'A2' | 'B1' | 'B2' | 'C1';
  explanation: string;
}

export interface PlacementResultSummary {
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  ieltsBand: number;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  multilevelScore: number; // out of 75
  descriptionUz: string;
  recommendationUz: string;
}

export function calculatePlacementResult(correctCount: number, total: number = 50): PlacementResultSummary {
  const ratio = total > 0 ? correctCount / total : 0;
  const percentage = Math.round(ratio * 100);

  let ieltsBand = 4.0;
  let cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' = 'A2';
  let multilevelScore = 30;
  let descriptionUz = '';
  let recommendationUz = '';

  if (correctCount >= 46) {
    ieltsBand = 8.0;
    cefrLevel = 'C1';
    multilevelScore = Math.min(75, 68 + Math.round((correctCount - 46) * 1.75));
    descriptionUz = "C1 (Advanced) — Grammatikangiz juda yuqori va akademik darajada! Murakkab tuzilmalar, inversiya va modal fe'llarni mukammal bilasiz.";
    recommendationUz = "IELTS 7.5–8.0+ yoki Multilevel C1 sertifikati uchun Writing va Speaking bo'limlarida ko'proq amaliyot qiling.";
  } else if (correctCount >= 42) {
    ieltsBand = 7.5;
    cefrLevel = 'C1';
    multilevelScore = 65 + Math.round((correctCount - 42) * 0.75);
    descriptionUz = "C1 (Effective Operational Proficiency) — Murakkab grammatik qoidalarni juda yaxshi o'zlashtirgansiz.";
    recommendationUz = "IELTS Writing Task 1/2 va Multilevel Essay mashqlarida C1 darajadagi bog'lovchilar hamda inversiyalarni faol qo'llang.";
  } else if (correctCount >= 37) {
    ieltsBand = 6.5;
    cefrLevel = 'B2';
    multilevelScore = 56 + Math.round((correctCount - 37) * 1.6);
    descriptionUz = "B2 (Upper-Intermediate) — Mustahkam grammatik baza! Asosiy va murakkab zamonlar, Conditionals hamda Passive Voice mavzularini yaxshi bilasiz.";
    recommendationUz = "C1 darajaga chiqish uchun Mixed Conditionals, Participle Clauses va Inversion mavzularini mustahkamlang.";
  } else if (correctCount >= 32) {
    ieltsBand = 6.0;
    cefrLevel = 'B2';
    multilevelScore = 51 + Math.round((correctCount - 32) * 1.0);
    descriptionUz = "B2 (Vantage) — Yaxshi o'rta-yuqori daraja. Ko'pchilik grammatik tuzilmalarni to'g'ri qo'llay olasiz.";
    recommendationUz = "Relative Clauses, Reported Speech va murakkab predloglar ustida ko'proq ishlang.";
  } else if (correctCount >= 25) {
    ieltsBand = 5.5;
    cefrLevel = 'B1';
    multilevelScore = 43 + Math.round((correctCount - 25) * 1.1);
    descriptionUz = "B1 (Intermediate) — O'rta daraja. Kundalik va asosiy akademik grammatik qoidalarni tushunasiz, biroq murakkab tuzilmalarda xatolar bor.";
    recommendationUz = "Perfect zamonlar, Passive Voice, 2-chi va 3-chi turdagi shart ergash gaplarni (Conditionals) qayta takrorlang.";
  } else if (correctCount >= 18) {
    ieltsBand = 5.0;
    cefrLevel = 'B1';
    multilevelScore = 38 + Math.round((correctCount - 18) * 0.7);
    descriptionUz = "B1 (Threshold) — Boshlang'ich B1 daraja. Asosiy zamonlarni bilasiz, lekin murakkab gap qurilishlarida qiynalasiz.";
    recommendationUz = "Present Perfect vs Past Simple, Modal fe'llar hamda Gerund/Infinitive qoidalarini mustahkamlang.";
  } else if (correctCount >= 11) {
    ieltsBand = 4.5;
    cefrLevel = 'A2';
    multilevelScore = 30 + Math.round((correctCount - 11) * 1.0);
    descriptionUz = "A2 (Elementary / Pre-Intermediate) — Tayanch grammatik bilimlar mavjud, ammo zamonlar va gap tuzilishida ko'p xatolar kuzatildi.";
    recommendationUz = "Asosiy zamonlar (Present/Past/Future Simple & Continuous), artikllar va sifat darajalaridan boshlab tizimli shug'ullaning.";
  } else {
    ieltsBand = 4.0;
    cefrLevel = 'A1';
    multilevelScore = Math.max(15, Math.round(correctCount * 2.5));
    descriptionUz = "A1–A2 (Beginner / Elementary) — Grammatik bazani boshidan mustahkamlash talab etiladi.";
    recommendationUz = "Eng asosiy grammatik qoidalar (To be, Present Simple, olmoshlar va oddiy gap tuzilishi) ustida har kuni mashq qiling.";
  }

  return {
    correctCount,
    totalQuestions: total,
    percentage,
    ieltsBand,
    cefrLevel,
    multilevelScore,
    descriptionUz,
    recommendationUz,
  };
}

export const GRAMMAR_PLACEMENT_QUESTIONS: GrammarQuestion[] = [
  // 1-10: A2 - B1 Core Tenses, Articles, Quantifiers, Comparatives
  {
    id: 1,
    question: "She usually _______ to university by bus, but today she _______ her father's car.",
    options: [
      "goes / is driving",
      "is going / drives",
      "go / drove",
      "has gone / is driving"
    ],
    correctIndex: 0,
    category: "Present Tenses",
    level: "A2",
    explanation: "Doimiy odatlar uchun Present Simple ('goes'), ayni damda (today) sodir bo'layotgan vaqtinchalik harakat uchun Present Continuous ('is driving') ishlatiladi."
  },
  {
    id: 2,
    question: "While we _______ for the train last night, it suddenly _______ to pour with rain.",
    options: [
      "waited / was starting",
      "were waiting / started",
      "had waited / started",
      "are waiting / starts"
    ],
    correctIndex: 1,
    category: "Past Tenses",
    level: "A2",
    explanation: "O'tgan zamonda davom etayotgan jarayon ('were waiting') va uni to'satdan bo'lgan qisqa harakat ('started') Past Continuous + Past Simple bilan ifodalanadi."
  },
  {
    id: 3,
    question: "I _______ my keys anywhere. Have you seen them since you _______ home?",
    options: [
      "didn't find / come",
      "haven't found / came",
      "can't find / came",
      "wasn't finding / have come"
    ],
    correctIndex: 2,
    category: "Present Perfect & Past Simple",
    level: "B1",
    explanation: "'since' bog'lovchisidan keyin aniq tugallangan nuqta sifatida Past Simple ('came') keladi."
  },
  {
    id: 4,
    question: "There isn't _______ traffic on the main road this morning, so we have _______ time before the flight.",
    options: [
      "many / a few",
      "much / plenty of",
      "a lot / many",
      "few / little"
    ],
    correctIndex: 1,
    category: "Quantifiers",
    level: "A2",
    explanation: "'traffic' sanalmaydigan ot bo'lgani uchun inkor gapda 'much' oladi; 'plenty of' esa sanaladigan va sanalmaydigan otlar bilan 'yetarlicha ko'p' ma'nosida keladi."
  },
  {
    id: 5,
    question: "_______ Mount Everest is the highest peak in _______ Himalayas.",
    options: [
      "The / the",
      "— / the",
      "— / —",
      "The / —"
    ],
    correctIndex: 1,
    category: "Articles",
    level: "B1",
    explanation: "Yakka cho'qqilar (Mount Everest) oldidan artikl qo'yilmaydi, tog' tizmalari (the Himalayas) oldidan esa 'the' aniq artikli ishlatiladi."
  },
  {
    id: 6,
    question: "The more carefully you plan your essay, _______ mistakes you are likely to make.",
    options: [
      "the fewer",
      "the less",
      "fewer",
      "the least"
    ],
    correctIndex: 0,
    category: "Comparatives",
    level: "B1",
    explanation: "'The + comparative ..., the + comparative ...' konstruksiyasi. 'mistakes' ko'plikdagi sanaladigan ot bo'lgani uchun 'the fewer' to'g'ri."
  },
  {
    id: 7,
    question: "How long _______ your best friend before you both moved to Tashkent?",
    options: [
      "have you known",
      "had you been knowing",
      "had you known",
      "did you knew"
    ],
    correctIndex: 2,
    category: "Past Perfect",
    level: "B1",
    explanation: "O'tgan zamondagi bir harakatdan ('moved') oldin boshlangan holat uchun Past Perfect ('had you known') ishlatiladi. 'know' — state verb bo'lgani uchun Continuous shaklini olmaydi."
  },
  {
    id: 8,
    question: "Look at those dark clouds! It _______ heavily in a few minutes.",
    options: [
      "will raining",
      "is going to rain",
      "rains",
      "shall rain"
    ],
    correctIndex: 1,
    category: "Future Forms",
    level: "A2",
    explanation: "Ko'zga ko'rinib turgan aniq belgi/dalil (dark clouds) asosida qilingan bashorat uchun 'be going to' ishlatiladi."
  },
  {
    id: 9,
    question: "Neither of the candidates _______ suitable for the senior management position.",
    options: [
      "were",
      "are",
      "was",
      "have been"
    ],
    correctIndex: 2,
    category: "Subject-Verb Agreement",
    level: "B1",
    explanation: "'Neither of + plural noun' rasmiy grammatikada birlikdagi fe'l ('was') bilan moslashadi."
  },
  {
    id: 10,
    question: "By the end of next year, the government _______ three new metro stations in the district.",
    options: [
      "will build",
      "will be building",
      "will have built",
      "has built"
    ],
    correctIndex: 2,
    category: "Future Perfect",
    level: "B1",
    explanation: "'By + kelasi vaqt' kelajakdagi ma'lum muddatgacha tugallangan bo'ladigan ish-harakatni (Future Perfect: 'will have built') bildiradi."
  },

  // 11-22: B1 - B2 Conditionals, Passive Voice, Modals, Gerund/Infinitive
  {
    id: 11,
    question: "If I _______ more free time these days, I _______ up a new foreign language.",
    options: [
      "have / would take",
      "had / would take",
      "had had / would have taken",
      "would have / took"
    ],
    correctIndex: 1,
    category: "Conditionals (2nd)",
    level: "B1",
    explanation: "Hozirgi zamondagi noreal/faraziy holat ('these days') Second Conditional (If + Past Simple, would + V1) orqali ifodalanadi."
  },
  {
    id: 12,
    question: "All passengers _______ to fasten their seatbelts while the aircraft is taking off.",
    options: [
      "require",
      "are requiring",
      "are required",
      "have required"
    ],
    correctIndex: 2,
    category: "Passive Voice",
    level: "B1",
    explanation: "Yo'lovchilardan kamarni taqish talab qilinadi — majhul nisbat (Present Simple Passive: 'are required')."
  },
  {
    id: 13,
    question: "You _______ have bought so much food; we already had plenty in the refrigerator.",
    options: [
      "mustn't",
      "needn't",
      "can't",
      "couldn't"
    ],
    correctIndex: 1,
    category: "Modal Verbs",
    level: "B2",
    explanation: "'needn't have + V3' — o'tgan zamonda qilish shart bo'lmagan, ammo qilib qo'yilgan harakatni bildiradi."
  },
  {
    id: 14,
    question: "The suspect denied _______ anywhere near the bank on the night of the robbery.",
    options: [
      "to be",
      "being",
      "that he be",
      "to have been"
    ],
    correctIndex: 1,
    category: "Gerund & Infinitive",
    level: "B1",
    explanation: "'deny' fe'lidan keyin Gerund (V-ing: 'being') ishlatiladi."
  },
  {
    id: 15,
    question: "I clearly remember _______ the front door before leaving, so nobody could have walked in.",
    options: [
      "to lock",
      "locking",
      "lock",
      "to have locked"
    ],
    correctIndex: 1,
    category: "Gerund & Infinitive",
    level: "B2",
    explanation: "'remember + V-ing' o'tmishda bajarilgan ishni eslashni bildiradi ('remember + to V' esa qilish kerak bo'lgan vazifani eslash)."
  },
  {
    id: 16,
    question: "The ancient manuscript is believed _______ by monks in the twelfth century.",
    options: [
      "to write",
      "to be writing",
      "to have been written",
      "having written"
    ],
    correctIndex: 2,
    category: "Complex Passive",
    level: "B2",
    explanation: "O'tmishda va majhul nisbatda sodir bo'lgan harakat uchun Perfect Passive Infinitive ('to have been written') qo'llaniladi."
  },
  {
    id: 17,
    question: "If she hadn't missed the morning flight, she _______ the conference in Berlin right now.",
    options: [
      "would attend",
      "would be attending",
      "would have attended",
      "will be attending"
    ],
    correctIndex: 1,
    category: "Mixed Conditionals",
    level: "B2",
    explanation: "Mixed Conditional (3 -> 2): O'tmishdagi shart (If + Past Perfect) va hozirgi zamondagi natija ('right now' -> would be + V-ing)."
  },
  {
    id: 18,
    question: "His jacket is still on the chair, so he _______ the office yet.",
    options: [
      "mustn't have left",
      "can't have left",
      "shouldn't leave",
      "may not leave"
    ],
    correctIndex: 1,
    category: "Modals of Deduction",
    level: "B2",
    explanation: "O'tmishga oid kuchli inkor taxmin ('ketgan bo'lishi mumkin emas') 'can't have + V3' bilan yasaladi."
  },
  {
    id: 19,
    question: "We had our roof _______ last autumn because it had been leaking during heavy storms.",
    options: [
      "repair",
      "repairing",
      "repaired",
      "to repair"
    ],
    correctIndex: 2,
    category: "Causative Form",
    level: "B1",
    explanation: "Birovga biror ishni bajartirish — Causative ('have something done' -> 'had our roof repaired')."
  },
  {
    id: 20,
    question: "I would rather you _______ anyone about my job application until the results are official.",
    options: [
      "don't tell",
      "won't tell",
      "didn't tell",
      "not to tell"
    ],
    correctIndex: 2,
    category: "Would Rather",
    level: "B2",
    explanation: "'would rather + somebody + Past Simple' hozirgi yoki kelasi zamonga oid istakni ifodalaydi ('didn't tell')."
  },
  {
    id: 21,
    question: "It's high time the local authorities _______ stricter measures against air pollution.",
    options: [
      "take",
      "took",
      "will take",
      "have taken"
    ],
    correctIndex: 1,
    category: "Subjunctive / It's time",
    level: "B2",
    explanation: "'It's (high/about) time + ega + Past Simple' — biror ishni qilish vaqti allaqachon kelganini bildiradi."
  },
  {
    id: 22,
    question: "She was made _______ the entire report again because the data was inaccurate.",
    options: [
      "write",
      "to write",
      "writing",
      "written"
    ],
    correctIndex: 1,
    category: "Passive & Make",
    level: "B2",
    explanation: "Aniq nisbatda 'make somebody do' bo'lsa ham, majhul nisbatda ('be made to do') 'to' yuklamasi qaytib keladi."
  },

  // 23-35: B2 Relative Clauses, Reported Speech, Conjunctions, Prepositions, Wishes
  {
    id: 23,
    question: "The professor _______ lectures I attended last semester has just published a new book.",
    options: [
      "who",
      "whom",
      "whose",
      "which"
    ],
    correctIndex: 2,
    category: "Relative Clauses",
    level: "B1",
    explanation: "Qaratqich kelishigi ('uning ma'ruzalari' -> 'whose lectures') uchun 'whose' nisbiy olmoshi ishlatiladi."
  },
  {
    id: 24,
    question: "The company hired twenty new engineers, most of _______ graduated from technical universities abroad.",
    options: [
      "who",
      "whom",
      "them",
      "which"
    ],
    correctIndex: 1,
    category: "Relative Clauses",
    level: "B2",
    explanation: "Predlogdan ('of') keyin shaxslarga nisbatan ergash gapda 'whom' ('most of whom') qo'llaniladi."
  },
  {
    id: 25,
    question: "The interviewer asked me where I _______ working the previous year.",
    options: [
      "was",
      "have been",
      "had been",
      "would be"
    ],
    correctIndex: 2,
    category: "Reported Speech",
    level: "B2",
    explanation: "O'zlashtirma gapda 'the previous year' bo'lgani uchun Past Continuous/Simple bir pog'ona orqaga surilib Past Perfect Continuous ('had been working') bo'ladi."
  },
  {
    id: 26,
    question: "My doctor strongly advised me _______ down on caffeine and get more sleep.",
    options: [
      "cutting",
      "to cut",
      "cut",
      "that I cutting"
    ],
    correctIndex: 1,
    category: "Reported Speech Verbs",
    level: "B1",
    explanation: "'advise + object + to-infinitive' ('advised me to cut'). Agar to'ldiruvchi bo'lmasa 'advise + V-ing' bo'lardi."
  },
  {
    id: 27,
    question: "_______ having extensive experience in marketing, she wasn't offered the position.",
    options: [
      "Although",
      "Even though",
      "Despite",
      "However"
    ],
    correctIndex: 2,
    category: "Conjunctions & Linkers",
    level: "B1",
    explanation: "Gerund ('having...') yoki otdan oldin 'Despite' (yoki 'In spite of') keladi. 'Although/Even though' esa ega va kesimli to'liq gap talab qiladi."
  },
  {
    id: 28,
    question: "We decided to take a map with us _______ we lost our mobile signal in the mountains.",
    options: [
      "unless",
      "in case",
      "provided that",
      "so that"
    ],
    correctIndex: 1,
    category: "Conjunctions",
    level: "B2",
    explanation: "'in case' — ehtiyot chorasi sifatida ('mabodo signal yo'qolib qolsa deb') ma'nosida ishlatiladi."
  },
  {
    id: 29,
    question: "I really wish I _______ to my parents' advice when I was choosing my career path.",
    options: [
      "listened",
      "would listen",
      "had listened",
      "have listened"
    ],
    correctIndex: 2,
    category: "Wishes & Regrets",
    level: "B2",
    explanation: "O'tgan zamonga oid afsuslanish ('when I was choosing...') 'wish + Past Perfect' ('had listened') bilan ifodalanadi."
  },
  {
    id: 30,
    question: "The new software is not only much faster _______ significantly more secure than the old version.",
    options: [
      "and also",
      "but also",
      "as well as",
      "or else"
    ],
    correctIndex: 1,
    category: "Correlative Conjunctions",
    level: "B1",
    explanation: "'not only ... but also ...' juft bog'lovchisi."
  },
  {
    id: 31,
    question: "Our team succeeded _______ completing the research project two weeks ahead of schedule.",
    options: [
      "on",
      "at",
      "in",
      "for"
    ],
    correctIndex: 2,
    category: "Dependent Prepositions",
    level: "B1",
    explanation: "'succeed in + V-ing' — biror ishni muvaffaqiyatli amalga oshirish."
  },
  {
    id: 32,
    question: "When I first moved to London, it took me several months to _______ on the left side of the road.",
    options: [
      "used to drive",
      "get used to drive",
      "get used to driving",
      "be used to drive"
    ],
    correctIndex: 2,
    category: "Used to / Be used to",
    level: "B2",
    explanation: "'get used to + V-ing' — yangi holatga ko'nikish/o'rganish jarayoni ('to' bu yerda predlog bo'lgani uchun Gerund keladi)."
  },
  {
    id: 33,
    question: "Not only the students but also their teacher _______ excited about the upcoming science exhibition.",
    options: [
      "are",
      "were",
      "is",
      "have been"
    ],
    correctIndex: 2,
    category: "Subject-Verb Agreement",
    level: "B2",
    explanation: "'Not only A but also B' konstruksiyasida kesim o'ziga yaqin turgan egaga ('their teacher' — birlik) moslashadi: 'is'."
  },
  {
    id: 34,
    question: "_______ of the two proposals seemed financially viable to the board of directors.",
    options: [
      "None",
      "Neither",
      "Both",
      "Every"
    ],
    correctIndex: 1,
    category: "Determiners",
    level: "B2",
    explanation: "Ikkita narsadan hech biri ma'nosida 'Neither' ishlatiladi ('None' esa uch va undan ortiq narsalar uchun)."
  },
  {
    id: 35,
    question: "You can borrow my laptop for the presentation _______ you return it by tomorrow afternoon.",
    options: [
      "unless",
      "as long as",
      "even if",
      "in case"
    ],
    correctIndex: 1,
    category: "Conditionals & Linkers",
    level: "B2",
    explanation: "'as long as' (yoki 'provided that') — 'faqat ... sharti bilan' ma'nosini beradi."
  },

  // 36-50: B2+ to C1 Inversion, Participle Clauses, Cleft Sentences, Subjunctive, Advanced Grammar
  {
    id: 36,
    question: "Hardly _______ the office when the director called an urgent meeting.",
    options: [
      "I had entered",
      "had I entered",
      "did I enter",
      "was I entering"
    ],
    correctIndex: 1,
    category: "Inversion",
    level: "C1",
    explanation: "Gap boshida 'Hardly / Scarcely / No sooner' kelsa, Past Perfect inversiya shaklida ('had I entered') ishlatiladi."
  },
  {
    id: 37,
    question: "_______ from a distance, the island looked like a giant sleeping turtle.",
    options: [
      "Seeing",
      "Having seen",
      "Seen",
      "To see"
    ],
    correctIndex: 2,
    category: "Participle Clauses",
    level: "C1",
    explanation: "Asosiy gapning egasi 'the island' (orol o'zi ko'rmaydi, balki ko'rinadi — majhul ma'no). Shuning uchun Past Participle ('Seen') ishlatiladi."
  },
  {
    id: 38,
    question: "Under no circumstances _______ your account password with anyone, even customer support.",
    options: [
      "you should share",
      "should you share",
      "you must share",
      "are you sharing"
    ],
    correctIndex: 1,
    category: "Negative Inversion",
    level: "C1",
    explanation: "'Under no circumstances' kabi inkor iboralar gap boshiga chiqsa, yordamchi/modal fe'l egadan oldinga o'tadi ('should you share')."
  },
  {
    id: 39,
    question: "_______ for the rapid intervention of the paramedics, the patient might not have survived.",
    options: [
      "If it wasn't",
      "Had it not been",
      "Were it not",
      "Unless it had been"
    ],
    correctIndex: 1,
    category: "Inverted Conditionals",
    level: "C1",
    explanation: "3-turdagi shart ergash gapning inversiyasi: 'Had it not been for...' (= If it hadn't been for... — '...bo'lmaganida edi')."
  },
  {
    id: 40,
    question: "The committee recommended that the historic building _______ restored rather than demolished.",
    options: [
      "is",
      "was",
      "be",
      "would be"
    ],
    correctIndex: 2,
    category: "Subjunctive Mood",
    level: "C1",
    explanation: "'recommend / suggest / insist / demand + that + subject + bare infinitive (be)' — Subjunctive Mood qoidasi."
  },
  {
    id: 41,
    question: "Only after the new regulations were introduced _______ a noticeable decline in road accidents.",
    options: [
      "there was",
      "was there",
      "it was",
      "had there been"
    ],
    correctIndex: 1,
    category: "Inversion",
    level: "C1",
    explanation: "'Only after + ergash gap' bilan boshlangan gapning bosh gapida inversiya sodir bo'ladi ('was there')."
  },
  {
    id: 42,
    question: "_______ all his assignments ahead of the deadline, he decided to take the weekend off.",
    options: [
      "Completing",
      "Having completed",
      "Completed",
      "To complete"
    ],
    correctIndex: 1,
    category: "Perfect Participle",
    level: "C1",
    explanation: "Ikkinchi harakatdan ('decided') ancha oldin tugallangan faol harakatni ko'rsatish uchun Perfect Participle ('Having completed') qo'llaniladi."
  },
  {
    id: 43,
    question: "What impressed the judges most _______ the candidate's ability to remain calm under pressure.",
    options: [
      "were",
      "was",
      "have been",
      "are"
    ],
    correctIndex: 1,
    category: "Cleft Sentences",
    level: "B2",
    explanation: "'What'-cleft gapda to'ldiruvchi birlikda ('the candidate's ability') bo'lgani uchun birlikdagi 'was' fe'li qo'yiladi."
  },
  {
    id: 44,
    question: "Seldom _______ such a passionate and well-researched keynote speech at an academic conference.",
    options: [
      "I have heard",
      "have I heard",
      "I heard",
      "did I heard"
    ],
    correctIndex: 1,
    category: "Inversion",
    level: "C1",
    explanation: "'Seldom / Rarely / Never' gap boshida kelganda inversiya talab qilinadi ('have I heard')."
  },
  {
    id: 45,
    question: "No sooner had the concert tickets gone on sale _______ the entire website crashed due to high traffic.",
    options: [
      "when",
      "than",
      "then",
      "before"
    ],
    correctIndex: 1,
    category: "Correlative Inversion",
    level: "C1",
    explanation: "'No sooner ... than ...' barqaror grammatik bog'lanma hisoblanadi ('Hardly/Scarcely' esa 'when' bilan keladi)."
  },
  {
    id: 46,
    question: "_______ you require any further assistance with your visa application, please contact our office.",
    options: [
      "Were",
      "Should",
      "Had",
      "Might"
    ],
    correctIndex: 1,
    category: "Inverted Conditionals",
    level: "C1",
    explanation: "1-turdagi shart ergash gapning rasmiy inversiyasi: 'Should you require...' (= If you should require...)."
  },
  {
    id: 47,
    question: "A number of researchers _______ raised concerns, although the number of confirmed cases _______ still low.",
    options: [
      "has / are",
      "have / is",
      "have / are",
      "has / is"
    ],
    correctIndex: 1,
    category: "Subject-Verb Agreement",
    level: "C1",
    explanation: "'A number of + plural noun' ko'plikdagi fe'l ('have'), 'The number of + plural noun' esa birlikdagi fe'l ('is') oladi."
  },
  {
    id: 48,
    question: "He spoke as though he _______ an expert on artificial intelligence, when in fact he had just read one article.",
    options: [
      "is",
      "were",
      "has been",
      "will be"
    ],
    correctIndex: 1,
    category: "Unreal Past (As if / As though)",
    level: "B2",
    explanation: "'as if / as though' dan keyin haqiqatga zid faraz uchun Past Subjunctive ('were') ishlatiladi."
  },
  {
    id: 49,
    question: "Little _______ that her small startup would eventually grow into a multinational corporation.",
    options: [
      "she knew",
      "did she know",
      "she had known",
      "knew she"
    ],
    correctIndex: 1,
    category: "Negative Inversion",
    level: "C1",
    explanation: "'Little' ('hech ham bilmagan edi' ma'nosida) gap boshida kelsa, Past Simple inversiyasi ('did she know') qo'llaniladi."
  },
  {
    id: 50,
    question: "Try as he _______, he couldn't persuade the committee to extend the project deadline.",
    options: [
      "can",
      "might",
      "would",
      "could"
    ],
    correctIndex: 1,
    category: "Concessive Clauses",
    level: "C1",
    explanation: "'Try as he might' — C1 darajadagi turg'un concesive ibora bo'lib, 'qanchalik urinmasin' (Although he tried very hard) degan ma'noni anglatadi."
  }
];
