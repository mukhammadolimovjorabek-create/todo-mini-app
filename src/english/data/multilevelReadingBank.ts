// Dedicated Multilevel (CEFR B1-C1) Reading Bank + 2 Additional IELTS Academic Passages

export interface BankReadingQuestion {
  id: number;
  type: 'tfng' | 'mcq' | 'completion';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  paragraphRef: string;
  evidenceQuote: string;
  paraphraseAnalysis: string;
  explanation: string;
}

export interface BankReadingPassage {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: { label: string; text: string }[];
  questions: BankReadingQuestion[];
}

export const EXTRA_IELTS_PASSAGES: BankReadingPassage[] = [
  {
    id: 'ielts_p4_deepwork',
    title: 'Attention Fragmentation in the Hyper-Connected Workplace',
    subtitle: 'Passage 4 · Cognitive Psychology & Productivity (Band 7.5–9.0)',
    paragraphs: [
      {
        label: 'A',
        text: 'For much of the twentieth century, office efficiency was measured by visible output and hours spent at a desk. In knowledge economies, however, uninterrupted cognitive focus has become a scarcer resource than physical time. Behavioral studies show that even a three-second notification chime prompts employees to shift mental context, leaving behind what researcher Sophie Leroy famously termed "attention residue."',
      },
      {
        label: 'B',
        text: 'Crucially, attention residue does not vanish the moment a worker closes an email tab. Neurocognitive testing indicates that a residual portion of working memory continues rehearsing the interrupted task for fifteen to twenty-three minutes. Organizations that reward instantaneous messaging responses often see high apparent responsiveness paired with steep declines in complex analytical quality.',
      },
      {
        label: 'C',
        text: 'Counter-measures do not require abandoning digital tools altogether. Forward-looking engineering teams increasingly isolate asynchronous communication into two fixed daily windows, preserving silent four-hour blocks for deep problem-solving. Early trials report up to a 28% drop in self-reported burnout without slowing project delivery.',
      },
    ],
    questions: [
      {
        id: 401,
        type: 'tfng',
        questionText: 'Even brief phone or message alerts reduce an employee’s mental focus on the main task.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        acceptableAnswers: ['TRUE', 'T'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'even a three-second notification chime prompts employees to shift mental context, leaving behind "attention residue."',
        paraphraseAnalysis: '"brief alerts" = "three-second notification chime"',
        explanation: "3 soniyalik bildirishnoma ham miyada 'attention residue' qoldirib diqqatni bo'lishi aytilgan.",
      },
      {
        id: 402,
        type: 'completion',
        questionText: 'Unfinished interrupted tasks can keep occupying working memory for up to _______ minutes. (ONE NUMBER/WORD)',
        correctAnswer: '23',
        acceptableAnswers: ['23', 'twenty-three', 'twenty three'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'continues rehearsing the interrupted task for fifteen to twenty-three minutes.',
        paraphraseAnalysis: 'up to 23 minutes',
        explanation: "Matnda 15 dan 23 daqiqagacha diqqat tiklanmasligi ko'rsatilgan.",
      },
      {
        id: 403,
        type: 'mcq',
        questionText: 'According to Paragraph C, what policy helped teams lower employee burnout by 28%?',
        options: [
          'A) Banning laptops completely after lunch',
          'B) Grouping messages into two set periods and protecting silent blocks',
          'C) Shortening the workweek to three days',
        ],
        correctAnswer: 'B) Grouping messages into two set periods and protecting silent blocks',
        acceptableAnswers: ['B'],
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'isolate asynchronous communication into two fixed daily windows, preserving silent four-hour blocks...',
        paraphraseAnalysis: 'two fixed windows = two set periods',
        explanation: "Xabarlarga kuniga 2 ta aniq vaqt oralig'ida javob berish va 4 soatlik sokin blok ajratish charchoqni 28% kamaytirgan.",
      },
      {
        id: 404,
        type: 'tfng',
        questionText: 'Organizations that demand instant chat replies usually produce stronger analytical reports.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        acceptableAnswers: ['FALSE', 'F'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'often see high apparent responsiveness paired with steep declines in complex analytical quality.',
        paraphraseAnalysis: 'steep declines vs stronger quality -> contradicts',
        explanation: "Tezkor chat madaniyati murakkab tahliliy sifatning keskin tushishiga olib keladi.",
      },
    ],
  },
  {
    id: 'ielts_p5_ocean',
    title: 'Chemosynthesis Along Deep-Sea Hydrothermal Vents',
    subtitle: 'Passage 5 · Marine Biology & Extremophiles (Academic)',
    paragraphs: [
      {
        label: 'A',
        text: 'Until 1977, biologists assumed every thriving ecosystem on Earth depended ultimately on sunlight through photosynthesis. That consensus shattered when deep-sea submersibles exploring the Galapagos Rift discovered dense colonies of giant tube worms clustered around volcanic vents 2,500 metres beneath the surface—in pitch darkness under crushing pressure.',
      },
      {
        label: 'B',
        text: 'Rather than consuming solar-powered plankton, these Riftia tube worms possess no mouth or digestive tract at all. Instead, billions of symbiotic bacteria inside a specialized organ oxidize hydrogen sulfide gas gushing from the vents, converting carbon dioxide into organic sugars via chemosynthesis.',
      },
      {
        label: 'C',
        text: 'Beyond rewriting Earth biology, hydrothermal vents now guide astrobiologists searching for life on icy moons such as Europa and Enceladus, where subsurface liquid oceans warm against rocky cores far from the Sun.',
      },
    ],
    questions: [
      {
        id: 501,
        type: 'tfng',
        questionText: 'Before 1977, scientists believed sunlight was essential for all complex ecosystems.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        acceptableAnswers: ['TRUE', 'T'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'Until 1977, biologists assumed every thriving ecosystem on Earth depended ultimately on sunlight...',
        paraphraseAnalysis: 'assumed every ecosystem depended on sunlight',
        explanation: "1977-yilgacha biologlar barcha ekotizimlar quyosh nuriga bog'liq deb hisoblashgan.",
      },
      {
        id: 502,
        type: 'completion',
        questionText: 'Riftia tube worms lack both a digestive tract and a _______. (ONE WORD)',
        correctAnswer: 'mouth',
        acceptableAnswers: ['mouth'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'these Riftia tube worms possess no mouth or digestive tract at all.',
        paraphraseAnalysis: 'lack = possess no',
        explanation: "Chuvalchanglarda og'iz (mouth) ham, hazm trakti ham bo'lmaydi.",
      },
      {
        id: 503,
        type: 'tfng',
        questionText: 'Simbiotic vent bacteria have already been detected on Saturn’s moon Enceladus.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        acceptableAnswers: ['FALSE', 'F'],
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'now guide astrobiologists searching for life on icy moons such as Europa and Enceladus...',
        paraphraseAnalysis: 'searching for vs already detected -> contradicts',
        explanation: "Astrobiologlar hali qidiruv jarayonida ekani yozilgan, topilgani aytilmagan.",
      },
    ],
  },
];

export const MULTILEVEL_READING_PASSAGES: BankReadingPassage[] = [
  {
    id: 'ml_p1_aral',
    title: 'Greening the Aral Seabed: Saxaul Forests and Eco-Tourism',
    subtitle: 'Multilevel B1–B2 · Oʻzbekiston Ekologiyasi va Tabiat',
    paragraphs: [
      {
        label: 'A',
        text: 'For decades, strong winds lifted toxic salt dust from the dried seabed of the Aral Sea across Karakalpakstan. Since 2018, however, an ambitious afforestation drive has planted salt-tolerant saxaul trees across nearly two million hectares of exposed desert floor, helping trap sand and stabilize fragile topsoil.',
      },
      {
        label: 'B',
        text: 'Surprisingly, ecological recovery is now creating new livelihoods for young locals in Muynak. Guided four-wheel-drive expeditions across the Ustyurt Plateau and open-air astronomical camps draw thousands of domestic and foreign visitors each spring and autumn.',
      },
      {
        label: 'C',
        text: 'Environmental researchers emphasize that tree planting alone will not restore the former sea volume; long-term progress depends equally on modernizing drip irrigation along the Amu Darya basin to reduce agricultural water losses.',
      },
    ],
    questions: [
      {
        id: 701,
        type: 'tfng',
        questionText: 'Saxaul trees were chosen because they can survive salty soil conditions.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        acceptableAnswers: ['TRUE', 'T'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'planted salt-tolerant saxaul trees across nearly two million hectares...',
        paraphraseAnalysis: 'survive salty conditions = salt-tolerant',
        explanation: "Saksovul daraxtlari sho'r tuproqqa chidamli (salt-tolerant) bo'lgani uchun ekilgan.",
      },
      {
        id: 702,
        type: 'mcq',
        questionText: 'What attracts visitors to Muynak according to Paragraph B?',
        options: [
          'A) Large commercial fishing harbours',
          'B) Ustyurt desert tours and stargazing camps',
          'C) Snow skiing resorts in winter',
        ],
        correctAnswer: 'B) Ustyurt desert tours and stargazing camps',
        acceptableAnswers: ['B'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Guided four-wheel-drive expeditions across the Ustyurt Plateau and open-air astronomical camps...',
        paraphraseAnalysis: 'astronomical camps = stargazing camps',
        explanation: "Ustyurt platosi bo'ylab safarlar va astronomik lagerlar sayyohlarni jalb qilmoqda.",
      },
      {
        id: 703,
        type: 'completion',
        questionText: 'Scientists stress that saving water requires _______ irrigation along the Amu Darya. (ONE WORD)',
        correctAnswer: 'drip',
        acceptableAnswers: ['drip'],
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'depends equally on modernizing drip irrigation along the Amu Darya basin...',
        paraphraseAnalysis: 'saving water = reduce water losses',
        explanation: "Suv isrofini kamaytirish uchun tomchilatib sug'orish (drip irrigation) tizimini yangilash zarur.",
      },
      {
        id: 704,
        type: 'tfng',
        questionText: 'Planting trees has already refilled half of the Aral Sea with river water.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        acceptableAnswers: ['FALSE', 'F'],
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'tree planting alone will not restore the former sea volume',
        paraphraseAnalysis: 'will not restore sea volume vs refilled half',
        explanation: "Daraxt ekish dengiz suvini qayta to'ldirmasligi aniq ta'kidlangan.",
      },
    ],
  },
  {
    id: 'ml_p2_samarkand',
    title: 'Ulugh Beg’s Observatory and Precision Silk Road Science',
    subtitle: 'Multilevel B2 · Tarix va Astronomiya (UzBMB formati)',
    paragraphs: [
      {
        label: 'A',
        text: 'Built in the 1420s on a rocky hill outside Samarkand, Ulugh Beg’s three-storey observatory housed a massive underground marble sextant spanning over forty metres in radius. Without optical telescopes, astronomers tracked solar shadows moving across a carved scale inside a darkened trench.',
      },
      {
        label: 'B',
        text: 'Working alongside scholars such as Ali Qushji and Jamshid al-Kashi, Ulugh Beg compiled the Zij-i-Sultani star catalogue containing 992 fixed stars, calculating the length of the sidereal year to within just 58 seconds of modern atomic measurements.',
      },
    ],
    questions: [
      {
        id: 801,
        type: 'tfng',
        questionText: 'Astronomers at Samarkand used early European glass telescopes in 1420.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        acceptableAnswers: ['FALSE', 'F'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'Without optical telescopes, astronomers tracked solar shadows...',
        paraphraseAnalysis: 'Without optical telescopes',
        explanation: "Ular optik teleskoplarsiz (marmar sekstant va quyosh soyasi orqali) o'lchashgan.",
      },
      {
        id: 802,
        type: 'completion',
        questionText: 'The famous Zij-i-Sultani star catalogue documented _______ fixed stars. (NUMBER)',
        correctAnswer: '992',
        acceptableAnswers: ['992'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'compiled the Zij-i-Sultani star catalogue containing 992 fixed stars',
        paraphraseAnalysis: 'documented = containing',
        explanation: "Ziji Sultoniy katalogida 992 ta yulduz koordinatasi jamlangan.",
      },
      {
        id: 803,
        type: 'mcq',
        questionText: 'How accurate was Ulugh Beg’s measurement of the sidereal year?',
        options: [
          'A) Off by nearly two hours',
          'B) Within less than one minute of modern measurements',
          'C) Valid only during summer months',
        ],
        correctAnswer: 'B) Within less than one minute of modern measurements',
        acceptableAnswers: ['B'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'to within just 58 seconds of modern atomic measurements.',
        paraphraseAnalysis: '58 seconds = less than one minute',
        explanation: "Atigi 58 soniya (1 daqiqadan kam) farq bilan nihoyatda aniq hisoblangan.",
      },
    ],
  },
  {
    id: 'ml_p3_microforest',
    title: 'Miyawaki Pocket Forests: Rapid Shade for Hot Megacities',
    subtitle: 'Multilevel B2–C1 · Urban Ekologiya',
    paragraphs: [
      {
        label: 'A',
        text: 'Named after Japanese botanist Akira Miyawaki, pocket micro-forests pack native saplings tightly together on urban plots no larger than a tennis court. Because young trees compete gently for upward light, they grow up to ten times faster than spaced park lawns.',
      },
      {
        label: 'B',
        text: 'Within just three years, the dense canopy becomes largely self-sustaining, requiring minimal watering while harbouring twenty times more bird and insect species than ornamental grass strips.',
      },
    ],
    questions: [
      {
        id: 901,
        type: 'tfng',
        questionText: 'Pocket forests require foreign exotic trees rather than local species.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        acceptableAnswers: ['FALSE', 'F'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'pack native saplings tightly together...',
        paraphraseAnalysis: 'native saplings vs foreign exotic',
        explanation: "Miyawaki usulida mahalliy (native) ko'chatlar zich ekiladi.",
      },
      {
        id: 902,
        type: 'completion',
        questionText: 'Close competition for sunlight helps micro-forests grow up to _______ times faster. (NUMBER)',
        correctAnswer: '10',
        acceptableAnswers: ['10', 'ten'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'grow up to ten times faster than spaced park lawns.',
        paraphraseAnalysis: 'up to ten times faster',
        explanation: "Daraxtlar yorug'lik uchun intilib 10 baravar tezroq o'sadi.",
      },
    ],
  },
];
