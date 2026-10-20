import React from 'react';

export interface IeltsTask1Prompt {
  id: string;
  topic: string;
  badge: string;
  prompt: string;
  summaryLeft: string;
  summaryRight: string;
  chartType: 'bar' | 'line' | 'pie' | 'table' | 'process' | 'map';
  chartTitle: string;
  // Data payloads for parametric SVG rendering
  barData?: {
    seriesA: string;
    seriesB: string;
    maxVal: number;
    unit: string;
    items: { label: string; a: number; b: number; diffLabel: string }[];
  };
  lineData?: {
    unit: string;
    maxVal: number;
    xLabels: [string, string, string, string];
    series: { name: string; color: string; values: [number, number, number, number] }[];
  };
  pieData?: {
    leftTitle: string;
    rightTitle: string;
    slices: { label: string; color: string; leftPct: number; rightPct: number }[];
  };
  tableData?: {
    headers: [string, string, string, string];
    rows: [string, string, string, string][];
  };
  processData?: {
    isCyclical?: boolean;
    steps: { num: number; title: string; sub: string; icon: string }[];
  };
  mapData?: {
    yearA: string;
    yearB: string;
    placeName: string;
    featuresA: { x: number; y: number; w: number; h: number; label: string; color: string }[];
    featuresB: { x: number; y: number; w: number; h: number; label: string; color: string }[];
  };
}

export interface IeltsTask2Prompt {
  topic: string;
  prompt: string;
}

