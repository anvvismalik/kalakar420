import os
import io
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, session, send_from_directory
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
from sqlalchemy.engine.url import make_url
# --- GOOGLE CLOUD IMPORTS ---
from google.cloud import speech
from google.cloud import texttospeech
from google.oauth2 import service_account

# Load environment variables
load_dotenv(find_dotenv())

# --- GOOGLE CLOUD CREDENTIALS SETUP ---
def get_google_credentials():
    """
    Load Google Cloud credentials from environment variable or file
    For production (Render), use GOOGLE_APPLICATION_CREDENTIALS_JSON env var
    For local dev, use credentials.json file
    """
    try:
        # Try to load from environment variable (production)
        creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if creds_json:
            print("✓ Using credentials from environment variable")
            creds_dict = json.loads(creds_json)
            return service_account.Credentials.from_service_account_info(creds_dict)
        
        # Fall back to local file (development)
        key_path = "credentials.json"
        if os.path.exists(key_path):
            print("⚠ Using local credentials.json file. ONLY FOR LOCAL TESTING.")
            return service_account.Credentials.from_service_account_file(key_path)
        
        print("⚠ No Google Cloud credentials found")
        return None
    except Exception as e:
        print(f"⚠ Error loading credentials: {e}")
        return None

# Get credentials
credentials = get_google_credentials()

# Initialize Google Cloud clients only if credentials are available
speech_client = None
tts_client = None

if credentials:
    try:
        speech_client = speech.SpeechClient(credentials=credentials)
        tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
        print("✓ Google Cloud Speech/TTS clients initialized")
    except Exception as e:
        print(f"⚠ Speech/TTS client initialization failed: {e}")
else:
    print("⚠ Running without Google Cloud Speech/TTS services")

# Translation API Key
TRANSLATION_API_KEY = os.getenv("TRANSLATION_API_KEY")

# CLIPDROP API Configuration
CLIPDROP_API_KEY = os.getenv("CLIPDROP_API_KEY")
CLIPDROP_AVAILABLE = bool(CLIPDROP_API_KEY)

if CLIPDROP_AVAILABLE:
    print("✓ Clipdrop API configured")
else:
    print("⚠ Clipdrop API key not found. Set CLIPDROP_API_KEY in environment variables")

app = Flask(__name__)

# Database and Secret Key Configuration
raw_database_url = os.environ.get('DATABASE_URL')

# Convert to use psycopg driver explicitly
if raw_database_url:
    # Parse and rebuild the URL with explicit psycopg driver
    url_obj = make_url(raw_database_url)
    
    # Explicitly set the driver to psycopg
    url_obj = url_obj.set(drivername="postgresql+psycopg")
    
    database_url = str(url_obj)
    print(f"✓ Database configured with psycopg driver: {url_obj.drivername}")
else:
    database_url = None
    print("⚠ No database URL found, using SQLite")

# Use PostgreSQL in production, SQLite for local development
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///db.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Engine options for connection pooling (simplified for SQLite)
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'a_super_secret_key_change_in_production'

print(f"✓ Database: {'PostgreSQL (Production)' if database_url else 'SQLite (Development)'}")

# Session configuration
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Required for cross-domain
app.config['SESSION_COOKIE_SECURE'] = True       # Required when SameSite=None
app.config['SESSION_COOKIE_HTTPONLY'] = True     # Security best practice
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_DOMAIN'] = None       # Let browser handle it
app.config['SESSION_COOKIE_NAME'] = 'kalakar_session'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400

# File Upload Configuration
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'audio_responses'
ENHANCED_IMAGES_FOLDER = 'enhanced_images'  # Changed from generated_images
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  

