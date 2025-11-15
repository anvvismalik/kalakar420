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
  Wand2
} from "lucide-react";
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useMicrophoneRecorder } from '@/hooks/useMicrophoneRecorder';

// const API_BASE_URL = 'http://127.0.0.1:5001/api';
const API_BASE_URL = 'https://kalakar420.onrender.com/api';

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

interface GeneratedContent {
    success: boolean;
    platforms: string[];
    content: { [key: string]: PlatformContent };
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

interface EnhancedImage {
    url: string;
    filename: string;
    variation: number;
    description: string;
    size: number;
}

const Studio: React.FC = () => {
    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [authError, setAuthError] = useState<string>('');
    
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
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);

    // --- Platform Selection State ---
    const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);

    // --- Generated Content State ---
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Audio Playback Ref ---
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Initialize audio element once on mount
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        
        // Fetch available platforms
        fetchPlatforms();
    }, []); 

    // Fetch available platforms from backend
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

    // --- Core Playback Logic ---
    const playAudio = useCallback((relativeUrl: string | null) => {
        if (!relativeUrl || !audioRef.current) {
            setIsSpeaking(false);
            return;
        }

        // Construct full URL for audio file
        const fullUrl = relativeUrl.startsWith('http') 
            ? relativeUrl 
            : `${API_BASE_URL.replace('/api', '')}${relativeUrl}`;
        
        console.log('[AUDIO] Playing:', fullUrl);
        
        const handleEnd = () => {
             setIsSpeaking(false);
        };
        
        const handleError = (e: Event | string) => {
            console.error("Audio Playback Error:", e);
            setError("Audio ready - click 'Replay Question' to hear it");
            setIsSpeaking(false);
        };

        if (audioRef.current) {
             audioRef.current.src = fullUrl;
             audioRef.current.crossOrigin = 'anonymous';
             audioRef.current.preload = 'auto';
             
             audioRef.current.removeEventListener('ended', handleEnd);
             audioRef.current.removeEventListener('error', handleError);
             
             audioRef.current.addEventListener('ended', handleEnd);
             audioRef.current.addEventListener('error', handleError);

             setIsSpeaking(true);

             audioRef.current.play().catch(e => {
                 console.warn("Autoplay blocked or playback error:", e);
                 setError("Audio ready - click 'Replay Question' to hear it");
                 setIsSpeaking(false);
             });
        }
    }, []);

    // --- Mic Recorder Setup ---
    const handleRecordedAudio = useCallback((audioBlob: Blob) => {
        sendUserAudio(audioBlob);
    }, [sessionId]);

    const { isRecording, startRecording, stopRecording, error: micError } = useMicrophoneRecorder(handleRecordedAudio);

    // Display mic error
    useEffect(() => {
        if (micError) setError(micError);
    }, [micError]);

    // --- Conversation Handlers ---
    const startConversation = async () => {
        try {
            setError('');
            const response = await fetch(`${API_BASE_URL}/conversation/start`, {
                method: 'POST',
                credentials: 'include' 
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Please log in to continue.");
                }
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
                setAiQuestionEn("Upload your product photo to enhance and generate content");
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
    
    // --- Image Handling ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    // --- Platform Selection ---
    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev => 
            prev.includes(platformId) 
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    // --- NEW: Enhance Product Image ---
    const enhanceProductImage = async () => {
        if (!imageFile) {
            setError("Please upload an image first");
            return;
        }
        
        try {
            setIsEnhancing(true);
            setError('');

            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('num_variations', '3');

            console.log("Enhancing product image...");

            const enhanceResponse = await fetch(`${API_BASE_URL}/enhance-image`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            if (!enhanceResponse.ok) {
                const errorData = await enhanceResponse.json();
                throw new Error(errorData.error || 'Image enhancement failed');
            }
            
            const enhanceData = await enhanceResponse.json();
            console.log("Enhanced images:", enhanceData);
            
            if (enhanceData.success && enhanceData.enhanced_images) {
                setEnhancedImages(enhanceData.enhanced_images);
                // Use the first enhanced image as the main image
                setImageUrl(enhanceData.enhanced_images[0].url);
            } else {
                throw new Error('No enhanced images were created');
            }
            
            setIsEnhancing(false);

        } catch (err) {
            console.error("Image Enhancement Error:", err);
            setError(err instanceof Error ? err.message : "Failed to enhance image");
            setIsEnhancing(false);
        }
    };

    // --- Generate Content with Enhanced Image ---
    const generateContent = async () => {
        if (!imageUrl || !sessionId) {
            setError("Please enhance your image first");
            return;
        }
        
        if (selectedPlatforms.length === 0) {
            setError("Please select at least one platform");
            return;
        }
        
        try {
            setIsGenerating(true);
            setError('');
            
            console.log("Generating content for platforms:", selectedPlatforms);
            console.log("Session ID:", sessionId);
            console.log("Image URL:", imageUrl);
            
            const generateResponse = await fetch(`${API_BASE_URL}/conversation/generate`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: sessionId,
                    image_url: imageUrl,
                    platforms: selectedPlatforms
                })
            });

            if (!generateResponse.ok) {
                const errorData = await generateResponse.json();
                throw new Error(errorData.error || 'Content generation failed');
            }
            
            const contentData = await generateResponse.json();
            console.log("Generated content:", contentData);
            setGeneratedContent(contentData);
            setIsGenerating(false);

        } catch (err) {
            console.error("Generate Content Error:", err);
            setError(err instanceof Error ? err.message : "Failed to generate content");
            setIsGenerating(false);
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
        setEnhancedImages([]);
        setSelectedPlatforms(['instagram', 'facebook']);
        setError('');
    };

    return (
        <div className="min-h-screen kalakaar-bg-pattern">
            {/* Header */}
            <header className="border-b bg-card/70 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <Star className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">
                                    Kalakaar AI
                                </h1>
                                <p className="text-xs text-muted-foreground">Content Creation Studio</p>
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
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-primary/5 rounded-t-lg">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                                <Mic className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl">Step 1: AI Conversation</CardTitle>
                            <CardDescription>
                                {aiQuestion || 'Ready to start your conversation'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                {isSpeaking && (
                                    <div className="flex items-center justify-center gap-2 text-primary">
                                        <Volume2 className="w-5 h-5 animate-pulse" />
                                        <span className="font-medium">AI Speaking...</span>
                                    </div>
                                )}
                                {isTranscribing && (
                                    <div className="flex items-center justify-center gap-2 text-accent">
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

                            {!sessionId ? (
                                <Button 
                                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-md shadow-primary/20"
                                    onClick={startConversation}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Start Conversation
                                </Button>
                            ) : isRecording ? (
                                <Button 
                                    className="w-full h-12 bg-destructive text-white"
                                    onClick={stopRecording}
                                >
                                    <StopCircle className="w-4 h-4 mr-2" />
                                    Stop Recording
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-md shadow-primary/20"
                                    onClick={startRecording}
                                    disabled={isSpeaking || isTranscribing || isComplete}
                                >
                                    <Mic className="w-4 h-4 mr-2" />
                                    {isSpeaking ? 'AI Speaking...' : 'Start Talking'}
                                </Button>
                            )}

                            {sessionId && audioRef.current?.src && (
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-primary/50 text-primary hover:bg-primary/10"
                                    onClick={() => audioRef.current?.play()}
                                >
                                    <Volume2 className="w-4 h-4 mr-2" />
                                    Replay Question
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 2: Platform Selection */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-accent/5 rounded-t-lg">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl">Step 2: Select Platforms</CardTitle>
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
                                        className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
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
                    
                    {/* Step 3: Upload & Enhance Image */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-secondary/5 rounded-t-lg">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-4">
                                <Wand2 className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl">Step 3: Enhance Photo</CardTitle>
                            <CardDescription>
                                Upload & create professional product photos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                disabled={!isComplete || isEnhancing}
                            />
                            
                            {imageFile && !enhancedImages.length && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {imageFile.name}
                                </p>
                            )}

                            {enhancedImages.length > 0 && (
                                <div className="text-center">
                                    <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
                                    <p className="text-sm text-secondary font-medium">
                                        {enhancedImages.length} professional photos created!
                                    </p>
                                </div>
                            )}

                            <Button 
                                className="w-full h-12 bg-gradient-to-r from-secondary to-primary text-white hover:opacity-90 shadow-md shadow-secondary/20"
                                onClick={enhanceProductImage}
                                disabled={!isComplete || !imageFile || isEnhancing || enhancedImages.length > 0}
                            >
                                {isEnhancing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enhancing Image...
                                    </>
                                ) : enhancedImages.length > 0 ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Image Enhanced
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Enhance Image
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Images Display */}
                {enhancedImages.length > 0 && !generatedContent && (
                    <Card className="border-2 shadow-lg mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Wand2 className="w-6 h-6 text-secondary" />
                                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                                    Professional Product Photos
                                </span>
                            </CardTitle>
                            <CardDescription>
                                {enhancedImages.length} professional variations with clean backgrounds
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                {enhancedImages.map((img, index) => (
                                    <div key={index} className="border-2 border-secondary/20 rounded-lg overflow-hidden hover:border-secondary/50 transition-colors">
                                        <div className="relative aspect-square">
                                            <img 
                                                src={img.url} 
                                                alt={img.description}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-secondary text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Style {img.variation}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-card/50">
                                            <p className="text-sm font-medium mb-2">{img.description}</p>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                {(img.size / 1024).toFixed(0)} KB
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-secondary text-secondary hover:bg-secondary/10"
                                                onClick={() => window.open(img.url, '_blank')}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-accent/5 p-6 rounded-lg">
                                <p className="text-center text-sm text-muted-foreground mb-4">
                                    Ready to generate social media content using these photos?
                                </p>
                                <Button 
                                    className="w-full h-12 bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 shadow-md"
                                    onClick={generateContent}
                                    disabled={selectedPlatforms.length === 0 || isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating Content...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Content for {selectedPlatforms.length} Platform(s)
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Generated Content Display */}
                {generatedContent && (
                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Sparkles className="w-6 h-6 text-primary" />
                                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    Your Generated Content
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Content generated for {generatedContent.platforms.length} platform(s) using {generatedContent.model_used}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Show selected enhanced image */}
                            {imageUrl && (
                                <div className="rounded-lg overflow-hidden border-2 border-primary/20">
                                    <img src={imageUrl} alt="Selected Product Photo" className="w-full h-auto max-h-96 object-cover" />
                                </div>
                            )}

                            {/* Platform-specific content */}
                            {Object.entries(generatedContent.content).map(([platformId, platformContent]) => (
                                <div key={platformId} className="border rounded-lg p-6 bg-card/50">
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
                                        className="mt-4 border-accent text-accent hover:bg-accent/10"
                                        onClick={() => navigator.clipboard.writeText(platformContent.content)}
                                    >
                                        Copy Content
                                    </Button>
                                </div>
                            ))}

                            {/* Create Another Product Button */}
                            <Button
                                onClick={resetConversation}
                                size="lg"
                                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                Create Another Product
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Debug Info (Remove in production) */}
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                            Debug Info
                        </summary>
                        <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                            {JSON.stringify({
                                sessionId, 
                                progress, 
                                isComplete, 
                                selectedPlatforms,
                                collectedInfo, 
                                imageUrl,
                                enhancedImagesCount: enhancedImages.length
                            }, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default Studio;