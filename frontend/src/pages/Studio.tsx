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
  Wand2,
  Download
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
    variant?: number;
    background_style?: string;
    size: number;
    method: string;
    original_image?: string;
}

const Studio: React.FC = () => {
    // --- State ---
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [aiQuestion, setAiQuestion] = useState<string>('');
    const [aiQuestionEn, setAiQuestionEn] = useState<string>('Click "Start Conversation" to begin.');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [collectedInfo, setCollectedInfo] = useState<CollectedInfo | null>(null);
    const [error, setError] = useState<string>('');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEnhancingImage, setIsEnhancingImage] = useState(false);
    const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
    const [selectedImageForContent, setSelectedImageForContent] = useState<string | null>(null);

    const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);

    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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

        const fullUrl = relativeUrl;
        
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
                setAiQuestionEn("Upload an image to enhance it with professional backgrounds");
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
            setEnhancedImages([]);
            setSelectedImageForContent(null);
        }
    };

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev => 
            prev.includes(platformId) 
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    const uploadImage = async () => {
        if (!imageFile) {
            setError("Please select an image first");
            return;
        }
        
        try {
            setIsUploading(true);
            setError('');

            const formData = new FormData();
            formData.append('image', imageFile);

            const uploadResponse = await fetch(`${API_BASE_URL}/upload_image`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            if (!uploadResponse.ok) throw new Error('Image upload failed');
            
            const uploadData = await uploadResponse.json();
            setImageUrl(uploadData.image_url);
            setIsUploading(false);
            console.log("Image uploaded:", uploadData.image_url);

        } catch (err) {
            console.error("Upload Error:", err);
            setError(err instanceof Error ? err.message : "Failed to upload image");
            setIsUploading(false);
        }
    };

    const enhanceProductImage = async () => {
        if (!imageUrl || !sessionId) {
            setError("Please upload an image first");
            return;
        }
        
        try {
            setIsEnhancingImage(true);
            setError('');

            console.log("Enhancing image with Clipdrop...");
            console.log("Image URL:", imageUrl);
            console.log("Session ID:", sessionId);

            const response = await fetch(`${API_BASE_URL}/enhance-image`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image_url: imageUrl,
                    session_id: sessionId,
                    create_variants: false,
                    num_variants: 1
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Image enhancement failed');
            }
            
            const enhanceData = await response.json();
            console.log("Enhanced images:", enhanceData);

            if (enhanceData.success && enhanceData.enhanced_images) {
                setEnhancedImages(enhanceData.enhanced_images);
                setSelectedImageForContent(enhanceData.enhanced_images[0].url);
            } else {
                throw new Error('No enhanced images were created');
            }
            
            setIsEnhancingImage(false);

        } catch (err) {
            console.error("Image Enhancement Error:", err);
            setError(err instanceof Error ? err.message : "Failed to enhance image");
            setIsEnhancingImage(false);
        }
    };

    const generateContentWithImage = async () => {
        if (!selectedImageForContent || !sessionId) {
            setError("Please select an enhanced image first");
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
            console.log("Using image:", selectedImageForContent);
            
            const generateResponse = await fetch(`${API_BASE_URL}/conversation/generate`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: sessionId,
                    image_url: selectedImageForContent,
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
            console.error("Generate Error:", err);
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
        setSelectedImageForContent(null);
        setSelectedPlatforms(['instagram', 'facebook']);
        setError('');
    };
    
    return (
        <div className="min-h-screen kalakaar-bg-pattern">
            <header className="border-b bg-card/70 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <Star className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Kalakaar AI</h1>
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
                    <p className="text-muted-foreground">{aiQuestionEn}</p>
                </div>

                {error && (
                    <Card className="mb-6 border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive text-center">{error}</p>
                        </CardContent>
                    </Card>
                )}

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

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-primary/5 rounded-t-lg">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                                <Mic className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl">Step 1: AI Conversation</CardTitle>
                            <CardDescription>{aiQuestion || 'Ready to start your conversation'}</CardDescription>
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
                    
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-secondary/5 rounded-t-lg">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-4">
                                <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl">Step 3: Upload Image</CardTitle>
                            <CardDescription>Add your product photo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                disabled={!isComplete || isUploading}
                            />
                            
                            {imageFile && !imageUrl && (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Selected: {imageFile.name}
                                    </p>
                                    <Button
                                        onClick={uploadImage}
                                        disabled={isUploading}
                                        className="w-full"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Image
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {imageUrl && !enhancedImages.length && (
                                <div className="text-center">
                                    <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
                                    <p className="text-sm text-secondary">Image uploaded!</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Click "Enhance Image" below to add professional background
                                    </p>
                                </div>
                            )}

                            {enhancedImages.length > 0 && (
                                <div className="text-center">
                                    <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                    <p className="text-sm text-purple-500 font-medium">
                                        Enhanced image ready!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {isComplete && imageUrl && !enhancedImages.length && (
                    <Card className="border-2 shadow-lg border-purple-500/20 mb-6">
                        <CardHeader className="bg-purple-500/5">
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Wand2 className="w-6 h-6 text-purple-500" />
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    Enhance Your Product Image
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Remove unprofessional backgrounds (floor, bedsheet) and add studio-quality settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-purple-500/5 p-6 rounded-lg text-center">
                                <Wand2 className="w-16 h-16 text-purple-500 mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground mb-4">AI will automatically:</p>
                                <ul className="text-sm text-muted-foreground space-y-2 mb-6 text-left max-w-md mx-auto">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-500" />
                                        Remove messy or unprofessional backgrounds
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-500" />
                                        Add clean studio-quality backgrounds
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-500" />
                                        Professional e-commerce ready image
                                    </li>
                                </ul>
                                
                                <Button 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-md shadow-purple-500/20 h-12 px-8"
                                    onClick={enhanceProductImage}
                                    disabled={isEnhancingImage}
                                >
                                    {isEnhancingImage ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Enhancing Image...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5 mr-2" />
                                            Enhance Image with AI
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {enhancedImages.length > 0 && (
                    <Card className="border-2 shadow-lg mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <CheckCircle className="w-6 h-6 text-purple-500" />
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    Enhanced Product Image
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Professional background applied - ready for content generation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {enhancedImages.map((img, index) => (
                                    <div key={index} className="border-2 border-purple-500 rounded-lg overflow-hidden shadow-lg">
                                        <div className="relative aspect-square max-w-2xl mx-auto">
                                            <img 
                                                src={img.url} 
                                                alt="Enhanced product"
                                                className="w-full h-full object-contain bg-gray-50"
                                            />
                                            <div className="absolute top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                                                Enhanced ✨
                                            </div>
                                        </div>
                                        <div className="p-6 bg-card/50 space-y-4">
                                            <p className="text-sm text-center text-muted-foreground">
                                                Professional studio background applied
                                            </p>
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                                                    onClick={() => window.open(img.url, '_blank')}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>
                                                <Button
                                                    className="flex-1 bg-gradient-to-r from-secondary to-primary text-white hover:opacity-90"
                                                    onClick={generateContentWithImage}
                                                    disabled={selectedPlatforms.length === 0 || isGenerating}
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Generate Content
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                Content generated for {generatedContent.platforms.length} platform(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {selectedImageForContent && (
                                <div className="rounded-lg overflow-hidden border-2 border-primary/20">
                                    <img src={selectedImageForContent} alt="Product" className="w-full h-auto max-h-96 object-cover" />
                                </div>
                            )}

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
                                enhancedImages: enhancedImages.length,
                                selectedImageForContent
                            }, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default Studio;