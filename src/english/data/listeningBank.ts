import type { DialogueTurn } from '../../utils/speechVoice';

export interface ListeningQuestion {
  id: number;
  type: 'mcq' | 'fill';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  evidenceQuote: string;
  explanation: string;
}

export interface ListeningTrack {
  id: string;
  examType: 'ielts' | 'multilevel';
  partLabel: string;
  title: string;
  subtitle: string;
  levelBadge: string;
  dialogue: DialogueTurn[];
  questions: ListeningQuestion[];
}

export const LISTENING_BANK: ListeningTrack[] = [
  {
    id: 'ielts_l1',
    examType: 'ielts',
    partLabel: 'Part 1 · Everyday Context',
    title: 'Riverside Sports Centre Membership',
    subtitle: 'Receptionist & New Member Dialogue',
    levelBadge: 'IELTS Part 1',
    dialogue: [
      {
        speaker: 'Receptionist',
        voice: 'en-GB-SoniaNeural',
        text: 'Good morning, Riverside Sports Centre. How can I help you today?',
      },
      {
        speaker: 'Daniel',
        voice: 'en-GB-RyanNeural',
        text: 'Hi! I recently moved to Oakwood Street and would like to sign up for an off-peak gym and swimming membership.',
      },
      {
        speaker: 'Receptionist',
        voice: 'en-GB-SoniaNeural',
        text: 'Certainly. Our off-peak plan runs from 6 a.m. until 4 p.m. on weekdays, plus all day Sunday. Normally it is forty-five pounds, though students get a discounted rate of thirty-four pounds per month.',
      },
      {
        speaker: 'Daniel',
        voice: 'en-GB-RyanNeural',
        text: 'I am actually a postgraduate engineering student, so thirty-four pounds sounds great. Does that include a locker and fitness assessment?',
      },
      {
        speaker: 'Receptionist',
        voice: 'en-GB-SoniaNeural',
        text: 'The induction assessment on your first visit is completely free. Lockers take a refundable one-pound coin, or you can rent a private locker for eight pounds extra. Oh, and our main Olympic pool closes every Wednesday morning between nine and eleven for maintenance.',
      },
    ],
    questions: [
      {
        id: 101,
        type: 'fill',
        questionText: 'Where does Daniel currently live? _______ Street (ONE WORD)',
        correctAnswer: 'Oakwood',
        acceptableAnswers: ['oakwood', 'Oakwood'],
        evidenceQuote: 'I recently moved to Oakwood Street and would like to sign up...',
        explanation: "Daniel ko'chib o'tgan ko'chasini 'Oakwood Street' deb aniq aytdi.",
      },
      {
        id: 102,
        type: 'mcq',
        questionText: 'How much will Daniel pay monthly for the off-peak membership?',
        options: ['A) £45', 'B) £34', 'C) £28'],
        correctAnswer: 'B) £34',
        acceptableAnswers: ['B', '34', '£34'],
        evidenceQuote: '...students get a discounted rate of thirty-four pounds per month. I am actually a postgraduate engineering student...',
        explanation: "Standart narx £45, lekin Daniel talaba bo'lgani uchun £34 chegirma oladi.",
      },
      {
        id: 103,
        type: 'mcq',
        questionText: 'When are off-peak members allowed to use the centre at the weekend?',
        options: ['A) Saturday morning only', 'B) All day Sunday', 'C) Both Saturday and Sunday'],
        correctAnswer: 'B) All day Sunday',
        acceptableAnswers: ['B', 'All day Sunday', 'Sunday'],
        evidenceQuote: 'Our off-peak plan runs from 6 a.m. until 4 p.m. on weekdays, plus all day Sunday.',
        explanation: "Dam olish kunlaridan faqat yakshanba (all day Sunday) off-peak tarifi tarkibiga kiradi.",
      },
      {
        id: 104,
        type: 'fill',
        questionText: 'The main pool is closed for maintenance every _______ morning. (ONE WORD)',
        correctAnswer: 'Wednesday',
        acceptableAnswers: ['wednesday', 'Wednesday'],
        evidenceQuote: 'Oh, and our main Olympic pool closes every Wednesday morning between nine and eleven for maintenance.',
        explanation: "Basseyn har chorshanba (Wednesday) soat 9 dan 11 gacha texnik ko'rik uchun yopiladi.",
      },
      {
        id: 105,
        type: 'mcq',
        questionText: 'What does a member need to use a standard locker?',
        options: ['A) An £8 monthly fee', 'B) A refundable £1 coin', 'C) A student card deposit'],
        correctAnswer: 'B) A refundable £1 coin',
        acceptableAnswers: ['B', '£1', '1 pound'],
        evidenceQuote: 'Lockers take a refundable one-pound coin, or you can rent a private locker for eight pounds extra.',
        explanation: "Oddiy shkafcha (locker) uchun qaytarib beriladigan 1 funtlik tanga kifoya.",
      },
    ],
  },
  {
    id: 'ielts_l2',
    examType: 'ielts',
    partLabel: 'Part 3 · Academic Discussion',
    title: 'Marine Microplastics Research Project',
    subtitle: 'Tutor & Two University Students',
    levelBadge: 'IELTS Part 3',
    dialogue: [
      {
        speaker: 'Dr. Evans',
        voice: 'en-US-GuyNeural',
        text: 'Maya and Liam, I reviewed your draft methodology on estuary microplastics. Why did you decide against using surface trawl nets?',
      },
      {
        speaker: 'Maya',
        voice: 'en-US-JennyNeural',
        text: 'Well, Dr. Evans, surface nets often miss denser fibres such as polyester, which sink toward the riverbed sediment within hours.',
      },
      {
        speaker: 'Liam',
        voice: 'en-GB-RyanNeural',
        text: 'Exactly. Plus, the local tidal currents near the harbour damaged two nets during our pilot test in October, so benthic sediment cores proved much more reliable.',
      },
      {
        speaker: 'Dr. Evans',
        voice: 'en-US-GuyNeural',
        text: 'Smart adjustment. However, your literature review relies heavily on studies from the Baltic Sea. Be careful comparing enclosed brackish basins with open Atlantic estuaries.',
      },
      {
        speaker: 'Maya',
        voice: 'en-US-JennyNeural',
        text: 'Fair point. Before Friday seminar, Liam will add two North Sea papers while I recalibrate our spectrometer to reduce false organic positives.',
      },
    ],
    questions: [
      {
        id: 201,
        type: 'mcq',
        questionText: 'Why did Maya and Liam avoid surface trawl nets?',
        options: [
          'A) They were too expensive for the department',
          'B) Dense fibres sink and strong tides tore the nets',
          'C) River regulations prohibited boat sampling',
        ],
        correctAnswer: 'B) Dense fibres sink and strong tides tore the nets',
        acceptableAnswers: ['B'],
        evidenceQuote: 'surface nets often miss denser fibres... damaged two nets during our pilot test',
        explanation: "Og'ir tolalar cho'kib ketishi va kuchli oqim to'rlarni yirtib yuborgani sababli tubdan namuna olingan.",
      },
      {
        id: 202,
        type: 'fill',
        questionText: 'Instead of surface trawls, the students collected _______ cores. (ONE WORD)',
        correctAnswer: 'sediment',
        acceptableAnswers: ['sediment', 'benthic sediment'],
        evidenceQuote: '...so benthic sediment cores proved much more reliable.',
        explanation: "Talabalar suv usti o'rniga tubdagi cho'kindi (sediment) namunalarini yig'ishgan.",
      },
      {
        id: 203,
        type: 'mcq',
        questionText: 'What weakness does Dr. Evans identify in their literature review?',
        options: [
          'A) Outdated sources before 2010',
          'B) Comparing enclosed Baltic data with open estuaries',
          'C) Missing statistical p-values',
        ],
        correctAnswer: 'B) Comparing enclosed Baltic data with open estuaries',
        acceptableAnswers: ['B'],
        evidenceQuote: 'Be careful comparing enclosed brackish basins with open Atlantic estuaries.',
        explanation: "Yopiq Boltiq dengizi tadqiqotlarini ochiq Atlantika estuariylari bilan solishtirish xavfi bor.",
      },
      {
        id: 204,
        type: 'mcq',
        questionText: 'What will Maya focus on before the Friday seminar?',
        options: [
          'A) Adding North Sea papers',
          'B) Recalibrating the spectrometer',
          'C) Repeating the October harbour pilot',
        ],
        correctAnswer: 'B) Recalibrating the spectrometer',
        acceptableAnswers: ['B'],
        evidenceQuote: 'Liam will add two North Sea papers while I recalibrate our spectrometer...',
        explanation: "Liam North Sea maqolalarini qo'shadi, Maya esa spektrometrni qayta sozlaydi.",
      },
    ],
  },
  {
    id: 'ielts_l3',
    examType: 'ielts',
    partLabel: 'Part 4 · Academic Lecture',
    title: 'Biophilic Architecture in Desert Cities',
    subtitle: 'University Urban Planning Lecture',
    levelBadge: 'IELTS Part 4',
    dialogue: [
      {
        speaker: 'Professor',
        voice: 'en-GB-SoniaNeural',
        text: 'Today we examine how arid megacities are reviving passive cooling strategies borrowed from desert ecology and historic Silk Road courtyards.',
      },
      {
        speaker: 'Professor',
        voice: 'en-GB-SoniaNeural',
        text: 'In glass skyscrapers, solar heat gain drives air-conditioning demand up by nearly forty-five percent in July. By contrast, thick adobe and limestone walls store daytime heat and release it gradually at night—a principle architects call thermal mass.',
      },
      {
        speaker: 'Professor',
        voice: 'en-GB-SoniaNeural',
        text: 'Recent trials in Masdar and Tashkent demonstrate that shaded pedestrian arcades paired with greywater fountains can lower street-level perceived temperature by up to six degrees Celsius without mechanical chillers.',
      },
    ],
    questions: [
      {
        id: 301,
        type: 'fill',
        questionText: 'By storing daytime heat in thick walls, builders utilize ______ mass. (ONE WORD)',
        correctAnswer: 'thermal',
        acceptableAnswers: ['thermal'],
        evidenceQuote: '...a principle architects call thermal mass.',
        explanation: "Qalin devorlarning issiqlikni ushlab turish tamoyili 'thermal mass' deb ataladi.",
      },
      {
        id: 302,
        type: 'mcq',
        questionText: 'By how much can glass towers raise July cooling demand?',
        options: ['A) 25%', 'B) Nearly 45%', 'C) 60%'],
        correctAnswer: 'B) Nearly 45%',
        acceptableAnswers: ['B', '45', '45%'],
        evidenceQuote: 'drives air-conditioning demand up by nearly forty-five percent in July.',
        explanation: "Shishali binolar iyul oyida konditsioner yuklamasini qariyb 45 foizga oshiradi.",
      },
      {
        id: 303,
        type: 'mcq',
        questionText: 'What temperature reduction can shaded arcades and fountains achieve?',
        options: ['A) Up to 2°C', 'B) Up to 6°C', 'C) Up to 12°C'],
        correctAnswer: 'B) Up to 6°C',
        acceptableAnswers: ['B', '6'],
        evidenceQuote: 'lower street-level perceived temperature by up to six degrees Celsius',
        explanation: "Soya ravoqlar va favvoralar his qilinadigan haroratni 6 gradusgacha tushira oladi.",
      },
    ],
  },
  {
    id: 'ml_l1',
    examType: 'multilevel',
    partLabel: 'Part 2 · Monolog (B1–B2)',
    title: 'Samarqandda Elektr Avtobuslar Loyihasi',
    subtitle: 'UzBMB Multilevel Format · Shahar Transporti',
    levelBadge: 'Multilevel B2',
    dialogue: [
      {
        speaker: 'Moderator',
        voice: 'en-GB-RyanNeural',
        text: 'Welcome to Samarkand Morning Radio. Today we are speaking with Dilshod Karimov about the new electric bus routes.',
      },
      {
        speaker: 'Dilshod',
        voice: 'en-US-GuyNeural',
        text: 'Thank you. Over the last six months, we launched thirty zero-emission buses connecting the train station directly with Registan Square and the university campus.',
      },
      {
        speaker: 'Dilshod',
        voice: 'en-US-GuyNeural',
        text: 'Passengers especially appreciate the quiet ride and free Wi-Fi, though our biggest challenge has been installing fast-charging stations before the tourist peak in September.',
      },
    ],
    questions: [
      {
        id: 401,
        type: 'mcq',
        questionText: 'How many electric buses have been launched so far?',
        options: ['A) 13', 'B) 30', 'C) 60'],
        correctAnswer: 'B) 30',
        acceptableAnswers: ['B', '30'],
        evidenceQuote: 'we launched thirty zero-emission buses...',
        explanation: "Oxirgi 6 oyda 30 ta (thirty) elektrobus ishga tushirilgan.",
      },
      {
        id: 402,
        type: 'mcq',
        questionText: 'What is the main operational difficulty mentioned by Dilshod?',
        options: [
          'A) High ticket prices for students',
          'B) Setting up fast chargers before September',
          'C) Lack of trained drivers',
        ],
        correctAnswer: 'B) Setting up fast chargers before September',
        acceptableAnswers: ['B'],
        evidenceQuote: 'biggest challenge has been installing fast-charging stations before the tourist peak in September.',
        explanation: "Eng katta muammo sentyabrgacha tezkor quvvatlash stansiyalarini o'rnatish bo'lgan.",
      },
      {
        id: 403,
        type: 'fill',
        questionText: 'The buses link the train station, Registan Square, and the university _______. (ONE WORD)',
        correctAnswer: 'campus',
        acceptableAnswers: ['campus'],
        evidenceQuote: 'connecting the train station directly with Registan Square and the university campus.',
        explanation: "Yo'nalish temir yo'l vokzali, Registon va universitet kampusini bog'laydi.",
      },
    ],
  },
  {
    id: 'ml_l2',
    examType: 'multilevel',
    partLabel: 'Part 3 · Ikki kishi suhbati (B2–C1)',
    title: 'Choosing an Online Python Course',
    subtitle: 'Two Uzbek Students Comparing Platforms',
    levelBadge: 'Multilevel B2–C1',
    dialogue: [
      {
        speaker: 'Aziza',
        voice: 'en-GB-SoniaNeural',
        text: 'Bekzod, did you end up buying the weekend live bootcamp or the self-paced video track?',
      },
      {
        speaker: 'Bekzod',
        voice: 'en-US-GuyNeural',
        text: 'I went with the self-paced track because of my evening part-time job, yet having a mentor check my code every Sunday keeps me disciplined.',
      },
      {
        speaker: 'Aziza',
        voice: 'en-GB-SoniaNeural',
        text: 'That sounds balanced. I might join too if they still offer the early-bird certificate discount.',
      },
    ],
    questions: [
      {
        id: 501,
        type: 'mcq',
        questionText: 'Why did Bekzod pick the self-paced video track?',
        options: [
          'A) It was completely free',
          'B) He has a part-time job in the evenings',
          'C) The live bootcamp was already full',
        ],
        correctAnswer: 'B) He has a part-time job in the evenings',
        acceptableAnswers: ['B'],
        evidenceQuote: 'because of my evening part-time job',
        explanation: "Bekzod kechqurun ishlashi sababli mustaqil jadvaldagi kursni tanlagan.",
      },
      {
        id: 502,
        type: 'fill',
        questionText: 'Bekzod gets code feedback from a _______ every Sunday. (ONE WORD)',
        correctAnswer: 'mentor',
        acceptableAnswers: ['mentor'],
        evidenceQuote: 'having a mentor check my code every Sunday keeps me disciplined.',
        explanation: "Har yakshanba mentor uning kodini tekshirib turadi.",
      },
    ],
  },
  {
    id: 'ml_l3',
    examType: 'multilevel',
    partLabel: 'Part 5 · Akademik ma\'ruza (C1)',
    title: 'Why Bilingual Brains Switch Tasks Faster',
    subtitle: 'Cognitive Neuroscience Overview · C1 Level',
    levelBadge: 'Multilevel C1',
    dialogue: [
      {
        speaker: 'Lecturer',
        voice: 'en-GB-RyanNeural',
        text: 'Neuroimaging reveals that fluent bilingual speakers constantly suppress one vocabulary system while speaking another. Far from causing confusion, this daily mental juggling strengthens the prefrontal cortex.',
      },
      {
        speaker: 'Lecturer',
        voice: 'en-GB-RyanNeural',
        text: 'Consequently, adults who actively maintain two languages demonstrate stronger selective attention and tend to delay age-related memory decline by four to five years on average.',
      },
    ],
    questions: [
      {
        id: 601,
        type: 'mcq',
        questionText: 'What brain region benefits most from switching between two languages?',
        options: ['A) Prefrontal cortex', 'B) Visual lobe', 'C) Cerebellum'],
        correctAnswer: 'A) Prefrontal cortex',
        acceptableAnswers: ['A', 'prefrontal cortex'],
        evidenceQuote: 'this daily mental juggling strengthens the prefrontal cortex.',
        explanation: "Ikki tilni faol ishlatish prefrontal korteks (prefrontal cortex) ni kuchaytiradi.",
      },
      {
        id: 602,
        type: 'fill',
        questionText: 'Bilingualism may postpone age-related memory decline by four to _______ years. (ONE WORD)',
        correctAnswer: 'five',
        acceptableAnswers: ['five', '5'],
        evidenceQuote: 'delay age-related memory decline by four to five years on average.',
        explanation: "O'rtacha 4-5 yilga xotira pasayishini kechiktirishi aniqlangan.",
      },
    ],
  },
];
