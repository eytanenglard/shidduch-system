// =============================================================================
// src/dictionaries/he/potentialMatches.ts
// מילון תרגומים עברית - התאמות פוטנציאליות
// =============================================================================

export const potentialMatchesDictionary = {
  // כותרות
  title: 'התאמות פוטנציאליות',
  subtitle: 'התאמות שנמצאו בסריקה האוטומטית',
  
  // סטטיסטיקות
  stats: {
    total: 'סה״כ התאמות',
    pending: 'ממתינות',
    reviewed: 'נבדקו',
    sent: 'נשלחו הצעות',
    dismissed: 'נדחו',
    expired: 'פג תוקף',
    withWarnings: 'עם אזהרות',
    avgScore: 'ציון ממוצע',
    highScore: 'ציון גבוה (85+)',
    mediumScore: 'ציון בינוני (70-84)',
  },
  
  // פילטרים
  filters: {
    status: 'סטטוס',
    minScore: 'ציון מינימלי',
    maxScore: 'ציון מקסימלי',
    religiousLevel: 'רמה דתית',
    city: 'עיר',
    hasWarning: 'סינון אזהרות',
    sortBy: 'מיין לפי',
    search: 'חיפוש',
    searchPlaceholder: 'חיפוש לפי שם...',
    
    statusOptions: {
      all: 'הכל',
      pending: 'ממתינות',
      reviewed: 'נבדקו',
      sent: 'נשלחו',
      dismissed: 'נדחו',
      withWarnings: 'עם אזהרות',
      noWarnings: 'ללא אזהרות',
    },
    
    sortOptions: {
      scoreDesc: 'ציון (גבוה לנמוך)',
      scoreAsc: 'ציון (נמוך לגבוה)',
      dateDesc: 'תאריך (חדש לישן)',
      dateAsc: 'תאריך (ישן לחדש)',
      maleWaiting: 'זמן המתנה (גבר)',
      femaleWaiting: 'זמן המתנה (אישה)',
    },
    
    warningOptions: {
      all: 'הכל',
      withWarnings: 'רק עם אזהרות',
      noWarnings: 'רק ללא אזהרות',
    },
    
    resetFilters: 'נקה פילטרים',
  },
  
  // כרטיס התאמה
  card: {
    score: 'ציון התאמה',
    reasoning: 'נימוק',
    scannedAt: 'נסרק',
    backgroundCompatibility: 'התאמת רקע',
    activeWarning: 'אזהרה',
    activeWarningWith: 'בהצעה פעילה עם',
    createSuggestion: 'צור הצעה',
    dismiss: 'דחה',
    markReviewed: 'סמן כנבדק',
    viewDetails: 'צפה בפרטים',
    restore: 'שחזר',
    viewProfile: 'צפה בפרופיל',
    showBreakdown: 'הצג פירוט ציון',
    hideBreakdown: 'הסתר פירוט',
    readMore: 'קרא עוד...',
    suggestionCreated: 'הצעה נוצרה',
    viewSuggestion: 'צפה בהצעה',
  },
  
  // פירוט ציון
  scoreBreakdown: {
    title: 'פירוט הציון',
    religious: 'התאמה דתית',
    ageCompatibility: 'התאמת גיל',
    careerFamily: 'קריירה-משפחה',
    lifestyle: 'סגנון חיים',
    ambition: 'שאפתנות',
    communication: 'תקשורת',
    values: 'ערכים',
  },
  
  // רקע
  backgroundCompatibility: {
    excellent: 'רקע מצוין',
    good: 'רקע טוב',
    possible: 'רקע אפשרי',
    problematic: 'פער רקע',
    not_recommended: 'רקע בעייתי',
  },
  
  // פעולות
  actions: {
    bulkSelect: 'בחירה מרובה',
    bulkDismiss: 'דחה הכל',
    bulkReview: 'סמן כנבדקו',
    bulkRestore: 'שחזר הכל',
    selectAll: 'בחר הכל',
    clearSelection: 'בטל בחירה',
    runScan: 'הפעל סריקה',
    refreshList: 'רענן רשימה',
    selected: 'נבחרו',
    items: 'פריטים',
  },
  
  // מצב ריק
  emptyState: {
    noMatches: 'לא נמצאו התאמות',
    noMatchesFiltered: 'לא נמצאו התאמות לפי הפילטרים שנבחרו',
    noMatchesDescription: 'נסה לשנות את הפילטרים או להפעיל סריקה חדשה',
    runScanDescription: 'הפעל סריקה לילית למציאת התאמות פוטנציאליות חדשות',
    showAll: 'הצג את כל ההתאמות',
  },
  
  // סריקה
  scan: {
    title: 'סריקה לילית',
    running: 'סריקה בתהליך...',
    completed: 'הסריקה הושלמה',
    failed: 'הסריקה נכשלה',
    partial: 'הסריקה הושלמה חלקית',
    lastScan: 'סריקה אחרונה',
    duration: 'משך הסריקה',
    candidatesScanned: 'מועמדים שנסרקו',
    matchesFound: 'התאמות שנמצאו',
    newMatches: 'התאמות חדשות',
    startScan: 'התחל סריקה',
    confirmTitle: 'הפעלת סריקה לילית',
    confirmDescription: 'הסריקה תעבור על כל המועמדים במערכת ותמצא התאמות פוטנציאליות חדשות. התהליך עשוי לקחת מספר דקות.',
    alreadyRunning: 'סריקה כבר רצה כרגע',
  },
  
  // דיאלוגים
  dialogs: {
    createSuggestion: {
      title: 'יצירת הצעה',
      description: 'צור הצעת שידוך מההתאמה הפוטנציאלית',
      priority: 'עדיפות',
      priorityLow: 'נמוכה',
      priorityMedium: 'בינונית',
      priorityHigh: 'גבוהה',
      priorityUrgent: 'דחופה',
      notes: 'הערות להצעה',
      notesPlaceholder: 'הוסף הערות או סיבת ההתאמה...',
      create: 'צור הצעה',
      cancel: 'ביטול',
    },
    
    dismiss: {
      title: 'דחיית התאמה',
      description: 'ניתן לציין סיבה לדחייה (אופציונלי)',
      reasonPlaceholder: 'סיבת הדחייה...',
      confirm: 'דחה',
      cancel: 'ביטול',
    },
    
    bulkDismiss: {
      title: 'דחיית התאמות מרובות',
      description: 'האם אתה בטוח שברצונך לדחות את כל ההתאמות שנבחרו? ניתן יהיה לשחזר אותן בהמשך.',
      confirm: 'דחה הכל',
      cancel: 'ביטול',
    },
    
    reasoning: {
      title: 'נימוק ההתאמה',
      overallScore: 'ציון התאמה כולל',
      basedOnAI: 'מבוסס על ניתוח AI מעמיק',
      shortSummary: 'סיכום קצר',
      detailedAnalysis: 'ניתוח מפורט',
      close: 'סגור',
    },
  },
  
  // הודעות Toast
  toasts: {
    dismissSuccess: 'ההתאמה נדחתה',
    dismissError: 'שגיאה בדחיית ההתאמה',
    reviewSuccess: 'ההתאמה סומנה כנבדקה',
    restoreSuccess: 'ההתאמה שוחזרה',
    suggestionCreated: 'הצעה נוצרה בהצלחה!',
    suggestionError: 'יצירת ההצעה נכשלה',
    bulkDismissSuccess: 'התאמות נדחו',
    bulkReviewSuccess: 'התאמות סומנו כנבדקו',
    bulkRestoreSuccess: 'התאמות שוחזרו',
    scanStarted: 'הסריקה החלה!',
    scanCompleted: 'סריקה הושלמה!',
    scanError: 'הפעלת הסריקה נכשלה',
    refreshSuccess: 'הרשימה עודכנה',
    refreshError: 'שגיאה בטעינת ההתאמות',
  },
  
  // Pagination
  pagination: {
    showing: 'מציג',
    of: 'מתוך',
    page: 'עמוד',
    perPage: 'לעמוד',
  },
  
  // תצוגה
  view: {
    grid: 'תצוגת רשת',
    list: 'תצוגת רשימה',
  },
  
  // רמות דתיות
  religiousLevels: {
    charedi_hasidic: 'חרדי חסידי',
    charedi_litvak: 'חרדי ליטאי',
    charedi_sephardic: 'חרדי ספרדי',
    chabad: 'חב״ד',
    breslov: 'ברסלב',
    charedi_modern: 'חרדי מודרני',
    dati_leumi_torani: 'דתי לאומי תורני',
    dati_leumi_standard: 'דתי לאומי',
    dati_leumi_liberal: 'דתי לאומי ליברלי',
    masorti_strong: 'מסורתי חזק',
    masorti_light: 'מסורתי',
    secular_traditional_connection: 'חילוני עם קשר למסורת',
    secular: 'חילוני',
    spiritual_not_religious: 'רוחני לא דתי',
    other: 'אחר',
    unknown: 'לא צוין',
  },
};

export default potentialMatchesDictionary;