CORS(app, 
     supports_credentials=True,
     origins=[
         "https://kalakar420.vercel.app",
         "http://localhost:5173",
         "http://127.0.0.1:5173",
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "http://localhost:8080",
         "http://127.0.0.1:8080",
         "http://localhost:5001", 
         "http://127.0.0.1:5001"
     ],
     allow_headers=["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
     expose_headers=["Set-Cookie", "Content-Type"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     max_age=3600,
     send_wildcard=False,
     always_send=True
)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['ENHANCED_IMAGES_FOLDER'] = ENHANCED_IMAGES_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Configure Google Gemini API
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# Initialize Database
db = SQLAlchemy(app)

# ==================== DATABASE MODELS ====================

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
    enhanced_images = db.Column(db.Text)  # Store enhanced image URLs
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
            'enhanced_images': json.loads(self.enhanced_images) if self.enhanced_images else None,
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


# ==================== DATABASE INITIALIZATION ====================

def init_database():
    """Initialize database tables - creates all tables on startup"""
    with app.app_context():
        try:
            # Import all models to ensure they're registered
            from sqlalchemy import inspect
            
            # Check if tables exist
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            # Create all tables
            db.create_all()
            
            print("=" * 60)
            print("✓ Database initialized successfully!")
            print(f"  Engine: {db.engine.url.drivername}")
            print(f"  Tables: {', '.join(db.metadata.tables.keys())}")
            if existing_tables:
                print(f"  Existing: {', '.join(existing_tables)}")
            print("=" * 60)
            
        except Exception as e:
            print(f"⚠ Database initialization error: {e}")
            import traceback
            traceback.print_exc()

# IMPORTANT: Call this right after defining it
init_database()


# ==================== PLATFORM CONFIGURATION ====================
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


# ==================== CONVERSATION FLOW ====================
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
    if not tts_client:
        print("[TTS] Client not initialized")
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
        
        output_path = os.path.join(app.config['AUDIO_FOLDER'], output_filename)
        with open(output_path, 'wb') as out:
            out.write(response.audio_content)
        return output_filename
    except Exception as e:
        print(f"[TTS] Error: {str(e)}")
        return None


# ==================== CLIPDROP IMAGE ENHANCEMENT ====================

def enhance_image_with_clipdrop(image_path, product_info=None):
    """
    Enhance product image using Clipdrop APIs:
    1. Remove background
    2. Replace with professional background
    3. Optional: Improve lighting
    
    Returns: dict with enhanced image info or None if failed
    """
    if not CLIPDROP_AVAILABLE:
        print("[CLIPDROP] API key not configured")
        return None
    
    try:
        print(f"[CLIPDROP] Starting image enhancement for: {image_path}")
        
        # Read original image
        with open(image_path, 'rb') as img_file:
            image_data = img_file.read()
        
        print(f"[CLIPDROP] Image size: {len(image_data)} bytes")
        
        # Step 1: Remove Background
        print("[CLIPDROP] Step 1: Removing background...")
        print(f"[CLIPDROP] API Key configured: {bool(CLIPDROP_API_KEY)}")
        
        remove_bg_response = requests.post(
            'https://clipdrop-api.co/remove-background/v1',
            files={'image_file': ('image.jpg', image_data, 'image/jpeg')},
            headers={'x-api-key': CLIPDROP_API_KEY},
            timeout=30
        )
        
        print(f"[CLIPDROP] Response status: {remove_bg_response.status_code}")
        print(f"[CLIPDROP] Response headers: {dict(remove_bg_response.headers)}")
        
        if remove_bg_response.status_code != 200:
            print(f"[CLIPDROP] Background removal failed: {remove_bg_response.status_code}")
            print(f"[CLIPDROP] Response body: {remove_bg_response.text}")
            return None
        
        no_bg_image = remove_bg_response.content
        print("[CLIPDROP] ✓ Background removed successfully")
        
        # Step 2: Replace Background with professional setting
        print("[CLIPDROP] Step 2: Adding professional background...")
        
        # Create professional background prompt based on product type
        craft_type = "handcrafted product"
        if product_info:
            craft_info = product_info.get('craft_type', {})
            if isinstance(craft_info, dict):
                craft_type = craft_info.get('english', craft_type)
            else:
                craft_type = str(craft_info)
        
        background_prompt = f"Professional studio setup for {craft_type}, clean white background, soft studio lighting, minimalist product photography, premium e-commerce aesthetic"
        
        replace_bg_response = requests.post(
            'https://clipdrop-api.co/replace-background/v1',
            files={
                'image_file': ('image.png', no_bg_image, 'image/png')
            },
            data={
                'prompt': background_prompt
            },
            headers={'x-api-key': CLIPDROP_API_KEY},
            timeout=30
        )
        
        if replace_bg_response.status_code != 200:
            print(f"[CLIPDROP] Background replacement failed: {replace_bg_response.status_code}")
            print(f"[CLIPDROP] Response: {replace_bg_response.text}")
            # Still save the no-background version
            enhanced_image = no_bg_image
        else:
            enhanced_image = replace_bg_response.content
            print("[CLIPDROP] ✓ Background replaced successfully")
        
        # Save enhanced image
        timestamp = int(time.time())
        filename = f"enhanced_{timestamp}_{os.path.basename(image_path)}"
        output_path = os.path.join(app.config['ENHANCED_IMAGES_FOLDER'], filename)
        
        with open(output_path, 'wb') as out_file:
            out_file.write(enhanced_image)
        
        file_size = os.path.getsize(output_path)
        print(f"[CLIPDROP] ✓ Saved enhanced image: {filename} ({file_size} bytes)")
        
        base_url = os.getenv('BASE_URL', 'http://127.0.0.1:5001')
        image_url = f'{base_url}/enhanced_images/{filename}'
        
        return {
            'url': image_url,
            'filename': filename,
            'size': file_size,
            'method': 'clipdrop_enhancement',
            'original_image': os.path.basename(image_path)
        }
        
    except Exception as e:
        print(f"[CLIPDROP] Error: {str(e)}")
        traceback.print_exc()
        return None


def create_multiple_background_variants(image_path, product_info=None, num_variants=3):
    """
    Create multiple professional background variants of the product image
    
    Returns: list of enhanced image dicts
    """
    if not CLIPDROP_AVAILABLE:
        print("[CLIPDROP] API key not configured")
        return None
    
    try:
        print(f"[CLIPDROP] Creating {num_variants} background variants...")
        
        # Read original image
        with open(image_path, 'rb') as img_file:
            image_data = img_file.read()
        
        print(f"[CLIPDROP] Image size: {len(image_data)} bytes")
        
        # Step 1: Remove Background (do this once)
        print("[CLIPDROP] Removing background...")
        print(f"[CLIPDROP] API Key present: {bool(CLIPDROP_API_KEY)}")
        print(f"[CLIPDROP] API Key length: {len(CLIPDROP_API_KEY) if CLIPDROP_API_KEY else 0}")
        
        remove_bg_response = requests.post(
            'https://clipdrop-api.co/remove-background/v1',
            files={'image_file': ('image.jpg', image_data, 'image/jpeg')},
            headers={'x-api-key': CLIPDROP_API_KEY},
            timeout=30
        )
        
        print(f"[CLIPDROP] Remove BG Response Status: {remove_bg_response.status_code}")
        print(f"[CLIPDROP] Remove BG Response Headers: {dict(remove_bg_response.headers)}")
        print(f"[CLIPDROP] Remove BG Response Body: {remove_bg_response.text[:500]}")
        
        if remove_bg_response.status_code != 200:
            print(f"[CLIPDROP] Background removal failed: {remove_bg_response.status_code}")
            print(f"[CLIPDROP] Error details: {remove_bg_response.text}")
            return None
        
        no_bg_image = remove_bg_response.content
        print(f"[CLIPDROP] ✓ Background removed, size: {len(no_bg_image)} bytes")
        
        # Free memory
        del remove_bg_response
        del image_data
        
        # Get product context
        craft_type = "handcrafted product"
        if product_info:
            craft_info = product_info.get('craft_type', {})
            if isinstance(craft_info, dict):
                craft_type = craft_info.get('english', craft_type)
            else:
                craft_type = str(craft_info)
        
        # Different professional background prompts
        background_prompts = [
            f"Clean white studio background, professional product photography for {craft_type}, soft even lighting, minimalist",
            f"Neutral beige background, premium e-commerce photography for {craft_type}, natural lighting, elegant",
            f"Soft gradient background, modern product photography for {craft_type}, studio lighting, professional"
        ]
        
        enhanced_images = []
        
        # Step 2: Create variants with different backgrounds
        for idx, prompt in enumerate(background_prompts[:num_variants]):
            try:
                print(f"[CLIPDROP] Creating variant {idx + 1}/{num_variants}...")
                
                # Use a copy of no_bg_image to avoid memory issues
                replace_bg_response = requests.post(
                    'https://clipdrop-api.co/replace-background/v1',
                    files={
                        'image_file': ('image.png', io.BytesIO(no_bg_image), 'image/png')
                    },
                    data={
                        'prompt': prompt
                    },
                    headers={'x-api-key': CLIPDROP_API_KEY},
                    timeout=30
                )
                
                print(f"[CLIPDROP] Replace BG Status: {replace_bg_response.status_code}")
                
                if replace_bg_response.status_code == 200:
                    timestamp = int(time.time())
                    # Add microseconds to ensure unique filenames
                    import random
                    filename = f"enhanced_{timestamp}_{random.randint(1000,9999)}_v{idx + 1}.png"
                    
                    # Ensure directory exists
                    os.makedirs(app.config['ENHANCED_IMAGES_FOLDER'], exist_ok=True)
                    
                    output_path = os.path.join(app.config['ENHANCED_IMAGES_FOLDER'], filename)
                    
                    print(f"[CLIPDROP] Saving to: {output_path}")
                    
                    # Write file
                    with open(output_path, 'wb') as out_file:
                        out_file.write(replace_bg_response.content)
                    
                    # Verify file was saved
                    if not os.path.exists(output_path):
                        print(f"[CLIPDROP] ⚠️ File not saved: {output_path}")
                        continue
                    
                    file_size = os.path.getsize(output_path)
                    base_url = os.getenv('BASE_URL', 'http://127.0.0.1:5001')
                    image_url = f'{base_url}/enhanced_images/{filename}'
                    
                    enhanced_images.append({
                        'url': image_url,
                        'filename': filename,
                        'variant': idx + 1,
                        'background_style': prompt.split(',')[0],
                        'size': file_size,
                        'method': 'clipdrop_variant'
                    })
                    
                    print(f"[CLIPDROP] ✓ Variant {idx + 1} created: {filename} ({file_size} bytes)")
                else:
                    print(f"[CLIPDROP] Variant {idx + 1} failed: {replace_bg_response.status_code}")
                    print(f"[CLIPDROP] Error: {replace_bg_response.text[:200]}")
                
                # Free memory immediately after each variant
                del replace_bg_response
                
                # Rate limiting delay
                if idx < num_variants - 1:
                    time.sleep(1.5)
                    
            except Exception as e:
                print(f"[CLIPDROP] Error creating variant {idx + 1}: {str(e)}")
                traceback.print_exc()
                continue
        
        # Free memory
        del no_bg_image
        
        if enhanced_images:
            print(f"[CLIPDROP] Successfully created {len(enhanced_images)} variants")
            return enhanced_images
        else:
            print("[CLIPDROP] No variants were created")
            return None
            
    except Exception as e:
        print(f"[CLIPDROP] Fatal error: {str(e)}")
        traceback.print_exc()
        return None


# ==================== ROUTES ====================

@app.route('/')
def home():
    return jsonify({
        'status': 'online',
        'service': 'Kalakar AI Backend',
        'version': '2.0.0',
        'features': ['clipdrop_image_enhancement']
    }), 200


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'speech_to_text': 'active' if speech_client else 'inactive',
            'text_to_speech': 'active' if tts_client else 'inactive',
            'translation': 'active' if TRANSLATION_API_KEY else 'inactive',
            'gemini_content': 'active',
            'clipdrop_enhancement': 'active' if CLIPDROP_AVAILABLE else 'not_configured',
            'database': 'postgresql' if database_url else 'sqlite'
        }
    }), 200


