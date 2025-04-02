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

    # Get both prompts
    system_prompt, user_prompt = generate_prompt(character, setting, feeling, extra)

    # print("Prompt sent to Gemini:", system_prompt)
    # print("Prompt shown to user:", user_prompt)

    # Generate story using only the system prompt
    story = generate_story(system_prompt)

    # Save only the user prompt
    from llm_handler import save_story

    save_story(user_prompt, story)

    return jsonify(
        {"message": "Story generated", "user_prompt": user_prompt, "story": story}
    )


@app.route("/get-stories", methods=["GET"])
def get_stories():
    # Returns saved stories
    return jsonify(load_stories())


@app.route("/save-to-library", methods=["POST"])
def save_to_library():
    data = request.get_json()
    prompt = data.get("prompt", "")
    story = data.get("story", "")

    from llm_handler import save_to_library

    success = save_to_library(prompt, story)

    if success:
        return jsonify({"status": "saved", "message": "Story added to public library!"})
    else:
        return jsonify(
            {
                "status": "duplicate",
                "message": "This story is already in the public library.",
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
    return jsonify({"message": "Story deleted from library."})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080)
