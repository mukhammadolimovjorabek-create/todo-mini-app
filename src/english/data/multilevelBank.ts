import mlData from './multilevelBank.json';
import mlWritingData from './multilevelWritingBank.json';

export interface MultilevelOfficialQuestion {
  number: number;
  question: string;
  sampleAnswer: string;
}

export interface MultilevelPart1_1 {
  id: string;
  source: string;
  topic: string;
  questions: string[];
  secondsPerQuestion: number; // 30 seconds
}

export interface MultilevelPart1_2 {
  id: string;
  source: string;
  title: string;
  prompt: string;
  questions: string[];
  prepSeconds: number; // 60 seconds
  speakingSeconds: number; // 120 seconds
}

export interface MultilevelPart2 {
  id: string;
  source: string;
  title: string;
  questions: string[];
  prepSeconds: number; // 60 seconds
  speakingSeconds: number; // 120 seconds
}

export interface MultilevelPart3 {
  id: string;
  source: string;
  statement: string;
  forPoints: string[];
  againstPoints: string[];
  prepSeconds: number; // 60 seconds
  speakingSeconds: number; // 120 seconds
}

export interface MultilevelBank {
  part1_1_questions_43: MultilevelOfficialQuestion[];
  part1_1_docx_questions: string[];
  part1_1: MultilevelPart1_1[];
  part1_2: MultilevelPart1_2[];
  part2: MultilevelPart2[];
  part3: MultilevelPart3[];
}

export interface MultilevelWritingTask1Exercise {
  id: string;
  title: string;
  scenario: string;
  task1_1: {
    type: string;
    prompt: string;
    wordLimit: string;
    timeMinutes: number;
  };
  task1_2: {
    type: string;
    prompt: string;
    wordLimit: string;
    timeMinutes: number;
  };
}

export interface MultilevelWritingTask2Topic {
  id: string;
  number: number;
  category: string;
  title: string;
  prompt: string;
  wordLimit: string;
  modelResponse: string;
}

export interface MultilevelWritingBank {
  task1_exercises: MultilevelWritingTask1Exercise[];
  task2_topics: MultilevelWritingTask2Topic[];
}

const fixOcrText = (s: string): string =>
  s
    .replace(/diGerent/g, 'different')
    .replace(/oGer/g, 'offer')
    .replace(/staG/g, 'staff')
    .replace(/eGective/g, 'effective')
    .replace(/diGicult/g, 'difficult')
    .replace(/aGect/g, 'affect');

