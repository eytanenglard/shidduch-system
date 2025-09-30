// src/components/HomePage/components/demo-content/en.ts

export const femaleProfileContent = {
  firstName: 'Noa',
  lastName: 'Israeli',
  occupation: 'Senior UX/UI Designer',
  city: 'Tel Aviv',
  education: 'B.Des in Visual Communication, Bezalel; Graduate of Lindenbaum Midrasha',
  serviceDetails: 'Meaningful two-year National Service at "Krembo Wings" with children with special needs.',
  religiousLevel: 'dati_leumi_liberal',
  about: 'An optimist, creative, and a lover of good conversations. I grew up in a warm home where I learned what a partnership based on friendship and mutual respect looks like. After a challenging and fulfilling National Service at "Krembo Wings," I pursued a career in design, where I express my artistic soul. I\'m a people person, but I also enjoy my quiet time with a good book or a walk in nature. I\'m looking for a life partner, a man with a good heart and an open mind, to build a happy home together, with space for personal and mutual growth, where communication is the key to everything.',
  profileHeadline: 'Designing life with a smile, looking for a partner for the adventure.',

  formattedAnswers: {
    PERSONALITY: [
      {
        questionId: 'demo_noa_p1',
        question: "How would you describe yourself in 3-5 sentences?",
        questionType: 'openText',
        rawValue: "I'm an optimistic and positive person who believes you can find the good in any situation. I'm very creative, which is expressed in my work and hobbies, and I have good listening skills - friends say I'm 'receptive'. I value deep conversations, but I also love to laugh and enjoy the simple things.",
        displayText: "I'm an optimistic and positive person who believes you can find the good in any situation. I'm very creative, which is expressed in my work and hobbies, and I have good listening skills - friends say I'm 'receptive'. I value deep conversations, but I also love to laugh and enjoy the simple things.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_p2',
        question: "What is your natural 'biological clock'?",
        questionType: 'scale',
        rawValue: 7,
        displayText: "I lean towards being a 'night owl' - I'm more creative and productive in the evening hours.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_p3',
        question: "When you feel overwhelmed, what are your 'go-to' strategies for resetting?",
        questionType: 'multiSelect',
        rawValue: ['A good talk with a friend', 'Getting out into nature', 'Engaging in a creative hobby'],
        displayText: "My main strategies are a good talk with a friend, getting out into nature, and engaging in art or a creative hobby.",
        isVisible: true, answeredAt: new Date(),
      },
    ],
    VALUES: [
      {
        questionId: 'demo_noa_v1',
        question: "Share a story of a time you followed your most important value.",
        questionType: 'openText',
        rawValue: "The most important value to me is mutual respect. At a professional crossroads, I could have taken a big project at a colleague's expense, but I chose to collaborate. Although I earned less personal 'credit', we built something better together and maintained a healthy relationship. It was proof to myself that the journey is just as important as the destination.",
        displayText: "The most important value to me is mutual respect. At a professional crossroads, I could have taken a big project at a colleague's expense, but I chose to collaborate. Although I earned less personal 'credit', we built something better together and maintained a healthy relationship. It was proof to myself that the journey is just as important as the destination.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_v2',
        question: "What is your definition of a 'rich life,' independent of money?",
        questionType: 'openText',
        rawValue: "A rich life is a life full of deep connections, experiences that expand the heart, and creation that gives expression to the soul. It's a wealth of time and meaning, not of objects.",
        displayText: "A rich life is a life full of deep connections, experiences that expand the heart, and creation that gives expression to the soul. It's a wealth of time and meaning, not of objects.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_v3',
        question: "At this stage of your life, how is your attention distributed among different areas?",
        questionType: 'budgetAllocation',
        rawValue: { 'Partnership': 30, 'Family': 20, 'Leisure & Self-Care': 20, 'Career': 15, 'Friends & Community': 10, 'Spirituality': 5 },
        displayText: "The answer is displayed as a visual chart.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    RELATIONSHIP: [
      {
        questionId: 'demo_noa_r1',
        question: "What's your 'formula' for sharing responsibilities in managing a home?",
        questionType: 'openText',
        rawValue: "I believe in a full and flexible partnership, like I saw in my parents' home. Not fixed 'roles', but a team that works together according to strengths and available time. It's all about open communication.",
        displayText: "I believe in a full and flexible partnership, like I saw in my parents' home. Not fixed 'roles', but a team that works together according to strengths and available time. It's all about open communication.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_r2',
        question: "After a disagreement, what is the most effective way for you to 'repair' the connection?",
        questionType: 'iconChoice',
        rawValue: 'processing_talk',
        displayText: "A calm conversation to process what happened, to listen, and to reach a mutual understanding.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_r3',
        question: "In the balance between 'we' and 'me' time, where do you naturally fall?",
        questionType: 'scale',
        rawValue: 7,
        displayText: "I thrive on shared time and activities, but it's also important for me to maintain personal space and my own hobbies.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    PARTNER: [
      {
        questionId: 'demo_noa_pa1',
        question: "What is the one character trait your partner must have?",
        questionType: 'openText',
        rawValue: "The one quality upon which everything rests is kindness. A person with a good heart is someone who knows how to give, receive, forgive, and be a true partner. Everything else is built on this foundation.",
        displayText: "The one quality upon which everything rests is kindness. A person with a good heart is someone who knows how to give, receive, forgive, and be a true partner. Everything else is built on this foundation.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_pa2',
        question: "Which trait, perhaps less developed in you, would you be happy to find in a partner to complement you?",
        questionType: 'openText',
        rawValue: "I'm a person who thinks a lot and sometimes hesitates. I would be happy to find someone a bit more decisive and confident, someone who can help me jump into the water sometimes and balance my tendency to overthink.",
        displayText: "I'm a person who thinks a lot and sometimes hesitates. I would be happy to find someone a bit more decisive and confident, someone who can help me jump into the water sometimes and balance my tendency to overthink.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_pa3',
        question: "When you think of an 'intelligent' partner, which type do you value most?",
        questionType: 'budgetAllocation',
        rawValue: { 'Emotional': 40, 'Creative': 30, 'Life Smarts': 20, 'Analytical': 10 },
        displayText: "The answer is displayed as a visual chart.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    RELIGION: [
      {
        questionId: 'demo_noa_re1',
        question: "What is your vision for the education of the children in the home you'll build?",
        questionType: 'openText',
        rawValue: 'My vision is to establish a home where children grow up with values of giving, love of Torah, and the Land of Israel. It is important to me that the education be open and allow for questioning, one that nurtures thinking individuals with a deep, internal reverence for God.',
        displayText: 'My vision is to establish a home where children grow up with values of giving, love of Torah, and the Land of Israel. It is important to me that the education be open and allow for questioning, one that nurtures thinking individuals with a deep, internal reverence for God.',
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_re2',
        question: "What is the core experience you seek and receive from Shabbat?",
        questionType: 'iconChoice',
        rawValue: 'family_time',
        displayText: "Time for family, for togetherness, and for conversation. The quiet moments of a Shabbat meal are sacred to me.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_noa_re3',
        question: "How flexible would you be if there were differences in Halachic practice between you and a partner?",
        questionType: 'scale',
        rawValue: 8,
        displayText: "I am very flexible and open. I believe a relationship is a journey of mutual growth, and as long as there is a foundation of respect and reverence for God, we can find a shared path.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
  },
};

export const maleProfileContent = {
  firstName: 'Daniel',
  lastName: 'Cohen',
  occupation: 'Software Engineer & M.Sc. Student',
  city: 'Jerusalem',
  education: 'Graduate of Yeshivat Har Etzion; B.Sc. in Software Engineering, Technion',
  serviceDetails: 'Significant service as an officer in the Combat Engineering Corps, company commander and platoon leader.',
  religiousLevel: 'dati_leumi_torani',
  about: 'A man of people and action, I combine worlds that seem distant but for me are one - the dynamism of high-tech and the depth of the Beit Midrash. My service as a combat officer shaped me and taught me a great deal about responsibility, leadership, and true friendship. I believe true growth happens outside the comfort zone, whether in a complex project at work or a challenging sugya in Gemara. I\'m looking for a true life partner to build a home together with reverence for God, open-mindedness, a lot of joy, and a constant desire to grow and develop together.',
  profileHeadline: 'Engineer by day, Torah scholar by night. Seeking a partner to build a world with.',
  
  formattedAnswers: {
    PERSONALITY: [
      {
        questionId: 'demo_daniel_p1',
        question: "What are the 3-5 key things you'd want us to highlight so people understand who you truly are?",
        questionType: 'openText',
        rawValue: "I'm a man of action, I love challenges and goals. Reliability is very important to me, and I always try to stand by my word. I have a strong analytical side, which I got from my studies at Yeshivat HaGush and in engineering, but I balance it with a creative side - I love playing the guitar and connect deeply with the world of Hasidut. I seek constant growth, both in my career and personal life.",
        displayText: "I'm a man of action, I love challenges and goals. Reliability is very important to me, and I always try to stand by my word. I have a strong analytical side, which I got from my studies at Yeshivat HaGush and in engineering, but I balance it with a creative side - I love playing the guitar and connect deeply with the world of Hasidut. I seek constant growth, both in my career and personal life.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_p2',
        question: "Which 'operating system' best describes how you function day-to-day?",
        questionType: 'iconChoice',
        rawValue: 'task_oriented',
        displayText: "Mission-Oriented: I function best with clear goals to accomplish.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_p3',
        question: "Share a story about a significant failure or challenge and what you learned from it.",
        questionType: 'openText',
        rawValue: "I failed an important exam in my undergraduate studies. It taught me the importance of perseverance, the ability to get up after a fall, and most importantly, that failure is not the end of the world but an opportunity to learn and improve.",
        displayText: "I failed an important exam in my undergraduate studies. It taught me the importance of perseverance, the ability to get up after a fall, and most importantly, that failure is not the end of the world but an opportunity to learn and improve.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    VALUES: [
      {
        questionId: 'demo_daniel_v1',
        question: "Share a story of a time you followed your most important value.",
        questionType: 'openText',
        rawValue: "My central value is responsibility. When I served as an officer in the Combat Engineering Corps, I had to make a complex operational decision under pressure. I chose the safer course of action, even though it was less 'glamorous'. It was a decision based on responsibility for the lives of my soldiers, and it reinforced my understanding that integrity and responsibility are above all else.",
        displayText: "My central value is responsibility. When I served as an officer in the Combat Engineering Corps, I had to make a complex operational decision under pressure. I chose the safer course of action, even though it was less 'glamorous'. It was a decision based on responsibility for the lives of my soldiers, and it reinforced my understanding that integrity and responsibility are above all else.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_v2',
        question: "Who are the people you admire as role models, and why?",
        questionType: 'openText',
        rawValue: "Rabbi Sacks zt\"l. His ability to bridge worlds, to present deep and relevant Jewish thought, and to be a man of both spirit and action at the highest level is a huge inspiration for me.",
        displayText: "Rabbi Sacks zt\"l. His ability to bridge worlds, to present deep and relevant Jewish thought, and to be a man of both spirit and action at the highest level is a huge inspiration for me.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_v3',
        question: "What is your approach to lifelong learning and intellectual growth?",
        questionType: 'iconChoice',
        rawValue: 'lifelong_learning',
        displayText: "It's an essential part of who I am - I am always reading, learning, and developing, both in my professional field and in my Torah studies.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    RELATIONSHIP: [
      {
        questionId: 'demo_daniel_r1',
        question: "What's one thing a relationship can't survive without for you, and what is your greatest aspiration?",
        questionType: 'openText',
        rawValue: "The absolute deal-breaker is a lack of integrity. The greatest aspiration is a true partnership. The knowledge that I have someone by my side, that we are a team against whatever life brings, and that we always look out for each other.",
        displayText: "The absolute deal-breaker is a lack of integrity. The greatest aspiration is a true partnership. The knowledge that I have someone by my side, that we are a team against whatever life brings, and that we always look out for each other.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_r2',
        question: "What's more important in a partner: someone who accepts you as you are, or someone who challenges you to grow?",
        questionType: 'scale',
        rawValue: 7,
        displayText: "Acceptance is very important, but I'm looking for a partner who will help me be the best version of myself, and challenge me when needed. Shared growth is a supreme value in my eyes.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_r3',
        question: "When your partner comes home after a terrible day, what is your natural response?",
        questionType: 'iconChoice',
        rawValue: 'analyze_solve',
        displayText: "My initial tendency is to try to understand what happened, analyze the situation, and think together about practical solutions that could help.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    PARTNER: [
      {
        questionId: 'demo_daniel_pa1',
        question: "Which trait, perhaps less developed in you, would you be happy to find in a partner to complement you?",
        questionType: 'openText',
        rawValue: "As someone who is used to planning and acting in a very structured way, I would be happy to find someone with more spontaneity and flow, someone who will help me get out of the box sometimes and bring some adventure into life.",
        displayText: "As someone who is used to planning and acting in a very structured way, I would be happy to find someone with more spontaneity and flow, someone who will help me get out of the box sometimes and bring some adventure into life.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_pa2',
        question: "How would you allocate 100 'compatibility points' among the most essential character traits for you in a partner?",
        questionType: 'budgetAllocation',
        rawValue: { 'Integrity & Honesty': 30, 'Maturity & Stability': 25, 'Ambition & Growth': 20, 'Optimism': 15, 'Good Communication': 10 },
        displayText: "The answer is displayed as a visual chart.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_pa3',
        question: "What is your absolute 'red line,' a trait you could not live with?",
        questionType: 'openText',
        rawValue: "A red line for me is a lack of ambition to develop and improve. I'm not looking for someone perfect, but it's important to me that she has an internal motivation to grow, learn, and be a better version of herself. Passivity and an unwillingness to face challenges is something I find very difficult to connect with.",
        displayText: "A red line for me is a lack of ambition to develop and improve. I'm not looking for someone perfect, but it's important to me that she has an internal motivation to grow, learn, and be a better version of herself. Passivity and an unwillingness to face challenges is something I find very difficult to connect with.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
    RELIGION: [
      {
        questionId: 'demo_daniel_re1',
        question: "What prayer, Jewish concept, or idea resonates most with you?",
        questionType: 'openText',
        rawValue: "A passage from Rabbi Sacks that talks about 'faith as an ongoing conversation'. It connects with my perception that faith is not static, but a dynamic journey of questions, searching, and answers, which fascinates me.",
        displayText: "A passage from Rabbi Sacks that talks about 'faith as an ongoing conversation'. It connects with my perception that faith is not static, but a dynamic journey of questions, searching, and answers, which fascinates me.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_re2',
        question: "In building a Jewish home, how do you envision the partnership regarding roles and responsibilities?",
        questionType: 'budgetAllocation',
        rawValue: { 'Flexible': 60, 'Traditional': 30, 'Egalitarian': 10 },
        displayText: "The answer is displayed as a visual chart.",
        isVisible: true, answeredAt: new Date(),
      },
      {
        questionId: 'demo_daniel_re3',
        question: "What role does spiritual guidance (from a Rabbi, etc.) play in your life when making significant decisions?",
        questionType: 'scale',
        rawValue: 8,
        displayText: "Consulting with a spiritual figure is an integral part of my decision-making process on significant issues. I see it as a source of wisdom, balance, and connection to tradition.",
        isVisible: true, answeredAt: new Date(),
      }
    ],
  },
};

export const suggestionContent = {
  femaleToMaleReason: 'I connected you because I identified in both of you a similar aspiration for a life of meaning, where there is room for both depth and lightness. Daniel\'s stability, responsibility, and calmness, combined with Noa\'s warmth, creativity, and optimism, create tremendous potential for a partnership based on both security and inspiration. I believe your conversations could be fascinating, and you have a strong shared value base to build a real home upon.',
  femaleToMalePersonalNote: 'Daniel is a serious, value-driven man with a heart of gold. He impressively combines the world of Torah (a graduate of HaGush) with the world of action (a Technion-educated engineer) and is looking for a true life partner. I think you two have a lot to talk about.',
  maleToFemaleReason: 'What particularly resonated with me in your connection is the shared search for a "true partnership" – a relationship based on friendship, growth, and mutual respect. Your stability and pursuit of meaning, together with Noa\'s creativity, optimism, and empathy, which are also reflected in her professional and volunteer choices, create an amazing foundation for a real, deep, and joyful relationship.',
  maleToFemalePersonalNote: 'This is a suggestion I am particularly excited to present to you. Noa is a high-quality woman, with a depth and sensitivity that are rare to find. I think she is exactly what you were looking for.',
};

export const aiAnalysisContent = {
  forMaleTitle: 'A Partnership of Stability and Creativity',
  forMaleSummary: 'The connection between Daniel and Noa shows particularly high potential, based on a fascinating balance between shared core values and complementary personalities. The combination of Daniel\'s practical, ambitious nature and Noa\'s emotional depth and creativity creates a solid foundation for a long-term partnership.',
  forFemaleTitle: 'A Connection of Optimism and Responsibility',
  forFemaleSummary: 'The match between Noa and Daniel is very promising, based on a deep connection at the level of values and personality. Noa\'s creativity and optimism harmoniously complement Daniel\'s stability and responsibility, creating potential for a balanced and supportive relationship.',
};

export const matchmakerContent = {
  dina: {
    firstName: 'Dina',
    lastName: 'Englerd'
  },
  eytan: {
    firstName: 'Eytan',
    lastName: 'Englerd'
  }
};