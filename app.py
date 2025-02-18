# from flask import Flask, render_template

# app = Flask(__name__)

# @app.route('/')

# def index():
    
#     return render_template('index.html')

# if __name__ == '__main__':

#     app.run(host='127.0.0.1', port=8080)

from flask import Flask, render_template, request, jsonify
from llm_handler import generate_content

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        character = request.form.get('character', '').strip()
        setting = request.form.get('setting', '').strip()
        feeling = request.form.get('feeling', '').strip()
        extra = request.form.get('extra', '').strip()

        # Combine user input into a structured prompt
        prompt = f"Write a short story aim at children \
            from 6 years old to 10 years old, \
            about a {character} in a {setting} \
            who is feeling {feeling}. {extra}. \
            Make sure that the story is appropriate for children \
            and that there is a moral of the story, \
            from which the child can learn and develop emotionally. \
            This story is a fable so it will not include humans."

        # Call LLM (Google Gemini)
        story = generate_content(prompt)
        
        return jsonify({'message': 'Story generated', 'story': story})
        #return jsonify({'message': 'Prompt generated', 'prompt': prompt})
    
    return render_template('index.html')
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080)