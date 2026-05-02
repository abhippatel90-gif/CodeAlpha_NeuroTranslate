from flask import Flask, render_template, request, jsonify
from gtts import gTTS
import io
import base64
import os
import mimetypes
from deep_translator import GoogleTranslator

# Fix for Windows registry MIME type bugs
mimetypes.add_type('text/css', '.css')

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/app')
def translation_app():
    return render_template('app.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text', '')
    source_lang = data.get('source', 'auto')
    target_lang = data.get('target', 'es')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # Use deep_translator instead of LibreTranslate for better stability
        # It's free and requires no API key.
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated_text = translator.translate(text)

        # Generate Text-to-Speech using gTTS
        audio_base64 = None
        try:
            tts = gTTS(text=translated_text, lang=target_lang)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            audio_base64 = base64.b64encode(fp.read()).decode('utf-8')
        except Exception as e:
            print(f"TTS Error: {e}")
            # Do not fail the translation if TTS fails

        return jsonify({
            'translatedText': translated_text,
            'audioBase64': audio_base64
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/languages', methods=['GET'])
def get_languages():
    try:
        # Get languages dynamically from deep_translator
        langs_dict = GoogleTranslator().get_supported_languages(as_dict=True)
        # Format it exactly how our frontend expects it: [{'code': 'en', 'name': 'English'}, ...]
        languages = [{"code": code, "name": name.capitalize()} for name, code in langs_dict.items()]
        # Explicitly sort the languages alphabetically
        languages.sort(key=lambda x: x['name'])
        return jsonify(languages)
    except Exception as e:
        print(f"Language fetch error: {e}")
        # Robust fallback languages list
        fallback_languages = [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "it", "name": "Italian"},
            {"code": "pt", "name": "Portuguese"},
            {"code": "ru", "name": "Russian"},
            {"code": "zh-cn", "name": "Chinese (simplified)"},
            {"code": "ja", "name": "Japanese"},
            {"code": "ko", "name": "Korean"},
            {"code": "hi", "name": "Hindi"},
            {"code": "ar", "name": "Arabic"}
        ]
        return jsonify(fallback_languages)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
