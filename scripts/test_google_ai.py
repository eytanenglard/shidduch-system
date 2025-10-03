# test_google_ai.py
import os
from dotenv import load_dotenv
import google.generativeai as genai

print("--- [Python Test] Script is running ---")

# טעינת קובץ .env
load_dotenv()

try:
    # קריאת המפתח ממשתנה סביבה
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        print("--- [Python Test] FATAL ERROR: GOOGLE_API_KEY environment variable is not set!")
        print("Make sure .env file exists in the same directory")
        exit()

    print(f"--- [Python Test] API Key loaded. Starts with: {api_key[:5]}... Ends with: ...{api_key[-4:]}")

    # הגדרת המפתח בספרייה
    genai.configure(api_key=api_key)

    # שימוש במודל Gemini 2.5 Flash (המהיר והיעיל ביותר)
    model = genai.GenerativeModel('models/gemini-2.5-flash')

    prompt = 'Say "Connection Successful" in one sentence.'
    print(f"--- [Python Test] Sending a simple prompt to Google AI...")

    # שליחת הבקשה
    response = model.generate_content(prompt)

    # הדפסת התשובה
    print("\n====================================")
    print("--- [Python Test] SUCCESS! ---")
    print(f"Working Model: gemini-2.5-flash")
    print("Google AI Response:", response.text)
    print("====================================")

except Exception as e:
    print("\n-----------------------------------------")
    print("--- [Python Test] FAILED! An error occurred. ---")
    print("Error Type:", type(e).__name__)
    print("Error Details:", e)
    print("-----------------------------------------")