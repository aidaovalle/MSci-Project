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
    
    
def save_story(full_prompt, story, moral):
    """Save the full prompt, generated story, and moral to JSON file."""
    stories = load_stories()
    stories.insert(0, {"prompt": full_prompt, "story": story, "moral": moral})  # Newest first
    with open(STORIES_FILE, "w") as file:
        json.dump(stories, file, indent=4)
    
        
def generate_story(character, setting, feeling, extra):
    """ Sends a structured prompt to Google Gemini and returns a formatted story with a moral. """
    full_prompt = (
        f"Write a short story about a {character} in a {setting} who is feeling {feeling}. {extra}\n"
        "Ensure the story has a clear lesson or moral at the end."
    )
    try:
        # Generate the story with Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[full_prompt]
        )
        story = response.text.strip()

        # Generate the moral separately
        moral_prompt = f"Summarize the lesson or moral of the following story in one sentence:\n\n{story}"
        moral_response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[moral_prompt]
        )
        moral = moral_response.text.strip()

        # Save full prompt, story, and moral
        save_story(full_prompt, story, moral)

        return story, moral
    except Exception as e:
        return f"Error generating story: {str(e)}", "N/A"
    
# def generate_story(prompt):
#     try:
        
#         response = client.models.generate_content(
#             model="gemini-2.0-flash", 
#             contents=[prompt]
#         )
#         story = response.text.strip()
        
#         # Save prompt & response before returning
#         save_story(prompt, story)
        
#         return story
#     except Exception as e:
#         return f"Error generating story: {str(e)}"
    
