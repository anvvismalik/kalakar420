// frontend/src/pages/LanguageSelection.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSelection = () => {
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<'en' | 'pa' | 'hi' | null>(null);

  const handleContinue = () => {
    if (selectedLang) {
      setLanguage(selectedLang);
      localStorage.setItem('kalakaar-language-selected', 'true');
      navigate('/');
    }
  };

  return (
    // 🛠️ Applied new earthy background pattern
    <div className="min-h-screen kalakaar-bg-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-2 shadow-2xl">
        <CardContent className="p-8 md:p-12">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            {/* Logo gradient uses new primary/secondary */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg">
              <Star className="w-10 h-10 text-white fill-white" />
            </div>
            {/* Title gradient uses new primary/secondary */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Kalakaar AI
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Languages className="w-4 h-4" />
              <span className="text-sm">AI-Powered Content Creation</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Choose Your Language
            </h2>
            <p className="text-xl font-bold text-muted-foreground mb-1">
              ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ • अपनी भाषा चुनें
            </p>
            <p className="text-sm text-muted-foreground">
              Select your preferred language to continue
            </p>
          </div>

          {/* Language Cards - Updated selected states with new theme colors */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* English (Accent/Secondary) */}
            <button
              onClick={() => setSelectedLang('en')}
              className={`group relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedLang === 'en'
                  ? 'border-accent bg-gradient-to-br from-accent/10 to-secondary/10 shadow-lg'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`text-5xl transition-transform group-hover:scale-110 ${
                  selectedLang === 'en' ? 'scale-110' : ''
                }`}>
                  🇬🇧
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">English</h3>
                  <p className="text-sm text-muted-foreground">Continue in English</p>
                </div>
              </div>
              {selectedLang === 'en' && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </button>

            {/* Punjabi (Primary/Accent) */}
            <button
              onClick={() => setSelectedLang('pa')}
              className={`group relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedLang === 'pa'
                  ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`text-5xl transition-transform group-hover:scale-110 ${
                  selectedLang === 'pa' ? 'scale-110' : ''
                }`}>
                  🇮🇳
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">ਪੰਜਾਬੀ</h3>
                  <p className="text-sm text-muted-foreground">Punjabi</p>
                  <p className="text-xs text-muted-foreground mt-1">ਪੰਜਾਬੀ ਵਿੱਚ ਜਾਰੀ ਰੱਖੋ</p>
                </div>
              </div>
              {selectedLang === 'pa' && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </button>

            {/* Hindi (Secondary/Primary) */}
            <button
              onClick={() => setSelectedLang('hi')}
              className={`group relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedLang === 'hi'
                  ? 'border-secondary bg-gradient-to-br from-secondary/10 to-primary/10 shadow-lg'
                  : 'border-border hover:border-secondary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`text-5xl transition-transform group-hover:scale-110 ${
                  selectedLang === 'hi' ? 'scale-110' : ''
                }`}>
                  🇮🇳
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">हिंदी</h3>
                  <p className="text-sm text-muted-foreground">Hindi</p>
                  <p className="text-xs text-muted-foreground mt-1">हिंदी में जारी रखें</p>
                </div>
              </div>
              {selectedLang === 'hi' && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </button>
          </div>

          {/* Continue Button - Primary/Secondary/Accent gradient */}
          <Button
            onClick={handleContinue}
            disabled={!selectedLang}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedLang === 'pa' ? 'ਜਾਰੀ ਰੱਖੋ' : selectedLang === 'hi' ? 'जारी रखें' : 'Continue'}
          </Button>

          {/* Info Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {selectedLang === 'pa' 
              ? 'ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਭਾਸ਼ਾ ਬਦਲ ਸਕਦੇ ਹੋ'
              : selectedLang === 'hi'
              ? 'आप किसी भी समय सेटिंग्स में भाषा बदल सकते हैं'
              : 'You can change the language anytime in settings'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelection;