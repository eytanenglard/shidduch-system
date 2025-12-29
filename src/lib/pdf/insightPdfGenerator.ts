// src/lib/pdf/insightPdfGenerator.ts
// =====================================================
// מחולל PDF - גרסה 9.0
// שימוש ב-window.print() - הכי אמין ופשוט!
// לא צריך שום חבילות נוספות!
// =====================================================

import { toast } from 'sonner';

// =====================================================
// טיפוסים
// =====================================================

interface InsightSection {
  summary: string;
  details: string[];
}

interface KeyStrength {
  title: string;
  description: string;
}

interface InsightData {
  whoYouAre: InsightSection;
  idealPartner: InsightSection;
  firstMeetingTips: InsightSection;
  uniquePotential: InsightSection;
  nextSteps: InsightSection;
  keyStrengths?: KeyStrength[];
  growthAreas?: string[];
  oneLiner?: string;
  threeThingsToRemember?: string[];
  userName?: string;
  generatedAt?: string;
  profileCompletionPercent?: number;
}

// =====================================================
// ציטוטים
// =====================================================

const QUOTES = [
  { text: 'הזיווג הוא מן השמים, אבל ההשתדלות היא מאיתנו', author: 'חז"ל' },
  { text: 'אין אדם דר עם נחש בכפיפה אחת - לכן חשוב למצוא את הנפש התאומה', author: 'תלמוד' },
  { text: 'כל התחלות קשות, אבל מי שמתחיל - חצי עשה', author: 'פתגם עברי' },
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// =====================================================
// פורמט תאריך
// =====================================================

function formatHebrewDate(date: Date): string {
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `${date.getDate()} ב${months[date.getMonth()]} ${date.getFullYear()}`;
}

// =====================================================
// CSS
// =====================================================

const getStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @page { size: A4; margin: 15mm; }
  
  body {
    font-family: 'Rubik', Arial, sans-serif;
    direction: rtl;
    text-align: right;
    color: #1e293b;
    line-height: 1.6;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    page-break-after: always;
    min-height: 250mm;
    padding: 10px;
  }
  .page:last-child { page-break-after: avoid; }
  
  /* כותרת */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 250mm;
  }
  .cover-line {
    width: 100px;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #ec4899);
    margin-bottom: 30px;
  }
  .cover h1 {
    font-size: 36px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 10px;
  }
  .cover-subtitle {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 40px;
  }
  .diamond {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    transform: rotate(45deg);
    margin: 30px 0;
    border-radius: 6px;
  }
  .cover-name {
    font-size: 20px;
    color: #6366f1;
    margin-top: 30px;
  }
  .cover-date {
    font-size: 14px;
    color: #94a3b8;
    margin-top: 10px;
  }
  .badge {
    display: inline-block;
    background: #dcfce7;
    color: #16a34a;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    margin-top: 15px;
  }
  .cover-footer {
    margin-top: 50px;
    color: #94a3b8;
  }
  .cover-footer .logo { font-size: 16px; }
  .cover-footer .tagline { font-size: 12px; margin-top: 5px; }
  
  /* ציטוט */
  .quote-box {
    background: #f8fafc;
    border-right: 4px solid #6366f1;
    padding: 15px 20px;
    margin-bottom: 25px;
  }
  .quote-text {
    font-style: italic;
    color: #334155;
    margin-bottom: 8px;
  }
  .quote-author {
    font-size: 13px;
    color: #94a3b8;
    text-align: left;
  }
  
  /* One-liner */
  .one-liner {
    background: #fef3c7;
    padding: 12px 20px;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 25px;
    color: #92400e;
    font-weight: 500;
  }
  
  /* סקציות */
  .section { margin-bottom: 25px; }
  .section-header {
    padding: 10px 15px;
    border-radius: 6px;
    color: white;
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
  }
  .section-header.purple { background: #8b5cf6; }
  .section-header.pink { background: #ec4899; }
  .section-header.green { background: #22c55e; }
  .section-header.orange { background: #f97316; }
  .section-header.blue { background: #3b82f6; }
  .section-header.yellow { background: #eab308; color: #713f12; }
  
  .section-summary {
    color: #334155;
    margin-bottom: 10px;
    font-size: 14px;
  }
  .section-list { list-style: none; }
  .section-list li {
    position: relative;
    padding-right: 20px;
    margin-bottom: 6px;
    color: #475569;
    font-size: 14px;
  }
  .section-list li::before {
    content: '●';
    position: absolute;
    right: 0;
    font-size: 8px;
  }
  .purple .section-list li::before { color: #8b5cf6; }
  .pink .section-list li::before { color: #ec4899; }
  .green .section-list li::before { color: #22c55e; }
  .orange .section-list li::before { color: #f97316; }
  .blue .section-list li::before { color: #3b82f6; }
  
  /* חוזקות */
  .strength-card {
    background: #fefce8;
    border: 1px solid #fef08a;
    border-radius: 8px;
    padding: 12px 15px;
    margin-bottom: 10px;
  }
  .strength-title {
    font-weight: 600;
    color: #854d0e;
    margin-bottom: 5px;
  }
  .strength-desc {
    font-size: 13px;
    color: #64748b;
  }
  
  /* 3 דברים */
  .three-things {
    background: #eff6ff;
    border: 2px solid #3b82f6;
    border-radius: 10px;
    padding: 20px;
    margin-top: 20px;
  }
  .three-things h3 {
    text-align: center;
    color: #1e40af;
    margin-bottom: 15px;
  }
  .three-things ol { list-style: none; }
  .three-things li {
    padding: 6px 0;
    color: #334155;
  }
  
  /* סיכום */
  .summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 250mm;
  }
  .summary h2 {
    font-size: 32px;
    margin-bottom: 20px;
  }
  .summary-line {
    width: 60px;
    height: 2px;
    background: #6366f1;
    margin-bottom: 30px;
  }
  .summary p {
    color: #475569;
    margin-bottom: 8px;
  }
  .summary .highlight {
    font-weight: 600;
    margin-top: 15px;
  }
  .summary-footer {
    margin-top: 50px;
    color: #94a3b8;
    font-size: 12px;
  }
  
  /* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 20px;
    font-size: 11px;
    color: #94a3b8;
  }
`;

// =====================================================
// יצירת HTML
// =====================================================

function generateHTML(data: InsightData): string {
  const quote = getRandomQuote();
  const dateStr = formatHebrewDate(new Date());

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>התמונה המלאה שלך - NeshamaTech</title>
  <style>${getStyles()}</style>
</head>
<body>

  <div class="page">
    <div class="cover">
      <div class="cover-line"></div>
      <h1>התמונה המלאה שלך</h1>
      <p class="cover-subtitle">תובנות עמוקות על האישיות, הערכים והזוגיות שלך</p>
      <div class="diamond"></div>
      ${data.userName ? `<div class="cover-name">הוכן עבור: ${data.userName}</div>` : ''}
      <div class="cover-date">${dateStr}</div>
      ${data.profileCompletionPercent ? `<div class="badge">${data.profileCompletionPercent}% הושלם</div>` : ''}
      <div class="cover-footer">
        <div class="logo">NeshamaTech</div>
        <div class="tagline">כי נשמה פוגשת טכנולוגיה</div>
      </div>
    </div>
  </div>

  <div class="page">
    <div class="page-header">
      <span>${data.userName || ''}</span>
      <span>NeshamaTech</span>
    </div>
    <div class="quote-box">
      <div class="quote-text">"${quote.text}"</div>
      <div class="quote-author">— ${quote.author}</div>
    </div>
    ${data.oneLiner ? `<div class="one-liner">💎 ${data.oneLiner}</div>` : ''}
    ${data.whoYouAre ? `
      <div class="section purple">
        <div class="section-header purple">🌟 מי את/ה באמת</div>
        <p class="section-summary">${data.whoYouAre.summary}</p>
        <ul class="section-list">${data.whoYouAre.details.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
    ` : ''}
    ${data.idealPartner ? `
      <div class="section pink">
        <div class="section-header pink">💫 השותף/ה האידיאלי/ת</div>
        <p class="section-summary">${data.idealPartner.summary}</p>
        <ul class="section-list">${data.idealPartner.details.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
    ` : ''}
  </div>

  <div class="page">
    <div class="page-header">
      <span>${data.userName || ''}</span>
      <span>NeshamaTech</span>
    </div>
    ${data.firstMeetingTips ? `
      <div class="section green">
        <div class="section-header green">🎯 טיפים לפגישה הראשונה</div>
        <p class="section-summary">${data.firstMeetingTips.summary}</p>
        <ul class="section-list">${data.firstMeetingTips.details.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
    ` : ''}
    ${data.uniquePotential ? `
      <div class="section orange">
        <div class="section-header orange">✨ הפוטנציאל הייחודי שלך</div>
        <p class="section-summary">${data.uniquePotential.summary}</p>
        <ul class="section-list">${data.uniquePotential.details.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
    ` : ''}
    ${data.nextSteps ? `
      <div class="section blue">
        <div class="section-header blue">🚀 הצעדים הבאים</div>
        <p class="section-summary">${data.nextSteps.summary}</p>
        <ul class="section-list">${data.nextSteps.details.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
    ` : ''}
  </div>

  <div class="page">
    <div class="page-header">
      <span>${data.userName || ''}</span>
      <span>NeshamaTech</span>
    </div>
    ${data.keyStrengths && data.keyStrengths.length > 0 ? `
      <div class="section">
        <div class="section-header yellow">💪 נקודות החוזק שלך</div>
        ${data.keyStrengths.map(s => `
          <div class="strength-card">
            <div class="strength-title">⭐ ${s.title}</div>
            <div class="strength-desc">${s.description}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${data.threeThingsToRemember && data.threeThingsToRemember.length > 0 ? `
      <div class="three-things">
        <h3>🎯 3 דברים לזכור</h3>
        <ol>${data.threeThingsToRemember.map((t, i) => `<li>${i + 1}. ${t}</li>`).join('')}</ol>
      </div>
    ` : ''}
  </div>

  <div class="page">
    <div class="summary">
      <h2>לסיכום...</h2>
      <div class="summary-line"></div>
      <p>${data.userName || 'יקר/ה'}, עברת מסע משמעותי של גילוי עצמי.</p>
      <p>הדוח הזה הוא רק נקודת התחלה -</p>
      <p>המשך להקשיב לעצמך,</p>
      <p>להאמין בערך הייחודי שאת/ה מביא/ה לעולם,</p>
      <p>ולזכור שהזוגיות הנכונה תגיע בזמן הנכון.</p>
      <p class="highlight">בהצלחה במסע! 💜</p>
      <div class="diamond" style="width:30px;height:30px;margin-top:40px;"></div>
      <div class="summary-footer">
        <p>נוצר ב-${dateStr}</p>
        <p>NeshamaTech © 2025</p>
      </div>
    </div>
  </div>

</body>
</html>`;
}

// =====================================================
// יצירת ID
// =====================================================

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// =====================================================
// פונקציה ראשית
// =====================================================

export const generateInsightPdf = async (
  data: InsightData,
  locale: 'he' | 'en' = 'he'
) => {
  try {
    const htmlContent = generateHTML(data);
    
    // הוספת כפתור הורדה בראש הדף
    const htmlWithButton = htmlContent.replace(
      '<body>',
      `<body>
        <div id="download-bar" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
          <span style="color: white; font-size: 14px;">הדוח שלך מוכן! 🎉</span>
          <button onclick="window.print()" style="
            background: white;
            color: #6366f1;
            border: none;
            padding: 10px 25px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
          ">
            📥 הורד כ-PDF
          </button>
        </div>
        <style>
          @media print {
            #download-bar { display: none !important; }
            body { padding-top: 0 !important; }
          }
          body { padding-top: 60px; }
        </style>
      `
    );
    
    // פתיחת טאב חדש
    const newTab = window.open('', '_blank');
    
    if (!newTab) {
      // אם נחסם, ננסה iframe
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlWithButton.replace(
          '<button onclick="window.print()"',
          `<button onclick="window.parent.document.body.removeChild(window.frameElement); return false;" style="margin-left:10px;background:#ef4444;color:white;border:none;padding:10px 15px;border-radius:8px;cursor:pointer;">✕ סגור</button>
           <button onclick="window.print()"`
        ));
        iframeDoc.close();
      }
      
      toast.success('הדוח נפתח! לחץ על "הורד כ-PDF"', { duration: 5000 });
      return;
    }
    
    newTab.document.write(htmlWithButton);
    newTab.document.close();
    
    toast.success('הדוח נפתח בטאב חדש! לחץ על "הורד כ-PDF"', { duration: 5000 });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error('😕 שגיאה ביצירת הדוח. נסה שוב');
  }
};

export default generateInsightPdf;