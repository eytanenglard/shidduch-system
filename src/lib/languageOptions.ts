// src/lib/languageOptions.ts

// 1. עדכון המבנה לתמיכה בריבוי שפות
export interface LanguageOption {
  value: string;
  label: {
    he: string;
    en: string;
  };
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
  "arabic",
  "amharic",
  "hungarian",
  "polish",
  "romanian",
  "dutch",
  "persian",
  "georgian",
  "turkish",
  "ukrainian",
];

// רשימת השפות המלאה עם תרגום לעברית ואנגלית
const allLanguageOptions: LanguageOption[] = [
  { value: "uzbek", label: { he: "אוזבקית", en: "Uzbek" } },
  { value: "ukrainian", label: { he: "אוקראינית", en: "Ukrainian" } },
  { value: "urdu", label: { he: "אורדו", en: "Urdu" } },
  { value: "oromo", label: { he: "אורומו", en: "Oromo" } },
  { value: "azerbaijani", label: { he: "אזרית", en: "Azerbaijani" } },
  { value: "igbo", label: { he: "איגבו", en: "Igbo" } },
  { value: "italian", label: { he: "איטלקית", en: "Italian" } },
  { value: "indonesian", label: { he: "אינדונזית", en: "Indonesian" } },
  { value: "icelandic", label: { he: "איסלנדית", en: "Icelandic" } },
  { value: "irish_gaelic", label: { he: "אירית (גאלית)", en: "Irish (Gaelic)" } },
  { value: "albanian", label: { he: "אלבנית", en: "Albanian" } },
  { value: "amharic", label: { he: "אמהרית", en: "Amharic" } },
  { value: "english", label: { he: "אנגלית", en: "English" } },
  { value: "estonian", label: { he: "אסטונית", en: "Estonian" } },
  { value: "esperanto", label: { he: "אספרנטו", en: "Esperanto" } },
  { value: "afrikaans", label: { he: "אפריקאנס", en: "Afrikaans" } },
  { value: "armenian", label: { he: "ארמנית", en: "Armenian" } },
  { value: "bashkir", label: { he: "בשקירית", en: "Bashkir" } },
  { value: "bulgarian", label: { he: "בולגרית", en: "Bulgarian" } },
  { value: "bosnian", label: { he: "בוסנית", en: "Bosnian" } },
  { value: "burmese_myanmar", label: { he: "בורמזית (מיאנמרית)", en: "Burmese (Myanmar)" } },
  { value: "belarusian", label: { he: "בלארוסית", en: "Belarusian" } },
  { value: "bengali", label: { he: "בנגלית", en: "Bengali" } },
  { value: "basque", label: { he: "בסקית", en: "Basque" } },
  { value: "breton", label: { he: "ברטונית", en: "Breton" } },
  { value: "georgian", label: { he: "גאורגית", en: "Georgian" } },
  { value: "gujarati", label: { he: "גוג'ראטית", en: "Gujarati" } },
  { value: "guarani", label: { he: "גוארני", en: "Guarani" } },
  { value: "galician", label: { he: "גליסית", en: "Galician" } },
  { value: "german", label: { he: "גרמנית", en: "German" } },
  { value: "danish", label: { he: "דנית", en: "Danish" } },
  { value: "hausa", label: { he: "האוסה", en: "Hausa" } },
  { value: "hawaiian", label: { he: "הוואית", en: "Hawaiian" } },
  { value: "dutch", label: { he: "הולנדית", en: "Dutch" } },
  { value: "hungarian", label: { he: "הונגרית", en: "Hungarian" } },
  { value: "hindi", label: { he: "הינדי", en: "Hindi" } },
  { value: "vietnamese", label: { he: "וייטנאמית", en: "Vietnamese" } },
  { value: "welsh", label: { he: "וולשית", en: "Welsh" } },
  { value: "zulu", label: { he: "זולו", en: "Zulu" } },
  { value: "khmer_cambodian", label: { he: "חמר (קמבודית)", en: "Khmer (Cambodian)" } },
  { value: "tagalog_filipino", label: { he: "טאגאלוג (פיליפינית)", en: "Tagalog (Filipino)" } },
  { value: "tatar", label: { he: "טטרית", en: "Tatar" } },
  { value: "turkish", label: { he: "טורקית", en: "Turkish" } },
  { value: "turkmen", label: { he: "טורקמנית", en: "Turkmen" } },
  { value: "tigrinya", label: { he: "טיגרינית", en: "Tigrinya" } },
  { value: "tibetan", label: { he: "טיבטית", en: "Tibetan" } },
  { value: "telugu", label: { he: "טלוגו", en: "Telugu" } },
  { value: "tamil", label: { he: "טמילית", en: "Tamil" } },
  { value: "yiddish", label: { he: "יידיש", en: "Yiddish" } },
  { value: "yoruba", label: { he: "יורובה", en: "Yoruba" } },
  { value: "japanese", label: { he: "יפנית", en: "Japanese" } },
  { value: "greek", label: { he: "יוונית", en: "Greek" } },
  { value: "ladino", label: { he: "לדינו", en: "Ladino" } },
  { value: "lao", label: { he: "לאו (לאוטית)", en: "Lao" } },
  { value: "luxembourgish", label: { he: "לוקסמבורגית", en: "Luxembourgish" } },
  { value: "latvian", label: { he: "לטבית", en: "Latvian" } },
  { value: "lithuanian", label: { he: "ליטאית", en: "Lithuanian" } },
  { value: "maori", label: { he: "מאורית", en: "Maori" } },
  { value: "mongolian", label: { he: "מונגולית", en: "Mongolian" } },
  { value: "malayalam", label: { he: "מלאיאלאם", en: "Malayalam" } },
  { value: "malay", label: { he: "מלאית", en: "Malay" } },
  { value: "maltese", label: { he: "מלטזית", en: "Maltese" } },
  { value: "macedonian", label: { he: "מקדונית", en: "Macedonian" } },
  { value: "marathi", label: { he: "מראטהית", en: "Marathi" } },
  { value: "norwegian", label: { he: "נורווגית", en: "Norwegian" } },
  { value: "nepali", label: { he: "נפאלית", en: "Nepali" } },
  { value: "swahili", label: { he: "סוואהילי", en: "Swahili" } },
  { value: "somali", label: { he: "סומלית", en: "Somali" } },
  { value: "sanskrit", label: { he: "סנסקריט", en: "Sanskrit" } },
  { value: "sinhala", label: { he: "סינהלית", en: "Sinhala" } },
  { value: "chinese_mandarin", label: { he: "סינית (מנדרינית)", en: "Chinese (Mandarin)" } },
  { value: "slovak", label: { he: "סלובקית", en: "Slovak" } },
  { value: "slovenian", label: { he: "סלובנית", en: "Slovenian" } },
  { value: "serbian", label: { he: "סרבית", en: "Serbian" } },
  { value: "spanish", label: { he: "ספרדית", en: "Spanish" } },
  { value: "scottish_gaelic", label: { he: "סקוטית גאלית", en: "Scottish Gaelic" } },
  { value: "hebrew", label: { he: "עברית", en: "Hebrew" } },
  { value: "arabic", label: { he: "ערבית", en: "Arabic" } },
  { value: "faroese", label: { he: "פארואזית", en: "Faroese" } },
  { value: "papiamento", label: { he: "פאפיאמנטו", en: "Papiamento" } },
  { value: "punjabi", label: { he: "פנג'אבי", en: "Punjabi" } },
  { value: "pashto", label: { he: "פשטו", en: "Pashto" } },
  { value: "polish", label: { he: "פולנית", en: "Polish" } },
  { value: "portuguese", label: { he: "פורטוגזית", en: "Portuguese" } },
  { value: "finnish", label: { he: "פינית", en: "Finnish" } },
  { value: "flemish", label: { he: "פלמית (ניב הולנדי)", en: "Flemish" } },
  { value: "persian", label: { he: "פרסית", en: "Persian" } },
  { value: "chuvash", label: { he: "צ'ובשית", en: "Chuvash" } },
  { value: "czech", label: { he: "צ'כית", en: "Czech" } },
  { value: "french", label: { he: "צרפתית", en: "French" } },
  { value: "kurdish", label: { he: "כורדית", en: "Kurdish" } },
  { value: "kazakh", label: { he: "קזחית", en: "Kazakh" } },
  { value: "quechua", label: { he: "קצ'ואה", en: "Quechua" } },
  { value: "kyrgyz", label: { he: "קירגיזית", en: "Kyrgyz" } },
  { value: "catalan", label: { he: "קטלאנית", en: "Catalan" } },
  { value: "kannada", label: { he: "קנאדה", en: "Kannada" } },
  { value: "croatian", label: { he: "קרואטית", en: "Croatian" } },
  { value: "korean", label: { he: "קוריאנית", en: "Korean" } },
  { value: "haitian_creole", label: { he: "קריאולית האיטית", en: "Haitian Creole" } },
  { value: "romanian", label: { he: "רומנית", en: "Romanian" } },
  { value: "russian", label: { he: "רוסית", en: "Russian" } },
  { value: "swedish", label: { he: "שוודית", en: "Swedish" } },
  { value: "thai", label: { he: "תאית", en: "Thai" } },
];

// 2. עדכון פונקציית המיון כדי שתתייחס לתווית בעברית
const hebrewSort = (a: LanguageOption, b: LanguageOption): number => {
  return a.label.he.localeCompare(b.label.he, "he");
};

// הפרדת השפות המועדפות מהשאר (הלוגיקה נשארת זהה)
const preferred = allLanguageOptions
  .filter(lang => preferredLanguagesValues.includes(lang.value))
  .sort(hebrewSort);

const others = allLanguageOptions
  .filter(lang => !preferredLanguagesValues.includes(lang.value))
  .sort(hebrewSort);

// איחוד הרשימות הממוינות לייצוא
export const languageOptions: LanguageOption[] = [...preferred, ...others];