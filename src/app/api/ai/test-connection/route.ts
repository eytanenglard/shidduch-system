// src/app/api/ai/test-connection/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  console.log('--- [API TEST] Received request at /api/ai/test-connection ---');

  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('--- [API TEST] FATAL ERROR: GOOGLE_API_KEY is not set in .env or .env.local!');
    return NextResponse.json(
      { success: false, error: 'Server configuration error: GOOGLE_API_KEY is missing.' },
      { status: 500 }
    );
  }

  // --- קטע האימות שהוספנו ---
  const keyIdentifier = `Starts with: ${apiKey.substring(0, 5)}... | Ends with: ...${apiKey.substring(apiKey.length - 4)} | Length: ${apiKey.length}`; // <-- הוסף
  console.log(`--- [API TEST] Verifying the loaded API Key: ${keyIdentifier} ---`); // <-- הוסף
  // -----------------------------

  console.log('--- [API TEST] GOOGLE_API_KEY found. Proceeding with API call.');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
    const prompt = 'Say "Connection Successful" in one sentence.';

    console.log('--- [API TEST] Sending a simple prompt to Google AI...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('--- [API TEST] SUCCESS! Google AI responded:', text);
    return NextResponse.json({ success: true, message: 'Connection to Google AI is working!', response: text });

  } catch (error) {
    console.error('--- [API TEST] FAILED! The API call to Google threw an error.', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to Google AI. This is likely an API key, permissions, or billing issue.',
        details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      }, 
      { status: 500 }
    );
  }
}