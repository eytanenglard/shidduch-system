// src/types/dictionaries/email.d.ts

// Type for a single email template's dictionary
export type EmailTemplateDict = {
  subject: string;
  [key: string]: string; // Allows for other fields like title, paragraph1, etc.
};

// Main email dictionary structure
export type EmailDictionary = {
  shared: {
    greeting: string; // "שלום {{name}},"
    closing: string; // "בברכה,"
    team: string; // "צוות NeshamaTech"
    supportPrompt: string; // "לכל שאלה או עזרה, ניתן לפנות לתמיכה:"
    rightsReserved: string; // "© {{year}} כל הזכויות שמורות ל-NeshamaTech."
  };
  welcome: {
    subject: string;
    title: string;
    intro: string;
    matchmakerAssigned: string; // "שמחים לעדכן שהוקצה לך שדכן/ית אישי/ת..."
    getStarted: string;
    dashboardButton: string;
  };
  accountSetup: {
    subject: string;
    title: string;
    intro: string; // "השדכן/ית {{matchmakerName}} יצר/ה עבורך פרופיל..."
    actionPrompt: string;
    actionButton: string;
    notice: string; // "קישור זה הינו חד-פעמי ותקף ל-{{expiresIn}}."
    nextStep: string;
  };
  emailOtpVerification: {
    subject: string;
    title: string;
    intro: string;
    codeInstruction: string;
    expiryNotice: string; // "הקוד תקף למשך {{expiresIn}}."
    securityNote: string;
  };
  invitation: {
    subject: string; // "הזמנה להצטרף ל-NeshamaTech מ{{matchmakerName}}"
    title: string;
    intro: string;
    actionPrompt: string;
    actionButton: string;
    expiryNotice: string;
  };
  suggestion: {
    subject: string; // "יש לנו הרגשה טובה לגבי ההצעה הזו עבורך"
    title: string;
    intro: string; // "השדכן/ית שלך, {{matchmakerName}}, מצא/ה הצעה שנראית מבטיחה במיוחד."
    previewTitle: string;
    actionPrompt: string;
    actionButton: string;
    closing: string; // "נשמח לשמוע ממך,"
  };
  shareContactDetails: {
    subject: string;
    title: string;
    intro: string; // "איזה יופי! שני הצדדים אישרו את ההצעה. הגיע הזמן לעשות את הצעד הבא."
    detailsOf: string; // "פרטי הקשר של {{otherPartyName}}:"
    tipTitle: string;
    tipContent: string;
    goodLuck: string;
  };
  availabilityCheck: {
    subject: string;
    title: string;
    intro: string; // "השדכן/ית {{matchmakerName}} חושב/ת על הצעה עבורך..."
    actionPrompt: string;
    actionButton: string;
    noticeTitle: string;
    noticeContent: string;
  };
  passwordResetOtp: {
    subject: string;
    title: string;
    intro: string;
    codeInstruction: string;
    expiryNotice: string;
    securityNote: string;
  };
  passwordChangedConfirmation: {
    subject: string;
    title: string;
    intro: string;
    securityNote: string;
    actionButton: string;
  };
};

