import os
import io
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, session, send_from_directory, abort
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename 
from dotenv import load_dotenv, find_dotenv
import time
from datetime import datetime
import json
import traceback
from PIL import Image 
import base64
import tempfile  # NEW: For creating a temporary file for credentials

# --- GCP IMPORTS for AUTH and STORAGE ---
from google.cloud import speech
from google.cloud import texttospeech
from google.oauth2 import service_account
from google.cloud import storage # NEW: For Google Cloud Storage integration

# Optional: Imagen API (requires google-cloud-aiplatform)
try:
    from google.cloud import aiplatform
    from vertexai.preview.vision_models import ImageGenerationModel
    IMAGEN_AVAILABLE = True
except ImportError:
    print("⚠ google-cloud-aiplatform not installed. Image generation will be disabled.")
    IMAGEN_AVAILABLE = False

# Load environment variables
load_dotenv(find_dotenv())

# --- CRITICAL FIX: SECURE GCP CLIENT INITIALIZATION ---
key_path = "credentials.json"
credentials = None
project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")

if os.getenv('GCP_CREDENTIALS_JSON'):
    print("✓ Attempting to load GCP credentials from environment variable.")
    try:
        # 1. Write the JSON content from the environment variable into a temporary file
        temp_dir = tempfile.gettempdir()
        temp_key_path = os.path.join(temp_dir, "credentials.json")
        
        with open(temp_key_path, "w") as f:
            f.write(os.getenv('GCP_CREDENTIALS_JSON'))
            
        key_path = temp_key_path
        credentials = service_account.Credentials.from_service_account_file(key_path)
    except Exception as e:
        print(f"FATAL: Error processing GCP_CREDENTIALS_JSON: {e}")
        pass
        
elif os.path.exists(key_path):
    print("⚠ Using local credentials.json file. ONLY FOR LOCAL TESTING.")
    credentials = service_account.Credentials.from_service_account_file(key_path)
else:
    print("⚠ GCP credentials not found. Cloud services will likely fail.")

# Initialize GCP clients
if credentials:
    speech_client = speech.SpeechClient(credentials=credentials)
    tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
else:
    speech_client = speech.SpeechClient()
    tts_client = texttospeech.TextToSpeechClient()


# --- CRITICAL FIX: GCS Client Initialization for File Persistence ---
GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME')
storage_client = None
gcs_bucket = None

if credentials and project_id and GCS_BUCKET_NAME:
    try:
        storage_client = storage.Client(project=project_id, credentials=credentials)
        gcs_bucket = storage_client.bucket(GCS_BUCKET_NAME)
        print(f"✓ Google Cloud Storage client initialized for bucket: {GCS_BUCKET_NAME}")
    except Exception as e:
        print(f"FATAL: GCS initialization failed: {e}")
else:
    print("⚠ GCS client not initialized due to missing credentials, project_id, or GCS_BUCKET_NAME.")


# Translation API Key
TRANSLATION_API_KEY = os.getenv("TRANSLATION_API_KEY")

# Google Cloud Project Configuration
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
parent = f"projects/{project_id}/locations/{location}"

# Initialize Vertex AI for Imagen (Unchanged, uses loaded credentials)
if IMAGEN_AVAILABLE:
    try:
        aiplatform.init(project=project_id, location=location, credentials=credentials)
        print("✓ Vertex AI initialized for Imagen")
    except Exception as e:
        print(f"⚠ Vertex AI initialization warning: {e}")
        IMAGEN_AVAILABLE = False
else:
    print("⚠ Imagen API disabled (package not installed)")

app = Flask(__name__)

# --- CRITICAL FIX: Database Configuration (Uses DATABASE_URL) ---
# Your database URL should be set in Render for a managed database (PostgreSQL is recommended)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///db.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'a_super_secret_key_change_in_production'

# Session configuration (Unchanged, relies on SECRET_KEY)
app.config['SESSION_COOKIE_SAMESITE'] = 'None' 
app.config['SESSION_COOKIE_SECURE'] = True      
app.config['SESSION_COOKIE_HTTPONLY'] = False 
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['SESSION_COOKIE_NAME'] = 'session'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400 

# Configure CORS (CRITICAL FIX: Ensure your Vercel frontend URL is added here for production)
# You should add your live Vercel URL to the origins list for production.
CORS(app, 
     supports_credentials=True, 
     origins=[
         os.getenv('FRONTEND_URL', "http://localhost:5173"), # Use ENV variable
         "http://127.0.0.1:5173",
         "https://kalakar420-frontend.vercel.app" # Example of live Vercel URL
     ],
     allow_headers=["Content-Type", "Authorization", "Cookie"],
     expose_headers=["Set-Cookie"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     max_age=3600
)

# File Upload Configuration (Local folders are now just used as GCS path prefixes)
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'audio_responses'
GENERATED_IMAGES_FOLDER = 'generated_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  

app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Configure Google Gemini API
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# Initialize Database
db = SQLAlchemy(app)

# ==================== DATABASE MODELS (Unchanged) ====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    craft_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'location': self.location,
            'craft_type': self.craft_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Content(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    punjabi_text = db.Column(db.Text)
    english_text = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    generated_description = db.Column(db.Text)
    generated_captions = db.Column(db.Text)
    generated_images = db.Column(db.Text)  # Store AI generated image URLs
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'punjabi_text': self.punjabi_text,
            'english_text': self.english_text,
            'image_url': self.image_url,
            'generated_description': self.generated_description,
            'generated_captions': self.generated_captions,
            'generated_images': json.loads(self.generated_images) if self.generated_images else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    conversation_data = db.Column(db.Text)
    current_step = db.Column(db.String(50))
    collected_info = db.Column(db.Text)
    is_complete = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'current_step': self.current_step,
            'collected_info': json.loads(self.collected_info) if self.collected_info else {},
            'is_complete': self.is_complete,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ==================== GCS HELPER FUNCTIONS (NEW) ====================

def upload_file_to_gcs(file_content, destination_blob_name, content_type):
    """Uploads file content to GCS and returns the public URL."""
    if not gcs_bucket:
        print(f"[GCS] Warning: GCS not configured. Skipping upload of {destination_blob_name}")
        return None
    
    try:
        blob = gcs_bucket.blob(destination_blob_name)
        
        # Set content-type and make the file publicly accessible
        blob.upload_from_string(
            file_content,
            content_type=content_type,
            predefined_acl='publicRead'
        )
        return blob.public_url # Returns the public GCS URL
    except Exception as e:
        print(f"[GCS] Error uploading {destination_blob_name}: {str(e)}")
        traceback.print_exc()
        return None

# ==================== PLATFORM CONFIGURATION (Unchanged) ====================

PLATFORMS = [
    {
        "id": "instagram",
        "name": "Instagram",
        "icon": "📷",
        "description": "Visual storytelling with images",
        "char_limit": 2200,
        "best_for": "Visual content, lifestyle, behind-the-scenes"
    },
    {
        "id": "facebook",
        "name": "Facebook",
        "icon": "👥",
        "description": "Community engagement and detailed posts",
        "char_limit": 63206,
        "best_for": "Detailed stories, community building"
    },
    {
        "id": "twitter",
        "name": "Twitter/X",
        "icon": "🐦",
        "description": "Short, punchy updates",
        "char_limit": 280,
        "best_for": "Quick updates, announcements"
    },
    {
        "id": "linkedin",
        "name": "LinkedIn",
        "icon": "💼",
        "description": "Professional networking",
        "char_limit": 3000,
        "best_for": "Business stories, craftsmanship"
    },
    {
        "id": "youtube",
        "name": "YouTube",
        "icon": "🎥",
        "description": "Video descriptions",
        "char_limit": 5000,
        "best_for": "Tutorial descriptions, video content"
    }
]


# ==================== CONVERSATION FLOW (Unchanged) ====================
CONVERSATION_FLOW = [
    {
        "step": "greeting",
        "question_en": "Hello! I'm here to help you create amazing product listings. What type of craft do you make?",
        "question_pa": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਸ਼ਾਨਦਾਰ ਉਤਪਾਦ ਸੂਚੀਆਂ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਨ ਲਈ ਇੱਥੇ ਹਾਂ। ਤੁਸੀਂ ਕਿਸ ਤਰ੍ਹਾਂ ਦੇ ਦਸਤਕਾਰੀ ਕੰਮ ਕਰਦੇ ਹੋ?",
        "field": "craft_type",
        "required": True
    },
    {
        "step": "product_name",
        "question_en": "Great! What is the name of the product you want to showcase?",
        "question_pa": "ਬਹੁਤ ਵਧੀਆ! ਤੁਸੀਂ ਜੋ ਉਤਪਾਦ ਦਿਖਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ, ਉਸਦਾ ਨਾਮ ਕੀ ਹੈ?",
        "field": "product_name",
        "required": True
    },
    {
        "step": "materials",
        "question_en": "What materials did you use to make this product?",
        "question_pa": "ਇਸ ਉਤਪਾਦ ਨੂੰ ਬਣਾਉਣ ਲਈ ਤੁਸੀਂ ਕਿਹੜੀ ਸਮੱਗਰੀ ਦੀ ਵਰਤੋਂ ਕੀਤੀ?",
        "field": "materials",
        "required": True
    },
    {
        "step": "process",
        "question_en": "Can you briefly describe how you made it? What techniques did you use?",
        "question_pa": "ਕੀ ਤੁਸੀਂ ਸੰਖੇਪ ਵਿੱਚ ਦੱਸ ਸਕਦੇ ਹੋ ਕਿ ਤੁਸੀਂ ਇਸਨੂੰ ਕਿਵੇਂ ਬਣਾਇਆ?",
        "field": "process",
        "required": True
    },
    {
        "step": "special_features",
        "question_en": "What makes this product special or unique?",
        "question_pa": "ਇਸ ਉਤਪਾਦ ਨੂੰ ਖਾਸ ਜਾਂ ਵਿਲੱਖਣ ਕੀ ਬਣਾਉਂਦਾ ਹੈ?",
        "field": "special_features",
        "required": True
    },
    {
        "step": "completion",
        "question_en": "Perfect! I have all the information. Would you like to upload an image of your product now?",
        "question_pa": "ਸੰਪੂਰਨ! ਮੇਰੇ ਕੋਲ ਸਾਰੀ ਜਾਣਕਾਰੀ ਹੈ। ਕੀ ਤੁਸੀਂ ਹੁਣ ਆਪਣੇ ਉਤਪਾਦ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰਨਾ ਚਾਹੋਗੇ?",
        "field": "image_confirmation",
        "required": False
    }
]


# ==================== HELPER FUNCTIONS ====================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None


def translate_to_english(punjabi_text):
    # ... (Translation logic remains the same, relies on TRANSLATION_API_KEY ENV)
    try:
        url = "https://translation.googleapis.com/language/translate/v2"
        params = {
            'key': TRANSLATION_API_KEY,
            'q': punjabi_text,
            'source': 'pa',
            'target': 'en',
            'format': 'text'
        }
        response = requests.post(url, params=params, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            return result['data']['translations'][0]['translatedText']
        
        print("="*50)
        print(f"TRANSLATION API FAILED. Status: {response.status_code}")
        print(f"Response Content: {response.text}")
        print("="*50)
        
        return None
    except Exception as e:
        print(f"Translation error: {str(e)}")
        return None


def text_to_speech_punjabi(text, output_filename):
    """
    MODIFIED: Saves the generated audio directly to GCS instead of local disk.
    Returns the GCS public URL or None.
    """
    if not gcs_bucket:
        print("[TTS] GCS not configured. Cannot save audio.")
        return None
        
    try:
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        voice_configs = [
            {"language_code": "pa-IN", "name": "pa-IN-Wavenet-B", "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE},
            {"language_code": "hi-IN", "name": "hi-IN-Wavenet-D", "ssml_gender": texttospeech.SsmlVoiceGender.FEMALE},
        ]
        
        response = None
        for voice_config in voice_configs:
            try:
                voice = texttospeech.VoiceSelectionParams(
                    language_code=voice_config["language_code"],
                    name=voice_config.get("name"),
                    ssml_gender=voice_config["ssml_gender"]
                )
                audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
                response = tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
                break
            except:
                continue
        
        if not response:
            return None
        
        # --- GCS UPLOAD ---
        gcs_blob_name = f"{AUDIO_FOLDER}/{output_filename}"
        audio_url = upload_file_to_gcs(
            response.audio_content, 
            gcs_blob_name, 
            'audio/mpeg'
        )
        return audio_url
        # ------------------
        
    except Exception as e:
        print(f"[TTS] Error: {str(e)}")
        return None


# ==================== IMAGE GENERATION WITH GOOGLE IMAGEN ====================

def generate_images_with_imagen(product_info, reference_image_path=None, num_images=3):
    """
    MODIFIED: Saves generated images to GCS via a temporary local file.
    """
    if not IMAGEN_AVAILABLE:
        print("[IMAGEN] Service not available - package not installed")
        return None
    if not gcs_bucket:
        print("[IMAGEN] GCS not configured. Cannot save generated images.")
        return None
        
    try:
        print(f"[IMAGEN] Starting generation of {num_images} images...")
        
        # ... (unchanged logic for building prompt from product_info) ...
        craft_type = product_info.get('craft_type', {})
        product_name = product_info.get('product_name', {})
        materials = product_info.get('materials', {})
        process = product_info.get('process', {})
        special_features = product_info.get('special_features', {})
        
        # Handle both dict and string formats
        craft_type_text = craft_type.get('english', craft_type) if isinstance(craft_type, dict) else str(craft_type)
        product_name_text = product_name.get('english', product_name) if isinstance(product_name, dict) else str(product_name)
        materials_text = materials.get('english', materials) if isinstance(materials, dict) else str(materials)
        process_text = process.get('english', process) if isinstance(process, dict) else str(process)
        special_text = special_features.get('english', special_features) if isinstance(special_features, dict) else str(special_features)
        
        # Fallback values
        if not craft_type_text or craft_type_text == 'None':
            craft_type_text = 'handcrafted product'
        if not product_name_text or product_name_text == 'None':
            product_name_text = 'artisan product'
        
        # Create base prompt for professional product photography
        base_prompt = f"""Professional e-commerce product photography of {product_name_text}, a {craft_type_text}.
Made with {materials_text}. {special_text}.
High quality, studio lighting, clean white background, sharp focus, detailed craftsmanship visible.
Professional marketplace photography, artisanal aesthetic, premium quality, 4K resolution."""
        
        # Different angles/styles for variations
        prompt_variations = [
            f"{base_prompt} Close-up detail shot showing intricate craftsmanship and texture.",
            f"{base_prompt} Full product view centered on white background, commercial photography.",
            f"{base_prompt} Angled view with soft natural lighting showing product dimensions."
        ]
        
        generated_images = []
        
        # Initialize Imagen model with correct version
        try:
            model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        except Exception:
            try:
                model = ImageGenerationModel.from_pretrained("imagegeneration@005")
            except Exception as fallback_error:
                print(f"[IMAGEN] Model initialization failed: {fallback_error}")
                return None
        
        for idx, prompt in enumerate(prompt_variations[:num_images]):
            try:
                response = model.generate_images(
                    prompt=prompt,
                    number_of_images=1,
                    aspect_ratio="1:1",
                    add_watermark=False,
                )
                
                if response and hasattr(response, 'images') and response.images:
                    images_list = response.images
                    
                    timestamp = int(time.time())
                    filename = f"generated_{timestamp}_{idx}.png"
                    
                    # --- CRITICAL FIX: Save to temp file -> Upload to GCS -> Delete temp file ---
                    # 1. Save locally to a temporary file first (required by PIL/Vertex AI SDK's .save() method)
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
                        temp_filepath = tmp_file.name
                    
                    images_list[0].save(temp_filepath)
                    
                    # 2. Upload to GCS
                    gcs_blob_name = f"{GENERATED_IMAGES_FOLDER}/{filename}"
                    
                    with open(temp_filepath, 'rb') as f:
                        file_content = f.read()
                        
                    image_url = upload_file_to_gcs(
                        file_content,
                        gcs_blob_name,
                        'image/png'
                    )
                    
                    # 3. Clean up the local temporary file
                    os.unlink(temp_filepath)
                    # ---------------------------------------------------------------------------
                    
                    if image_url:
                        file_size = len(file_content)
                        generated_images.append({
                            'url': image_url,
                            'filename': filename,
                            'variation': idx + 1,
                            'prompt': prompt[:100] + '...',
                            'size': file_size
                        })
                    
                if idx < num_images - 1:
                    time.sleep(2)
                
            except Exception as img_error:
                error_msg = str(img_error)
                print(f"[IMAGEN] Error generating image {idx + 1}: {error_msg}")
                traceback.print_exc()
                continue
        
        return generated_images if generated_images else None
            
    except Exception as e:
        print(f"[IMAGEN] Fatal error: {str(e)}")
        traceback.print_exc()
        return None


# ==================== PLATFORMS ENDPOINT (Unchanged) ====================

@app.route('/api/platforms', methods=['GET'])
def get_platforms():
    """Return available social media platforms"""
    return jsonify({'platforms': PLATFORMS}), 200


# ==================== HEALTH CHECK FIX (NEW) ====================

@app.route('/', methods=['GET'])
def index():
    """Simple root route for Render health check."""
    return jsonify({'status': 'Kalakar AI Backend is Running', 'health_check_endpoint': '/api/health'}), 200


# ==================== AUTHENTICATION (Unchanged) ====================

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username') or email.split('@')[0]
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409

        new_user = User(username=username, email=email)
        new_user.set_password(data.get('password'))
        db.session.add(new_user)
        db.session.commit()
        
        session.permanent = True
        session['user_id'] = new_user.id
        session.modified = True
        
        return jsonify({'message': 'User created!', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data.get('email')).first()
        
        if user and user.check_password(data.get('password')):
            session.permanent = True
            session['user_id'] = user.id
            session.modified = True
            return jsonify({'message': 'Login successful!', 'user': user.to_dict()}), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/me', methods=['GET'])
def get_current_user_info():
    user = get_current_user()
    if user:
        return jsonify({'user': user.to_dict()}), 200
    return jsonify({'error': 'Not authenticated'}), 401


# ==================== CONVERSATION ROUTES (Updated for GCS URL) ====================

@app.route('/api/conversation/start', methods=['POST'])
def start_conversation():
    try:
        user = get_current_user()
        if not user:
            # Demo user logic for unauthenticated access
            user = User.query.filter_by(email='demo@kalakaar.ai').first()
            if not user:
                user = User(username='demo_user', email='demo@kalakaar.ai')
                user.set_password('demo123')
                db.session.add(user)
                db.session.commit()
            session.permanent = True
            session['user_id'] = user.id
            session.modified = True
        
        session_id = f"conv_{user.id}_{int(time.time())}"
        
        conversation = Conversation(
            user_id=user.id,
            session_id=session_id,
            current_step="greeting",
            collected_info=json.dumps({}),
            conversation_data=json.dumps([])
        )
        db.session.add(conversation)
        db.session.commit()
        
        first_question = CONVERSATION_FLOW[0]
        audio_filename = f"{session_id}_greeting.mp3"
        
        # CRITICAL FIX: text_to_speech_punjabi now returns a GCS URL
        audio_file_url = text_to_speech_punjabi(first_question['question_pa'], audio_filename)
        
        return jsonify({
            'session_id': session_id,
            'question': first_question['question_pa'],
            'question_en': first_question['question_en'],
            'step': 'greeting',
            'audio_url': audio_file_url, # Returns GCS URL
            'progress': 0
        }), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/conversation/respond', methods=['POST'])
def respond_to_conversation():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401
        
        session_id = request.form.get('session_id')
        conversation = Conversation.query.filter_by(session_id=session_id, user_id=user.id).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        audio_file = request.files['audio']
        audio_content = audio_file.read()
        audio = speech.RecognitionAudio(content=audio_content)
        
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            language_code='pa-IN',
            enable_automatic_punctuation=True,
        )
        
        # This part relies on the speech_client being correctly initialized from ENV credentials
        response = speech_client.recognize(config=config, audio=audio)
        punjabi_text = " ".join([r.alternatives[0].transcript for r in response.results]).strip()
        
        if not punjabi_text:
            return jsonify({'error': 'Could not understand audio'}), 400
        
        english_text = translate_to_english(punjabi_text)
        
        current_step_index = next((i for i, s in enumerate(CONVERSATION_FLOW) if s['step'] == conversation.current_step), 0)
        current_step = CONVERSATION_FLOW[current_step_index]
        
        collected_info = json.loads(conversation.collected_info)
        collected_info[current_step['field']] = {'punjabi': punjabi_text, 'english': english_text}
        
        conv_data = json.loads(conversation.conversation_data)
        conv_data.append({
            'step': current_step['step'],
            'answer_pa': punjabi_text,
            'answer_en': english_text
        })
        
        conversation.collected_info = json.dumps(collected_info)
        conversation.conversation_data = json.dumps(conv_data)
        
        next_step_index = current_step_index + 1
        
        if next_step_index >= len(CONVERSATION_FLOW):
            conversation.is_complete = True
            conversation.current_step = "completed"
            db.session.commit()
            return jsonify({
                'completed': True,
                'message': 'Conversation completed!',
                'collected_info': collected_info,
                'progress': 100
            }), 200
        
        next_step = CONVERSATION_FLOW[next_step_index]
        conversation.current_step = next_step['step']
        db.session.commit()
        
        audio_filename = f"{session_id}_{next_step['step']}.mp3"
        # CRITICAL FIX: text_to_speech_punjabi now returns a GCS URL
        audio_file_url = text_to_speech_punjabi(next_step['question_pa'], audio_filename)
        
        progress = int((next_step_index / len(CONVERSATION_FLOW)) * 100)
        
        return jsonify({
            'completed': False,
            'user_response_pa': punjabi_text,
            'user_response_en': english_text,
            'next_question': next_step['question_pa'],
            'next_question_en': next_step['question_en'],
            'step': next_step['step'],
            'audio_url': audio_file_url, # Returns GCS URL
            'progress': progress
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ==================== IMAGE GENERATION ENDPOINT ====================

@app.route('/api/generate-images', methods=['POST'])
def generate_product_images():
    """
    MODIFIED: Handles reference image upload to GCS. Calls the GCS-aware image generation helper.
    """
    try:
        if not IMAGEN_AVAILABLE:
            return jsonify({'error': 'Image generation not available', 'success': False}), 503
        
        if not project_id:
            return jsonify({'error': 'Google Cloud not configured', 'success': False}), 503
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated', 'success': False}), 401
        
        data = request.form.to_dict()
        session_id = data.get('session_id')
        num_images = int(data.get('num_images', 3))
        
        if not session_id or num_images < 1 or num_images > 3:
            return jsonify({'error': 'Invalid parameters', 'success': False}), 400
        
        conversation = Conversation.query.filter_by(session_id=session_id, user_id=user.id).first()
        
        if not conversation or not conversation.is_complete:
            return jsonify({'error': 'Conversation must be completed first', 'success': False}), 400
        
        collected_info = json.loads(conversation.collected_info)
        
        if any(f not in collected_info for f in ['craft_type', 'product_name']):
            return jsonify({'error': 'Incomplete product information', 'success': False}), 400
        
        # --- CRITICAL FIX: Handle reference image via GCS URL ---
        reference_image_url = None
        
        if 'reference_image' in request.files:
            file = request.files['reference_image']
            if file and file.filename and allowed_file(file.filename):
                timestamp = int(time.time())
                filename = f"ref_{timestamp}_{secure_filename(file.filename)}"
                
                file_content = file.read()
                gcs_blob_name = f"{UPLOAD_FOLDER}/{filename}"
                
                reference_image_url = upload_file_to_gcs(
                    file_content, 
                    gcs_blob_name, 
                    file.content_type
                )
            
        elif data.get('reference_image_url'):
            reference_image_url = data.get('reference_image_url')

        print(f"[IMAGE_GEN] Starting generation...")
        
        # The helper function is called without a local path, matching the GCS strategy.
        generated_images = generate_images_with_imagen(
            collected_info,
            None, # reference_image_path is not a local file here
            num_images
        )
        # ... (rest of the database saving logic remains the same)
        
        if not generated_images:
            return jsonify({'error': 'Image generation failed', 'success': False}), 500
        
        # Save to database
        try:
            # ... (database saving logic unchanged) ...
            content = Content.query.filter_by(user_id=user.id).order_by(Content.created_at.desc()).first()
            
            if content:
                content.generated_images = json.dumps(generated_images)
                # Note: reference_image_url is stored in content.image_url if we want to save it
                if reference_image_url:
                    content.image_url = reference_image_url
                db.session.commit()
            else:
                product_details = []
                for key, value in collected_info.items():
                    if isinstance(value, dict) and 'english' in value:
                        product_details.append(f"{key}: {value['english']}")
                    else:
                        product_details.append(f"{key}: {value}")
                
                product_text = "\n".join(product_details)
                
                content = Content(
                    user_id=user.id,
                    english_text=product_text,
                    image_url=reference_image_url,
                    generated_images=json.dumps(generated_images)
                )
                db.session.add(content)
                db.session.commit()
                
        except Exception as db_error:
            print(f"[IMAGE_GEN] DB error: {db_error}")
            traceback.print_exc()
            db.session.rollback()
        
        return jsonify({
            'success': True,
            'generated_images': generated_images,
            'count': len(generated_images),
            'method': 'google_imagen',
            'model': 'imagegeneration@006',
            'message': f'Successfully generated {len(generated_images)} product images'
        }), 200
        
    except Exception as e:
        print(f"[IMAGE_GEN] Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'success': False
        }), 500


# ==================== IMAGE & CONTENT GENERATION (Updated for GCS) ====================

@app.route('/api/upload_image', methods=['POST'])
def upload_image():
    """
    MODIFIED: Uploads the file directly to GCS and returns the GCS URL.
    """
    try:
        file = request.files['image']
        if not file or not file.filename or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file'}), 400
            
        timestamp = int(time.time())
        filename = f"{timestamp}_{secure_filename(file.filename)}"
        
        # --- GCS UPLOAD ---
        file_content = file.read()
        gcs_blob_name = f"{UPLOAD_FOLDER}/{filename}"
        
        image_url = upload_file_to_gcs(
            file_content, 
            gcs_blob_name, 
            file.content_type
        )
        
        if not image_url:
            return jsonify({'error': 'Failed to upload to cloud storage'}), 500
        # ------------------
        
        return jsonify({'message': 'Image uploaded!', 'image_url': image_url}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# --- CRITICAL FIX: REMOVED LOCAL FILE SERVING ROUTES ---
# Files are now served directly from Google Cloud Storage URLs.
# The client must be updated to use the GCS URLs provided in the API responses.

# @app.route('/uploads/<filename>')
# def serve_image(filename):
#     # ... REMOVED: Use GCS URL instead.
#     pass

# @app.route('/generated_images/<filename>')
# def serve_generated_image(filename):
#     # ... REMOVED: Use GCS URL instead.
#     pass

# @app.route('/audio/<filename>')
# def serve_audio(filename):
#     # ... REMOVED: Use GCS URL instead.
#     pass


@app.route('/api/conversation/generate', methods=['POST'])
def generate_from_conversation():
    """
    MODIFIED: Loads the reference image from its public URL (GCS/External) into memory.
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        image_url = data.get('image_url')
        selected_platforms = data.get('platforms', ['instagram', 'facebook'])
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401
        
        conversation = Conversation.query.filter_by(session_id=session_id, user_id=user.id).first()
        
        if not conversation or not conversation.is_complete:
            return jsonify({'error': 'Conversation not complete'}), 400
        
        collected_info = json.loads(conversation.collected_info)
        
        # ... (product details extraction unchanged) ...
        product_details_list = []
        fields_to_extract = [
            ("craft_type", "Craft Type"),
            ("product_name", "Product Name"),
            ("materials", "Materials"),
            ("process", "Process"),
            ("special_features", "Special Features")
        ]
        
        for field_key, field_title in fields_to_extract:
            info_entry = collected_info.get(field_key, {})
            english_value = info_entry.get('english', 'MISSING CONVERSATION DATA')
            product_details_list.append(f"**{field_title}**: {english_value}")
        
        product_text = "\n".join(product_details_list)

        image_part = None
        if image_url:
            try:
                print(f"Attempting to load image from URL: {image_url}")
                
                # Fetch image data from the public URL (GCS or external)
                image_response = requests.get(image_url, stream=True, timeout=10)
                if image_response.status_code == 200:
                    image_part = Image.open(io.BytesIO(image_response.content))
                    print("✓ Successfully loaded image content via HTTP request.")
                else:
                    print(f"Warning: Could not fetch image from {image_url}. Status: {image_response.status_code}")

            except Exception as e:
                print(f"Error loading image: {str(e)}")
                traceback.print_exc()
        
        # ... (content generation logic unchanged) ...
        platform_content = {}
        
        for platform_id in selected_platforms:
            platform = next((p for p in PLATFORMS if p['id'] == platform_id), None)
            if not platform:
                continue
            
            prompt = f"""You are an expert content creator helping an artisan (Kalakaar) generate engaging social media posts.

Create a compelling and authentic {platform['name']} post for the following handcrafted product.
Analyze the visual details from the image (if provided) and weave them with the textual details below.

--- PRODUCT DETAILS ---
{product_text}
--- END DETAILS ---

Requirements:
- Platform: {platform['name']} ({platform['description']})
- Character limit: {platform['char_limit']}
- Style: {platform['best_for']}. Maintain an authentic, heartfelt, and personal tone.
- Include relevant emojis and hashtags based on the product, materials, and craft.
- The post must be engaging and encourage comments/shares.

Generate ONLY the post content, nothing else."""

            try:
                model = genai.GenerativeModel('gemini-2.0-flash-exp')
                
                contents = [prompt]
                if image_part:
                    contents.insert(0, image_part)
                
                response = model.generate_content(contents)
                
                platform_content[platform_id] = {
                    'platform': platform['name'],
                    'content': response.text.strip(),
                    'char_limit': platform['char_limit'],
                    'format_type': platform['best_for']
                }
            except Exception as e:
                traceback.print_exc()
                platform_content[platform_id] = {
                    'platform': platform['name'],
                    'content': f'Error generating content: {str(e)}. (Check server logs for details).',
                    'char_limit': platform['char_limit'],
                    'format_type': platform['best_for'],
                    'error': True
                }
        
        return jsonify({
            'success': True,
            'platforms': selected_platforms,
            'content': platform_content,
            'model_used': 'gemini-2.0-flash-exp'
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ==================== HEALTH CHECK (Unchanged) ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'speech_to_text': 'active',
            'text_to_speech': 'active',
            'translation': 'active',
            'gemini_content': 'active',
            'imagen_generation': 'active' if (IMAGEN_AVAILABLE and project_id) else 'not_configured'
        }
    }), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Route not found'}), 404


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ==================== STARTUP (MODIFIED for Render Port) ====================

if __name__ == '__main__':
    with app.app_context():
        # NOTE: db.create_all() will only work if the DATABASE_URL is set correctly 
        # to a managed DB (like PostgreSQL) before deployment.
        db.create_all()
        print("=" * 50)
        print("✓ Database setup attempt complete!")
        # ... (rest of startup logs) ...
        print("=" * 50)
        
    # CRITICAL FIX: Use the environment variable PORT provided by Render
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Server running on http://0.0.0.0:{port}")
    
    # Run the application, binding to all interfaces on the correct port
    app.run(debug=False, host='0.0.0.0', port=port)