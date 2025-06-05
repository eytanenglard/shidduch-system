// src/lib/languageOptions.ts (או נתיב אחר שתבחר)

export interface LanguageOption {
  value: string;
  label: string;
}

const preferredLanguagesValues: string[] = [
  "hebrew",
  "yiddish",
  "ladino",
  "english",
  "french",
  "spanish",
  "russian",
  "german",
  "portuguese",
  "italian",
  "arabic", // חשובה ליהודים מארצות ערב וליהודים בישראל
  "amharic", // לקהילת יוצאי אתיופיה
  "hungarian",
  "polish",
  "romanian",
  "dutch",
  "persian", // לקהילת יוצאי איראן
  "georgian", // לקהילת יוצאי גאורגיה
  "turkish", // לקהילות יהודיות בטורקיה ובבלקן
  "ukrainian",
  // אפשר להוסיף כאן עוד ערכי 'value' של שפות שחשוב לך שיופיעו למעלה
];

const allLanguageOptions: LanguageOption[] = [
  // רשימת 100 השפות מהתשובה הקודמת נכנסת כאן.
  // לצורך קיצור, אשים רק חלק, אבל תעתיק את הרשימה המלאה שסיפקתי קודם.
  { value: "uzbek", label: "אוזבקית" },
  { value: "ukrainian", label: "אוקראינית" },
  { value: "urdu", label: "אורדו" },
  { value: "oromo", label: "אורומו" },
  { value: "azerbaijani", label: "אזרית" },
  { value: "igbo", label: "איגבו" },
  { value: "italian", label: "איטלקית" },
  { value: "indonesian", label: "אינדונזית" },
  { value: "icelandic", label: "איסלנדית" },
  { value: "irish_gaelic", label: "אירית (גאלית)" },
  { value: "albanian", label: "אלבנית" },
  { value: "amharic", label: "אמהרית" },
  { value: "english", label: "אנגלית" },
  { value: "estonian", label: "אסטונית" },
  { value: "esperanto", label: "אספרנטו" },
  { value: "afrikaans", label: "אפריקאנס" },
  { value: "armenian", label: "ארמנית" },
  { value: "bashkir", label: "בשקירית" },
  { value: "bulgarian", label: "בולגרית" },
  { value: "bosnian", label: "בוסנית" },
  { value: "burmese_myanmar", label: "בורמזית (מיאנמרית)" },
  { value: "belarusian", label: "בלארוסית" },
  { value: "bengali", label: "בנגלית" },
  { value: "basque", label: "בסקית" },
  { value: "breton", label: "ברטונית" },
  { value: "georgian", label: "גאורגית" },
  { value: "gujarati", label: "גוג'ראטית" },
  { value: "guarani", label: "גוארני" },
  { value: "galician", label: "גליסית" },
  { value: "german", label: "גרמנית" },
  { value: "danish", label: "דנית" },
  { value: "hausa", label: "האוסה" },
  { value: "hawaiian", label: "הוואית" },
  { value: "dutch", label: "הולנדית" },
  { value: "hungarian", label: "הונגרית" },
  { value: "hindi", label: "הינדי" },
  { value: "vietnamese", label: "וייטנאמית" },
  { value: "welsh", label: "וולשית" },
  { value: "zulu", label: "זולו" },
  { value: "khmer_cambodian", label: "חמר (קמבודית)" },
  { value: "tagalog_filipino", label: "טאגאלוג (פיליפינית)" },
  { value: "tatar", label: "טטרית" },
  { value: "turkish", label: "טורקית" },
  { value: "turkmen", label: "טורקמנית" },
  { value: "tigrinya", label: "טיגרינית" },
  { value: "tibetan", label: "טיבטית" },
  { value: "telugu", label: "טלוגו" },
  { value: "tamil", label: "טמילית" },
  { value: "yiddish", label: "יידיש" },
  { value: "yoruba", label: "יורובה" },
  { value: "japanese", label: "יפנית" },
  { value: "greek", label: "יוונית" },
  { value: "ladino", label: "לדינו" },
  { value: "lao", label: "לאו (לאוטית)" },
  { value: "luxembourgish", label: "לוקסמבורגית" },
  { value: "latvian", label: "לטבית" },
  { value: "lithuanian", label: "ליטאית" },
  { value: "maori", label: "מאורית" },
  { value: "mongolian", label: "מונגולית" },
  { value: "malayalam", label: "מלאיאלאם" },
  { value: "malay", label: "מלאית" },
  { value: "maltese", label: "מלטזית" },
  { value: "macedonian", label: "מקדונית" },
  { value: "marathi", label: "מראטהית" },
  { value: "norwegian", label: "נורווגית" },
  { value: "nepali", label: "נפאלית" },
  { value: "swahili", label: "סוואהילי" },
  { value: "somali", label: "סומלית" },
  { value: "sanskrit", label: "סנסקריט" },
  { value: "sinhala", label: "סינהלית" },
  { value: "chinese_mandarin", label: "סינית (מנדרינית)" },
  { value: "slovak", label: "סלובקית" },
  { value: "slovenian", label: "סלובנית" },
  { value: "serbian", label: "סרבית" },
  { value: "spanish", label: "ספרדית" },
  { value: "scottish_gaelic", label: "סקוטית גאלית" },
  { value: "hebrew", label: "עברית" },
  { value: "arabic", label: "ערבית" },
  { value: "faroese", label: "פארואזית" },
  { value: "papiamento", label: "פאפיאמנטו" },
  { value: "punjabi", label: "פנג'אבי" },
  { value: "pashto", label: "פשטו" },
  { value: "polish", label: "פולנית" },
  { value: "portuguese", label: "פורטוגזית" },
  { value: "finnish", label: "פינית" },
  { value: "flemish", label: "פלמית (ניב הולנדי)" },
  { value: "persian", label: "פרסית" },
  { value: "chuvash", label: "צ'ובשית" },
  { value: "czech", label: "צ'כית" },
  { value: "french", label: "צרפתית" },
  { value: "kurdish", label: "כורדית (כל הניבים)" },
  { value: "kazakh", label: "קזחית" },
  { value: "quechua", label: "קצ'ואה" },
  { value: "kyrgyz", label: "קירגיזית" },
  { value: "catalan", label: "קטלאנית" },
  { value: "kannada", label: "קנאדה" },
  { value: "croatian", label: "קרואטית" },
  { value: "korean", label: "קוריאנית" },
  { value: "haitian_creole", label: "קריאולית האיטית" },
  { value: "romanian", label: "רומנית" },
  { value: "russian", label: "רוסית" },
  { value: "swedish", label: "שוודית" },
  { value: "thai", label: "תאית" },
];

// פונקציית עזר למיון לפי מחרוזת בעברית
const hebrewSort = (a: LanguageOption, b: LanguageOption): number => {
  return a.label.localeCompare(b.label, "he");
};

// הפרדת השפות המועדפות מהשאר
const preferred = allLanguageOptions
  .filter(lang => preferredLanguagesValues.includes(lang.value))
  .sort(hebrewSort);

const others = allLanguageOptions
  .filter(lang => !preferredLanguagesValues.includes(lang.value))
  .sort(hebrewSort);

// איחוד הרשימות הממוינות
export const languageOptions: LanguageOption[] = [...preferred, ...others];