// /constants/matchingCriteria.ts

export const CRITERIA_WEIGHTS = {
    // קריטריונים בסיסיים
    age: {
      weight: 15,
      description: 'התאמת גיל',
      thresholds: {
        perfect: 2,  // הפרש של עד שנתיים
        good: 5,     // הפרש של עד 5 שנים
        fair: 8      // הפרש של עד 8 שנים
      }
    },
    
    religiousLevel: {
      weight: 20,
      description: 'התאמה דתית',
      bonusPoints: {
        exactMatch: 1.0,        // התאמה מדויקת
        adjacentLevel: 0.8,     // רמה דתית סמוכה
        twoLevelsApart: 0.4     // הפרש של שתי רמות
      }
    },
  
    location: {
      weight: 10,
      description: 'מיקום גיאוגרפי',
      bonusPoints: {
        sameCity: 1.0,          // אותה עיר
        sameRegion: 0.8,        // אותו אזור
        preferredCity: 0.7,     // עיר מועדפת
        differentRegion: 0.4    // אזור אחר
      }
    },
  
    // קריטריונים מקצועיים והשכלתיים
    education: {
      weight: 8,
      description: 'רמת השכלה',
      bonusPoints: {
        sameLevel: 1.0,         // רמת השכלה זהה
        adjacentLevel: 0.8,     // רמת השכלה סמוכה
        meetPreferences: 0.7    // עומד בהעדפות
      }
    },
  
    occupation: {
      weight: 7,
      description: 'תחום עיסוק',
      bonusPoints: {
        sameField: 1.0,         // אותו תחום
        relatedField: 0.8,      // תחום קרוב
        meetPreferences: 0.7    // עומד בהעדפות
      }
    },
  
    // קריטריונים אישיים
    familyBackground: {
      weight: 12,
      description: 'רקע משפחתי',
      factors: {
        origin: 0.4,            // מוצא
        parentStatus: 0.3,      // מצב הורים
        familyType: 0.3         // סוג משפחה
      }
    },
  
    personalityMatch: {
      weight: 15,
      description: 'התאמה אישיותית',
      factors: {
        hobbies: 0.3,           // תחביבים משותפים
        lifestyle: 0.4,         // סגנון חיים
        values: 0.3             // ערכים משותפים
      }
    },
  
    // גורמים נוספים
    preferences: {
      weight: 8,
      description: 'העדפות אישיות',
      factors: {
        agePreference: 0.3,     // העדפות גיל
        locationPreference: 0.3, // העדפות מיקום
        otherPreferences: 0.4   // העדפות נוספות
      }
    },
  
    compatibility: {
      weight: 5,
      description: 'תאימות כללית',
      factors: {
        language: 0.3,          // שפה משותפת
        culture: 0.4,           // תרבות
        lifestyle: 0.3          // סגנון חיים
      }
    }
  };
  
  // סף ציון להתאמה טובה
  export const MATCH_THRESHOLDS = {
    EXCELLENT: 85,  // התאמה מצוינת
    GOOD: 75,       // התאמה טובה
    FAIR: 65,       // התאמה סבירה
    POOR: 50        // התאמה חלשה
  };
  
  // משקלים יחסיים לפי סוג התאמה
  export const MATCH_TYPE_WEIGHTS = {
    PRECISE: {     // התאמה מדויקת
      exact: 1.0,
      similar: 0.8,
      partial: 0.5
    },
    FLEXIBLE: {    // התאמה גמישה
      exact: 0.8,
      similar: 1.0,
      partial: 0.7
    },
    OPEN: {        // התאמה פתוחה
      exact: 0.7,
      similar: 0.9,
      partial: 1.0
    }
  };
  
  // הגדרת קטגוריות להתאמה
  export const MATCH_CATEGORIES = {
    IMMEDIATE: {
      minScore: 90,
      label: 'התאמה מיידית',
      description: 'התאמה גבוהה מאוד, מומלץ ליצור קשר בהקדם'
    },
    HIGH: {
      minScore: 80,
      label: 'התאמה גבוהה',
      description: 'התאמה טובה מאוד, שווה לבדוק'
    },
    GOOD: {
      minScore: 70,
      label: 'התאמה טובה',
      description: 'יש פוטנציאל טוב להתאמה'
    },
    MODERATE: {
      minScore: 60,
      label: 'התאמה בינונית',
      description: 'יש נקודות משותפות, אבל גם הבדלים'
    },
    LOW: {
      minScore: 50,
      label: 'התאמה נמוכה',
      description: 'יש פערים משמעותיים בין המועמדים'
    }
  };