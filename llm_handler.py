import os
import json
from google import genai
from dotenv import load_dotenv

# Load API keys from .env file (Recommended for security)
# load_dotenv()
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# if not GEMINI_API_KEY:
#     raise ValueError("API Key not found.")

# Initialize Gemini client
# client = genai.Client(api_key=GEMINI_API_KEY)
client = genai.Client(api_key="AIzaSyDhzCdH6IoKnac3m_kNlIOOVesotaNyrcc")

STORIES_FILE = "stories.json"  # File to store past prompts and stories


def load_stories():
    """Load stories from JSON file."""
    try:
        with open(STORIES_FILE, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    
    
def save_story(prompt, output):
    stories = load_stories()
    stories.insert(0, {"prompt": prompt, "story": output})  # Insert newest at the top
    with open(STORIES_FILE, "w") as file:
        json.dump(stories, file, indent=4)
    
        
def generate_story(prompt):
    try:
        
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=[prompt]
        )
        story = response.text.strip()
        
        # Save prompt & response before returning
        save_story(prompt, story)
        
        return story
    except Exception as e:
        return f"Error generating story: {str(e)}"
    
