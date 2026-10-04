import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Sparkles, ChevronDown, ChevronUp, Search, RotateCcw, BookOpen, Check, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';
import { saveTestResult } from '../utils/storage';
import type { TestResultItem } from '../types';

interface Props {
  onBack: () => void;
  userName: string;
}

export interface ReadingQuestion {
  id: number;
  type: 'tfng' | 'mcq' | 'completion';
  questionText: string;
  options?: string[]; // for mcq or quick suggestions
  correctAnswer: string;
  acceptableAnswers?: string[];
  paragraphRef: string;
  evidenceQuote: string;
  paraphraseAnalysis: string;
  explanation: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: { label: string; text: string }[];
  questions: ReadingQuestion[];
}

const READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'passage_cultural_tourist',
    title: 'An Early Cultural Tourist',
    subtitle: 'IELTS Academic Reading · Passage 1',
    paragraphs: [
      {
        label: 'A',
        text: 'Today we take it for granted that we travel around the world to admire the monuments of the past. We prepare for such trips by reading about what we are going to see, set out on the journey with a good idea of how we will get there and where we will stay and have a sense of what we will encounter on location. Cyriacus of Ancona (1391–1452), the first cultural tourist since antiquity, lacked these advantages when, in the first half of the 15th century, he sailed around the Mediterranean in search of the remains of Greek and Roman civilisations.',
      },
      {
        label: 'B',
        text: 'Cyriacus first became fascinated by ancient monuments while walking in his home city Ancona and looking at the marble arch, erected in AD 115, to the Roman Emperor Trajan. He suddenly saw the structure in a new light. He no longer saw it as just a familiar and generally overlooked landmark, but as a doorway to the wonders of ancient imperial Rome. Not many people of Cyriacus\'s time were interested in historical travel, they generally ignored old buildings and structures, or worse, dismantled them for their building materials.',
      },
      {
        label: 'C',
        text: 'Cyriacus decided to see the world for himself and to record details of whatever other antiquities remained to be discovered. His training as a merchant did not prepare him for this vocation; he did not know ancient languages, history or art. However, he set out to solve these failings, first by learning Latin at the age of 30 and then adding ancient Greek. Having done this, he then set off on voyages around the Mediterranean to find, investigate and understand ancient cultures from their buildings, sculptures and inscriptions. Thus he became the first archaeologist and cultural tourist, predating other antiquarians by some 200 years.',
      },
      {
        label: 'D',
        text: 'Travel in the 15th century, however, was anything but simple or enjoyable. Overland journeys by foot or mule along bad roads, under constant threat from bandits, were bad; voyages by seas were even worse. When the weather cooperated, sailing went relatively smoothly, ships proceeded along coasts from one recognizable landmark to another. However, when there was no wind the ship did not move. Strong winds were no friends either, they drenched the ship with lashing waves and blew it off course. Water swamped the deck, splashed into the cabins and soaked mattresses, clothes and food. Remarkably, Cyriacus never complained about the miseries of travel. Optimistic by nature, he endured such hardships unafraid and saw opportunities where other people saw setbacks.',
      },
      {
        label: 'E',
        text: 'Among many of the important records made by Cyriacus was his crucial documenting, in 1431, of the remains of Cyzicus, an ancient Roman city that had relied on commerce for its financial success. He hired a local person to take him to site and then had to work out for himself the significance of the ruins he was looking at because there was no guidebook on ancient architecture to help him. Indeed, his contemporary knowledge about the ruins. Cyzicus had been a splendid city in its prime. Unfortunately, the area was highly seismic and in AD 123 the city was so devastated by a major earthquake that, when the Roman Emperor Hadrian visited it the following year, he was so saddened that he decided to subsidise a campaign to reconstruct Cyzicus. He made a substantial donation for a new temple to the Roman god Jupiter. Cyriacus thought the ruined city was awe-inspiring. He found the remains of the temple and examined it in great detail, looking for clues in ancient texts to help him understand what he was seeing. He sketched the great doorway adorned with carved foliage and mythological characters. Cyriacus\'s account of this temple is the only record of this building as in the following centuries it was entirely stripped of all its stonework and all that remains is its base.',
      },
      {
        label: 'F',
        text: 'Cyriacus also visited mainland Greece, in 1436, when no one went to Greece in order to see the country\'s ancient ruins. One of his destinations was the sanctuary of Delphi. The ancient Greeks considered Delphi as being situated in the most beautiful spot in Greece. When Cyriacus arrived at the site of Delphi, however, he found war, earthquakes and avalanches had all but obliterated its ruins. Determined to find any ancient traces, Cyriacus spent six days walking all over the areas, peering at odd stone blocks sticking out of the ground, running his hands over inscriptions to trace fragments of words, and trying to puzzle out the few surviving structural remains. Climbing uphill towards the rocks that tower over the site, he came upon a theatre built into the slope. Soon after his visit, the site was buried by a rockslide and was not seen again until archaeologists began to excavate the area systematically in the late 19th century. Cyriacus had hoped to visit Egypt and Ethiopia but he never got there. However, in his life he did record for posterity countless ancient monuments around the Mediterranean, paving the way for future archaeologists and cultural tourists.',
      },
    ],
    questions: [
      {
        id: 1,
        type: 'tfng',
        questionText: 'Cyriacus was unable to research his journeys before he left.',
        correctAnswer: 'TRUE',
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'We prepare for such trips by reading about what we are going to see... Cyriacus of Ancona... lacked these advantages when, in the first half of the 15th century, he sailed...',
        paraphraseAnalysis: '"lacked these advantages [reading in advance]" = "unable to research journeys before he left"',
        explanation: 'Paragraph A da zamonaviy sayohatchilar oldindan o\'qib o\'rganish imkoniga ega ekanligi, ammo Kyiriakus bu afzalliklardan mahrum bo\'lganligi ("lacked these advantages") aytilgan. Shuning uchun bayonot TRUE.',
      },
      {
        id: 2,
        type: 'tfng',
        questionText: 'Cyriacus was inspired to begin travelling by a Roman ruin in his city.',
        correctAnswer: 'TRUE',
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Cyriacus first became fascinated by ancient monuments while walking in his home city Ancona and looking at the marble arch, erected in AD 115, to the Roman Emperor Trajan... Cyriacus decided to see the world for himself...',
        paraphraseAnalysis: '"became fascinated by marble arch in home city Ancona" + "decided to see the world" = "inspired to begin travelling by a Roman ruin in his city"',
        explanation: 'Kyiriakus o\'z shahrida imperator Trayanning marmar arkasini ko\'rib qadimiy obidalarga qiziqib qolgan va dunyo bo\'ylab sayohat qilishga qaror qilgan (TRUE).',
      },
      {
        id: 3,
        type: 'tfng',
        questionText: 'The Roman Emperor Trajan built the city of Ancona.',
        correctAnswer: 'NOT GIVEN',
        paragraphRef: 'Paragraph B',
        evidenceQuote: '...looking at the marble arch, erected in AD 115, to the Roman Emperor Trajan.',
        paraphraseAnalysis: 'Arka Trayanga bag\'ishlab o\'rnatilgani yozilgan, ammo Trayan shaharni qurganmi-yo\'qmi bu haqda ma\'lumot yo\'q.',
        explanation: 'Matnda faqat Ankonadagi marmar arka imperator Trayanga atab qurilgani aytilgan. Ammo imperator shahar asoschisi yoki uni quruvchisi ekani haqida ma\'lumot berilmagan (NOT GIVEN).',
      },
      {
        id: 4,
        type: 'tfng',
        questionText: 'Respect for ancient architecture was widespread in the 15th century.',
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Not many people of Cyriacus\'s time were interested in historical travel, they generally ignored old buildings and structures, or worse, dismantled them for their building materials.',
        paraphraseAnalysis: '"Not many people... ignored... dismantled them" ↔ "Respect was widespread" (Qarama-qarshi)',
        explanation: 'O\'sha davrda odamlar eski binolarni mensimagan yoki qurilish uchun buzib olgan, demak qadimiy me\'morchilikka hurmat keng tarqalmagan edi (FALSE).',
      },
      {
        id: 5,
        type: 'tfng',
        questionText: 'Cyriacus\'s experience as a merchant gave him skills he needed to investigate the ancient world.',
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'His training as a merchant did not prepare him for this vocation; he did not know ancient languages, history or art.',
        paraphraseAnalysis: '"training as a merchant did not prepare him" ↔ "gave him skills he needed" (Qarama-qarshi)',
        explanation: 'Savdogarlik bo\'yicha tajribasi unga bu sohada kerakli bilimlarni bermagan, hatto qadimgi tillar va san\'atni bilmagan (FALSE).',
      },
      {
        id: 6,
        type: 'tfng',
        questionText: 'Before leaving on his journey, Cyriacus studied ancient languages.',
        correctAnswer: 'TRUE',
        paragraphRef: 'Paragraph C',
        evidenceQuote: '...first by learning Latin at the age of 30 and then adding ancient Greek. Having done this, he then set off on voyages...',
        paraphraseAnalysis: '"learning Latin... adding ancient Greek. Having done this, he then set off" = "studied ancient languages before leaving"',
        explanation: 'U safarga chiqishdan oldin 30 yoshida lotin tilini, so\'ngra qadimgi yunon tilini o\'rgangach yo\'lga chiqqan (TRUE).',
      },
      {
        id: 7,
        type: 'tfng',
        questionText: 'Travelling by sea in the 15th century was easier than travelling on land.',
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph D',
        evidenceQuote: 'Overland journeys by foot or mule along bad roads, under constant threat from bandits, were bad; voyages by seas were even worse.',
        paraphraseAnalysis: '"voyages by seas were even worse" ↔ "easier than travelling on land" (Qarama-qarshi)',
        explanation: 'Quruqlikdagi sayohat yomon bo\'lsa, dengizdagi sayohat undan ham qiyinroq va xavfliroq ("even worse") bo\'lgan (FALSE).',
      },
      {
        id: 8,
        type: 'tfng',
        questionText: 'Cyriacus tried to make his fellow sea travelers more comfortable.',
        correctAnswer: 'NOT GIVEN',
        paragraphRef: 'Paragraph D',
        evidenceQuote: 'Remarkably, Cyriacus never complained about the miseries of travel. Optimistic by nature, he endured such hardships unafraid...',
        paraphraseAnalysis: 'Uning o\'zi qiyinchiliklarga chidagani aytilgan, ammo hamrohlariga yordam bergani yoki qulaylik yaratgani tilga olinmagan.',
        explanation: 'Matnda Kyiriakusning o\'zi sayohat mashaqqatlaridan shikoyat qilmagani yozilgan, ammo hamrohlariga qulaylik yaratishga uringani haqida hech qanday ma\'lumot yo\'q (NOT GIVEN).',
      },
      {
        id: 9,
        type: 'completion',
        questionText: 'The wealth of the city of Cyzicus had come from:',
        correctAnswer: 'commerce',
        paragraphRef: 'Paragraph E',
        evidenceQuote: '...the remains of Cyzicus, an ancient Roman city that had relied on commerce for its financial success.',
        paraphraseAnalysis: '"financial success" = "wealth of the city" ; "relied on commerce" = "had come from commerce"',
        explanation: 'Kizikus shahri o\'zining moliyaviy muvaffaqiyati va boyligi uchun savdo-sotiqqa (commerce) tayangan.',
      },
      {
        id: 10,
        type: 'completion',
        questionText: '... to the ancient city ruins not available when visited by Cyriacus:',
        correctAnswer: 'guidebook',
        paragraphRef: 'Paragraph E',
        evidenceQuote: '...because there was no guidebook on ancient architecture to help him.',
        paraphraseAnalysis: '"there was no guidebook... to help him" = "guidebook not available when visited"',
        explanation: 'Kyiriakus borganida me\'morchilikka oid hech qanday qo\'llanma (guidebook) bo\'lmaganligi sababli o\'zi mustaqil tushunishga majbur bo\'lgan.',
      },
      {
        id: 11,
        type: 'completion',
        questionText: 'The city was destroyed by a powerful ... in AD 123:',
        correctAnswer: 'earthquake',
        paragraphRef: 'Paragraph E',
        evidenceQuote: '...in AD 123 the city was so devastated by a major earthquake...',
        paraphraseAnalysis: '"devastated by a major earthquake" = "destroyed by a powerful earthquake"',
        explanation: 'Milodiy 123-yilda kuchli zilzila (earthquake) tufayli shahar qattiq vayron bo\'lgan.',
      },
      {
        id: 12,
        type: 'completion',
        questionText: 'A year later Emperor Hadrian supported a ... to rebuild the city:',
        correctAnswer: 'campaign',
        paragraphRef: 'Paragraph E',
        evidenceQuote: '...he decided to subsidise a campaign to reconstruct Cyzicus.',
        paraphraseAnalysis: '"subsidise a campaign to reconstruct" = "supported a campaign to rebuild"',
        explanation: 'Imperator Adrian shaharni qayta tiklash bo\'yicha loyiha/kampaniyani (campaign) moliyalashtirgan.',
      },
      {
        id: 13,
        type: 'completion',
        questionText: 'A temple to Jupiter was built – helped by an especially large ... from Emperor Hadrian:',
        correctAnswer: 'donation',
        paragraphRef: 'Paragraph E',
        evidenceQuote: 'He made a substantial donation for a new temple to the Roman god Jupiter.',
        paraphraseAnalysis: '"substantial donation" = "especially large donation"',
        explanation: 'Imperator Yupiter ibodatxonasini barpo etish uchun katta miqdorda ehson/mablag\' (donation) bergan.',
      },
    ],
  },
  {
    id: 'passage_sleep_science',
    title: 'The Science of Sleep and Memory Consolidation',
    subtitle: 'IELTS Academic Reading · Passage 2',
    paragraphs: [
      {
        label: 'A',
        text: 'For centuries, sleep was considered a passive state in which the brain simply shut down to recover from daily fatigue. However, modern neurobiological research has revealed that the sleeping brain is highly active, performing critical cognitive functions, foremost among them being the consolidation of memories acquired during wakefulness.',
      },
      {
        label: 'B',
        text: 'During Non-Rapid Eye Movement (NREM) slow-wave sleep, electrical oscillations called slow waves synchronize across the cerebral cortex. Simultaneously, fast bursts of activity known as sleep spindles originate in the thalamus. Neuroscientists at Harvard University demonstrated that these coordinated signals facilitate the transfer of recently learned information from the temporary storage of the hippocampus to the permanent architecture of the neocortex.',
      },
      {
        label: 'C',
        text: 'Rapid Eye Movement (REM) sleep, characterized by vivid dreaming and rapid ocular saccades, serves an equally vital complementary role. While NREM sleep stabilizes declarative facts and semantic knowledge, REM sleep integrates novel emotional experiences and fosters creative problem-solving by forging unexpected neural associations across distant semantic networks.',
      },
      {
        label: 'D',
        text: 'Conversely, chronic sleep deprivation severely impairs these neurochemical processes. Individuals restricted to fewer than six hours of sleep per night exhibit a 40% reduction in hippocampal retention capacity. Furthermore, during slow-wave sleep, the brain’s glymphatic system expands, flushing out metabolic waste products including neurotoxic beta-amyloid proteins. Failure to clear these proteins is directly linked to Alzheimer’s disease and other degenerative cognitive impairments.',
      },
      {
        label: 'E',
        text: 'Across the human lifespan, the architecture of sleep changes dramatically. Infants spend up to fifty percent of their slumber in REM sleep, aiding rapid neural plasticity, whereas elderly adults experience a steep decline in slow-wave sleep spindles. Gerontologists stress that maintaining consistent circadian rhythms and adequate deep sleep preserves executive cognitive functions well into advanced age.',
      },
    ],
    questions: [
      {
        id: 14,
        type: 'tfng',
        questionText: 'Early historical theories accurately recognized that the brain remains cognitively active during sleep.',
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'For centuries, sleep was considered a passive state in which the brain simply shut down to recover from daily fatigue.',
        paraphraseAnalysis: '"sleep was considered a passive state" ↔ "accurately recognized active brain"',
        explanation: 'Tarixan uyqu miya faoliyati to\'xtaydigan passiv holat deb hisoblangan, bu esa da\'voga ziddir (FALSE).',
      },
      {
        id: 15,
        type: 'tfng',
        questionText: 'Sleep spindles are generated in the thalamus during NREM slow-wave sleep.',
        correctAnswer: 'TRUE',
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Simultaneously, fast bursts of activity known as sleep spindles originate in the thalamus.',
        paraphraseAnalysis: '"originate in the thalamus" = "generated in the thalamus"',
        explanation: 'Paragraph B da uyqu veretenolari (sleep spindles) talamusda hosil bo\'lishi to\'g\'ridan-to\'g\'ri tasdiqlangan (TRUE).',
      },
      {
        id: 16,
        type: 'tfng',
        questionText: 'REM sleep primarily consolidates factual and declarative knowledge rather than emotional integration.',
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'While NREM sleep stabilizes declarative facts and semantic knowledge, REM sleep integrates novel emotional experiences...',
        paraphraseAnalysis: '"NREM stabilizes declarative facts, REM integrates emotions" ↔ "REM primarily consolidates factual knowledge"',
        explanation: 'Faktik bilimlarni NREM uyqu mustahkamlaydi, REM esa hissiy tajriba va ijodiy bog\'lanishlarni shakllantiradi (FALSE).',
      },
      {
        id: 17,
        type: 'tfng',
        questionText: 'The Harvard University study received funding from international healthcare organizations.',
        correctAnswer: 'NOT GIVEN',
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Neuroscientists at Harvard University demonstrated that these coordinated signals facilitate the transfer...',
        paraphraseAnalysis: 'Tadqiqotchilar Garvarddan ekani aytilgan, ammo moliyalashtirish manbasi haqida hech narsa yozilmagan.',
        explanation: 'Matnda tadqiqotni moliyalashtirgan xalqaro tashkilotlar haqida hech qanday ma\'lumot berilmagan (NOT GIVEN).',
      },
      {
        id: 18,
        type: 'tfng',
        questionText: 'The glymphatic system clears beta-amyloid proteins from the brain primarily during slow-wave sleep.',
        correctAnswer: 'TRUE',
        paragraphRef: 'Paragraph D',
        evidenceQuote: '...during slow-wave sleep, the brain’s glymphatic system expands, flushing out metabolic waste products including neurotoxic beta-amyloid proteins.',
        paraphraseAnalysis: '"flushing out metabolic waste products including beta-amyloid" = "clears beta-amyloid proteins"',
        explanation: 'Chuqur uyqu paytida glimfatik tizim zaharli beta-amiloid oqsillarini miyadan tozalashi tasdiqlangan (TRUE).',
      },
      {
        id: 19,
        type: 'tfng',
        questionText: 'Elderly adults experience an increase in slow-wave sleep spindles compared to younger generations.',
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph E',
        evidenceQuote: '...whereas elderly adults experience a steep decline in slow-wave sleep spindles.',
        paraphraseAnalysis: '"steep decline" ↔ "experience an increase" (Qarama-qarshi)',
        explanation: 'Katta yoshli insonlarda uyqu veretenolari ko\'paymaydi, aksincha keskin kamayadi (FALSE).',
      },
      {
        id: 20,
        type: 'completion',
        questionText: 'Memories move from the temporary storage of the hippocampus to the permanent structure of the ...:',
        correctAnswer: 'neocortex',
        paragraphRef: 'Paragraph B',
        evidenceQuote: '...from the temporary storage of the hippocampus to the permanent architecture of the neocortex.',
        paraphraseAnalysis: '"permanent architecture of the neocortex" = "permanent structure of the neocortex"',
        explanation: 'Ma\'lumotlar gipokampdan uzoq muddatli xotira markazi bo\'lgan neokorteksga (neocortex) o\'tkaziladi.',
      },
      {
        id: 21,
        type: 'completion',
        questionText: 'Fast bursts of electrical brain signals generated in the thalamus are called sleep ...:',
        correctAnswer: 'spindles',
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Simultaneously, fast bursts of activity known as sleep spindles originate in the thalamus.',
        paraphraseAnalysis: '"fast bursts of activity known as sleep spindles"',
        explanation: 'Talamusda hosil bo\'ladigan qisqa elektr tebranishlari sleep spindles (uyqu urchuqlari) deb ataladi.',
      },
      {
        id: 22,
        type: 'completion',
        questionText: 'Creative problem-solving and emotional integration occur primarily during ... sleep:',
        correctAnswer: 'REM',
        acceptableAnswers: ['rem', 'rapid eye movement'],
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'While NREM sleep stabilizes declarative facts... REM sleep integrates novel emotional experiences and fosters creative problem-solving...',
        paraphraseAnalysis: '"REM sleep integrates novel emotional experiences and fosters creative problem-solving"',
        explanation: 'Ijodiy yondashuv va hissiyotlarni qayta ishlash asosan REM (Rapid Eye Movement) uyqu bosqichida kechadi.',
      },
      {
        id: 23,
        type: 'completion',
        questionText: 'Restricting sleep to under six hours per night causes a 40 percent reduction in ... capacity:',
        correctAnswer: 'retention',
        acceptableAnswers: ['hippocampal retention', 'retention'],
        paragraphRef: 'Paragraph D',
        evidenceQuote: 'Individuals restricted to fewer than six hours of sleep per night exhibit a 40% reduction in hippocampal retention capacity.',
        paraphraseAnalysis: '"40% reduction in hippocampal retention capacity"',
        explanation: '6 soatdan kam uxlash xotirada saqlash (retention) qobiliyatini 40 foizga pasaytiradi.',
      },
      {
        id: 24,
        type: 'completion',
        questionText: 'The neurotoxic metabolic waste product linked to Alzheimer’s disease is ...:',
        correctAnswer: 'beta-amyloid',
        acceptableAnswers: ['beta amyloid', 'beta-amyloid proteins'],
        paragraphRef: 'Paragraph D',
        evidenceQuote: '...flushing out metabolic waste products including neurotoxic beta-amyloid proteins.',
        paraphraseAnalysis: '"neurotoxic beta-amyloid proteins directly linked to Alzheimer\'s disease"',
        explanation: 'Altsgeymer xastaligiga olib keluvchi zaharli oqsil qoldiqlari beta-amiloid (beta-amyloid) deb ataladi.',
      },
      {
        id: 25,
        type: 'completion',
        questionText: 'The brain’s specialized waste-cleansing network active during slow-wave sleep is the ... system:',
        correctAnswer: 'glymphatic',
        paragraphRef: 'Paragraph D',
        evidenceQuote: 'Furthermore, during slow-wave sleep, the brain’s glymphatic system expands, flushing out metabolic waste...',
        paraphraseAnalysis: '"brain’s glymphatic system expands, flushing out metabolic waste"',
        explanation: 'Miyani chiqindilardan tozalovchi tizim glimfatik (glymphatic) tizimdir.',
      },
      {
        id: 26,
        type: 'completion',
        questionText: 'Infants spend up to fifty percent of their sleep in REM, promoting rapid neural ...:',
        correctAnswer: 'plasticity',
        paragraphRef: 'Paragraph E',
        evidenceQuote: 'Infants spend up to fifty percent of their slumber in REM sleep, aiding rapid neural plasticity...',
        paraphraseAnalysis: '"aiding rapid neural plasticity" = "promoting rapid neural plasticity"',
        explanation: 'Chaqaloqlarda REM uyqu miya neyronlarining tezkor moslashuvchanligini (plasticity) kuchaytiradi.',
      },
    ],
  },
  {
    id: 'passage_keyless_society',
    title: 'The Keyless Society',
    subtitle: 'IELTS Academic Reading · Passage 3',
    paragraphs: [
      {
        label: 'A',
        text: 'Students who want to enter the University of Montreal\'s Athletic Complex need more than just a conventional ID card - their identities must be authenticated by an electronic hand scanner. In some California housing estates, a key alone is insufficient to get someone in the door; his or her voice print must also be verified. And soon, customers at some Japanese banks will have to present their faces for scanning before they can enter the building and withdraw their money.',
      },
      {
        label: 'B',
        text: 'All of these are applications of biometrics, a little-known but fast-growing technology that involves the use of physical or biological characteristics to identify individuals. In use for more than a decade at some high-security government institutions in the United States and Canada, biometrics are now rapidly popping up in the everyday world. Already, more than 10,000 facilities, from prisons to day-care centres, monitor people\'s fingerprints or other physical parts to ensure that they are who they claim to be. Some 60 biometric companies around the world pulled in at least $22 million last year and that grand total is expected to mushroom to at least $50 million by 1999.',
      },
      {
        label: 'C',
        text: 'Biometric security systems operate by storing a digitised record of some unique human feature. When an authorised user wishes to enter or use the facility, the system scans the person\'s corresponding characteristics and attempts to match them against those on record. Systems using fingerprints, hands, voices, irises, retinas, and faces are already on the market, while others—such as those based on typing patterns and body odour—are in different stages of development.',
      },
      {
        label: 'D',
        text: 'Fingerprint scanner devices are the most universally used biometrics application due to their adoption by security forces and law enforcement over the past two decades. Today, American states use them to verify welfare payment claims and prevent multiple fraudulent applications, saving taxpayers millions of dollars. Similar pilot projects have been introduced in cities like Toronto, where fingerprint verification helps eliminate welfare fraud and identity duplication.',
      },
      {
        label: 'E',
        text: 'The hand scanner, known commercially as the HandKey, is currently the most broadly used commercial biometric system. It reads the unique three-dimensional shape, size, surface area, and asymmetry of a person\'s hand. Originally developed for high-security areas such as nuclear power plants, the HandKey made its commercial breakthrough when it was deployed at the 1996 Olympic Village in Atlanta to control access for thousands of Olympic athletes, trainers, and staff. Today, thousands of businesses and sports clubs use hand scanners for employee time-management and secure access.',
      },
      {
        label: 'F',
        text: 'Other biometric technologies are expanding quickly into public transportation and banking. Airports in countries like Malaysia are equipping terminals with facial scanners to match airline passengers with their luggage and flight tickets, preventing security breaches. Japanese banks are introducing face and iris scanners at ATMs, while residential communities in California have adopted voiceprints so that home owners can unlock doors simply by speaking. Early trials trace back as far as 1974, when an American firm first tested hand readers, but current digital processors make today\'s systems far faster and more reliable.',
      },
      {
        label: 'G',
        text: 'Despite their rapid proliferation, biometric systems face common objections and concerns regarding privacy and civil liberties. Civil liberties advocates fear that centralized databases of personal biometric profiles could be misused or linked across institutions—for example, matching health records with financial transactions or consumer habits. In Toronto, community activists protested against welfare fingerprinting, arguing that requiring welfare claimants to scan their fingers stigmatized them by treating them like suspected criminals.',
      },
      {
        label: 'H',
        text: 'Nonetheless, biometric developers and security analysts argue that the public will ultimately accept the inevitable adoption of these systems. As electronic fraud, identity theft, and security concerns escalate, traditional passwords, PINs, and keys are becoming obsolete and easily compromised. In an increasingly crowded and automated world where authentication is paramount, biometrics provide a fast, convenient, and foolproof safeguard. Proponents believe that within a few years, society will view biometrics not as an intrusion, but as an indispensable facet of daily life.',
      },
    ],
    questions: [
      {
        id: 27,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph B:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'iv - The figures say it all',
        acceptableAnswers: ['iv', 'iv - The figures say it all', '4'],
        paragraphRef: 'Paragraph B',
        evidenceQuote: 'Some 60 biometric companies around the world pulled in at least $22 million last year and that grand total is expected to mushroom to at least $50 million by 1999.',
        paraphraseAnalysis: 'Bozorning o\'sishi, moliya va statistik ko\'rsatkichlar keltirilgan: "The figures say it all" (iv).',
        explanation: 'Paragraph B da biometriya bozoridagi daromadlar ($22m dan $50m gacha) va muassasalar soni kabi raqamlar keltirilgan.',
      },
      {
        id: 28,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph C:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'vii - How does it work?',
        acceptableAnswers: ['vii', 'vii - How does it work?', '7'],
        paragraphRef: 'Paragraph C',
        evidenceQuote: 'Biometric security systems operate by storing a digitised record of some unique human feature. When an authorised user wishes to enter... the system scans the person\'s corresponding characteristics and attempts to match them...',
        paraphraseAnalysis: 'Tizimning texnik ishlash mexanizmi tushuntirilgan: "How does it work?" (vii).',
        explanation: 'Paragraph C da biometriya qanday ishlashi (namunani saqlash va tekshirish) batafsil tushuntirilgan.',
      },
      {
        id: 29,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph D:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'viii - Fighting fraud',
        acceptableAnswers: ['viii', 'viii - Fighting fraud', '8'],
        paragraphRef: 'Paragraph D',
        evidenceQuote: '...verify welfare payment claims and prevent multiple fraudulent applications, saving taxpayers millions of dollars... helps eliminate welfare fraud...',
        paraphraseAnalysis: 'Firibgarlikning oldini olish va davlat mablag\'larini tejash: "Fighting fraud" (viii).',
        explanation: 'Paragraph D da barmoq izlari orqali nafaqa bo\'yicha firibgarliklarni bartaraf etish tasvirlangan.',
      },
      {
        id: 30,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph E:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'iii - This type sells best in the shops',
        acceptableAnswers: ['iii', 'iii - This type sells best in the shops', '3'],
        paragraphRef: 'Paragraph E',
        evidenceQuote: 'The hand scanner, known commercially as the HandKey, is currently the most broadly used commercial biometric system.',
        paraphraseAnalysis: 'Tijoriy jihatdan eng ommabop va eng ko\'p sotilayotgan tizim: "This type sells best in the shops" (iii).',
        explanation: 'Paragraph E da HandKey tizimi tijoriy bozorlarda eng keng tarqalgan mahsulot ekani ko\'rsatilgan.',
      },
      {
        id: 31,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph F:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'ii - Who\'s planning what',
        acceptableAnswers: ['ii', 'ii - Who\'s planning what', '2'],
        paragraphRef: 'Paragraph F',
        evidenceQuote: 'Airports in Malaysia are equipping terminals... Japanese banks are introducing face and iris scanners... California communities have adopted voiceprints...',
        paraphraseAnalysis: 'Turli sohalar va davlatlar nimalarni rejalashtirayotgani: "Who\'s planning what" (ii).',
        explanation: 'Malayziya aeroportlari, Yaponiya banklari va Kaliforniya mahallalari qanday texnologiyalarni rejalashtirayotgani yoritilgan.',
      },
      {
        id: 32,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph G:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'i - Common objections',
        acceptableAnswers: ['i', 'i - Common objections', '1'],
        paragraphRef: 'Paragraph G',
        evidenceQuote: 'Despite their rapid proliferation, biometric systems face common objections and concerns regarding privacy and civil liberties.',
        paraphraseAnalysis: 'Aholining umumiy e\'tirozlari va inson huquqlari xavotirlari: "Common objections" (i).',
        explanation: 'Paragraph G da daxlsizlik va fuqarolik erkinliklari yuzasidan bildirilgan e\'tirozlar ta\'kidlangan.',
      },
      {
        id: 33,
        type: 'mcq',
        questionText: 'Choose the most suitable heading for Paragraph H:',
        options: [
          'i - Common objections',
          'ii - Who\'s planning what',
          'iii - This type sells best in the shops',
          'iv - The figures say it all',
          'v - Early trials',
          'vi - They can\'t get in without these',
          'vii - How does it work?',
          'viii - Fighting fraud',
          'ix - Systems to avoid',
          'x - Accepting the inevitable',
        ],
        correctAnswer: 'x - Accepting the inevitable',
        acceptableAnswers: ['x', 'x - Accepting the inevitable', '10'],
        paragraphRef: 'Paragraph H',
        evidenceQuote: 'Nonetheless, biometric developers and security analysts argue that the public will ultimately accept the inevitable adoption of these systems.',
        paraphraseAnalysis: 'Jamiyat muqarrar texnologik o\'zgarishni qabul qilishi: "Accepting the inevitable" (x).',
        explanation: 'Paragraph H da biometriyani muqarrar va kundalik zaruriyat deb qabul qilish aytib o\'tilgan.',
      },
      {
        id: 34,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: sports students',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'B - hand scanner',
        acceptableAnswers: ['B', 'B - hand scanner', 'hand scanner'],
        paragraphRef: 'Paragraph A',
        evidenceQuote: 'Students who want to enter the University of Montreal\'s Athletic Complex need more than just a conventional ID card - their identities must be authenticated by an electronic hand scanner.',
        paraphraseAnalysis: 'Athletic Complex students (sports students) = hand scanner (B).',
        explanation: 'Monreal Universiteti sport majmuasi talabalari (sports students) elektron qo\'l skaneri (B) orqali kiradi.',
      },
      {
        id: 35,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: Olympic athletes',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'B - hand scanner',
        acceptableAnswers: ['B', 'B - hand scanner', 'hand scanner'],
        paragraphRef: 'Paragraph E',
        evidenceQuote: '...deployed at the 1996 Olympic Village in Atlanta to control access for thousands of Olympic athletes, trainers, and staff.',
        paraphraseAnalysis: 'Olympic athletes = HandKey (hand scanner - B).',
        explanation: 'Atlantadagi Olimpiada shaharchasida sportchilar (Olympic athletes) uchun HandKey qo\'l skaneri (B) ishlatilgan.',
      },
      {
        id: 36,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: airline passengers',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'E - face scanner',
        acceptableAnswers: ['E', 'E - face scanner', 'face scanner'],
        paragraphRef: 'Paragraph F',
        evidenceQuote: 'Airports in countries like Malaysia are equipping terminals with facial scanners to match airline passengers with their luggage...',
        paraphraseAnalysis: 'airline passengers = facial scanners (E).',
        explanation: 'Malayziya aeroportlarida samolyot yo\'lovchilari (airline passengers) yuz skaneri (E) orqali tekshiriladi.',
      },
      {
        id: 37,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: welfare claimants',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'A - fingerprint scanner',
        acceptableAnswers: ['A', 'A - fingerprint scanner', 'fingerprint scanner'],
        paragraphRef: 'Paragraph D & G',
        evidenceQuote: 'American states use them to verify welfare payment claims... requiring welfare claimants to scan their fingers...',
        paraphraseAnalysis: 'welfare claimants = fingerprint scanner (A).',
        explanation: 'Ijtimoiy yordam oluvchilar (welfare claimants) barmoq izi skaneri (A) bilan tasdiqlanadi.',
      },
      {
        id: 38,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: business employees',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'B - hand scanner',
        acceptableAnswers: ['B', 'B - hand scanner', 'hand scanner'],
        paragraphRef: 'Paragraph E',
        evidenceQuote: 'Today, thousands of businesses and sports clubs use hand scanners for employee time-management and secure access.',
        paraphraseAnalysis: 'business employees = hand scanners (B).',
        explanation: 'Korxona va kompaniyalar xodimlari (business employees) ish vaqtini hisoblashda qo\'l skaneridan (B) foydalanadi.',
      },
      {
        id: 39,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: home owners',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'D - voiceprint',
        acceptableAnswers: ['D', 'D - voiceprint', 'voiceprint'],
        paragraphRef: 'Paragraph A & F',
        evidenceQuote: 'In some California housing estates... residential communities in California have adopted voiceprints so that home owners can unlock doors simply by speaking.',
        paraphraseAnalysis: 'home owners in housing estates = voiceprint (D).',
        explanation: 'Uy egalari (home owners) eshiklarni ochish uchun ovozli identifikatsiya (voiceprint - D) tizimidan foydalanadilar.',
      },
      {
        id: 40,
        type: 'mcq',
        questionText: 'Match the group of people to the biometric system: bank customers',
        options: [
          'A - fingerprint scanner',
          'B - hand scanner',
          'C - body odour',
          'D - voiceprint',
          'E - face scanner',
          'F - typing pattern',
        ],
        correctAnswer: 'E - face scanner',
        acceptableAnswers: ['E', 'E - face scanner', 'face scanner'],
        paragraphRef: 'Paragraph A & F',
        evidenceQuote: 'And soon, customers at some Japanese banks will have to present their faces for scanning before they can enter the building and withdraw their money.',
        paraphraseAnalysis: 'bank customers = face scanner (E).',
        explanation: 'Bank mijozlari (bank customers) Yaponiya banklarida yuz skaneridan (E) o\'tishi talab qilinadi.',
      },
    ],
  },
];

