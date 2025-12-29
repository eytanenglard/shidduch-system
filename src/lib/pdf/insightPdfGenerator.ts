// src/lib/pdf/insightPdfGenerator.ts
// =====================================================
// מחולל PDF - גרסה 6.0
// שימוש ב-html2pdf.js לתמיכה מלאה ב-RTL
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
  { text: 'לב יודע מרת נפשו - ובשמחתו לא יתערב זר', author: 'משלי' },
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
// יצירת ID ייחודי
// =====================================================

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// =====================================================
// CSS סטיילים
// =====================================================

const getStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Rubik', 'Arial', sans-serif;
    direction: rtl;
    text-align: right;
    background: #f8fafc;
    color: #1e293b;
    line-height: 1.6;
  }
  
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    background: white;
    margin: 0 auto;
    page-break-after: always;
  }
  
  .page:last-child {
    page-break-after: avoid;
  }
  
  /* עמוד כותרת */
  .cover-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fce7f3 100%);
  }
  
  .cover-line {
    width: 100px;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #ec4899);
    border-radius: 2px;
    margin-bottom: 30px;
  }
  
  .cover-title {
    font-size: 36px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 15px;
  }
  
  .cover-subtitle {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 40px;
  }
  
  .diamond {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    transform: rotate(45deg);
    margin: 30px auto;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
  }
  
  .cover-name {
    font-size: 22px;
    color: #6366f1;
    margin-top: 40px;
    font-weight: 500;
  }
  
  .cover-date {
    font-size: 14px;
    color: #94a3b8;
    margin-top: 15px;
  }
  
  .completion-badge {
    display: inline-block;
    background: #dcfce7;
    color: #16a34a;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    margin-top: 20px;
    border: 1px solid #bbf7d0;
  }
  
  .cover-footer {
    margin-top: 60px;
  }
  
  .cover-footer .logo {
    font-size: 18px;
    color: #94a3b8;
    font-weight: 500;
  }
  
  .cover-footer .tagline {
    font-size: 14px;
    color: #cbd5e1;
    margin-top: 8px;
  }
  
  /* תיבת ציטוט */
  .quote-box {
    background: #f8fafc;
    border-right: 4px solid #6366f1;
    padding: 20px 25px;
    margin-bottom: 25px;
    border-radius: 0 8px 8px 0;
  }
  
  .quote-text {
    font-size: 15px;
    color: #334155;
    font-style: italic;
    margin-bottom: 10px;
  }
  
  .quote-text::before {
    content: '"';
    font-size: 24px;
    color: #c7d2fe;
    margin-left: 5px;
  }
  
  .quote-author {
    font-size: 13px;
    color: #94a3b8;
  }
  
  /* One-liner */
  .one-liner {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    padding: 15px 25px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 25px;
    font-size: 15px;
    color: #92400e;
    font-weight: 500;
  }
  
  .one-liner::before {
    content: '💎 ';
  }
  
  /* סקציות */
  .section {
    margin-bottom: 25px;
  }
  
  .section-header {
    padding: 12px 18px;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
  }
  
  .section-header.who-you-are { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
  .section-header.ideal-partner { background: linear-gradient(135deg, #ec4899, #f472b6); }
  .section-header.first-meeting { background: linear-gradient(135deg, #22c55e, #4ade80); }
  .section-header.potential { background: linear-gradient(135deg, #f97316, #fb923c); }
  .section-header.next-steps { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
  .section-header.strengths { background: linear-gradient(135deg, #eab308, #facc15); color: #713f12; }
  
  .section-summary {
    font-size: 14px;
    color: #334155;
    margin-bottom: 12px;
    line-height: 1.7;
  }
  
  .section-details {
    list-style: none;
  }
  
  .section-details li {
    font-size: 14px;
    color: #475569;
    padding: 6px 0;
    padding-right: 20px;
    position: relative;
  }
  
  .section-details li::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: absolute;
    right: 0;
    top: 12px;
  }
  
  .who-you-are .section-details li::before { background: #8b5cf6; }
  .ideal-partner .section-details li::before { background: #ec4899; }
  .first-meeting .section-details li::before { background: #22c55e; }
  .potential .section-details li::before { background: #f97316; }
  .next-steps .section-details li::before { background: #3b82f6; }
  
  /* כרטיסי חוזקות */
  .strength-card {
    background: #fefce8;
    border: 1px solid #fef08a;
    border-radius: 10px;
    padding: 15px 18px;
    margin-bottom: 12px;
  }
  
  .strength-title {
    font-size: 15px;
    font-weight: 600;
    color: #854d0e;
    margin-bottom: 6px;
  }
  
  .strength-title::before {
    content: '⭐ ';
  }
  
  .strength-description {
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
  }
  
  /* 3 דברים לזכור */
  .three-things {
    background: #eff6ff;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 20px 25px;
    margin-top: 25px;
  }
  
  .three-things-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e40af;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .three-things-list {
    list-style: none;
  }
  
  .three-things-list li {
    font-size: 14px;
    color: #334155;
    padding: 8px 0;
  }
  
  /* עמוד סיכום */
  .summary-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: #f8fafc;
  }
  
  .summary-title {
    font-size: 32px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 25px;
  }
  
  .summary-line {
    width: 60px;
    height: 2px;
    background: #6366f1;
    margin-bottom: 30px;
  }
  
  .summary-message {
    font-size: 15px;
    color: #475569;
    line-height: 2;
    max-width: 400px;
  }
  
  .summary-diamond {
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    transform: rotate(45deg);
    margin: 40px auto;
    border-radius: 4px;
  }
  
  .summary-footer {
    margin-top: 40px;
    font-size: 12px;
    color: #94a3b8;
  }
  
  /* Footer */
  .page-footer {
    position: absolute;
    bottom: 15mm;
    left: 20mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
  }
  
  /* Header */
  .page-header {
    position: absolute;
    top: 10mm;
    left: 20mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
  }
  
  .content-page {
    position: relative;
    padding-top: 25mm;
    padding-bottom: 25mm;
  }
`;

// =====================================================
// יצירת HTML
// =====================================================

function generateHTML(data: InsightData): string {
  const quote = getRandomQuote();
  const today = new Date();
  const dateStr = formatHebrewDate(today);
  
  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>${getStyles()}</style>
</head>
<body>

  <!-- עמוד 1: כותרת -->
  <div class="page cover-page">
    <div class="cover-line"></div>
    <h1 class="cover-title">התמונה המלאה שלך</h1>
    <p class="cover-subtitle">תובנות עמוקות על האישיות, הערכים והזוגיות שלך</p>
    
    <div class="diamond"></div>
    
    ${data.userName ? `<div class="cover-name">הוכן עבור: ${data.userName}</div>` : ''}
    <div class="cover-date">${dateStr}</div>
    
    ${data.profileCompletionPercent ? `
      <div class="completion-badge">${data.profileCompletionPercent}% הושלם</div>
    ` : ''}
    
    <div class="cover-footer">
      <div class="logo">NeshamaTech</div>
      <div class="tagline">כי נשמה פוגשת טכנולוגיה</div>
    </div>
  </div>

  <!-- עמוד 2: תוכן ראשי -->
  <div class="page content-page">
    <div class="page-header">
      <span>NeshamaTech</span>
      <span>${data.userName || ''}</span>
    </div>
    
    <!-- ציטוט -->
    <div class="quote-box">
      <div class="quote-text">${quote.text}</div>
      <div class="quote-author">— ${quote.author}</div>
    </div>
    
    <!-- One-liner -->
    ${data.oneLiner ? `<div class="one-liner">${data.oneLiner}</div>` : ''}
    
    <!-- מי את/ה באמת -->
    ${data.whoYouAre ? `
      <div class="section who-you-are">
        <div class="section-header who-you-are">🌟 מי את/ה באמת</div>
        <p class="section-summary">${data.whoYouAre.summary}</p>
        <ul class="section-details">
          ${data.whoYouAre.details.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- השותף/ה האידיאלי/ת -->
    ${data.idealPartner ? `
      <div class="section ideal-partner">
        <div class="section-header ideal-partner">💫 השותף/ה האידיאלי/ת</div>
        <p class="section-summary">${data.idealPartner.summary}</p>
        <ul class="section-details">
          ${data.idealPartner.details.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div class="page-footer">
      <span>עמוד 2</span>
      <span>NeshamaTech - מערכת שידוכים מתקדמת</span>
    </div>
  </div>

  <!-- עמוד 3: המשך תוכן -->
  <div class="page content-page">
    <div class="page-header">
      <span>NeshamaTech</span>
      <span>${data.userName || ''}</span>
    </div>
    
    <!-- טיפים לפגישה הראשונה -->
    ${data.firstMeetingTips ? `
      <div class="section first-meeting">
        <div class="section-header first-meeting">🎯 טיפים לפגישה הראשונה</div>
        <p class="section-summary">${data.firstMeetingTips.summary}</p>
        <ul class="section-details">
          ${data.firstMeetingTips.details.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- הפוטנציאל הייחודי שלך -->
    ${data.uniquePotential ? `
      <div class="section potential">
        <div class="section-header potential">✨ הפוטנציאל הייחודי שלך</div>
        <p class="section-summary">${data.uniquePotential.summary}</p>
        <ul class="section-details">
          ${data.uniquePotential.details.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- הצעדים הבאים -->
    ${data.nextSteps ? `
      <div class="section next-steps">
        <div class="section-header next-steps">🚀 הצעדים הבאים</div>
        <p class="section-summary">${data.nextSteps.summary}</p>
        <ul class="section-details">
          ${data.nextSteps.details.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div class="page-footer">
      <span>עמוד 3</span>
      <span>NeshamaTech - מערכת שידוכים מתקדמת</span>
    </div>
  </div>

  <!-- עמוד 4: חוזקות ודברים לזכור -->
  <div class="page content-page">
    <div class="page-header">
      <span>NeshamaTech</span>
      <span>${data.userName || ''}</span>
    </div>
    
    <!-- נקודות החוזק שלך -->
    ${data.keyStrengths && data.keyStrengths.length > 0 ? `
      <div class="section">
        <div class="section-header strengths">💪 נקודות החוזק שלך</div>
        ${data.keyStrengths.map(s => `
          <div class="strength-card">
            <div class="strength-title">${s.title}</div>
            <div class="strength-description">${s.description}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <!-- 3 דברים לזכור -->
    ${data.threeThingsToRemember && data.threeThingsToRemember.length > 0 ? `
      <div class="three-things">
        <div class="three-things-title">🎯 3 דברים לזכור</div>
        <ol class="three-things-list">
          ${data.threeThingsToRemember.map((t, i) => `<li>${i + 1}. ${t}</li>`).join('')}
        </ol>
      </div>
    ` : ''}
    
    <div class="page-footer">
      <span>עמוד 4</span>
      <span>NeshamaTech - מערכת שידוכים מתקדמת</span>
    </div>
  </div>

  <!-- עמוד 5: סיכום -->
  <div class="page summary-page">
    <h2 class="summary-title">לסיכום...</h2>
    <div class="summary-line"></div>
    
    <div class="summary-message">
      <p>${data.userName || 'יקר/ה'}, עברת מסע משמעותי של גילוי עצמי.</p>
      <p>הדוח הזה הוא רק נקודת התחלה -</p>
      <p>המשך להקשיב לעצמך,</p>
      <p>להאמין בערך הייחודי שאת/ה מביא/ה לעולם,</p>
      <p>ולזכור שהזוגיות הנכונה תגיע בזמן הנכון.</p>
      <p><strong>בהצלחה במסע! 💜</strong></p>
    </div>
    
    <div class="summary-diamond"></div>
    
    <div class="summary-footer">
      <p>נוצר ב-${dateStr}</p>
      <p>NeshamaTech © 2025</p>
    </div>
  </div>

</body>
</html>
  `;
}

// =====================================================
// פונקציה ראשית
// =====================================================

export const generateInsightPdf = async (
  data: InsightData,
  locale: 'he' | 'en' = 'he'
) => {
  const toastId = toast.loading('✨ יוצר את הדוח האישי שלך...', { duration: Infinity });
  
  try {
    // טעינה דינמית של html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    // יצירת HTML
    const htmlContent = generateHTML(data);
    
    // יצירת container זמני
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    
    // הגדרות PDF
    const options = {
      margin: 0,
      filename: `התמונה-המלאה-שלי-${generateUniqueId()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const
      },
      pagebreak: { mode: 'css', before: '.page', avoid: '.section' }
    };
    
    // יצירת PDF
    await html2pdf().set(options).from(container).save();
    
    // ניקוי
    document.body.removeChild(container);
    
    toast.dismiss(toastId);
    toast.success('🎉 הדוח הורד בהצלחה! בהצלחה במסע', { duration: 4000 });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.dismiss(toastId);
    toast.error('😕 שגיאה ביצירת הדוח. נסה שוב');
  }
};

export default generateInsightPdf;