export const IELTS_TASK1_PROMPTS: IeltsTask1Prompt[] = [
  // 1. Bar Chart - Renewable Energy
  {
    id: 'bar_renewable_2025',
    topic: 'Renewable Energy Generation (2015–2025)',
    badge: 'Academic Task 1 • Bar Chart (2025)',
    prompt:
      'The bar chart below illustrates global renewable electricity production in 2015 and 2025 (in Terawatt-hours, TWh), comparing Solar, Wind, Hydro, and Biomass.',
    summaryLeft: "• Eng katta o'sish: Solar (+325%)",
    summaryRight: "• Eng yuqori hajm: Hydro (1020 TWh)",
    chartType: 'bar',
    chartTitle: '⚡ Global Renewable Electricity Output (TWh)',
    barData: {
      seriesA: '2015',
      seriesB: '2025',
      maxVal: 1200,
      unit: 'TWh',
      items: [
        { label: 'Solar', a: 200, b: 850, diffLabel: '+325%' },
        { label: 'Wind', a: 420, b: 960, diffLabel: '+128%' },
        { label: 'Hydro', a: 920, b: 1020, diffLabel: '+11%' },
        { label: 'Biomass', a: 310, b: 430, diffLabel: '+39%' },
      ],
    },
  },
  // 2. Line Graph - High Speed Rail
  {
    id: 'line_transport_2025',
    topic: 'High-Speed Rail Passengers (2010–2025)',
    badge: 'Academic Task 1 • Line Graph (2024)',
    prompt:
      'The line graph below compares the annual number of high-speed rail passengers (in millions) in East Asia, Europe, and North America between 2010 and 2025.',
    summaryLeft: '• Yetakchi mintaqa: East Asia (920M)',
    summaryRight: "• Barqaror o'sish: Europe (310M → 590M)",
    chartType: 'line',
    chartTitle: '🚄 High-Speed Rail Passengers (Millions)',
    lineData: {
      unit: 'M',
      maxVal: 1000,
      xLabels: ['2010', '2015', '2020', '2025'],
      series: [
        { name: 'East Asia', color: '#c4f82a', values: [240, 560, 740, 920] },
        { name: 'Europe', color: '#7052ff', values: [310, 410, 480, 590] },
        { name: 'N. America', color: '#38bdf8', values: [55, 80, 110, 165] },
      ],
    },
  },
  // 3. Visual Process Diagram - Plastic Bottle Recycling (Fixed from plain text to full SVG flowchart!)
  {
    id: 'process_recycling_svg',
    topic: 'Industrial Plastic Bottle Recycling Process',
    badge: 'Academic Task 1 • Process Diagram (Cambridge 18)',
    prompt:
      'The diagram below illustrates the six-stage cyclical process by which used plastic bottles are collected, sorted, processed, and remanufactured into new consumer goods.',
    summaryLeft: '• Bosqichlar: 6 ta ketma-ket texnologik jarayon',
    summaryRight: '• Tuzilishi: Yopiq qayta ishlash halqasi (Cyclical)',
    chartType: 'process',
    chartTitle: '♻️ Plastic Bottle Recycling Process (Visual Flowchart)',
    processData: {
      isCyclical: true,
      steps: [
        { num: 1, title: 'Collection', sub: 'Bins & Trucks', icon: '🚛' },
        { num: 2, title: 'Sorting', sub: 'Optical Scan', icon: '🔍' },
        { num: 3, title: 'Shredding', sub: 'Crushed Flakes', icon: '⚙️' },
        { num: 4, title: 'Washing', sub: 'Chemical Bath', icon: '💧' },
        { num: 5, title: 'Pelletizing', sub: 'Melted at 260°C', icon: '🔥' },
        { num: 6, title: 'New Products', sub: 'Bottles & Fabric', icon: '👕' },
      ],
    },
  },
  // 4. Visual Map Comparison - Coastal Town Development
  {
    id: 'map_coastal_town',
    topic: 'Transformation of Norbiton Coastal Town (2000 vs 2025)',
    badge: 'Academic Task 1 • Map Comparison (Cambridge 17)',
    prompt:
      'The maps below show the changes that have taken place in the coastal town of Norbiton between 2000 and 2025. Summarize the information by selecting and reporting the main features.',
    summaryLeft: "• Asosiy o'zgarish: Farmland → Housing & Solar Park",
    summaryRight: '• Sohil: Fishing Port → Yacht Marina & Cafes',
    chartType: 'map',
    chartTitle: '🗺️ Map of Norbiton: 2000 vs 2025',
    mapData: {
      yearA: '2000 (Past)',
      yearB: '2025 (Present)',
      placeName: 'Norbiton Coast',
      featuresA: [
        { x: 10, y: 12, w: 65, h: 28, label: 'Farmland', color: '#15803d' },
        { x: 85, y: 12, w: 55, h: 28, label: 'Forest Park', color: '#166534' },
        { x: 10, y: 52, w: 55, h: 24, label: 'Old Factory', color: '#64748b' },
        { x: 80, y: 52, w: 60, h: 24, label: 'Small Shops', color: '#b45309' },
        { x: 25, y: 88, w: 95, h: 20, label: 'Fishing Port', color: '#0369a1' },
      ],
      featuresB: [
        { x: 10, y: 12, w: 65, h: 28, label: 'Apartments', color: '#6d28d9' },
        { x: 85, y: 12, w: 55, h: 28, label: 'Solar Park', color: '#ca8a04' },
        { x: 10, y: 52, w: 55, h: 24, label: 'Tech Hub', color: '#2563eb' },
        { x: 80, y: 52, w: 60, h: 24, label: 'Shopping Mall', color: '#db2777' },
        { x: 25, y: 88, w: 95, h: 20, label: 'Yacht Marina', color: '#0891b2' },
      ],
    },
  },
  // 5. Pie Charts - Household Energy Use
  {
    id: 'pie_energy_use',
    topic: 'Household Energy Consumption by Source (2014 vs 2024)',
    badge: 'Academic Task 1 • Pie Charts (2024)',
    prompt:
      'The two pie charts below show the percentages of household energy generated from four sources in Germany in 2014 and 2024.',
    summaryLeft: "• Ko'mir va Gaz ulushi keskin kamaygan (68% → 38%)",
    summaryRight: "• Quyosh va Shamol energiyasi 2 barobarga oshgan",
    chartType: 'pie',
    chartTitle: '🥧 Household Energy Mix: 2014 vs 2024',
    pieData: {
      leftTitle: '2014',
      rightTitle: '2024',
      slices: [
        { label: 'Natural Gas', color: '#7052ff', leftPct: 42, rightPct: 26 },
        { label: 'Solar & Wind', color: '#c4f82a', leftPct: 22, rightPct: 48 },
        { label: 'Coal', color: '#f97316', leftPct: 26, rightPct: 12 },
        { label: 'Hydro/Bio', color: '#38bdf8', leftPct: 10, rightPct: 14 },
      ],
    },
  },
  // 6. Data Table - Household Expenditure
  {
    id: 'table_spending_2024',
    topic: 'Monthly Household Expenditure (UK, Japan, Canada)',
    badge: 'Academic Task 1 • Data Table (2024)',
    prompt:
      'The table below gives information about the proportion of monthly household income spent on five categories in the United Kingdom, Japan, and Canada in 2024.',
    summaryLeft: '• Eng yuqori uy-joy xarajati: UK (34%)',
    summaryRight: '• Oziq-ovqatga eng katta ulush: Japan (23%)',
    chartType: 'table',
    chartTitle: '📊 Monthly Household Expenditure (%) — 2024',
    tableData: {
      headers: ['Category', 'UK', 'Japan', 'Canada'],
      rows: [
        ['Housing & Utilities', '34%', '26%', '31%'],
        ['Food & Groceries', '14%', '23%', '16%'],
        ['Transport & Fuel', '16%', '12%', '19%'],
        ['Healthcare', '8%', '15%', '11%'],
        ['Leisure & Education', '28%', '24%', '23%'],
      ],
    },
  },
  // 7. Bar Chart - EV Adoption by Country
  {
    id: 'bar_ev_sales',
    topic: 'Electric Vehicle Market Share in 4 Countries (2018 vs 2025)',
    badge: 'Academic Task 1 • Bar Chart (2025)',
    prompt:
      'The bar chart compares the percentage of new cars sold that were electric vehicles (EVs) in Norway, China, Germany, and the USA in 2018 and 2025.',
    summaryLeft: '• Mutlaq yetakchi: Norway (49% → 88%)',
    summaryRight: "• Eng tez o'sish sur'ati: China (8% → 44%)",
    chartType: 'bar',
    chartTitle: '🚗 Electric Vehicle Share of New Car Sales (%)',
    barData: {
      seriesA: '2018',
      seriesB: '2025',
      maxVal: 100,
      unit: '%',
      items: [
        { label: 'Norway', a: 49, b: 88, diffLabel: '+39%' },
        { label: 'China', a: 8, b: 44, diffLabel: '+36%' },
        { label: 'Germany', a: 4, b: 28, diffLabel: '+24%' },
        { label: 'USA', a: 2, b: 14, diffLabel: '+12%' },
      ],
    },
  },
  // 8. Line Graph - Urban Population Growth
  {
    id: 'line_urbanization',
    topic: 'Urban Population Percentage in Three Continents (1990–2030)',
    badge: 'Academic Task 1 • Line Graph (Cambridge 19)',
    prompt:
      'The line graph illustrates the percentage of the population living in urban areas in Latin America, Asia, and Africa from 1990 with projections up to 2030.',
    summaryLeft: '• Eng yuqori urbanizatsiya: Latin America (84%)',
    summaryRight: "• Eng jadal o'sish: Asia (32% → 58%)",
    chartType: 'line',
    chartTitle: '🏙️ Urban Population Share (%) 1990–2030',
    lineData: {
      unit: '%',
      maxVal: 100,
      xLabels: ['1990', '2005', '2020', '2030'],
      series: [
        { name: 'Latin America', color: '#c4f82a', values: [70, 77, 81, 84] },
        { name: 'Asia', color: '#7052ff', values: [32, 41, 51, 58] },
        { name: 'Africa', color: '#38bdf8', values: [31, 37, 43, 49] },
      ],
    },
  },
  // 9. Process Diagram - Coffee Production
  {
    id: 'process_coffee_svg',
    topic: 'Commercial Coffee Production Process',
    badge: 'Academic Task 1 • Process Diagram (2023)',
    prompt:
      'The diagram below shows the six main stages involved in manufacturing commercial coffee from harvesting raw beans on plantations to packaging for supermarkets.',
    summaryLeft: '• Boshlanishi: Hand-picking & Sun Drying',
    summaryRight: '• Yakuni: Grinding & Vacuum Packing',
    chartType: 'process',
    chartTitle: '☕ Commercial Coffee Production (6 Stages)',
    processData: {
      isCyclical: false,
      steps: [
        { num: 1, title: 'Harvesting', sub: 'Ripe Red Beans', icon: '🌿' },
        { num: 2, title: 'Sun Drying', sub: '2–3 Weeks', icon: '☀️' },
        { num: 3, title: 'Hulling', sub: 'Skin Removed', icon: '⚙️' },
        { num: 4, title: 'Roasting', sub: '220°C Furnace', icon: '🔥' },
        { num: 5, title: 'Grinding', sub: 'Fine Powder', icon: '🌀' },
        { num: 6, title: 'Packaging', sub: 'Vacuum Jars', icon: '📦' },
      ],
    },
  },
  // 10. Map Comparison - University Campus Redesign
  {
    id: 'map_university_campus',
    topic: 'Westfield University Campus Redevelopment (2010 vs 2025)',
    badge: 'Academic Task 1 • Map Comparison (2025)',
    prompt:
      'The two maps below illustrate the layout of Westfield University Campus in 2010 and how it looks in 2025 after major modernization.',
    summaryLeft: '• Yangi binolar: AI Research Lab & Student Hub',
    summaryRight: '• Car Park o‘rniga Eco-Park va Tram Stop qurilgan',
    chartType: 'map',
    chartTitle: '🎓 Westfield University Campus: 2010 vs 2025',
    mapData: {
      yearA: '2010 Layout',
      yearB: '2025 Layout',
      placeName: 'Campus Central',
      featuresA: [
        { x: 10, y: 12, w: 60, h: 26, label: 'Old Library', color: '#475569' },
        { x: 80, y: 12, w: 60, h: 26, label: 'Science Block', color: '#0369a1' },
        { x: 10, y: 50, w: 60, h: 24, label: 'Lawn Area', color: '#15803d' },
        { x: 80, y: 50, w: 60, h: 24, label: 'Small Cafe', color: '#b45309' },
        { x: 20, y: 86, w: 105, h: 22, label: 'Main Car Park', color: '#334155' },
      ],
      featuresB: [
        { x: 10, y: 12, w: 60, h: 26, label: 'Digital Library', color: '#6d28d9' },
        { x: 80, y: 12, w: 60, h: 26, label: 'AI & Robotics Lab', color: '#2563eb' },
        { x: 10, y: 50, w: 60, h: 24, label: 'Dormitories', color: '#0d9488' },
        { x: 80, y: 50, w: 60, h: 24, label: 'Student Hub', color: '#db2777' },
        { x: 20, y: 86, w: 105, h: 22, label: 'Eco-Park & Tram', color: '#16a34a' },
      ],
    },
  },
  // 11. Pie Charts - Water Usage by Sector
  {
    id: 'pie_water_usage',
    topic: 'Freshwater Consumption by Sector (Australia vs Brazil)',
    badge: 'Academic Task 1 • Pie Charts (2023)',
    prompt:
      'The pie charts below compare the proportion of freshwater used by four economic sectors in Australia and Brazil in 2023.',
    summaryLeft: "• Qishloq xo'jaligi ikkala davlatda ham 1-o'rinda (58% va 62%)",
    summaryRight: '• Uy xo‘jaligi ulushi Avstraliyada yuqoriroq (21% vs 12%)',
    chartType: 'pie',
    chartTitle: '💧 Freshwater Use by Sector (%)',
    pieData: {
      leftTitle: 'Australia',
      rightTitle: 'Brazil',
      slices: [
        { label: 'Agriculture', color: '#c4f82a', leftPct: 58, rightPct: 62 },
        { label: 'Industry', color: '#7052ff', leftPct: 15, rightPct: 21 },
        { label: 'Domestic', color: '#38bdf8', leftPct: 21, rightPct: 12 },
        { label: 'Services', color: '#f97316', leftPct: 6, rightPct: 5 },
      ],
    },
  },
  // 12. Process Diagram - Hydroelectric Dam Power Generation
  {
    id: 'process_hydro_dam',
    topic: 'Hydroelectric Power Generation Process',
    badge: 'Academic Task 1 • Process Diagram (2024)',
    prompt:
      'The diagram below shows how electricity is generated in a hydroelectric power station and transmitted to homes and industrial consumers.',
    summaryLeft: '• Manba: Mountain Reservoir & Intake Gate',
    summaryRight: '• Natija: National Grid (High-Voltage Cables)',
    chartType: 'process',
    chartTitle: '⚡ Hydroelectric Power Station Process',
    processData: {
      isCyclical: false,
      steps: [
        { num: 1, title: 'Reservoir', sub: 'Dam Stores Water', icon: '🌊' },
        { num: 2, title: 'Intake Valve', sub: 'High Pressure Pipe', icon: '🚪' },
        { num: 3, title: 'Turbine', sub: 'Water Spins Blades', icon: '⚙️' },
        { num: 4, title: 'Generator', sub: 'Mechanical → Elec', icon: '🔋' },
        { num: 5, title: 'Transformer', sub: 'Steps Up Voltage', icon: '⚡' },
        { num: 6, title: 'Power Grid', sub: 'Sent to Homes', icon: '🏠' },
      ],
    },
  },
  // 13. Bar Chart - University Enrolment by Subject
  {
    id: 'bar_uni_subjects',
    topic: 'University Enrolment by Gender Across 4 Faculties (2024)',
    badge: 'Academic Task 1 • Bar Chart (2024)',
    prompt:
      'The bar chart shows the number of male and female students (in thousands) enrolled in four university faculties (Engineering, Medicine, Business, and Arts) in 2024.',
    summaryLeft: '• Engineering: Erkaklar ko‘proq (82k vs 38k)',
    summaryRight: '• Medicine & Arts: Ayollar ko‘pchilikni tashkil etadi',
    chartType: 'bar',
    chartTitle: '🎓 University Enrolment by Gender (Thousands)',
    barData: {
      seriesA: 'Male',
      seriesB: 'Female',
      maxVal: 100,
      unit: 'k',
      items: [
        { label: 'Engineering', a: 82, b: 38, diffLabel: 'M +44k' },
        { label: 'Medicine', a: 45, b: 64, diffLabel: 'F +19k' },
        { label: 'Business', a: 70, b: 68, diffLabel: 'Equal' },
        { label: 'Arts & Hum.', a: 32, b: 61, diffLabel: 'F +29k' },
      ],
    },
  },
  // 14. Table - International Tourist Arrivals
  {
    id: 'table_tourism_2025',
    topic: 'International Tourist Arrivals & Spending (2019 vs 2024)',
    badge: 'Academic Task 1 • Data Table (2025)',
    prompt:
      'The table below compares international tourist arrivals (in millions) and average tourist spending per trip in five major destinations in 2019 and 2024.',
    summaryLeft: '• Eng ko‘p sayyoh: France (90M → 102M)',
    summaryRight: '• Eng yuqori o‘rtacha xarajat: UAE ($1,850)',
    chartType: 'table',
    chartTitle: '✈️ International Tourism Statistics (2019 vs 2024)',
    tableData: {
      headers: ['Country', '2019 Arrivals', '2024 Arrivals', 'Avg Spend ($)'],
      rows: [
        ['France', '90.2M', '102.5M', '$1,120'],
        ['Spain', '83.5M', '94.1M', '$1,240'],
        ['Japan', '31.9M', '36.8M', '$1,590'],
        ['Turkey', '51.2M', '60.4M', '$980'],
        ['UAE', '21.6M', '28.9M', '$1,850'],
      ],
    },
  },
  // 15. Line Graph - E-Commerce vs In-Store Retail
  {
    id: 'line_ecommerce_retail',
    topic: 'Online Shopping by Age Group in the UK (2015–2025)',
    badge: 'Academic Task 1 • Line Graph (2025)',
    prompt:
      'The line graph illustrates the percentage of people in three age groups in the UK who purchased goods online at least once a week between 2015 and 2025.',
    summaryLeft: '• Eng faol guruh: 25–44 yoshlilar (86%)',
    summaryRight: "• 65+ yoshlilarda o'sish 3 barobardan oshgan (14% → 46%)",
    chartType: 'line',
    chartTitle: '🛒 Weekly Online Shoppers by Age Group (%)',
    lineData: {
      unit: '%',
      maxVal: 100,
      xLabels: ['2015', '2018', '2021', '2025'],
      series: [
        { name: 'Age 25–44', color: '#c4f82a', values: [48, 62, 79, 86] },
        { name: 'Age 16–24', color: '#7052ff', values: [42, 55, 72, 81] },
        { name: 'Age 65+', color: '#38bdf8', values: [14, 22, 38, 46] },
      ],
    },
  },
];

