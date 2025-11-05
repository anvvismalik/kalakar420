"""
Debug script to test authentication issue
Run this in your backend directory: python debug_auth.py
"""
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Minimal Flask setup
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# User model (same as in your app.py)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def test_auth():
    with app.app_context():
        print("="*60)
        print("AUTHENTICATION DEBUG TEST")
        print("="*60)
        
        # Test 1: Check current users in database
        print("\n1. Current users in database:")
        all_users = User.query.all()
        if all_users:
            for user in all_users:
                print(f"   - Email: {user.email}, Username: {user.username}")
        else:
            print("   - No users found")
        
        # Test 2: Try to find non-existent user
        print("\n2. Testing login for non-existent user:")
        test_email = "nonexistent@test.com"
        user = User.query.filter_by(email=test_email).first()
        print(f"   - Query result for '{test_email}': {user}")
        print(f"   - Type: {type(user)}")
        print(f"   - Is None? {user is None}")
        print(f"   - Bool value: {bool(user)}")
        
        if not user:
            print("   ✓ CORRECT: User not found (this should happen)")
        else:
            print("   ✗ ERROR: User was found (shouldn't happen!)")
        
        # Test 3: Create a test user
        print("\n3. Creating test user:")
        existing = User.query.filter_by(email="debug@test.com").first()
        if existing:
            db.session.delete(existing)
            db.session.commit()
            print("   - Deleted existing debug user")
        
        test_user = User(
            username="debuguser",
            email="debug@test.com"
        )
        test_user.set_password("correct_password")
        db.session.add(test_user)
        db.session.commit()
        print("   ✓ Test user created: debug@test.com / correct_password")
        
        # Test 4: Test correct password
        print("\n4. Testing correct password:")
        user = User.query.filter_by(email="debug@test.com").first()
        if user:
            result = user.check_password("correct_password")
            print(f"   - Password check result: {result}")
            if result:
                print("   ✓ CORRECT: Password matched")
            else:
                print("   ✗ ERROR: Password should have matched")
        
        # Test 5: Test wrong password
        print("\n5. Testing wrong password:")
        if user:
            result = user.check_password("wrong_password")
            print(f"   - Password check result: {result}")
            if not result:
                print("   ✓ CORRECT: Password rejected")
            else:
                print("   ✗ ERROR: Wrong password was accepted!")
        
        # Test 6: Simulate login flow
        print("\n6. Simulating full login flow:")
        
        # Case A: Non-existent user
        print("   Case A: Non-existent user")
        email = "nonexistent@example.com"
        password = "anypassword"
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"   ✓ Step 1 passed: User '{email}' not found")
            print("   → Should return 401 error")
        else:
            print(f"   ✗ Step 1 FAILED: User '{email}' was found!")
        
        # Case B: Existing user, wrong password
        print("\n   Case B: Existing user, wrong password")
        email = "debug@test.com"
        password = "wrongpassword"
        user = User.query.filter_by(email=email).first()
        
        if user:
            print(f"   ✓ Step 1 passed: User '{email}' found")
            if not user.check_password(password):
                print("   ✓ Step 2 passed: Wrong password rejected")
                print("   → Should return 401 error")
            else:
                print("   ✗ Step 2 FAILED: Wrong password accepted!")
        
        # Case C: Existing user, correct password
        print("\n   Case C: Existing user, correct password")
        email = "debug@test.com"
        password = "correct_password"
        user = User.query.filter_by(email=email).first()
        
        if user:
            print(f"   ✓ Step 1 passed: User '{email}' found")
            if user.check_password(password):
                print("   ✓ Step 2 passed: Correct password accepted")
                print("   → Should return 200 success")
            else:
                print("   ✗ Step 2 FAILED: Correct password rejected!")
        
        print("\n" + "="*60)
        print("TEST COMPLETE")
        print("="*60)

if __name__ == '__main__':
    # Check if database exists
    if not os.path.exists('db.sqlite'):
        print("Creating database...")
        with app.app_context():
            db.create_all()
    
    test_auth()