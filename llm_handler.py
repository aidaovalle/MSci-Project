import os
import json
from dotenv import load_dotenv
from google import genai

# ----------------------------------API KEY--------------------------------------

# Load API keys from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("API Key not found.")

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# -------------------------------------------------------------------------------

STORIES_FILE = "data/all_stories.json"  # File to store past prompts and stories


def load_stories():
    # Load saved stories from JSON file
    try:
        with open(STORIES_FILE, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    
def save_story(prompt, story):
    # Save new story to file
    stories = load_stories()
    stories.insert(0, {"prompt": prompt, "story": story})  # Newest at the top
    with open(STORIES_FILE, "w") as file:
        json.dump(stories, file, indent=4)

def generate_story(prompt):
    # Generate a story based on user input
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=[prompt])
        story = response.text.strip()
        
        save_story(prompt, story) # Save prompt & story
        return story
        
    except Exception as e:
        return f"Error generating story: {str(e)}"