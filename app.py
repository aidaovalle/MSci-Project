from flask import Flask, render_template, request, jsonify
from llm_handler import generate_story, load_stories

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
    
    # Combine user input into a structured prompt
    prompt = f"Write a fable for children (ages 6-10) using simple language. \
        The main character is a {character} in a {setting}, feeling {feeling}. {extra}. \
        The story should be engaging, appropriate and contain a moral in concept. \
        Do not include human characters. Do not make the story too long."

    # Generate story (llm_handler.py handles storage)
    story = generate_story(prompt)
    return jsonify({'message': 'Story generated', 'story': story})

@app.route('/get-stories', methods=['GET'])
def get_stories():
    # Returns saved stories
    return jsonify(load_stories())

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080)
