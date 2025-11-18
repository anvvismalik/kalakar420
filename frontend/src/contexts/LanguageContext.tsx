// frontend/src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'pa' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.signin': 'Sign In',
    'nav.signIn': 'Sign In',
    'nav.signup': 'Get Started',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    'nav.studio': 'Studio',
    
    // Landing Page
    'landing.tagline': 'AI-Powered Content Creation for Artisans',
    'landing.title1': 'Transform Your',
    'landing.title2': 'Punjabi Descriptions',
    'landing.title3': 'Into Professional',
    'landing.title4': 'English Content',
    'landing.description': 'Kalakaar AI empowers local artisans to create compelling social media content by translating their Punjabi product descriptions into professional English with engaging captions and optimized posts.',
    'landing.startCreating': 'Start Creating',
    
    // Badge texts
    'badge.platform': 'NEW Platform',
    'badge.free': 'FREE To Start',
    'badge.powered': 'AI Powered',
    
    // Home Page
    'home.tagline': 'AI-Powered Content Creation for Artisans',
    'home.hero.title1': 'Transform Your',
    'home.hero.punjabi': 'Punjabi Descriptions',
    'home.hero.title2': 'Into Professional',
    'home.hero.english': 'English Content',
    'home.hero.description': 'Kalakaar AI empowers local artisans to create compelling social media content by translating their Punjabi product descriptions into professional English with engaging captions and optimized posts.',
    'home.cta.create': 'Start Creating',
    'home.cta.signin': 'Sign In',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to',
    'dashboard.tagline': 'Transform Your Artisan Business',
    'dashboard.description': 'Empowering local artisans to create compelling social media content by translating Punjabi product descriptions into professional English with engaging captions and optimized posts.',
    'dashboard.cta.free': 'Start Creating Free',
    
    // Features
    'features.ai.title': 'AI-Powered Translation',
    'features.ai.desc': 'Advanced AI translates your Punjabi descriptions into perfect, professional English instantly',
    'features.multilang.title': 'Multi-Language Support',
    'features.multilang.desc': 'Seamlessly work with Punjabi and English, bridging the language gap for your business',
    'features.social.title': 'Social Media Optimization',
    'features.social.desc': 'Generate engaging captions and posts optimized for maximum reach and engagement',
    
    // How It Works
    'howitworks.title': 'How It Works',
    'howitworks.subtitle': 'Three simple steps to transform your product descriptions into professional content',
    'howitworks.step1.title': 'Record Audio',
    'howitworks.step1.desc': 'Describe your product in Punjabi using voice recording. Speak naturally and clearly.',
    'howitworks.step2.title': 'Add Photo',
    'howitworks.step2.desc': 'Upload a product photo to enhance your social media posts (optional).',
    'howitworks.step3.title': 'Generate Content',
    'howitworks.step3.desc': 'Get professional English content with engaging captions ready to share.',
    
    // Studio
    'studio.title': 'Content Creation Studio',
    'studio.tagline': 'Advanced AI translates to perfect English',
    // 'studio.hero.title': 'Create Your Content',
    // 'studio.hero.subtitle': 'Transform your Punjabi product descriptions into professional English content in three simple steps',
    // 'studio.step1.title': 'Step 1: AI Conversation',
    // 'studio.step1.desc': 'Describe your product in Punjabi. Speak naturally and clearly.',
    // 'studio.step2.title': 'Step 2: Select Platforms',
    // 'studio.step2.desc': 'Choose where you want to post.',
    // 'studio.step3.title': 'Step 3: Upload & Generate',
    // 'studio.step3.desc': 'Add product photo and create content.',
    'studio.recording': 'Recording in progress...',
    'studio.clicktostart': 'Click "Start Conversation" to begin.',
    'studio.startConversation': 'Start Conversation',
    'studio.aiSpeaking': 'AI Speaking...',
    'studio.startTalking': 'Start Talking',
    'studio.stoprecording': 'Stop Recording',
    'studio.replayQuestion': 'Replay Question',
    'studio.selected': 'selected',
    'studio.uploading': 'Uploading...',
    'studio.generating': 'Generating...',
    'studio.generateContent': 'Generate Content',
    'studio.imageUploaded': 'Image uploaded!',
    'studio.generatedContent': 'Your Generated Content',
    'studio.contentGeneratedFor': 'Content generated for',
    'studio.platforms': 'platform(s)',
    'studio.max': 'Max',
    'studio.chars': 'chars',
    'studio.copyContent': 'Copy Content',
    'studio.createAnotherProduct': 'Create Another Product',
    'studio.conversationProgress': 'Conversation Progress',
    
    // 🛠️ STUDIO VISUALS KEYS
    'studio.generateVisuals': 'Generate Visual Mockups/Concepts',
    'studio.generatingVisuals': 'Generating Mockups...',
    'studio.mustCompleteConversation': 'Please complete the AI Conversation first.',
    'studio.visualGenerationFailed': 'Visual generation failed.',
    'studio.visualsSuccess': 'Successfully generated product mockups!',
    'studio.visualsNoImages': 'Mockup generation returned no images.',
    'studio.mustUploadImage': 'Please upload an image first.',
    'studio.mustSelectPlatform': 'Please select at least one platform.',
    'studio.imageUploadFailed': 'Image upload failed.',
    'studio.contentGenerationFailed': 'Content generation failed.',
    'studio.contentGenerationSuccess': 'Social media content successfully generated!',
    
    // Shared
    'nav.backToHome': 'Back to Home',
    'OR': 'OR',
    'artisans': 'Artisans',
    'content': 'Content',
    'free': 'Free',
    'Debug Info': 'Debug Info', // Added debug info key

    // Platform Keys (Used in Studio.tsx)
    'platform.instagram.name': 'Instagram',
    'platform.instagram.description': 'Visual storytelling with images',
    'platform.facebook.name': 'Facebook',
    'platform.facebook.description': 'Community engagement and detailed posts',
    'platform.twitter.name': 'Twitter/X',
    'platform.twitter.description': 'Short, punchy updates',
    'platform.linkedin.name': 'LinkedIn',
    'platform.linkedin.description': 'Professional networking',
    'platform.marketplace.name': 'Amazon/Flipkart Marketplace',
    'platform.marketplace.description': 'Product Listings',

    // Sign In
    'signin.welcomeBack': 'Welcome Back',
    'signin.title': 'Sign In',
    'signin.description': 'Enter your credentials to access your account',
    'signin.email': 'Email Address',
    'signin.password': 'Password',
    'signin.rememberMe': 'Remember me',
    'signin.forgotPassword': 'Forgot Password?',
    'signin.noAccount': "Don't have an account?",
    'signin.signUpHere': 'Sign up here',
    'signin.signingIn': 'Signing in...',

    // DEFINITIONS FOR SIGN IN LABELS/PLACEHOLDERS
    'signin.enterEmailPlaceholder': 'Enter your email address',
    'signin.enterPasswordPlaceholder': 'Enter your password',

    // Sign Up
    'signup.joinCommunity': 'Join the Artisan Community',
    'signup.title': 'Create Account',
    'signup.description': 'Enter your details to create your Kalakaar AI account.',
    'signup.enterFirstName': 'First Name',
    'signup.enterLastName': 'Last Name',
    'signup.enterPhone': 'Phone Number',
    'signup.enterLocation': 'Location',
    'signup.craftType': 'Type of Craft',
    'signup.createAccount': 'Create Account',
    'signup.alreadyHaveAccount': 'Already have an account?',
    'signup.signInHere': 'Sign in here',
    'signup.startJourney': 'Start Your Journey',
    'signup.journeyDescription': 'Unlock powerful AI tools to showcase your unique craftsmanship to the world.',
    'signup.freeContent': 'AI-powered content generation',
    'signup.multiLanguage': 'Multi-language support',
    'signup.socialOptimization': 'Social media optimization',
    'signup.communitySupport': 'Community support',
    'signup.creating': 'Creating...',

    'signup.firstName': 'First Name',
    'signup.lastName': 'Last Name',
    'signup.phone': 'Phone Number',
    'signup.location': 'Location',
    'signup.email': 'Email Address',
    

    // DEFINITIONS FOR SIGN UP LABELS/PLACEHOLDERS
    'signup.enterEmail': 'Email Address',
    'signup.password': 'Password',
    'signup.confirmPassword': 'Confirm Password',
    'signup.enterFirstNamePlaceholder': 'Enter your first name',
    'signup.enterLastNamePlaceholder': 'Enter your last name',
    'signup.enterEmailPlaceholder': 'Enter your email',
    'signup.enterPhonePlaceholder': 'Enter your phone number',
    'signup.enterLocationPlaceholder': 'Enter your location/city',
    'signup.createPassword': 'Create a password (min 6 chars)',
    'signup.confirmPasswordPlaceholder': 'Confirm your password',
    'signup.selectCraft': 'Select your craft',
    'studio.header.title': 'Kalakaar AI',
  'studio.header.subtitle': 'Content Creation Studio',
  'studio.header.backHome': 'Back to Home',
  
  // Studio Page - Hero
  'studio.hero.badge': 'AI-Powered Studio',
  'studio.hero.title': 'Create Your Content',
  'studio.hero.subtitle': 'Transform your Punjabi product descriptions into professional English content in three simple steps',
  
  // Studio Page - Steps
  'studio.step1.title': 'Step 1: AI Conversation',
  'studio.step1.desc': 'Describe your product in Punjabi',
  'studio.step1.ready': 'Ready to start your conversation',
  'studio.step1.aiSpeaking': 'AI Speaking...',
  'studio.processing': 'Processing...',
  'studio.step1.recording': 'Recording...',
  'studio.step1.startConversation': 'Start Conversation',
  'studio.step1.stopRecording': 'Stop Recording',
  'studio.step1.startTalking': 'Start Talking',
  'studio.step1.replayQuestion': 'Replay Question',
  
  'studio.step2.title': 'Step 2: Select Platforms',
  'studio.step2.desc': 'Choose where you want to post',
  'studio.step2.selected': 'selected',
  
  'studio.step3.title': 'Step 3: Upload & Generate',
  'studio.step3.desc': 'Add product photo and create content',
  'studio.step3.selectedFile': 'Selected',
  'studio.step3.imageUploaded': 'Image uploaded!',
  'studio.step3.uploading': 'Uploading...',
  'studio.step3.generating': 'Generating...',
  'studio.step3.generateContent': 'Generate Content',
  
  // Progress
  'studio.progress.title': 'Conversation Progress',
  
  // Image Enhancement
  'studio.enhance.title': 'Optional: Enhance Image',
  'studio.enhance.desc': 'Remove background and add professional studio setting (uses 1 Clipdrop credit)',
  'studio.enhance.button': 'Enhance with AI',
  'studio.enhance.enhancing': 'Enhancing...',
  'studio.enhance.ready': 'Enhanced Image Ready',
  'studio.enhance.applied': 'Professional background applied • Use this for your posts',
  
  // Generated Content
  'studio.generated.title': 'Your Generated Content',
  'studio.generated.desc': 'Content generated for',
  'studio.generated.platforms': 'platform(s)',
  'studio.generated.maxChars': 'Max',
  'studio.generated.chars': 'chars',
  'studio.generated.copy': 'Copy Content',
  'studio.generated.share': 'Share',
  'studio.generated.createAnother': 'Create Another Product',
  
  // Errors & Messages
  'studio.error.uploadFirst': 'Please upload an image first',
  'studio.error.selectPlatform': 'Please select at least one platform',
  'studio.error.startFirst': 'Click "Start Conversation" to begin.',
   'studio.question.cost': 'What is the price or cost of this product?',