// 50 Official 2022–2026 IELTS Academic Writing Task 2 Prompts
export const IELTS_TASK2_PROMPTS: IeltsTask2Prompt[] = [
  {
    topic: '1. Education & AI (Agree / Disagree • 2025)',
    prompt: 'Some people believe that computers and artificial intelligence will soon replace human teachers in classrooms. To what extent do you agree or disagree with this opinion?',
  },
  {
    topic: '2. Environment & Plastic Pollution (Causes & Solutions • 2024)',
    prompt: 'Many environmental problems such as plastic pollution and deforestation are becoming increasingly severe around the world. What are the main causes of these problems, and what measures can governments and individuals take to resolve them?',
  },
  {
    topic: '3. Work-Life Balance (Discuss Both Views • 2023)',
    prompt: 'In many countries, employees are working longer hours than ever before. Some argue this boosts economic growth, while others believe it harms family life and mental health. Discuss both views and give your own opinion.',
  },
  {
    topic: '4. Purpose of Universities (Discuss Both Views • Cambridge 18)',
    prompt: 'Some people think that university education should prepare students for specific careers, while others believe universities should focus on providing broad academic knowledge for its own sake. Discuss both views and give your opinion.',
  },
  {
    topic: '5. Remote Work & Technology (Advantages / Disadvantages • 2024)',
    prompt: 'In recent years, an increasing number of companies allow employees to work from home using digital technology. Do the advantages of remote working outweigh the disadvantages?',
  },
  {
    topic: '6. Free Public Transport (Agree / Disagree • 2025)',
    prompt: 'The best way for governments to solve traffic congestion and air pollution in major cities is to provide free public transport 24 hours a day. To what extent do you agree or disagree?',
  },
  {
    topic: '7. Youth Crime Prevention (Causes & Solutions • 2023)',
    prompt: 'In several parts of the world, the rate of juvenile delinquency and youth crime is rising. Why is this happening, and what steps can society take to prevent young people from committing crimes?',
  },
  {
    topic: '8. Globalization & National Identity (Discuss Both Views • 2024)',
    prompt: 'Some people feel that increasing business and cultural contact between countries is a positive development, while others believe it leads to the loss of national identities and traditions. Discuss both views and give your own opinion.',
  },
  {
    topic: '9. Preventive Healthcare Budget (Agree / Disagree • Cambridge 17)',
    prompt: 'A larger proportion of the national healthcare budget should be spent on health education and preventive measures rather than on treating patients who are already ill. To what extent do you agree or disagree?',
  },
  {
    topic: '10. Space Exploration vs Earth Needs (Discuss Both Views • 2025)',
    prompt: 'Governments spend billions of dollars on space exploration every year. Some people argue that this money should be spent on solving urgent problems on Earth instead. Discuss both views and give your own opinion.',
  },
  {
    topic: '11. International Tourism Impact (Advantages / Disadvantages • 2023)',
    prompt: 'International tourism has become one of the largest industries in the world. Do the economic benefits of international tourism outweigh its negative impacts on local environments and communities?',
  },
  {
    topic: '12. Children & Screen Time (Two-Part Question • 2024)',
    prompt: 'Children today spend far more time watching screens and playing video games than participating in outdoor physical activities. Why has this shift occurred, and how does it affect children’s development?',
  },
  {
    topic: '13. Cashless Society (Advantages / Disadvantages • 2025)',
    prompt: 'In an increasing number of countries, digital payments and bank cards have almost completely replaced paper money and coins. Do the advantages of a cashless society outweigh the disadvantages?',
  },
  {
    topic: '14. Ageing Population (Causes & Solutions • Cambridge 19)',
    prompt: 'In many developed countries, the average life expectancy is increasing while birth rates are falling. What problems will this cause for individuals and society, and what measures could be taken to address them?',
  },
  {
    topic: '15. Fast Fashion & Consumerism (Causes & Solutions • 2024)',
    prompt: 'People today buy clothes much more frequently than in the past and throw them away after wearing them only a few times. Why is this happening, and what are the environmental consequences of this trend?',
  },
  {
    topic: '16. Four-Day Work Week (Agree / Disagree • 2025)',
    prompt: 'Some economists and business leaders suggest that reducing the standard working week from five days to four days would benefit both employees and companies. To what extent do you agree or disagree?',
  },
  {
    topic: '17. Social Media Influencers (Positive / Negative • 2024)',
    prompt: 'Many young people today aspire to become famous social media influencers rather than pursuing traditional professions such as medicine, teaching, or engineering. Is this a positive or negative development?',
  },
  {
    topic: '18. Historic Buildings vs Modern Housing (Discuss Both Views • 2023)',
    prompt: 'Some people think that old historic buildings in cities should be protected and preserved, while others believe they should be demolished to make way for modern apartments and offices. Discuss both views and give your opinion.',
  },
  {
    topic: '19. Electric Cars vs Public Transit (Discuss Both Views • 2025)',
    prompt: 'Some people believe that subsidizing electric cars is the best way to reduce carbon emissions, while others argue that investing in railways and buses is far more effective. Discuss both views and give your opinion.',
  },
  {
    topic: '20. Foreign Language in Primary School (Advantages / Disadvantages • 2022)',
    prompt: 'Some educational experts believe that children should begin learning a foreign language at primary school rather than secondary school. Do the advantages of this outweigh the disadvantages?',
  },
  {
    topic: '21. Automation & Unemployment (Two-Part Question • 2025)',
    prompt: 'Robots and automated systems are increasingly performing tasks previously done by humans in factories and service industries. What are the effects of this trend on workers, and how should governments respond?',
  },
  {
    topic: '22. Sugar Tax & Public Health (Agree / Disagree • 2024)',
    prompt: 'Some people argue that the most effective way to reduce obesity is for governments to impose heavy taxes on sugary drinks and fast food. To what extent do you agree or disagree?',
  },
  {
    topic: '23. Museums & Art Galleries Fees (Advantages / Disadvantages • 2023)',
    prompt: 'Many museums and historical sites charge admission fees to visitors, while others are completely free. Do the advantages of charging for admission outweigh the disadvantages?',
  },
  {
    topic: '24. Rural-to-Urban Migration (Causes & Solutions • 2024)',
    prompt: 'Young people in many countries are leaving rural villages in large numbers to live and work in major cities, leaving mainly elderly people behind. Why is this happening, and how can rural areas be made more attractive?',
  },
  {
    topic: '25. Online News vs Newspapers (Positive / Negative • 2023)',
    prompt: 'More and more people today get their daily news from social media and online platforms rather than printed newspapers or television broadcasts. Is this a positive or negative development?',
  },
  {
    topic: '26. Corporate Social Responsibility (Agree / Disagree • Cambridge 18)',
    prompt: 'As well as making money, businesses also have social responsibilities towards their communities and the environment. To what extent do you agree or disagree?',
  },
  {
    topic: '27. Gap Year Before University (Advantages / Disadvantages • 2022)',
    prompt: 'In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university studies. Do the advantages of taking a gap year outweigh the disadvantages?',
  },
  {
    topic: '28. Zoos & Wildlife Conservation (Discuss Both Views • 2023)',
    prompt: 'Some people believe that zoos are cruel and should be closed down, while others argue that zoos play an essential role in protecting endangered species from extinction. Discuss both views and give your opinion.',
  },
  {
    topic: '29. Advertising to Children (Agree / Disagree • 2024)',
    prompt: 'Many advertisements are aimed directly at children to influence their parents’ spending habits. Some people think that all advertising aimed at children should be banned by law. To what extent do you agree or disagree?',
  },
  {
    topic: '30. Competition vs Cooperation in School (Discuss Both Views • Cambridge 19)',
    prompt: 'Some people think that a sense of competition in children should be encouraged, while others believe that children who are taught to cooperate rather than compete become more useful adults. Discuss both views and give your opinion.',
  },
  {
    topic: '31. Food Miles & Imported Food (Positive / Negative • 2024)',
    prompt: 'In many supermarkets today, consumers can buy food imported from all over the world rather than only locally produced food. Is this a positive or negative development?',
  },
  {
    topic: '32. Prison vs Rehabilitation (Discuss Both Views • 2023)',
    prompt: 'Some people believe that longer prison sentences are the only effective way to reduce crime, while others argue that education, vocational training, and rehabilitation are better solutions. Discuss both views and give your opinion.',
  },
  {
    topic: '33. Financial Literacy at School (Agree / Disagree • 2025)',
    prompt: 'Many young adults leave school without knowing how to manage their personal finances or budget effectively. Why is this the case, and should financial management be a compulsory school subject?',
  },
  {
    topic: '34.Nuclear Energy & Climate Change (Discuss Both Views • 2024)',
    prompt: 'Some people argue that nuclear power is essential for meeting global energy demands cleanly, while others believe it is too dangerous and expensive. Discuss both views and give your own opinion.',
  },
  {
    topic: '35. Extinct Species Revival (Agree / Disagree • 2025)',
    prompt: 'Scientists are researching ways to bring extinct animals back to life using genetic engineering. Some people think this is an exciting scientific breakthrough, while others believe we should focus only on existing species. To what extent do you agree or disagree?',
  },
  {
    topic: '36. Celebrity Salaries (Two-Part Question • 2023)',
    prompt: 'Professional athletes and entertainment stars often earn millions of dollars a year, whereas essential workers like nurses and teachers earn much less. Why does this disparity exist, and do you think it is fair?',
  },
  {
    topic: '37. Smart Homes & Privacy (Advantages / Disadvantages • 2025)',
    prompt: 'People are increasingly using smart home devices and voice assistants that collect personal data to automate daily tasks. Do the conveniences of this technology outweigh the risks to personal privacy?',
  },
  {
    topic: '38. Homework in Primary Schools (Discuss Both Views • 2022)',
    prompt: 'Some educators believe that daily homework is essential for children’s academic success, while others argue that homework places unnecessary stress on young children. Discuss both views and give your opinion.',
  },
  {
    topic: '39. Noise Pollution in Cities (Causes & Solutions • 2024)',
    prompt: 'Noise levels in major cities are rising continuously due to traffic, construction, and nightlife, affecting residents’ health. What are the main causes of urban noise pollution, and how can it be reduced?',
  },
  {
    topic: '40. International Aid & Developing Nations (Discuss Both Views • 2023)',
    prompt: 'Some people think wealthy nations should give financial aid to poorer countries, while others argue that providing practical technology and education is much more helpful. Discuss both views and give your opinion.',
  },
  {
    topic: '41. E-Books vs Printed Books (Agree / Disagree • 2022)',
    prompt: 'With the rise of tablets and e-readers, some people predict that printed books and public libraries will eventually disappear completely. To what extent do you agree or disagree?',
  },
  {
    topic: '42.Single-Use Packaging Responsibility (Discuss Both Views • 2025)',
    prompt: 'Some people think that manufacturers and supermarkets should be responsible for reducing product packaging, while others feel that consumers should avoid buying over-packaged goods. Discuss both views and give your opinion.',
  },
  {
    topic: '43. University Tuition Fees (Agree / Disagree • 2024)',
    prompt: 'Higher education at universities should be funded entirely by the government so that it is free for all students, regardless of their financial background. To what extent do you agree or disagree?',
  },
  {
    topic: '44. Changing Jobs vs Lifelong Career (Advantages / Disadvantages • 2023)',
    prompt: 'Unlike in the past, when people often stayed with the same employer for their entire working life, young workers today frequently change jobs every few years. Do the advantages of this trend outweigh the disadvantages?',
  },
  {
    topic: '45. Freshwater Scarcity (Causes & Solutions • 2025)',
    prompt: 'Clean freshwater is becoming a scarce resource in many regions of the world. What are the primary causes of water shortages, and what actions should governments and individuals take to conserve water?',
  },
  {
    topic: '46. Art & Music in Curriculum (Agree / Disagree • 2023)',
    prompt: 'Some people claim that subjects like Art, Music, and Drama are a waste of school time and that students should focus exclusively on STEM subjects (Science, Technology, Engineering, and Math). To what extent do you agree or disagree?',
  },
  {
    topic: '47. Hosting International Sports Events (Advantages / Disadvantages • 2024)',
    prompt: 'Many countries spend billions of dollars to host major international sporting events such as the Olympic Games or the World Cup. Do the advantages of hosting such events outweigh the disadvantages?',
  },
  {
    topic: '48. Living Alone in Modern Cities (Two-Part Question • 2025)',
    prompt: 'In many countries, the number of people choosing to live alone rather than in large family households is growing rapidly. Why is this happening, and does this trend have a positive or negative effect on society?',
  },
  {
    topic: '49. Genetic Testing & Healthcare (Advantages / Disadvantages • 2024)',
    prompt: 'Modern medical technology allows individuals to take genetic tests to discover potential future health risks. Do the benefits of knowing this information outweigh the potential drawbacks?',
  },
  {
    topic: '50. Artificial Intelligence in Creative Arts (Discuss Both Views • 2026)',
    prompt: 'Artificial intelligence can now generate music, paintings, and literature in seconds. Some people view this as a threat to human creativity, while others see it as a powerful tool for artists. Discuss both views and give your own opinion.',
  },
];

