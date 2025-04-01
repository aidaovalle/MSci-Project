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

STORIES_FILE = "data/all_stories.json"  # All generated stories
LIBRARY_FILE = "data/library.json" # Public library of stories

def generate_prompt(character, setting, feeling, extra):
    # System-level guidance
    system_prompt = (
        "You are a storytelling assistant that generates short, creative children's stories. "
        "Stories should be imaginative, emotionally engaging, appropriate and tailored for young readers. "
        "The story should contain a moral in concept, so that the children can learn something from it. "
        "Do not explicitly label the moral, but make it clear at the end. Only answer with the story. Do not include humans. "
        f"Generate a story, where the main character is a {character}, the story takes place in a {setting}, and the character is feeling {feeling}. Additional information: {extra}."
    )

    # User prompt
    user_prompt = f"Character: {character} | Setting: {setting} | Feeling: {feeling}"
    if extra:
        user_prompt += f" | Additional notes: {extra}.\n"

    # Combine both
    return system_prompt, user_prompt

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
        
        return story
        
    except Exception as e:
        return f"Error generating story: {str(e)}"

def load_library():
    try:
        with open(LIBRARY_FILE, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_to_library(prompt, story):
    # Save story to public library
    library = load_library()
    library.insert(0, {"prompt": prompt, "story": story})

    with open(LIBRARY_FILE, "w") as file:
        json.dump(library, file, indent=4)