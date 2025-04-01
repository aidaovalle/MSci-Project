from flask import Flask, render_template, request, jsonify
from llm_handler import generate_story, load_stories, generate_prompt

app = Flask(__name__)

@app.route('/')
def index():
    # Load past stories to display on the page
    past_stories = load_stories()
    return render_template("index.html", past_stories=past_stories)

@app.route('/generate', methods=['POST'])
def generate():
    # Get user input
    character = request.form.get('character', '').strip()
    setting = request.form.get('setting', '').strip()
    feeling = request.form.get('feeling', '').strip()
    extra = request.form.get('extra', '').strip()

    # Get both prompts
    system_prompt, user_prompt = generate_prompt(character, setting, feeling, extra)
    
    print("Prompt sent to Gemini:", system_prompt)
    print("Prompt shown to user:", user_prompt)

    # Generate story using only the system prompt
    story = generate_story(system_prompt)

    # Save only the user prompt
    from llm_handler import save_story
    save_story(user_prompt, story)

    return jsonify({'message': 'Story generated', 'story': story})

@app.route('/get-stories', methods=['GET'])
def get_stories():
    # Returns saved stories
    return jsonify(load_stories())

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080)