# ==================== PLATFORMS ENDPOINT ====================

@app.route('/api/platforms', methods=['GET'])
def get_platforms():
    """Return available social media platforms"""
    return jsonify({'platforms': PLATFORMS}), 200


# ==================== AUTHENTICATION ====================

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


# ==================== CONVERSATION ROUTES ====================

@app.route('/api/conversation/start', methods=['POST'])
def start_conversation():
    try:
        user = get_current_user()
        if not user:
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
        audio_file = text_to_speech_punjabi(first_question['question_pa'], audio_filename)
        
        return jsonify({
            'session_id': session_id,
            'question': first_question['question_pa'],
            'question_en': first_question['question_en'],
            'step': 'greeting',
            'audio_url': f'{request.host_url.rstrip("/")}/audio/{audio_filename}' if audio_file else None,
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
        
        if not speech_client:
            return jsonify({'error': 'Speech service not available'}), 503
        
        audio_file = request.files['audio']
        audio_content = audio_file.read()
        audio = speech.RecognitionAudio(content=audio_content)
        
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            language_code='pa-IN',
            enable_automatic_punctuation=True,
        )
        
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
        audio_file = text_to_speech_punjabi(next_step['question_pa'], audio_filename)
        
        progress = int((next_step_index / len(CONVERSATION_FLOW)) * 100)
        
        return jsonify({
            'completed': False,
            'user_response_pa': punjabi_text,
            'user_response_en': english_text,
            'next_question': next_step['question_pa'],
            'next_question_en': next_step['question_en'],
            'step': next_step['step'],
            'audio_url': f'{request.host_url.rstrip("/")}/audio/{audio_filename}' if audio_file else None,
            'progress': progress
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ==================== IMAGE ENHANCEMENT ENDPOINT ====================

@app.route('/api/enhance-image', methods=['POST', 'OPTIONS'])
def enhance_product_image():
    """
    ROUTE ENDPOINT - Enhance product image using Clipdrop API
    Accepts image_url in JSON, reads from local filesystem
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    try:
        print("=" * 60)
        print("🖼️ ENHANCE IMAGE REQUEST RECEIVED")
        print("=" * 60)
        
        if not CLIPDROP_AVAILABLE:
            return jsonify({
                'error': 'Image enhancement not available',
                'details': 'CLIPDROP_API_KEY not configured',
                'success': False
            }), 503
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated', 'success': False}), 401
        
        # Get JSON data
        data = request.get_json()
        image_url = data.get('image_url')
        session_id = data.get('session_id')
        create_variants = data.get('create_variants', True)
        num_variants = min(int(data.get('num_variants', 3)), 3)  # Cap at 3 to prevent memory issues
        
        print(f"📦 Request: image_url={image_url}, session={session_id}")
        
        if not image_url:
            return jsonify({'error': 'image_url required', 'success': False}), 400
        
        # Extract filename from URL and construct local path
        filename = os.path.basename(image_url)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        print(f"📁 Looking for local file: {filepath}")
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return jsonify({
                'error': 'Image file not found on server',
                'details': f'File {filename} does not exist',
                'success': False
            }), 404
        
        # Check file size to prevent OOM
        file_size = os.path.getsize(filepath)
        print(f"✅ File found: {filepath} ({file_size} bytes)")
        
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            return jsonify({
                'error': 'Image file too large',
                'details': 'Maximum file size is 10MB',
                'success': False
            }), 400
        
        # Get product info if session_id provided
        product_info = None
        if session_id:
            conversation = Conversation.query.filter_by(
                session_id=session_id,
                user_id=user.id
            ).first()
            
            if conversation and conversation.is_complete:
                try:
                    product_info = json.loads(conversation.collected_info)
                    print(f"✅ Product info loaded from conversation")
                except:
                    print(f"⚠️ Could not parse product info")
        
        # Enhance the image
        print(f"🎨 Starting enhancement (variants={create_variants}, num={num_variants})")
        
        if create_variants:
            enhanced_images = create_multiple_background_variants(
                filepath,
                product_info,
                num_variants
            )
        else:
            single_result = enhance_image_with_clipdrop(filepath, product_info)
            enhanced_images = [single_result] if single_result else None
        
        if not enhanced_images:
            return jsonify({
                'error': 'Image enhancement failed',
                'details': 'Could not process image. Check server logs for Clipdrop API errors.',
                'success': False
            }), 500
        
        # Save to database
        try:
            content = Content.query.filter_by(user_id=user.id).order_by(Content.created_at.desc()).first()
            
            if content:
                content.enhanced_images = json.dumps(enhanced_images)
                db.session.commit()
                print("✅ Updated existing content record")
            else:
                content = Content(
                    user_id=user.id,
                    image_url=image_url,
                    enhanced_images=json.dumps(enhanced_images)
                )
                db.session.add(content)
                db.session.commit()
                print("✅ Created new content record")
            
        except Exception as db_error:
            print(f"[ENHANCE] DB error: {db_error}")
            db.session.rollback()
        
        print("=" * 60)
        print(f"✅ ENHANCEMENT COMPLETE - {len(enhanced_images)} variants created")
        print("=" * 60)
        
        return jsonify({
            'success': True,
            'original_image': image_url,
            'enhanced_images': enhanced_images,
            'count': len(enhanced_images),
            'method': 'clipdrop',
            'message': f'Successfully enhanced image with {len(enhanced_images)} variant(s)'
        }), 200
        
    except Exception as e:
        print(f"[ENHANCE] Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'success': False
        }), 500


# ==================== IMAGE & CONTENT GENERATION ====================

@app.route('/api/upload_image', methods=['POST'])
def upload_image():
    try:
        file = request.files['image']
        timestamp = int(time.time())
        filename = f"{timestamp}_{secure_filename(file.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        base_url = os.getenv('BASE_URL', 'http://127.0.0.1:5001')
        image_url = f'{base_url}/uploads/{filename}'
        
        return jsonify({'message': 'Image uploaded!', 'image_url': image_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/enhanced_images/<filename>')
def serve_enhanced_image(filename):
    """Serve Clipdrop enhanced images"""
    try:
        return send_from_directory(app.config['ENHANCED_IMAGES_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({'error': 'Image not found'}), 404


@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(app.config['AUDIO_FOLDER'], filename, mimetype='audio/mpeg')


@app.route('/api/conversation/generate', methods=['POST'])
def generate_from_conversation():
    try:
        print("=" * 60)
        print("🔥 GENERATE CONTENT REQUEST RECEIVED")
        print("=" * 60)
        
        data = request.get_json()
        print(f"📦 Request Data: {data}")
        
        if not data:
            print("❌ No data received in request")
            return jsonify({'error': 'No data received'}), 400
        
        session_id = data.get('session_id')
        image_url = data.get('image_url')
        selected_platforms = data.get('platforms', ['instagram', 'facebook'])
        
        print(f"🔑 Session ID: {session_id}")
        print(f"🖼️ Image URL: {image_url}")
        print(f"📱 Platforms: {selected_platforms}")
        
        if not session_id:
            print("❌ Missing session_id")
            return jsonify({'error': 'session_id required'}), 400
        
        user = get_current_user()
        if not user:
            print("❌ User not authenticated")
            return jsonify({'error': 'Not authenticated'}), 401
        
        print(f"👤 User ID: {user.id}")
        
        conversation = Conversation.query.filter_by(session_id=session_id, user_id=user.id).first()
        
        if not conversation:
            print("❌ Conversation not found")
            return jsonify({'error': 'Conversation not found'}), 404
        
        if not conversation.is_complete:
            print(f"❌ Conversation not complete. Current step: {conversation.current_step}")
            return jsonify({
                'error': 'Conversation must be completed first',
                'current_step': conversation.current_step
            }), 400
        
        print("✅ Conversation found and complete")
        
        # Parse collected info
        try:
            collected_info = json.loads(conversation.collected_info)
            print(f"✅ Collected Info: {collected_info}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON Decode Error: {str(e)}")
            return jsonify({
                'error': 'Invalid conversation data',
                'details': str(e)
            }), 500
        
        # Validate required fields
        required_fields = ['craft_type', 'product_name']
        missing_fields = [f for f in required_fields if f not in collected_info]
        
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
            return jsonify({
                'error': 'Incomplete product information',
                'missing_fields': missing_fields
            }), 400
        
        print("✅ All required fields present")
        
        # Build product details
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
            english_value = info_entry.get('english', 'Not provided')
            product_details_list.append(f"**{field_title}**: {english_value}")
        
        product_text = "\n".join(product_details_list)
        print(f"📄 Product Text:\n{product_text}")
        
        # Load image if provided
        image_part = None
        image_base64 = None
        if image_url:
            try:
                print(f"🖼️ Loading image from: {image_url}")
                image_filename = os.path.basename(image_url)
                
                # Check if it's an enhanced image
                if 'enhanced_images' in image_url:
                    image_filepath = os.path.join(app.config['ENHANCED_IMAGES_FOLDER'], image_filename)
                else:
                    image_filepath = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                
                if os.path.exists(image_filepath):
                    print(f"✅ Image found locally: {image_filepath}")
                    image_part = Image.open(image_filepath)
                    
                    # Convert to base64 for API
                    buffered = io.BytesIO()
                    image_part.save(buffered, format="PNG")
                    image_base64 = base64.b64encode(buffered.getvalue()).decode()
                else:
                    print(f"⚠️ Image not found locally, fetching from URL")
                    image_response = requests.get(image_url, stream=True, timeout=10)
                    if image_response.status_code == 200:
                        image_part = Image.open(io.BytesIO(image_response.content))
                        
                        # Convert to base64 for API
                        buffered = io.BytesIO()
                        image_part.save(buffered, format="PNG")
                        image_base64 = base64.b64encode(buffered.getvalue()).decode()
                        print("✅ Image loaded from URL")
                    else:
                        print(f"❌ Failed to fetch image: {image_response.status_code}")
            except Exception as e:
                print(f"⚠️ Error loading image: {str(e)}")
                traceback.print_exc()
                # Continue without image
        
        platform_content = {}
        
        print(f"🎨 Generating content for {len(selected_platforms)} platforms...")
        
        for platform_id in selected_platforms:
            platform = next((p for p in PLATFORMS if p['id'] == platform_id), None)
            if not platform:
                print(f"⚠️ Platform not found: {platform_id}")
                continue
            
            print(f"📝 Generating for {platform['name']}...")
            
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
                from groq import Groq
                
                groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
                
                print(f"🚀 Generating content for {platform['name']} using Groq...")
                
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert social media content creator specializing in handcrafted artisan products. Create engaging, authentic posts that highlight craftsmanship and connect with audiences."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=1024,
                    temperature=0.7,
                    top_p=1
                )
                
                generated_text = response.choices[0].message.content
                
                platform_content[platform_id] = {
                    'platform': platform['name'],
                    'content': generated_text.strip(),
                    'char_limit': platform['char_limit'],
                    'format_type': platform['best_for']
                }
                print(f"✅ Content generated successfully for {platform['name']}")
                
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error generating for {platform['name']}: {error_msg}")
                traceback.print_exc()
                platform_content[platform_id] = {
                    'platform': platform['name'],
                    'content': f'Error generating content: {error_msg}',
                    'char_limit': platform['char_limit'],
                    'format_type': platform['best_for'],
                    'error': True
                }

        print("=" * 60)
        print("✅ CONTENT GENERATION COMPLETE")
        print(f"📊 Generated for {len(platform_content)} platforms")
        print("=" * 60)

        return jsonify({
            'success': True,
            'platforms': selected_platforms,
            'content': platform_content,
            'model_used': 'llama-3.3-70b-versatile (Groq)'
        }), 200

    except Exception as e:
        print("=" * 60)
        print("❌ FATAL ERROR IN GENERATE:")
        print(traceback.format_exc())
        print("=" * 60)
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Route not found'}), 404


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ==================== STARTUP ====================

if __name__ == '__main__':
    print("=" * 50)
    print("✓ Running in development mode")
    print("=" * 50)
    
    # Get port from environment variable
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Server starting on port {port}")
    
    # For development
    app.run(debug=True, host='0.0.0.0', port=port)