'studio.question.timeTaken': 'How much time did it take you to create this product?',
'studio.field.cost': 'Price/Cost',
'studio.field.timeTaken': 'Time to Create',
  },
  pa: {
    // Navigation
    'nav.signin': 'ਸਾਈਨ ਇਨ',
    'nav.signIn': 'ਸਾਈਨ ਇਨ',
    'nav.signup': 'ਸ਼ੁਰੂ ਕਰੋ',
    'nav.logout': 'ਲੌਗਆਊਟ',
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.studio': 'ਸਟੂਡੀਓ',
    
    // Landing Page
    'landing.tagline': 'ਕਾਰੀਗਰਾਂ ਲਈ AI-ਸੰਚਾਲਿਤ ਸਮੱਗਰੀ ਨਿਰਮਾਣ',
    'landing.title1': 'ਆਪਣੇ',
    'landing.title2': 'ਪੰਜਾਬੀ ਵਰਣਨਾਂ',
    'landing.title3': 'ਨੂੰ ਪੇਸ਼ੇਵਰ',
    'landing.title4': 'ਅੰਗਰੇਜ਼ੀ ਸਮੱਗਰੀ ਵਿੱਚ ਬਦਲੋ',
    'landing.description': 'ਕਲਾਕਾਰ AI ਸਥਾਨਕ ਕਾਰੀਗਰਾਂ ਨੂੰ ਉਨ੍ਹਾਂ ਦੇ ਪੰਜਾਬੀ ਉਤਪਾਦ ਵਰਣਨਾਂ ਨੂੰ ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰਕੇ ਦਿਲਚਸਪ ਸੋਸ਼ਲ ਮੀਡੀਆ ਸਮੱਗਰੀ ਬਣਾਉਣ ਦੀ ਸ਼ਕਤੀ ਦਿੰਦਾ ਹੈ।',
    'landing.startCreating': 'ਬਣਾਉਣਾ ਸ਼ੁਰੂ ਕਰੋ',
    
    // Badge texts
    'badge.platform': 'ਨਵਾਂ ਪਲੇਟਫਾਰਮ',
    'badge.free': 'ਮੁਫ਼ਤ ਸ਼ੁਰੂਆਤ',
    'badge.powered': 'AI ਸੰਚਾਲਿਤ',
    
    // Home Page
    'home.tagline': 'ਕਾਰੀਗਰਾਂ ਲਈ AI-ਸੰਚਾਲਿਤ ਸਮੱਗਰੀ ਨਿਰਮਾਣ',
    'home.hero.title1': 'ਆਪਣੇ',
    'home.hero.punjabi': 'ਪੰਜਾਬੀ ਵਰਣਨਾਂ',
    'home.hero.title2': 'ਨੂੰ ਪੇਸ਼ੇਵਰ',
    'home.hero.english': 'ਅੰਗਰੇਜ਼ੀ ਸਮੱਗਰੀ',
    'home.hero.description': 'ਕਲਾਕਾਰ AI ਸਥਾਨਕ ਕਾਰੀਗਰਾਂ ਨੂੰ ਉਨ੍ਹਾਂ ਦੇ ਪੰਜਾਬੀ ਉਤਪਾਦ ਵਰਣਨਾਂ ਨੂੰ ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰਕੇ ਦਿਲਚਸਪ ਸੋਸ਼ਲ ਮੀਡੀਆ ਸਮੱਗਰੀ ਬਣਾਉਣ ਦੀ ਸ਼ਕਤੀ ਦਿੰਦਾ ਹੈ।',
    'home.cta.create': 'ਬਣਾਉਣਾ ਸ਼ੁਰੂ ਕਰੋ',
    'home.cta.signin': 'ਸਾਈਨ ਇਨ',
    
    // Dashboard
    'dashboard.welcome': 'ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ',
    'dashboard.tagline': 'ਆਪਣੇ ਕਾਰੀਗਰ ਕਾਰੋਬਾਰ ਨੂੰ ਬਦਲੋ',
    'dashboard.description': 'ਸਥਾਨਕ ਕਾਰੀਗਰਾਂ ਨੂੰ ਪੰਜਾਬੀ ਉਤਪਾਦ ਵਰਣਨਾਂ ਨੂੰ ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰਕੇ ਦਿਲਚਸਪ ਸੋਸ਼ਲ ਮੀਡੀਆ ਸਮੱਗਰੀ ਬਣਾਉਣ ਦੀ ਸ਼ਕਤੀ ਦੇਣਾ।',
    'dashboard.cta.free': 'ਮੁਫ਼ਤ ਬਣਾਉਣਾ ਸ਼ੁਰੂ ਕਰੋ',
    
    // Features
    'features.ai.title': 'AI-ਸੰਚਾਲਿਤ ਅਨੁਵਾਦ',
    'features.ai.desc': 'ਉੱਨਤ AI ਤੁਹਾਡੇ ਪੰਜਾਬੀ ਵਰਣਨਾਂ ਨੂੰ ਤੁਰੰਤ ਸੰਪੂਰਨ, ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰਦਾ ਹੈ',
    'features.multilang.title': 'ਬਹੁ-ਭਾਸ਼ਾ ਸਹਾਇਤਾ',
    'features.multilang.desc': 'ਪੰਜਾਬੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਨਾਲ ਆਸਾਨੀ ਨਾਲ ਕੰਮ ਕਰੋ, ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਲਈ ਭਾਸ਼ਾ ਦੇ ਪਾੜੇ ਨੂੰ ਪੂਰਾ ਕਰੋ',
    'features.social.title': 'ਸੋਸ਼ਲ ਮੀਡੀਆ ਅਨੁਕੂਲਨ',
    'features.social.desc': 'ਵੱਧ ਤੋਂ ਵੱਧ ਪਹੁੰਚ ਅਤੇ ਸ਼ਮੂਲੀਅਤ ਲਈ ਅਨੁਕੂਲਿਤ ਦਿਲਚਸਪ ਕੈਪਸ਼ਨ ਅਤੇ ਪੋਸਟਾਂ ਬਣਾਓ',
    
    // How It Works
    'howitworks.title': 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    'howitworks.subtitle': 'ਤੁਹਾਡੇ ਉਤਪਾਦ ਵਰਣਨਾਂ ਨੂੰ ਪੇਸ਼ੇਵਰ ਸਮੱਗਰੀ ਵਿੱਚ ਬਦਲਣ ਲਈ ਤਿੰਨ ਸਧਾਰਨ ਕਦਮ',
    'howitworks.step1.title': 'ਆਡੀਓ ਰਿਕਾਰਡ ਕਰੋ',
    'howitworks.step1.desc': 'ਆਵਾਜ਼ ਰਿਕਾਰਡਿੰਗ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਆਪਣੇ ਉਤਪਾਦ ਦਾ ਵਰਣਨ ਕਰੋ। ਸੁਭਾਵਿਕ ਅਤੇ ਸਪੱਸ਼ਟ ਬੋਲੋ।',
    'howitworks.step2.title': 'ਫੋਟੋ ਸ਼ਾਮਲ ਕਰੋ',
    'howitworks.step2.desc': 'ਆਪਣੀਆਂ ਸੋਸ਼ਲ ਮੀਡੀਆ ਪੋਸਟਾਂ ਨੂੰ ਵਧਾਉਣ ਲਈ ਉਤਪਾਦ ਦੀ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ (ਵਿਕਲਪਿਕ)।',
    'howitworks.step3.title': 'ਸਮੱਗਰੀ ਬਣਾਓ',
    'howitworks.step3.desc': 'ਸਾਂਝਾ ਕਰਨ ਲਈ ਤਿਆਰ ਦਿਲਚਸਪ ਕੈਪਸ਼ਨਾਂ ਦੇ ਨਾਲ ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਸਮੱਗਰੀ ਪ੍ਰਾਪਤ ਕਰੋ।',
    
    // Studio
    'studio.title': 'ਸਮੱਗਰੀ ਨਿਰਮਾਣ ਸਟੂਡੀਓ',
    'studio.tagline': 'ਉੱਨਤ AI ਸੰਪੂਰਨ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰਦਾ ਹੈ',
    // 'studio.hero.title': 'ਆਪਣੀ ਸਮੱਗਰੀ ਬਣਾਓ',
    // 'studio.hero.subtitle': 'ਤਿੰਨ ਸਧਾਰਨ ਕਦਮਾਂ ਵਿੱਚ ਆਪਣੇ ਪੰਜਾਬੀ ਉਤਪਾਦ ਵਰਣਨਾਂ ਨੂੰ ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਸਮੱਗਰੀ ਵਿੱਚ ਬਦਲੋ',
    // 'studio.step1.title': 'ਕਦਮ 1: AI ਗੱਲਬਾਤ',
    // 'studio.step1.desc': 'ਪੰਜਾਬੀ ਵਿੱਚ ਆਪਣੇ ਉਤਪਾਦ ਦਾ ਵਰਣਨ ਕਰੋ। ਸੁਭਾਵਿਕ ਅਤੇ ਸਪੱਸ਼ਟ ਬੋਲੋ।',
    // 'studio.step2.title': 'ਕਦਮ 2: ਪਲੇਟਫਾਰਮ ਚੁਣੋ',
    // 'studio.step2.desc': 'ਸੋਸ਼ਲ ਮੀਡੀਆ ਪੋਸਟਾਂ ਲਈ ਆਪਣੇ ਉਤਪਾਦ ਦੀ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ (ਵਿਕਲਪਿਕ)।',
    // 'studio.step3.title': 'ਕਦਮ 3: ਅੱਪਲੋਡ ਅਤੇ ਬਣਾਓ',
    // 'studio.step3.desc': 'ਆਪਣੇ ਵਰਣਨ ਨੂੰ ਪੇਸ਼ੇਵਰ ਸੋਸ਼ਲ ਮੀਡੀਆ ਸਮੱਗਰੀ ਵਿੱਚ ਬਦਲੋ',
    'studio.recording': 'ਰਿਕਾਰਡਿੰਗ ਜਾਰੀ ਹੈ...',
    'studio.clicktostart': 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਕਲਿੱਕ ਕਰੋ।',
    'studio.startConversation': 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ',
    'studio.aiSpeaking': 'AI ਬੋਲ ਰਿਹਾ ਹੈ...',
    'studio.startTalking': 'ਬੋਲਣਾ ਸ਼ੁਰੂ ਕਰੋ',
    'studio.stoprecording': 'ਰਿਕਾਰਡਿੰਗ ਬੰਦ ਕਰੋ',
    'studio.replayQuestion': 'ਸਵਾਲ ਦੁਹਰਾਓ',
    'studio.selected': 'ਚੁਣਿਆ ਗਿਆ',
    'studio.uploading': 'ਅੱਪਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    'studio.generating': 'ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',
    'studio.generateContent': 'ਸਮੱਗਰੀ ਬਣਾਓ',
    'studio.imageUploaded': 'ਤਸਵੀਰ ਅੱਪਲੋਡ ਹੋ ਗਈ!',
    'studio.generatedContent': 'ਤੁਹਾਡੀ ਬਣਾਈ ਗਈ ਸਮੱਗਰੀ',
    'studio.contentGeneratedFor': 'ਲਈ ਸਮੱਗਰੀ ਬਣਾਈ ਗਈ',
    'studio.platforms': 'ਪਲੇਟਫਾਰਮ',
    'studio.max': 'ਅਧਿਕਤਮ',
    'studio.chars': 'ਅੱਖਰ',
    'studio.copyContent': 'ਸਮੱਗਰੀ ਕਾਪੀ ਕਰੋ',
    'studio.createAnotherProduct': 'ਇੱਕ ਹੋਰ ਉਤਪਾਦ ਬਣਾਓ',
    
    // 🛠️ STUDIO VISUALS KEYS
    'studio.generateVisuals': 'ਵਿਜ਼ੂਅਲ ਮੌਕਅੱਪ/ਸੰਕਲਪ ਬਣਾਓ',
    'studio.generatingVisuals': 'ਮੌਕਅੱਪ ਬਣਾਏ ਜਾ ਰਹੇ ਹਨ...',
    'studio.mustCompleteConversation': 'ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ AI ਗੱਲਬਾਤ ਪੂਰੀ ਕਰੋ।',
    'studio.visualGenerationFailed': 'ਵਿਜ਼ੂਅਲ ਜਨਰੇਸ਼ਨ ਅਸਫਲ ਰਿਹਾ।',
    'studio.visualsSuccess': 'ਉਤਪਾਦ ਮੌਕਅੱਪ ਸਫਲਤਾਪੂਰਵਕ ਬਣਾਏ ਗਏ!',
    'studio.visualsNoImages': 'ਮੌਕਅੱਪ ਜਨਰੇਸ਼ਨ ਨੇ ਕੋਈ ਚਿੱਤਰ ਵਾਪਸ ਨਹੀਂ ਕੀਤਾ।',
    'studio.mustUploadImage': 'ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਇੱਕ ਚਿੱਤਰ ਅੱਪਲੋਡ ਕਰੋ।',
    'studio.mustSelectPlatform': 'ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਪਲੇਟਫਾਰਮ ਚੁਣੋ।',
    'studio.imageUploadFailed': 'ਚਿੱਤਰ ਅੱਪਲੋਡ ਕਰਨਾ ਅਸਫਲ ਰਿਹਾ।',
    'studio.contentGenerationFailed': 'ਸਮੱਗਰੀ ਜਨਰੇਸ਼ਨ ਅਸਫਲ ਰਿਹਾ।',
    'studio.contentGenerationSuccess': 'ਸੋਸ਼ਲ ਮੀਡੀਆ ਸਮੱਗਰੀ ਸਫਲਤਾਪੂਰਵਕ ਬਣਾਈ ਗਈ!',
    
    // Shared
    'nav.backToHome': 'ਹੋਮ ਤੇ ਵਾਪਸ',
    'OR': 'ਜਾਂ',
    'artisans': 'ਕਾਰੀਗਰ',
    'content': 'ਸਮੱਗਰੀ',
    'free': 'ਮੁਫ਼ਤ',
    'Debug Info': 'ਡੀਬੱਗ ਜਾਣਕਾਰੀ',

    // Platform Keys (Used in Studio.tsx)
    'platform.instagram.name': 'ਇੰਸਟਾਗ੍ਰਾਮ',
    'platform.instagram.description': 'ਤਸਵੀਰਾਂ ਨਾਲ ਵਿਜ਼ੂਅਲ ਕਹਾਣੀ ਸੁਣਾਉਣਾ',
    'platform.facebook.name': 'ਫੇਸਬੁੱਕ',
    'platform.facebook.description': 'ਕਮਿਊਨਿਟੀ ਸ਼ਮੂਲੀਅਤ ਅਤੇ ਵਿਸਤ੍ਰਿਤ ਪੋਸਟਾਂ',
    'platform.twitter.name': 'ਟਵਿੱਟਰ/X',
    'platform.twitter.description': 'ਛੋਟੇ, ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਅੱਪਡੇਟ',
    'platform.linkedin.name': 'ਲਿੰਕਡਇਨ',
    'platform.linkedin.description': 'ਪੇਸ਼ੇਵਰ ਨੈੱਟਵਰਕਿੰਗ',
    'platform.marketplace.name': 'ਐਮਾਜ਼ਾਨ/ਫਲਿੱਪਕਾਰਟ ਮਾਰਕੀਟਪਲੇਸ',
    'platform.marketplace.description': 'ਉਤਪਾਦ ਸੂਚੀਆਂ',

    // Sign In
    'signin.welcomeBack': 'ਵਾਪਸ ਆਇਆ ਨੂੰ',
    'signin.title': 'ਸਾਈਨ ਇਨ',
    'signin.description': 'ਆਪਣੇ ਖਾਤੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਆਪਣੀਆਂ ਪ੍ਰਮਾਣ ਪੱਤਰ ਦਰਜ ਕਰੋ',
    'signin.email': 'ਈਮੇਲ ਪਤਾ',
    'signin.password': 'ਪਾਸਵਰਡ',
    'signin.rememberMe': 'ਮੈਨੂੰ ਯਾਦ ਰੱਖੋ',
    'signin.forgotPassword': 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?',
    'signin.noAccount': 'ਕੋਈ ਖਾਤਾ ਨਹੀਂ ਹੈ?',
    'signin.signUpHere': 'ਇੱਥੇ ਸਾਈਨ ਅੱਪ ਕਰੋ',
    'signin.signingIn': 'ਸਾਈਨ ਇਨ ਹੋ ਰਿਹਾ ਹੈ...',

    // DEFINITIONS FOR SIGN IN LABELS/PLACEHOLDERS
    'signin.enterEmailPlaceholder': 'ਆਪਣਾ ਈਮੇਲ ਪਤਾ ਦਰਜ ਕਰੋ',
    'signin.enterPasswordPlaceholder': 'ਆਪਣਾ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ',

    // Sign Up
    'signup.joinCommunity': 'ਕਾਰੀਗਰ ਭਾਈਚਾਰੇ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ',
    'signup.title': 'ਖਾਤਾ ਬਣਾਓ',
    'signup.description': 'ਆਪਣਾ Kalakaar AI ਖਾਤਾ ਬਣਾਉਣ ਲਈ ਆਪਣਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ।',
    'signup.enterFirstName': 'ਪਹਿਲਾ ਨਾਮ',
    'signup.enterLastName': 'ਆਖਰੀ ਨਾਮ',
    'signup.enterPhone': 'ਫ਼ੋਨ ਨੰਬਰ',
    'signup.enterLocation': 'ਸਥਾਨ',
    'signup.craftType': 'ਦਸਤਕਾਰੀ ਦੀ ਕਿਸਮ',
    'signup.createAccount': 'ਖਾਤਾ ਬਣਾਓ',
    'signup.alreadyHaveAccount': 'ਕੀ ਤੁਹਾਡਾ ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ?',
    'signup.signInHere': 'ਇੱਥੇ ਸਾਈਨ ਇਨ ਕਰੋ',
    'signup.startJourney': 'ਆਪਣਾ ਸਫ਼ਰ ਸ਼ੁਰੂ ਕਰੋ',
    'signup.journeyDescription': 'ਦੁਨੀਆ ਨੂੰ ਆਪਣੀ ਵਿਲੱਖਣ ਕਾਰੀਗਰੀ ਦਿਖਾਉਣ ਲਈ ਸ਼ਕਤੀਸ਼ਾਲੀ AI ਟੂਲਸ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।',
    'signup.freeContent': 'AI-ਸੰਚਾਲਿਤ ਸਮੱਗਰੀ ਨਿਰਮਾਣ',
    'signup.multiLanguage': 'ਬਹੁ-ਭਾਸ਼ਾ ਸਹਾਇਤਾ',
    'signup.socialOptimization': 'ਸੋਸ਼ਲ ਮੀਡੀਆ ਅਨੁਕੂਲਨ',
    'signup.communitySupport': 'ਭਾਈਚਾਰਕ ਸਹਾਇਤਾ',
    'signup.creating': 'ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',

    // DEFINITIONS FOR SIGN UP LABELS/PLACEHOLDERS
    'signup.enterEmail': 'ਈਮੇਲ ਪਤਾ',
    'signup.password': 'ਪਾਸਵਰਡ',
    'signup.confirmPassword': 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    'signup.enterFirstNamePlaceholder': 'ਆਪਣਾ ਪਹਿਲਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    'signup.enterLastNamePlaceholder': 'ਆਪਣਾ ਆਖਰੀ ਨਾਮ ਦਰਜ ਕਰੋ',
    'signup.enterEmailPlaceholder': 'ਆਪਣਾ ਈਮੇਲ ਦਰਜ ਕਰੋ',
    'signup.enterPhonePlaceholder': 'ਆਪਣਾ ਫ਼ੋਨ ਨੰਬਰ ਦਰਜ ਕਰੋ',
    'signup.enterLocationPlaceholder': 'ਆਪਣਾ ਸਥਾਨ/ਸ਼ਹਿਰ ਦਰਜ ਕਰੋ',
    'signup.createPassword': 'ਇੱਕ ਪਾਸਵਰਡ ਬਣਾਓ (ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰ)',
    'signup.confirmPasswordPlaceholder': 'ਆਪਣੇ ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    'signup.selectCraft': 'ਆਪਣੇ ਦਸਤਕਾਰੀ ਦੀ ਚੋਣ ਕਰੋ',

    
  "signup.firstName": "ਪਹਿਲਾ ਨਾਮ",
  "signup.lastName": "ਅੰਤਿਮ ਨਾਮ",
  "signup.phone": "ਫ਼ੋਨ ਨੰਬਰ",
  "signup.location": "ਸਥਿਤੀ",
  "signup.email": "ਈਮੇਲ ਪਤਾ",



    'studio.header.title': 'ਕਲਾਕਾਰ AI',
  'studio.header.subtitle': 'ਸਮੱਗਰੀ ਨਿਰਮਾਣ ਸਟੂਡੀਓ',
  'studio.header.backHome': 'ਹੋਮ ਤੇ ਵਾਪਸ',
  
  // Studio Page - Hero
  'studio.hero.badge': 'AI-ਸੰਚਾਲਿਤ ਸਟੂਡੀਓ',
  'studio.hero.title': 'ਆਪਣੀ ਸਮੱਗਰੀ ਬਣਾਓ',
  'studio.hero.subtitle': 'ਤਿੰਨ ਸਧਾਰਨ ਕਦਮਾਂ ਵਿੱਚ ਆਪਣੇ ਪੰਜਾਬੀ ਉਤਪਾਦ ਵਰਣਨਾਂ ਨੂੰ ਪੇਸ਼ੇਵਰ ਅੰਗਰੇਜ਼ੀ ਸਮੱਗਰੀ ਵਿੱਚ ਬਦਲੋ',
  
  // Studio Page - Steps
  'studio.step1.title': 'ਕਦਮ 1: AI ਗੱਲਬਾਤ',
  'studio.step1.desc': 'ਪੰਜਾਬੀ ਵਿੱਚ ਆਪਣੇ ਉਤਪਾਦ ਦਾ ਵਰਣਨ ਕਰੋ',
  'studio.step1.ready': 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ',
  'studio.step1.aiSpeaking': 'AI ਬੋਲ ਰਿਹਾ ਹੈ...',
  'studio.processing': 'ਪ੍ਰੋਸੈਸ ਹੋ ਰਿਹਾ ਹੈ...',
  'studio.step1.recording': 'ਰਿਕਾਰਡਿੰਗ ਜਾਰੀ ਹੈ...',
  'studio.step1.startConversation': 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ',
  'studio.step1.stopRecording': 'ਰਿਕਾਰਡਿੰਗ ਬੰਦ ਕਰੋ',
  'studio.step1.startTalking': 'ਬੋਲਣਾ ਸ਼ੁਰੂ ਕਰੋ',
  'studio.step1.replayQuestion': 'ਸਵਾਲ ਦੁਹਰਾਓ',
  
  'studio.step2.title': 'ਕਦਮ 2: ਪਲੇਟਫਾਰਮ ਚੁਣੋ',
  'studio.step2.desc': 'ਚੁਣੋ ਕਿ ਤੁਸੀਂ ਕਿੱਥੇ ਪੋਸਟ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ',
  'studio.step2.selected': 'ਚੁਣਿਆ ਗਿਆ',
  
  'studio.step3.title': 'ਕਦਮ 3: ਅੱਪਲੋਡ ਅਤੇ ਬਣਾਓ',
  'studio.step3.desc': 'ਉਤਪਾਦ ਦੀ ਫੋਟੋ ਸ਼ਾਮਲ ਕਰੋ ਅਤੇ ਸਮੱਗਰੀ ਬਣਾਓ',
  'studio.step3.selectedFile': 'ਚੁਣੀ ਗਈ',
  'studio.step3.imageUploaded': 'ਤਸਵੀਰ ਅੱਪਲੋਡ ਹੋ ਗਈ!',
  'studio.step3.uploading': 'ਅੱਪਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
  'studio.step3.generating': 'ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',
  'studio.step3.generateContent': 'ਸਮੱਗਰੀ ਬਣਾਓ',
  
  // Progress
  'studio.conversationProgress': 'ਗੱਲਬਾਤ ਦੀ ਪ੍ਰਗਤੀ',
  
  // Image Enhancement
  'studio.enhance.title': 'ਵਿਕਲਪਿਕ: ਤਸਵੀਰ ਨੂੰ ਬਿਹਤਰ ਬਣਾਓ',
  'studio.enhance.desc': 'ਬੈਕਗ੍ਰਾਉਂਡ ਹਟਾਓ ਅਤੇ ਪੇਸ਼ੇਵਰ ਸਟੂਡੀਓ ਸੈਟਿੰਗ ਸ਼ਾਮਲ ਕਰੋ (1 Clipdrop ਕ੍ਰੈਡਿਟ ਵਰਤਦਾ ਹੈ)',
  'studio.enhance.button': 'AI ਨਾਲ ਬਿਹਤਰ ਬਣਾਓ',
  'studio.enhance.enhancing': 'ਬਿਹਤਰ ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',
  'studio.enhance.ready': 'ਬਿਹਤਰ ਤਸਵੀਰ ਤਿਆਰ ਹੈ',
  'studio.enhance.applied': 'ਪੇਸ਼ੇਵਰ ਬੈਕਗ੍ਰਾਉਂਡ ਲਾਗੂ ਕੀਤਾ ਗਿਆ • ਆਪਣੀਆਂ ਪੋਸਟਾਂ ਲਈ ਇਸਦੀ ਵਰਤੋਂ ਕਰੋ',
  
  // Generated Content
  'studio.generated.title': 'ਤੁਹਾਡੀ ਬਣਾਈ ਗਈ ਸਮੱਗਰੀ',
  'studio.generated.desc': 'ਲਈ ਸਮੱਗਰੀ ਬਣਾਈ ਗਈ',
  'studio.generated.platforms': 'ਪਲੇਟਫਾਰਮ',
  'studio.generated.maxChars': 'ਅਧਿਕਤਮ',
  'studio.generated.chars': 'ਅੱਖਰ',
  'studio.generated.copy': 'ਸਮੱਗਰੀ ਕਾਪੀ ਕਰੋ',
  'studio.generated.share': 'ਸਾਂਝਾ ਕਰੋ',
  'studio.generated.createAnother': 'ਇੱਕ ਹੋਰ ਉਤਪਾਦ ਬਣਾਓ',
  
  // Errors & Messages
  'studio.error.uploadFirst': 'ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਇੱਕ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ',
  'studio.error.selectPlatform': 'ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਪਲੇਟਫਾਰਮ ਚੁਣੋ',
  'studio.error.startFirst': 'ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਨ ਲਈ "ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ" ਤੇ ਕਲਿੱਕ ਕਰੋ',
'studio.question.cost': 'ਇਸ ਉਤਪਾਦ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?',
'studio.question.timeTaken': 'ਇਸ ਉਤਪਾਦ ਨੂੰ ਬਣਾਉਣ ਵਿੱਚ ਤੁਹਾਨੂੰ ਕਿੰਨਾ ਸਮਾਂ ਲੱਗਾ?',
'studio.field.cost': 'ਕੀਮਤ',
'studio.field.timeTaken': 'ਬਣਾਉਣ ਵਿੱਚ ਸਮਾਂ',
  },
  hi: {
    // Navigation
    'nav.signin': 'साइन इन करें',
    'nav.signIn': 'साइन इन करें',
    'nav.signup': 'शुरू करें',
    'nav.logout': 'लॉगआउट',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.studio': 'स्टूडियो',
    
    // Landing Page
    'landing.tagline': 'कारीगरों के लिए AI-संचालित सामग्री निर्माण',
    'landing.title1': 'अपने',
    'landing.title2': 'पंजाबी विवरण',
    'landing.title3': 'को पेशेवर',
    'landing.title4': 'अंग्रेजी सामग्री में बदलें',
    'landing.description': 'कलाकार AI स्थानीय कारीगरों को उनके पंजाबी उत्पाद विवरणों का पेशेवर अंग्रेजी में अनुवाद करके आकर्षक सोशल मीडिया सामग्री बनाने की शक्ति देता है।',
    'landing.startCreating': 'बनाना शुरू करें',
    
    // Badge texts
    'badge.platform': 'नया प्लेटफ़ॉर्म',
    'badge.free': 'मुफ्त शुरुआत',
    'badge.powered': 'AI संचालित',
    
    // Home Page
    'home.tagline': 'कारीगरों के लिए AI-संचालित सामग्री निर्माण',
    'home.hero.title1': 'अपने',
    'home.hero.punjabi': 'पंजाबी विवरण',
    'home.hero.title2': 'को पेशेवर',
    'home.hero.english': 'अंग्रेजी सामग्री में बदलें',
    'home.hero.description': 'कलाकार AI स्थानीय कारीगरों को उनके पंजाबी उत्पाद विवरणों का पेशेवर अंग्रेजी में अनुवाद करके आकर्षक सोशल मीडिया सामग्री बनाने की शक्ति देता है।',
    'home.cta.create': 'बनाना शुरू करें',
    'home.cta.signin': 'साइन इन करें',
    
    // Dashboard
    'dashboard.welcome': 'में आपका स्वागत है',
    'dashboard.tagline': 'अपने कारीगर व्यवसाय को बदलें',
    'dashboard.description': 'स्थानीय कारीगरों को पंजाबी उत्पाद विवरणों को पेशेवर अंग्रेजी में अनुवाद करके आकर्षक सोशल मीडिया सामग्री बनाने की शक्ति देना।',
    'dashboard.cta.free': 'मुफ्त में बनाना शुरू करें',
    
    // Features
    'features.ai.title': 'AI-संचालित अनुवाद',
    'features.ai.desc': 'उन्नत AI आपके पंजाबी विवरणों को तुरंत पूर्ण, पेशेवर अंग्रेजी में अनुवाद करता है',
    'features.multilang.title': 'बहु-भाषा समर्थन',
    'features.multilang.desc': 'पंजाबी और अंग्रेजी के साथ आसानी से काम करें, अपने व्यवसाय के लिए भाषा की खाई को पाटें',
    'features.social.title': 'सोशल मीडिया अनुकूलन',
    'features.social.desc': 'अधिकतम पहुंच और जुड़ाव के लिए अनुकूलित आकर्षक कैप्शन और पोस्ट बनाएं',
    
    // Studio
    'studio.title': 'सामग्री निर्माण स्टूडियो',
    'studio.tagline': 'उन्नत AI पूर्ण अंग्रेजी में अनुवाद करता है',
    // 'studio.hero.title': 'अपनी सामग्री बनाएं',
    // 'studio.hero.subtitle': 'तीन सरल चरणों में अपने पंजाबी उत्पाद विवरणों को पेशेवर अंग्रेजी सामग्री में बदलें',
    // 'studio.step1.title': 'चरण 1: AI वार्तालाप',
    // 'studio.step1.desc': 'पंजाबी में अपने उत्पाद का वर्णन करें। स्वाभाविक और स्पष्ट रूप से बोलें।',
    // 'studio.step2.title': 'चरण 2: प्लेटफ़ॉर्म चुनें',
    // 'studio.step2.desc': 'सोशल मीडिया पोस्ट के लिए अपने उत्पाद की फोटो अपलोड करें (वैकल्पिक)।',
    // 'studio.step3.title': 'चरण 3: अपलोड और निर्माण',
    // 'studio.step3.desc': 'अपने विवरण को पेशेवर सोशल मीडिया सामग्री में बदलें',
    'studio.recording': 'रिकॉर्डिंग जारी है...',
    'studio.clicktostart': 'बातचीत शुरू करने के लिए क्लिक करें।',
    'studio.startConversation': 'बातचीत शुरू करें',
    'studio.aiSpeaking': 'AI बोल रहा है...',
    'studio.startTalking': 'बोलना शुरू करें',
    'studio.stoprecording': 'रिकॉर्डिंग बंद करें',
    'studio.replayQuestion': 'प्रश्न दोहराएं',
    'studio.selected': 'चयनित',
    'studio.uploading': 'अपलोड हो रहा है...',
    'studio.generating': 'बनाया जा रहा है...',
    'studio.generateContent': 'सामग्री बनाएं',
    'studio.imageUploaded': 'छवि अपलोड हो गई!',
    'studio.generatedContent': 'आपकी बनाई गई सामग्री',
    'studio.contentGeneratedFor': 'के लिए सामग्री बनाई गई',
    'studio.platforms': 'प्लेटफ़ॉर्म',
    'studio.max': 'अधिकतम',
    'studio.chars': 'अक्षर',
    'studio.copyContent': 'सामग्री कॉपी करें',
    'studio.createAnotherProduct': 'एक और उत्पाद बनाएं',
    
    // 🛠️ ADDED KEYS
    'studio.generateVisuals': 'विज़ुअल मॉकअप/अवधारणाएं बनाएं',
    'studio.generatingVisuals': 'मॉकअप बनाए जा रहे हैं...',
    'studio.mustCompleteConversation': 'कृपया पहले AI वार्तालाप पूरी करें।',
    'studio.visualGenerationFailed': 'विज़ुअल जनरेशन विफल रहा।',
    'studio.visualsSuccess': 'उत्पाद मॉकअप सफलतापूर्वक बनाए गए!',
    'studio.visualsNoImages': 'मॉकअप जनरेशन ने कोई छवि वापस नहीं की।',
    'studio.mustUploadImage': 'कृपया पहले एक छवि अपलोड करें।',
    'studio.mustSelectPlatform': 'कृपया कम से कम एक प्लेटफ़ॉर्म चुनें।',
    'studio.imageUploadFailed': 'छवि अपलोड विफल रही।',
    'studio.contentGenerationFailed': 'सामग्री जनरेशन विफल रही।',
    'studio.contentGenerationSuccess': 'सोशल मीडिया सामग्री सफलतापूर्वक बनाई गई!',
    
    // Shared
    'nav.backToHome': 'होम पर वापस',
    'OR': 'या',
    'artisans': 'कारीगर',
    'content': 'सामग्री',
    'free': 'मुफ्त',
    'Debug Info': 'डीबग जानकारी',

    // Platform Keys (Used in Studio.tsx)
    'platform.instagram.name': 'इंस्टाग्राम',
    'platform.instagram.description': 'छवियों के साथ दृश्य कहानी कहना',
    'platform.facebook.name': 'फेसबुक',
    'platform.facebook.description': 'सामुदायिक जुड़ाव और विस्तृत पोस्ट',
    'platform.twitter.name': 'ट्विटर/X',
    'platform.twitter.description': 'छोटे, दमदार अपडेट',
    'platform.linkedin.name': 'लिंक्डइन',
    'platform.linkedin.description': 'व्यावसायिक नेटवर्किंग',
    'platform.marketplace.name': 'अमेज़न/फ्लिपकार्ट मार्केटप्लेस',
    'platform.marketplace.description': 'उत्पाद लिस्टिंग',

    // Sign In
    'signin.welcomeBack': 'वापसी पर स्वागत है',
    'signin.title': 'साइन इन करें',
    'signin.description': 'अपने खाते तक पहुंचने के लिए अपनी साख दर्ज करें',
    'signin.email': 'ईमेल पता',
    'signin.password': 'पासवर्ड',
    'signin.rememberMe': 'मुझे याद रखें',
    'signin.forgotPassword': 'पासवर्ड भूल गए?',
    'signin.noAccount': 'कोई खाता नहीं है?',
    'signin.signUpHere': 'यहां साइन अप करें',
    'signin.signingIn': 'साइन इन हो रहा है...',

    // DEFINITIONS FOR SIGN IN LABELS/PLACEHOLDERS
    'signin.enterEmailPlaceholder': 'अपना ईमेल पता दर्ज करें',
    'signin.enterPasswordPlaceholder': 'अपना पासवर्ड दर्ज करें',

    // Sign Up
    'signup.joinCommunity': 'कारीगर समुदाय में शामिल हों',
    'signup.title': 'खाता बनाएं',
    'signup.description': 'अपना Kalakaar AI खाता बनाने के लिए अपना विवरण दर्ज करें।',
    'signup.enterFirstName': 'पहला नाम',
    'signup.enterLastName': 'अंतिम नाम',
    'signup.enterPhone': 'फ़ोन नंबर',
    'signup.enterLocation': 'स्थान',
    'signup.craftType': 'शिल्प का प्रकार',
    'signup.createAccount': 'खाता बनाएं',
    'signup.alreadyHaveAccount': 'क्या आपके पास पहले से खाता है?',
    'signup.signInHere': 'यहां साइन इन करें',
    'signup.startJourney': 'अपनी यात्रा शुरू करें',
    'signup.journeyDescription': 'दुनिया को अपनी अनूठी कारीगरी दिखाने के लिए शक्तिशाली AI उपकरणों को अनलॉक करें।',
    'signup.freeContent': 'AI-संचालित सामग्री निर्माण',
    'signup.multiLanguage': 'बहु-भाषा समर्थन',
    'signup.socialOptimization': 'सोशल मीडिया अनुकूलन',
    'signup.communitySupport': 'सामुदायिक समर्थन',
    'signup.creating': 'बनाया जा रहा है...',

    
  "signup.firstName": "पहला नाम",
  "signup.lastName": "अंतिम नाम",
  "signup.phone": "फ़ोन नंबर",
  "signup.location": "स्थान",
  "signup.email": "ईमेल पता",



    // DEFINITIONS FOR SIGN UP LABELS/PLACEHOLDERS
    
    'signup.password': 'पासवर्ड',
    'signup.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'signup.enterFirstNamePlaceholder': 'अपना पहला नाम दर्ज करें',
    'signup.enterLastNamePlaceholder': 'अपना अंतिम नाम दर्ज करें',
    'signup.enterEmailPlaceholder': 'अपना ईमेल दर्ज करें',
    'signup.enterPhonePlaceholder': 'अपना फ़ोन नंबर दर्ज करें',
    'signup.enterLocationPlaceholder': 'अपना स्थान/शहर दर्ज करें',
    'signup.createPassword': 'एक पासवर्ड बनाएं (न्यूनतम 6 अक्षर)',
    'signup.confirmPasswordPlaceholder': 'अपने पासवर्ड की पुष्टि करें',
    'signup.selectCraft': 'अपने शिल्प का चयन करें',

    'studio.header.title': 'कलाकार AI',
  'studio.header.subtitle': 'सामग्री निर्माण स्टूडियो',
  'studio.header.backHome': 'होम पर वापस',
  
  // Studio Page - Hero
  'studio.hero.badge': 'AI-संचालित स्टूडियो',
  'studio.hero.title': 'अपनी सामग्री बनाएं',
  'studio.hero.subtitle': 'तीन सरल चरणों में अपने पंजाबी उत्पाद विवरणों को पेशेवर अंग्रेजी सामग्री में बदलें',
  
  // Studio Page - Steps
  'studio.step1.title': 'चरण 1: AI वार्तालाप',
  'studio.step1.desc': 'पंजाबी में अपने उत्पाद का वर्णन करें',
  'studio.step1.ready': 'बातचीत शुरू करने के लिए तैयार',
  'studio.step1.aiSpeaking': 'AI बोल रहा है...',
  'studio.processing': 'प्रोसेस हो रहा है...',
  'studio.step1.recording': 'रिकॉर्डिंग जारी है...',
  'studio.step1.startConversation': 'बातचीत शुरू करें',
  'studio.step1.stopRecording': 'रिकॉर्डिंग बंद करें',
  'studio.step1.startTalking': 'बोलना शुरू करें',
  'studio.step1.replayQuestion': 'प्रश्न दोहराएं',
  
  'studio.step2.title': 'चरण 2: प्लेटफ़ॉर्म चुनें',
  'studio.step2.desc': 'चुनें कि आप कहां पोस्ट करना चाहते हैं',
  'studio.step2.selected': 'चयनित',
  
  'studio.step3.title': 'चरण 3: अपलोड और निर्माण',
  'studio.step3.desc': 'उत्पाद की फोटो जोड़ें और सामग्री बनाएं',
  'studio.step3.selectedFile': 'चयनित',
  'studio.step3.imageUploaded': 'छवि अपलोड हो गई!',
  'studio.step3.uploading': 'अपलोड हो रहा है...',
  'studio.step3.generating': 'बनाया जा रहा है...',
  'studio.step3.generateContent': 'सामग्री बनाएं',
  
  // Progress
  'studio.conversationProgress': 'बातचीत की प्रगति',
  
  // Image Enhancement
  'studio.enhance.title': 'वैकल्पिक: छवि बेहतर बनाएं',
  'studio.enhance.desc': 'बैकग्राउंड हटाएं और पेशेवर स्टूडियो सेटिंग जोड़ें (1 Clipdrop क्रेडिट का उपयोग करता है)',
  'studio.enhance.button': 'AI से बेहतर बनाएं',
  'studio.enhance.enhancing': 'बेहतर बनाया जा रहा है...',
  'studio.enhance.ready': 'बेहतर छवि तैयार है',
  'studio.enhance.applied': 'पेशेवर बैकग्राउंड लागू किया गया • अपनी पोस्ट के लिए इसका उपयोग करें',
  
  // Generated Content
  'studio.generated.title': 'आपकी बनाई गई सामग्री',
  'studio.generated.desc': 'के लिए सामग्री बनाई गई',
  'studio.generated.platforms': 'प्लेटफ़ॉर्म',
  'studio.generated.maxChars': 'अधिकतम',
  'studio.generated.chars': 'अक्षर',
  'studio.generated.copy': 'सामग्री कॉपी करें',
  'studio.generated.share': 'साझा करें',
  'studio.generated.createAnother': 'एक और उत्पाद बनाएं',
  
  // Errors & Messages
  'studio.error.uploadFirst': 'कृपया पहले एक छवि अपलोड करें',
  'studio.error.selectPlatform': 'कृपया कम से कम एक प्लेटफ़ॉर्म चुनें',
  'studio.error.startFirst': 'बातचीत शुरू करने के लिए "बातचीत शुरू करें" पर क्लिक करें',

  'studio.question.cost': 'इस उत्पाद की कीमत क्या है?',
'studio.question.timeTaken': 'इस उत्पाद को बनाने में आपको कितना समय लगा?',
'studio.field.cost': 'कीमत',
'studio.field.timeTaken': 'बनाने में समय',

  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en';
  });

  useEffect(() => {
    // Save language to localStorage whenever it changes
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};