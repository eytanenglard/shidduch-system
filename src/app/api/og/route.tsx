// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // אם יש לנו את שם הממליץ, נציג אותו. אחרת נציג טקסט כללי
    const referrerName = searchParams.get('name');
    const title = referrerName 
      ? `${referrerName} מזמין/ה אותך להצטרף`
      : 'הזמנה אישית להצטרף לקהילה';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // Slate-900 background
            backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
            position: 'relative',
          }}
        >
          {/* Decorative Hanukkah Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Logo / Brand Name */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
             {/* אפשר להוסיף כאן תמונה של הלוגו אם יש לך URL חיצוני */}
            <span style={{ fontSize: 60, fontWeight: 'bold', color: '#f59e0b', letterSpacing: '-2px' }}>
              NeshamaTech
            </span>
          </div>

          {/* Card Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '40px 60px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            {/* Main Title */}
            <div
              style={{
                fontSize: 50,
                fontWeight: 900,
                color: 'white',
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: '20px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: 28,
                color: '#cbd5e1', // Slate-300
                textAlign: 'center',
                maxWidth: '800px',
              }}
            >
              מוסיפים אור בחנוכה 🕎 | שידוכים עם נשמה
            </div>
          </div>
          
          {/* Footer / URL */}
          <div style={{ position: 'absolute', bottom: 40, fontSize: 24, color: '#64748b' }}>
            neshamatech.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
} catch (e) {
  // השינוי הוא בהוספת (e as Error)
  console.log((e as Error).message); 
  
  return new Response(`Failed to generate the image`, {
    status: 500,
  });
}
}