export const IeltsReadingView: React.FC<Props> = ({ onBack, userName: _userName }) => {
  const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [bandScore, setBandScore] = useState<number>(0);

  // Error Review States (User requested flow: "xatolarni ko'rish" and "tahlil qilish")
  const [showOnlyErrors, setShowOnlyErrors] = useState<boolean>(false);
  const [expandedAnalysisIds, setExpandedAnalysisIds] = useState<Record<number, boolean>>({});

  // Typography settings: clean readable text
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Start exam state (Savolni boshlashni bosmaguncha ko'rsatmaslik)
  const [isStarted, setIsStarted] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Official IELTS Academic Reading: 20 minutes per passage
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Time tracking
  const [startTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const questionsSectionRef = useRef<HTMLDivElement>(null);
  const currentPassage = READING_PASSAGES[selectedPassageIdx];

  // Auto-submit when 20 minutes expire
  useEffect(() => {
    let interval: any = null;
    if (isStarted && isTimerRunning && timeLeft > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isTimerRunning, timeLeft, isSubmitted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const checkIsCorrect = (q: ReadingQuestion, userAnswer: string | undefined): boolean => {
    if (!userAnswer) return false;
    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanCorrect = q.correctAnswer.trim().toLowerCase();

    if (cleanUser === cleanCorrect) return true;
    if (q.acceptableAnswers && q.acceptableAnswers.some((a) => a.trim().toLowerCase() === cleanUser)) {
      return true;
    }
    return false;
  };

  const handleSelectAnswer = (questionId: number, answer: string) => {
    if (isSubmitted) return;
    triggerHaptic('light');
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const calculateIeltsReadingBand = (rawScore: number): number => {
    if (rawScore >= 39) return 9.0;
    if (rawScore >= 37) return 8.5;
    if (rawScore >= 35) return 8.0;
    if (rawScore >= 33) return 7.5;
    if (rawScore >= 30) return 7.0;
    if (rawScore >= 27) return 6.5;
    if (rawScore >= 23) return 6.0;
    if (rawScore >= 19) return 5.5;
    if (rawScore >= 15) return 5.0;
    if (rawScore >= 13) return 4.5;
    if (rawScore >= 10) return 4.0;
    if (rawScore >= 8) return 3.5;
    if (rawScore >= 6) return 3.0;
    if (rawScore >= 4) return 2.5;
    return 2.0;
  };

  const handleSubmit = () => {
    let totalCorrect = 0;
    READING_PASSAGES.forEach((passage) => {
      passage.questions.forEach((q) => {
        if (checkIsCorrect(q, answers[q.id])) {
          totalCorrect += 1;
        }
      });
    });

    const totalQuestions = 40;
    const band = calculateIeltsReadingBand(totalCorrect);

    setScore(totalCorrect);
    setBandScore(band);
    setIsSubmitted(true);
    setIsTimerRunning(false);
    triggerHaptic('heavy');

    // Auto-open analyses of wrong questions in current passage
    const initialExpanded: Record<number, boolean> = {};
    currentPassage.questions.forEach((q) => {
      if (!checkIsCorrect(q, answers[q.id])) {
        initialExpanded[q.id] = true;
      }
    });
    setExpandedAnalysisIds(initialExpanded);

    // Save to Test History
    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

    const historyItem: TestResultItem = {
      id: `reading_${Date.now()}`,
      date: dateStr,
      startTime,
      endTime,
      testType: 'reading',
      title: `IELTS Reading (40 ta savol)`,
      topic: `${READING_PASSAGES[0].title} • ${READING_PASSAGES[1].title} • ${READING_PASSAGES[2].title}`,
      overallBand: band,
      criteriaScores: {
        c1Name: 'To\'g\'ri javoblar',
        c1Score: totalCorrect,
        c2Name: 'Jami savollar',
        c2Score: totalQuestions,
        c3Name: 'Aniqlik',
        c3Score: Math.round((totalCorrect / totalQuestions) * 100),
        c4Name: 'Band Natija',
        c4Score: band,
      },
      strengths: [
        `40 ta savoldan ${totalCorrect} tasiga to'g'ri javob berildi (${Math.round((totalCorrect / totalQuestions) * 100)}%).`,
        `Haqiqiy IELTS Academic 3 ta Passage va 40 ta savollik to'liq sinov.`,
      ],
      improvements: [
        totalCorrect < totalQuestions
          ? `Xato belgilangan ${totalQuestions - totalCorrect} ta savol bo'yicha "Tahlil qilish" tugmasini ochib parafrazlarni o'rganing.`
          : `Mukammal natija! 9.0 darajali aniqlik bilan yakunlandi.`,
      ],
    };

    saveTestResult(historyItem);
  };

  const handleReset = () => {
    triggerHaptic('medium');
    setAnswers({});
    setIsSubmitted(false);
    setIsStarted(false);
    setShowOnlyErrors(false);
    setExpandedAnalysisIds({});
    setTimeLeft(20 * 60);
    setIsTimerRunning(false);
  };

  const handleViewErrors = () => {
    triggerHaptic('medium');
    setShowOnlyErrors(true);
    setTimeout(() => {
      questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleAnalysis = (qId: number) => {
    triggerHaptic('light');
    setExpandedAnalysisIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Sort questions when submitted so wrong questions appear FIRST if requested
  const wrongQuestions = currentPassage.questions.filter((q) => !checkIsCorrect(q, answers[q.id]));
  const displayedQuestions = isSubmitted
    ? showOnlyErrors
      ? wrongQuestions
      : [...currentPassage.questions].sort((a, b) => {
          const aCorrect = checkIsCorrect(a, answers[a.id]);
          const bCorrect = checkIsCorrect(b, answers[b.id]);
          if (!aCorrect && bCorrect) return -1;
          if (aCorrect && !bCorrect) return 1;
          return a.id - b.id;
        })
    : currentPassage.questions;

  return (
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-16 relative">
      {/* ── Exit Confirmation Modal ── */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
              ⚠️
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-slate-900">Sinovni to'xtatmoqchimisiz?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hozir chiqib ketsangiz, belgilangan javoblaringiz va 20 daqiqalik sinov natijasi saqlanmaydi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowExitConfirmModal(false);
                }}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
              >
                Yo'q, davom etish
              </button>
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowExitConfirmModal(false);
                  setIsTimerRunning(false);
                  onBack();
                }}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/90 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (isStarted && !isSubmitted) {
                triggerHaptic('medium');
                setShowExitConfirmModal(true);
              } else {
                onBack();
              }
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-full">
                IELTS Reading
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {startTime}
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
              Akademik O'qish Mashqi
            </h2>
          </div>
        </div>

        {/* 20 Min Timer */}
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-slate-700">
          <Clock size={14} className={timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-[#7052ff]'} />
          <span className={timeLeft < 300 ? 'text-rose-600 font-bold' : ''}>
            {formatTimer(timeLeft)}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 max-w-2xl mx-auto w-full space-y-4">
        {/* Passage Switcher Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl space-x-1">
          {READING_PASSAGES.map((p, idx) => {
            const rangeStr = idx === 0 ? '1–13' : idx === 1 ? '14–26' : '27–40';
            const answeredCount = p.questions.filter((q) => !!answers[q.id]).length;
            return (
              <button
                key={p.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedPassageIdx(idx);
                  setShowOnlyErrors(false);
                }}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all ${
                  selectedPassageIdx === idx
                    ? 'bg-white text-[#7052ff] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div>Passage {idx + 1}</div>
                <div className="text-[10px] font-medium text-slate-400">
                  Q{rangeStr} {answeredCount > 0 ? `(${answeredCount}/${p.questions.length})` : ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── BEFORE STARTING: SHOW START CARD (Savollarni ko'rsatmaslik) ── */}
        {!isStarted ? (
          <div className="bg-white rounded-[2.2rem] p-6 border border-slate-100 shadow-md space-y-5 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#7052ff] flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              📖
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-[#7052ff] bg-indigo-50 px-2.5 py-1 rounded-md">
                {currentPassage.subtitle}
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {currentPassage.title}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                20 daqiqalik rasmiy sinov. Tayyor bo'lsangiz, «Sinovni boshlash» tugmasini bosing va topshiriqlarni bajaring.
              </p>
            </div>

            {/* Exam Benchmarks Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                <Clock size={14} className="text-amber-600" />
                <span>20 daqiqa (Rasmiy me'yor)</span>
              </span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-xl">
                📝 {currentPassage.questions.length} ta savol
              </span>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
                🎯 Band 9.0 aniqlik
              </span>
            </div>

            {/* Prominent Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  setIsStarted(true);
                  setIsTimerRunning(true);
                  setTimeLeft(20 * 60);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#5938ea] text-white font-black text-sm shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>🚀 Sinovni boshlash (20:00)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Passage Header & Font Size Controls */}
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#7052ff] bg-indigo-50 px-2.5 py-1 rounded-md">
                  {currentPassage.subtitle}
                </span>

                {/* Typography Size Toggle */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-0.5 rounded transition-all ${fontSize === 'normal' ? 'bg-white text-[#7052ff] shadow-xs' : 'hover:text-slate-900'}`}
                    title="Standart shrift"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-0.5 rounded text-sm transition-all ${fontSize === 'large' ? 'bg-white text-[#7052ff] shadow-xs' : 'hover:text-slate-900'}`}
                    title="Kattaroq shrift"
                  >
                    A+
                  </button>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentPassage.title}
              </h3>
            </div>

        {/* Passage Text Container - Clean, Readable Typography */}
        <div className="bg-[#fbfbfd] rounded-[2rem] p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 max-h-[420px] overflow-y-auto reading-custom-scroll">
          {currentPassage.paragraphs.map((p) => (
            <div
              key={p.label}
              className={`p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5 transition-all hover:border-indigo-100 ${
                fontSize === 'large'
                  ? 'text-[15px] sm:text-[16px] leading-[1.8]'
                  : 'text-[13.5px] sm:text-[14.5px] leading-[1.75]'
              } font-sans text-slate-800`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-[#7052ff] font-mono font-black text-xs">
                  {p.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Paragraf {p.label}
                </span>
              </div>
              <p className="text-slate-700 font-normal">
                {p.text}
              </p>
            </div>
          ))}
        </div>

        {/* ── Submission Results Card (Shows immediately after submit) ── */}
        {isSubmitted && (
          <div className="bg-white rounded-[2rem] p-5 border-2 border-indigo-200 shadow-lg space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-md">
                  IELTS Reading Natijasi
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  {score} / {currentPassage.questions.length} to'g'ri javob
                </h4>
                <p className="text-xs text-slate-500">
                  {score === currentPassage.questions.length ? 'Barcha savollarga to\'g\'ri javob berdingiz! 🏆' : `${currentPassage.questions.length - score} ta xato aniqlandi.`}
                </p>
              </div>

              <div className="text-right bg-gradient-to-br from-[#7052ff] to-[#4e2bf5] text-white p-3.5 rounded-2xl shadow-md min-w-[90px]">
                <span className="text-2xl font-black font-mono block">
                  {bandScore.toFixed(1)}
                </span>
                <span className="text-[9px] uppercase font-black text-purple-100">IELTS Band</span>
              </div>
            </div>

            {/* User Requested: "xatolarni ko'rish degan button chiqadi" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {score < currentPassage.questions.length && (
                <button
                  onClick={handleViewErrors}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <Search size={15} />
                  <span>🔍 Xatolarni ko'rish ({wrongQuestions.length} ta)</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <RotateCcw size={15} />
                <span>Qaytadan topshirish</span>
              </button>
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div ref={questionsSectionRef} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Savollar ({currentPassage.questions.length} ta):
              </h4>
              {isSubmitted && wrongQuestions.length > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {wrongQuestions.length} ta xato
                </span>
              )}
            </div>

            {isSubmitted && wrongQuestions.length > 0 && (
              <button
                onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                className="text-[11px] font-black text-[#7052ff] hover:underline flex items-center space-x-1"
              >
                <span>{showOnlyErrors ? "Barchasini ko'rsatish" : "Faqat xatolar"}</span>
              </button>
            )}

            {!isSubmitted && (
              <span className="text-[11px] font-bold text-slate-400">
                Belgilandi: {Object.keys(answers).length} / 40
              </span>
            )}
          </div>

          {/* List of Questions (Wrong ones first if submitted) */}
          {displayedQuestions.map((q) => {
            const selected = answers[q.id];
            const isCorrect = isSubmitted && checkIsCorrect(q, selected);
            const isWrong = isSubmitted && !isCorrect;
            const isAnalysisOpen = expandedAnalysisIds[q.id] || false;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-[1.8rem] p-4.5 border transition-all space-y-3.5 ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/15'
                      : 'border-rose-300 bg-rose-50/20 shadow-xs'
                    : 'border-slate-100 shadow-2xs hover:border-slate-200'
                }`}
              >
                {/* Header row of question card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                        isSubmitted
                          ? isCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700 font-black'
                          : 'bg-indigo-50 text-[#7052ff]'
                      }`}
                    >
                      {q.id}
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </p>
                      {q.paragraphRef && (
                        <span className="text-[10px] font-black uppercase text-slate-400 mt-0.5 inline-block">
                          Joylashuvi: {q.paragraphRef}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSubmitted && (
                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black">
                          <Check size={13} />
                          <span>To'g'ri</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-black">
                          <X size={13} />
                          <span>Xato</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Type: TFNG */}
                {q.type === 'tfng' && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                      <button
                        key={opt}
                        disabled={isSubmitted}
                        onClick={() => handleSelectAnswer(q.id, opt)}
                        className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                          selected === opt
                            ? isSubmitted
                              ? isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-[#7052ff] text-white border-[#7052ff] shadow-sm'
                            : isSubmitted && opt === q.correctAnswer
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-black ring-2 ring-emerald-400/50'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Question Type: Completion (One Word Fill-in) */}
                {q.type === 'completion' && (
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isSubmitted}
                        value={selected || ''}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        placeholder="Matndan 1 ta so'z yozing..."
                        className={`w-full py-2.5 px-3.5 rounded-xl text-xs border transition-all font-medium ${
                          isSubmitted
                            ? isCorrect
                              ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900 font-bold'
                              : 'border-rose-400 bg-rose-50/50 text-rose-900 font-bold'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-[#7052ff] focus:ring-2 focus:ring-[#7052ff]/20 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Question Type: MCQ */}
                {q.type === 'mcq' && (
                  <div className="space-y-1.5 pt-1">
                    {q.options?.map((opt) => (
                      <button
                        key={opt}
                        disabled={isSubmitted}
                        onClick={() => handleSelectAnswer(q.id, opt)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs text-left border transition-all ${
                          selected === opt
                            ? isSubmitted
                              ? isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                : 'bg-rose-600 text-white border-rose-600 font-bold'
                              : 'bg-[#7052ff] text-white border-[#7052ff] font-bold shadow-sm'
                            : isSubmitted && opt === q.correctAnswer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold ring-2 ring-emerald-400/50'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── User Requested: "ana shu xato qilgan savolni tagida tahlil qilish degan button chiqadi" ── */}
                {isSubmitted && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        To'g'ri javob: <strong className="text-emerald-700 font-black">{q.correctAnswer}</strong>
                        {selected && selected.trim().toUpperCase() !== q.correctAnswer.trim().toUpperCase() && (
                          <span className="text-rose-600 ml-2">
                            (Sizning javobingiz: <s>{selected}</s>)
                          </span>
                        )}
                      </div>

                      {/* "Tahlil qilish" Button */}
                      <button
                        onClick={() => toggleAnalysis(q.id)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-xs ${
                          isAnalysisOpen
                            ? 'bg-indigo-600 text-white'
                            : isWrong
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>💡 Tahlil qilish</span>
                        {isAnalysisOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Detailed Analysis Breakdown Box */}
                    {isAnalysisOpen && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                        {/* 1. Paragraph reference */}
                        <div className="flex items-center space-x-1.5 text-[11px] font-black text-[#7052ff]">
                          <BookOpen size={13} />
                          <span>Matndagi joyi: {q.paragraphRef}</span>
                        </div>

                        {/* 2. Direct Passage Evidence Quote */}
                        {q.evidenceQuote && (
                          <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 text-slate-800 text-[11px] italic leading-relaxed">
                            <span className="font-bold not-italic text-slate-500 block text-[10px] uppercase">
                              Matndan iqtibos (Evidence):
                            </span>
                            "{q.evidenceQuote}"
                          </div>
                        )}

                        {/* 3. Paraphrase Proof */}
                        {q.paraphraseAnalysis && (
                          <div className="text-[11px] text-indigo-950 font-medium leading-relaxed bg-indigo-100/60 p-2 rounded-xl">
                            <span className="font-bold text-[#7052ff] block text-[10px] uppercase">
                              Parafraz tahlili:
                            </span>
                            {q.paraphraseAnalysis}
                          </div>
                        )}

                        {/* 4. Full Explanation */}
                        <div className="text-[11px] text-slate-700 leading-relaxed pt-0.5">
                          <span className="font-bold text-slate-900 block text-[10px] uppercase">
                            Izoh:
                          </span>
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#5938ea] text-white font-black text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>Javoblarni Tekshirish va Baholash</span>
            </button>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};
