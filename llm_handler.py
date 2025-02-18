import os
from google import genai
from dotenv import load_dotenv

# Load API keys from .env file (Recommended for security)
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Gemini client
client = genai.Client(api_key="AIzaSyDhzCdH6IoKnac3m_kNlIOOVesotaNyrcc")

def generate_content(prompt):
    try:
        
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=[prompt]
        )
        return response.text.strip()

    except Exception as e:
        return f"Error generating story: {str(e)}"