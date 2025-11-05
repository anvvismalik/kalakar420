// src/pages/Studio.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  Mic, 
  StopCircle, 
  Volume2, 
  Loader2, 
  Upload, 
  Sparkles,
  Star,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Download,
  Wand2
} from "lucide-react";
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useMicrophoneRecorder } from '@/hooks/useMicrophoneRecorder';

const API_BASE_URL = 'http://127.0.0.1:5001/api';

interface CollectedInfo {
    [key: string]: { punjabi: string, english: string };
}

interface PlatformContent {
    platform: string;
    content: string;
    char_limit: number;
    format_type: string;
    error?: boolean;
}

interface GeneratedImage {
    url: string;
    filename: string;
    variation: number;
    prompt?: string;
    size?: number;
}

interface GeneratedContent {
    success: boolean;
    platforms: string[];
    content: { [key: string]: PlatformContent };
    generated_images?: GeneratedImage[];
    model_used: string;
}

interface Platform {
    id: string;
    name: string;
    icon: string;
    description: string;
    char_limit: number;
    best_for: string;
}

const Studio: React.FC = () => {
    // --- Conversation State ---
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [aiQuestion, setAiQuestion] = useState<string>('');
    const [aiQuestionEn, setAiQuestionEn] = useState<string>('Click "Start Conversation" to begin.');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [collectedInfo, setCollectedInfo] = useState<CollectedInfo | null>(null);
    const [error, setError] = useState<string>('');
    
    // --- Image State ---
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // --- Platform Selection State ---
    const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);

    // --- Generated Content State ---
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // --- Image Generation State ---
    const [generateImages, setGenerateImages] = useState<boolean>(true);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    // --- Audio Playback Ref ---
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        fetchPlatforms();
    }, []); 

    const fetchPlatforms = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/platforms`);
            if (response.ok) {
                const data = await response.json();
                setAvailablePlatforms(data.platforms);
            }
        } catch (err) {
            console.error("Failed to fetch platforms:", err);
        }
    };

    const playAudio = useCallback((relativeUrl: string | null) => {
        if (!relativeUrl || !audioRef.current) {
            setIsSpeaking(false);
            return;
        }

        const fullUrl = `http://127.0.0.1:5001${relativeUrl}`; 
        
        const handleEnd = () => {
             setIsSpeaking(false);
        };
        
        const handleError = (e: Event | string) => {
            console.error("Audio Playback Error:", e);
            setError("Error playing AI audio.");
            setIsSpeaking(false);
        };

        if (audioRef.current) {
             audioRef.current.src = fullUrl;
             audioRef.current.removeEventListener('ended', handleEnd);
             audioRef.current.removeEventListener('error', handleError);
             audioRef.current.addEventListener('ended', handleEnd);
             audioRef.current.addEventListener('error', handleError);
             setIsSpeaking(true);
             audioRef.current.play().catch(e => {
                 console.warn("Autoplay blocked:", e);
                 setIsSpeaking(false);
             });
        }
    }, []);

    const handleRecordedAudio = useCallback((audioBlob: Blob) => {
        sendUserAudio(audioBlob);
    }, [sessionId]);

    const { isRecording, startRecording, stopRecording, error: micError } = useMicrophoneRecorder(handleRecordedAudio);

    useEffect(() => {
        if (micError) setError(micError);
    }, [micError]);

    const startConversation = async () => {
        try {
            setError('');
            const response = await fetch(`${API_BASE_URL}/conversation/start`, {
                method: 'POST',
                credentials: 'include' 
            });
            
            if (!response.ok) {
                throw new Error(`Start failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            setSessionId(data.session_id);
            setAiQuestion(data.question);
            setAiQuestionEn(data.question_en || data.question);
            setProgress(data.progress);
            playAudio(data.audio_url);

        } catch (err) {
            console.error("Start Conversation Error:", err);
            setError(err instanceof Error ? err.message : "Could not start conversation");
        }
    };

    const sendUserAudio = async (audioBlob: Blob) => {
        if (!sessionId) return;
        
        setIsTranscribing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('session_id', sessionId);
            formData.append('audio', audioBlob, 'user_response.webm'); 
            
            const response = await fetch(`${API_BASE_URL}/conversation/respond`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            if (!response.ok) throw new Error(`Response failed: ${response.statusText}`);
            
            const data = await response.json();
            setIsTranscribing(false);
            
            if (data.collected_info) {
                setCollectedInfo(data.collected_info);
            }
            
            setProgress(data.progress);

            if (data.completed) {
                setIsComplete(true);
                setAiQuestion(data.message || "Conversation completed!");
                setAiQuestionEn("Select platforms and upload an image to generate content");
            } else {
                setAiQuestion(data.next_question);
                setAiQuestionEn(data.next_question_en || data.next_question);
                playAudio(data.audio_url);
            }

        } catch (err) {
            console.error("Respond Error:", err);
            setError(err instanceof Error ? err.message : "Failed to process response");
            setIsTranscribing(false);
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev => 
            prev.includes(platformId) 
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    // NEW: Separate function for image generation
    const generateProductImages = async (uploadedImageUrl: string) => {
        if (!sessionId || !generateImages) {
            console.log("Skipping image generation:", { sessionId, generateImages });
            return [];
        }

        console.log("=== STARTING IMAGE GENERATION ===");
        console.log("Session ID:", sessionId);
        console.log("Reference Image URL:", uploadedImageUrl);

        setIsGeneratingImages(true);

        try {
            const payload = {
                session_id: sessionId,
                num_images: 3,
                reference_image_url: uploadedImageUrl
            };

            console.log("Sending request to /api/generate-images");
            console.log("Payload:", JSON.stringify(payload, null, 2));

            const response = await fetch(`${API_BASE_URL}/generate-images`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Image generation failed:", errorData);
                throw new Error(errorData.error || 'Image generation failed');
            }

            const imageData = await response.json();
            console.log("Image generation SUCCESS!");
            console.log("Generated images:", imageData.generated_images);

            if (imageData.success && imageData.generated_images) {
                setGeneratedImages(imageData.generated_images);
                return imageData.generated_images;
            }

            return [];

        } catch (err) {
            console.error("IMAGE GENERATION ERROR:", err);
            setError(`Image generation warning: ${err instanceof Error ? err.message : 'Unknown error'}`);
            return [];
        } finally {
            setIsGeneratingImages(false);
        }
    };

    const uploadImageAndGenerate = async () => {
        if (!imageFile || !sessionId) {
            setError("Please upload an image first");
            return;
        }
        
        if (selectedPlatforms.length === 0) {
            setError("Please select at least one platform");
            return;
        }
        
        try {
            console.log("=== STARTING CONTENT GENERATION PROCESS ===");
            console.log("Session ID:", sessionId);
            console.log("Selected Platforms:", selectedPlatforms);
            console.log("Generate Images:", generateImages);

            setIsUploading(true);
            setError('');

            // STEP 1: Upload image
            const formData = new FormData();
            formData.append('image', imageFile);

            console.log("Step 1: Uploading image...");

            const uploadResponse = await fetch(`${API_BASE_URL}/upload_image`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            if (!uploadResponse.ok) throw new Error('Image upload failed');
            
            const uploadData = await uploadResponse.json();
            setImageUrl(uploadData.image_url);
            setIsUploading(false);

            console.log("Step 1: Image uploaded successfully:", uploadData.image_url);

            // STEP 2: Generate AI product images (if enabled)
            let aiGeneratedImages: GeneratedImage[] = [];
            if (generateImages) {
                console.log("Step 2: Generating AI product images...");
                aiGeneratedImages = await generateProductImages(uploadData.image_url);
                console.log(`Step 2: Generated ${aiGeneratedImages.length} images`);
            } else {
                console.log("Step 2: Skipping AI image generation (disabled by user)");
            }

            // STEP 3: Generate social media content
            console.log("Step 3: Generating social media content...");
            setIsGenerating(true);
           
            const payload = { 
                session_id: sessionId,
                image_url: uploadData.image_url,
                platforms: selectedPlatforms
            };

            console.log("Sending to /api/conversation/generate:", payload);

            const generateResponse = await fetch(`${API_BASE_URL}/conversation/generate`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!generateResponse.ok) {
                const errorData = await generateResponse.json();
                throw new Error(errorData.error || 'Content generation failed');
            }
            
            const contentData = await generateResponse.json();
            
            // Add generated images to the content data
            if (aiGeneratedImages.length > 0) {
                contentData.generated_images = aiGeneratedImages;
            }
            
            setGeneratedContent(contentData);
            setIsGenerating(false);

            console.log("=== GENERATION COMPLETE ===");
            console.log("Platforms:", contentData.platforms);
            console.log("AI Images:", aiGeneratedImages.length);
            console.log("Success!");

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to upload or generate";
            console.error("=== GENERATION ERROR ===", errorMessage, err);

            setError(errorMessage);
            setIsUploading(false);
            setIsGenerating(false);
            setIsGeneratingImages(false);
        }
    };

    const resetConversation = () => {
        setSessionId(null);
        setAiQuestion('');
        setAiQuestionEn('Click "Start Conversation" to begin.');
        setProgress(0);
        setIsComplete(false);
        setCollectedInfo(null);
        setImageFile(null);
        setImageUrl(null);
        setGeneratedContent(null);
        setGeneratedImages([]);
        setSelectedPlatforms(['instagram', 'facebook']);
        setGenerateImages(true);
        setError('');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <Star className="w-6 h-6 text-white fill-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    Kalakaar AI
                                </h1>
                                <p className="text-xs text-muted-foreground">Content Studio</p>
                            </div>
                        </Link>
                    </div>
                    <Link to="/">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">AI-Powered Studio</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Create Your Content
                        </span>
                    </h1>
                    <p className="text-muted-foreground">
                        {aiQuestionEn}
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Card className="mb-6 border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive text-center">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Progress Bar */}
                {sessionId && !isComplete && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Conversation Progress</span>
                                <span className="text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    {progress}%
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </CardContent>
                    </Card>
                )}

                {/* Main Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    
                    {/* Step 1: Record Audio */}
                    <Card className="border-2 hover:border-primary/50 transition-all">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                                <Mic className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle>Step 1: AI Conversation</CardTitle>
                            <CardDescription>
                                {aiQuestion || 'Ready to start your conversation'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status Indicators */}
                            <div className="text-center py-4">
                                {isSpeaking && (
                                    <div className="flex items-center justify-center gap-2 text-primary">
                                        <Volume2 className="w-5 h-5 animate-pulse" />
                                        <span className="font-medium">AI Speaking...</span>
                                    </div>
                                )}
                                {isTranscribing && (
                                    <div className="flex items-center justify-center gap-2 text-secondary">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-medium">Processing...</span>
                                    </div>
                                )}
                                {isRecording && (
                                    <div className="flex items-center justify-center gap-2 text-destructive">
                                        <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                                        <span className="font-medium">Recording...</span>
                                    </div>
                                )}
                            </div>

                            {/* Recording Button */}
                            {!sessionId ? (
                                <Button 
                                    className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                                    onClick={startConversation}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Start Conversation
                                </Button>
                            ) : isRecording ? (
                                <Button 
                                    className="w-full bg-destructive text-white"
                                    onClick={stopRecording}
                                >
                                    <StopCircle className="w-4 h-4 mr-2" />
                                    Stop Recording
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                                    onClick={startRecording}
                                    disabled={isSpeaking || isTranscribing || isComplete}
                                >
                                    <Mic className="w-4 h-4 mr-2" />
                                    {isSpeaking ? 'AI Speaking...' : 'Start Talking'}
                                </Button>
                            )}

                            {/* Replay Audio */}
                            {sessionId && audioRef.current?.src && (
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => audioRef.current?.play()}
                                >
                                    <Volume2 className="w-4 h-4 mr-2" />
                                    Replay Question
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 2: Platform Selection */}
                    <Card className="border-2 hover:border-secondary/50 transition-all">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle>Step 2: Select Platforms</CardTitle>
                            <CardDescription>
                                Choose where you want to post ({selectedPlatforms.length} selected)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {availablePlatforms.map((platform) => (
                                <div key={platform.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                                    <Checkbox
                                        id={platform.id}
                                        checked={selectedPlatforms.includes(platform.id)}
                                        onCheckedChange={() => togglePlatform(platform.id)}
                                        disabled={!isComplete}
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={platform.id}
                                            className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                                        >
                                            <span className="text-lg">{platform.icon}</span>
                                            {platform.name}
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {platform.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    {/* Step 3: Upload & Generate */}
                    <Card className="border-2 hover:border-accent/50 transition-all">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
                                <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle>Step 3: Upload & Generate</CardTitle>
                            <CardDescription>
                                Add product photo and create content
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                disabled={!isComplete || isUploading}
                            />
                            
                            {imageFile && !imageUrl && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {imageFile.name}
                                </p>
                            )}

                            {imageUrl && (
                                <div className="text-center">
                                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-green-600">Image uploaded!</p>
                                </div>
                            )}

                            {/* Image Generation Option */}
                            <div className="flex items-center space-x-2 p-3 bg-accent/10 rounded-lg">
                                <Checkbox
                                    id="generate-images"
                                    checked={generateImages}
                                    onCheckedChange={(checked) => setGenerateImages(checked as boolean)}
                                    disabled={!isComplete}
                                />
                                <div className="flex-1">
                                    <label
                                        htmlFor="generate-images"
                                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                    >
                                        <Wand2 className="w-4 h-4 text-primary" />
                                        Generate Product Images
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Create 3 AI-enhanced product photos
                                    </p>
                                </div>
                            </div>

                            <Button 
                                className="w-full bg-gradient-to-r from-accent to-primary text-white"
                                onClick={uploadImageAndGenerate}
                                disabled={!isComplete || !imageFile || selectedPlatforms.length === 0 || isUploading || isGenerating || isGeneratingImages}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading Image...
                                    </>
                                ) : isGeneratingImages ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating AI Images...
                                    </>
                                ) : isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating Content...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Content
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Generated Content Display */}
                {generatedContent && (
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Sparkles className="w-6 h-6 text-primary" />
                                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    Your Generated Content
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Content generated for {generatedContent.platforms.length} platform(s)
                                {generatedContent.generated_images && generatedContent.generated_images.length > 0 && ` • ${generatedContent.generated_images.length} product images created`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* Original + Generated Images */}
                            {(imageUrl || (generatedContent.generated_images && generatedContent.generated_images.length > 0)) && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-primary" />
                                        Product Images
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Original Image */}
                                        {imageUrl && (
                                            <div className="relative group">
                                                <div className="rounded-lg overflow-hidden border-2 border-primary/20">
                                                    <img src={imageUrl} alt="Original Product" className="w-full h-64 object-cover" />
                                                </div>
                                                <div className="mt-2 text-center">
                                                    <span className="text-xs font-medium bg-primary/10 px-2 py-1 rounded">Original</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Generated Images */}
                                        {generatedContent.generated_images?.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className="rounded-lg overflow-hidden border-2 border-accent/20">
                                                    <img src={img.url} alt={`Variant ${img.variation}`} className="w-full h-64 object-cover" />
                                                </div>
                                                <div className="mt-2 text-center space-y-1">
                                                    <span className="text-xs font-medium bg-accent/10 px-2 py-1 rounded">
                                                        AI Variant {img.variation}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => window.open(img.url, '_blank')}
                                                    >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Platform-specific content */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-secondary" />
                                    Social Media Posts
                                </h3>
                                
                                {Object.entries(generatedContent.content).map(([platformId, platformContent]) => (
                                    <div key={platformId} className="border rounded-lg p-6 bg-gradient-to-br from-card to-accent/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                                <span className="text-2xl">
                                                    {availablePlatforms.find(p => p.id === platformId)?.icon || '📱'}
                                                </span>
                                                {platformContent.platform}
                                            </h4>
                                            <span className="text-xs text-muted-foreground">
                                                Max: {platformContent.char_limit} chars
                                            </span>
                                        </div>
                                        
                                        {platformContent.error ? (
                                            <div className="text-destructive bg-destructive/10 p-4 rounded-lg">
                                                {platformContent.content}
                                            </div>
                                        ) : (
                                            <div className="bg-background/50 p-4 rounded-lg whitespace-pre-line">
                                                {platformContent.content}
                                            </div>
                                        )}
                                        
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => navigator.clipboard.writeText(platformContent.content)}
                                        >
                                            Copy Content
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={resetConversation}
                                size="lg"
                                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                Create Another Product
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Studio;