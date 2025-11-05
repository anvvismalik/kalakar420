# validators.py
# Create this file in the same directory as app.py

import re

class AuthValidator:
    """Validation utilities for authentication"""
    
    ALLOWED_EMAIL_DOMAINS = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
        'icloud.com', 'protonmail.com', 'aol.com', 'zoho.com',
        'live.com', 'msn.com', 'ymail.com'
    ]
    
    PASSWORD_MIN_LENGTH = 6
    
    @staticmethod
    def validate_email(email):
        """Validate email format and domain"""
        if not email:
            return False, "Email is required"
        
        # Basic format check
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return False, "Invalid email format"
        
        # Check domain
        domain = email.split('@')[1].lower() if '@' in email else ''
        if domain not in AuthValidator.ALLOWED_EMAIL_DOMAINS:
            return False, f"Only emails from trusted providers are allowed (Gmail, Hotmail, Outlook, Yahoo, etc.)"
        
        return True, None
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if not password:
            return False, "Password is required"
        
        if len(password) < AuthValidator.PASSWORD_MIN_LENGTH:
            return False, f"Password must be at least {AuthValidator.PASSWORD_MIN_LENGTH} characters long"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'[0-9]', password):
            return False, "Password must contain at least one number"
        
        return True, None
    
    @staticmethod
    def validate_name(name):
        """Validate name format"""
        if not name or not name.strip():
            return False, "Name is required"
        
        if len(name.strip()) < 2:
            return False, "Name must be at least 2 characters long"
        
        # Allow letters, spaces, hyphens, apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", name):
            return False, "Name can only contain letters, spaces, hyphens, and apostrophes"
        
        return True, None
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number"""
        if not phone or not phone.strip():
            return False, "Phone number is required"
        
        # Remove common formatting characters
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Check if it's 10-15 digits, optionally starting with +
        if not re.match(r'^\+?\d{10,15}$', cleaned):
            return False, "Please enter a valid phone number (10-15 digits)"
        
        return True, None