export const IeltsTask1Visual: React.FC<{ prompt: IeltsTask1Prompt }> = ({ prompt }) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-inner space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-[11px] font-bold text-[#c4f82a]">{prompt.chartTitle}</span>
        {prompt.chartType === 'bar' && prompt.barData && (
          <div className="flex items-center space-x-3 text-[10px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#7052ff]" />
              <span>{prompt.barData.seriesA}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#c4f82a]" />
              <span>{prompt.barData.seriesB}</span>
            </span>
          </div>
        )}
        {prompt.chartType === 'line' && prompt.lineData && (
          <div className="flex items-center space-x-2 text-[9px]">
            {prompt.lineData.series.map((s, i) => (
              <span key={i} style={{ color: s.color }} className="font-bold">
                ● {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 1. BAR CHART SVG */}
      {prompt.chartType === 'bar' && prompt.barData && (
        <svg viewBox="0 0 360 165" className="w-full h-44">
          <line x1="42" y1="20" x2="348" y2="20" stroke="#334155" strokeDasharray="3 3" />
          <line x1="42" y1="58" x2="348" y2="58" stroke="#334155" strokeDasharray="3 3" />
          <line x1="42" y1="96" x2="348" y2="96" stroke="#334155" strokeDasharray="3 3" />
          <line x1="42" y1="134" x2="348" y2="134" stroke="#475569" strokeWidth="1.5" />

          <text x="36" y="24" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            {prompt.barData.maxVal}
          </text>
          <text x="36" y="62" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            {Math.round(prompt.barData.maxVal * 0.66)}
          </text>
          <text x="36" y="100" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            {Math.round(prompt.barData.maxVal * 0.33)}
          </text>
          <text x="36" y="137" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            0
          </text>

          {prompt.barData.items.map((item, idx) => {
            const baseX = 65 + idx * 72;
            const maxH = 110;
            const hA = Math.max(4, Math.round((item.a / prompt.barData!.maxVal) * maxH));
            const hB = Math.max(4, Math.round((item.b / prompt.barData!.maxVal) * maxH));
            const yA = 134 - hA;
            const yB = 134 - hB;
            return (
              <g key={idx}>
                <rect x={baseX} y={yA} width="17" height={hA} fill="#7052ff" rx="2.5" />
                <text x={baseX + 8.5} y={yA - 4} fill="#a5b4fc" fontSize="7.5" textAnchor="middle">
                  {item.a}
                </text>
                <rect x={baseX + 20} y={yB} width="17" height={hB} fill="#c4f82a" rx="2.5" />
                <text
                  x={baseX + 28.5}
                  y={yB - 4}
                  fill="#c4f82a"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.b}
                </text>
                <text x={baseX + 18} y="149" fill="#e2e8f0" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  {item.label}
                </text>
                <text x={baseX + 18} y="160" fill="#94a3b8" fontSize="7.5" textAnchor="middle">
                  ({item.diffLabel})
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* 2. LINE GRAPH SVG */}
      {prompt.chartType === 'line' && prompt.lineData && (
        <svg viewBox="0 0 360 165" className="w-full h-44">
          <line x1="42" y1="20" x2="342" y2="20" stroke="#334155" strokeDasharray="3 3" />
          <line x1="42" y1="58" x2="342" y2="58" stroke="#334155" strokeDasharray="3 3" />
          <line x1="42" y1="96" x2="342" y2="96" stroke="#334155" strokeDasharray="3 3" />
          <line x1="42" y1="134" x2="342" y2="134" stroke="#475569" strokeWidth="1.5" />

          <text x="36" y="24" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            {prompt.lineData.maxVal}
          </text>
          <text x="36" y="62" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            {Math.round(prompt.lineData.maxVal * 0.66)}
          </text>
          <text x="36" y="100" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            {Math.round(prompt.lineData.maxVal * 0.33)}
          </text>
          <text x="36" y="137" fill="#94a3b8" fontSize="8.5" textAnchor="end">
            0
          </text>

          {prompt.lineData.xLabels.map((xl, i) => {
            const x = 65 + i * 86;
            return (
              <text key={i} x={x} y="150" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
                {xl}
              </text>
            );
          })}

          {prompt.lineData.series.map((s, sIdx) => {
            const coords = s.values.map((v, i) => {
              const x = 65 + i * 86;
              const y = 134 - Math.round((v / prompt.lineData!.maxVal) * 110);
              return { x, y, v };
            });
            const pointsStr = coords.map((c) => `${c.x},${c.y}`).join(' ');
            return (
              <g key={sIdx}>
                <polyline fill="none" stroke={s.color} strokeWidth="2.5" points={pointsStr} />
                {coords.map((c, idx) => (
                  <g key={idx}>
                    <circle cx={c.x} cy={c.y} r="3.5" fill={s.color} />
                    <text
                      x={c.x}
                      y={c.y - 6}
                      fill={s.color}
                      fontSize="7.5"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {c.v}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      )}

      {/* 3. PIE / DONUT CHARTS SVG */}
      {prompt.chartType === 'pie' && prompt.pieData && (
        <div className="space-y-2">
          <svg viewBox="0 0 360 145" className="w-full h-36">
            {/* Left Donut */}
            <text x="85" y="16" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">
              {prompt.pieData.leftTitle}
            </text>
            {(() => {
              let acc = 0;
              const r = 38;
              const circ = 2 * Math.PI * r;
              return prompt.pieData!.slices.map((sl, i) => {
                const dash = (sl.leftPct / 100) * circ;
                const offset = -((acc / 100) * circ);
                acc += sl.leftPct;
                return (
                  <circle
                    key={i}
                    cx="85"
                    cy="76"
                    r={r}
                    fill="transparent"
                    stroke={sl.color}
                    strokeWidth="18"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={offset}
                  />
                );
              });
            })()}
            <text x="85" y="80" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
              100%
            </text>

            {/* Right Donut */}
            <text x="265" y="16" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">
              {prompt.pieData.rightTitle}
            </text>
            {(() => {
              let acc = 0;
              const r = 38;
              const circ = 2 * Math.PI * r;
              return prompt.pieData!.slices.map((sl, i) => {
                const dash = (sl.rightPct / 100) * circ;
                const offset = -((acc / 100) * circ);
                acc += sl.rightPct;
                return (
                  <circle
                    key={i}
                    cx="265"
                    cy="76"
                    r={r}
                    fill="transparent"
                    stroke={sl.color}
                    strokeWidth="18"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={offset}
                  />
                );
              });
            })()}
            <text x="265" y="80" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
              100%
            </text>
          </svg>

          {/* Pie Legend Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
            {prompt.pieData.slices.map((sl, i) => (
              <div key={i} className="bg-slate-800/90 rounded-lg px-2 py-1.5 border border-slate-700/80">
                <div className="flex items-center gap-1.5 font-bold text-white truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
                  <span>{sl.label}</span>
                </div>
                <div className="text-slate-300 font-mono text-[9.5px] mt-0.5">
                  {sl.leftPct}% → <span className="text-[#c4f82a] font-bold">{sl.rightPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. VISUAL PROCESS DIAGRAM SVG (Flowchart with Nodes, Icons & Arrows) */}
      {prompt.chartType === 'process' && prompt.processData && (
        <svg viewBox="0 0 360 175" className="w-full h-44">
          <defs>
            <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#c4f82a" />
            </marker>
          </defs>

          {/* Top Row: Steps 1 -> 2 -> 3 */}
          {prompt.processData.steps.slice(0, 3).map((st, idx) => {
            const x = 12 + idx * 118;
            const y = 14;
            return (
              <g key={st.num}>
                <rect
                  x={x}
                  y={y}
                  width="96"
                  height="58"
                  rx="10"
                  fill="#1e293b"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <circle cx={x + 16} cy={y + 16} r="9" fill="#7052ff" />
                <text x={x + 16} y={y + 19.5} fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {st.num}
                </text>
                <text x={x + 76} y={y + 21} fontSize="14" textAnchor="middle">
                  {st.icon}
                </text>
                <text x={x + 48} y={y + 38} fill="#f8fafc" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  {st.title}
                </text>
                <text x={x + 48} y={y + 50} fill="#94a3b8" fontSize="8" textAnchor="middle">
                  {st.sub}
                </text>
                {idx < 2 && (
                  <line
                    x1={x + 98}
                    y1={y + 29}
                    x2={x + 115}
                    y2={y + 29}
                    stroke="#c4f82a"
                    strokeWidth="2"
                    markerEnd="url(#arrowHead)"
                  />
                )}
              </g>
            );
          })}

          {/* Downward connector from Step 3 to Step 4 */}
          <path
            d="M 296 74 L 296 98"
            stroke="#c4f82a"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowHead)"
          />

          {/* Bottom Row: Steps 6 <- 5 <- 4 (displayed right-to-left for true cyclical flow) */}
          {[prompt.processData.steps[5], prompt.processData.steps[4], prompt.processData.steps[3]].map(
            (st, idx) => {
              if (!st) return null;
              const x = 12 + idx * 118;
              const y = 102;
              return (
                <g key={st.num}>
                  <rect
                    x={x}
                    y={y}
                    width="96"
                    height="58"
                    rx="10"
                    fill="#1e293b"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <circle cx={x + 16} cy={y + 16} r="9" fill="#10b981" />
                  <text x={x + 16} y={y + 19.5} fill="#091f1a" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {st.num}
                  </text>
                  <text x={x + 76} y={y + 21} fontSize="14" textAnchor="middle">
                    {st.icon}
                  </text>
                  <text x={x + 48} y={y + 38} fill="#f8fafc" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                    {st.title}
                  </text>
                  <text x={x + 48} y={y + 50} fill="#94a3b8" fontSize="8" textAnchor="middle">
                    {st.sub}
                  </text>
                  {idx > 0 && (
                    <line
                      x1={x - 3}
                      y1={y + 29}
                      x2={x - 20}
                      y2={y + 29}
                      stroke="#c4f82a"
                      strokeWidth="2"
                      markerEnd="url(#arrowHead)"
                    />
                  )}
                </g>
              );
            }
          )}

          {/* Optional Cyclical Arrow from Step 6 back up to Step 1 */}
          {prompt.processData.isCyclical && (
            <path
              d="M 55 100 L 55 76"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeDasharray="3 2"
              fill="none"
              markerEnd="url(#arrowHead)"
            />
          )}
        </svg>
      )}

      {/* 5. VISUAL MAP COMPARISON SVG (Before & After Side-by-Side Maps) */}
      {prompt.chartType === 'map' && prompt.mapData && (
        <svg viewBox="0 0 360 165" className="w-full h-44">
          {/* Left Map Box */}
          <rect x="6" y="6" width="164" height="152" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <text x="88" y="20" fill="#cbd5e1" fontSize="9.5" fontWeight="bold" textAnchor="middle">
            {prompt.mapData.yearA}
          </text>
          {/* Road & River */}
          <line x1="12" y1="78" x2="164" y2="78" stroke="#475569" strokeWidth="4" strokeDasharray="5 3" />
          {prompt.mapData.featuresA.map((f, i) => (
            <g key={i}>
              <rect x={6 + f.x} y={18 + f.y} width={f.w} height={f.h} rx="5" fill={f.color} opacity="0.88" />
              <text
                x={6 + f.x + f.w / 2}
                y={18 + f.y + f.h / 2 + 3}
                fill="#ffffff"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {f.label}
              </text>
            </g>
          ))}

          {/* Center Arrow */}
          <text x="180" y="86" fill="#c4f82a" fontSize="13" fontWeight="bold" textAnchor="middle">
            ⇒
          </text>

          {/* Right Map Box */}
          <rect x="190" y="6" width="164" height="152" rx="10" fill="#0f172a" stroke="#c4f82a" strokeWidth="1.2" />
          <text x="272" y="20" fill="#c4f82a" fontSize="9.5" fontWeight="bold" textAnchor="middle">
            {prompt.mapData.yearB}
          </text>
          <line x1="196" y1="78" x2="348" y2="78" stroke="#64748b" strokeWidth="4" />
          {prompt.mapData.featuresB.map((f, i) => (
            <g key={i}>
              <rect x={190 + f.x} y={18 + f.y} width={f.w} height={f.h} rx="5" fill={f.color} opacity="0.92" />
              <text
                x={190 + f.x + f.w / 2}
                y={18 + f.y + f.h / 2 + 3}
                fill="#ffffff"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {f.label}
              </text>
            </g>
          ))}
        </svg>
      )}

      {/* 6. DATA TABLE */}
      {prompt.chartType === 'table' && prompt.tableData && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-1.5">{prompt.tableData.headers[0]}</th>
                <th className="py-1.5 text-right text-[#7052ff]">{prompt.tableData.headers[1]}</th>
                <th className="py-1.5 text-right text-[#c4f82a]">{prompt.tableData.headers[2]}</th>
                <th className="py-1.5 text-right text-sky-400">{prompt.tableData.headers[3]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {prompt.tableData.rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 font-sans font-medium">{r[0]}</td>
                  <td className="text-right font-bold">{r[1]}</td>
                  <td className="text-right font-bold text-[#c4f82a]">{r[2]}</td>
                  <td className="text-right text-sky-300">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
        <div>{prompt.summaryLeft}</div>
        <div>{prompt.summaryRight}</div>
      </div>
    </div>
  );
};