// Additional 2022–2026 Official Multilevel Task 1 Exercises (1:1 DTM Format)
const EXTRA_TASK1_EXERCISES: MultilevelWritingTask1Exercise[] = [
  {
    id: 'ml_w1_ex_20',
    title: 'Exercise 20: University Dormitory Renovation Notice (2024)',
    scenario:
      'You live in a university dormitory. You received an email from the accommodation manager.\nDear Resident,\nDuring the upcoming winter semester, the main dormitory kitchen and study lounge on the second floor will be closed for three weeks for essential renovation work.\nWe are considering either providing temporary meal vouchers for the campus cafeteria or setting up portable cooking facilities on the ground floor. We would appreciate your feedback on which option is better and how we can minimize disruption.\nKind regards,\nAccommodation Office',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a letter to your roommate.\n• explain what is happening in the dormitory\n• express how you feel about the closure\n• suggest which alternative you both should support.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the accommodation manager.\n• express your reaction to the renovation plans\n• explain which temporary option you prefer and why\n• suggest ways to keep noise low during exam hours.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_21',
    title: 'Exercise 21: IT Company Remote Work Policy Change (2025)',
    scenario:
      'You work at an international company. You received an email from the Human Resources Director.\nDear Colleague,\nStarting next month, the company is planning to reduce remote working days from three days a week to just one day a week in order to improve team collaboration.\nHowever, we are open to flexible starting hours or providing a monthly transport allowance for commuters. Please let us know your thoughts before the policy is finalized.\nKind regards,\nHR Department',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a message to a colleague.\n• inform them about the new office policy\n• share your feelings about commuting more often\n• suggest what feedback to send to HR.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the HR Director.\n• give your opinion on reducing remote working days\n• explain how this change affects your productivity\n• recommend a balanced hybrid schedule and transport support.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_22',
    title: 'Exercise 22: Community Park Redevelopment Proposal (2023)',
    scenario:
      'You are a resident of Green Valley district. You received a notice from the Local Council.\nDear Resident,\nThe city council has allocated funds to upgrade Green Valley Park. We have two proposals: building an outdoor fitness zone and cycling track, or creating a quiet botanical garden with a children’s play area.\nWe invite residents to share their views and any additional ideas.\nYours sincerely,\nCity Council',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a letter to your neighbour.\n• tell them about the park upgrade notice\n• say which proposal you like better\n• encourage them to write to the council too.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the City Council.\n• welcome the park upgrade initiative\n• state which proposal benefits the community most and why\n• suggest combining elements or adding better street lighting.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_23',
    title: 'Exercise 23: Language Center Exam Preparation Workshop (2024)',
    scenario:
      'You are preparing for an English exam at a language center. You received an email from the Academic Director.\nDear Student,\nWe are organizing an intensive weekend mock exam workshop next month. Due to limited classroom space, we can either hold a full 4-skill mock exam on Saturday or split Speaking and Writing feedback sessions across two evenings.\nPlease let us know your preference and what areas you struggle with most.\nBest regards,\nAcademic Director',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a message to your study partner.\n• tell them about the upcoming mock workshop\n• explain which schedule suits you best\n• ask if they want to attend together.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Academic Director.\n• thank them for organizing the intensive workshop\n• explain which schedule format you prefer and why\n• request detailed individual feedback on Writing Task 2.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_24',
    title: 'Exercise 24: Annual Charity Marathon Route Change (2025)',
    scenario:
      'You registered for the City Charity Marathon. You received an email from the Event Organizer.\nDear Runner,\nDue to roadworks in the city center, we must change the marathon route. We can either move the race to the riverside park trail on the same date, or postpone the city-center race by three weeks.\nPlease share your preference as soon as possible.\nKind regards,\nEvent Team',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write an email to a friend who is also running.\n• explain the sudden route problem\n• share your opinion on the two options\n• suggest training together this weekend.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Event Organizer.\n• express your understanding of the roadwork issue\n• state whether you prefer the riverside route or postponement\n• suggest providing clear route maps and water stations.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_25',
    title: 'Exercise 25: Museum Volunteering Programme Schedule (2023)',
    scenario:
      'You are a volunteer guide at the National History Museum. You received an email from the Volunteer Coordinator.\nDear Volunteer,\nNext month we are welcoming several international tourist groups. We need volunteers to cover either morning guided tours in English or afternoon digital audio-desk assistance.\nAdditionally, we are planning a training seminar. Please let us know your availability and suggestions for the seminar.\nWarm regards,\nVolunteer Coordinator',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a message to another volunteer.\n• mention the new international tourist groups\n• say which shift you want to take\n• ask which shift they are choosing.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Volunteer Coordinator.\n• express enthusiasm for welcoming international visitors\n• state your preferred shift and explain your relevant skills\n• suggest topics for the upcoming training seminar.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_26',
    title: 'Exercise 26: University Cafeteria Menu & Pricing Update (2024)',
    scenario:
      'You are a university student. You received an email from the Campus Catering Manager.\nDear Student,\nDue to rising food costs, we are reviewing our campus cafeteria service. We can either slightly increase the price of hot meals while keeping portion sizes large, or keep current prices by offering a smaller, simplified daily menu.\nWe value student feedback before making this change.\nSincerely,\nCatering Manager',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a letter to your classmate.\n• explain the cafeteria’s plan\n• say how you feel about food prices on campus\n• suggest what option students should vote for.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Catering Manager.\n• share your view on the current cafeteria food quality\n• explain which pricing/menu option is fairer for students\n• recommend introducing a discounted student meal deal.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_27',
    title: 'Exercise 27: Residential Building Parking Rules (2025)',
    scenario:
      'You live in an apartment complex. You received a letter from the Building Management.\nDear Resident,\nBecause of severe parking shortages in the evening, we plan to introduce permit-only parking. Each apartment will receive one free permit, and guest cars will only be allowed for two hours.\nAlternatively, we could convert part of the courtyard into extra parking spaces. Please send us your opinion.\nRegards,\nBuilding Management',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a message to your neighbour.\n• tell them about the parking proposal\n• express your concern about guest parking or the courtyard\n• suggest discussing it at the residents’ meeting.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Building Management.\n• describe how the parking shortage affects residents\n• state whether you support permits or courtyard conversion\n• propose a fair solution for visitors on weekends.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_28',
    title: 'Exercise 28: International Student Exchange Orientation (2024)',
    scenario:
      'You are helping organize the International Student Orientation Week at your university. You received an email from the International Office.\nDear Student Ambassador,\nBecause of budget adjustments, we can only fund one major weekend event for new exchange students: either a one-day cultural excursion to Samarkand or a two-day campus festival with traditional music and cuisine.\nWhich event do you recommend and why?\nBest wishes,\nInternational Office',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a message to a fellow Student Ambassador.\n• inform them about the budget limit\n• share which event you think exchange students would love more\n• ask for their opinion.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the International Office.\n• explain the importance of a memorable welcome event\n• justify your choice between the excursion and the campus festival\n• suggest ways student volunteers can help reduce costs.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_29',
    title: 'Exercise 29: Local Swimming Pool Maintenance Closure (2025)',
    scenario:
      'You have a monthly membership at the Dolphin Aquatics Center. You received an email from the Center Director.\nDear Member,\nOur main olympic pool will be closed for two weeks next month for water-filtration upgrades. During this period, members can either freeze their membership for free or use our partner gym and spa across town at no extra cost.\nPlease let us know how you would like to proceed.\nKind regards,\nCenter Director',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a note to your swimming partner.\n• explain why the pool is closing next month\n• say how you feel about interrupting your training\n• suggest which compensation option to choose.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Center Director.\n• express your disappointment about the sudden closure\n• state which membership compensation option you choose\n• suggest scheduling future maintenance during public holidays.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
  {
    id: 'ml_w1_ex_30',
    title: 'Exercise 30: Photography Club Annual Exhibition Format (2026)',
    scenario:
      'You belong to a city Photography Club. You received an email from the Club President.\nDear Member,\nFor our annual exhibition this autumn, the art gallery has increased its rental fee. We can either pay a small entry fee per member to keep the physical gallery exhibition, or host a free interactive 3D virtual gallery online.\nWe would love to hear your thoughts before Friday.\nWarm regards,\nClub President',
    task1_1: {
      type: 'informal_email',
      prompt: 'Write a letter to a friend in the club.\n• tell them about the gallery rental fee increase\n• express your feelings about online vs physical exhibitions\n• suggest what you both should recommend.',
      wordLimit: '~50 words',
      timeMinutes: 10,
    },
    task1_2: {
      type: 'formal_letter',
      prompt: 'Write a letter to the Club President.\n• thank them for consulting club members\n• explain whether you prefer the physical gallery or virtual exhibition\n• suggest finding a local café or library as a free exhibition venue.',
      wordLimit: '120-150 words',
      timeMinutes: 20,
    },
  },
];

// 25 Additional Authentic 2022–2026 Multilevel Task 2 Topics (bringing total to 50)
const EXTRA_TASK2_TOPICS: MultilevelWritingTask2Topic[] = [
  {
    id: 'ml_w2_26',
    number: 26,
    category: 'EDUCATION',
    title: 'Should university education be free for all students?',
    prompt:
      'You are participating in an online discussion for students and educators.\nThe question is: "Should university education be completely free for all students?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, access to higher education is one of the most important factors in social progress. Although funding universities is expensive for taxpayers, I believe tuition should be free or heavily subsidized for talented students because education benefits the entire country.\nOne major advantage is equal opportunity. Many bright students from low-income families hesitate to apply to university due to high tuition fees. When higher education is affordable, society gains more qualified doctors, engineers, and teachers.\nHowever, making university completely free for everyone can sometimes lead to overcrowded lectures and lower student motivation. Therefore, I believe the best approach is to provide free places based on academic merit and financial need, ensuring both fairness and high academic standards.',
  },
  {
    id: 'ml_w2_27',
    number: 27,
    category: 'EDUCATION',
    title: 'Are online courses as effective as traditional classroom learning?',
    prompt:
      'You are participating in an online forum about modern learning.\nThe question is: "Are online courses as effective as traditional classroom learning?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my view, online learning has transformed education over the past few years. While digital platforms offer incredible flexibility, I believe they cannot completely replace traditional face-to-face classrooms.\nOn the one hand, online courses allow students to learn at their own pace and access lectures from anywhere in the world. This is particularly beneficial for working adults or students living in remote areas.\nOn the other hand, traditional classrooms provide direct interaction, immediate feedback from teachers, and valuable socialization with peers. Many learners also struggle with self-discipline when studying alone at home. In conclusion, a blended model that combines digital resources with classroom discussion is the most effective solution.',
  },
  {
    id: 'ml_w2_28',
    number: 28,
    category: 'TECHNOLOGY',
    title: 'Will electric vehicles solve urban air pollution?',
    prompt:
      'You are participating in an online discussion about transport and technology.\nThe question is: "Will switching to electric vehicles completely solve urban air pollution?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, electric vehicles play a vital role in reducing tailpipe emissions in crowded cities. However, I do not believe they alone can completely solve urban air and traffic problems.\nFirstly, replacing petrol and diesel cars with electric ones significantly improves street-level air quality and reduces noise pollution. Cities that encourage electric buses and taxis already experience cleaner air.\nNevertheless, electric cars still cause traffic congestion and require massive amounts of electricity, which in many countries is still generated by burning fossil fuels. Furthermore, manufacturing car batteries has its own environmental cost. Therefore, governments should combine electric vehicle incentives with strong investment in metro systems, cycling lanes, and renewable energy.',
  },
  {
    id: 'ml_w2_29',
    number: 29,
    category: 'BUSINESS & WORK',
    title: 'Should companies introduce a four-day working week?',
    prompt:
      'You are participating in an online discussion about modern workplaces.\nThe question is: "Should companies reduce the standard working week to four days?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, the idea of a four-day working week has gained popularity for good reason. Although some industries require continuous staffing, I believe a shorter workweek can boost both employee well-being and overall productivity.\nWhen workers have a three-day weekend, they return to the office well-rested, motivated, and less likely to suffer from burnout. Recent trials in several countries have shown that employees often accomplish the same amount of work in four focused days by reducing unnecessary meetings.\nOf course, small businesses and hospitals may need flexible shift arrangements to make this system work. Overall, if implemented carefully, a four-day week creates a healthier balance between professional and family life.',
  },
  {
    id: 'ml_w2_30',
    number: 30,
    category: 'SOCIETY & COMMUNITY',
    title: 'Is cashless payment better for society than paper money?',
    prompt:
      'You are participating in an online discussion about everyday life.\nThe question is: "Is a completely cashless society a positive or negative development?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, the rapid shift toward mobile banking and card payments has made daily transactions much faster and safer. However, eliminar paper money completely would create serious challenges for certain groups in society.\nThe main benefit of digital payment is convenience. People no longer need to carry heavy coins, and businesses can track their sales transparently, which also helps reduce tax evasion and street theft.\nOn the other hand, elderly citizens and people in rural areas with unstable internet connections still rely on physical cash. Moreover, technical outages or cyberattacks can temporarily freeze digital systems. For these reasons, society should embrace digital payments while keeping cash available as a reliable backup.',
  },
  {
    id: 'ml_w2_31',
    number: 31,
    category: 'HEALTH & LIFESTYLE',
    title: 'Should governments tax sugary drinks and fast food?',
    prompt:
      'You are participating in an online discussion about public health.\nThe question is: "Should governments impose higher taxes on sugary drinks and junk food?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, rising rates of obesity and diabetes require urgent action from governments. While personal choice is important, I support placing higher taxes on sugary drinks and ultra-processed fast food.\nPrice is a powerful motivator for consumers. When sugary beverages become more expensive, families—and especially teenagers—naturally reduce their daily consumption. In addition, food manufacturers often reformulate their recipes to lower sugar levels and avoid the tax.\nHowever, taxation alone is not enough if healthy food remains expensive. Governments should use the revenue collected from junk-food taxes to subsidize fresh fruit, vegetables, and school nutrition programmes.',
  },
  {
    id: 'ml_w2_32',
    number: 32,
    category: 'ENVIRONMENT',
    title: 'Should fast fashion be regulated to protect the environment?',
    prompt:
      'You are participating in an online discussion about consumer habits and nature.\nThe question is: "Should governments regulate the fast-fashion industry to reduce textile waste?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, the fast-fashion industry has created a massive environmental crisis that requires stricter regulation. Cheap, low-quality clothing encourages people to buy garments they wear only two or three times before throwing them away.\nProducing these clothes consumes huge quantities of freshwater and releases chemical dyes into rivers. Millions of tons of synthetic textiles end up in landfills every year because they cannot decompose naturally.\nWhile consumers should try to buy fewer, higher-quality clothes, individual action is not sufficient. Governments must require clothing brands to use recycled fibers and take financial responsibility for recycling old garments.',
  },
  {
    id: 'ml_w2_33',
    number: 33,
    category: 'EDUCATION',
    title: 'Should primary school children be given daily homework?',
    prompt:
      'You are participating in an online discussion for teachers and parents.\nThe question is: "Is daily homework beneficial or harmful for primary school children?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, young children in primary school should not be burdened with heavy daily homework. Although short reading practice at home is helpful, long written assignments often cause unnecessary stress for both children and parents.\nAfter spending five or six hours in a classroom, young learners need time for outdoor play, hobbies, and family interaction, which are essential for their emotional and physical development.\nInstead of repetitive worksheets, primary schools should encourage children to read storybooks for twenty minutes each evening or explore nature with their families. This keeps children curious and prevents them from losing enthusiasm for learning.',
  },
  {
    id: 'ml_w2_34',
    number: 34,
    category: 'CULTURE & GLOBAL SOCIETY',
    title: 'Should museums and historical monuments be free for everyone?',
    prompt:
      'You are participating in an online discussion about culture and heritage.\nThe question is: "Should admission to public museums and art galleries be free for all visitors?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, national museums and historical galleries preserve the shared heritage of a country and should be accessible to everyone, regardless of income. Making admission free encourages families and students to visit cultural institutions regularly.\nWhen museums charge high ticket prices, many local residents—especially low-income families—are excluded from learning about their own history and art. Free entry turns museums into vibrant educational spaces for the whole community.\nTo cover maintenance costs, museums can charge fees for special temporary exhibitions or ask international tourists for a modest contribution while keeping general entry free for local citizens and students.',
  },
  {
    id: 'ml_w2_35',
    number: 35,
    category: 'TECHNOLOGY',
    title: 'Are smart home devices a threat to personal privacy?',
    prompt:
      'You are participating in an online discussion about modern technology.\nThe question is: "Do the conveniences of smart home devices outweigh the risks to personal privacy?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, smart home technology offers remarkable convenience and energy efficiency, but users must be cautious about privacy risks. Voice assistants, smart thermostats, and security cameras make daily routines much easier and help households save electricity.\nHowever, these devices constantly collect data about our habits, conversations, and schedules. If companies do not secure this information properly, it can be misused by advertisers or targeted by hackers.\nUltimately, the benefits can outweigh the risks only if strict data-protection laws are enforced and users are given simple controls to turn off microphones and data tracking whenever they wish.',
  },
  {
    id: 'ml_w2_36',
    number: 36,
    category: 'SOCIETY & COMMUNITY',
    title: 'Why are more young people leaving rural villages for big cities?',
    prompt:
      'You are participating in an online discussion about regional development.\nThe question is: "How can governments encourage young people to stay in or return to rural areas?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, young people move to major cities primarily because rural areas lack well-paid jobs, modern universities, and entertainment facilities. If this trend continues, cities will become overcrowded while rural communities lose their workforce.\nTo reverse this migration, governments must invest in high-speed internet, reliable public transport, and modern healthcare in provincial towns. High-speed internet, in particular, allows young professionals to work remotely for national or international companies while enjoying the lower cost of living in the countryside.\nFurthermore, offering tax incentives and low-interest loans to young entrepreneurs who open businesses in rural districts can create vibrant local economies.',
  },
  {
    id: 'ml_w2_37',
    number: 37,
    category: 'BUSINESS & WORK',
    title: 'Is changing jobs frequently better than staying with one company?',
    prompt:
      'You are participating in an online discussion about career development.\nThe question is: "Is it better for young professionals to change jobs every few years or stay with one employer?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, changing jobs every few years early in one’s career offers significant advantages in today’s fast-changing economy. Unlike in the past, staying at a single company for decades rarely guarantees rapid salary growth or diverse skill development.\nWorking in different organizations exposes young professionals to new management styles, technologies, and professional networks. This adaptability makes them more resilient and valuable in the job market.\nHowever, changing jobs too frequently—such as every few months—can prevent employees from gaining deep expertise or leadership trust. Therefore, moving to a new role every three to four years strikes the ideal balance.',
  },
  {
    id: 'ml_w2_38',
    number: 38,
    category: 'ENVIRONMENT',
    title: 'How can individuals and governments tackle freshwater scarcity?',
    prompt:
      'You are participating in an online discussion about natural resources.\nThe question is: "What are the most effective ways to conserve freshwater in our region?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, freshwater scarcity has become one of the most urgent environmental challenges in Central Asia and around the world. Addressing this issue requires coordinated action from both agriculture and ordinary citizens.\nSince agriculture consumes the largest share of water, governments should help farmers replace outdated open-canal irrigation with modern drip-irrigation systems. Repairing leaking urban water pipes is equally essential.\nAt the same time, individuals can make a real difference by installing water-saving taps, fixing household leaks promptly, and avoiding wasteful habits like washing cars with drinking water. Combining modern technology with public awareness is the only sustainable path forward.',
  },
  {
    id: 'ml_w2_39',
    number: 39,
    category: 'EDUCATION',
    title: 'Should Art and Music receive as much school time as Science and Math?',
    prompt:
      'You are participating in an online discussion about school curriculums.\nThe question is: "Are creative subjects like Art and Music as important at school as STEM subjects?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, while Science, Technology, Engineering, and Mathematics (STEM) are vital for modern careers, creative subjects like Art, Music, and Literature play an equally indispensable role in a child’s education.\nStudying arts develops imagination, emotional intelligence, and critical thinking—qualities that even the most advanced computers cannot easily replicate. Many successful engineers and scientists credit music or drawing for helping them think creatively when solving complex technical problems.\nMoreover, not every child has the same talents. Reducing creative lessons would make school dull and demotivating for artistically gifted students. A balanced curriculum nurtures well-rounded human beings.',
  },
  {
    id: 'ml_w2_40',
    number: 40,
    category: 'HEALTH & LIFESTYLE',
    title: 'Does social media do more harm than good to teenagers’ mental health?',
    prompt:
      'You are participating in an online discussion about youth well-being.\nThe question is: "How does social media affect teenagers’ mental health, and how can negative effects be reduced?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, although social media helps teenagers stay connected with friends and learn about global trends, excessive use often harms their self-esteem and mental well-being.\nThe biggest problem is constant social comparison. Teenagers spend hours scrolling through heavily edited photos of influencers’ seemingly perfect lives, which can make them feel dissatisfied with their own appearance and achievements. Cyberbullying and late-night scrolling also disrupt sleep.\nTo reduce these harms, platforms should restrict addictive algorithms for underage users, while parents and schools should encourage offline sports, clubs, and open conversations about digital reality.',
  },
  {
    id: 'ml_w2_41',
    number: 41,
    category: 'SOCIETY & COMMUNITY',
    title: 'Should cities ban private cars from historic city centers?',
    prompt:
      'You are participating in an online discussion about urban planning.\nThe question is: "Should private cars be banned from city centers to create pedestrian-only zones?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, transforming congested city centers into pedestrian-friendly zones is a highly positive step for modern cities. When historic streets are filled with cars, exhaust fumes and noise ruin the atmosphere for both residents and tourists.\nCreating car-free zones makes streets safer for families, cyclists, and elderly pedestrians. Contrary to fears that banning cars hurts commerce, experience in many European and Asian cities shows that foot traffic actually increases sales for local cafés and shops.\nHowever, before banning private cars, authorities must provide convenient park-and-ride facilities, metro links, and special access for delivery vans and disabled residents.',
  },
  {
    id: 'ml_w2_42',
    number: 42,
    category: 'CULTURE & GLOBAL SOCIETY',
    title: 'Does hosting major international sports events benefit a country?',
    prompt:
      'You are participating in an online discussion about sports and economics.\nThe question is: "Do the benefits of hosting major international sporting events outweigh the huge financial costs?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, hosting international tournaments such as the Olympic Games or Asian Games can bring national pride and global attention, but the benefits only outweigh the costs if the infrastructure is planned sustainably.\nOn the positive side, major events accelerate investment in airports, public transport, and hotels, which continues to serve citizens long after the games end. They also inspire young people to participate in sports.\nHowever, in some countries, expensive stadiums sit empty and unused after the closing ceremony, leaving taxpayers with heavy debt. Therefore, host cities should use existing venues or design stadiums that can be converted into community sports centers afterward.',
  },
  {
    id: 'ml_w2_43',
    number: 43,
    category: 'TECHNOLOGY',
    title: 'Will artificial intelligence replace human artists and writers?',
    prompt:
      'You are participating in an online discussion about AI and creativity.\nThe question is: "Can artificial intelligence ever truly replace human writers, musicians, and artists?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, although artificial intelligence can generate impressive illustrations, melodies, and texts in seconds, it will never replace genuine human artistry.\nAI systems work by analyzing and remixing millions of existing human works, which makes them useful tools for brainstorming or routine design tasks. However, true art comes from lived human emotion—grief, love, cultural memory, and personal struggle—experiences that a machine cannot feel.\nAudiences value art not just for the final product, but for the human story and perspective behind it. Rather than replacing artists, AI will likely become an assistant that frees creators from repetitive technical work.',
  },
  {
    id: 'ml_w2_44',
    number: 44,
    category: 'EDUCATION',
    title: 'Is taking a gap year before university a good idea?',
    prompt:
      'You are participating in an online discussion for high-school graduates.\nThe question is: "Should high-school graduates take a gap year to work or travel before starting university?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, taking a well-planned gap year between high school and university can be extremely beneficial for young adults. Many eighteen-year-olds feel pressured to choose a degree subject before they truly understand their own strengths and career goals.\nSpending a year working, interning, or volunteering helps young people develop financial responsibility, maturity, and real-world communication skills. As a result, they often begin their university studies with much clearer motivation.\nOf course, an unstructured gap year spent idly at home can cause students to lose study habits. Therefore, a gap year is valuable only when spent on purposeful work or skill-building.',
  },
  {
    id: 'ml_w2_45',
    number: 45,
    category: 'CRIME & SAFETY',
    title: 'Is education and rehabilitation better than long prison sentences?',
    prompt:
      'You are participating in an online discussion about justice and society.\nThe question is: "Should prisons focus more on rehabilitating offenders through education than on punishment?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, while dangerous criminals must be kept away from the public, the primary goal of a modern justice system should be rehabilitation rather than mere punishment.\nMost prisoners eventually return to society. If they spend years in prison without learning any vocational skills or addressing the root causes of their behaviour, they are very likely to reoffend because they cannot find legal employment.\nProviding trade training, psychological counselling, and basic education inside prisons gives former offenders a genuine chance to rebuild their lives as productive citizens, which ultimately makes communities much safer.',
  },
  {
    id: 'ml_w2_46',
    number: 46,
    category: 'ENVIRONMENT',
    title: 'Should supermarkets ban single-use plastic bags completely?',
    prompt:
      'You are participating in an online discussion about everyday environmental habits.\nThe question is: "Should single-use plastic bags be completely banned in all supermarkets and markets?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, banning single-use plastic bags in supermarkets is one of the simplest and most effective policies to reduce everyday pollution. Millions of thin plastic bags are used for just twenty minutes to carry groceries home and then remain in the environment for centuries.\nCountries that have introduced bans or charges on plastic bags have seen a dramatic drop in street litter and river pollution within months. Shoppers quickly adapt to carrying durable cloth bags or biodegradable alternatives.\nTo make the transition smooth, stores should offer affordable reusable bags at the checkout and encourage customers with loyalty points.',
  },
  {
    id: 'ml_w2_47',
    number: 47,
    category: 'BUSINESS & WORK',
    title: 'Should teenagers have a part-time job while studying?',
    prompt:
      'You are participating in an online discussion for students and parents.\nThe question is: "Do the benefits of having a part-time job while studying outweigh the drawbacks?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, working a modest part-time job—such as eight to ten hours a week—brings valuable benefits to older teenagers and university students. Earning their own pocket money teaches young people the value of hard work, time management, and customer communication.\nFurthermore, having workplace experience on a CV gives graduates a strong advantage when applying for their first full-time career.\nHowever, working long late-night shifts can cause exhaustion and lower academic grades. As long as working hours are strictly limited during exam periods, part-time employment is a great preparation for adult life.',
  },
  {
    id: 'ml_w2_48',
    number: 48,
    category: 'HEALTH & LIFESTYLE',
    title: 'Is preventive healthcare more important than hospital treatment?',
    prompt:
      'You are participating in an online discussion about healthcare policy.\nThe question is: "Should governments spend more money on preventing illness than on treating sick patients?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, while hospitals and emergency treatments must always be properly funded, governments should invest a much larger share of their budgets in preventive healthcare.\nMany chronic illnesses—such as heart disease, type-2 diabetes, and hypertension—can be prevented through regular check-ups, vaccination programmes, public sports facilities, and healthy-eating campaigns. Preventing a disease is not only far less painful for the individual, but also much cheaper for the national healthcare system than years of hospital surgery and medication.\nA balanced strategy that prioritizes early screening and healthy lifestyles benefits everyone.',
  },
  {
    id: 'ml_w2_49',
    number: 49,
    category: 'CULTURE & GLOBAL SOCIETY',
    title: 'Will printed books and newspapers disappear in the future?',
    prompt:
      'You are participating in an online discussion about reading and media.\nThe question is: "Will e-books and digital news completely replace printed books and newspapers?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, while daily printed newspapers may eventually disappear because people prefer instant online news updates, printed books will continue to thrive for generations to come.\nE-books and audiobooks are undeniably convenient for commuters and travellers who want to carry an entire library on a single device. However, after staring at computer and phone screens all day for work or study, many readers crave the tactile pleasure of holding a real paper book.\nStudies also suggest that people concentrate more deeply and remember information better when reading on paper without digital notifications.',
  },
  {
    id: 'ml_w2_50',
    number: 50,
    category: 'SOCIETY & COMMUNITY',
    title: 'How can we bridge the generation gap between youth and elders?',
    prompt:
      'You are participating in an online discussion about family and society.\nThe question is: "Why is there a growing gap between younger and older generations, and how can they understand each other better?"\nPost your response, giving reasons and examples.\nWrite 180-200 words.',
    wordLimit: '180-200 words',
    modelResponse:
      'In my opinion, the rapid pace of technological and social change has widened the gap between younger and older generations. Young people grow up immersed in digital culture, whereas older generations often value traditional face-to-face communication and stability.\nThis difference can lead to misunderstandings within families and workplaces. However, both generations have a great deal to teach each other. Teenagers can help older relatives navigate smartphones and online services, while elders can share life wisdom, patience, and family history.\nSpending regular device-free family meals and organizing intergenerational community projects can build mutual respect and stronger family bonds.',
  },
];

// 20 Additional Authentic 2022–2026 Multilevel Speaking Part 2 Cue Cards (bringing total to 50)
const EXTRA_PART2_TOPICS: MultilevelPart2[] = [
  {
    id: 'ml_p2_31',
    source: 'Official Multilevel 2024',
    title: 'Describe a skill you learned online without a teacher',
    questions: [
      'What skill you learned and why you chose it',
      'How you practiced it using online resources',
      'What difficulties you faced while learning alone',
      'And explain how this skill has helped you in daily life',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_32',
    source: 'Official Multilevel 2024',
    title: 'Describe an environmental problem in your city or region',
    questions: [
      'What the environmental issue is',
      'What causes this problem in your area',
      'How it affects local residents’ daily lives',
      'And suggest what authorities and citizens can do to solve it',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_33',
    source: 'Official Multilevel 2025',
    title: 'Describe a time when you had to make a difficult financial decision',
    questions: [
      'What the decision was about',
      'What options you had to consider',
      'Who gave you advice or helped you decide',
      'And explain whether you were happy with the final outcome',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_34',
    source: 'Official Multilevel 2025',
    title: 'Describe a historical place in Uzbekistan you would recommend to tourists',
    questions: [
      'Where this historical place is located',
      'What visitors can see and experience there',
      'Why it is historically or culturally important',
      'And explain why foreign tourists would find it memorable',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_35',
    source: 'Official Multilevel 2023',
    title: 'Describe a time when you worked in a team to achieve a goal',
    questions: [
      'What the project or goal was',
      'Who your team members were and what role you played',
      'What challenges your team overcame together',
      'And explain what you learned about teamwork from this experience',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_36',
    source: 'Official Multilevel 2024',
    title: 'Describe a book or article that changed your perspective on a topic',
    questions: [
      'What the book or article was about',
      'When and why you decided to read it',
      'How it changed your previous opinion',
      'And explain why you would recommend it to others',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_37',
    source: 'Official Multilevel 2025',
    title: 'Describe a piece of modern technology that saves you a lot of time',
    questions: [
      'What the technology or app is',
      'How often and for what tasks you use it',
      'How you used to do those tasks before having it',
      'And explain whether there are any downsides to relying on it',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_38',
    source: 'Official Multilevel 2023',
    title: 'Describe a teacher or mentor who inspired you to work harder',
    questions: [
      'Who this person is and how you met them',
      'What subject or life skill they taught you',
      'How they motivated you during a difficult time',
      'And explain how their influence still affects you today',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_39',
    source: 'Official Multilevel 2024',
    title: 'Describe a healthy habit you recently started following',
    questions: [
      'What the healthy routine or habit is',
      'What motivated you to start doing it',
      'Why it was challenging to keep up at the beginning',
      'And explain how it has improved your physical or mental energy',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_40',
    source: 'Official Multilevel 2025',
    title: 'Describe a small local business in your neighbourhood that you admire',
    questions: [
      'What kind of products or services the business offers',
      'How long it has been operating in your area',
      'Why customers prefer it over large supermarkets or chains',
      'And explain why small businesses are important for local communities',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_41',
    source: 'Official Multilevel 2024',
    title: 'Describe an unforgettable journey where something went wrong',
    questions: [
      'Where you were travelling and with whom',
      'What unexpected problem happened during the trip',
      'How you and your companions solved the situation',
      'And explain what lesson this trip taught you about travelling',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_42',
    source: 'Official Multilevel 2025',
    title: 'Describe a public park or green space where you like to relax',
    questions: [
      'Where the park is located in your town or city',
      'What facilities or natural features it has',
      'What activities people of different ages do there',
      'And explain why green spaces are essential in modern cities',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_43',
    source: 'Official Multilevel 2023',
    title: 'Describe a traditional festival or celebration in your country',
    questions: [
      'When and how this festival is celebrated',
      'What special foods or customs are associated with it',
      'How you and your family usually spend this day',
      'And explain why preserving such traditions matters for young people',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_44',
    source: 'Official Multilevel 2024',
    title: 'Describe a time when you helped a stranger or someone in your community',
    questions: [
      'Who the person was and what situation they were in',
      'How you noticed they needed assistance',
      'What you did to help them solve their problem',
      'And explain how you felt afterward',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_45',
    source: 'Official Multilevel 2025',
    title: 'Describe a job or career you think will become very popular in the future',
    questions: [
      'What the profession is and what skills it requires',
      'Why demand for this career is growing rapidly',
      'What challenges people in this field might face',
      'And explain whether you would consider pursuing this career yourself',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_46',
    source: 'Official Multilevel 2024',
    title: 'Describe a time when you had to speak in front of a large group of people',
    questions: [
      'When and where the event took place',
      'What topic you were presenting or speaking about',
      'How you prepared and managed your nervousness',
      'And explain how the audience reacted to your talk',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_47',
    source: 'Official Multilevel 2025',
    title: 'Describe an advertisement that persuaded you or someone you know to buy a product',
    questions: [
      'Where you saw or heard the advertisement',
      'What product or service it was promoting',
      'What made the advertisement memorable or convincing',
      'And explain whether the product lived up to its promise',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_48',
    source: 'Official Multilevel 2023',
    title: 'Describe a sport or physical activity you would like to try in the future',
    questions: [
      'What the sport or activity is',
      'Where and how it is played or practiced',
      'What equipment or physical preparation is needed',
      'And explain why this particular sport appeals to you',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_49',
    source: 'Official Multilevel 2025',
    title: 'Describe a piece of good news you received recently',
    questions: [
      'What the news was and who told you about it',
      'Why this news was so important to you or your family',
      'What your immediate reaction was when you heard it',
      'And explain how you celebrated the occasion',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p2_50',
    source: 'Official Multilevel 2026',
    title: 'Describe an AI tool or educational website you use for learning',
    questions: [
      'How you discovered this platform or tool',
      'What features make it useful for your studies',
      'How it compares with studying from traditional textbooks',
      'And explain how you balance using technology with independent thinking',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
];

// 18 Additional Authentic 2022–2026 Multilevel Speaking Part 3 Debate Statements (bringing total to 50)
const EXTRA_PART3_TOPICS: MultilevelPart3[] = [
  {
    id: 'ml_p3_33',
    source: 'Official Multilevel 2024',
    statement: 'Artificial intelligence will create more jobs than it destroys.',
    forPoints: [
      'New industries in AI engineering, data science, and robotics are emerging rapidly',
      'Automation frees workers from repetitive tasks so they can focus on creative roles',
      'Historically, every technological revolution has ultimately increased total employment',
    ],
    againstPoints: [
      'Millions of routine office, customer service, and factory jobs are disappearing quickly',
      'Many displaced workers struggle to retrain for high-tech positions',
      'Companies often use AI to cut staff costs rather than hire more employees',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_34',
    source: 'Official Multilevel 2024',
    statement: 'University degrees are no longer necessary for a successful career.',
    forPoints: [
      'Practical skills, portfolios, and professional certificates are valued more by modern employers',
      'University tuition takes years of time and money that could be spent gaining work experience',
      'Many high-paying fields like software development and digital marketing can be learned online',
    ],
    againstPoints: [
      'Professions such as medicine, law, engineering, and teaching strictly require academic degrees',
      'Universities develop critical thinking, research ability, and lifelong professional networks',
      'Graduates still statistically earn higher average lifetime salaries than non-graduates',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_35',
    source: 'Official Multilevel 2025',
    statement: 'Cash will completely disappear within the next ten years.',
    forPoints: [
      'Contactless cards and mobile QR payments are faster, cleaner, and more convenient',
      'Digital transactions help governments reduce tax evasion and financial crime',
      'Even small street vendors and buses now accept instant mobile transfers',
    ],
    againstPoints: [
      'Elderly citizens and rural residents often rely on physical cash for daily needs',
      'Power outages, internet failures, or cyberattacks can freeze digital banking systems',
      'Cash protects personal privacy and helps people control their daily spending budget',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_36',
    source: 'Official Multilevel 2025',
    statement: 'Public transport should be made completely free in all major cities.',
    forPoints: [
      'Free buses and metros would dramatically reduce private car traffic and air pollution',
      'Low-income workers and students would save a significant portion of their monthly income',
      'Fewer cars on the road mean fewer accidents and less money spent on road expansion',
    ],
    againstPoints: [
      'Providing free transit requires huge government subsidies funded by higher taxes',
      'Buses and trains might become overcrowded and poorly maintained without ticket revenue',
      'Car owners value comfort and speed, so price alone may not persuade them to switch',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_37',
    source: 'Official Multilevel 2023',
    statement: 'Working from home is more productive than working in an office.',
    forPoints: [
      'Employees save two hours of stressful daily commuting and start work with more energy',
      'Home environments allow deep focus without constant office chatter and interruptions',
      'Flexible schedules improve work-life balance and reduce sick leave',
    ],
    againstPoints: [
      'Home distractions and lack of supervision can reduce discipline and output',
      'Team brainstorming, mentoring junior staff, and company culture suffer remotely',
      'The boundary between work and personal rest blurs when the office is in your bedroom',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_38',
    source: 'Official Multilevel 2024',
    statement: 'Social media influencers have a negative impact on young people.',
    forPoints: [
      'Influencers promote unrealistic beauty standards and materialistic lifestyles',
      'Many sponsored posts encourage teenagers to buy unnecessary or unhealthy products',
      'Young people may value easy internet fame over hard study and real professions',
    ],
    againstPoints: [
      'Educational, fitness, and language influencers inspire millions of youth to learn new skills',
      'Content creation teaches digital media, entrepreneurship, and communication skills',
      'Online communities help young people find support for niche hobbies and interests',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_39',
    source: 'Official Multilevel 2025',
    statement: 'Governments should heavily tax fast food and sugary drinks.',
    forPoints: [
      'Higher prices discourage excessive consumption of junk food and reduce obesity',
      'Tax revenue can be invested in public hospitals and school sports programmes',
      'Food companies are forced to reduce sugar and salt content to avoid the tax',
    ],
    againstPoints: [
      'Food taxes unfairly burden low-income families who rely on cheap meals',
      'Adults should have the personal freedom to choose what they eat and drink',
      'Health education and affordable fresh produce are more effective than punishment taxes',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_40',
    source: 'Official Multilevel 2023',
    statement: 'Single-use plastic packaging should be banned immediately.',
    forPoints: [
      'Plastic waste pollutes oceans, harms wildlife, and takes centuries to decompose',
      'Immediate bans force manufacturers to switch to paper, glass, and biodegradable materials',
      'Gradual voluntary measures have failed to stop the rapid growth of plastic waste',
    ],
    againstPoints: [
      'Plastic is essential for keeping medical supplies and fresh food hygienic and affordable',
      'An immediate ban would raise grocery prices and disrupt supply chains',
      'Improving recycling systems and waste collection is more practical than a total ban',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_41',
    source: 'Official Multilevel 2024',
    statement: 'School exams should be replaced by continuous coursework assessment.',
    forPoints: [
      'A single two-hour exam causes extreme anxiety and does not reflect a full year of effort',
      'Projects and coursework develop practical research, teamwork, and presentation skills',
      'Continuous assessment gives teachers a fairer picture of a student’s true progress',
    ],
    againstPoints: [
      'Coursework can easily be copied from the internet or written with AI assistance',
      'Standardized exams treat all students equally under the same timed conditions',
      'Continuous deadlines throughout the year can make students feel constantly stressed',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_42',
    source: 'Official Multilevel 2025',
    statement: 'Space exploration is a waste of money when Earth has so many problems.',
    forPoints: [
      'Billions spent on rockets could fund clean water, healthcare, and poverty reduction on Earth',
      'Climate change and environmental protection on our own planet are far more urgent',
      'Only a tiny fraction of humanity directly benefits from space missions',
    ],
    againstPoints: [
      'Satellites are vital for weather forecasting, climate monitoring, GPS, and global internet',
      'Space research has produced medical, solar, and water-purification technologies used on Earth',
      'Scientific exploration inspires youth to study science and engineering',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_43',
    source: 'Official Multilevel 2024',
    statement: 'Children under the age of 14 should not be allowed to own smartphones.',
    forPoints: [
      'Smartphones expose children to cyberbullying, addictive games, and inappropriate content',
      'Screen addiction reduces outdoor physical play, face-to-face socializing, and sleep quality',
      'Simple basic phones are enough for parents to contact children for safety',
    ],
    againstPoints: [
      'Smartphones give children access to educational apps, dictionaries, and school group chats',
      'GPS tracking and instant messaging help parents ensure their child’s safety',
      'Teaching responsible digital habits early is better than a strict prohibition',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_44',
    source: 'Official Multilevel 2025',
    statement: 'International tourism harms local cultures and environments.',
    forPoints: [
      'Mass tourism causes overcrowding, litter, and damage to fragile natural and historic sites',
      'Local traditions are often commercialized and turned into artificial shows for visitors',
      'Short-term tourist rentals drive up housing prices for local residents',
    ],
    againstPoints: [
      'Tourism creates millions of jobs in hotels, restaurants, transport, and handicrafts',
      'Ticket revenue provides essential funding to restore monuments and protect national parks',
      'Cultural exchange promotes global understanding and pride in local heritage',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_45',
    source: 'Official Multilevel 2023',
    statement: 'A four-day working week should become the global standard.',
    forPoints: [
      'Well-rested employees are more focused, creative, and loyal to their companies',
      'Fewer commuting days reduce traffic congestion and carbon emissions',
      'People have more time for family care, health, and lifelong learning',
    ],
    againstPoints: [
      'Compressing 40 hours of work into four days can make workdays exhausting',
      'Service industries, factories, and hospitals cannot easily reduce operating hours',
      'Small businesses may struggle to pay full salaries for fewer working days',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_46',
    source: 'Official Multilevel 2024',
    statement: 'Zoos have no place in the 21st century and should be closed.',
    forPoints: [
      'Keeping wild animals in artificial enclosures restricts their natural instincts and causes stress',
      'High-definition nature documentaries and virtual reality can educate people without cages',
      'Wildlife should be protected in natural reserves rather than city zoos',
    ],
    againstPoints: [
      'Modern zoos run vital breeding programmes that save endangered species from extinction',
      'Seeing real animals inspires children to care about wildlife conservation',
      'Many rescued animals in zoos could not survive if released into the wild',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_47',
    source: 'Official Multilevel 2025',
    statement: 'Learning foreign languages will soon be unnecessary because of AI translation.',
    forPoints: [
      'Real-time voice and text translation earbuds are becoming highly accurate and instant',
      'Students could spend thousands of hours learning coding or science instead of grammar',
      'Business travellers and tourists can already communicate anywhere using smartphone apps',
    ],
    againstPoints: [
      'Language is deeply connected to culture, humour, empathy, and human trust',
      'Relying on a device creates a barrier in personal friendships and diplomatic negotiations',
      'Learning a second language improves memory, brain flexibility, and cognitive health',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_48',
    source: 'Official Multilevel 2024',
    statement: 'Old historic buildings in cities should be replaced with modern housing.',
    forPoints: [
      'Growing cities urgently need energy-efficient apartments and offices',
      'Maintaining crumbling old buildings is extremely expensive and sometimes unsafe',
      'Modern architecture better serves the needs of contemporary urban life',
    ],
    againstPoints: [
      'Historic architecture gives a city its unique identity, beauty, and cultural memory',
      'Heritage districts attract tourists and boost the local economy',
      'Old buildings can be renovated inside while preserving their historic facades',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_49',
    source: 'Official Multilevel 2025',
    statement: 'Financial literacy should be a compulsory subject in all secondary schools.',
    forPoints: [
      'Every young adult needs to understand budgeting, saving, taxes, and avoiding debt traps',
      'Not all parents have the financial knowledge to teach money management at home',
      'Financially literate citizens make wiser economic decisions and build a more stable society',
    ],
    againstPoints: [
      'School timetables are already crowded with core subjects like math, science, and languages',
      'Teenagers without a full-time income may find financial theory abstract and boring',
      'Basic math lessons can easily cover interest rates and percentages without a separate subject',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
  {
    id: 'ml_p3_50',
    source: 'Official Multilevel 2026',
    statement: 'Electric cars are the best solution to climate change.',
    forPoints: [
      'Electric vehicles produce zero tailpipe emissions and dramatically clean up city air',
      'When charged with solar or wind power, EVs have a much lower carbon footprint than petrol cars',
      'Battery technology is rapidly improving and becoming more recyclable',
    ],
    againstPoints: [
      'Mining lithium and cobalt for car batteries causes serious environmental damage',
      'Electric cars do not solve traffic congestion or road accidents',
      'Investing in public trains, buses, and walkable cities is far greener than private cars',
    ],
    prepSeconds: 60,
    speakingSeconds: 120,
  },
];

const rawMlBank = mlData as MultilevelBank;
const rawMlWriting = mlWritingData as MultilevelWritingBank;

export const multilevelBank: MultilevelBank = {
  part1_1_questions_43: (rawMlBank.part1_1_questions_43 || []).slice(0, 50),
  part1_1_docx_questions: (rawMlBank.part1_1_docx_questions || []).slice(0, 50),
  part1_1: (rawMlBank.part1_1 || []).slice(0, 50),
  part1_2: (rawMlBank.part1_2 || []).slice(0, 50),
  part2: [...(rawMlBank.part2 || []), ...EXTRA_PART2_TOPICS].slice(0, 50),
  part3: [...(rawMlBank.part3 || []), ...EXTRA_PART3_TOPICS].slice(0, 50),
};

export const multilevelWritingBank: MultilevelWritingBank = {
  task1_exercises: [
    ...(rawMlWriting.task1_exercises || []).map((ex) => ({
      ...ex,
      title: fixOcrText(ex.title),
      scenario: fixOcrText(ex.scenario),
    })),
    ...EXTRA_TASK1_EXERCISES,
  ].slice(0, 50),
  task2_topics: [...(rawMlWriting.task2_topics || []), ...EXTRA_TASK2_TOPICS].slice(0, 50),
};

export const multilevelOfficial43Questions = multilevelBank.part1_1_questions_43 || [];

export const getRandomMultilevelPart1_1 = (seenIds: string[] = []): MultilevelPart1_1 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part1_1.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part1_1;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part1_1[0];
};

export const getRandomMultilevelPart1_2 = (seenIds: string[] = []): MultilevelPart1_2 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part1_2.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part1_2;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part1_2[0];
};

export const getRandomMultilevelPart2 = (seenIds: string[] = []): MultilevelPart2 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part2.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part2;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part2[0];
};

export const getRandomMultilevelPart3 = (seenIds: string[] = []): MultilevelPart3 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part3.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part3;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part3[0];
};

export const getRandomWritingTask1 = (): MultilevelWritingTask1Exercise => {
  const list = multilevelWritingBank.task1_exercises;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};

export const getRandomWritingTask2 = (): MultilevelWritingTask2Topic => {
  const list = multilevelWritingBank.task2_topics;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};
