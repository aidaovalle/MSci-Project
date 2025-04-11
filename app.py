from flask import Flask, render_template, request, jsonify
from llm_handler import generate_story, load_stories, generate_prompt

app = Flask(__name__)


@app.route("/")
def index():
    # Load past stories to display on the page
    past_stories = load_stories()
    return render_template("index.html", past_stories=past_stories)


@app.route("/generate", methods=["POST"])
def generate():
    # Get user input
    character = request.form.get("character", "").strip()
    setting = request.form.get("setting", "").strip()
    feeling = request.form.get("feeling", "").strip()
    extra = request.form.get("extra", "").strip()
    length = request.form.get("length", "").strip()
    title = generate_title(character, setting)

    # Get both prompts
    system_prompt, user_prompt = generate_prompt(character, setting, feeling, length, extra)

    # print("Prompt sent to Gemini:", system_prompt)
    # print("Prompt shown to user:", user_prompt)

    # Generate story using only the system prompt
    story = generate_story(system_prompt)

    # Save only the user prompt
    from llm_handler import save_story

    save_story(user_prompt, story, title)

    return jsonify(
        {"message": "Story generated", "user_prompt": user_prompt, "story": story, "title": title, "character": character, "setting": setting}
    )

def generate_title(character, setting):
    return f"The {character.capitalize()} in the {setting.capitalize()}"


@app.route("/get-stories", methods=["GET"])
def get_stories():
    # Returns saved stories
    return jsonify(load_stories())


@app.route("/save-to-library", methods=["POST"])
def save_to_library():
    data = request.get_json()
    prompt = data.get("prompt", "")
    story = data.get("story", "")
    title = data.get("title", "")

    from llm_handler import save_to_library

    success = save_to_library(prompt, story, title)

    if success:
        return jsonify({"status": "saved", "message": "Story added to public library!"})
    else:
        return jsonify(
            {
                "status": "duplicate",
                "message": "This story is already in the library.",
            }
        )


@app.route("/get-library", methods=["GET"])
def get_library():
    from llm_handler import load_library

    return jsonify(load_library())


@app.route("/delete-from-library", methods=["POST"])
def delete_from_library_route():
    data = request.get_json()
    prompt = data.get("prompt", "")
    story = data.get("story", "")
    from llm_handler import delete_from_library

    delete_from_library(prompt, story)
    return jsonify({"message": "Story deleted from the public library."})


@app.route("/regenerate", methods=["POST"]) # Generating a new story with prompt
def regenerate():
    data = request.get_json()
    user_prompt = data.get("prompt", "").strip()
    character = data.get("character", "").strip()
    setting = data.get("setting", "").strip()

    if not user_prompt or not character or not setting:
        return jsonify({"error": "Missing prompt, character, or setting"}), 400

    # Rebuild the full system prompt using the stored user_prompt
    story = generate_story(f"Use the following user prompt to generate a new story: {user_prompt}")
    title = generate_title(character, setting)

    from llm_handler import save_story
    save_story(user_prompt, story, title)
    
    return jsonify({
        "message": "Story regenerated",
        "user_prompt": user_prompt,
        "story": story,
        "title": title,
        "character": character,
        "setting": setting
    })

@app.route("/save-to-past", methods=["POST"])
def save_to_past():
    data = request.get_json()
    prompt = data.get("prompt", "")
    story = data.get("story", "")
    title = data.get("title", "")
    edited = data.get("edited", False)

    from llm_handler import save_story

    # Mark edited stories with a flag
    if edited and prompt and story:
        prompt += " (Edited by user)"

    save_story(prompt, story, title)
    return jsonify({"message": "Edited story saved to past stories!"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080)
