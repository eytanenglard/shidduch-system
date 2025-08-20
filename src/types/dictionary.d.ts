// src/types/dictionary.ts

// --- Navbar ---
export type NavbarDict = {
  myMatches: string;
  matchmakingQuestionnaire: string;
  messages: string;
  login: string;
  register: string;
  toQuestionnaire: string;
};

// --- Hero Section ---
type PrincipleDict = {
  title: string;
  shortTitle: string;
  description: string;
};

export type HeroSectionDict = {
  titleLine1: string;
  highlightedWord: string;
  typewriterText: string;
  ctaButton: string;
  secondaryButton: string;
  principlesHeader: {
    title: string;
    subtitle: string;
  };
  principles: PrincipleDict[];
  synergy: {
    techTools: string;
    personalGuidance: string;
  };
};

// --- Value Proposition Section ---
type SolutionItemDict = {
  bold: string;
  text?: string;
  textWithLink?: {
    part1: string;
    linkText: string;
    part2: string;
  };
};

export type ValuePropositionDict = {
  title_part1: string;
  title_brand: string;
  title_part2: string;
  subtitle: string;
  challengeCard: {
    title: string;
    items: string[];
  };
  solutionCard: {
    title: string;
    items: SolutionItemDict[];
  };
};

// --- Our Method Section ---
type WorldDict = {
  title: string;
  shortDesc: string;
  fullDescription: string;
  personalExample: string;
  insight: string;
};

export type OurMethodDict = {
  constellation: {
    header: string;
    title_part1: string;
    title_part2: string;
    subtitle: string;
    cta_header: string;
    cta_title_part1: string;
    cta_title_part2: string;
    cta_subtitle: string;
    cta_button: string;
    cta_features: string;
    worlds: WorldDict[];
  };
};

// --- How It Works Section ---
type StepDict = {
  title: string;
  description: string;
  linkText?: string;
};

type BenefitDict = {
  title: string;
  description: string;
};

export type HowItWorksDict = {
  promise: {
    header: string;
    title_line1: string;
    title_line2_part1: string;
    title_line2_part2: string;
    subtitle_line1: string;
    subtitle_line2: string;
  };
  process: {
    steps: StepDict[];
  };
  proof: {
    header: string;
    title_part1: string;
    title_part2: string;
    subtitle: string;
    demo_female: string;
    demo_male: string;
  };
  keyBenefits: {
    title_part1: string;
    title_part2: string;
    benefits: BenefitDict[];
  };
  testimonial: {
    header: string;
    quote: string;
    author_name: string;
    author_role: string;
  };
  finalCta: {
    title_line1: string;
    title_line2: string;
    subtitle_line1: string;
    subtitle_line2: string;
    button: string;
    features: string;
  };
};


// --- The Master Dictionary Type for HomePage ---
export type HomePageDictionary = {
  navbar: NavbarDict;
  heroSection: HeroSectionDict;
  valueProposition: ValuePropositionDict;
  ourMethod: OurMethodDict;
  howItWorks: HowItWorksDict;
  // כאן תוכל להוסיף את הטיפוסים של שאר החלקים בעתיד
};